import Button from 'components/Button';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdjustIcon, RefreshIcon, SwapIcon, WarningIcon } from 'resources/icons';
import CurrencyInput from './CurrencyInput';
import SwapDetail from './SwapDetail';
import useHippoClient from 'hooks/useHippoClient';
import useAptosWallet from 'hooks/useAptosWallet';
import classNames from 'classnames';
import { Drawer, Tooltip, Modal } from 'antd';
import useTokenBalane from 'hooks/useTokenBalance';
import Card from 'components/Card';
import { useInterval, useTimeout } from 'usehooks-ts';
import SwapSetting from './SwapSetting';
import usePrevious from 'hooks/usePrevious';
import { openErrorNotification } from 'utils/notifications';
// import Skeleton from 'components/Skeleton';
import { Types, ApiError } from 'aptos';
import { RPCType, useRPCURL, useRpcEndpoint } from 'components/Settings';
import { useBreakpoint } from 'hooks/useBreakpoint';
import { useCoingeckoPrice } from 'hooks/useCoingecko';
import { GeneralRouteAndQuote } from 'types/hippo';
import { AggregatorTypes } from '@manahippo/hippo-sdk';
import { RawCoinInfo } from '@manahippo/coin-list';
import { aptToGas, gasToApt } from 'utils/aptosUtils';
import PriceSwitch from './PriceSwitch';
import PriceChart from './PriceChart';
import { CSSTransition } from 'react-transition-group';
import './TokenSwap.scss';
import { cutDecimals } from 'components/PositiveFloatNumInput/numberFormats';
import {
  IFetchRoutesArgs,
  IFetchRoutesResult,
  IQueryIfRoutesExistingArgs,
  IQueryIfRoutesExistingResult,
  IQueryStateResult,
  IReloadPoolsArgs,
  IReloadPoolsResult,
  ISwapWorkerError,
  ISwapWorkerInitArgs,
  ISwapWorkerMessage,
  ISwapWorkerReturn
} from '../SwapWorker';
import { postMessageTyped } from 'utils/hippo';
import { RoutesAvailable } from './RoutesAvailable';
import { getMergedRoutes, serializeRouteQuote } from './TokenSwapUtil';
import { SwapContextType } from '..';

export type RoutesSimulateResults = Map<string, Types.UserTransaction | undefined>;

const SettingsButton = ({
  ctx,
  className = '',
  onClick
}: {
  ctx: SwapContextType;
  className?: string;
  onClick: () => void;
}) => {
  return (
    <Button
      className={classNames('!h-full !pr-2 !pl-3  text-grey-700', className)}
      variant="icon"
      size="small"
      onClick={onClick}>
      {ctx.slippageTolerance}% <AdjustIcon className="font-icon ml-1 !h6" />
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
          title={`${timePassedAfterRefresh}s after last suceesful refresh. Click to refresh manually`}>
          <RefreshIcon className={classNames('font-icon', { 'animate-spin': isRefreshing })} />
        </Tooltip>
      </Button>
    </Card>
  );
};

