import Button from 'components/Button';
import { useFormikContext } from 'formik';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, MoreArrowDown, RefreshIcon, SettingIcon, SwapIcon } from 'resources/icons';
import { ISwapSettings } from '../types';
import CurrencyInput from './CurrencyInput';
import SwapDetail from './SwapDetail';
import useHippoClient from 'hooks/useHippoClient';
import useAptosWallet from 'hooks/useAptosWallet';
import { DEX_TYPE_NAME, RouteAndQuote } from '@manahippo/hippo-sdk/dist/aggregator/types';
import classNames from 'classnames';
import { Drawer, message, Skeleton, Tooltip } from 'antd';
import useTokenBalane from 'hooks/useTokenBalance';
import Card from 'components/Card';
import useTokenAmountFormatter from 'hooks/useTokenAmountFormatter';
import { useInterval } from 'usehooks-ts';
import SwapSetting from './SwapSetting';

interface IRoutesProps {
  className?: string;
  routes: RouteAndQuote[];
  routeSelected: RouteAndQuote | null;
  onRouteSelected: (route: RouteAndQuote) => void;
  isDesktopScreen?: boolean;
  isRefreshing?: boolean;
}

interface IRouteRowProps {
  route: RouteAndQuote;
  isSelected?: boolean;
  isBestPrice: boolean;
}

const SettingsButton = ({
  className = '',
  onClick
}: {
  className?: string;
  onClick: () => void;
}) => {
  const { values } = useFormikContext<ISwapSettings>();
  return (
    <Button
      className={classNames('!h-full !pr-2 !pl-3  text-grey-700', className)}
      variant="icon"
      size="small"
      onClick={onClick}>
      {values.slipTolerance}% <SettingIcon className="font-icon ml-1 !h6" />
    </Button>
  );
};

const RefreshButton = ({
  isRefreshing,
  timePassedAfterRefresh,
  isDisabled = false,
  onRefreshClicked
}: {
  isRefreshing: boolean;
  timePassedAfterRefresh: number;
  isDisabled?: boolean;
  onRefreshClicked: () => void;
}) => {
  return (
    <Card className="h-full w-fit">
      <Button
        className="!h-full !px-2"
        variant="icon"
        size="small"
        disabled={isDisabled}
        onClick={onRefreshClicked}>
        <Tooltip
          title={`${timePassedAfterRefresh}s after last suceesful refreshing. Click to refresh manually`}>
          <RefreshIcon className={classNames('font-icon', { 'animate-spin': isRefreshing })} />
        </Tooltip>
      </Button>
    </Card>
  );
};

const CardHeader = ({ className = '', left }: { className?: string; left?: ReactNode }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileTxSettingsOpen, setIsMobileTxSettingsOpen] = useState(false);
  return (
    <div className={classNames('w-full flex h-8 items-center mb-1 largeTextNormal', className)}>
      {left}
      <Card className="ml-auto h-full relative w-fit">
        <SettingsButton
          className="tablet:hidden mobile:hidden"
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        />
        <SettingsButton
          className="cursor-pointer hidden mobile:block tablet:block"
          onClick={() => setIsMobileTxSettingsOpen(true)}
        />
        <Card
          className={classNames(
            'absolute top-11 w-[400px] -right-[420px] px-8 laptop:w-[368px] laptop:-right-[calc(368px+20px)] py-8 laptop:px-4 mobile:hidden tablet:hidden scale-[50%] origin-top-left opacity-0 transition-all',
            { '!opacity-100 !scale-100': isSettingsOpen }
          )}>
          <SwapSetting onClose={() => setIsSettingsOpen(false)} />
        </Card>
      </Card>
      <Drawer
        height={'auto'}
        title={<div className="paragraph bold text-black">Transaction Settings</div>}
        placement={'bottom'}
        onClose={() => setIsMobileTxSettingsOpen(false)}
        visible={isMobileTxSettingsOpen}>
        <SwapSetting onClose={() => setIsMobileTxSettingsOpen(false)} />
      </Drawer>
    </div>
  );
};

