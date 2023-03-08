import { AggregatorTypes } from '@manahippo/hippo-sdk';
import classNames from 'classnames';
import Card from 'components/Card';
import CoinIcon from 'components/Coins/CoinIcon';
import CoinLabel from 'components/Coins/CoinLabel';
import IconMultipleSelector from 'components/IconMultipleSelector';
import PoolProvider, { PoolIcon } from 'components/PoolProvider';
import { percent } from 'components/PositiveFloatNumInput/numberFormats';
import TradingPair from 'components/TradingPair';
import { useBreakpoint } from 'hooks/useBreakpoint';
import useDebounceValue from 'hooks/useDebounceValue';
import useHippoClient from 'hooks/useHippoClient';
import TopList from 'components/TopList';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CaretIcon } from 'resources/icons';
import useSWR from 'swr';
import { ILpPriceChange, LpPriceChangePeriod } from 'types/hippo';
import { fetcher } from 'utils/utility';
// import CheckboxInput from 'components/CheckboxInput';
import YieldChangeChart from './YieldChangeChart';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { openHttpErrorNotification } from 'utils/notifications';

interface IYieldState {
  selectedLps: Array<string>;
  setSelectedLps: (v: Array<string>) => void;

  dexSelected: string[];
  setDexSelected: (v: string[]) => void;

  leftSelected: string[];
  setLeftSelected: (v: string[]) => void;

  rightSelected: string[];
  setRightSelected: (v: string[]) => void;
}

export const useYieldStore = create<IYieldState>()(
  devtools(
    persist(
      (set) => ({
        selectedLps: [],
        setSelectedLps: (v) => set((state) => ({ ...state, selectedLps: v })),

        dexSelected: ['Obric', 'Pontem', 'Pancake', 'Aux', 'AnimeSwap', 'Cetus', 'Aptoswap'].sort(),
        setDexSelected: (v) => set((state) => ({ ...state, dexSelected: v })),

        leftSelected: ['APT'],
        setLeftSelected: (v) => set((state) => ({ ...state, leftSelected: v })),

        rightSelected: ['zUSDC', 'USDC', 'ceUSDC'],
        setRightSelected: (v) => set((state) => ({ ...state, rightSelected: v }))
      }),
      { name: 'hippo-yield-store' }
    )
  )
);

const LpPriceChangesFilter = () => {
  const dexFilterOptions = [
    AggregatorTypes.DexType.Pancake,
    AggregatorTypes.DexType.Obric,
    AggregatorTypes.DexType.Cetus,
    AggregatorTypes.DexType.Pontem,
    AggregatorTypes.DexType.Aux,
    AggregatorTypes.DexType.AnimeSwap,
    AggregatorTypes.DexType.Aptoswap
  ]
    .map((d) => ({
      key: AggregatorTypes.DEX_TYPE_NAME[d],
      name: AggregatorTypes.DEX_TYPE_NAME[d],
      icon: <PoolIcon className="!w-full !h-full" isTitleEnabled={true} dexType={d} />
    }))
    .sort((a, b) => (a.name < b.name ? -1 : 1));

  const { hippoAgg } = useHippoClient();
  const coinOptions = hippoAgg?.coinListClient
    .getCoinInfoList()
    .sort((a, b) =>
      b.official_symbol > a.official_symbol
        ? -1
        : b.official_symbol < a.official_symbol
        ? 1
        : b.symbol > a.symbol
        ? -1
        : 1
    )
    .map((c) => ({
      key: c.symbol,
      icon: <CoinIcon token={c} isShowSymbol={true} />,
      name: <CoinLabel coin={c} isShowBridge={true} isShowNonOfficalSymbol={false} />
    }));

  const setDexesSelected = useYieldStore((state) => state.setDexSelected);
  const setLpLeftSelected = useYieldStore((state) => state.setLeftSelected);
  const setLpRightSelected = useYieldStore((state) => state.setRightSelected);
  const dexesSelected = useYieldStore((state) => state.dexSelected);
  const leftSelected = useYieldStore((state) => state.leftSelected);
  const rightSelected = useYieldStore((state) => state.rightSelected);

  return coinOptions ? (
    <div className="w-full flex tablet:flex-col tablet:gap-y-4 items-center gap-x-4">
      <IconMultipleSelector
        className="w-full flex-1"
        title="Dex"
        options={dexFilterOptions}
        defaultSelected={dexesSelected}
        onSelectedUpdate={(dexes) => setDexesSelected(dexes)}
      />
      <IconMultipleSelector
        className="w-full flex-1"
        title="LP Left"
        options={coinOptions}
        isAllOptionEnabled={true}
        defaultSelected={leftSelected}
        onSelectedUpdate={(s) => setLpLeftSelected(s)}
      />
      <IconMultipleSelector
        className="w-full flex-1"
        title="LP Right"
        options={coinOptions}
        isAllOptionEnabled={true}
        defaultSelected={rightSelected}
        onSelectedUpdate={(s) => setLpRightSelected(s)}
      />
    </div>
  ) : (
    <></>
  );
};

