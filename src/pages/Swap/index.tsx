import { useEffect, useState } from 'react';
import TokenSwap from './components/TokenSwap';
import { useParams } from 'react-router-dom';
import { GeneralRouteAndQuote } from 'types/hippo';
import { RawCoinInfo } from '@manahippo/coin-list';
import useHippoClient from 'hooks/useHippoClient';

export interface SwapContextType {
  isPriceChartOpen: boolean;
  isFixedOutput: boolean;
  // in percentage
  slippageTolerance: number;
  // in seconds
  transactionDeadline: number;
  // in aptos gas units
  maxGasFee: number;
  quoteChosen: GeneralRouteAndQuote | undefined;

  fromCoin: RawCoinInfo | undefined;
  fromAmount: number;

  toCoin: RawCoinInfo | undefined;
  toAmount: number;

  setIsPriceChartOpen(open: boolean): void;
  setIsFixedOutput(fixed: boolean): void;
  setSlippageTolerance(tolerance: number): void;
  setTransactionDeadline(deadline: number): void;
  setMaxGasFee(maxGasFee: number): void;
  setQuoteChosen(quote: GeneralRouteAndQuote | undefined): void;

  setFromCoin(symbol: RawCoinInfo | undefined): void;
  setFromAmount(amount: number): void;

  setToCoin(symbol: RawCoinInfo | undefined): void;
  setToAmount(amount: number): void;
}

function useLocalState<T>(name: string, initValue: T) {
  const storageKey = `SwapState.${name}`;
  const localJson = localStorage.getItem(storageKey);
  const localValue = localJson ? JSON.parse(localJson) : undefined;

  const [value, setter] = useState(localValue || initValue);
  function setValue(newValue: T) {
    setter(newValue);
    localStorage.setItem(storageKey, JSON.stringify(newValue));
  }

  return [value, setValue];
}

const Swap: React.FC = () => {
  const [isPriceChartOpen, setIsPriceChartOpen] = useLocalState('isPriceChartOpen', false);
  const [isFixedOutput, setIsFixedOutput] = useLocalState('isFixedOutput', false);
  const [slippageTolerance, setSlippageTolerance] = useLocalState('slippageTolerance', 0.1);
  const [transactionDeadline, setTransactionDeadline] = useLocalState('transactionDeadline', 60);
  const [maxGasFee, setMaxGasFee] = useLocalState('maxGasFee', 20000);
  const [fromSymbol, setFromSymbol] = useLocalState<string | number | undefined>(
    'fromSymbol',
    'zUSDC'
  );
  const [toSymbol, setToSymbol] = useLocalState<string | number | undefined>('toSymbol', 'APT');

  const { coinListClient } = useHippoClient();

  const initialFromCoin =
    typeof fromSymbol === 'number'
      ? coinListClient?.getCoinInfoByIndex(fromSymbol)
      : coinListClient?.getCoinInfoBySymbol(fromSymbol)[0];
  const initialToCoin =
    typeof toSymbol === 'number'
      ? coinListClient?.getCoinInfoByIndex(toSymbol)
      : coinListClient?.getCoinInfoBySymbol(toSymbol)[0];

  const [fromCoin, setFromCoin] = useState<RawCoinInfo | undefined>(initialFromCoin);
  const [toCoin, setToCoin] = useState<RawCoinInfo | undefined>(initialToCoin);
  const [quoteChosen, setQuoteChosen] = useState<GeneralRouteAndQuote | undefined>(undefined);
  const [fromAmount, setFromAmount] = useState(0);
  const [toAmount, setToAmount] = useState(0);

  const swapCtx: SwapContextType = {
    isPriceChartOpen,
    isFixedOutput,
    slippageTolerance,
    transactionDeadline,
    maxGasFee,
    quoteChosen,
    fromCoin,
    fromAmount,
    toCoin,
    toAmount,
    setIsPriceChartOpen,
    setIsFixedOutput,
    setSlippageTolerance,
    setTransactionDeadline,
    setMaxGasFee,
    setQuoteChosen,
    setFromCoin: (from: RawCoinInfo) => {
      setFromCoin(from);
      if (coinListClient?.getCoinInfoBySymbol(from.symbol).length === 1) {
        setFromSymbol(from.symbol);
      } else {
        setFromSymbol(from.unique_index);
      }
    },
    setFromAmount,
    setToCoin: (to: RawCoinInfo) => {
      setToCoin(to);
      if (coinListClient?.getCoinInfoBySymbol(to.symbol).length === 1) {
        setFromSymbol(to.symbol);
      } else {
        setFromSymbol(to.unique_index);
      }
    },
    setToAmount
  };

  // load quote params from url
  const {
    fromSymbol: urlFromSymbol,
    toSymbol: urlToSymbol,
    fromAmount: urlFromAmt,
    toAmount: urlToAmt
  } = useParams();

  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    if (isFirstLoad) {
      if (urlFromSymbol) {
        setFromSymbol(urlFromSymbol);
      }
      if (urlToSymbol) {
        setToSymbol(urlToSymbol);
      }
      if (urlFromAmt) {
        setFromAmount(parseFloat(urlFromAmt) || 0);
      }
      if (urlToAmt) {
        setToAmount(parseFloat(urlToAmt) || 0);
      }
      setIsFirstLoad(false);
    }
  }, [
    isFirstLoad,
    urlFromSymbol,
    urlFromAmt,
    urlToSymbol,
    urlToAmt,
    setFromSymbol,
    setToSymbol,
    setFromAmount,
    setToAmount
  ]);

  return (
    <div className="w-full mt-6 max-w-[463px] mx-auto flex flex-col justify-center items-center h-full relative pointer-events-none">
      <TokenSwap ctx={swapCtx} />
    </div>
  );
};

export default Swap;
