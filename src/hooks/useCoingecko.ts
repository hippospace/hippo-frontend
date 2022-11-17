import { RawCoinInfo } from '@manahippo/coin-list';
import { cutDecimals } from 'components/PositiveFloatNumInput/numberFormats';
import { useMemo } from 'react';
import useSWR from 'swr';

const fetcher = (apiURL: string) => fetch(apiURL).then((res) => res.json());

const useCoingeckoRate = (fromToken: RawCoinInfo, toToken: RawCoinInfo) => {
  let isLoading = false;
  let rate: number | undefined = undefined;
  const key = useMemo(() => {
    if (!fromToken || !toToken) return null;
    const ids = [fromToken, toToken].map((t) => t.coingecko_id);
    return `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
      ids.join(',')
    )}&vs_currencies=usd`;
  }, [fromToken, toToken]);

  const { data, error } = useSWR(key, fetcher, { refreshInterval: 20_000 });
  if (!data) isLoading = true;
  if (data) {
    rate = data[toToken.coingecko_id].usd / data[fromToken.coingecko_id].usd;
  }

  return [rate, key, error, isLoading];
};

export const useCoingeckoPrice = (token: RawCoinInfo) => {
  const key = useMemo(() => {
    if (!token) return null;
    return `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
      token.coingecko_id
    )}&vs_currencies=usd`;
  }, [token]);

  const { data, error } = useSWR(key, fetcher, { refreshInterval: 20_000 });
  let price: number | undefined = undefined;
  if (data) {
    price = data[token.coingecko_id].usd;
  }
  return [price, error];
};

export const useCoingeckoValue = (token: RawCoinInfo, amount: number) => {
  const [price, error] = useCoingeckoPrice(token);
  let value: string | undefined = undefined;
  value = cutDecimals('' + price * amount, 2);
  return [value, error];
};

export default useCoingeckoRate;
