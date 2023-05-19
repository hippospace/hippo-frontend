import { AggregatorTypes } from '@manahippo/hippo-sdk';
import { Segmented, Spin } from 'antd';
import Card from 'components/Card';
import ProtocolProvider, { ProtocolId } from 'components/PoolProvider';
import { cutDecimals, percent } from 'components/PositiveFloatNumInput/numberFormats';
import useHippoClient from 'hooks/useHippoClient';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import useSWR from 'swr';
import { multipleFetcher } from 'utils/utility';
import TradingPair from 'components/TradingPair';
import { useIsDarkMode } from 'components/Settings';
import { openHttpErrorNotification } from 'utils/notifications';
import CoinIcon from 'components/Coins/CoinIcon';
import CoinLabel from 'components/Coins/CoinLabel';
import classNames from 'classnames';
import { CTOKEN_PREFIX, useYieldStore } from '..';
import { daysOfPeriod } from 'utils/hippo';
import { PriceChangePeriod } from 'types/hippo';

interface IPrice {
  price: string;
  ts: string;
}

const CustomTooltip: FC<TooltipProps<ValueType, NameType>> = ({ active, payload }) => {
  const { coinListClient } = useHippoClient();
  if (active && payload && payload.length) {
    return (
      <Card className="p-4 z-100 dark:bg-field">
        <p className="body-medium text-grey-500">{`${payload[0].payload.tsInTooltip}`}</p>
        {payload
          .sort((a, b) => (b.value as number) - (a.value as number))
          .map((p, index) => {
            if ((p.name as string).startsWith(CTOKEN_PREFIX)) {
              const coin = coinListClient?.getCoinInfoBySymbol((p.name as string).split(':')[2])[0];
              return (
                <p key={index} className="flex justify-between items-center py-2">
                  <ProtocolProvider
                    className={'mr-1'}
                    protocolId={(p.name as string).split(':')[1] as ProtocolId}
                    isNameInvisible={true}
                    isTitleEnabled={true}
                    isClickable={false}
                  />
                  <CoinIcon className="mr-1" token={coin} />
                  {coin && <CoinLabel className="mr-2" coin={coin} />}
                  {/*
                  <span className="mr-2 rounded-lg text-prime-400 label-small-bold">Lending</span>
                  */}
                  <span style={{ color: p.color }} className="ml-auto">
                    {percent(p.value as unknown as number, 2, true)}
                  </span>
                </p>
              );
            } else if ((p.name as string).includes(':')) {
              const [dex, lp] = (p.name as string).split(':');
              const base = coinListClient?.getCoinInfoBySymbol(lp.split('-')[0])[0]?.token_type
                .type;
              const quote = coinListClient?.getCoinInfoBySymbol(lp.split('-')[1])[0]?.token_type
                .type;
              const dexType = AggregatorTypes.DexType[dex as keyof typeof AggregatorTypes.DexType];
              return (
                <p key={index} className="flex justify-between items-center py-2">
                  <ProtocolProvider
                    className={'mr-1'}
                    dexType={dexType}
                    isNameInvisible={true}
                    isTitleEnabled={false}
                  />
                  {base && quote && (
                    <div className="mr-2">
                      <TradingPair base={base} quote={quote} isIconsInvisible={true} isLp={true} />
                    </div>
                  )}
                  <span style={{ color: p.color }} className="ml-auto">
                    {percent(p.value as unknown as number, 2, true)}
                  </span>
                </p>
              );
            } else {
              const coin = coinListClient?.getCoinInfoBySymbol(p.name as string)[0];
              return (
                <p key={index} className="flex justify-between items-center py-2">
                  <CoinIcon className="mr-1" token={coin} />
                  {coin && <CoinLabel className="mr-2" coin={coin} />}
                  <span className="mr-2">
                    ${cutDecimals(p.payload.prices[p.name as string], 2)}
                  </span>
                  <span style={{ color: p.color }} className="ml-auto">
                    {percent(p.value as unknown as number, 2, true)}
                  </span>
                </p>
              );
            }
          })}
      </Card>
    );
  }
  return null;
};

const LINE_COLORS = ['#8D78F7', '#FF8479', '#FFCB60', '#0086FB', '#7DD70B', '#21D4A5'];

