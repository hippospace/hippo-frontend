import Button from 'components/Button';
import { useFormikContext } from 'formik';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdjustIcon, MoreArrowDown, RefreshIcon, SwapIcon } from 'resources/icons';
import { ISwapSettings } from '../types';
import CurrencyInput from './CurrencyInput';
import SwapDetail from './SwapDetail';
import useHippoClient from 'hooks/useHippoClient';
import useAptosWallet from 'hooks/useAptosWallet';
import { AggregatorTypes } from '@manahippo/hippo-sdk';
import classNames from 'classnames';
import { Drawer, Tooltip } from 'antd';
import VirtualList from 'rc-virtual-list';
import useTokenBalane from 'hooks/useTokenBalance';
import Card from 'components/Card';
import useTokenAmountFormatter from 'hooks/useTokenAmountFormatter';
import { useInterval, useTimeout } from 'usehooks-ts';
import SwapSetting from './SwapSetting';
import usePrevious from 'hooks/usePrevious';
import { IApiRouteAndQuote } from '@manahippo/hippo-sdk/dist/aggregator/types';
import { openErrorNotification } from 'utils/notifications';
// import Skeleton from 'components/Skeleton';
import { Types, ApiError } from 'aptos';
import TokenSteps from './TokenSteps';
import { RPCType, useRpcEndpoint } from 'components/Settings';
import { useBreakpoint } from 'hooks/useBreakpoint';

interface IRoutesProps {
  className?: string;
  availableRoutesCount: number;
  routes: IApiRouteAndQuote[];
  routeSelected: IApiRouteAndQuote | null;
  onRouteSelected: (route: IApiRouteAndQuote, index: number) => void;
  isDesktopScreen?: boolean;
  isRefreshing?: boolean;
  refreshButton?: ReactNode;
  simuResults?: Types.UserTransaction[];
}

interface IRouteRowProps {
  route: IApiRouteAndQuote;
  isSelected?: boolean;
  isBestPrice: boolean;
  simuResult?: Types.UserTransaction;
}

const serializeRouteQuote = (rq: IApiRouteAndQuote) => {
  return `${rq.quote.inputUiAmt}:${rq.route.steps.map((s) => s.dexType).join('x')}:${rq.route.tokens
    .map((t) => t.symbol)
    .join('->')}`;
};

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
      {values.slipTolerance}% <AdjustIcon className="font-icon ml-1 !h6" />
    </Button>
  );
};

const RefreshButton = ({
  isRefreshing,
  timePassedAfterRefresh,
  isDisabled = false,
  onRefreshClicked,
  className = ''
}: {
  isRefreshing: boolean;
  timePassedAfterRefresh: number;
  isDisabled?: boolean;
  onRefreshClicked: () => void;
  className?: string;
}) => {
  return (
    <Card className={classNames('h-full w-fit', className)}>
      <Button
        className="!h-full !px-2"
        variant="icon"
        size="small"
        disabled={isDisabled}
        onClick={onRefreshClicked}>
        <Tooltip
          placement="topRight"
          title={`${timePassedAfterRefresh}s after last suceesful refreshing. Click to refresh manually`}>
          <RefreshIcon className={classNames('font-icon', { 'animate-spin': isRefreshing })} />
        </Tooltip>
      </Button>
    </Card>
  );
};

const CardHeader = ({ className = '', right }: { className?: string; right?: ReactNode }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileTxSettingsOpen, setIsMobileTxSettingsOpen] = useState(false);
  const { isTablet } = useBreakpoint('tablet');
  return (
    <div className={classNames('w-full flex h-8 items-center mb-1 body-medium', className)}>
      <Card className="mr-auto h-full relative w-fit">
        {!isTablet && (
          <SettingsButton
            className="tablet:hidden"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          />
        )}
        {isTablet && (
          <SettingsButton
            className="cursor-pointer hidden tablet:flex"
            onClick={() => setIsMobileTxSettingsOpen(true)}
          />
        )}
        {!isTablet && (
          <Card
            className={classNames(
              'absolute top-9 w-[400px] -left-[420px] px-8 laptop:w-[368px] laptop:-left-[calc(368px+20px)] py-8 laptop:px-4 tablet:hidden scale-[50%] origin-top-right opacity-0 transition-all transform-gpu will-change-transform',
              { '!opacity-100 !scale-100': isSettingsOpen }
            )}>
            <SwapSetting onClose={() => setIsSettingsOpen(false)} />
          </Card>
        )}
      </Card>
      {right}
      {isTablet && (
        <Drawer
          height={'auto'}
          closable={false}
          title={<div className="body-bold text-grey-900">Transaction Settings</div>}
          placement={'bottom'}
          onClose={() => setIsMobileTxSettingsOpen(false)}
          visible={isMobileTxSettingsOpen}>
          <SwapSetting onClose={() => setIsMobileTxSettingsOpen(false)} />
        </Drawer>
      )}
    </div>
  );
};

