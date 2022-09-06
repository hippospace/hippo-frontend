import {
  avoidScientificNotation,
  cutDecimals,
  numToGrouped
} from 'components/PositiveFloatNumInput';
import { useMemo } from 'react';
import useHippoClient from './useHippoClient';

const useTokenAmountFormatter = () => {
  const { tokenInfos } = useHippoClient();

  const formatter = useMemo(
    () =>
      (amount: number | undefined | null, tokenSymbol: string | undefined): string => {
        if (typeof amount !== 'number' || !tokenSymbol || !tokenInfos) return '';
        const decimals = tokenInfos[tokenSymbol].decimals.toJsNumber();
        return numToGrouped(cutDecimals(avoidScientificNotation(amount), decimals));
      },
    [tokenInfos]
  );

  return [formatter];
};

export default useTokenAmountFormatter;
