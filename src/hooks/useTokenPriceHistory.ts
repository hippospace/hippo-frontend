import { RawCoinInfo } from '@manahippo/coin-list';
import { useMemo, useRef } from 'react';
import useSWRImmutable from 'swr/immutable';
import { tokensHavingHippoNativePriceHistory } from 'utils/hippo';
import { useCoingeckoRateHistory } from './useCoingecko';
import usePrevious from './usePrevious';

const fetcher = (apiURL: string) => fetch(apiURL).then((res) => res.json());

export interface ITokenNativePrice {
  time_stamp: number;
  price: number;
}

export type TokenNativePriceData = ITokenNativePrice[];

const isDataValidate = (data: unknown) => {
  return data && Array.isArray(data) && data.every((d) => d.time_stamp && d.price >= 0);
};

const NATIVE_REFRESH_INTERVAL = 60_000;

const useTokenPriceNativeHistoryInUsdc = (
  token: RawCoinInfo,
  fromTs: number,
  toTs: number,
  timeInterval: number
): [TokenNativePriceData, any, boolean] => {
  const key = useMemo(() => {
    if (!token?.token_type.type || token.official_symbol === 'USDC') return null;
    return `https://api.hippo.space/v1/price/coin/${encodeURIComponent(
      token.token_type.type
    )}/from/${fromTs}/to/${toTs}/time_interval/${timeInterval}`;
  }, [fromTs, timeInterval, toTs, token?.official_symbol, token?.token_type.type]);

  const preToken = usePrevious(token);
  const preFromTs = usePrevious(fromTs);

  let { data, error, isLoading } = useSWRImmutable(key, fetcher, {
    keepPreviousData: false
  });
  const previousData = usePrevious(data);
  // Use previous data for specific conditions
  if (
    key &&
    !data &&
    isLoading &&
    (token?.token_type.type === preToken?.token_type.type ||
      Math.abs(fromTs - preFromTs) <= (NATIVE_REFRESH_INTERVAL / 1000) * 2)
  ) {
    data = previousData;
  }
  return [isDataValidate(data) ? (data as TokenNativePriceData) : undefined, error, isLoading];
};

const useTokenNativePriceHistory = (
  fromToken: RawCoinInfo,
  toToken: RawCoinInfo,
  fromTs: number,
  toTs: number,
  timeInterval: number
): [TokenNativePriceData, any, boolean] => {
  let [fromTokenData, error1, isLoading1] = useTokenPriceNativeHistoryInUsdc(
    fromToken,
    fromTs,
    toTs,
    timeInterval
  );
  let [toTokenData, error2, isLoading2] = useTokenPriceNativeHistoryInUsdc(
    toToken,
    fromTs,
    toTs,
    timeInterval
  );

  if (fromToken?.official_symbol === 'USDC' && toTokenData) {
    fromTokenData = toTokenData.map((p) => ({
      time_stamp: p.time_stamp,
      price: 1
    }));
  }
  if (toToken?.official_symbol === 'USDC' && fromTokenData) {
    toTokenData = fromTokenData.map((p) => ({
      time_stamp: p.time_stamp,
      price: 1
    }));
  }

  let data: TokenNativePriceData;
  if (
    fromTokenData &&
    toTokenData &&
    fromTokenData.map((p) => p.time_stamp).every((ts, i) => ts === toTokenData[i]?.time_stamp)
  ) {
    data = toTokenData.map((v, i) => ({
      time_stamp: v.time_stamp,
      price: fromTokenData[i]?.price ? v.price / fromTokenData[i].price : 0
    }));
  }

  return [data, error1 || error2, isLoading1 || isLoading2];
};

const IS_FORCE_USE_COINGECKO_PRICE = true;

export const useTokenPriceHistory = (
  fromToken: RawCoinInfo,
  toToken: RawCoinInfo,
  days: number
) => {
  const isUsingNativePrice =
    !IS_FORCE_USE_COINGECKO_PRICE &&
    (tokensHavingHippoNativePriceHistory.includes(fromToken.token_type.type) ||
      fromToken.official_symbol === 'USDC') &&
    (tokensHavingHippoNativePriceHistory.includes(toToken.token_type.type) ||
      toToken.official_symbol === 'USDC') &&
    days <= 7;

  const lastTs = useRef(0);
  const toTs = useRef(0);
  const fromTs = useRef(0);
  const timeInterval = useRef(0);

  const previousDays = usePrevious(days);

  const current = new Date();
  if (current.getTime() - lastTs.current >= NATIVE_REFRESH_INTERVAL || previousDays !== days) {
    lastTs.current = current.getTime();
    toTs.current = Math.floor(current.getTime() / 1000);
    current.setDate(current.getDate() - days);
    fromTs.current = Math.floor(current.getTime() / 1000);
    timeInterval.current = Math.ceil((toTs.current - fromTs.current) / 300);
  }

  const [nData, error2, isLoading2] = useTokenNativePriceHistory(
    isUsingNativePrice ? fromToken : undefined,
    isUsingNativePrice ? toToken : undefined,
    fromTs.current,
    toTs.current,
    timeInterval.current
  );

  const [cData, error1, isLoading1, hasNoData] = useCoingeckoRateHistory(
    !isUsingNativePrice ? fromToken : undefined,
    !isUsingNativePrice ? toToken : undefined,
    days
  );
  let cDataT =
    cData &&
    cData.prices.map(
      (v) =>
        ({
          time_stamp: v[0],
          price: v[1]
        } as ITokenNativePrice)
    );

  return {
    data: cDataT || nData,
    error: error1 || error2,
    isLoading: isLoading1 || isLoading2,
    hasNoData: !isUsingNativePrice && hasNoData
  };
};
