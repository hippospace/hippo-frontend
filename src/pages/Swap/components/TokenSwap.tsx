import Button from 'components/Button';
import { useFormikContext } from 'formik';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdjustIcon, MoreArrowDown, RefreshIcon, SwapIcon, WarningIcon } from 'resources/icons';
import { ISwapSettings } from '../types';
import CurrencyInput from './CurrencyInput';
import SwapDetail from './SwapDetail';
import useHippoClient from 'hooks/useHippoClient';
import useAptosWallet from 'hooks/useAptosWallet';
import classNames from 'classnames';
import { Drawer, Tooltip, Modal, Skeleton } from 'antd';
import VirtualList from 'rc-virtual-list';
import useTokenBalane from 'hooks/useTokenBalance';
import Card from 'components/Card';
import useTokenAmountFormatter from 'hooks/useTokenAmountFormatter';
import { useInterval, useTimeout } from 'usehooks-ts';
import SwapSetting from './SwapSetting';
import usePrevious from 'hooks/usePrevious';
import { openErrorNotification } from 'utils/notifications';
// import Skeleton from 'components/Skeleton';
import { Types, ApiError } from 'aptos';
import { RPCType, useRPCURL, useRpcEndpoint } from 'components/Settings';
import { useBreakpoint } from 'hooks/useBreakpoint';
import { useCoingeckoPrice } from 'hooks/useCoingecko';
import { useParams } from 'react-router-dom';
import { GeneralRouteAndQuote, IRoutesGroupedByDex } from 'types/hippo';
import { ApiTradeStep } from '@manahippo/hippo-sdk/dist/aggregator/types/step/ApiTradeStep';
import { AggregatorTypes } from '@manahippo/hippo-sdk';
import { RawCoinInfo } from '@manahippo/coin-list';
import SwapRoute from './SwapRoute';
import { aptToGas, gasToApt } from 'utils/aptosUtils';
import PriceSwitch from './PriceSwitch';
import PriceChart from './PriceChart';
import { CSSTransition } from 'react-transition-group';
import './TokenSwap.scss';
import { cutDecimals } from 'components/PositiveFloatNumInput/numberFormats';
import swapAction from 'modules/swap/actions';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { getFromSymbolSaved, getIsPriceChartOpen, getToSymbolSaved } from 'modules/swap/reducer';
import invariant from 'tiny-invariant';
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

type RoutesSimulateResults = Map<string, Types.UserTransaction | undefined>;

interface IRoutesProps {
  className?: string;
  availableRoutesCount: number;
  routes: IRoutesGroupedByDex[];
  routeSelected: GeneralRouteAndQuote | null;
  onRouteSelected: (route: GeneralRouteAndQuote, index: number) => void;
  isDesktopScreen?: boolean;
  isRefreshing?: boolean;
  refreshButton?: ReactNode;
  simuResults?: RoutesSimulateResults;
  isFixedOutputMode?: boolean;
}

interface IRouteRowProps {
  route: GeneralRouteAndQuote;
  isSelected?: boolean;
  isBestPrice: boolean;
  simuResult?: Types.UserTransaction;
}

