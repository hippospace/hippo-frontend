import Button from 'components/Button';
import { useFormikContext } from 'formik';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdjustIcon, ArrowRight, MoreArrowDown, RefreshIcon, SwapIcon } from 'resources/icons';
import { ISwapSettings } from '../types';
import CurrencyInput from './CurrencyInput';
import SwapDetail from './SwapDetail';
import useHippoClient from 'hooks/useHippoClient';
import useAptosWallet from 'hooks/useAptosWallet';
import { AggregatorTypes } from '@manahippo/hippo-sdk';
import classNames from 'classnames';
import { Drawer, Tooltip } from 'antd';
import useTokenBalane from 'hooks/useTokenBalance';
import Card from 'components/Card';
import useTokenAmountFormatter from 'hooks/useTokenAmountFormatter';
import { useInterval } from 'usehooks-ts';
import SwapSetting from './SwapSetting';
import usePrevious from 'hooks/usePrevious';
import { RouteAndQuote } from '@manahippo/hippo-sdk/dist/aggregator/types';
import { openErrorNotification } from 'utils/notifications';
// import Skeleton from 'components/Skeleton';
import { Types, ApiError } from 'aptos';

interface IRoutesProps {
  className?: string;
  routes: AggregatorTypes.RouteAndQuote[];
  routeSelected: AggregatorTypes.RouteAndQuote | null;
  onRouteSelected: (route: AggregatorTypes.RouteAndQuote, index: number) => void;
  isDesktopScreen?: boolean;
  isRefreshing?: boolean;
  refreshButton?: ReactNode;
  simuResults?: Types.UserTransaction[];
}

interface IRouteRowProps {
  route: AggregatorTypes.RouteAndQuote;
  isSelected?: boolean;
  isBestPrice: boolean;
  simuResult?: Types.UserTransaction;
}