const routeRowHeight = 66;
const RouteRow: React.FC<IRouteRowProps> = ({ route, isSelected = false, isBestPrice = false }) => {
  const swapDexs = route.route.steps.map((s) => DEX_TYPE_NAME[s.pool.dexType]).join(' x ');
  const swapRoutes = [
    route.route.steps[0].xCoinInfo.symbol.str(),
    ...route.route.steps.map((s, index) => (
      <span key={`r-${index}`}>
        <ArrowRight className="font-icon inline-block mx-[2px]" />
        {s.yCoinInfo.symbol.str()}
      </span>
    ))
  ];
  const toSymbol = route.route.steps.slice(-1)[0].yCoinInfo.symbol.str();
  const outputUiAmt = route.quote.outputUiAmt;
  const outputValue = 0; // TOD0: calculate the output value
  const [tokenAmountFormatter] = useTokenAmountFormatter();
  const outputFormatted = tokenAmountFormatter(outputUiAmt, toSymbol);

  return (
    <div className={classNames('pt-2')} style={{ height: `${routeRowHeight}px` }}>
      <div
        className={classNames(
          'relative h-full flex flex-col justify-center bg-clip-border rounded-lg border-2 cursor-pointer bg-grey-100 border-transparent',
          {
            'bg-select-border bg-origin-border bg-cover': isSelected
          }
        )}>
        <div
          className={classNames('w-full h-full p-2 rounded-lg', {
            'bg-selected': isSelected,
            'bg-grey-100': !isSelected
          })}>
          <div className="flex justify-between items-center largeTextBold">
            <div className="truncate" title={swapDexs}>
              {swapDexs}
            </div>
            <div className="largeTextBold">{outputFormatted}</div>
          </div>
          <div className="flex justify-between items-center small font-bold text-grey-500">
            <div>{swapRoutes}</div>
            <div className="invisible">${outputValue}</div>
          </div>
        </div>
        {isBestPrice && (
          <div className="absolute -left-[2px] -top-2 h-4 px-2 small font-bold bg-[#D483FF] rounded-lg rounded-bl-none flex items-center text-white">
            Best price
          </div>
        )}
      </div>
    </div>
  );
};

