import { AggregatorTypes } from '@manahippo/hippo-sdk';
import { Segmented } from 'antd';
import Card from 'components/Card';
import PoolProvider from 'components/PoolProvider';
import { percent } from 'components/PositiveFloatNumInput/numberFormats';
import useHippoClient from 'hooks/useHippoClient';
import { FC, useCallback, useMemo, useState } from 'react';
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
import useDebounceValue from 'hooks/useDebounceValue';
import { useIsDarkMode } from 'components/Settings';
import { openHttpErrorNotification } from 'utils/notifications';

const Periods = ['1 Day', '7 Days', '30 Days'] as const;
type Period = typeof Periods[number];
interface ILpPrice {
  lpPrice: string;
  ts: string;
}

const CustomTooltip: FC<TooltipProps<ValueType, NameType>> = ({ active, payload }) => {
  const { hippoAgg } = useHippoClient();
  if (active && payload && payload.length) {
    return (
      <Card className="p-4 z-100 dark:bg-field">
        <p className="body-medium text-grey-500">{`${payload[0].payload.tsInTooltip}`}</p>
        {payload
          .sort((a, b) => (b.value as number) - (a.value as number))
          .map((p, index) => {
            const [dex, lp] = (p.name as string).split(':');
            const base = hippoAgg?.coinListClient.getCoinInfoBySymbol(lp.split('-')[0])[0]
              ?.token_type.type;
            const quote = hippoAgg?.coinListClient.getCoinInfoBySymbol(lp.split('-')[1])[0]
              ?.token_type.type;
            const dexType = AggregatorTypes.DexType[dex as keyof typeof AggregatorTypes.DexType];
            return (
              <p key={index} className="flex justify-between items-center py-2">
                <PoolProvider
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
          })}
      </Card>
    );
  }
  return null;
};

const daysOfPeriod = (p: Period) => {
  if (p === '1 Day') return 1;
  if (p === '7 Days') return 7;
  if (p === '30 Days') return 30;
};

const YieldChangeChart = ({ lps }: { lps: string[] }) => {
  const [chartPeriod, setChartPeriod] = useState<Period>('30 Days');
  const debouncedValue = useDebounceValue(lps, 300);
  // Using multiple requests to take advantage of the server caching
  const keys = useMemo(() => {
    if (debouncedValue.length === 0) return null;
    return debouncedValue.map((lp) => {
      return `https://api.hippo.space/v1/lptracking/price/change/of/lp?days=${daysOfPeriod(
        chartPeriod
      )}&lps=${lp}`;
    });
  }, [debouncedValue, chartPeriod]);
  const { data: data0, error } = useSWR<Record<string, ILpPrice[]>[]>(keys, multipleFetcher, {
    keepPreviousData: true,
    refreshInterval: 3600_000
  });
  if (error) {
    openHttpErrorNotification(error);
  }
  const data = data0?.reduce((pre, cur) => {
    const res = Object.assign(pre, cur);
    return res;
  }, {});

  const dataForChart = useMemo(() => {
    if (!data) return [];
    // respond immediately when keys deleted
    const dataKeys = Object.keys(data).filter((k) => lps.includes(k));
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
    const data2: Map<string, (number | null)[]> = new Map();
    for (const lp of lps2) {
      const prices = data[lp];
      data2.set(lp, [
        ...new Array(maxLength - prices.length).fill(null),
        ...prices.map((p) =>
          parseFloat(prices[0].lpPrice)
            ? (parseFloat(p.lpPrice) - parseFloat(prices[0].lpPrice)) /
              parseFloat(prices[0].lpPrice)
            : 0
        )
      ]);
    }

    return new Array(maxLength).fill('').map((_, index) => {
      const p = Array.from(data2.keys()).reduce((pre, cur) => {
        const prices = data2.get(cur);
        pre[cur] = prices && prices[index] ? prices[index] : null;
        return pre;
      }, {} as Record<string, number | null>);
      const date: Date = new Date(tses[index]);
      const monthDay = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date
        .getDate()
        .toString()
        .padStart(2, '0')}`;
      const p2 = Object.assign({}, p, {
        ts: monthDay,
        tsInTooltip: `${monthDay} ${date.getHours().toString().padStart(2, '0')}:${date
          .getMinutes()
          .toString()
          .padStart(2, '0')}`
      });
      return p2;
    });
  }, [data, lps]);

  const onSegmentedChange = useCallback((v: string | number) => {
    setChartPeriod(v as Period);
  }, []);

  const isDark = useIsDarkMode();

  return (
    <div className="">
      <div className="w-full flex justify-end py-8">
        <Segmented
          options={Periods as unknown as string[]}
          value={chartPeriod}
          size={'middle'}
          onChange={onSegmentedChange}
        />
      </div>
      <div className="w-full h-[360px]">
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
                .sort(
                  (a, b) =>
                    (dataForChart.slice(-1)[0][b] ?? 0) - (dataForChart.slice(-1)[0][a] ?? 0)
                )
                .map((lp, index) => {
                  return (
                    <Line
                      key={index}
                      strokeWidth={index === 0 ? 4 : 2}
                      type="monotone"
                      dataKey={lp}
                      stroke={index % 2 ? '#FE8D88' : '#8D78F7'}
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
