import { numberGroupFormat } from 'components/PositiveFloatNumInput/numberFormats';
import { useMemo } from 'react';
import useHippoClient from './useHippoClient';

const useTokenAmountFormatter = () => {
  const { tokenInfos } = useHippoClient();

  const formatter = useMemo(
    () =>
      (amount: number | undefined | null, tokenSymbol: string | undefined): string => {
        if (typeof amount !== 'number' || amount < 0 || !tokenSymbol || !tokenInfos) return '';
        const decimals = tokenInfos[tokenSymbol].decimals.toJsNumber();
        return numberGroupFormat(amount, decimals);
      },
    [tokenInfos]
  );

  return [formatter];
};

export default useTokenAmountFormatter;
