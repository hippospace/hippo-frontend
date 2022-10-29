import { numberGroupFormat } from 'components/PositiveFloatNumInput/numberFormats';
import { useMemo } from 'react';
import useHippoClient from './useHippoClient';
import { RawCoinInfo as CoinInfo } from '@manahippo/coin-list';

const useTokenAmountFormatter = () => {
  const { getTokenInfoByFullName } = useHippoClient();

  const formatter = useMemo(
    () =>
      (amount: number | undefined | null, token: CoinInfo | undefined): string => {
        if (typeof amount !== 'number' || amount < 0 || !token) return '';
        const tokenInfo = getTokenInfoByFullName(token.token_type.type);
        if (!tokenInfo) return '';
        const decimals = tokenInfo.decimals;
        return numberGroupFormat(amount, decimals);
      },
    [getTokenInfoByFullName]
  );

  return [formatter];
};

export default useTokenAmountFormatter;