const RoutesAvailable: React.FC<IRoutesProps> = ({
  routes,
  onRouteSelected,
  routeSelected,
  className = '',
  isDesktopScreen = false,
  isRefreshing = false
}) => {
  const [isMore, setIsMore] = useState(false);
  const rowsWhenLess = 2;
  const rowsWhenMore = 4;
  const rowsOnDesktop = 4;
  const height = isDesktopScreen
    ? `${rowsOnDesktop * routeRowHeight}px`
    : `${Math.min(routes.length, isMore ? rowsWhenMore : rowsWhenLess) * routeRowHeight}px`;

  const rows = isDesktopScreen ? rowsOnDesktop : isMore ? rowsWhenMore : rowsWhenLess;
  return (
    <div className={className}>
      <div className="helpText text-grey-500 font-bold mb-1">
        <div>Total {routes.length} routes available</div>
      </div>
      <div
        className={classNames('overflow-x-hidden overflow-y-auto pr-1', {
          'no-scrollbar': !isDesktopScreen,
          scrollbar: isDesktopScreen
        })}
        style={{ height }}>
        {!isRefreshing &&
          routeSelected &&
          routes.map((ro, index) => {
            return (
              <div key={`route-${index}`} onClick={() => onRouteSelected(ro)}>
                <RouteRow route={ro} isSelected={ro === routeSelected} isBestPrice={index === 0} />
              </div>
            );
          })}
        {isRefreshing && (
          <div className="h-full flex flex-col justify-around">
            {new Array(rows).fill(1).map((_, index) => (
              <Skeleton.Button active block={true} key={`ske-${index}`} size="large" />
            ))}
          </div>
        )}
      </div>
      {!isDesktopScreen && routes.length > rowsWhenLess && (
        <div className="flex helpText text-grey-500 font-bold mt-2 justify-between">
          <div
            className="ml-auto cursor-pointer hover:opacity-50"
            onClick={() => setIsMore(!isMore)}>
            {isMore ? (
              <>
                Show less <MoreArrowDown className="font-icon rotate-180 align-baseline" />
              </>
            ) : (
              <>
                Show more <MoreArrowDown className="font-icon !align-bottom" />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const REFRESH_INTERVAL = 10; // seconds
const TokenSwap = () => {
  const { values, setFieldValue, submitForm, isSubmitting } = useFormikContext<ISwapSettings>();
  const { activeWallet, openModal } = useAptosWallet();
  const { hippoAgg } = useHippoClient();
  const fromSymbol = values.currencyFrom?.token?.symbol.str() || 'USDC';
  const toSymbol = values.currencyTo?.token?.symbol.str() || 'BTC';
  const fromUiAmt = values.currencyFrom?.amount;
  const [allRoutes, setAllRoutes] = useState<RouteAndQuote[]>([]);
  const [routeSelected, setRouteSelected] = useState<RouteAndQuote | null>(null);

  const [isRefreshingRoutes, setIsRefreshingRoutes] = useState(false);
  const [timePassedAfterRefresh, setTimePassedAfterRefresh] = useState(0);
  const [refreshRoutesTimerTick, setRefreshRoutesTimerTick] = useState<null | number>(null); // ms

  useEffect(() => {
    if (hippoAgg) {
      if (!values.currencyFrom?.token) {
        setFieldValue(
          'currencyFrom.token',
          hippoAgg.registryClient.getCoinInfoBySymbol(fromSymbol)
        );
      }
      if (!values.currencyTo?.token) {
        setFieldValue('currencyTo.token', hippoAgg.registryClient.getCoinInfoBySymbol(toSymbol));
      }
    }
  }, [
    fromSymbol,
    hippoAgg,
    hippoAgg?.registryClient,
    setFieldValue,
    toSymbol,
    values.currencyFrom,
    values.currencyTo
  ]);

  const latestInputParams = useRef({
    fromSymbol,
    toSymbol,
    fromUiAmt
  });
  latestInputParams.current = {
    fromSymbol,
    toSymbol,
    fromUiAmt
  };

  const ifInputParametersDifferentWithLatest = useCallback(
    (fromSymbolLocal: string, toSymbolLocal: string, fromUiAmtLocal: number) => {
      return !(
        fromSymbolLocal === latestInputParams.current.fromSymbol &&
        toSymbolLocal === latestInputParams.current.toSymbol &&
        fromUiAmtLocal === latestInputParams.current.fromUiAmt
      );
    },
    []
  );

  const setRoute = useCallback(
    (ro: RouteAndQuote | null) => {
      setRouteSelected(ro);
      setFieldValue('quoteChosen', ro);
    },
    [setFieldValue]
  );

  // To benchmark the key press debounce
  const lastFetchTs = useRef(0);

  const fetchSwapRoutes = useCallback(
    async (isReload = true) => {
      try {
        if (process.env.NODE_ENV !== 'production') {
          if (lastFetchTs.current !== 0) {
            console.log(`Swap fetch route interval: ${Date.now() - lastFetchTs.current}`);
          }
          lastFetchTs.current = Date.now();
        }
        if (hippoAgg && fromSymbol && toSymbol && fromUiAmt) {
          const xToken = hippoAgg.registryClient.getCoinInfoBySymbol(fromSymbol);
          const yToken = hippoAgg.registryClient.getCoinInfoBySymbol(toSymbol);

          if (isReload) setIsRefreshingRoutes(true);
          const maxSteps = 3;
          const routes = await hippoAgg.getQuotes(fromUiAmt, xToken, yToken, maxSteps, isReload);
          if (routes.length === 0) {
            throw new Error(
              `No quotes from ${fromSymbol} to ${toSymbol} with input amount ${fromUiAmt}`
            );
          }

          // check if parameters are not stale
          if (!ifInputParametersDifferentWithLatest(fromSymbol, toSymbol, fromUiAmt)) {
            setAllRoutes(routes);
            setRoute(routes[0]);
            if (isReload) {
              // restart interval timer
              setTimePassedAfterRefresh(0);
              // random is used to make useInterval restart
              setRefreshRoutesTimerTick(1_000 + 0.00001 * Math.random());
            }
          }
        } else {
          setAllRoutes([]);
          setRoute(null);
          setRefreshRoutesTimerTick(null);
        }
      } catch (error) {
        console.log('Fetch swap routes:', error);
        if (error instanceof Error) {
          message.error(error?.message);
        }

        setFieldValue('currencyFrom', {
          ...values.currencyFrom,
          amount: 0
        });
      } finally {
        setIsRefreshingRoutes(false);
      }
    },
    [
      hippoAgg,
      fromSymbol,
      toSymbol,
      fromUiAmt,
      ifInputParametersDifferentWithLatest,
      setRoute,
      setFieldValue,
      values.currencyFrom
    ]
  );

  const timePassedRef = useRef(0);
  timePassedRef.current = timePassedAfterRefresh;
  const inputTriggerRefreshDelay = 3;
  useEffect(() => {
    fetchSwapRoutes(!refreshRoutesTimerTick || timePassedRef.current > inputTriggerRefreshDelay);
  }, [fetchSwapRoutes, refreshRoutesTimerTick]);

  useInterval(() => {
    setTimePassedAfterRefresh(timePassedAfterRefresh + 1);
    if (timePassedAfterRefresh % REFRESH_INTERVAL === 0 && timePassedAfterRefresh !== 0) {
      fetchSwapRoutes();
    }
  }, refreshRoutesTimerTick);

  useEffect(() => {
    setFieldValue('currencyTo', {
      ...values.currencyTo,
      amount: routeSelected?.quote.outputUiAmt || ''
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeSelected, setFieldValue]);

  useEffect(() => {
    setFieldValue('currencyTo', {
      ...values.currencyTo,
      amount: routeSelected?.quote.outputUiAmt || ''
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeSelected, setFieldValue]);

  const onClickSwapToken = useCallback(() => {
    const tokenFrom = values.currencyFrom;
    const tokenTo = values.currencyTo;
    setFieldValue('currencyFrom', tokenTo);
    setFieldValue('currencyTo', tokenFrom);
  }, [values, setFieldValue]);

  const [fromCurrentBalance, isCurrentBalanceReady] = useTokenBalane(fromSymbol);
  const isSwapEnabled =
    (!activeWallet && values.currencyFrom?.token) || // to connect wallet
    (values.quoteChosen && fromUiAmt && fromCurrentBalance && fromUiAmt <= fromCurrentBalance);

  const swapButtonText = useMemo(() => {
    if (!values.currencyFrom?.token) {
      return 'Loading Tokens...';
    } else if (!activeWallet) {
      return 'Connect to Wallet';
    } else if (!isCurrentBalanceReady) {
      return 'Loading Balance...';
    } else if (!fromUiAmt) {
      return 'Enter an Amount';
    } else if (!fromCurrentBalance || fromUiAmt > fromCurrentBalance) {
      return 'Insufficient Balance';
    } else if (!values.quoteChosen) {
      return 'Loading Routes...';
    }
    return 'SWAP';
  }, [
    activeWallet,
    fromCurrentBalance,
    fromUiAmt,
    isCurrentBalanceReady,
    values.currencyFrom?.token,
    values.quoteChosen
  ]);

  return (
    <>
      <CardHeader
        className="pointer-events-auto"
        left={
          <RefreshButton
            isDisabled={!refreshRoutesTimerTick}
            isRefreshing={isRefreshingRoutes}
            onRefreshClicked={fetchSwapRoutes}
            timePassedAfterRefresh={timePassedAfterRefresh}
          />
        }
      />
      <Card className="w-full min-h-[430px] flex flex-col py-8 relative pointer-events-auto">
        <div className="w-full flex flex-col px-8 gap-1 mobile:px-4">
          <div className="largeTextBold mb-2 flex">
            <div className="mr-auto">Pay</div>
          </div>
          <CurrencyInput actionType="currencyFrom" />
          <Button variant="icon" className="mx-auto my-4" onClick={onClickSwapToken}>
            <SwapIcon />
          </Button>
          <div className="largeTextBold mb-2 flex">
            <div className="mr-auto">Receive</div>
          </div>
          <CurrencyInput actionType="currencyTo" />
          {allRoutes.length > 0 && routeSelected && (
            <>
              <RoutesAvailable
                className="mt-4 hidden mobile:block tablet:block"
                routes={allRoutes}
                routeSelected={routeSelected}
                onRouteSelected={(ro) => setRoute(ro)}
                isRefreshing={isRefreshingRoutes}
              />
            </>
          )}
          <Card
            className={classNames(
              'mobile:hidden tablet:hidden absolute top-0 w-[400px] left-[-420px] px-8 laptop:w-[368px] laptop:left-[-388px] py-8 laptop:px-4 transition-[opacity,transform] opacity-0 translate-x-[30%] -z-10',
              { 'opacity-100 !translate-x-0': allRoutes.length > 0 && routeSelected }
            )}>
            <RoutesAvailable
              isDesktopScreen={true}
              routes={allRoutes}
              routeSelected={routeSelected}
              onRouteSelected={(ro) => setRoute(ro)}
              isRefreshing={isRefreshingRoutes}
            />
          </Card>
          <Button
            isLoading={isSubmitting}
            className="mt-8"
            variant="gradient"
            disabled={!isSwapEnabled}
            onClick={!activeWallet ? openModal : submitForm}>
            {swapButtonText}
          </Button>
          {routeSelected && fromSymbol && toSymbol && (
            <SwapDetail routeAndQuote={routeSelected} fromSymbol={fromSymbol} toSymbol={toSymbol} />
          )}
        </div>
      </Card>
    </>
  );
};

export default TokenSwap;
