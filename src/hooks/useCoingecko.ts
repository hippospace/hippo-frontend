import { RawCoinInfo } from '@manahippo/coin-list';
import { cutDecimals } from 'components/PositiveFloatNumInput/numberFormats';
import PromiseThrottle from 'promise-throttle';
import { useMemo } from 'react';
import useSWR from 'swr';

const promiseThrottle = new PromiseThrottle({
  requestsPerSecond: 1,
  promiseImplementation: Promise
});

const fetcher = (apiURL: string) =>
  promiseThrottle.add(() => fetch(apiURL).then((res) => res.json()));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const onErrorRetry = (error, key, config, revalidate, { retryCount }) => {
  // Coingecko rate limit error
  if (error.status === 429) {
    // Retry after specific time
    // setTimeout(() => revalidate({ retryCount }), 5000);
  }
};

const useCoingeckoRate = (fromToken: RawCoinInfo, toToken: RawCoinInfo) => {
  let rate: number | undefined = undefined;
  const key = useMemo(() => {
    if (!(fromToken?.coingecko_id && toToken?.coingecko_id)) return null;
    const ids = [fromToken, toToken].map((t) => t.coingecko_id).sort();
    return `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
      ids.join(',')
    )}&vs_currencies=usd`;
  }, [fromToken, toToken]);

  const { data, error, isLoading } = useSWR(key, fetcher, {
    refreshInterval: 2 * 60_000,
    onErrorRetry
  });
  if (data) {
    rate = data[toToken.coingecko_id].usd / data[fromToken.coingecko_id].usd;
  }

  return [rate, key, error, isLoading];
};

export const useCoingeckoPrice = (token: RawCoinInfo) => {
  const key = useMemo(() => {
    if (!token?.coingecko_id) return null;
    return `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
      token.coingecko_id
    )}&vs_currencies=usd`;
  }, [token]);

  const { data, error } = useSWR(key, fetcher, {
    refreshInterval: 2.5 * 60_000,
    onErrorRetry
  });
  let price: number | undefined = undefined;
  if (data) {
    price = data[token.coingecko_id].usd;
  }
  return [price, error];
};

export const useCoingeckoValue = (token: RawCoinInfo, amount: number) => {
  const [price, error] = useCoingeckoPrice(token);
  let value: string | undefined = undefined;
  if (typeof price === 'number') {
    value = cutDecimals('' + price * amount, 2);
  }
  return [value, error];
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
  token: RawCoinInfo,
  days: number
): [ICoingeckoMarketChartData, any, boolean, boolean] => {
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
  fromToken: RawCoinInfo,
  toToken: RawCoinInfo,
  days: number
): [ICoingeckoMarketChartData, any, boolean, boolean] => {
  const [fromTokenData, error, isLoading, hasNoData1] = useCoingeckoMarketChart(fromToken, days);
  const [toTokenData, error2, isLoading2, hasNoData2] = useCoingeckoMarketChart(toToken, days);

  let rateHistory: ICoingeckoMarketChartData;
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

export default useCoingeckoRate;
