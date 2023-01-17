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
import { RPCType, useRpcEndpoint } from 'components/Settings';
import { useBreakpoint } from 'hooks/useBreakpoint';
import { useCoingeckoPrice } from 'hooks/useCoingecko';
import { useParams } from 'react-router-dom';
import { GeneralRouteAndQuote } from 'types/hippo';
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

interface IRoutesProps {
  className?: string;
  availableRoutesCount: number;
  routes: GeneralRouteAndQuote[];
  routeSelected: GeneralRouteAndQuote | null;
  onRouteSelected: (route: GeneralRouteAndQuote, index: number) => void;
  isDesktopScreen?: boolean;
  isRefreshing?: boolean;
  refreshButton?: ReactNode;
  simuResults?: Types.UserTransaction[];
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
  ) => {
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
  fromToken: RawCoinInfo;
  toToken: RawCoinInfo;
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileTxSettingsOpen, setIsMobileTxSettingsOpen] = useState(false);
  const { isTablet } = useBreakpoint('tablet');
  const [isPriceChartOpen, setIsPriceChartOpen] = useState(false);

  const nodeRef = useRef(null);

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
          onCancel={() => setIsSettingsOpen(false)}>
          <SwapSetting onClose={() => setIsSettingsOpen(false)} />
        </Modal>
      )}
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

  return (
    <div className={classNames('pt-2')} style={{ height: `${rowH}px` }}>
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
            <SwapRoute r={route} />
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
  simuResults = [],
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
            <div>
              Total {availableRoutesCount} routes available{' '}
              {isFixedOutputMode && '(Fixed receive mode)'}
            </div>
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
  const { hippoAgg, simulateSwapByRoute } = useHippoClient();

  const fromToken = values.currencyFrom?.token;
  const toToken = values.currencyTo?.token;

  const isFixedOutput = values.isFixedOutput;
  const fromUiAmt = values.currencyFrom?.amount;
  const toUiAmt = values.currencyTo?.amount;

  const [allRoutes, setAllRoutes] = useState<GeneralRouteAndQuote[]>([]);
  const [routeSelected, setRouteSelected] = useState<GeneralRouteAndQuote | null>(null);
  const [routeSelectedSerialized, setRouteSelectedSerialized] = useState(''); // '' represents the first route
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
    isInputAmtTriggerReload = false;
    inputTriggerReloadThreshold = 60;
    poolReloadMinInterval = 20_000; // ms!
    error429WaitSeconds = 5 * 60;
  }

  const hasRoute = useMemo(() => {
    return !!(
      fromToken &&
      toToken &&
      hippoAgg.getAllRoutes(fromToken, toToken, false, 3, false).length > 0
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromToken, hippoAgg, hippoAgg.allPools, toToken]);

  useEffect(() => {
    if (hippoAgg) {
      if (!values.currencyFrom?.token) {
        const initialFromToken =
          (intialFromish?.includes('::')
            ? hippoAgg.coinListClient.getCoinInfoByFullName(intialFromish)
            : hippoAgg.coinListClient.getCoinInfoBySymbol(intialFromish)[0]) ||
          hippoAgg.coinListClient.getCoinInfoBySymbol('USDC')[0];
        setFieldValue('currencyFrom', {
          ...values.currencyFrom,
          token: initialFromToken
        });
      }
      if (!values.currencyTo?.token) {
        const initailToToken =
          (initialToish?.includes('::')
            ? hippoAgg.coinListClient.getCoinInfoByFullName(initialToish)
            : hippoAgg.coinListClient.getCoinInfoBySymbol(initialToish)[0]) ||
          hippoAgg.coinListClient.getCoinInfoBySymbol('APT')[0];
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
    hippoAgg,
    initialFromAmt,
    initialToAmt,
    initialToish,
    intialFromish,
    setFieldValue,
    values.currencyFrom,
    values.currencyTo
  ]);

  useEffect(() => {
    if (window.history.replaceState && fromToken && toToken) {
      // Prevents browser from storing history with each change
      window.history.replaceState(
        {},
        null,
        location.origin +
          `/swap/from/${fromToken.symbol}${
            !isFixedOutput && fromUiAmt ? `/amt/${fromUiAmt}` : ''
          }/to/${toToken.symbol}${isFixedOutput && toUiAmt ? `/amt/${toUiAmt}` : ''}`
      );
    }
  }, [fromToken, toToken, fromUiAmt, isFixedOutput, toUiAmt]);

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
    (ro: GeneralRouteAndQuote | null) => {
      setRouteSelected(ro);
      setFieldValue('quoteChosen', ro);
    },
    [setFieldValue]
  );

  const setSelectedRouteFromRoutes = useCallback(
    (routes: GeneralRouteAndQuote[]) => {
      let manuallySelectedRoute: GeneralRouteAndQuote;
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

        // console.log(`FetchSwapRoutes: timePassedRef.current: ${timePassedRef.current}`);
        if (hippoAgg && fromToken && toToken) {
          const maxSteps = 3;
          // Using isFixedOutput is necessary as the other side amount would not change immediately to 0 when the input amount is cleared
          if ((!isFixedOutput && fromUiAmt) || (isFixedOutput && toUiAmt)) {
            const isReloadInternal =
              isReload ??
              // timePassedRef.current might be bigger than refresh interval due to the requests waiting time
              (isInputAmtTriggerReload && timePassedRef.current > inputTriggerReloadThreshold);
            setIsRefreshingRoutes(isReloadInternal);

            const { routes, allRoutesCount } = await (async () => {
              if (!isFixedOutput) {
                console.time('GetQuotes');
                const [routeAndQuotes, splitSingle, splitMulti] = await hippoAgg.getQuotesV1V2V3(
                  fromUiAmt,
                  fromToken,
                  toToken,
                  maxSteps,
                  isReloadInternal,
                  false,
                  poolReloadMinInterval
                );
                console.timeEnd('GetQuotes');
                const apiRoutes: GeneralRouteAndQuote[] = routeAndQuotes.map((r) => ({
                  ...r,
                  route: r.route.toApiTradeRoute()
                }));
                if (splitSingle.length > 0) {
                  console.log('Split single has a better output');
                  apiRoutes.push(...splitSingle);
                }
                if (
                  splitMulti.length > 0 &&
                  splitMulti[0].quote.outputUiAmt > apiRoutes[0].quote.outputUiAmt
                ) {
                  console.log('Split multi has a better output');
                  apiRoutes.unshift(splitMulti[0]);
                }
                /*
                if (splitMulti.length > 0) {
                  apiRoutes.push(...splitMulti);
                }
                */
                apiRoutes.sort((a, b) => b.quote.outputUiAmt - a.quote.outputUiAmt);
                return {
                  allRoutesCount: routeAndQuotes.length,
                  routes: apiRoutes
                };
              } else {
                const routeAndQuote = await hippoAgg.getQuotesWithFixedOutputWithChange(
                  toUiAmt,
                  fromToken,
                  toToken,
                  isReloadInternal,
                  false,
                  poolReloadMinInterval
                );
                const fixedOutputRoutes = [routeAndQuote].map((r) => ({
                  ...r,
                  route: r.route.toApiTradeRoute()
                }));
                return {
                  allRoutesCount: fixedOutputRoutes.length,
                  routes: fixedOutputRoutes
                };
              }
            })();

            // check if it's the latest reqeust
            if (now === lastFetchTs.current) {
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
          } else {
            const isReloadInternal =
              isReload ??
              ((!isFixedOutput && !(previousFromUiAmt > 0)) ||
                (isFixedOutput && !(previousToUiAmt > 0)));
            if (isReloadInternal) {
              await hippoAgg.reloadPools(
                fromToken,
                toToken,
                isFixedOutput,
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

        resetInputs();
      } finally {
        setIsRefreshingRoutes(false);
      }
    },
    [
      fromToken,
      fromUiAmt,
      hippoAgg,
      inputTriggerReloadThreshold,
      isFixedOutput,
      isInputAmtTriggerReload,
      poolReloadMinInterval,
      previousFromUiAmt,
      previousToUiAmt,
      resetAllRoutes,
      resetInputs,
      restartTimer,
      setSelectedRouteFromRoutes,
      toToken,
      toUiAmt
    ]
  );

  const [simulateResults, setSimulateResults] = useState<(Types.UserTransaction | null)[]>([]);
  const simuTs = useRef(0);
  const [aptBalance, isReady] = useTokenBalane(
    hippoAgg.coinListClient.getCoinInfoBySymbol('APT')[0]
  );
  const [baseBalance] = useTokenBalane(fromToken);

  const gasAvailable = useMemo(() => {
    let aptAvailable = 0;
    if (fromToken?.symbol !== 'APT' && isReady) {
      aptAvailable = aptBalance;
    } else if (fromToken?.symbol === 'APT' && isReady) {
      aptAvailable = aptBalance - (fromUiAmt || 0);
    }
    aptAvailable = Math.min(aptAvailable, 0.25);
    return Math.floor(aptToGas(aptAvailable));
  }, [aptBalance, fromToken?.symbol, fromUiAmt, isReady]);

  const simuCount = 4;
  useEffect(() => {
    const ts = Date.now();
    simuTs.current = ts;
    setSimulateResults([]);
    if (allRoutes.length > 0 && isReady && aptBalance >= 0.02 && baseBalance >= fromUiAmt) {
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
          const result = await simulateSwapByRoute(
            route,
            values.slipTolerance,
            gasAvailable,
            undefined,
            isFixedOutput
          );
          if (!results[i] && ts === simuTs.current) {
            // debug
            // if (i === 0) result.success = false;
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

  // Reduce Coingecko Api requests as much as we can
  const [prices, , coingeckoApi] = useCoingeckoPrice(
    fromUiAmt > 0
      ? [fromToken, toToken, hippoAgg.coinListClient.getCoinInfoBySymbol('APT')[0]]
      : undefined
  );

  const [fromPrice, toTokenPrice, aptPrice] = (prices as number[]) || [];

  const payValue = useMemo(() => {
    if (typeof fromPrice === 'number') {
      return cutDecimals('' + fromPrice * fromUiAmt, 2);
    }
    return undefined;
  }, [fromPrice, fromUiAmt]);
  const toValue = useMemo(() => {
    if (typeof toTokenPrice === 'number') {
      return cutDecimals('' + toTokenPrice * (values.currencyTo?.amount || 0), 2);
    }
    return undefined;
  }, [toTokenPrice, values.currencyTo?.amount]);

  const coingeckoRate = useMemo(
    () => (fromPrice && toTokenPrice ? toTokenPrice / fromPrice : undefined),
    [fromPrice, toTokenPrice]
  );

  const routesSortedBySimResults = useMemo(() => {
    if (simulateResults.every((s) => !!s)) {
      const routesSim = allRoutes.map((r, i) => ({
        route: r,
        simRes: simulateResults[i],
        compVal:
          simulateResults[i]?.success && toTokenPrice && aptPrice
            ? r.quote.outputUiAmt * toTokenPrice - gasToApt(simulateResults[i].gas_used) * aptPrice
            : 0
      }));
      routesSim.sort((rsa, rsb) => rsb.compVal - rsa.compVal);
      /*
      console.log(
        `simu res: ${routesSim
          .slice(0, 4)
          .map((rs) => rs.compVal)
          .join(' ,')}. ${aptPrice} ${toTokenPrice}`
      );
      */
      const routes = routesSim.map((rs) => rs.route);
      setSelectedRouteFromRoutes(routes);
      return {
        routes,
        simulateResults: routesSim.slice(0, simuCount).map((rs) => rs.simRes)
      };
    } else {
      return {
        routes: allRoutes,
        simulateResults
      };
    }
  }, [allRoutes, aptPrice, setSelectedRouteFromRoutes, simulateResults, toTokenPrice]);

  useTimeout(
    () => {
      setIsPeriodicRefreshPaused(false);
    },
    isPeriodicRefreshPaused ? error429WaitSeconds * 1_000 : null
  );

  const [minToTokenRateAfterLastInput, setMinToTokenRateAfterLastInput] = useState(Infinity);

  useEffect(() => {
    if (!isFixedOutput) {
      fetchSwapRoutes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromToken, toToken, fromUiAmt, hippoAgg, isFixedOutput]);

  useEffect(() => {
    if (isFixedOutput) {
      fetchSwapRoutes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromToken, toToken, toUiAmt, hippoAgg, isFixedOutput]);

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
    (hasRoute && !connected && values.currencyFrom?.token) || // to connect wallet
    (hasRoute &&
      values.quoteChosen &&
      fromUiAmt &&
      (!isCurrentBalanceReady || (fromCurrentBalance && fromUiAmt <= fromCurrentBalance)));

  const swapButtonText = useMemo(() => {
    if (!values.currencyFrom?.token) {
      return 'Loading Tokens...';
    } else if (!hasRoute) {
      return 'No Available Route';
    } else if (!connected) {
      return 'Connect to Wallet';
    } else if (!fromUiAmt) {
      return 'Enter an Amount';
    } else if (isRefreshingRoutes) {
      return 'Loading Routes...';
    } else if (isCurrentBalanceReady && fromUiAmt > fromCurrentBalance) {
      return 'Insufficient Balance';
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

  const isPriceImpactEnabled = payValue && parseFloat(payValue) >= 50;

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
    (!isFixedOutput && fromUiAmt > 0) || (isFixedOutput && toUiAmt > 0);

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
            {payValue && fromUiAmt > 0 && (
              <div className="label-large-bold text-grey-500 leading-none">${payValue}</div>
            )}
          </div>
          <CurrencyInput
            actionType="currencyFrom"
            isDisableAmountInput={!hasRoute}
            trashButtonContainerWidth={cardXPadding}
          />
          <Button variant="icon" className="mx-auto my-4" onClick={onClickSwapToken}>
            <SwapIcon className="font-icon text-[40px] text-grey-700" />
          </Button>
          <div className="body-bold mb-2 flex items-end">
            <div className="mr-auto">Receive</div>
            {toValue && fromUiAmt > 0 && (
              <div className="label-large-bold text-grey-500 leading-none">${toValue}</div>
            )}
          </div>
          <CurrencyInput actionType="currencyTo" isDisableAmountInput={!hasRoute} />
          {isTablet && isRoutesVisible && (
            <>
              <RoutesAvailable
                className="mt-4 hidden tablet:block"
                availableRoutesCount={availableRoutesCount}
                routes={routesSortedBySimResults.routes}
                routeSelected={routeSelected}
                onRouteSelected={onUserSelectRoute}
                isRefreshing={isRefreshingRoutes}
                simuResults={routesSortedBySimResults.simulateResults}
                isFixedOutputMode={isFixedOutput}
              />
            </>
          )}
          {!isTablet && (
            <CSSTransition
              nodeRef={routesDivRef}
              in={isRoutesVisible}
              // timeout={500}
              addEndListener={(done) => {
                // Use the css transitionend event to mark the finish of a transition
                routesDivRef.current.addEventListener('transitionend', done, false);
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
                    routes={routesSortedBySimResults.routes}
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
                    simuResults={routesSortedBySimResults.simulateResults}
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
              title={`The ${toToken.symbol} rate has changed ${(
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
