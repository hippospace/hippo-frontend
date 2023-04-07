import { AggregatorTypes } from '@manahippo/hippo-sdk';
import classNames from 'classnames';
import Card from 'components/Card';
import CoinIcon from 'components/Coins/CoinIcon';
import CoinLabel from 'components/Coins/CoinLabel';
import IconMultipleSelector, { IYieldTokenSelectorOption } from 'pages/Yield/IconMultipleSelector';
import ProtocolProvider, { ProtocolId } from 'components/PoolProvider';
import { percent } from 'components/PositiveFloatNumInput/numberFormats';
import TradingPair from 'components/TradingPair';
import { useBreakpoint } from 'hooks/useBreakpoint';
import useHippoClient from 'hooks/useHippoClient';
import TopList from 'components/TopList';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CaretIcon } from 'resources/icons';
import useSWR from 'swr';
import { ICoinPriceChange, ILpPriceChange, PriceChangePeriod } from 'types/hippo';
import { fetcher, multipleFetcher } from 'utils/utility';
// import CheckboxInput from 'components/CheckboxInput';
import YieldChangeChart from './YieldChangeChart';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import openNotification, { openHttpErrorNotification } from 'utils/notifications';
import { RawCoinInfo } from '@manahippo/coin-list';
import { coinBridge, coinPriority } from 'utils/hippo';
import Selectable from 'components/Selectable';

export const CTOKEN_FILTER_PREFIX = 'cTokenFilter:';
export const CTOKEN_PREFIX = 'cToken:';
export const searchTabs = ['All', 'Single Coin', 'LP', 'Lending', 'Farm'] as const;
export type YieldTokenType = Exclude<typeof searchTabs[number], 'All'>;

interface IDistinctTokens {
  coins: string[];
  lps: string[];
  cTokens: string[];
}

interface IYieldState {
  selectedTokens: Array<string>;
  setSelectedTokens: (v: Array<string>) => void;

  selectedCTokens: Array<string>;
  setSelectedCTokens: (v: Array<string>) => void;

  tokensFilter: string[];
  setTokensFilter: (v: string[]) => void;

  cTokensFilter: string[];
  setCTokensFilter: (v: string[]) => void;

  hoveringToken: string | undefined;
  setHoveringToken: (v: string | undefined) => void;
}

const STABLE_CTOKENS = ['USDC', 'zUSDC', 'ceUSDC', 'USDT', 'zUSDT', 'ceUSDT', 'BUSD', 'DAI'].map(
  (c) => `${CTOKEN_FILTER_PREFIX}${c}`
);

export const useYieldStore = create<IYieldState>()(
  devtools(
    persist(
      (set) => ({
        selectedTokens: [],
        setSelectedTokens: (v) => set((state) => ({ ...state, selectedTokens: v })),

        selectedCTokens: [],
        setSelectedCTokens: (v) => set((state) => ({ ...state, selectedCTokens: v })),

        tokensFilter: ['APT', '*:APT-USDC:*'],
        setTokensFilter: (v) => set((state) => ({ ...state, tokensFilter: v })),

        cTokensFilter: STABLE_CTOKENS,
        setCTokensFilter: (v) => set((state) => ({ ...state, cTokensFilter: v })),

        hoveringToken: undefined,
        setHoveringToken: (v) => set((state) => ({ ...state, hoveringToken: v }))
      }),
      { name: 'hippo-yield-store-03312204' }
    )
  )
);

const tokenSortKey = (t: RawCoinInfo | undefined) =>
  t ? `${t.official_symbol}${coinBridge(t)}${t.symbol}` : '';