const routeRowHeight = 66;
const RouteRow: React.FC<IRouteRowProps> = ({
  route,
  isSelected = false,
  isBestPrice = false,
  simuResult
}) => {
  const swapDexs = route.route.steps
    .map((s) => AggregatorTypes.DEX_TYPE_NAME[s.dexType])
    .join(' x ');
  const { values } = useFormikContext<ISwapSettings>();
  const toToken = route.route.yCoinInfo;
  const outputUiAmt = route.quote.outputUiAmt;
  const outputValue = 0; // TOD0: calculate the output value
  const [tokenAmountFormatter] = useTokenAmountFormatter();
  const outputFormatted = tokenAmountFormatter(outputUiAmt, toToken);
  const customMaxGasAmount = values.maxGasFee;

  return (
    <div className={classNames('pt-2')} style={{ height: `${routeRowHeight}px` }}>
      <div
        className={classNames(
          'relative h-full flex flex-col justify-center bg-clip-border rounded-lg border-2 cursor-pointer bg-field border-transparent',
          {
            'bg-select-border bg-origin-border bg-cover': isSelected
          }
        )}>
        <div
          className={classNames('w-full h-full p-2 rounded-lg space-y-1', {
            'bg-prime-100 dark:bg-prime-900': isSelected,
            'bg-field': !isSelected
          })}>
          <div className="flex justify-between items-center body-bold text-grey-700">
            <div className="truncate" title={swapDexs}>
              {swapDexs}
            </div>
            <div className="body-bold">{outputFormatted}</div>
          </div>
          <div className="flex gap-x-4 justify-between items-center label-large-bold text-grey-500 laptop:label-small-bold">
            <TokenSteps className="mr-auto truncate" tokens={route.route.tokens} />
            <div className="whitespace-nowrap">
              {simuResult?.success && (
                <Tooltip
                  title={
                    customMaxGasAmount >= parseFloat(simuResult.gas_used)
                      ? 'Simulated Gas cost'
                      : 'Simulated Gas cost is bigger than the custom max gas amount'
                  }>
                  <div
                    className={classNames({
                      'text-error-500': customMaxGasAmount < parseFloat(simuResult.gas_used)
                    })}>
                    {((parseFloat(simuResult.gas_used) * 100) / 100000000).toFixed(6)} APT Gas
                  </div>
                </Tooltip>
              )}
              {simuResult && !simuResult.success && (
                <div className={'text-error-500'}>Simulation failed</div>
              )}
              <div className="hidden">${outputValue}</div>
            </div>
          </div>
        </div>
        {isBestPrice && (
          <div className="absolute -left-[2px] -top-2 h-4 px-2 label-large-bold bg-[#D483FF] rounded-lg rounded-bl-none flex items-center text-white">
            Best price
          </div>
        )}
      </div>
    </div>
  );
};