const serializeRouteQuote = (rq: GeneralRouteAndQuote) => {
  const stepStr = (s: ApiTradeStep) => `${s.dexType}(${s.poolType.toJsNumber()})`;

  const tokensStr = (tokens: RawCoinInfo[]) => tokens.map((t) => t.symbol).join('->');

  const routesStr = (
    r:
      | AggregatorTypes.ApiTradeRoute
      | AggregatorTypes.SplitSingleRoute
      | AggregatorTypes.SplitMultiRoute
  ): string | string[] => {
    if (r instanceof AggregatorTypes.ApiTradeRoute) {
      return r.steps.map((s) => stepStr(s)).join('x') + `:${tokensStr(r.tokens)}`;
    } else if (r instanceof AggregatorTypes.SplitSingleRoute) {
      return (
        r.splitSteps
          .map((ss) =>
            ss.units.map((u) => `${u.scale}*${stepStr(u.step.toApiTradeStep())}`).join('|')
          )
          .join('x') + `:${tokensStr(r.tokens)}`
      );
    } else if (r instanceof AggregatorTypes.SplitMultiRoute) {
      return r.units.map((u) => `[${u.scale}*${routesStr(u.route)}]`);
    } else {
      throw new Error('Invalid route type to print steps');
    }
  };

  // Same dexType might have different poolTypes
  return `${rq.quote.inputUiAmt}->${rq.quote.outputUiAmt}:${routesStr(rq.route)}`;
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

const CardHeader = ({
  className = '',
  right,
  fromToken,
  toToken
}: {
  className?: string;
  right?: ReactNode;
  fromToken: RawCoinInfo | undefined;
  toToken: RawCoinInfo | undefined;
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileTxSettingsOpen, setIsMobileTxSettingsOpen] = useState(false);
  const { isTablet } = useBreakpoint('tablet');
  const isPriceChartOpen = useSelector(getIsPriceChartOpen);
  const setIsPriceChartOpen = (is: boolean) => dispatch(swapAction.SET_IS_PRICE_CHART_OPEN(is));
  const dispatch = useDispatch();
  const { values } = useFormikContext<ISwapSettings>();
  const nodeRef = useRef(null);

  const onSwapSettingsClose = useCallback(() => {
    if (!isTablet) {
      setIsSettingsOpen(false);
    } else {
      setIsMobileTxSettingsOpen(false);
    }
    dispatch(swapAction.SET_SWAP_SETTING(values));
  }, [dispatch, isTablet, values]);

  return (
    <div className={classNames('w-full flex h-8 items-center mb-1 body-medium', className)}>
      <PriceSwitch onUpdate={setIsPriceChartOpen} isStateOn={isPriceChartOpen} />
      <Card className="mr-auto h-full relative w-fit ml-[10px] shadow-subTitle">
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
          width={500}
          destroyOnClose={true}
          onCancel={onSwapSettingsClose}>
          <SwapSetting onClose={onSwapSettingsClose} />
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
          <SwapSetting onClose={onSwapSettingsClose} />
        </Drawer>
      )}
    </div>
  );
};

