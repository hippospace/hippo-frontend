import { createContext, FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { HippoWalletClient, stdlib } from '@manahippo/hippo-sdk';
import { TradeAggregator } from '@manahippo/hippo-sdk';
import { CoinListClient, RawCoinInfo as CoinInfo, NetworkType } from '@manahippo/coin-list';
import useAptosWallet from 'hooks/useAptosWallet';
import { TTransaction } from 'types/hippo';
import { useWallet } from '@manahippo/aptos-wallet-adapter';
import { useDispatch } from 'react-redux';
import swapAction from 'modules/swap/actions';
import { IApiRouteAndQuote } from '@manahippo/hippo-sdk/dist/aggregator/types';
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
import { debounce } from 'lodash';

interface HippoClientContextType {
  hippoWallet?: HippoWalletClient;
  hippoAgg?: TradeAggregator;
  getTokenStoreByFullName: (fullName: string) => stdlib.Coin.CoinStore | undefined | false;
  getTokenInfoByFullName: (fullName: string) => CoinInfo | undefined;
  requestSwapByRoute: (
    routeAndQuote: IApiRouteAndQuote,
    slipTolerance: number,
    options?: Partial<Types.SubmitTransactionRequest>
  ) => Promise<boolean>;
  simulateSwapByRoute: (
    routeAndQuote: IApiRouteAndQuote,
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

const errorHandler = debounce(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (_err: any) => {
    // store.dispatch(commonActions.SET_RESOURCES_NOT_FOUND(true));
    openErrorNotification({ detail: 'Resource not found or loaded' });
    throw _err;
  },
  1000,
  { leading: false, trailing: true }
);

const HippoClientContext = createContext<HippoClientContextType>({} as HippoClientContextType);

const HippoClientProvider: FC<TProviderProps> = ({ children }) => {
  const { activeWallet /*, connected*/ } = useAptosWallet();
  const { signAndSubmitTransaction, wallet /*, network*/ } = useWallet();
  const [hippoWallet, setHippoWallet] = useState<HippoWalletClient>();
  // const [coinListCli, setCoinListCli] = useState<CoinListClient>();
  // const [hippoAgg, setHippoAgg] = useState<TradeAggregator>();
  const [refreshWalletClient, setRefreshWalletClient] = useState(false);
  const [lastUpdateVersion, setLastUpdateVersion] = useState(undefined);
  const [transaction, setTransaction] = useState<TTransaction>();
  const dispatch = useDispatch();

  const { networkCfg } = useNetworkConfiguration();

  const aptosClient = useMemo(
    () =>
      new AptosClient(networkCfg.fullNodeUrl, {
        CREDENTIALS: 'same-origin',
        WITH_CREDENTIALS: false
      }),
    [networkCfg.fullNodeUrl]
  );

  const coinListCli = useMemo(
    () => new CoinListClient(networkCfg.name as NetworkType),
    [networkCfg.name]
  );

  const updateCoinlist = useCallback(() => {
    const tradableCoins = coinListCli?.getCoinInfoList();
    dispatch(swapAction.SET_TOKEN_LIST(tradableCoins));
  }, [coinListCli, dispatch]);

  useEffect(updateCoinlist, [updateCoinlist]);

  useEffect(() => {
    (async () => {
      try {
        // Important: load full coin list
        await coinListCli.update(aptosClient, undefined, {
          maxGasAmount: 40_000,
          expireTimestamp: Math.floor(Date.now() / 1000) + 60
        });
        updateCoinlist();
      } catch (err) {
        console.log('Update coin list client failed', err);
        errorHandler(err);
      }
    })();
  }, [aptosClient, coinListCli, updateCoinlist]);

  const getHippoWalletClient = useCallback(
    async (version: undefined | number | bigint = undefined) => {
      try {
        if (activeWallet) {
          const client = new HippoWalletClient(aptosClient, activeWallet, networkCfg, coinListCli);
          await client?.refreshStores(version);
          setHippoWallet(client);
        } else {
          setHippoWallet(undefined);
        }
      } catch (err) {
        if (err.errorCode === 'account_not_found') {
          openErrorNotification({
            detail: "Cann't find your account. Please fund your account first."
          });
          return;
        }
        console.log('Get hippo wallet client failed', err);
        errorHandler(err);
      }
    },
    [activeWallet, aptosClient, coinListCli, networkCfg]
  );

  const hippoAgg = useMemo(
    () => new TradeAggregator(aptosClient, networkCfg, coinListCli, 400),
    [aptosClient, coinListCli, networkCfg]
  );
  useEffect(() => {
    (async () => {
      try {
        // Important: load full pool list
        await hippoAgg.updatePoolLists();
      } catch (err) {
        console.log('Update Hippo trade aggregator failed', err);
        errorHandler(err);
      }
    })();
  }, [hippoAgg]);

  const getTokenInfoByFullName = useCallback(
    (fullName: string) => {
      return coinListCli?.fullnameToCoinInfo[fullName];
    },
    [coinListCli?.fullnameToCoinInfo]
  );

  const getTokenStoreByFullName = useCallback(
    (fullName: string) => !!hippoWallet && hippoWallet.fullnameToCoinStore[fullName],
    [hippoWallet]
  );

  useEffect(() => {
    getHippoWalletClient(lastUpdateVersion);
  }, [getHippoWalletClient, lastUpdateVersion]);

  useEffect(() => {
    if (refreshWalletClient) {
      getHippoWalletClient(lastUpdateVersion);
      setRefreshWalletClient(false);
    }
  }, [getHippoWalletClient, lastUpdateVersion, refreshWalletClient]);

  const requestFaucet = useCallback(
    async (symbol: string) => {
      let success = false;
      try {
        if (!activeWallet) throw new Error('Please login first');
        const uiAmtUsed = symbol === 'devBTC' ? 0.01 : 10;
        const payload = hippoWallet?.makeFaucetMintToPayload(uiAmtUsed, symbol, true);
        if (payload) {
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
    [activeWallet, hippoWallet, signAndSubmitTransaction]
  );

  const requestSwapByRoute = useCallback(
    async (routeAndQuote: IApiRouteAndQuote, slipTolerance: number, options = {}) => {
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
            timeoutSecs: 20,
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
          setLastUpdateVersion(BigInt(txnResult.version));
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
    async (
      routeAndQuote: IApiRouteAndQuote,
      slipTolerance: number,
      options?: OptionTransaction
    ) => {
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
          maxGasAmount: 40_000,
          expireTimestamp: Math.floor(Date.now() / 1000) + 60,
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
        getTokenStoreByFullName,
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