const PreSetButton = ({ label, generalTokens }: { generalTokens: string[]; label: string }) => {
  const tokensFilter = useYieldStore((s) => s.tokensFilter);
  const cTokensFilter = useYieldStore((s) => s.cTokensFilter);
  const setTokensFilter = useYieldStore((s) => s.setTokensFilter);
  const setCTokensFilter = useYieldStore((s) => s.setCTokensFilter);

  const isSelected = useMemo(() => {
    return generalTokens.every((t) => tokensFilter.includes(t) || cTokensFilter.includes(t));
  }, [cTokensFilter, generalTokens, tokensFilter]);

  const onClick = useCallback(() => {
    const tokens: string[] = [];
    const cTokens: string[] = [];
    generalTokens.forEach((t) => {
      if (t.startsWith(CTOKEN_FILTER_PREFIX)) {
        cTokens.push(t);
      } else {
        tokens.push(t);
      }
    });
    if (isSelected) {
      setTokensFilter(tokensFilter.filter((t) => !tokens.includes(t)));
      setCTokensFilter(cTokensFilter.filter((t) => !cTokens.includes(t)));
    } else {
      // add
      /*
      setTokensFilter(Array.from(new Set([...tokensFilter, ...tokens])));
      setCTokensFilter(Array.from(new Set([...cTokensFilter, ...cTokens])));
      */
      // replace
      if (tokens.length) setTokensFilter(tokens);
      if (cTokens.length) setCTokensFilter(cTokens);
    }
  }, [cTokensFilter, generalTokens, isSelected, setCTokensFilter, setTokensFilter, tokensFilter]);

  return (
    <Selectable className="!h-8" isSelected={isSelected} onClick={onClick}>
      <span className="label-large-bold px-2">{label}</span>
    </Selectable>
  );
};