const routeRowMinHeight = 70;
const RouteRow: React.FC<IRouteRowProps> = ({
  route,
  isSelected = false,
  isBestPrice = false,
  simuResult
}) => {
  const { values } = useFormikContext<ISwapSettings>();
  const toToken = route.route.yCoinInfo;
  const outputUiAmt = route.quote.outputUiAmt;
  const outputValue = 0; // TOD0: calculate the output value
  const [tokenAmountFormatter] = useTokenAmountFormatter();
  const outputFormatted = tokenAmountFormatter(outputUiAmt, toToken);
  const customMaxGasAmount = values.maxGasFee;

  let rowH = routeRowMinHeight;
  if (route.route instanceof AggregatorTypes.SplitMultiRoute) {
    const routesCount = route.route.units.length;
    rowH += (routesCount - 1) * 24;
  }

  const [isShowDetails, setIsShowDetails] = useState(false);

  return (
    <div
      className={classNames('pt-2')}
      style={{ height: `${rowH}px` }}
      onTouchStart={() => setIsShowDetails(true)}
      onTouchEnd={() => setIsShowDetails(false)}
      onMouseEnter={() => setIsShowDetails(true)}
      onMouseLeave={() => setIsShowDetails(false)}>
      <div
        className={classNames(
          'relative h-full flex flex-col justify-center bg-clip-border rounded-lg border-2 cursor-pointer bg-field border-transparent',
          {
            'bg-select-border bg-origin-border bg-cover': isSelected
          }
        )}>
        <div
          className={classNames('w-full h-full px-2 pt-2 pb-[6px] rounded-lg space-y-1', {
            'bg-prime-100/90 dark:bg-prime-900/70': isSelected,
            'bg-field': !isSelected
          })}>
          <div className="flex justify-between items-center body-bold text-grey-700">
            <div className="body-bold mr-1">{outputFormatted}</div>
            <div className="whitespace-nowrap text-grey-500 label-small-bold">
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
                    {gasToApt(simuResult.gas_used).toFixed(6)} APT Gas
                  </div>
                </Tooltip>
              )}
              {simuResult && !simuResult.success && (
                <Tooltip title={simuResult.vm_status}>
                  <div className={'text-error-500'}>Simulation failed</div>
                </Tooltip>
              )}
              <div className="hidden">${outputValue}</div>
            </div>
          </div>
          <div className="text-grey-500 label-small-bold">
            <SwapRoute r={route} isShowDetails={isShowDetails} />
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  availableRoutesCount,
  onRouteSelected,
  routeSelected,
  className = '',
  isDesktopScreen = false,
  // isRefreshing = false,
  refreshButton,
  simuResults = new Map(),
  isFixedOutputMode = false
}) => {
  const isEmpty = !(routes?.length > 0);

  const [isMore, setIsMore] = useState(false);
  const rowsWhenLess = 2;
  const rowsWhenMore = 4;
  const rowsOnDesktop = 4;

  const height = isDesktopScreen
    ? isEmpty
      ? rowsOnDesktop * routeRowMinHeight
      : Math.min(rowsOnDesktop, routes.length) * routeRowMinHeight
    : isEmpty
    ? rowsWhenLess * routeRowMinHeight
    : Math.min(routes.length, isMore ? rowsWhenMore : rowsWhenLess) * routeRowMinHeight;

  const rows = isDesktopScreen ? rowsOnDesktop : isMore ? rowsWhenMore : rowsWhenLess;

  return (
    <div className={className}>
      <div className="label-small-bold text-grey-500 mb-2 flex justify-between items-center">
        {isEmpty ? (
          <div>Loading routes...</div>
        ) : (
          <>
            <div> Routes from all DEXes {isFixedOutputMode && '(Exact-output mode)'}</div>
            <div>{refreshButton}</div>
          </>
        )}
      </div>
      <div
        style={{ height }}
        className={classNames({ 'pointer-events-none': !isDesktopScreen && !isMore })}>
        {isEmpty ? (
          <div className="h-full flex flex-col justify-evenly">
            {new Array(rows).fill(0).map((r, index) => (
              <Skeleton key={index} title={false} paragraph={true} active />
            ))}
          </div>
        ) : (
          <VirtualList
            className="pr-1 scrollbar"
            height={height}
            itemHeight={routeRowMinHeight}
            data={routes}
            itemKey={(item) => serializeRouteQuote(item.routes[0])}>
            {(ro, index) => (
              <div onClick={() => onRouteSelected(ro.routes[0], index)}>
                <RouteRow
                  route={ro.routes[0]}
                  isSelected={ro.routes[0] === routeSelected}
                  isBestPrice={index === 0}
                  simuResult={simuResults.get(serializeRouteQuote(ro.routes[0]))}
                />
              </div>
            )}
          </VirtualList>
        )}
      </div>
      {!isDesktopScreen && !isEmpty && routes.length > rowsWhenLess && (
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

const TokenSwap = () => {
  const {
    fromSymbol: intialFromish,
    toSymbol: initialToish,
    fromAmount: initialFromAmt,
    toAmount: initialToAmt
  } = useParams();

  // console.log('Token swap rendering');

  const { values, setFieldValue, submitForm, isSubmitting } = useFormikContext<ISwapSettings>();
  const { connected, openModal } = useAptosWallet();
  const { coinListClient, simulateSwapByRoute } = useHippoClient();

  const fromToken = values.currencyFrom?.token;
  const toToken = values.currencyTo?.token;

  const isFixedOutput = values.isFixedOutput;
  const fromUiAmt = values.currencyFrom?.amount;
  const toUiAmt = values.currencyTo?.amount;

  const fromSymbolSaved = useSelector(getFromSymbolSaved);
  const toSymbolSaved = useSelector(getToSymbolSaved);

  const [hasRoutes, setHasRoutes] = useState(false);

  const [allRoutes, setAllRoutes] = useState<GeneralRouteAndQuote[]>([]);
  const [routeSelected, setRouteSelected] = useState<GeneralRouteAndQuote | null>(null);
  const [routeSelectedSerialized, setRouteSelectedSerialized] = useState(''); // '' represents the first route
  const [availableRoutesCount, setAvailableRoutesCount] = useState(0);

  const [isRefreshingRoutes, setIsRefreshingRoutes] = useState(false);
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

  const rpcEndpoint = useRpcEndpoint();
  const dispatch = useDispatch();

  // Reduce Coingecko Api requests as much as we can
  const [prices, , coingeckoApi] = useCoingeckoPrice(
    fromUiAmt ? [fromToken, toToken, coinListClient?.getCoinInfoBySymbol('APT')[0]] : undefined
  );
  const fromPrice = fromToken ? prices[fromToken.symbol] : undefined;
  const toTokenPrice = toToken ? prices[toToken.symbol] : undefined;
  const aptPrice = prices.APT;

  const payValue = useMemo(() => {
    if (typeof fromPrice === 'number') {
      return cutDecimals('' + fromPrice * (fromUiAmt || 0), 2);
    }
    return undefined;
  }, [fromPrice, fromUiAmt]);
  const toValue = useMemo(() => {
    if (typeof toTokenPrice === 'number') {
      return cutDecimals('' + toTokenPrice * (values.currencyTo?.amount || 0), 2);
    }
    return undefined;
  }, [toTokenPrice, values.currencyTo?.amount]);

  const isAllowHighGas = useMemo(
    () => !!payValue && !!toValue && (parseFloat(payValue) > 100 || parseFloat(toValue) > 100),
    [payValue, toValue]
  );

  let refreshInterval = 20; // seconds
  let isInputAmtTriggerReload = false;
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

  /*
  const hasRoutes = useMemo(() => {
    return !!(
      fromToken &&
      toToken &&
      hippoAgg?.getAllRoutes(fromToken, toToken, false, 3, false).length
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromToken, hippoAgg, hippoAgg?.allPools, toToken]);
  */
  useEffect(() => {
    if (isWorkerReady && fromToken && toToken && workerInstance) {
      postMessageTyped<ISwapWorkerMessage<IQueryIfRoutesExistingArgs>>(workerInstance, {
        cmd: 'queryIfRoutesExisting',
        args: {
          x: fromToken,
          y: toToken,
          fixedOut: false,
          maxSteps: 3,
          allowRoundTrip: false
        }
      });
    }
  }, [fromToken, isWorkerReady, toToken, workerInstance]);

  useEffect(() => {
    if (coinListClient) {
      if (!values.currencyFrom?.token) {
        const initialFromToken = intialFromish
          ? intialFromish.includes('::')
            ? coinListClient.getCoinInfoByFullName(intialFromish)
            : coinListClient.getCoinInfoBySymbol(intialFromish)[0]
          : coinListClient.getCoinInfoBySymbol(fromSymbolSaved)[0];
        setFieldValue('currencyFrom', {
          ...values.currencyFrom,
          token: initialFromToken
        });
      }
      if (!values.currencyTo?.token) {
        const initailToToken = initialToish
          ? initialToish.includes('::')
            ? coinListClient.getCoinInfoByFullName(initialToish)
            : coinListClient.getCoinInfoBySymbol(initialToish)[0]
          : coinListClient.getCoinInfoBySymbol(toSymbolSaved)[0];
        setFieldValue('currencyTo', {
          ...values.currencyTo,
          token: initailToToken
        });
      }

      if (values.currencyFrom?.amount === undefined && initialFromAmt) {
        setFieldValue('isFixedOutput', false);
        setFieldValue('currencyFrom', {
          ...values.currencyFrom,
          amount: parseFloat(initialFromAmt) || undefined
        });
      }
      if (values.currencyTo?.amount === undefined && initialToAmt) {
        setFieldValue('isFixedOutput', true);
        setFieldValue('currencyTo', {
          ...values.currencyTo,
          amount: parseFloat(initialToAmt) || undefined
        });
      }
    }
  }, [
    initialFromAmt,
    initialToAmt,
    initialToish,
    intialFromish,
    setFieldValue,
    values.currencyFrom,
    values.currencyTo,
    fromSymbolSaved,
    toSymbolSaved,
    coinListClient
  ]);

  useEffect(() => {
    if (fromToken?.symbol) {
      dispatch(swapAction.SET_FROM_SYMBOL_SAVED(fromToken.symbol));
    }
    if (toToken?.symbol) {
      dispatch(swapAction.SET_TO_SYMBOL_SAVED(toToken.symbol));
    }
  }, [dispatch, fromToken?.symbol, toToken?.symbol]);

  useEffect(() => {
    if (fromToken && toToken) {
      // Prevents browser from storing history of every change
      window.history.replaceState(
        {},
        '',
        location.origin +
          `/swap/from/${fromToken.symbol}${
            !isFixedOutput && fromUiAmt ? `/amt/${fromUiAmt}` : ''
          }/to/${toToken.symbol}${isFixedOutput && toUiAmt ? `/amt/${toUiAmt}` : ''}`
      );
    }
  }, [fromToken, toToken, fromUiAmt, isFixedOutput, toUiAmt]);

  const setRoute = useCallback(
    (ro: GeneralRouteAndQuote | null) => {
      setRouteSelected(ro);
      setFieldValue('quoteChosen', ro);
    },
    [setFieldValue]
  );

  const setSelectedRouteFromRoutes = useCallback(
    (routes: GeneralRouteAndQuote[]) => {
      let manuallySelectedRoute: GeneralRouteAndQuote | undefined = undefined;
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
    console.log('Reset all routes');
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
  const previousToUiAmt = usePrevious(toUiAmt);
  /*
  const previousFromToken = usePrevious(fromToken);
  const previousToToken = usePrevious(toToken);
  const tokenPairUnchanged =
    (previousFromToken === fromToken && previousToToken === toToken) ||
    (previousFromToken === toToken && previousToToken === fromToken);
  */

  const resetInputs = useCallback(() => {
    setFieldValue('isFixedOutput', false);
    setFieldValue('currencyFrom', {
      ...values.currencyFrom,
      amount: 0
    });
  }, [setFieldValue, values.currencyFrom]);

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
            setIsRefreshingRoutes(false);
          }
        } else if (message && coinListClient) {
          const data = message.data as ISwapWorkerReturn<unknown>;
          console.log(`Message from worker of cmd: ${data.cmd}`, data.result);

          if (data.cmd === 'fetchRoutes') {
            const { result } = message.data as ISwapWorkerReturn<IFetchRoutesResult>;
            const {
              ts,
              allRoutes: routesByWorker,
              allRoutesCount,
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
                setAvailableRoutesCount(allRoutesCount);
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
            setIsRefreshingRoutes(false);
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
            setIsRefreshingRoutes(false);
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
  useEffect(() => {
    let worker = workerInstance;
    if (!workerInstance) {
      // https://github.com/vercel/next.js/issues/31009#issuecomment-1146344161
      worker = new Worker(new URL('../SwapWorker.ts', import.meta.url));
      setWorkerInstance(worker);
    }
    if (rpcUrl && worker) {
      postMessageTyped<ISwapWorkerMessage<ISwapWorkerInitArgs>>(worker, {
        cmd: 'initWorker',
        args: {
          rpcUrl
        }
      });
    }
    return () => {
      workerInstance?.terminate();
    };
  }, [rpcUrl, workerInstance]);

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
      if (fromToken && toToken && workerInstance && isWorkerReady) {
        const maxSteps = 3;
        // Using isFixedOutput is necessary as the other side amount would not change immediately to 0 when the input amount is cleared
        if ((!isFixedOutput && fromUiAmt) || (isFixedOutput && toUiAmt)) {
          const isReloadInternal =
            isReload ??
            // timePassedRef.current might be bigger than refresh interval due to the requests waiting time
            (isInputAmtTriggerReload && timePassedRef.current > inputTriggerReloadThreshold);
          setIsRefreshingRoutes(isReloadInternal);

          postMessageTyped<ISwapWorkerMessage<IFetchRoutesArgs>>(workerInstance, {
            cmd: 'fetchRoutes',
            args: {
              ts: now,
              inputUiAmt: fromUiAmt as number,
              x: fromToken,
              y: toToken,
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
          const isReloadInternal =
            isReload ??
            ((!isFixedOutput && !previousFromUiAmt) || (isFixedOutput && !previousToUiAmt));
          if (isReloadInternal) {
            postMessageTyped<ISwapWorkerMessage<IReloadPoolsArgs>>(workerInstance, {
              cmd: 'reloadPools',
              args: {
                ts: now,
                x: fromToken,
                y: toToken,
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
      fromToken,
      fromUiAmt,
      inputTriggerReloadThreshold,
      isAllowHighGas,
      isFixedOutput,
      isInputAmtTriggerReload,
      isWorkerReady,
      poolReloadMinInterval,
      previousFromUiAmt,
      previousToUiAmt,
      toToken,
      toUiAmt,
      workerInstance
    ]
  );

  const [routesSimulatedResults, setRoutesSimulatedResults] = useState<RoutesSimulateResults>(
    new Map()
  );
  const simuTs = useRef(0);
  const [aptBalance, isReady] = useTokenBalane(coinListClient?.getCoinInfoBySymbol('APT')[0]);
  const [baseBalance] = useTokenBalane(fromToken);

  const gasAvailable = useMemo(() => {
    let aptAvailable = 0;
    if (fromToken?.symbol !== 'APT' && isReady && aptBalance) {
      aptAvailable = aptBalance;
    } else if (fromToken?.symbol === 'APT' && isReady && aptBalance) {
      aptAvailable = aptBalance - (fromUiAmt || 0);
    }
    aptAvailable = Math.min(aptAvailable, 0.25);
    return Math.floor(aptToGas(aptAvailable));
  }, [aptBalance, fromToken?.symbol, fromUiAmt, isReady]);

  // merge dexes by Hippo or same dex
  const mergedRoutes: IRoutesGroupedByDex[] = useMemo(() => {
    const mRoutes: Map<AggregatorTypes.DexType, GeneralRouteAndQuote[]> = new Map();

    allRoutes.forEach((r) => {
      let dex: AggregatorTypes.DexType | undefined = undefined;
      if (r.route instanceof AggregatorTypes.ApiTradeRoute) {
        const dexes = r.route.steps.map((s) => s.dexType);
        if (dexes.every((d) => d === dexes[0])) {
          dex = dexes[0];
        }
      } else if (r.route instanceof AggregatorTypes.SplitSingleRoute) {
        // do nothing
      } else if (r.route instanceof AggregatorTypes.SplitMultiRoute) {
        const unitRoutes = r.route.units.map((u) => u.route);
        const dexes = unitRoutes.flatMap((ur) =>
          ur.splitSteps.flatMap((ss) => ss.units.map((u) => u.step.pool.dexType))
        );
        if (dexes.every((d) => d === dexes[0])) {
          dex = dexes[0];
        }
      } else {
        throw new Error('Invalid route type for mergedRoutes');
      }

      if (dex === undefined) {
        if (!mRoutes.has(AggregatorTypes.DexType.Hippo)) {
          mRoutes.set(AggregatorTypes.DexType.Hippo, []);
        }
        mRoutes.get(AggregatorTypes.DexType.Hippo)?.push(r);
      } else {
        if (!mRoutes.has(dex)) {
          mRoutes.set(dex, []);
        }
        mRoutes.get(dex)?.push(r);
      }
    });
    const mRoutesValues = Array.from(mRoutes.values());
    invariant(
      mRoutesValues.length === 0 || mRoutesValues.every((routes) => routes.length > 0),
      'Make sure routes in mRoutes is not empty'
    );
    const mRoutesArr = [];
    for (const [key, value] of mRoutes) {
      mRoutesArr.push({
        dex: key,
        routes: value
      });
    }
    mRoutesArr.sort((a, b) => b.routes[0].quote.outputUiAmt - a.routes[0].quote.outputUiAmt);
    return mRoutesArr;
  }, [allRoutes]);

  useEffect(() => {
    const ts = Date.now();
    simuTs.current = ts;
    const simuResults = new Map();
    setRoutesSimulatedResults(simuResults);

    if (
      mergedRoutes.flatMap((mr) => mr.routes).length > 0 &&
      isReady &&
      aptBalance &&
      baseBalance &&
      fromUiAmt &&
      aptBalance >= 0.02 &&
      baseBalance >= fromUiAmt
    ) {
      const routesToSimulate = [
        ...(mergedRoutes.find((m) => m.dex === AggregatorTypes.DexType.Hippo)?.routes.slice(0, 3) ??
          []),
        ...mergedRoutes
          .filter((m) => m.dex !== AggregatorTypes.DexType.Hippo)
          .slice(0, 2)
          .map((mr) => mr.routes[0])
      ];

      routesToSimulate.forEach((route) => {
        (async () => {
          const result = await simulateSwapByRoute(
            route,
            values.slipTolerance,
            gasAvailable,
            undefined,
            isFixedOutput
          );
          if (ts === simuTs.current) {
            simuResults.set(serializeRouteQuote(route), result);
            setRoutesSimulatedResults(simuResults);
            if (simuResults.keys.length === routesToSimulate.length) {
              const hippoRoutes = mergedRoutes.find(
                (mr) => mr.dex === AggregatorTypes.DexType.Hippo
              )?.routes;

              const routeCompareVal = (r: GeneralRouteAndQuote) => {
                const key = serializeRouteQuote(r);
                const simResult = routesSimulatedResults.get(key);
                return simResult?.success && toTokenPrice && aptPrice
                  ? r.quote.outputUiAmt * toTokenPrice - gasToApt(simResult.gas_used) * aptPrice
                  : 0;
              };

              hippoRoutes?.sort((a, b) => routeCompareVal(b) - routeCompareVal(a));
              mergedRoutes.sort(
                (a, b) => routeCompareVal(b.routes[0]) - routeCompareVal(a.routes[0])
              );

              setSelectedRouteFromRoutes(mergedRoutes.flatMap((mr) => mr.routes));
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
    isReady,
    simulateSwapByRoute,
    values.maxGasFee,
    values.slipTolerance
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
  }, [fromToken, toToken, fromUiAmt, isWorkerReady, isFixedOutput]);

  useEffect(() => {
    if (isFixedOutput && isWorkerReady) {
      fetchSwapRoutes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromToken, toToken, toUiAmt, isWorkerReady, isFixedOutput]);

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
      setFieldValue('currencyTo', {
        ...values.currencyTo,
        amount: routeSelected?.quote.outputUiAmt || 0
      });
    } else if (toUiAmt !== undefined) {
      setFieldValue('currencyFrom', {
        ...values.currencyFrom,
        amount: routeSelected?.quote.inputUiAmt || 0
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeSelected, setFieldValue, isFixedOutput]);

  const onClickSwapToken = useCallback(() => {
    const tokenFrom = values.currencyFrom;
    const tokenTo = values.currencyTo;
    setFieldValue('currencyFrom', tokenTo);
    setFieldValue('currencyTo', tokenFrom);
  }, [values, setFieldValue]);

  const [fromCurrentBalance, isCurrentBalanceReady] = useTokenBalane(fromToken);
  const isSwapEnabled =
    (hasRoutes && !connected && values.currencyFrom?.token) || // to connect wallet
    (hasRoutes &&
      values.quoteChosen &&
      fromUiAmt &&
      (!isCurrentBalanceReady || (fromCurrentBalance && fromUiAmt <= fromCurrentBalance)));

  const swapButtonText = useMemo(() => {
    if (!values.currencyFrom?.token) {
      return 'Loading Tokens...';
    } else if (!hasRoutes) {
      return 'No Available Route';
    } else if (!connected) {
      return 'Connect to Wallet';
    } else if (!fromUiAmt) {
      return 'Enter an Amount';
    } else if (isRefreshingRoutes) {
      return 'Loading Routes...';
    } else if (
      isCurrentBalanceReady &&
      typeof fromCurrentBalance === 'number' &&
      fromUiAmt > fromCurrentBalance
    ) {
      return 'Insufficient Balance';
    }
    return 'SWAP';
  }, [
    values.currencyFrom?.token,
    hasRoutes,
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
      routeSelected.quote.inputSymbol === fromToken?.symbol &&
      routeSelected.quote.outputSymbol === toToken?.symbol &&
      ((routeSelected.quote.inputUiAmt === fromUiAmt && !isFixedOutput) ||
        (routeSelected.quote.outputUiAmt === toUiAmt && isFixedOutput))
        ? routeSelected.quote.inputUiAmt / routeSelected.quote.outputUiAmt
        : Infinity,
    [
      fromToken?.symbol,
      fromUiAmt,
      isFixedOutput,
      routeSelected,
      routeSelectedSerialized,
      toToken?.symbol,
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

  const onSwap = useCallback(async () => {
    await submitForm();
  }, [submitForm]);

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
        fromToken={fromToken}
        toToken={toToken}
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
            actionType="currencyFrom"
            isDisableAmountInput={!hasRoutes}
            trashButtonContainerWidth={cardXPadding}
          />
          <Button variant="icon" className="mx-auto my-4" onClick={onClickSwapToken}>
            <SwapIcon className="font-icon text-[40px] text-grey-700" />
          </Button>
          <div className="body-bold mb-2 flex items-end">
            <div className="mr-auto">Receive</div>
            {!!(toValue && fromUiAmt) && (
              <div className="label-large-bold text-grey-500 leading-none">${toValue}</div>
            )}
          </div>
          <CurrencyInput actionType="currencyTo" isDisableAmountInput={!hasRoutes} />
          {isTablet && isRoutesVisible && (
            <>
              <RoutesAvailable
                className="mt-4 hidden tablet:block"
                availableRoutesCount={availableRoutesCount}
                routes={mergedRoutes}
                routeSelected={routeSelected}
                onRouteSelected={onUserSelectRoute}
                isRefreshing={isRefreshingRoutes}
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
                    availableRoutesCount={availableRoutesCount}
                    isDesktopScreen={true}
                    routes={mergedRoutes}
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
                    simuResults={routesSimulatedResults}
                    isFixedOutputMode={isFixedOutput}
                  />
                  <SwapDetail
                    routeAndQuote={routeSelected}
                    fromToken={fromToken}
                    toToken={toToken}
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
              className="hidden tablet:flex"
              routeAndQuote={routeSelected}
              fromToken={fromToken}
              toToken={toToken}
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
              title={`The ${toToken?.symbol} rate has changed ${(
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