const TokenSwapHeader = ({
  ctx,
  className = '',
  right,
  fromCoinInfo: fromToken,
  toCoinInfo: toToken,
  maxGas
}: {
  ctx: SwapContextType;
  maxGas?: number;
  className?: string;
  right?: ReactNode;
  fromCoinInfo: RawCoinInfo | undefined;
  toCoinInfo: RawCoinInfo | undefined;
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileTxSettingsOpen, setIsMobileTxSettingsOpen] = useState(false);
  const { isTablet } = useBreakpoint('tablet');
  const isPriceChartOpen = ctx.isPriceChartOpen;
  const setIsPriceChartOpen = ctx.setIsPriceChartOpen;
  const nodeRef = useRef(null);

  const onSwapSettingsClose = useCallback(() => {
    if (!isTablet) {
      setIsSettingsOpen(false);
    } else {
      setIsMobileTxSettingsOpen(false);
    }
  }, [isTablet]);

  return (
    <div className={classNames('w-full flex h-8 items-center mb-1 body-medium', className)}>
      <PriceSwitch onUpdate={setIsPriceChartOpen} isStateOn={isPriceChartOpen} />
      <Card className="mr-auto h-full relative w-fit ml-[10px] shadow-subTitle">
        {!isTablet && (
          <SettingsButton
            ctx={ctx}
            className="tablet:hidden"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          />
        )}
        {isTablet && (
          <SettingsButton
            ctx={ctx}
            className="cursor-pointer hidden tablet:flex"
            onClick={() => setIsMobileTxSettingsOpen(true)}
          />
        )}
      </Card>
      {right}
      {/* Seems Transition rather than CSSTransition has a bug of unmountOnExit true */}
      {!isTablet && (
        <CSSTransition
          nodeRef={nodeRef}
          in={isPriceChartOpen}
          timeout={150}
          mountOnEnter={true}
          unmountOnExit={true}
          classNames="swap-price-chart-trans">
          <div
            ref={nodeRef}
            className="absolute top-9 -left-[420px] laptop:-left-[calc(368px+20px)] tablet:hidden origin-top-right">
            <Card className="w-[400px] h-[456px] laptop:w-[368px] py-8 px-4">
              {fromToken && toToken && <PriceChart baseToken={fromToken} quoteToken={toToken} />}
            </Card>
          </div>
        </CSSTransition>
      )}
      {isTablet && (
        <Drawer
          height={'auto'}
          closable={false}
          placement={'bottom'}
          onClose={() => setIsPriceChartOpen(false)}
          visible={isPriceChartOpen}>
          {fromToken && toToken && <PriceChart baseToken={fromToken} quoteToken={toToken} />}
        </Drawer>
      )}
      {!isTablet && (
        <Modal
          visible={isSettingsOpen}
          footer={null}
          closable={false}
          maskClosable={true}
          centered
          width={400}
          destroyOnClose={true}
          onCancel={onSwapSettingsClose}>
          <SwapSetting ctx={ctx} maxGas={maxGas} onClose={onSwapSettingsClose} />
        </Modal>
      )}
      {isTablet && (
        <Drawer
          height={'auto'}
          closable={false}
          title={<div className="body-bold text-grey-900">Transaction Settings</div>}
          placement={'bottom'}
          onClose={onSwapSettingsClose}
          visible={isMobileTxSettingsOpen}>
          <SwapSetting ctx={ctx} maxGas={maxGas} onClose={onSwapSettingsClose} />
        </Drawer>
      )}
    </div>
  );
};

const ErrorBody = ({
  title,
  detail,
  titleClassName = ''
}: {
  title: string;
  detail?: string;
  titleClassName?: string;
}) => {
  return (
    <div>
      <div className={classNames('text-error-500 body-bold ml-5 relative', titleClassName)}>
        <div className="absolute w-fit -left-5 bottom-0 top-0 flex items-center">
          <WarningIcon className="font-icon" />
        </div>
        {title}
      </div>
      {detail && <div className="text-grey-500 label-large-regular ml-5">{detail}</div>}
    </div>
  );
};

interface TProps {
  ctx: SwapContextType;
}