const TokenSelector = ({
  className,
  yieldTypes,
  selected,
  onSelected
}: {
  className?: string;
  yieldTypes: YieldTokenType[];
  selected: string[];
  onSelected: (v: string[]) => void;
}) => {
  const { data, error } = useSWR<IDistinctTokens>(
    'https://api.hippo.space/v1/lptracking/distinct/tokens',
    fetcher,
    {
      refreshInterval: 3600_000 * 6
    }
  );
  useEffect(() => {
    if (error) {
      openHttpErrorNotification(error);
    }
  }, [error]);

  const { coinListClient } = useHippoClient();
  const coins =
    (data?.coins
      .map((c) => coinListClient?.getCoinInfoBySymbol(c)[0])
      .filter((c) => c && !c?.symbol.startsWith('dev') && !!c?.coingecko_id) as RawCoinInfo[]) ??
    [];

  const coinOptions: IYieldTokenSelectorOption[] = coins.map((c) => {
    return {
      type: 'Single Coin',
      key: c.symbol,
      sortKey: tokenSortKey(c),
      icon: (
        <div className="flex items-center w-full gap-x-2">
          <CoinIcon token={c} isShowSymbol={false} />
          <CoinLabel coin={c} isShowBridge={true} isShowNonOfficalSymbol={true} />
        </div>
      ),
      name: false,
      abbr: (
        <div className="h-10 flex items-center gap-x-1 bg-prime-400/20 p-1 rounded-full px-2">
          <CoinIcon token={c} />
          <CoinLabel coin={c} />
        </div>
      )
    };
  });

  const cTokens =
    (data?.cTokens
      .map((c) => coinListClient?.getCoinInfoBySymbol(c)[0])
      .filter((c) => !!c) as RawCoinInfo[]) ?? [];
  const cTokenOptions = cTokens.map((c) => {
    return {
      type: 'Lending' as const,
      key: CTOKEN_FILTER_PREFIX + c.symbol,
      sortKey: tokenSortKey(c) + 'cTokenFilter',
      icon: (
        <div className="flex items-center w-full gap-x-2">
          <CoinIcon token={c} isShowSymbol={false} />
          <CoinLabel coin={c} isShowBridge={true} isShowNonOfficalSymbol={true} />
          {/*
          <div className="px-1 rounded-lg border-prime-500 text-prime-500 border">Lending</div>
          */}
        </div>
      ),
      name: false,
      abbr: (
        <div className="h-10 flex items-center gap-x-1 bg-prime-400/20 p-1 rounded-full px-2">
          <CoinIcon token={c} />
          <CoinLabel coin={c} />
          {/*
          <div className="px-1 rounded-lg border-prime-500 text-prime-500 label-small-bold">
            Lending
          </div>
          */}
        </div>
      )
    };
  });

  const lpPatterns = useMemo(() => {
    return (
      data?.lps
        .map((l) => {
          const [, lp] = l.split(':');
          let [left, right] = lp.split('-');
          if (coinPriority(left) < coinPriority(right)) {
            [left, right] = [right, left];
          }
          const leftToken = coinListClient?.getCoinInfoBySymbol(left)[0];
          const rightToken = coinListClient?.getCoinInfoBySymbol(right)[0];
          return {
            fullName: l,
            lp: [leftToken?.official_symbol, rightToken?.official_symbol].join('-'),
            tokens: [leftToken, rightToken]
          };
        })
        .sort((a, b) => (a.lp <= b.lp ? -1 : 1))
        .reduce((pre, cur) => {
          if (pre.length === 0 || cur.lp !== pre.slice(-1)[0]?.lp) {
            pre.push({
              fullName: ['*', cur.lp, '*'].join(':'),
              lp: cur.lp,
              tokens: cur.tokens
            });
          }
          return pre;
        }, [] as { fullName: string; lp: string; tokens: (RawCoinInfo | undefined)[] }[]) ?? []
    );
  }, [coinListClient, data?.lps]);

  const lpOptions: IYieldTokenSelectorOption[] =
    lpPatterns.map((_lp) => {
      const [baseToken, quoteToken] = _lp.tokens;
      const base = baseToken?.token_type.type;
      const quote = quoteToken?.token_type.type;
      /*
        const dexType =
          dex !== '*'
            ? AggregatorTypes.DexType[dex as keyof typeof AggregatorTypes.DexType]
            : undefined;
        */
      return {
        key: _lp.fullName,
        type: 'LP',
        sortKey: `${tokenSortKey(baseToken)}-${tokenSortKey(quoteToken)}`,
        icon: (
          <div className="flex items-center w-full">
            {base && quote && (
              <TradingPair
                base={base}
                quote={quote}
                isLp={true}
                isIconsInvisible={true}
                isShowBridge={false}
              />
            )}
            {/*
              {dexType !== undefined ? (
                <PoolProvider
                  className="ml-auto"
                  isClickable={false}
                  isNameInvisible={true}
                  isTitleEnabled={true}
                  dexType={dexType}
                />
              ) : (
                <span className="bg-prime-500 text-grey-100 rounded-full px-1 ml-auto label-small-bold">
                  {ALL_SWAPS}
                </span>
              )}
              */}
          </div>
        ),
        name: false,
        abbr: (
          <div className="h-10 flex items-center shrink-0 bg-prime-400/20 p-1 rounded-full px-2">
            {base && quote && (
              <TradingPair
                base={base}
                quote={quote}
                isLp={true}
                isIconsInvisible={false}
                isShowBridge={false}
              />
            )}
            {/*
              <span className="mx-1">@</span>
              {dexType !== undefined ? (
                <>
                  <PoolProvider
                    className="shrink-0"
                    isClickable={false}
                    isNameInvisible={true}
                    isTitleEnabled={true}
                    dexType={dexType}
                  />
                </>
              ) : (
                <span className="bg-prime-500 text-grey-100 rounded-full px-1 ml-auto label-small-thin w-6 h-6 shrink-0 flex items-center justify-center">
                  All
                </span>
              )}
              */}
          </div>
        )
      };
    }) ?? [];

  const options = [
    ...(yieldTypes.includes('Single Coin') ? coinOptions : []),
    ...(yieldTypes.includes('LP') ? lpOptions : []),
    ...(yieldTypes.includes('Lending') ? cTokenOptions : [])
  ].sort((a, b) => (a.sortKey <= b.sortKey ? -1 : 1));

  return (
    <IconMultipleSelector
      className={classNames('w-full flex-1', className)}
      title=""
      yieldTypes={yieldTypes}
      options={options}
      isAllOptionEnabled={false}
      selected={selected}
      onSelectedUpdate={onSelected}
    />
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
const MAX_TOKENS_SELECTED_COUNT = 6;

const TopLpPriceChanges = ({
  tokenFilters,
  selectedTokens,
  setSelectedTokens,
  metricLabel = 'Value Change(%)',
  metricLabelAbbr = 'Change(%)'
}: {
  tokenFilters: string[];
  selectedTokens: string[];
  setSelectedTokens: (v: string[]) => void;
  metricLabel?: string;
  metricLabelAbbr?: string;
}) => {
  const { coinListClient } = useHippoClient();
  const { isTablet } = useBreakpoint('tablet');
  const { isMobile } = useBreakpoint('mobile');

  const [periodSelected, setPeriodSelected] = useState<PriceChangePeriod>(PriceChangePeriod['30D']);

  const [cTokenFilter, specifiedLps, lpsFilter, singleCoins] = useMemo(() => {
    const result = [[], [], [], []] as string[][];
    for (const c of tokenFilters) {
      if (c.startsWith(CTOKEN_FILTER_PREFIX)) {
        result[0].push(c);
      } else if (c.includes(':') && !c.includes('*')) {
        // specified lp pattern
        result[1].push(c);
      } else if (c.includes(':') && c.includes('*')) {
        // lp pattern
        result[2].push(c.split(':')[1]);
      } else {
        // single coin
        result[3].push(c);
      }
    }
    return result;
  }, [tokenFilters]);

  const allDexes = useMemo(
    () =>
      [
        AggregatorTypes.DexType.Pancake,
        AggregatorTypes.DexType.Obric,
        AggregatorTypes.DexType.Cetus,
        AggregatorTypes.DexType.Pontem,
        AggregatorTypes.DexType.Aux,
        AggregatorTypes.DexType.AnimeSwap,
        AggregatorTypes.DexType.Aptoswap
      ].map((d) => AggregatorTypes.DEX_TYPE_NAME[d]),
    []
  );

  const onCheck = useCallback(
    (d: ICoinPriceChange, isChecked: boolean) => {
      if (isChecked) {
        if (selectedTokens.length >= MAX_TOKENS_SELECTED_COUNT) {
          openNotification({
            type: 'info',
            title: 'Note',
            detail: 'You can choose up to 6 tokens'
          });
          return;
        }
        selectedTokens.push(d.coin);
        const selectedLpsSet = new Set(selectedTokens);
        setSelectedTokens(Array.from(selectedLpsSet));
      } else if (!isChecked) {
        const selectedLpsSet = new Set(selectedTokens);
        selectedLpsSet.delete(d.coin);
        setSelectedTokens(Array.from(selectedLpsSet));
      }
    },
    [selectedTokens, setSelectedTokens]
  );

  const coinsKey = useMemo(() => {
    return singleCoins.length > 0
      ? `https://api.hippo.space/v1/lptracking/coins/prices/changes?` +
          [
            singleCoins.length > 0 ? `coins=${singleCoins.join(',')}` : '',
            cTokenFilter.length > 0
              ? `cTokenFilters=${cTokenFilter.map((c) => c.split(':')[1]).join(',')}`
              : ''
          ]
            .filter((s) => !!s)
            .join('&')
      : null;
  }, [cTokenFilter, singleCoins]);
  const cTokensKey = useMemo(() => {
    return cTokenFilter.length > 0
      ? `https://api.hippo.space/v1/lptracking/ctokens/prices/changes?` +
          [`cTokenFilters=${cTokenFilter.map((c) => c.split(':')[1]).join(',')}`]
            .filter((s) => !!s)
            .join('&')
      : null;
  }, [cTokenFilter]);
  const lpsKey = useMemo(() => {
    return lpsFilter.length > 0 || specifiedLps.length > 0
      ? `https://api.hippo.space/v1/lptracking/lps/prices/changes?` +
          [
            `tvlThreshold=50`,
            allDexes.length ? `dexFilter=${encodeURIComponent(allDexes.join(','))}` : undefined,
            lpsFilter.length
              ? `officalLpFilter=${encodeURIComponent(lpsFilter.join(','))}`
              : undefined,
            specifiedLps.length
              ? `specifiedLps=${encodeURIComponent(specifiedLps.join(','))}`
              : undefined
          ]
            .filter((s) => !!s)
            .join('&')
      : null;
  }, [allDexes, lpsFilter, specifiedLps]);

  const keys = useMemo(() => {
    return [coinsKey, cTokensKey, lpsKey];
  }, [coinsKey, cTokensKey, lpsKey]);

  const { data, error, isLoading } = useSWR(keys, multipleFetcher, {
    keepPreviousData: true,
    refreshInterval: 3600_000
  });
  useEffect(() => {
    if (error) {
      openHttpErrorNotification(error);
    }
  }, [error]);

  const [coinsData, cTokensData, lpsData] = useMemo(
    () =>
      (data ?? []) as [
        ICoinPriceChange[] | undefined,
        ICoinPriceChange[] | undefined,
        ILpPriceChange[] | undefined
      ],
    [data]
  );

  const areThereLpsTVLTooLow = useMemo(() => lpsData?.some((d) => d.isTVLTooLow), [lpsData]);

  useEffect(() => {
    if (areThereLpsTVLTooLow) {
      /*
      openNotification({
        type: 'info',
        title: 'Note',
        detail: 'LPs with too low TVL not displayed'
      });
      */
    }
  }, [areThereLpsTVLTooLow, lpsData]);

  const mergedData: ICoinPriceChange[] = useMemo(() => {
    return [
      ...(coinsData ?? []).map((d) => ({
        ...d,
        type: 'coin' as const
      })),
      ...(cTokensData ?? []).map((d) => ({
        ...d,
        type: 'cToken' as const
      })),
      ...(lpsData ?? [])
        .filter((d) => !d.isTVLTooLow)
        .map((d) => ({
          type: 'lp' as const,
          coin: uniqueLpStr(d),
          changes: d.priceChanges
        }))
    ].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'lp' ? 1 : a.type === 'cToken' && b.type !== 'lp' ? 1 : -1;
      } else {
        return (
          parseFloat(b.changes[periodSelected] ?? '-Infinity') -
          parseFloat(a.changes[periodSelected] ?? '-Infinity')
        );
      }
    });
  }, [cTokensData, coinsData, lpsData, periodSelected]);

  const data2 = useMemo(
    () =>
      mergedData.map((d, i) => {
        const nodes = [];
        if (d.type === 'lp') {
          const [dex, lp] = d.coin.split(':');
          const base = coinListClient?.getCoinInfoBySymbol(lp.split('-')[0])[0]?.token_type.type;
          const quote = coinListClient?.getCoinInfoBySymbol(lp.split('-')[1])[0]?.token_type.type;
          const dexType = AggregatorTypes.DexType[dex as keyof typeof AggregatorTypes.DexType];

          nodes.push(
            ...[
              <div key={i} className="flex items-center gap-x-3 tablet:gap-x-2">
                {base && quote && (
                  <TradingPair
                    key={i}
                    base={base}
                    quote={quote}
                    isLp={true}
                    isIconsInvisible={isMobile}
                  />
                )}
              </div>,
              <span key={i} className="body-bold text-grey-700 flex items-center gap-x-1">
                <ProtocolProvider
                  className={'h-[65px]'}
                  dexType={dexType}
                  isNameInvisible={true}
                  isTitleEnabled={true}
                  isClickable={false}
                />
                LP
              </span>
            ]
          );
        } else if (d.coin.startsWith(CTOKEN_PREFIX)) {
          const coin = coinListClient?.getCoinInfoBySymbol(d.coin.split(':')[2])[0];
          nodes.push(
            ...[
              <div key={i} className="min-h-[65px] flex items-center gap-x-2">
                <CoinIcon token={coin} />
                {coin && <CoinLabel coin={coin} />}
              </div>,
              <span key={i} className="body-bold text-grey-700 flex items-center gap-x-1">
                <ProtocolProvider
                  className={'h-[65px]'}
                  protocolId={d.coin.split(':')[1] as ProtocolId}
                  isNameInvisible={true}
                  isTitleEnabled={true}
                  isClickable={false}
                />
                Lending
              </span>
            ]
          );
        } else {
          const coin = coinListClient?.getCoinInfoBySymbol(d.coin)[0];
          nodes.push(
            ...[
              <div key={i} className="min-h-[65px] flex items-center gap-x-2">
                <CoinIcon token={coin} />
                {coin && <CoinLabel coin={coin} />}
              </div>,
              <span key={i} className="body-bold text-grey-700">
                Coin
              </span>
            ]
          );
        }

        nodes.push(
          ...[
            ...(!isTablet ? [<ChangeLabel key={i} v={d.changes[PriceChangePeriod['1D']]} />] : []),
            <ChangeLabel key={i} v={d.changes[PriceChangePeriod['7D']]} />,
            <ChangeLabel key={i} v={d.changes[PriceChangePeriod['30D']]} />
          ]
        );
        return nodes;
      }),
    [coinListClient, isMobile, isTablet, mergedData]
  );
  // const [isSelectedLpsInit, setIsSelectedLpsInit] = useState(selectedLps.length > 0);
  useEffect(() => {
    if (mergedData && selectedTokens.length === 0) {
      setSelectedTokens(mergedData.slice(0, 5).map((d) => d.coin));
      // setIsSelectedLpsInit(true);
    }
  }, [mergedData, selectedTokens.length, setSelectedTokens]);
  useEffect(() => {
    const allCoins = mergedData.map((md) => md.coin);
    const intersect = Array.from(selectedTokens).filter((lp) => allCoins.includes(lp));
    if (intersect.length < selectedTokens.length) {
      setSelectedTokens(intersect);
    }
  }, [mergedData, selectedTokens, setSelectedTokens]);

  const cols = useMemo(
    () =>
      [
        `# Coin`,
        'Type',
        ...[
          ...(!isTablet ? [[PriceChangePeriod['1D'], `1D ${metricLabelAbbr}`, true]] : []),
          [PriceChangePeriod['7D'], isMobile ? '7D(%)' : `7D ${metricLabelAbbr}`, true],
          [PriceChangePeriod['30D'], isMobile ? '30D(%)' : `30D ${metricLabel}`, true]
        ].map((a, i) => (
          <span
            className={classNames('cursor-pointer', {
              'pointer-events-none': !a[2]
            })}
            key={i}
            onClick={() => setPeriodSelected(a[0] as PriceChangePeriod)}>
            {a[1]}{' '}
            <CaretIcon
              className={classNames('font-icon', { 'text-prime-500': periodSelected === a[0] })}
            />
          </span>
        ))
      ].filter((c) => !!c),
    [isMobile, isTablet, metricLabel, metricLabelAbbr, periodSelected]
  );
  const flexs = !isTablet ? [3, 1.5, 2, 2, 3] : !isMobile ? [3, 1.5, 2, 3] : [3, 1.5, 2, 2];

  const onClickRow = useCallback(
    (r: number) => {
      if (mergedData) {
        const d = mergedData[r];
        onCheck(d, !selectedTokens.includes(d.coin));
      }
    },
    [mergedData, onCheck, selectedTokens]
  );

  const selectedRows = useMemo(() => {
    return selectedTokens.map((lp) => mergedData.map((d) => d.coin).findIndex((s) => s === lp));
  }, [mergedData, selectedTokens]);

  const [hoveringRow, setHoveringRow] = useState<number>();
  const setHoveringToken = useYieldStore((state) => state.setHoveringToken);

  useEffect(() => {
    const token = hoveringRow !== undefined ? mergedData[hoveringRow].coin : undefined;
    if (token === undefined || selectedTokens.includes(token)) setHoveringToken(token);
  }, [hoveringRow, mergedData, selectedTokens, setHoveringToken]);

  return (
    <>
      <TopList
        className=""
        title=""
        isLoading={isLoading}
        cols={cols}
        flexs={flexs}
        datas={data2}
        RowComp={'div'}
        rowClassName={(i) =>
          classNames(`cursor-pointer rounded-lg mobile:px-2`, {
            'bg-prime-400/20 hover:bg-prime-400/30': selectedRows.includes(i),
            'hover:bg-grey-300/10': !selectedRows.includes(i)
          })
        }
        onClickRow={onClickRow}
        onMouseEnterRow={(i) => setHoveringRow(i)}
        onMouseLeaveRow={(i) => {
          if (i === hoveringRow) setHoveringRow(undefined);
        }}
        maxColumns={6}
      />
      {areThereLpsTVLTooLow && (
        <div className="label-small-thin italic">* LPs with TVL too low are not displayed</div>
      )}
    </>
  );
};

