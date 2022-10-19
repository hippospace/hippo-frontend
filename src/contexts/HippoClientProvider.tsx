import { createContext, FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { coinListClient, hippoTradeAggregator, hippoWalletClient } from 'config/hippoClients';
import { HippoWalletClient, stdlib, CoinListClient } from '@manahippo/hippo-sdk';
import { TradeAggregator } from '@manahippo/hippo-sdk/dist/aggregator/aggregator';
import useAptosWallet from 'hooks/useAptosWallet';
import { TTransaction } from 'types/hippo';
import { useWallet } from '@manahippo/aptos-wallet-adapter';
import { useDispatch } from 'react-redux';
import swapAction from 'modules/swap/actions';
import { RouteAndQuote } from '@manahippo/hippo-sdk/dist/aggregator/types';
import { CoinInfo } from '@manahippo/hippo-sdk/dist/generated/coin_list/coin_list';
import { AptosClient, HexString, Types } from 'aptos';
import {
  openErrorNotification,
  openTxErrorNotification,
  openTxPendingNotification,
  openTxSuccessNotification
} from 'utils/notifications';
import useNetworkConfiguration from 'hooks/useNetworkConfiguration';
import { OptionTransaction, simulatePayloadTxAndLog, SimulationKeys } from '@manahippo/move-to-ts';
import { UserTransaction } from 'aptos/src/generated';

interface HippoClientContextType {
  hippoWallet?: HippoWalletClient;
  hippoAgg?: TradeAggregator;
  tokenStores?: Record<string, stdlib.Coin.CoinStore>;
  tokenInfos?: Record<string, CoinInfo>;
  getTokenInfoByFullName: (fullName: string) => CoinInfo | undefined;
  requestSwapByRoute: (
    routeAndQuote: RouteAndQuote,
    slipTolerance: number,
    options?: Partial<Types.SubmitTransactionRequest>
  ) => Promise<boolean>;
  simulateSwapByRoute: (
    routeAndQuote: RouteAndQuote,
    slipTolerance: number,
    options?: OptionTransaction
  ) => Promise<Types.UserTransaction>;
  transaction?: TTransaction;
  setTransaction: (trans?: TTransaction) => void;
  requestFaucet: (symbol: string) => Promise<boolean>;
}

interface TProviderProps {
  children: ReactNode;
}

const HippoClientContext = createContext<HippoClientContextType>({} as HippoClientContextType);

const HippoClientProvider: FC<TProviderProps> = ({ children }) => {
  const { activeWallet /*, connected*/ } = useAptosWallet();
  const { signAndSubmitTransaction, wallet /*, network*/ } = useWallet();
  const [hippoWallet, setHippoWallet] = useState<HippoWalletClient>();
  const [coinListCli, setCoinListCli] = useState<CoinListClient>();
  const [hippoAgg, setHippoAgg] = useState<TradeAggregator>();
  const [refreshWalletClient, setRefreshWalletClient] = useState(false);
  const [lastUpdateVersion, setLastUpdateVersion] = useState(undefined);
  const [transaction, setTransaction] = useState<TTransaction>();
  const [tokenStores, setTokenStores] = useState<Record<string, stdlib.Coin.CoinStore>>();
  const [tokenInfos, setTokenInfos] = useState<Record<string, CoinInfo>>();
  const dispatch = useDispatch();

  /*
  // detect 
  useEffect(() => {
    const currentNetwork = process.env.REACT_APP_CURRENT_NETWORK;
    if (connected && !new RegExp(currentNetwork, 'i').test(network?.name)) {
      openErrorNotification({
        detail: `Your wallet network is ${network.name} mismatched with the network of the site: ${currentNetwork}. This might cause transaction failures`,
        title: 'Wallet Network Mismatch'
      });
    }
  }, [connected, network?.name]);
  */

  const { networkCfg } = useNetworkConfiguration();
  const aptosClient = useMemo(
    () =>
      new AptosClient(networkCfg.fullNodeUrl, {
        CREDENTIALS: 'same-origin',
        WITH_CREDENTIALS: false
      }),
    [networkCfg.fullNodeUrl]
  );

  const getHippoWalletClient = useCallback(
    async (version: undefined | number | bigint = undefined) => {
      if (activeWallet) {
        const client = await hippoWalletClient(activeWallet, networkCfg, aptosClient, version);
        await client?.refreshStores();
        setHippoWallet(client);
      } else {
        setHippoWallet(undefined);
      }
    },
    [activeWallet, aptosClient, networkCfg]
  );

  const getHippoTradeAggregator = useCallback(async () => {
    setHippoAgg(await hippoTradeAggregator(aptosClient));
  }, [aptosClient]);

  const getCoinListClient = useCallback(async () => {
    setCoinListCli(await coinListClient(aptosClient));
  }, [aptosClient]);

  const getTokenInfoByFullName = useCallback(
    (fullName: string) => {
      return coinListCli?.fullnameToCoinInfo[fullName];
    },
    [coinListCli?.fullnameToCoinInfo]
  );

  useEffect(() => {
    getHippoWalletClient(lastUpdateVersion);
  }, [getHippoWalletClient, lastUpdateVersion]);
  useEffect(() => {
    getHippoTradeAggregator();
  }, [getHippoTradeAggregator]);
  useEffect(() => {
    getCoinListClient();
  }, [getCoinListClient]);

  useEffect(() => {
    if (refreshWalletClient) {
      getHippoWalletClient(lastUpdateVersion);
      setRefreshWalletClient(false);
    }
  }, [getHippoWalletClient, lastUpdateVersion, refreshWalletClient]);

  useEffect(() => {
    if (hippoWallet) {
      setTokenStores(hippoWallet?.symbolToCoinStore);
    } else {
      setTokenStores(undefined);
    }
  }, [hippoWallet?.symbolToCoinStore, hippoWallet]);

  useEffect(() => {
    setTokenInfos(coinListCli?.symbolToCoinInfo);
    const tradableCoins = hippoAgg
      ? hippoAgg.getTradableCoinInfo()
      : coinListCli?.getCoinInfoList();
    dispatch(swapAction.SET_TOKEN_LIST(tradableCoins));
  }, [coinListCli, dispatch, hippoAgg]);

  const requestFaucet = useCallback(
    async (symbol: string) => {
      let success = false;
      try {
        if (!activeWallet) throw new Error('Please login first');
        const uiAmtUsed = symbol === 'devBTC' ? 0.01 : 10;
        const payload = hippoWallet?.makeFaucetMintToPayload(uiAmtUsed, symbol, true);
        if (payload && tokenInfos) {
          let pl = payload as Types.TransactionPayload_EntryFunctionPayload;
          const result = await signAndSubmitTransaction(pl, {
            expiration_timestamp_secs: Math.floor(Date.now() / 1000) + 3 * 60
          });
          if (result) {
            openTxSuccessNotification(result.hash, `Requested ${uiAmtUsed} ${symbol} successfully`);
            await hippoWallet?.refreshStores();
            setRefreshWalletClient(true);
            success = true;
          }
        }
      } catch (error) {
        console.log('Request faucet error:', error);
        if (error instanceof Error) {
          openErrorNotification({ detail: error?.message });
        }
        success = false;
      } finally {
        return success;
      }
    },
    [activeWallet, hippoWallet, signAndSubmitTransaction, tokenInfos]
  );

  const requestSwapByRoute = useCallback(
    async (routeAndQuote: RouteAndQuote, slipTolerance: number, options = {}) => {
      let success = false;
      try {
        if (!activeWallet) throw new Error('Please connect wallet first');
        const input = routeAndQuote.quote.inputUiAmt;
        const minOut = routeAndQuote.quote.outputUiAmt * (1 - slipTolerance / 100);
        if (input <= 0) {
          throw new Error('Input amount needs to be greater than 0');
        }
        const payload = routeAndQuote.route.makePayload(input, minOut, true);
        const result = await signAndSubmitTransaction(
          payload as Types.TransactionPayload_EntryFunctionPayload,
          options
        );
        if (result && result.hash) {
          // pending tx notification first
          openTxPendingNotification(result.hash, 'Swap Transaction Pending');
          const txnResult = (await aptosClient.waitForTransactionWithResult(result.hash, {
            timeoutSecs: 10,
            checkSuccess: true
          })) as UserTransaction;
          if (txnResult.success) {
            openTxSuccessNotification(
              result.hash,
              `Swapped ${input} ${routeAndQuote.quote.inputSymbol} for ${routeAndQuote.quote.outputUiAmt} ${routeAndQuote.quote.outputSymbol}`
            );
          } else {
            openTxErrorNotification(
              result.hash,
              `Failed to swap ${routeAndQuote.quote.inputSymbol} to ${routeAndQuote.quote.outputSymbol}`
            );
          }
          setLastUpdateVersion(txnResult.version);
          setRefreshWalletClient(true);
          success = true;
        }
      } catch (error) {
        console.log('Request swap by route error:', error);
        if (error instanceof Error) {
          openErrorNotification({ detail: error?.message });
        }
        success = false;
      } finally {
        return success;
      }
    },
    [activeWallet, aptosClient, signAndSubmitTransaction]
  );

  const simulateSwapByRoute = useCallback(
    async (routeAndQuote: RouteAndQuote, slipTolerance: number, options?: OptionTransaction) => {
      try {
        const input = routeAndQuote.quote.inputUiAmt;
        const minOut = routeAndQuote.quote.outputUiAmt * (1 - slipTolerance / 100);
        if (input <= 0) {
          return;
        }
        const payload = routeAndQuote.route.makePayload(input, minOut, true);
        const publicKey = wallet?.adapter.publicAccount?.publicKey.toString();
        const address = wallet?.adapter.publicAccount?.address.toString();
        if (!publicKey || !address) {
          return;
        }
        const simkeys: SimulationKeys = {
          pubkey: new HexString(publicKey),
          address: new HexString(address)
        };
        options = {
          maxGasAmount: 20_000,
          ...(options || {})
        };
        const result = await simulatePayloadTxAndLog(aptosClient, simkeys, payload, options, false);
        console.log('simulate swap', result);
        return result;
      } catch (error) {
        if (error instanceof Error) {
          openErrorNotification({ detail: error?.message });
        }
      }
    },
    [aptosClient, wallet?.adapter.publicAccount?.address, wallet?.adapter.publicAccount.publicKey]
  );

  return (
    <HippoClientContext.Provider
      value={{
        hippoWallet,
        hippoAgg,
        tokenStores,
        tokenInfos,
        getTokenInfoByFullName,
        requestSwapByRoute,
        simulateSwapByRoute,
        transaction,
        setTransaction,
        requestFaucet
      }}>
      {children}
    </HippoClientContext.Provider>
  );
};

export { HippoClientProvider, HippoClientContext };
