import { RawCoinInfo } from '@manahippo/coin-list';
import { useMemo } from 'react';
import useSWR from 'swr';
import invariant from 'tiny-invariant';
import { fetcher } from 'utils/utility';

const tokenToBinanceSymbol = (t: RawCoinInfo | undefined): string | undefined => {
  const s = t?.symbol;
  // https://www.binance.com/en/support/announcement/binance-to-auto-convert-usdc-usdp-tusd-to-busd-binance-usd-e62f703604a94538a1f1bc803b2d579f
  const mappings: Record<string, string> = {
    WETH: 'ETH',
    USDC: 'BUSD',
    USDCso: 'BUSD',
    USDCav: 'BUSD',
    USDCpo: 'BUSD',
    zUSDC: 'BUSD',
    USDP: 'BUSD',
    TUSD: 'BUSD',
    USDTbs: 'USDT'
  };
  return (s && mappings[s]) ?? s;
};

interface IBinanceSymbol {
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
}

interface IBinancePrice {
  symbol: string;
  price: string;
}

export const useBinanceExchangeInfo = () => {
  const key = 'https://api.binance.com/api/v3/exchangeInfo';
  const { data, error } = useSWR(key, fetcher, { refreshInterval: 3600_000 });
  return [data, error];
};

export const useBinanceSymbols = (): [IBinanceSymbol[] | undefined, any] => {
  let symbols: IBinanceSymbol[] | undefined = undefined;
  const [data, error] = useBinanceExchangeInfo();
  if (data) {
    symbols = data.symbols
      .filter((s: any) => s.status === 'TRADING') // f.g. SOLUSDC status is BREAK
      .map((s: any) => ({
        symbol: s.symbol,
        status: s.status,
        baseAsset: s.baseAsset,
        quoteAsset: s.quoteAsset
      }));
  }
  return [symbols, error];
};

export const useBinanceSymbolPair = (
  fromToken: RawCoinInfo | undefined,
  toToken: RawCoinInfo | undefined
) => {
  const fromSymbol = tokenToBinanceSymbol(fromToken);
  const toSymbol = tokenToBinanceSymbol(toToken);
  const medianSymbol = 'BUSD';

  const [symbols, error] = useBinanceSymbols();
  if (symbols && symbols.length > 0) {
    const symbolsPairs = symbols.map((s: IBinanceSymbol) => s.symbol);
    const pair = symbolsPairs.find(
      (s) => s === `${fromSymbol}${toSymbol}` || s === `${toSymbol}${fromSymbol}`
    );
    if (pair) {
      return [[pair], error];
    } else {
      const pair1 = symbolsPairs.find(
        (s) => s === `${fromSymbol}${medianSymbol}` || s === `${medianSymbol}${fromSymbol}`
      );
      const pair2 = symbolsPairs.find(
        (s) => s === `${toSymbol}${medianSymbol}` || s === `${medianSymbol}${toSymbol}`
      );

      if (pair1 && pair2) {
        return [[pair1, pair2], error];
      }
    }
  }

  return [[], error];
};

export const useBinanceRate = (
  fromToken: RawCoinInfo | undefined,
  toToken: RawCoinInfo | undefined
) => {
  const [pairs, error] = useBinanceSymbolPair(fromToken, toToken);

  const key = useMemo(() => {
    if (pairs && pairs.length > 0) {
      return `https://api.binance.com/api/v3/ticker/price?symbols=${encodeURIComponent(
        JSON.stringify(pairs)
      )}`;
    } else {
      return null;
    }
  }, [pairs]);

  let rate: number | undefined = undefined;
  const fromSymbol = tokenToBinanceSymbol(fromToken);
  const toSymbol = tokenToBinanceSymbol(toToken);

  const { data, error: error2 } = useSWR<IBinancePrice[]>(key, fetcher, {
    refreshInterval: 30_000
  });
  if (data && fromSymbol && toSymbol) {
    const fromData = data.find((d: IBinancePrice) => d.symbol.includes(fromSymbol));
    invariant(fromData, 'Binance price symbol doesnot contain from-symbol');
    if (data.length === 1) {
      invariant(
        fromData.symbol.includes(toSymbol),
        'Binance price symbol doesnot contain to-symbol'
      );
      const isFromTo = fromData.symbol.startsWith(fromSymbol);
      const price = parseFloat(fromData.price);
      rate = isFromTo ? 1 / price : price;
    } else {
      const toData = data.find((d) => d.symbol.includes(toSymbol));
      invariant(toData, 'Binance price symbol doesnot contain to-symbol');
      invariant(
        toData !== fromData,
        'Binance price symbol contains both from-symbol and to-symbol'
      );
      const fromToBusd = fromData.symbol.startsWith(fromSymbol)
        ? parseFloat(fromData.price)
        : 1 / parseFloat(fromData.price);
      const toToBusd = toData.symbol.startsWith(toSymbol)
        ? parseFloat(toData.price)
        : 1 / parseFloat(toData.price);
      rate = toToBusd / fromToBusd;
    }
  }
  return [rate, key, error ?? error2];
};
