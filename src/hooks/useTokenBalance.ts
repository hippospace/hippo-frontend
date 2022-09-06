import { useWallet } from '@manahippo/aptos-wallet-adapter';
import { useMemo } from 'react';
import useHippoClient from './useHippoClient';
import invariant from 'tiny-invariant';

export type Balance = number | null;

const useTokenBalane = (tokenSymbol: string | undefined): [Balance, boolean] => {
  const { tokenInfos, tokenStores } = useHippoClient();
  const { connected } = useWallet();

  const inputTokenBalance = useMemo(() => {
    if (tokenSymbol && connected && tokenInfos && tokenStores) {
      const tokenInfo = tokenInfos[tokenSymbol];
      invariant(tokenInfo, `Can't find token info for symbol ${tokenSymbol}`);
      const tokenStore = tokenStores[tokenSymbol];
      return tokenStore
        ? tokenStore.coin.value.toJsNumber() / Math.pow(10, tokenInfo.decimals.toJsNumber())
        : 0;
    } else {
      return null;
    }
  }, [connected, tokenInfos, tokenStores, tokenSymbol]);

  const isReady = typeof inputTokenBalance === 'number';

  return [inputTokenBalance, isReady];
};

export default useTokenBalane;