const YieldPage = () => {
  const selectedTokens = useYieldStore((state) => state.selectedTokens);
  const setSelectedTokens = useYieldStore((state) => state.setSelectedTokens);

  const selectedCTokens = useYieldStore((state) => state.selectedCTokens);
  const setSelectedCTokens = useYieldStore((state) => state.setSelectedCTokens);

  const tokensFilter = useYieldStore((state) => state.tokensFilter);
  const setTokensFilter = useYieldStore((state) => state.setTokensFilter);

  const cTokensFilter = useYieldStore((state) => state.cTokensFilter);
  const setCTokensFilter = useYieldStore((state) => state.setCTokensFilter);

  return (
    <div className="max-w-[1321px] mx-auto mt-[106px] tablet:mt-[64px] mobile:mt-[32px]">
      <div>
        <div className="mb-10 text-grey-900">
          <div className="h4">Tracking ROI over time</div>
          <div className="mt-1 large-label-regular">
            The graph below shows your ROI of selected coins over a time period
          </div>
        </div>
        <Card className="px-8 pb-11 tablet:px-2 mobile:px-1">
          <div className="pt-4 flex items-center">
            <div className="w-25 mr-2 body-bold shrink-0">Select Coins</div>
            <TokenSelector
              className="min-w-0 flex-1"
              yieldTypes={['Single Coin', 'LP', 'Farm']}
              selected={tokensFilter}
              onSelected={setTokensFilter}
            />
          </div>
          <div className="flex items-center flex-wrap gap-x-1 mt-1">
            <div className="body-bold mr-2">Presets</div>
            <PreSetButton
              label="APT & LP"
              generalTokens={['APT', '*:APT-USDC:*', '*:APT-USDT:*']}
            />
            <PreSetButton
              label="Stables & LP"
              generalTokens={['*:BUSD-USDC:*', '*:USDT-USDC:*', '*:USDC-USDC:*']}
            />
            <PreSetButton
              label="CAKE & LP"
              generalTokens={['CAKE', '*:CAKE-USDC:*', '*:CAKE-USDT:*']}
            />
          </div>
          <div>
            <YieldChangeChart coins={selectedTokens} dotInterval={6} />
          </div>
          <div className="mt-14">
            <TopLpPriceChanges
              tokenFilters={tokensFilter}
              selectedTokens={selectedTokens}
              setSelectedTokens={setSelectedTokens}
            />
          </div>
        </Card>
        <div className="mb-10 mt-20 text-grey-900">
          <div className="h4">Tracking Deposit Growth Over Time</div>
          <div className="mt-1 large-label-regular">
            The graph below shows your deposit growth of selected coins over a time period
          </div>
        </div>
        <Card className="px-8 pb-11 tablet:px-2 mobile:px-1">
          <div className="pt-4 flex items-center">
            <div className="w-30 mr-2 body-bold shrink-0">Select Lendings Tokens</div>
            <TokenSelector
              className="min-w-0 flex-1"
              yieldTypes={['Lending']}
              selected={cTokensFilter}
              onSelected={setCTokensFilter}
            />
          </div>
          <div className="flex items-center flex-wrap gap-x-1 mt-1">
            <div className="body-bold mr-2">Presets</div>
            <PreSetButton label="Stables" generalTokens={STABLE_CTOKENS} />
            <PreSetButton
              label="APT & CAKE"
              generalTokens={['APT', 'CAKE'].map((c) => `${CTOKEN_FILTER_PREFIX}${c}`)}
            />
          </div>
          <div>
            <YieldChangeChart coins={selectedCTokens} />
          </div>
          <div className="mt-14">
            <TopLpPriceChanges
              tokenFilters={cTokensFilter}
              selectedTokens={selectedCTokens}
              setSelectedTokens={setSelectedCTokens}
              metricLabel={'Growth (% token amount)'}
              metricLabelAbbr={'Growth'}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default YieldPage;
