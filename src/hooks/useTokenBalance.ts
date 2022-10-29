import { useWallet } from '@manahippo/aptos-wallet-adapter';
import { useMemo } from 'react';
import useHippoClient from './useHippoClient';
import invariant from 'tiny-invariant';
import { RawCoinInfo } from '@manahippo/coin-list';

export type Balance = number | null;

const useTokenBalane = (token: RawCoinInfo | undefined): [Balance, boolean] => {
  const { getTokenInfoByFullName, getTokenStoreByFullName } = useHippoClient();
  const { connected } = useWallet();

  const inputTokenBalance = useMemo(() => {
    if (token && connected) {
      const fullName = token.token_type.type;
      const tokenInfo = getTokenInfoByFullName(fullName);
      invariant(tokenInfo, `Can't find token info of symbol ${token.symbol}`);
      const tokenStore = getTokenStoreByFullName(fullName);
      if (tokenStore === false) return null;
      return tokenStore ? tokenStore.coin.value.toJsNumber() / Math.pow(10, tokenInfo.decimals) : 0;
    } else {
      return null;
    }
  }, [connected, getTokenInfoByFullName, getTokenStoreByFullName, token]);

  const isReady = typeof inputTokenBalance === 'number';

  return [inputTokenBalance, isReady];
};

export default useTokenBalane;