const YieldChangeChart = ({
  coins,
  dotInterval = 2
}: {
  coins: string[];
  dotInterval?: 2 | 4 | 6;
}) => {
  const [chartPeriod, setChartPeriod] = useState<PriceChangePeriod>(PriceChangePeriod['30D']);

  const keyCoins = useMemo(() => {
    if (coins.length === 0) return null;
    return coins.map(
      (c) =>
        `https://api.hippo.space/v1/lptracking/${
          c.startsWith(CTOKEN_PREFIX) ? 'cToken' : c.includes(':') ? 'lp' : 'coin'
        }/${encodeURIComponent(c.replace('ctoken:', 'cToken:'))}/price/change/of/${daysOfPeriod(
          chartPeriod
        )}`
    );
  }, [chartPeriod, coins]);

  const {
    data: dataCoins0,
    error: errorCoins,
    isLoading
  } = useSWR<IPrice[][]>(keyCoins, multipleFetcher, {
    keepPreviousData: true,
    refreshInterval: 3600_000
  });
  useEffect(() => {
    if (errorCoins) {
      openHttpErrorNotification(errorCoins);
    }
  }, [errorCoins]);
  const data = dataCoins0?.reduce((pre, cur, index) => {
    pre[coins[index]] = cur.filter(
      // a dot is displayed every 6 hoours for 30D
      (v, i) => chartPeriod !== PriceChangePeriod['30D'] || i % (dotInterval / 2) === 0
    );
    return pre;
  }, {} as Record<string, IPrice[]>);

  const dataForChart = useMemo(() => {
    if (!data) return [];
    // respond immediately when keys deleted
    const dataKeys = Object.keys(data).filter((k) => [...coins].includes(k));
    Object.keys(data).forEach((k) => {
      if (!dataKeys.includes(k)) {
        delete data[k];
      }
    });
    const maxLength = Math.max(...Object.values(data).map((d) => d.length), 0);
    const tses = (() => {
      for (const value of Object.values(data)) {
        if (value.length === maxLength) {
          return value.map((v) => v.ts);
        }
      }
      return [];
    })();
    const lps2 = Object.keys(data);
    const data2: Map<string, ({ percent: number; price: string } | null)[]> = new Map();
    for (const lp of lps2) {
      const prices = data[lp];
      data2.set(lp, [
        ...new Array(maxLength - prices.length).fill(null),
        ...prices.map((p) => ({
          percent: parseFloat(prices[0].price)
            ? (parseFloat(p.price) - parseFloat(prices[0].price)) / parseFloat(prices[0].price)
            : 0,
          price: p.price
        }))
      ]);
    }

    return new Array(maxLength).fill('').map((_, index) => {
      const p = Array.from(data2.keys()).reduce((pre, cur) => {
        const prices = data2.get(cur);
        pre[cur] = (prices && prices[index]?.percent) ?? 0;
        return pre;
      }, {} as Record<string, number | null>);
      const date: Date = new Date(tses[index]);
      const monthDay = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date
        .getDate()
        .toString()
        .padStart(2, '0')}`;
      const p2 = Object.assign({}, p, {
        geniueTs: tses[index],
        ts: monthDay,
        tsInTooltip: `${monthDay} ${date.getHours().toString().padStart(2, '0')}:${date
          .getMinutes()
          .toString()
          .padStart(2, '0')}`,
        prices: Array.from(data2.keys()).reduce((pre, cur) => {
          const prices = data2.get(cur);
          pre[cur] = (prices && prices[index]?.price) ?? '';
          return pre;
        }, {} as Record<string, string>)
      });
      return p2;
    });
  }, [coins, data]);

  const onSegmentedChange = useCallback(
    (v: string | number) => {
      setChartPeriod(v as PriceChangePeriod);
    },
    [setChartPeriod]
  );

  const isDark = useIsDarkMode();

  const hoveringToken = useYieldStore((state) => state.hoveringToken);

  return (
    <div className="">
      <div className="w-full flex justify-end py-8">
        <Segmented
          className="!bg-field"
          options={[PriceChangePeriod['1D'], PriceChangePeriod['7D'], PriceChangePeriod['30D']]}
          value={chartPeriod}
          size={'middle'}
          onChange={onSegmentedChange}
        />
      </div>
      <div className="w-full h-[360px] relative">
        <div
          className={classNames(
            'absolute w-full h-full top-0 left-0 flex items-center justify-center bg-grey-100/50 z-20 pointer-events-none',
            { invisible: !isLoading }
          )}>
          <Spin size="large" />
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dataForChart}
            margin={{
              top: 0,
              right: 0,
              left: 0,
              bottom: 0
            }}>
            <Tooltip
              cursor={{
                stroke: isDark ? '#F8F8F8' : '#2D2D2D',
                strokeDasharray: '2 10',
                strokeWidth: 2,
                strokeLinecap: 'round'
              }}
              content={<CustomTooltip />}
            />
            <XAxis
              dataKey="ts"
              axisLine={false}
              tickLine={false}
              stroke={'#959595'}
              minTickGap={40}
              tickMargin={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              stroke={'#959595'}
              tickFormatter={(v: number) => (v * 100).toFixed(0) + '%'}
            />
            {data &&
              Object.keys(data)
                .sort((a, b) =>
                  dataForChart.length > 0
                    ? (dataForChart.slice(-1)[0][b] ?? 0) - (dataForChart.slice(-1)[0][a] ?? 0)
                    : 0
                )
                .map((lp, index) => {
                  const isHover = lp === hoveringToken;
                  return (
                    <Line
                      key={index}
                      strokeWidth={isHover ? 3.5 : 2}
                      type="monotone"
                      dataKey={lp}
                      stroke={`${LINE_COLORS[index]}${isHover ? '88' : 'FF'}`}
                      dot={false}
                      activeDot={{ r: 8, strokeWidth: 0 }}
                    />
                  );
                })}
            <CartesianGrid
              strokeDasharray="2 10"
              vertical={false}
              stroke="#959595"
              strokeLinecap="round"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
export default YieldChangeChart;