const RoutesAvailable: React.FC<IRoutesProps> = ({
  routes,
  availableRoutesCount,
  onRouteSelected,
  routeSelected,
  className = '',
  isDesktopScreen = false,
  // isRefreshing = false,
  refreshButton,
  simuResults = []
}) => {
  const [isMore, setIsMore] = useState(false);
  const rowsWhenLess = 2;
  const rowsWhenMore = 4;
  const rowsOnDesktop = 4;
  const height = isDesktopScreen
    ? Math.min(rowsOnDesktop, routes.length) * routeRowHeight
    : Math.min(routes.length, isMore ? rowsWhenMore : rowsWhenLess) * routeRowHeight;

  // const rows = isDesktopScreen ? rowsOnDesktop : isMore ? rowsWhenMore : rowsWhenLess;

  return (
    <div className={className}>
      <div className="label-small-bold text-grey-500 mb-2 flex justify-between items-center">
        <div>Total {availableRoutesCount} routes available</div>
        <div>{refreshButton}</div>
      </div>
      <VirtualList
        className="pr-1 scrollbar"
        height={height}
        itemHeight={routeRowHeight}
        data={routes}
        itemKey={(item) => serializeRouteQuote(item)}>
        {(ro, index) => (
          <div onClick={() => onRouteSelected(ro, index)}>
            <RouteRow
              route={ro}
              isSelected={ro === routeSelected}
              isBestPrice={index === 0}
              simuResult={simuResults[index]}
            />
          </div>
        )}
      </VirtualList>
      {!isDesktopScreen && routes.length > rowsWhenLess && (
        <div className="flex label-small-bold text-grey-500 mt-2 justify-between">
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

const TokenSwap = () => {
  const { values, setFieldValue, submitForm, isSubmitting } = useFormikContext<ISwapSettings>();
  const { connected, openModal } = useAptosWallet();
  const { hippoAgg, simulateSwapByRoute } = useHippoClient();

  const fromToken = values.currencyFrom?.token;
  const toToken = values.currencyTo?.token;
  const fromSymbol = fromToken?.symbol;
  const toSymbol = toToken?.symbol;

  const fromUiAmt = values.currencyFrom?.amount;
  const [allRoutes, setAllRoutes] = useState<IApiRouteAndQuote[]>([]);
  const [routeSelected, setRouteSelected] = useState<IApiRouteAndQuote | null>(null);
  const [routeSelectedSerialized, setRouteSelectedSerialized] = useState('');
  const [availableRoutesCount, setAvailableRoutesCount] = useState(0);

  const [isRefreshingRoutes, setIsRefreshingRoutes] = useState(false);
  const [timePassedAfterRefresh, setTimePassedAfterRefresh] = useState(0);
  const [refreshRoutesTimerTick, setRefreshRoutesTimerTick] = useState<null | number>(1_000); // ms
  const [isPeriodicRefreshPaused, setIsPeriodicRefreshPaused] = useState(false);

  const rpcEndpoint = useRpcEndpoint();

  let refreshInterval = 20; // seconds
  let isInputAmtTriggerReload = false;
  let inputTriggerReloadThreshold = 20;
  let poolReloadMinInterval = 10_000; // ms!
  let error429WaitSeconds = 60;

  if (rpcEndpoint === RPCType.Aptos) {
    refreshInterval = 60; // seconds
    isInputAmtTriggerReload = true;
    inputTriggerReloadThreshold = 30;
    poolReloadMinInterval = 20_000; // ms!
    error429WaitSeconds = 5 * 60;
  }

  const hasRoute = useMemo(() => {
    return !!(
      fromToken &&
      toToken &&
      hippoAgg.getAllRoutes(fromToken, toToken, 3, false).length > 0
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromToken, hippoAgg, hippoAgg.allPools, toToken]);

  useEffect(() => {
    if (hippoAgg) {
      if (!values.currencyFrom?.token) {
        setFieldValue('currencyFrom.token', hippoAgg.coinListClient.getCoinInfoBySymbol('USDC')[0]);
      }
      if (!values.currencyTo?.token) {
        setFieldValue('currencyTo.token', hippoAgg.coinListClient.getCoinInfoBySymbol('APT')[0]);
      }
    }
  }, [
    fromSymbol,
    hippoAgg,
    setFieldValue,
    toSymbol,
    values.currencyFrom?.token,
    values.currencyTo?.token
  ]);

  /*
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
  */

  const setRoute = useCallback(
    (ro: IApiRouteAndQuote | null) => {
      setRouteSelected(ro);
      setFieldValue('quoteChosen', ro);
    },
    [setFieldValue]
  );

  const setSelectedRouteFromRoutes = useCallback(
    (routes: IApiRouteAndQuote[]) => {
      let manuallySelectedRoute: IApiRouteAndQuote;
      if (routeSelectedSerialized) {
        manuallySelectedRoute = routes.find(
          (r) => serializeRouteQuote(r) === routeSelectedSerialized
        );
      }
      setRoute(manuallySelectedRoute || routes[0] || null);
    },
    [routeSelectedSerialized, setRoute]
  );

  const resetAllRoutes = useCallback(() => {
    setAllRoutes([]);
    setRoute(null);
    setAvailableRoutesCount(0);
    setRouteSelectedSerialized('');
  }, [setRoute]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  const stopTimer = useCallback(() => {
    setRefreshRoutesTimerTick(null); // stop timer
  }, []);

  const restartTimer = useCallback(() => {
    // restart interval timer
    setTimePassedAfterRefresh(0);
    // random is used to make useInterval restart
    setRefreshRoutesTimerTick(1_000 + 0.00001 * Math.random());
  }, []);

  const timePassedRef = useRef(0);
  timePassedRef.current = timePassedAfterRefresh;

  const previousFromUiAmt = usePrevious(fromUiAmt);
  const previousFromToken = usePrevious(fromToken);
  const previousToToken = usePrevious(toToken);
  const isFromToTokensChanged = previousFromToken !== fromToken || previousToToken !== toToken;

  const lastFetchTs = useRef(0);

  const fetchSwapRoutes = useCallback(
    async (isReload: boolean | undefined = undefined) => {
      try {
        if (process.env.NODE_ENV !== 'production') {
          // Check the key press debounce
          if (lastFetchTs.current !== 0) {
            console.log(`Swap fetch route interval: ${Date.now() - lastFetchTs.current}`);
          }
        }
        const now = Date.now();
        lastFetchTs.current = now;

        console.log(
          `FetchSwapRoutes: isFromToTokensChanged: ${isFromToTokensChanged}, timePassedRef.current: ${timePassedRef.current}`
        );
        if (hippoAgg && fromToken && toToken) {
          const maxSteps = 3;
          if (fromUiAmt) {
            const isReloadInternal =
              isReload ??
              (isFromToTokensChanged ||
                // timePassedRef.current might be bigger than refresh interval due to the requests waiting time
                (isInputAmtTriggerReload && timePassedRef.current > inputTriggerReloadThreshold));
            setIsRefreshingRoutes(isReloadInternal);

            const { routes, allRoutesCount } = await hippoAgg.getQuotesUni(
              fromUiAmt,
              fromToken,
              toToken,
              maxSteps,
              isReloadInternal,
              false,
              poolReloadMinInterval,
              false
            );
            // check if it's the latest reqeust
            if (now === lastFetchTs.current) {
              if (routes.length > 0) {
                setAllRoutes(routes);
                setSelectedRouteFromRoutes(routes);
                setAvailableRoutesCount(allRoutesCount);
                if (isReloadInternal) {
                  restartTimer();
                }
              }
              /*
              } else {
                resetAllRoutes();
              }
              */
              if (isReloadInternal) {
                setIsPeriodicRefreshPaused(false);
              }
            }
          } else {
            const isReloadInternal = isReload ?? !(previousFromUiAmt > 0);
            if (isReloadInternal) {
              await hippoAgg.reloadPools(
                fromToken,
                toToken,
                maxSteps,
                true,
                false,
                poolReloadMinInterval
              );
            }
            resetAllRoutes();
            // stopTimer();
            if (isReloadInternal) {
              restartTimer();
              setIsPeriodicRefreshPaused(false);
            }
          }
        }
      } catch (error) {
        console.log('Fetch swap routes:', error);
        if (error instanceof ApiError) {
          // let detail = `${error.status} : ${error.errorCode} : ${error.vmErrorCode} : ${error.message}`;
          let detail = error.message;
          const msg = JSON.parse(error.message);
          if (msg.message === 'Generic Error') {
            detail = 'Too many requests. You need to wait 60s and try again';
            setIsPeriodicRefreshPaused(true);
          }
          if (fromUiAmt) openErrorNotification({ detail, title: 'Fetch API error' });
        } else {
          openErrorNotification({
            detail: error?.message || JSON.stringify(error),
            title: 'Fetch swap routes error'
          });
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
      fromToken,
      fromUiAmt,
      hippoAgg,
      inputTriggerReloadThreshold,
      isFromToTokensChanged,
      isInputAmtTriggerReload,
      poolReloadMinInterval,
      previousFromUiAmt,
      resetAllRoutes,
      restartTimer,
      setFieldValue,
      setSelectedRouteFromRoutes,
      toToken,
      values.currencyFrom
    ]
  );

  const [simulateResults, setSimulateResults] = useState<(Types.UserTransaction | null)[]>([]);
  const simuTs = useRef(0);
  const [aptBalance, isReady] = useTokenBalane(
    hippoAgg.coinListClient.getCoinInfoBySymbol('APT')[0]
  );
  const [baseBalance] = useTokenBalane(fromToken);

  useEffect(() => {
    const ts = Date.now();
    simuTs.current = ts;
    setSimulateResults([]);
    if (allRoutes.length > 0 && isReady && aptBalance >= 0.02 && baseBalance >= fromUiAmt) {
      const simuCount = 4;
      /* fix: this would shortcut user inputs
      if ((ts - simuTs.current) / 1000 < REFRESH_INTERVAL - 1) {
        // for the case useEffect runs twice when in React strict and debug mode
        return;
      }
      */
      let routesToSimu = allRoutes.slice(0, simuCount);

      const results = new Array(simuCount).fill(null);
      routesToSimu.forEach((route, i) => {
        (async () => {
          const result = await simulateSwapByRoute(route, values.slipTolerance);
          if (!results[i] && ts === simuTs.current) {
            results[i] = result;
            setSimulateResults([...results]);
          }
        })();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    allRoutes,
    aptBalance,
    baseBalance,
    isReady,
    simulateSwapByRoute,
    values.maxGasFee,
    values.slipTolerance
  ]);

  useTimeout(
    () => {
      setIsPeriodicRefreshPaused(false);
    },
    isPeriodicRefreshPaused ? error429WaitSeconds * 1_000 : null
  );

  useEffect(() => {
    fetchSwapRoutes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromToken, toToken, fromUiAmt, hippoAgg]);

  useInterval(() => {
    setTimePassedAfterRefresh(timePassedAfterRefresh + 1);
    if (
      timePassedAfterRefresh % refreshInterval === 0 &&
      timePassedAfterRefresh !== 0 &&
      !isPeriodicRefreshPaused
    ) {
      fetchSwapRoutes(true);
    }
  }, refreshRoutesTimerTick);

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

  const [fromCurrentBalance, isCurrentBalanceReady] = useTokenBalane(fromToken);
  const isSwapEnabled =
    (hasRoute && !connected && values.currencyFrom?.token) || // to connect wallet
    (values.quoteChosen && fromUiAmt && fromCurrentBalance && fromUiAmt <= fromCurrentBalance);

  const swapButtonText = useMemo(() => {
    if (!values.currencyFrom?.token) {
      return 'Loading Tokens...';
    } else if (!hasRoute) {
      return 'No Available Route';
    } else if (!connected) {
      return 'Connect to Wallet';
      /*
    } else if (!isCurrentBalanceReady) {
      return 'Loading Balance...';
      */
    } else if (!fromUiAmt) {
      return 'Enter an Amount';
    } else if (isRefreshingRoutes) {
      return 'Loading Routes...';
    } else if (isCurrentBalanceReady && fromUiAmt > fromCurrentBalance) {
      return 'Insufficient Balance';
      /*
    } else if (!values.quoteChosen) {
      return 'No Available Route';
    */
    }
    return 'SWAP';
  }, [
    values.currencyFrom?.token,
    hasRoute,
    connected,
    fromUiAmt,
    isRefreshingRoutes,
    isCurrentBalanceReady,
    fromCurrentBalance
  ]);

  // Scroll the Swap box to vertical middle
  const swapRef = useRef<HTMLDivElement>(null);
  const preRouteSelected = usePrevious(routeSelected);
  useEffect(() => {
    if (!preRouteSelected && routeSelected) {
      setTimeout(() => {
        const height = swapRef.current?.offsetHeight || 0;
        const topToViewport = swapRef.current?.getBoundingClientRect().top || 0;
        const top = (window.innerHeight - height) / 2;
        if (top > 0) {
          window.scrollBy(0, topToViewport - top);
        }
      }, 150);
    }
  }, [preRouteSelected, routeSelected]);

  const onUserSelectRoute = useCallback(
    (ro: IApiRouteAndQuote, index: number) => {
      setRoute(ro);
      setRouteSelectedSerialized(index === 0 ? '' : serializeRouteQuote(ro));
    },
    [setRoute]
  );

  const onSwap = useCallback(() => {
    /*
    if (routeSelectedSerialized) {
      Modal.warning({
        title: 'Are you sure to proceed?',
        content: "You're not chosing the best price route",
        okText: 'Proceed anyway',
        okCancel: true,
        cancelText: 'Cancel',
        maskClosable: true,
        onOk: () => {
          submitForm();
        }
      });
      return;
    }
    */
    submitForm();
  }, [submitForm]);

  const { isTablet } = useBreakpoint('tablet');

  const cardXPadding = '32px';
  return (
    <div className="w-full" ref={swapRef}>
      <CardHeader
        className="pointer-events-auto"
        right={
          isTablet && (
            <RefreshButton
              className="hidden tablet:block"
              isDisabled={!refreshRoutesTimerTick}
              isRefreshing={isRefreshingRoutes}
              onRefreshClicked={() => fetchSwapRoutes(true)}
              timePassedAfterRefresh={timePassedAfterRefresh}
            />
          )
        }
      />
      <Card className="w-full min-h-[430px] flex flex-col py-8 relative pointer-events-auto">
        <div
          className="w-full flex flex-col gap-1 mobile:!px-4"
          style={{ paddingLeft: cardXPadding, paddingRight: cardXPadding }}>
          <div className="body-bold mb-2 flex">
            <div className="mr-auto">Pay</div>
          </div>
          <CurrencyInput
            actionType="currencyFrom"
            isDisableAmountInput={!hasRoute}
            trashButtonContainerWidth={cardXPadding}
          />
          <Button variant="icon" className="mx-auto my-4" onClick={onClickSwapToken}>
            <SwapIcon className="font-icon text-[40px] text-grey-700" />
          </Button>
          <div className="body-bold mb-2 flex">
            <div className="mr-auto">Receive</div>
          </div>
          <CurrencyInput actionType="currencyTo" />
          {isTablet && fromUiAmt && allRoutes.length > 0 && routeSelected && (
            <>
              <RoutesAvailable
                className="mt-4 hidden tablet:block"
                availableRoutesCount={availableRoutesCount}
                routes={allRoutes}
                routeSelected={routeSelected}
                onRouteSelected={onUserSelectRoute}
                isRefreshing={isRefreshingRoutes}
                simuResults={simulateResults}
              />
            </>
          )}
          {!isTablet && (
            <Card
              className={classNames(
                'tablet:hidden absolute top-0 w-[420px] right-[-440px] px-4 laptop:w-[368px] laptop:right-[-388px] py-8 laptop:px-4 transition-[opacity,transform] opacity-0 -translate-x-[30%] -z-10 transform-gpu will-change-transform',
                { 'opacity-100 !translate-x-0': fromUiAmt && allRoutes.length > 0 && routeSelected }
              )}>
              <RoutesAvailable
                availableRoutesCount={availableRoutesCount}
                isDesktopScreen={true}
                routes={allRoutes}
                routeSelected={routeSelected}
                onRouteSelected={onUserSelectRoute}
                isRefreshing={isRefreshingRoutes}
                refreshButton={
                  <RefreshButton
                    isDisabled={!refreshRoutesTimerTick}
                    isRefreshing={isRefreshingRoutes}
                    onRefreshClicked={() => fetchSwapRoutes(true)}
                    timePassedAfterRefresh={timePassedAfterRefresh}
                  />
                }
                simuResults={simulateResults}
              />
              <SwapDetail routeAndQuote={routeSelected} fromToken={fromToken} toToken={toToken} />
            </Card>
          )}
          <Button
            isLoading={isSubmitting}
            className="mt-8"
            variant="gradient"
            disabled={!isSwapEnabled}
            onClick={!connected ? openModal : onSwap}>
            {swapButtonText}
          </Button>
          {isTablet && routeSelected && (
            <SwapDetail
              className="hidden tablet:flex"
              routeAndQuote={routeSelected}
              fromToken={fromToken}
              toToken={toToken}
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default TokenSwap;
