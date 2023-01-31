import { RawCoinInfo } from '@manahippo/coin-list';
import PromiseThrottle from 'promise-throttle';
import { useMemo } from 'react';
import useSWR from 'swr';

const promiseThrottle = new PromiseThrottle({
  requestsPerSecond: Infinity,
  promiseImplementation: Promise
});

const fetcher = (apiURL: string) =>
  promiseThrottle.add(() => fetch(apiURL).then((res) => res.json()));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const onErrorRetry = (error: any /*, key, config, revalidate, { retryCount } */) => {
  // Coingecko rate limit error
  if (error.status === 429) {
    // Retry after specific time
    // setTimeout(() => revalidate({ retryCount }), 5000);
  }
};

export const useCoingeckoPrice = (
  token: RawCoinInfo | (RawCoinInfo | undefined)[] | undefined
): [number | number[] | undefined, any, string] => {
  const tokens = useMemo(() => {
    if (Array.isArray(token)) return token;
    else return [token];
  }, [token]);
  const key = useMemo(() => {
    if (!tokens.every((t) => t?.coingecko_id)) return null;
    return `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
      tokens
        .map((t) => t!.coingecko_id)
        .sort()
        .join(',')
    )}&vs_currencies=usd`;
  }, [tokens]);

  const { data, error } = useSWR(key, fetcher, {
    refreshInterval: 2 * 60_000,
    onErrorRetry
  });
  const api = key || '';
  if (data) {
    if (!Array.isArray(token) && tokens[0]) {
      return [data[tokens[0].coingecko_id].usd, error, api];
    } else if (tokens.length >= 1) {
      return [tokens.map((t) => t && data[t.coingecko_id].usd), error, api];
    }
  }
  return [undefined, error, api];
};

export type CoingeckoMarketChartPrice = [number, number];
export interface ICoingeckoMarketChartData {
  prices: CoingeckoMarketChartPrice[];
}

const isValidData = (data: ICoingeckoMarketChartData) => {
  return (
    data &&
    data.prices &&
    Array.isArray(data.prices) &&
    data.prices.every((p) => typeof p[0] === 'number' && typeof p[1] === 'number')
  );
};

export const useCoingeckoMarketChart = (
  token: RawCoinInfo | undefined,
  days: number
): [ICoingeckoMarketChartData | undefined, any, boolean, boolean] => {
  const key = useMemo(() => {
    if (!token?.coingecko_id) return null;
    const intervalQuery = days === 30 ? '&interval=daily' : '';
    return `https://api.coingecko.com/api/v3/coins/${token.coingecko_id}/market_chart?vs_currency=usd&days=${days}${intervalQuery}`;
  }, [days, token?.coingecko_id]);

  let { data, error, isLoading } = useSWR(key, fetcher, {
    refreshInterval: 5 * 60_000,
    onErrorRetry
  });
  const hasNoData =
    !!(token && !token.coingecko_id) ||
    (!error &&
      data &&
      Array.isArray(data.prices) &&
      data.prices.every((d: CoingeckoMarketChartPrice) => !d[1]));
  return [
    isValidData(data) ? (data as ICoingeckoMarketChartData) : undefined,
    error,
    isLoading,
    hasNoData
  ];
};

export const useCoingeckoRateHistory = (
  fromToken: RawCoinInfo | undefined,
  toToken: RawCoinInfo | undefined,
  days: number
): [ICoingeckoMarketChartData | undefined, any, boolean, boolean] => {
  const [fromTokenData, error, isLoading, hasNoData1] = useCoingeckoMarketChart(fromToken, days);
  const [toTokenData, error2, isLoading2, hasNoData2] = useCoingeckoMarketChart(toToken, days);

  let rateHistory: ICoingeckoMarketChartData | undefined = undefined;
  if (fromTokenData?.prices && toTokenData?.prices) {
    // align timestamp
    let lastFindIndex = -1;
    const prices = toTokenData.prices.reduce((pre, cur) => {
      const currentTs = cur[0];
      lastFindIndex = fromTokenData.prices
        .slice(lastFindIndex + 1)
        .findIndex((v) => Math.abs(v[0] - currentTs) < 2 * 60 * 1000);
      if (lastFindIndex >= 0) {
        const fromPrice = fromTokenData.prices[lastFindIndex];
        const rate = cur[1] / fromPrice[1];
        pre.push([currentTs, rate] as CoingeckoMarketChartPrice);
      }
      return pre;
    }, [] as CoingeckoMarketChartPrice[]);

    rateHistory = {
      prices
    };
  }

  return [rateHistory, error || error2, isLoading || isLoading2, hasNoData1 || hasNoData2];
};