const TokenSwap: React.FC<TProps> = ({ ctx }) => {
  // console.log('Token swap rendering');

  const { connected, openModal } = useAptosWallet();
  const { coinListClient, simulateSwapByRoute } = useHippoClient();

  const isFixedOutput = ctx.isFixedOutput;
  const fromUiAmt = ctx.fromAmount;
  const toUiAmt = ctx.toAmount;

  const fromCoin = ctx.fromCoin;
  const toCoin = ctx.toCoin;

  const [hasRoutes, setHasRoutes] = useState(false);

  const [allRoutes, setAllRoutes] = useState<GeneralRouteAndQuote[]>([]);
  const [routeSelected, setRouteSelected] = useState<GeneralRouteAndQuote | undefined>(undefined);
  const [routeSelectedSerialized, setRouteSelectedSerialized] = useState(''); // '' represents the first route

  // const [isRefreshingRoutes, setIsRefreshingRoutes] = useState(false);
  const [isUIReloadingPools, setIsUIReloadingPools] = useState(false);
  const [timePassedAfterRefresh, setTimePassedAfterRefresh] = useState(0);
  const [refreshRoutesTimerTick, setRefreshRoutesTimerTick] = useState<null | number>(1_000); // ms
  const [isPeriodicRefreshPaused, setIsPeriodicRefreshPaused] = useState(false);

  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [workerInstance, setWorkerInstance] = useState<Worker>();
  /*
  const workerInstance = useMemo(
    () => new Worker(new URL('../SwapWorker.ts', import.meta.url)),
    []
  );
  */

  const isUserInputChanged = !(
    (!isFixedOutput &&
      routeSelected?.quote.inputUiAmt === fromUiAmt &&
      routeSelected?.quote.inputSymbol === fromCoin?.symbol) ||
    (isFixedOutput &&
      routeSelected?.quote.outputUiAmt === toUiAmt &&
      routeSelected?.quote.outputSymbol === toCoin?.symbol)
  );

  const isRefreshingRoutes = isUIReloadingPools;

  const rpcEndpoint = useRpcEndpoint();

  // Reduce Coingecko Api requests as much as we can
  const [prices, , coingeckoApi] = useCoingeckoPrice(
    fromUiAmt ? [fromCoin, toCoin, coinListClient?.getCoinInfoBySymbol('APT')[0]] : undefined
  );
  const fromPrice = fromCoin ? prices[fromCoin.symbol] : undefined;
  const toTokenPrice = toCoin ? prices[toCoin.symbol] : undefined;
  const aptPrice = prices.APT;

  const payValue = useMemo(() => {
    if (typeof fromPrice === 'number') {
      return cutDecimals('' + fromPrice * (fromUiAmt || 0), 2);
    }
    return undefined;
  }, [fromPrice, fromUiAmt]);
  const toValue = useMemo(() => {
    if (typeof toTokenPrice === 'number') {
      return cutDecimals('' + toTokenPrice * (toUiAmt || 0), 2);
    }
    return undefined;
  }, [toTokenPrice, toUiAmt]);

  const isAllowHighGas = useMemo(
    () => !!payValue && !!toValue && (parseFloat(payValue) > 100 || parseFloat(toValue) > 100),
    [payValue, toValue]
  );

  let refreshInterval = 30; // seconds
  let isInputAmtTriggerReload = true;
  let inputTriggerReloadThreshold = 20;
  let poolReloadMinInterval = 10_000; // ms!
  let error429WaitSeconds = 60;

  if (rpcEndpoint === RPCType.Aptos) {
    refreshInterval = 60; // seconds
    isInputAmtTriggerReload = false;
    inputTriggerReloadThreshold = 60;
    poolReloadMinInterval = 20_000; // ms!
    error429WaitSeconds = 5 * 60;
  }

  useEffect(() => {
    if (isWorkerReady && fromCoin && toCoin && workerInstance) {
      postMessageTyped<ISwapWorkerMessage<IQueryIfRoutesExistingArgs>>(workerInstance, {
        cmd: 'queryIfRoutesExisting',
        args: {
          x: fromCoin,
          y: toCoin,
          fixedOut: false,
          maxSteps: 3,
          allowRoundTrip: false
        }
      });
    }
  }, [fromCoin, isWorkerReady, toCoin, workerInstance]);

  useEffect(() => {
    if (fromCoin && toCoin) {
      // Prevents browser from storing history of every change
      window.history.replaceState(
        {},
        '',
        location.origin +
          `/swap/from/${fromCoin.symbol}${
            !isFixedOutput && fromUiAmt ? `/amt/${fromUiAmt}` : ''
          }/to/${toCoin.symbol}${isFixedOutput && toUiAmt ? `/amt/${toUiAmt}` : ''}`
      );
    }
  }, [fromCoin, toCoin, fromUiAmt, isFixedOutput, toUiAmt]);

  const setRoute = useCallback(
    (ro: GeneralRouteAndQuote | undefined) => {
      setRouteSelected(ro);
      ctx.setQuoteChosen(ro);
    },
    [ctx]
  );

  const setSelectedRouteFromRoutes = useCallback(
    (routes: GeneralRouteAndQuote[]) => {
      let manuallySelectedRoute: GeneralRouteAndQuote | undefined = undefined;
      if (routeSelectedSerialized) {
        manuallySelectedRoute = routes.find(
          (r) => serializeRouteQuote(r) === routeSelectedSerialized
        );
      }
      setRoute(manuallySelectedRoute || routes[0] || undefined);
    },
    [routeSelectedSerialized, setRoute]
  );

  const resetAllRoutes = useCallback(() => {
    console.log('Reset all routes');
    setAllRoutes([]);
    setRoute(undefined);
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
  const previousToUiAmt = usePrevious(toUiAmt);
  /*
  const previousFromToken = usePrevious(fromToken);
  const previousToToken = usePrevious(toToken);
  const tokenPairUnchanged =
    (previousFromToken === fromToken && previousToToken === toToken) ||
    (previousFromToken === toToken && previousToToken === fromToken);
  */

  const resetInputs = useCallback(() => {
    ctx.setIsFixedOutput(false);
    ctx.setFromAmount(0);
  }, [ctx]);

  const lastFetchTs = useRef(0);

  useEffect(() => {
    if (workerInstance)
      workerInstance.onmessage = (message) => {
        if (message.data.error) {
          const { error, cmd } = message.data as ISwapWorkerError;
          console.log(`Error from worker for ${cmd}`, error);

          if (error instanceof ApiError) {
            // let detail = `${error.status} : ${error.errorCode} : ${error.vmErrorCode} : ${error.message}`;
            const msg = JSON.parse(error.message);
            let detail = msg.message ?? error.message;
            if (msg.message === 'Generic Error') {
              // detail = 'Too many requests. You need to wait 60s and try again';
              detail = 'Network error. Please try again later';
              if (cmd === 'fetchRoutes' || cmd === 'reloadPools') {
                setIsPeriodicRefreshPaused(true);
              }
            }
            if (cmd == 'fetchRoutes') openErrorNotification({ detail, title: 'Fetch API error' });
          } else {
            openErrorNotification({
              detail: (error as { message: string }).message ?? '',
              title: 'Unkown error'
            });
          }

          if (cmd === 'fetchRoutes' || cmd === 'reloadPools') {
            resetInputs();
            // setIsRefreshingRoutes(false);
          }
        } else if (message && coinListClient) {
          const data = message.data as ISwapWorkerReturn<unknown>;
          console.log(`Message from worker of cmd: ${data.cmd}`, data.result);

          if (data.cmd === 'fetchRoutes') {
            const { result } = message.data as ISwapWorkerReturn<IFetchRoutesResult>;
            const {
              ts,
              allRoutes: routesByWorker,
              isReloadInternal,
              isFixedOutput: isFixedOutputByWorker
            } = result;

            // check if it's the latest reqeust
            if (ts === lastFetchTs.current) {
              let routes: GeneralRouteAndQuote[] = [];
              if (!isFixedOutputByWorker) {
                routes = routesByWorker.map((r) => {
                  const route = r.route as AggregatorTypes.IApiSplitMultiRouteJSON;
                  return {
                    ...r,
                    route: AggregatorTypes.SplitMultiRoute.fromJSON(route, coinListClient)
                  };
                });
              } else {
                routes = routesByWorker.map((r) => {
                  const route = r.route as AggregatorTypes.IApiRouteJSON;
                  return {
                    ...r,
                    route: AggregatorTypes.ApiTradeRoute.fromJSON(route, coinListClient)
                  };
                });
              }

              if (routes.length > 0) {
                setAllRoutes(routes);
                setSelectedRouteFromRoutes(routes);
                if (isReloadInternal) {
                  restartTimer();
                }
              } else {
                // resetAllRoutes();
                throw new Error('No routes found at the moment');
              }
              if (isReloadInternal) {
                setIsPeriodicRefreshPaused(false);
              }
            }
            setIsUIReloadingPools(false);
            // setIsRefreshingRoutes(false);
          } else if (data.cmd === 'reloadPools') {
            const {
              result: { ts, isReloadInternal }
            } = message.data as ISwapWorkerReturn<IReloadPoolsResult>;
            if (ts === lastFetchTs.current) {
              resetAllRoutes();
            }
            // stopTimer();
            if (isReloadInternal) {
              restartTimer();
              setIsPeriodicRefreshPaused(false);
            }
            // setIsRefreshingRoutes(false);
          } else if (data.cmd === 'queryIfRoutesExisting') {
            const {
              result: { hasRoutes: hasRoutesByWorker }
            } = message.data as ISwapWorkerReturn<IQueryIfRoutesExistingResult>;

            setHasRoutes(hasRoutesByWorker);
          } else if (data.cmd === 'queryState') {
            const {
              result: { isReady }
            } = message.data as ISwapWorkerReturn<IQueryStateResult>;
            setIsWorkerReady(isReady);
          }
        }
      };
  }, [
    coinListClient,
    resetAllRoutes,
    resetInputs,
    restartTimer,
    setSelectedRouteFromRoutes,
    workerInstance
  ]);

  const rpcUrl = useRPCURL();
  const previousRpcUrl = usePrevious(rpcUrl);
  useEffect(() => {
    if (!workerInstance && rpcUrl) {
      // https://github.com/vercel/next.js/issues/31009#issuecomment-1146344161
      const worker = new Worker(new URL('../SwapWorker.ts', import.meta.url));
      postMessageTyped<ISwapWorkerMessage<ISwapWorkerInitArgs>>(worker, {
        cmd: 'initWorker',
        args: {
          rpcUrl
        }
      });
      setWorkerInstance(worker);
    }
  }, [rpcUrl, workerInstance]);
  useEffect(() => {
    return () => {
      console.log('worker terminates');
      workerInstance?.terminate();
    };
  }, [workerInstance]);
  useEffect(() => {
    if (previousRpcUrl && rpcUrl && workerInstance && previousRpcUrl !== rpcUrl) {
      postMessageTyped<ISwapWorkerMessage<ISwapWorkerInitArgs>>(workerInstance, {
        cmd: 'initWorker',
        args: {
          rpcUrl
        }
      });
    }
  }, [previousRpcUrl, rpcUrl, workerInstance]);

  const fetchSwapRoutes = useCallback(
    async (isReload: boolean | undefined = undefined) => {
      if (process.env.NODE_ENV !== 'production') {
        // Check the key press debounce
        if (lastFetchTs.current !== 0) {
          console.log(`Swap fetch route interval: ${Date.now() - lastFetchTs.current}`);
        }
      }
      const now = Date.now();
      lastFetchTs.current = now;

      // console.log(`FetchSwapRoutes: timePassedRef.current: ${timePassedRef.current}`);
      if (fromCoin && toCoin && workerInstance && isWorkerReady) {
        const maxSteps = 3;
        // Using isFixedOutput is necessary as the other side amount would not change immediately to 0 when the input amount is cleared
        if ((!isFixedOutput && fromUiAmt) || (isFixedOutput && toUiAmt)) {
          const isReloadInternal =
            isReload ??
            // timePassedRef.current might be bigger than refresh interval due to the requests waiting time
            (isInputAmtTriggerReload && timePassedRef.current > inputTriggerReloadThreshold);
          // setIsRefreshingRoutes(isReloadInternal);
          // setIsRefreshingRoutes(true);
          setIsUIReloadingPools(true);

          postMessageTyped<ISwapWorkerMessage<IFetchRoutesArgs>>(workerInstance, {
            cmd: 'fetchRoutes',
            args: {
              ts: now,
              inputUiAmt: fromUiAmt as number,
              x: fromCoin,
              y: toCoin,
              maxSteps,
              reloadState: isReloadInternal,
              allowRoundTrip: false,
              customReloadMinInterval: poolReloadMinInterval,
              allowHighGas: isAllowHighGas,
              isFixedOutput,
              outputUiAmt: toUiAmt
            }
          });
        } else {
          if (now === lastFetchTs.current) {
            resetAllRoutes();
          }
          const isReloadInternal =
            isReload ??
            ((!isFixedOutput && !previousFromUiAmt) || (isFixedOutput && !previousToUiAmt));
          if (isReloadInternal) {
            postMessageTyped<ISwapWorkerMessage<IReloadPoolsArgs>>(workerInstance, {
              cmd: 'reloadPools',
              args: {
                ts: now,
                x: fromCoin,
                y: toCoin,
                fixedOut: isFixedOutput,
                maxSteps,
                reloadState: true,
                allowRoundTrip: false,
                customReloadMinInterval: poolReloadMinInterval
              }
            });
          }
        }
      }
    },
    [
      fromCoin,
      fromUiAmt,
      inputTriggerReloadThreshold,
      isAllowHighGas,
      isFixedOutput,
      isInputAmtTriggerReload,
      isWorkerReady,
      poolReloadMinInterval,
      previousFromUiAmt,
      previousToUiAmt,
      resetAllRoutes,
      toCoin,
      toUiAmt,
      workerInstance
    ]
  );

  const [routesSimulatedResults, setRoutesSimulatedResults] = useState<RoutesSimulateResults>(
    new Map()
  );
  const simuTs = useRef(0);
  const [aptBalance, isBalanceReady] = useTokenBalane(
    coinListClient?.getCoinInfoBySymbol('APT')[0]
  );
  const [baseBalance] = useTokenBalane(fromCoin);

  const gasAvailable = useMemo(() => {
    let aptAvailable = 0;
    if (fromCoin?.symbol !== 'APT' && isBalanceReady && aptBalance) {
      aptAvailable = aptBalance;
    } else if (fromCoin?.symbol === 'APT' && isBalanceReady && aptBalance) {
      aptAvailable = aptBalance - (fromUiAmt || 0);
    }
    aptAvailable = Math.max(Math.min(aptAvailable, 0.25), 0);
    return Math.floor(aptToGas(aptAvailable));
  }, [aptBalance, fromCoin?.symbol, fromUiAmt, isBalanceReady]);

  // merge dexes by Hippo or same dex
  const routesToShow: GeneralRouteAndQuote[] = useMemo(() => {
    const mergedRoutes = getMergedRoutes(allRoutes);
    return mergedRoutes.flatMap((route) => {
      if (route.dex === AggregatorTypes.DexType.Hippo) {
        return route.routes.slice(0, 3);
      } else {
        return route.routes.slice(0, 1);
      }
    });
  }, [allRoutes]);

  useEffect(() => {
    const ts = Date.now();
    simuTs.current = ts;
    const simuResults = new Map();
    setRoutesSimulatedResults(simuResults);

    if (
      routesToShow.length > 0 &&
      isBalanceReady &&
      aptBalance &&
      baseBalance &&
      fromUiAmt &&
      aptBalance >= 0.02 &&
      baseBalance >= fromUiAmt
    ) {
      const routesToSimulate = routesToShow.slice(0, 3);

      routesToSimulate.forEach((route) => {
        (async () => {
          const result = await simulateSwapByRoute(
            route,
            ctx.slippageTolerance,
            gasAvailable,
            undefined,
            isFixedOutput
          );
          if (ts === simuTs.current) {
            simuResults.set(serializeRouteQuote(route), result);
            setRoutesSimulatedResults(simuResults);
            if (simuResults.keys.length === routesToSimulate.length) {
              const routeCompareVal = (r: GeneralRouteAndQuote) => {
                const key = serializeRouteQuote(r);
                const simResult = routesSimulatedResults.get(key);
                return simResult?.success && toTokenPrice && aptPrice
                  ? r.quote.outputUiAmt * toTokenPrice - gasToApt(simResult.gas_used) * aptPrice
                  : 0;
              };

              routesToShow.sort((a, b) => routeCompareVal(b) - routeCompareVal(a));

              setSelectedRouteFromRoutes(routesToShow);
            }
          }
        })();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    allRoutes,
    aptBalance,
    baseBalance,
    isBalanceReady,
    simulateSwapByRoute,
    ctx.slippageTolerance
  ]);

  const coingeckoRate = useMemo(
    () => (fromPrice && toTokenPrice ? toTokenPrice / fromPrice : undefined),
    [fromPrice, toTokenPrice]
  );

  useTimeout(
    () => {
      setIsPeriodicRefreshPaused(false);
    },
    isPeriodicRefreshPaused ? error429WaitSeconds * 1_000 : null
  );

  const [minToTokenRateAfterLastInput, setMinToTokenRateAfterLastInput] = useState(Infinity);

  useEffect(() => {
    if (!isFixedOutput && isWorkerReady) {
      fetchSwapRoutes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromCoin, toCoin, fromUiAmt, isWorkerReady, isFixedOutput]);

  useEffect(() => {
    if (isFixedOutput && isWorkerReady) {
      fetchSwapRoutes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromCoin, toCoin, toUiAmt, isWorkerReady, isFixedOutput]);

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
    // Note we compare amount with undefined to avoid initial states
    if (!isFixedOutput && fromUiAmt !== undefined) {
      ctx.setToAmount(routeSelected?.quote.outputUiAmt || 0);
    } else if (isFixedOutput && toUiAmt !== undefined) {
      ctx.setFromAmount(routeSelected?.quote.inputUiAmt || 0);
    }
  }, [routeSelected, ctx, fromUiAmt, toUiAmt, isFixedOutput]);

  const onClickSwapToken = useCallback(() => {
    const tokenFrom = fromCoin;
    const tokenTo = toCoin;
    const amtFrom = fromUiAmt;
    const amtTo = toUiAmt;
    ctx.setFromCoin(tokenTo);
    ctx.setToCoin(tokenFrom);
    ctx.setFromAmount(amtTo);
    ctx.setToAmount(amtFrom);
  }, [ctx, fromCoin, toCoin, fromUiAmt, toUiAmt]);

  const [fromCurrentBalance, isCurrentBalanceReady] = useTokenBalane(fromCoin);
  const isSwapEnabled =
    (hasRoutes && !connected && fromCoin) || // to connect wallet
    (hasRoutes &&
      ctx.quoteChosen &&
      fromUiAmt &&
      (!isCurrentBalanceReady || (fromCurrentBalance && fromUiAmt <= fromCurrentBalance)));

  const swapButtonText = useMemo(() => {
    if (!fromCoin) {
      return 'Loading Tokens...';
    } else if (!hasRoutes) {
      return 'No Available Route';
    } else if (!connected) {
      return 'Connect to Wallet';
    } else if (!fromUiAmt) {
      return 'Enter an Amount';
    } else if (isUserInputChanged) {
      return 'Loading Routes...';
    } else if (isRefreshingRoutes) {
      return 'Refreshing Routes...';
    } else if (
      isCurrentBalanceReady &&
      typeof fromCurrentBalance === 'number' &&
      fromUiAmt > fromCurrentBalance
    ) {
      return 'Insufficient Balance';
    }
    return 'SWAP';
  }, [
    fromCoin,
    hasRoutes,
    connected,
    fromUiAmt,
    isRefreshingRoutes,
    isUserInputChanged,
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
    (ro: GeneralRouteAndQuote, index: number) => {
      setRoute(ro);
      setRouteSelectedSerialized(index === 0 ? '' : serializeRouteQuote(ro));
    },
    [setRoute]
  );

  const getCurrentToTokenRate = useCallback(
    () =>
      routeSelected &&
      !routeSelectedSerialized &&
      fromUiAmt &&
      toUiAmt &&
      routeSelected.quote.inputSymbol === fromCoin?.symbol &&
      routeSelected.quote.outputSymbol === toCoin?.symbol &&
      ((routeSelected.quote.inputUiAmt === fromUiAmt && !isFixedOutput) ||
        (routeSelected.quote.outputUiAmt === toUiAmt && isFixedOutput))
        ? routeSelected.quote.inputUiAmt / routeSelected.quote.outputUiAmt
        : Infinity,
    [
      fromCoin?.symbol,
      fromUiAmt,
      isFixedOutput,
      routeSelected,
      routeSelectedSerialized,
      toCoin?.symbol,
      toUiAmt
    ]
  );

  useEffect(() => {
    const latestToTokenRate = getCurrentToTokenRate();
    if (latestToTokenRate < minToTokenRateAfterLastInput || latestToTokenRate === Infinity) {
      setMinToTokenRateAfterLastInput(latestToTokenRate);
    }
  }, [getCurrentToTokenRate, minToTokenRateAfterLastInput]);

  /*
  console.log(
    `min token rate: ${minToTokenRateAfterLastInput}, current rate: ${getCurrentToTokenRate()}`
  );
  */
  const rateChangeBeforeSubmit = useMemo(() => {
    const currentToTokenRate = getCurrentToTokenRate();
    const change =
      minToTokenRateAfterLastInput &&
      minToTokenRateAfterLastInput !== Infinity &&
      currentToTokenRate !== Infinity
        ? (currentToTokenRate - minToTokenRateAfterLastInput) / minToTokenRateAfterLastInput
        : 0;
    return change;
  }, [getCurrentToTokenRate, minToTokenRateAfterLastInput]);
  const isRateChangeAfterSubmitTooBig = useMemo(
    () => rateChangeBeforeSubmit >= 0.01,
    [rateChangeBeforeSubmit]
  ); // output has decreased to 1 / 1.01 =~ 0.99

  const [isSubmitting, setIsSubmitting] = useState(false);
  const requestSwapByRoute = useHippoClient().requestSwapByRoute;

  const onSwap = useCallback(async () => {
    if (!ctx.quoteChosen) {
      return;
    }
    setIsSubmitting(true);
    try {
      await requestSwapByRoute(
        ctx.quoteChosen,
        ctx.slippageTolerance,
        undefined,
        ctx.isFixedOutput
      );
    } catch {}
    setIsSubmitting(false);
  }, [ctx.isFixedOutput, ctx.quoteChosen, ctx.slippageTolerance, requestSwapByRoute]);

  const isPriceImpactEnabled = !!payValue && parseFloat(payValue) >= 50;

  const priceImpact = useMemo(
    () => Math.abs(routeSelected?.quote.priceImpact || 0),
    [routeSelected?.quote.priceImpact]
  );

  const priceImpactTooHigh = useMemo(() => {
    return isPriceImpactEnabled && priceImpact >= 0.05;
  }, [isPriceImpactEnabled, priceImpact]);

  const hasErrors = useMemo(() => {
    return priceImpactTooHigh || isRateChangeAfterSubmitTooBig;
  }, [isRateChangeAfterSubmitTooBig, priceImpactTooHigh]);

  const { isTablet } = useBreakpoint('tablet');

  const isRoutesVisible =
    // allRoutes.length > 0 &&
    // routeSelected &&
    (!isFixedOutput && !!fromUiAmt) || (isFixedOutput && !!toUiAmt);

  const routesDivRef = useRef<HTMLDivElement>(null);

  const cardXPadding = '32px';
  return (
    <div className="w-full min-h-[620px] tablet:h-auto" ref={swapRef}>
      <TokenSwapHeader
        ctx={ctx}
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
        fromCoinInfo={fromCoin}
        toCoinInfo={toCoin}
        maxGas={isBalanceReady ? gasAvailable : undefined}
      />
      <Card className="w-full min-h-[430px] flex flex-col py-8 relative pointer-events-auto">
        <div
          className="w-full flex flex-col gap-1 mobile:!px-4"
          style={{ paddingLeft: cardXPadding, paddingRight: cardXPadding }}>
          <div className="body-bold mb-2 flex items-end">
            <div className="mr-auto">Pay</div>
            {!!(payValue && fromUiAmt) && (
              <div className="label-large-bold text-grey-500 leading-none">${payValue}</div>
            )}
          </div>
          <CurrencyInput
            ctx={ctx}
            actionType="currencyFrom"
            isDisableAmountInput={!hasRoutes}
            trashButtonContainerWidth={cardXPadding}
          />
          <Button variant="icon" className="mx-auto mt-8" onClick={onClickSwapToken}>
            <SwapIcon className="font-icon text-[35px] text-grey-500" />
          </Button>
          <div className="body-bold mt-1 mb-2 flex items-end">
            <div className="mr-auto">Receive</div>
            {!!(toValue && fromUiAmt) && (
              <div className="label-large-bold text-grey-500 leading-none">${toValue}</div>
            )}
          </div>
          <CurrencyInput ctx={ctx} actionType="currencyTo" isDisableAmountInput={!hasRoutes} />
          {isTablet && isRoutesVisible && (
            <>
              <RoutesAvailable
                className="mt-4 hidden tablet:block"
                routes={routesToShow}
                ctx={ctx}
                routeSelected={routeSelected}
                onRouteSelected={onUserSelectRoute}
                isRefreshing={isRefreshingRoutes}
                isUserInputChanged={isUserInputChanged}
                simuResults={routesSimulatedResults}
                isFixedOutputMode={isFixedOutput}
              />
            </>
          )}
          {!isTablet && (
            <CSSTransition
              nodeRef={routesDivRef}
              appear={!isTablet}
              in={isRoutesVisible}
              // timeout={500}
              addEndListener={(done) => {
                // Use the css transitionend event to mark the finish of a transition
                routesDivRef.current?.addEventListener('transitionend', done, false);
              }}
              mountOnEnter={false}
              unmountOnExit={false}
              classNames="swap-routes-list-trans">
              <div
                ref={routesDivRef}
                className="tablet:hidden absolute top-0 w-[420px] right-[-440px] laptop:w-[368px] laptop:right-[-388px] -z-10 opacity-0">
                <Card className={classNames('px-4 py-8 laptop:px-4')}>
                  <RoutesAvailable
                    isDesktopScreen={true}
                    routes={routesToShow}
                    ctx={ctx}
                    routeSelected={routeSelected}
                    onRouteSelected={onUserSelectRoute}
                    isRefreshing={isRefreshingRoutes}
                    isUserInputChanged={isUserInputChanged}
                    refreshButton={
                      <RefreshButton
                        isDisabled={!refreshRoutesTimerTick}
                        isRefreshing={isRefreshingRoutes}
                        onRefreshClicked={() => fetchSwapRoutes(true)}
                        timePassedAfterRefresh={timePassedAfterRefresh}
                      />
                    }
                    simuResults={routesSimulatedResults}
                    isFixedOutputMode={isFixedOutput}
                  />
                  <SwapDetail
                    ctx={ctx}
                    routeAndQuote={routeSelected}
                    fromToken={fromCoin}
                    toToken={toCoin}
                    coingeckoRate={coingeckoRate}
                    coingeckoApi={coingeckoApi}
                    isPriceImpactEnabled={isPriceImpactEnabled}
                  />
                </Card>
              </div>
            </CSSTransition>
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
              ctx={ctx}
              className="hidden tablet:flex"
              routeAndQuote={routeSelected}
              fromToken={fromCoin}
              toToken={toCoin}
              coingeckoRate={coingeckoRate}
              coingeckoApi={coingeckoApi}
              isPriceImpactEnabled={isPriceImpactEnabled}
            />
          )}
        </div>
      </Card>

      {hasErrors && (
        <Card className="px-8 py-2 my-4">
          {priceImpactTooHigh && (
            <ErrorBody
              title={`Price impact is ${(priceImpact * 100).toFixed(2)}%`}
              detail={'Try reducing your trade size'}
            />
          )}
          {isRateChangeAfterSubmitTooBig && (
            <ErrorBody
              title={`The ${toCoin?.symbol} rate has changed ${(
                rateChangeBeforeSubmit * 100
              ).toFixed(2)}%`}
              detail={
                "after the last input. You may reject the transaction if you haven't approved it."
              }
              titleClassName="text-warn-500"
            />
          )}
        </Card>
      )}
    </div>
  );
};

export default TokenSwap;
