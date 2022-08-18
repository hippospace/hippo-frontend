import Button from 'components/Button';
import { useFormikContext } from 'formik';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, MoreArrowDown, SwapIcon } from 'resources/icons';
import { ISwapSettings } from '../types';
import CurrencyInput from './CurrencyInput';
import SwapDetail from './SwapDetail';
import useHippoClient from 'hooks/useHippoClient';
import useAptosWallet from 'hooks/useAptosWallet';
import { DEX_TYPE_NAME, RouteAndQuote } from '@manahippo/hippo-sdk/dist/aggregator/types';
import classNames from 'classnames';
import { message } from 'antd';
import useTokenBalane from 'hooks/useTokenBalance';

interface IRoutesProps {
  className?: string;
  routes: RouteAndQuote[];
  routeSelected: RouteAndQuote;
  onRouteSelected: (route: RouteAndQuote) => void;
}

interface IRouteRowProps {
  route: RouteAndQuote;
  isSelected?: boolean;
  isBestPrice: boolean;
}

const routeRowHeight = 66;

const RouteRow: React.FC<IRouteRowProps> = ({ route, isSelected = false, isBestPrice = false }) => {
  const swapDexs = route.route.steps.map((s) => DEX_TYPE_NAME[s.pool.dexType]).join(' x ');
  const swapRoutes = [
    route.route.steps[0].xTokenInfo.symbol.str(),
    ...route.route.steps.map((s, index) => (
      <span key={`r-${index}`}>
        <ArrowRight className="font-icon inline-block mx-[2px]" />
        {s.yTokenInfo.symbol.str()}
      </span>
    ))
  ];
  const outputUiAmt = route.quote.outputUiAmt;
  const outputValue = 0; // TOD0: calculate the output value
  return (
    <div className={classNames('pt-2')} style={{ height: `${routeRowHeight}px` }}>
      <div
        className={classNames(
          'relative h-full flex flex-col justify-center bg-primary bg-clip-border rounded-lg p-2 border-2 border-transparent cursor-pointer',
          {
            'border-primePurple-300 bg-primePurple-100': isSelected
          }
        )}>
        <div className="flex justify-between items-center title bold">
          <div>{swapDexs}</div>
          <div>{outputUiAmt}</div>
        </div>
        <div className="flex justify-between items-center small font-bold text-grey-500">
          <div>{swapRoutes}</div>
          <div className="invisible">${outputValue}</div>
        </div>
        {isBestPrice && (
          <div className="absolute -left-[2px] -top-2 h-4 px-2 small font-bold bg-primePurple-300 rounded-lg rounded-bl-none flex items-center text-white">
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
  className = ''
}) => {
  const [isMore, setIsMore] = useState(false);
  const rowsWhenLess = 2;
  const rowsWhenMore = 4;
  const height = `${
    Math.min(routes.length, isMore ? rowsWhenMore : rowsWhenLess) * routeRowHeight
  }px`;
  return (
    <div className={className}>
      <div className="helpText text-grey-500 font-bold mb-1">
        <div>Total {routes.length} routes available</div>
      </div>
      <div
        className={classNames('overflow-x-hidden overflow-y-auto no-scrollbar')}
        style={{ height }}>
        {routes.map((ro, index) => {
          return (
            <div key={`route-${index}`} onClick={() => onRouteSelected(ro)}>
              <RouteRow route={ro} isSelected={ro === routeSelected} isBestPrice={index === 0} />
            </div>
          );
        })}
      </div>
      <div className="flex helpText text-grey-500 font-bold mt-2 justify-between">
        {routes.length > rowsWhenLess && (
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
        )}
      </div>
    </div>
  );
};

const TokenSwap = () => {
  const { values, setFieldValue, submitForm, isSubmitting } = useFormikContext<ISwapSettings>();
  const { activeWallet, openModal } = useAptosWallet();
  const { hippoAgg } = useHippoClient();
  const fromSymbol = values.currencyFrom?.token?.symbol.str() || 'USDC';
  const toSymbol = values.currencyTo?.token?.symbol.str() || 'BTC';
  const fromUiAmt = values.currencyFrom?.amount;
  const [allRoutes, setAllRoutes] = useState<RouteAndQuote[]>([]);
  const [routeSelected, setRouteSelected] = useState<RouteAndQuote | null>(null);

  useEffect(() => {
    if (hippoAgg) {
      if (!values.currencyFrom?.token) {
        setFieldValue(
          'currencyFrom.token',
          hippoAgg.registryClient.getTokenInfoBySymbol(fromSymbol)[0]
        );
      }
      if (!values.currencyTo?.token) {
        setFieldValue(
          'currencyTo.token',
          hippoAgg.registryClient.getTokenInfoBySymbol(toSymbol)[0]
        );
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

  const lastFetchTs = useRef(0);

  const fetchSwapRoutes = useCallback(async () => {
    try {
      if (process.env.NODE_ENV !== 'production') {
        if (lastFetchTs.current !== 0) {
          console.log(`Swap fetch route interval: ${Date.now() - lastFetchTs.current}`);
        }
        lastFetchTs.current = Date.now();
      }
      if (hippoAgg && fromSymbol && toSymbol && fromUiAmt) {
        const [xToken] = hippoAgg.registryClient.getTokenInfoBySymbol(fromSymbol);
        const [yToken] = hippoAgg.registryClient.getTokenInfoBySymbol(toSymbol);

        const routes = await hippoAgg.getQuotes(fromUiAmt, xToken, yToken);
        if (routes.length === 0) {
          throw new Error(
            `No quotes from ${fromSymbol} to ${toSymbol} with input amount ${fromUiAmt}`
          );
        }

        if (!ifInputParametersDifferentWithLatest(fromSymbol, toSymbol, fromUiAmt)) {
          setAllRoutes(routes);
          setRoute(routes[0]);
        }
      } else {
        setAllRoutes([]);
        setRoute(null);
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
    }
  }, [
    hippoAgg,
    fromSymbol,
    toSymbol,
    fromUiAmt,
    ifInputParametersDifferentWithLatest,
    setRoute,
    setFieldValue,
    values.currencyFrom
  ]);

  useEffect(() => {
    fetchSwapRoutes();
  }, [fetchSwapRoutes]);

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

  const [fromCurrentBalance] = useTokenBalane(fromSymbol);
  const isSwapEnabled =
    !activeWallet || (values.quoteChosen && fromUiAmt && fromUiAmt <= fromCurrentBalance);

  return (
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
        <RoutesAvailable
          className="mt-4"
          routes={allRoutes}
          routeSelected={routeSelected}
          onRouteSelected={(ro) => setRoute(ro)}
        />
      )}
      <Button
        isLoading={isSubmitting}
        className="mt-8"
        variant="gradient"
        disabled={!isSwapEnabled}
        onClick={!activeWallet ? openModal : submitForm}>
        {!activeWallet ? 'Connect to Wallet' : 'SWAP'}
      </Button>
      {routeSelected && fromSymbol && toSymbol && (
        <SwapDetail routeAndQuote={routeSelected} fromSymbol={fromSymbol} toSymbol={toSymbol} />
      )}
    </div>
  );
};

export default TokenSwap;
