import { RawCoinInfo } from '@manahippo/coin-list';
import TradingPair from 'components/TradingPair';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { numberOfAbbr, percent } from 'components/PositiveFloatNumInput/numberFormats';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ITokenNativePrice, useTokenPriceHistory } from 'hooks/useTokenPriceHistory';
import { Segmented, Skeleton, Spin } from 'antd';
import classNames from 'classnames';
import create from 'zustand';
import { devtools } from 'zustand/middleware';
import usePrevious from 'hooks/usePrevious';
import styles from './PriceChart.module.scss';
import { useIsDarkMode } from 'components/Settings';
import useTokenAmountFormatter from 'hooks/useTokenAmountFormatter';
import { dateFormat } from 'utils/utility';

const Periods = ['1D', '1W', '1M', '1Y'] as const;
type Period = typeof Periods[number];

interface IChartState {
  currentData: ITokenNativePrice | undefined;
  setCurrentData: (p: ITokenNativePrice | undefined) => void;
}

const useChartStore = create<IChartState>()(
  devtools((set) => ({
    currentData: undefined,
    setCurrentData: (p) => set((state) => ({ ...state, currentData: p }))
  }))
);

const CustomActiveDot = (props: any) => {
  const setCurrentData = useChartStore((state) => state.setCurrentData);
  const { cx, cy, payload } = props;
  // console.log(`active dot: ${value}`, payload);
  const previousPayload = usePrevious(payload);
  useEffect(() => {
    if (payload && previousPayload?.time_stamp != payload.time_stamp) {
      setCurrentData(payload);
    }
  }, [payload, previousPayload, setCurrentData]);
  const isDark = useIsDarkMode();

  return (
    <svg
      x={cx - 4.5}
      y={cy - 4.5}
      width="9"
      height="9"
      viewBox="0 0 9 9"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <circle cx="4.5" cy="4.5" r="4" fill={!isDark ? '#634CD9' : '#B7A6FF'} stroke="white" />
    </svg>
  );
};

/*
const CustomCursor = (props) => {
  const { cx, cy } = props;
  return (
    <svg
      x={cx}
      y={cy}
      width="1"
      height="200"
      viewBox="0 0 1 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <rect width="1" height="200" rx="0.5" fill="#F1EFFE" />
    </svg>
  );
};
*/

const daysOfPeriod = (p: Period) => {
  if (p === '1D') return 1;
  if (p === '1W') return 7;
  if (p === '1M') return 30;
  if (p === '1Y') return 365;
  return 1;
};

const PriceChart = ({
  baseToken,
  quoteToken
}: {
  baseToken: RawCoinInfo;
  quoteToken: RawCoinInfo;
}) => {
  if (quoteToken.official_symbol.indexOf('USD') >= 0) {
    [baseToken, quoteToken] = [quoteToken, baseToken];
  }
  const [chartPeriod, setChartPeriod] = useState<Period>('1D');

  const days = daysOfPeriod(chartPeriod);
  let { data, hasNoData } = useTokenPriceHistory(baseToken, quoteToken, days);
  data = data?.map((p) => {
    const date = new Date(p.time_stamp);
    return {
      ...p,
      xName:
        days > 1
          ? `${date.toLocaleString('en-US', { month: 'short' })} ${date.toLocaleString('en-US', {
              day: 'numeric'
            })}`
          : `${date.getHours().toString().padStart(2, '0')}:${date
              .getMinutes()
              .toString()
              .padStart(2, '0')}`
    };
  });

  const startData = data && data[0];
  const lastData = data && data.slice(-1)[0];

  const onSegmentedChange = useCallback((v: string | number) => {
    setChartPeriod(v as Period);
  }, []);

  // const [currentData, setCurrentData] = useState<ITokenNativePrice>(lastData);
  const currentData = useChartStore((state) => state.currentData);
  const setCurrentData = useChartStore((state) => state.setCurrentData);

  const displayingData = currentData || lastData;

  const priceChangePercent = useMemo(() => {
    if (displayingData && startData) {
      return percent((displayingData.price - startData.price) / startData.price, 2, true);
    }
    return undefined;
  }, [displayingData, startData]);

  const onMouseLeaveChart = useCallback(() => {
    setCurrentData(undefined);
  }, [setCurrentData]);

  const isDark = useIsDarkMode();
  const [tokenAmountFormatter] = useTokenAmountFormatter();

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex">
        <TradingPair
          base={quoteToken.token_type.type}
          quote={baseToken.token_type.type}
          isShowBridge={false}
          seperator={<span className="mx-1">/</span>}
        />
        <div className="ml-auto">
          <Segmented
            className={classNames(styles.segmented)}
            options={Periods as unknown as string[]}
            value={chartPeriod}
            size={'small'}
            onChange={onSegmentedChange}
          />
        </div>
      </div>
      <div className="flex-grow flex flex-col">
        {hasNoData && (
          <div className="body-bold text-grey-300 text-center relative top-[50%] translate-y-[-50%]">
            No price data
          </div>
        )}
        {!hasNoData && (
          <>
            {displayingData && priceChangePercent ? (
              <div className="mb-4">
                <div className="h4">{tokenAmountFormatter(displayingData.price, baseToken)}</div>
                <div className="text-prime-700 dark:text-prime-400">
                  <span className="label-small-bold inline-block">
                    {dateFormat(new Date(displayingData.time_stamp))}
                  </span>
                  <span className="label-small-bold py-1 px-2 inline-block bg-label rounded ml-[6px] min-w-[56px] text-center">
                    {priceChangePercent}
                  </span>
                </div>
              </div>
            ) : (
              <Skeleton title={false} paragraph={true} active />
            )}
            <div className="w-full h-[227px] mt-auto" onMouseLeave={onMouseLeaveChart}>
              {!!data && data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    className={styles.priceChart}
                    data={data}
                    margin={{
                      top: 0,
                      right: 0,
                      left: -50,
                      bottom: 0
                    }}>
                    <defs>
                      <linearGradient id="colorLight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#634CD9" stopOpacity={1} />
                        <stop offset="100%" stopColor="#634CD9" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDark" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#B7A6FF" stopOpacity={1} />
                        <stop offset="100%" stopColor="#B7A6FF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      axisLine={false}
                      tickLine={false}
                      minTickGap={25}
                      tickMargin={10}
                      interval={'preserveStartEnd'}
                      dataKey={'xName'}
                    />
                    <YAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      // tickCount={8}
                      minTickGap={20}
                      interval={'preserveEnd'}
                      tickMargin={-50}
                      width={50}
                      domain={([dataMin, dataMax]) => {
                        const distance = (dataMax - dataMin) / 2;
                        const ret = [dataMin - distance, dataMax + distance];
                        return ret as [number, number];
                      }}
                      tickFormatter={(v) => {
                        return typeof v === 'number'
                          ? v >= 0.1
                            ? numberOfAbbr(v, 1)
                            : v.toExponential(1)
                          : v;
                      }}
                    />
                    <Tooltip
                      cursor={{ stroke: '#F1EFFE', strokeWidth: 1, rx: 0.5, opacity: 1 }}
                      // cursor={{ stroke: '#FFFFFF', strokeWidth: 1, rx: 0.5, opacity: 1 }}
                      content={<></>}
                      useTranslate3d={true}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={!isDark ? '#634CD9' : '#B7A6FF'}
                      strokeWidth={2}
                      fillOpacity={0.3}
                      fill={`url(#color${!isDark ? 'Light' : 'Dark'})`}
                      activeDot={<CustomActiveDot />}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Spin />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PriceChart;