const ChangeLabel = ({
  v,
  className = ''
}: {
  v: number | string | undefined;
  className?: string;
}) => {
  const isPositive = useMemo(() => {
    return !!v && parseFloat(`${v}`) > 0;
  }, [v]);
  const isNegative = useMemo(() => {
    return !!v && parseFloat(`${v}`) < 0;
  }, [v]);
  return (
    <span
      className={classNames(
        className,
        'body-bold text-grey-700 flex items-center gap-x-2',
        { 'text-up': isPositive },
        { 'text-down': isNegative }
      )}>
      {percent(v ?? '-', 2, true)}
    </span>
  );
};

const uniqueLpStr = (d: ILpPriceChange) => [d.dex, d.lp, d.poolType].join(':');
const MAX_LP_SELECTED_COUNT = 8;
const TopLpPriceChanges = () => {
  const { hippoAgg } = useHippoClient();
  const { isTablet } = useBreakpoint('tablet');
  const { isMobile } = useBreakpoint('mobile');
  const [peroidSelected, setPeriodSelected] = useState(LpPriceChangePeriod['30D']);
  const dexes = useYieldStore((state) => state.dexSelected);
  const lpLefts = useYieldStore((state) => state.leftSelected);
  const lpRights = useYieldStore((state) => state.rightSelected);

  const selectedLps = useYieldStore((state) => state.selectedLps);
  const setSelectedLps = useYieldStore((state) => state.setSelectedLps);

  // const [selectedLps, setSelectedLps] = useState(new Set<string>(['Pancake:APT-zUSDC:0']));

  const onCheck = useCallback(
    (d: ILpPriceChange, isChecked: boolean) => {
      if (isChecked && selectedLps.length < MAX_LP_SELECTED_COUNT) {
        selectedLps.push(uniqueLpStr(d));
        const selectedLpsSet = new Set(selectedLps);
        setSelectedLps(Array.from(selectedLpsSet));
      } else if (!isChecked) {
        const selectedLpsSet = new Set(selectedLps);
        selectedLpsSet.delete(uniqueLpStr(d));
        setSelectedLps(Array.from(selectedLpsSet));
      }
    },
    [selectedLps, setSelectedLps]
  );

  const debouncedValue = useDebounceValue(
    [dexes.join(','), lpLefts.join(','), lpRights.join(',')],
    1000
  );
  const key = debouncedValue.every((v: string) => !!v)
    ? `https://api.hippo.space/v1/lptracking/lp/filtered/price/changes?dexes=${encodeURIComponent(
        debouncedValue[0]
      )}&lpLefts=${encodeURIComponent(debouncedValue[1])}&lpRights=${encodeURIComponent(
        debouncedValue[2]
      )}`
    : null;
  const { data, error } = useSWR<ILpPriceChange[]>(key, fetcher, {
    keepPreviousData: false,
    refreshInterval: 3600_000
  });
  if (error) {
    openHttpErrorNotification(error);
  }
  const data2 = useMemo(
    () =>
      !key
        ? []
        : data
            ?.sort(
              (a, b) =>
                parseFloat(b.priceChanges[peroidSelected] ?? '-Infinity') -
                parseFloat(a.priceChanges[peroidSelected] ?? '-Infinity')
            )
            ?.map((d, i) => {
              const base = hippoAgg?.coinListClient.getCoinInfoBySymbol(d.lp.split('-')[0])[0]
                ?.token_type.type;
              const quote = hippoAgg?.coinListClient.getCoinInfoBySymbol(d.lp.split('-')[1])[0]
                ?.token_type.type;
              const dexType =
                AggregatorTypes.DexType[d.dex as keyof typeof AggregatorTypes.DexType];
              return [
                <div key={i} className="flex items-center gap-x-7 tablet:gap-x-3">
                  {/*
                  <CheckboxInput
                    checked={selectedLps.has(uniqueLpStr(d))}
                    onChange={(e) => onCheck(d, e.target.checked)}></CheckboxInput>
                  */}
                  <PoolProvider
                    className={'h-[65px]'}
                    dexType={dexType}
                    isNameInvisible={isMobile}
                    isTitleEnabled={isMobile}
                    isClickable={false}
                  />
                </div>,
                <>
                  {base && quote && (
                    <TradingPair
                      key={i}
                      base={base}
                      quote={quote}
                      isLp={true}
                      isIconsInvisible={isMobile}
                    />
                  )}
                </>,
                ...(!isTablet
                  ? [<ChangeLabel key={i} v={d.priceChanges[LpPriceChangePeriod['1D']]} />]
                  : []),
                <ChangeLabel key={i} v={d.priceChanges[LpPriceChangePeriod['7D']]} />,
                <ChangeLabel key={i} v={d.priceChanges[LpPriceChangePeriod['30D']]} />
              ];
            }),
    [data, hippoAgg?.coinListClient, isMobile, isTablet, key, peroidSelected]
  );
  useEffect(() => {
    if (data && selectedLps.length === 0) {
      setSelectedLps(data.slice(0, 5).map((d) => uniqueLpStr(d)));
    }
  }, [data, selectedLps.length, setSelectedLps]);
  useEffect(() => {
    if (data) {
      const allLps = data.map((d) => uniqueLpStr(d));
      const intersect = Array.from(selectedLps).filter((lp) => allLps.includes(lp));
      if (intersect.length < selectedLps.length) {
        setSelectedLps(intersect);
      }
      if (!key && selectedLps.length > 0) {
        setSelectedLps([]);
      }
    }
  }, [data, key, selectedLps, setSelectedLps]);

  const cols = useMemo(
    () =>
      [
        '# Dex',
        'LP Name',
        ...[
          ...(!isTablet ? [[LpPriceChangePeriod['1D'], '1D Change(%)', true]] : []),
          [LpPriceChangePeriod['7D'], isMobile ? '7D(%)' : '7D Change(%)', true],
          [LpPriceChangePeriod['30D'], isMobile ? '30D(%)' : '30D Value Change(%)', true]
        ].map((a, i) => (
          <span
            className={classNames('cursor-pointer', {
              'pointer-events-none': !a[2]
            })}
            key={i}
            onClick={() => setPeriodSelected(a[0] as LpPriceChangePeriod)}>
            {a[1]}{' '}
            <CaretIcon
              className={classNames('font-icon', { 'text-prime-500': peroidSelected === a[0] })}
            />
          </span>
        ))
      ].filter((c) => !!c),
    [isMobile, isTablet, peroidSelected]
  );
  const flexs = !isTablet ? [3, 3, 2, 2, 3] : !isMobile ? [2, 3, 2, 3] : [1.5, 3, 1.5, 2];

  const onClickRow = useCallback(
    (r: number) => {
      if (data) {
        const d = data[r];
        onCheck(d, !selectedLps.includes(uniqueLpStr(d)));
      }
    },
    [data, onCheck, selectedLps]
  );

  const selectedRows = useMemo(() => {
    return Array.from(selectedLps).map((lp) =>
      data?.map((d) => uniqueLpStr(d)).findIndex((s) => s === lp)
    );
  }, [data, selectedLps]);

  return (
    <TopList
      className="min-h-[538px]"
      title=""
      cols={cols}
      flexs={flexs}
      datas={data2}
      RowComp={'div'}
      rowClassName={(i) =>
        classNames(`cursor-pointer hover:bg-prime-400/10 rounded-lg mobile:px-2`, {
          'bg-prime-400/20': selectedRows.includes(i)
        })
      }
      onClickRow={onClickRow}
      maxColumns={6}
    />
  );
};

const YieldPage = () => {
  const selectedLps = useYieldStore((state) => state.selectedLps);
  return (
    <div className="max-w-[1321px] mx-auto mt-[106px] tablet:mt-[64px] mobile:mt-[32px]">
      <div>
        <div className="h4 mb-10 text-grey-900">Top LP Rates</div>
        <Card className="px-8 tablet:px-2 mobile:px-1">
          <div className="pt-10">
            <LpPriceChangesFilter />
          </div>
          <div>
            <YieldChangeChart lps={selectedLps} />
          </div>
          <div>
            <TopLpPriceChanges />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default YieldPage;
