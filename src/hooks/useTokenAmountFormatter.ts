import { RawCoinInfo } from '@manahippo/coin-list';
import { numberGroupFormat } from 'components/PositiveFloatNumInput/numberFormats';
import { useMemo } from 'react';

const useTokenAmountFormatter = () => {
  const formatter = useMemo(
    () =>
      (amount: number | undefined | null, token: RawCoinInfo | undefined): string => {
        if (typeof amount !== 'number' || amount < 0 || !token) return '';
        if (!token) return '';
        const decimals = token.decimals;
        return numberGroupFormat(amount, decimals);
      },
    []
  );

  return [formatter];
};

export default useTokenAmountFormatter;