const serializeRouteQuote = (rq: RouteAndQuote) => {
  return `${rq.quote.inputUiAmt}:${rq.route.steps
    .map((s) => s.pool.dexType)
    .join('x')}:${rq.route.tokens.map((t) => t.symbol.str()).join('->')}`;
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
  return (
    <div className={classNames('w-full flex h-8 items-center mb-1 body-medium', className)}>
      <Card className="mr-auto h-full relative w-fit">
        <SettingsButton
          className="tablet:hidden mobile:hidden"
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        />
        <SettingsButton
          className="cursor-pointer hidden mobile:flex tablet:flex"
          onClick={() => setIsMobileTxSettingsOpen(true)}
        />
        <Card
          className={classNames(
            'absolute top-9 w-[400px] -left-[420px] px-8 laptop:w-[368px] laptop:-left-[calc(368px+20px)] py-8 laptop:px-4 tablet:hidden scale-[50%] origin-top-right opacity-0 transition-all',
            { '!opacity-100 !scale-100': isSettingsOpen }
          )}>
          <SwapSetting onClose={() => setIsSettingsOpen(false)} />
        </Card>
      </Card>
      {right}
      <Drawer
        height={'auto'}
        closable={false}
        title={<div className="body-bold text-black">Transaction Settings</div>}
        placement={'bottom'}
        onClose={() => setIsMobileTxSettingsOpen(false)}
        visible={isMobileTxSettingsOpen}>
        <SwapSetting onClose={() => setIsMobileTxSettingsOpen(false)} />
      </Drawer>
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
    .map((s) => AggregatorTypes.DEX_TYPE_NAME[s.pool.dexType])
    .join(' x ');
  const swapRoutes = [
    route.route.steps[0].xCoinInfo.symbol.str(),
    ...route.route.steps.map((s, index) => (
      <span key={`r-${index}`}>
        <ArrowRight className="font-icon inline-block mx-[2px]" />
        {s.yCoinInfo.symbol.str()}
      </span>
    ))
  ];
  const { values } = useFormikContext<ISwapSettings>();
  const toSymbol = route.route.steps.slice(-1)[0].yCoinInfo.symbol.str();
  const outputUiAmt = route.quote.outputUiAmt;
  const outputValue = 0; // TOD0: calculate the output value
  const [tokenAmountFormatter] = useTokenAmountFormatter();
  const outputFormatted = tokenAmountFormatter(outputUiAmt, toSymbol);
  const customMaxGasAmount = values.maxGasFee;

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
          className={classNames('w-full h-full p-2 rounded-lg space-y-1', {
            'bg-prime-100': isSelected,
            'bg-grey-100': !isSelected
          })}>
          <div className="flex justify-between items-center body-bold text-grey-700">
            <div className="truncate" title={swapDexs}>
              {swapDexs}
            </div>
            <div className="body-bold">{outputFormatted}</div>
          </div>
          <div className="flex gap-x-4 justify-between items-center label-large-bold text-grey-500 laptop:label-small-bold">
            <div className="mr-auto truncate">{swapRoutes}</div>
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
    ? `${Math.min(rowsOnDesktop, routes.length) * routeRowHeight}px`
    : `${Math.min(routes.length, isMore ? rowsWhenMore : rowsWhenLess) * routeRowHeight}px`;

  // const rows = isDesktopScreen ? rowsOnDesktop : isMore ? rowsWhenMore : rowsWhenLess;
  return (
    <div className={className}>
      <div className="label-small-bold text-grey-500 mb-2 flex justify-between items-center">
        <div>Total {routes.length} routes available</div>
        <div>{refreshButton}</div>
      </div>
      <div
        className={classNames('overflow-x-hidden overflow-y-auto pr-1', {
          'no-scrollbar': !isDesktopScreen,
          scrollbar: isDesktopScreen
        })}
        style={{ height }}>
        {routeSelected &&
          routes.map((ro, index) => {
            return (
              <div key={`route-${index}`} onClick={() => onRouteSelected(ro, index)}>
                <RouteRow
                  route={ro}
                  isSelected={ro === routeSelected}
                  isBestPrice={index === 0}
                  simuResult={simuResults[index]}
                />
              </div>
            );
          })}
        {/* isRefreshing && (
          <div className="h-full flex flex-col justify-around">
            {new Array(rows).fill(1).map((_, index) => (
              <div
                key={`ske-${index}`}
                style={{ height: `${routeRowHeight}px` }}
                className="py-1 leading-none space-y-1">
                <div>
                  <Skeleton width={'80%'} />
                </div>
                <div>
                  <Skeleton />
                </div>
              </div>
            ))}
          </div>
        ) */}
      </div>
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

const REFRESH_INTERVAL = 15; // seconds
const TokenSwap = () => {
  const { values, setFieldValue, submitForm, isSubmitting } = useFormikContext<ISwapSettings>();
  const { connected, openModal } = useAptosWallet();
  const { hippoAgg, simulateSwapByRoute } = useHippoClient();
  const fromSymbol = values.currencyFrom?.token?.symbol.str() || 'USDC';
  const toSymbol = values.currencyTo?.token?.symbol.str() || 'APT';
  const fromUiAmt = values.currencyFrom?.amount;
  const [allRoutes, setAllRoutes] = useState<AggregatorTypes.RouteAndQuote[]>([]);
  const [routeSelected, setRouteSelected] = useState<AggregatorTypes.RouteAndQuote | null>(null);
  const [routeSelectedSerialized, setRouteSelectedSerialized] = useState('');

  const [isRefreshingRoutes, setIsRefreshingRoutes] = useState(false);
  const [hasRoute, setHasRoute] = useState(false);
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
  }, [fromSymbol, hippoAgg, setFieldValue, toSymbol, values.currencyFrom, values.currencyTo]);

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
    (ro: AggregatorTypes.RouteAndQuote | null) => {
      setRouteSelected(ro);
      setFieldValue('quoteChosen', ro);
    },
    [setFieldValue]
  );

  const setRouteFromRoutes = useCallback(
    (routes: AggregatorTypes.RouteAndQuote[]) => {
      let manuallySelectedRoute: RouteAndQuote;
      if (routeSelectedSerialized) {
        manuallySelectedRoute = routes.find(
          (r) => serializeRouteQuote(r) === routeSelectedSerialized
        );
      }
      setRoute(manuallySelectedRoute || routes[0] || null);
    },
    [routeSelectedSerialized, setRoute]
  );

  // To benchmark the key press debounce
  const lastFetchTs = useRef(0);

  const fetchSwapRoutes = useCallback(
    async (isReload = true) => {
      try {
        if (process.env.NODE_ENV !== 'production') {
          if (lastFetchTs.current !== 0) {
            console.log(
              `Swap fetch route interval: ${
                Date.now() - lastFetchTs.current
              }, isReload: ${isReload}`
            );
          }
          lastFetchTs.current = Date.now();
        }

        let routes: RouteAndQuote[] | AggregatorTypes.TradeRoute[] = [];
        if (hippoAgg && fromSymbol && toSymbol) {
          const xToken = hippoAgg.registryClient.getCoinInfoBySymbol(fromSymbol);
          const yToken = hippoAgg.registryClient.getCoinInfoBySymbol(toSymbol);

          setIsRefreshingRoutes(isReload);

          if (fromUiAmt) {
            const maxSteps = 3;
            routes = await hippoAgg.getQuotes(fromUiAmt, xToken, yToken, maxSteps, isReload);
            routes = routes.filter((r) => r.quote.outputUiAmt > 0);
            // check if parameters are not stale
            if (
              routes.length > 0 &&
              !ifInputParametersDifferentWithLatest(fromSymbol, toSymbol, fromUiAmt)
            ) {
              setAllRoutes(routes);
              setRouteFromRoutes(routes);
              if (isReload) {
                // restart interval timer
                setTimePassedAfterRefresh(0);
                // random is used to make useInterval restart
                setRefreshRoutesTimerTick(1_000 + 0.00001 * Math.random());
              }
            }
          } else {
            routes = hippoAgg.getAllRoutes(xToken, yToken);
          }
        }

        setHasRoute(routes.length > 0);
        if (!fromUiAmt || routes.length === 0) {
          setAllRoutes([]);
          setRoute(null);
          setRouteSelectedSerialized('');
          setRefreshRoutesTimerTick(null); // stop timer
        }
      } catch (error) {
        console.log('Fetch swap routes:', error);
        if (error instanceof ApiError) {
          // let detail = `${error.status} : ${error.errorCode} : ${error.vmErrorCode} : ${error.message}`;
          let detail = error.message;
          const msg = JSON.parse(error.message);
          if (msg.message === 'Generic Error') {
            detail = 'Too many requests. You need to wait 60s and try again';
          }
          openErrorNotification({ detail, title: 'Fetch API error' });
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
      fromSymbol,
      fromUiAmt,
      hippoAgg,
      ifInputParametersDifferentWithLatest,
      setFieldValue,
      setRoute,
      setRouteFromRoutes,
      toSymbol,
      values.currencyFrom
    ]
  );

  const [simulateResults, setSimulateResults] = useState<(Types.UserTransaction | null)[]>([]);
  const simuTs = useRef(0);
  const [aptBalance, isReady] = useTokenBalane('APT');
  const [baseBalance] = useTokenBalane(values.currencyFrom?.token?.symbol.str());

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

  const timePassedRef = useRef(0);
  timePassedRef.current = timePassedAfterRefresh;
  const inputTriggerRefreshDelay = 10;
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

  const onClickSwapToken = useCallback(() => {
    const tokenFrom = values.currencyFrom;
    const tokenTo = values.currencyTo;
    setFieldValue('currencyFrom', tokenTo);
    setFieldValue('currencyTo', tokenFrom);
  }, [values, setFieldValue]);

  const [fromCurrentBalance, isCurrentBalanceReady] = useTokenBalane(fromSymbol);
  const isSwapEnabled =
    (hasRoute && !connected && values.currencyFrom?.token) || // to connect wallet
    (values.quoteChosen &&
      fromUiAmt &&
      fromCurrentBalance &&
      fromUiAmt <= fromCurrentBalance &&
      !isRefreshingRoutes);

  const swapButtonText = useMemo(() => {
    if (!values.currencyFrom?.token) {
      return 'Loading Tokens...';
    } else if (!hasRoute) {
      return 'No Available Route';
    } else if (!connected) {
      return 'Connect to Wallet';
    } else if (!isCurrentBalanceReady) {
      return 'Loading Balance...';
    } else if (!fromUiAmt) {
      return 'Enter an Amount';
    } else if (!fromCurrentBalance || fromUiAmt > fromCurrentBalance) {
      return 'Insufficient Balance';
    } else if (isRefreshingRoutes) {
      return 'Loading Routes...';
    } else if (!values.quoteChosen) {
      return 'No Available Route';
    }
    return 'SWAP';
  }, [
    connected,
    fromCurrentBalance,
    fromUiAmt,
    isCurrentBalanceReady,
    values.currencyFrom?.token,
    isRefreshingRoutes,
    values.quoteChosen,
    hasRoute
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
    (ro: RouteAndQuote, index: number) => {
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

  const cardXPadding = '32px';
  return (
    <div className="w-full" ref={swapRef}>
      <CardHeader
        className="pointer-events-auto"
        right={
          <RefreshButton
            className="hidden tablet:block"
            isDisabled={!refreshRoutesTimerTick}
            isRefreshing={isRefreshingRoutes}
            onRefreshClicked={fetchSwapRoutes}
            timePassedAfterRefresh={timePassedAfterRefresh}
          />
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
            <SwapIcon />
          </Button>
          <div className="body-bold mb-2 flex">
            <div className="mr-auto">Receive</div>
          </div>
          <CurrencyInput actionType="currencyTo" />
          {allRoutes.length > 0 && routeSelected && (
            <>
              <RoutesAvailable
                className="mt-4 hidden tablet:block"
                routes={allRoutes}
                routeSelected={routeSelected}
                onRouteSelected={onUserSelectRoute}
                isRefreshing={isRefreshingRoutes}
                simuResults={simulateResults}
              />
            </>
          )}
          <Card
            className={classNames(
              'tablet:hidden absolute top-0 w-[420px] right-[-440px] px-4 laptop:w-[368px] laptop:right-[-388px] py-8 laptop:px-4 transition-[opacity,transform] opacity-0 -translate-x-[30%] -z-10',
              { 'opacity-100 !translate-x-0': allRoutes.length > 0 && routeSelected }
            )}>
            <RoutesAvailable
              isDesktopScreen={true}
              routes={allRoutes}
              routeSelected={routeSelected}
              onRouteSelected={onUserSelectRoute}
              isRefreshing={isRefreshingRoutes}
              refreshButton={
                <RefreshButton
                  isDisabled={!refreshRoutesTimerTick}
                  isRefreshing={isRefreshingRoutes}
                  onRefreshClicked={fetchSwapRoutes}
                  timePassedAfterRefresh={timePassedAfterRefresh}
                />
              }
              simuResults={simulateResults}
            />
            {routeSelected && (
              <SwapDetail
                routeAndQuote={routeSelected}
                fromSymbol={fromSymbol}
                toSymbol={toSymbol}
              />
            )}
          </Card>
          <Button
            isLoading={isSubmitting}
            className="mt-8"
            variant="gradient"
            disabled={!isSwapEnabled}
            onClick={!connected ? openModal : onSwap}>
            {swapButtonText}
          </Button>
          {routeSelected && (
            <SwapDetail
              className="hidden tablet:flex"
              routeAndQuote={routeSelected}
              fromSymbol={fromSymbol}
              toSymbol={toSymbol}
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default TokenSwap;
