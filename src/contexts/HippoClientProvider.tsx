import { createContext, FC, ReactNode, useCallback, useEffect, useState } from 'react';
import { coinListClient, hippoTradeAggregator, hippoWalletClient } from 'config/hippoClients';
import {
  HippoSwapClient,
  HippoWalletClient,
  PoolType,
  UITokenAmount,
  stdlib,
  CoinListClient
} from '@manahippo/hippo-sdk';
import { TradeAggregator } from '@manahippo/hippo-sdk/dist/aggregator/aggregator';
import useAptosWallet from 'hooks/useAptosWallet';
// import { aptosClient } from 'config/aptosClient';
import { message } from 'components/Antd';
import { TTransaction } from 'types/hippo';
import { useWallet } from '@manahippo/aptos-wallet-adapter';
import { MaybeHexString } from 'aptos';
import { useDispatch } from 'react-redux';
import swapAction from 'modules/swap/actions';
import { RouteAndQuote } from '@manahippo/hippo-sdk/dist/aggregator/types';
import { useNotification } from 'hooks/useNotification';
import { CoinInfo } from '@manahippo/hippo-sdk/dist/generated/coin_list/coin_list';
import { Types } from 'aptos';

interface HippoClientContextType {
  hippoWallet?: HippoWalletClient;
  hippoAgg?: TradeAggregator;
  hippoSwap?: HippoSwapClient;
  tokenStores?: Record<string, stdlib.Coin.CoinStore>;
  tokenInfos?: Record<string, CoinInfo>;
  getTokenInfoByFullName: (fullName: string) => CoinInfo | undefined;
  requestSwapByRoute: (routeAndQuote: RouteAndQuote, slipTolerance: number) => Promise<boolean>;
  requestSwap?: (
    fromSymbol: string,
    toSymbol: string,
    uiAmtIn: number,
    uiAmtOutMin: number,
    callback: () => void
  ) => {};
  requestDeposit?: (
    lhsSymbol: string,
    rhsSymbol: string,
    poolType: PoolType,
    lhsUiAmt: number,
    rhsUiAmt: number
  ) => Promise<boolean>;
  requestWithdraw?: (
    lhsSymbol: string,
    rhsSymbol: string,
    poolType: PoolType,
    liqiudityAmt: UITokenAmount,
    lhsMinAmt: UITokenAmount,
    rhsMinAmt: UITokenAmount
  ) => Promise<boolean>;
  transaction?: TTransaction;
  setTransaction: (trans?: TTransaction) => void;
  requestFaucet: (symbol: string) => Promise<boolean>;
}

interface TProviderProps {
  children: ReactNode;
}

const HippoClientContext = createContext<HippoClientContextType>({} as HippoClientContextType);

const HippoClientProvider: FC<TProviderProps> = ({ children }) => {
  const { activeWallet } = useAptosWallet();
  const { signAndSubmitTransaction } = useWallet();
  const { openNotification } = useNotification();
  const [hippoWallet, setHippoWallet] = useState<HippoWalletClient>();
  const [coinListCli, setCoinListCli] = useState<CoinListClient>();
  const [hippoAgg, setHippoAgg] = useState<TradeAggregator>();
  const [refreshWalletClient, setRefreshWalletClient] = useState(false);
  const [transaction, setTransaction] = useState<TTransaction>();
  const [tokenStores, setTokenStores] = useState<Record<string, stdlib.Coin.CoinStore>>();
  const [tokenInfos, setTokenInfos] = useState<Record<string, CoinInfo>>();
  const dispatch = useDispatch();

  const getHippoWalletClient = useCallback(async () => {
    if (activeWallet) {
      const client = await hippoWalletClient(activeWallet);
      await client?.refreshStores();
      setHippoWallet(client);
    } else {
      setHippoWallet(undefined);
    }
  }, [activeWallet]);

  const getHippoTradeAggregator = useCallback(async () => {
    setHippoAgg(await hippoTradeAggregator());
  }, []);

  const getCoinListClient = useCallback(async () => {
    setCoinListCli(await coinListClient());
  }, []);

  const getTokenInfoByFullName = useCallback(
    (fullName: string) => {
      return coinListCli?.fullnameToCoinInfo[fullName];
    },
    [coinListCli?.fullnameToCoinInfo]
  );

  useEffect(() => {
    getHippoWalletClient();
  }, [getHippoWalletClient]);
  useEffect(() => {
    getHippoTradeAggregator();
  }, [getHippoTradeAggregator]);
  useEffect(() => {
    getCoinListClient();
  }, [getCoinListClient]);

  useEffect(() => {
    if (refreshWalletClient) {
      getHippoWalletClient();
      setRefreshWalletClient(false);
    }
  }, [getHippoWalletClient, refreshWalletClient]);

  useEffect(() => {
    if (hippoWallet) {
      setTokenStores(hippoWallet?.symbolToCoinStore);
    } else {
      setTokenStores(undefined);
    }
  }, [hippoWallet?.symbolToCoinStore, hippoWallet]);

  useEffect(() => {
    setTokenInfos(coinListCli?.symbolToCoinInfo);
    dispatch(swapAction.SET_TOKEN_LIST(coinListCli?.getCoinInfoList()));
  }, [coinListCli, dispatch]);

  const getNotificationMsg = useCallback(
    (txhash: MaybeHexString) => {
      const description = (
        <p>
          You can verify the transaction by visiting the{' '}
          <a
            href={`https://explorer.aptoslabs.com/txn/${txhash}`}
            target="_blank"
            rel="noreferrer"
            className="underline">
            Aptos Transaction Explorer
          </a>
        </p>
      );
      return openNotification(description);
    },
    [openNotification]
  );

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
            message.success('Faucet Success');
            getNotificationMsg(result.hash);
            await hippoWallet?.refreshStores();
            setRefreshWalletClient(true);
            success = true;
          }
        }
      } catch (error) {
        console.log('request faucet error:', error);
        if (error instanceof Error) {
          message.error(error?.message);
        }
        success = false;
      } finally {
        return success;
      }
    },
    [activeWallet, getNotificationMsg, hippoWallet, signAndSubmitTransaction, tokenInfos]
  );

  const requestSwapByRoute = useCallback(
    async (routeAndQuote: RouteAndQuote, slipTolerance: number) => {
      let success = false;
      try {
        const input = routeAndQuote.quote.inputUiAmt;
        const minOut = routeAndQuote.quote.outputUiAmt * (1 - slipTolerance / 100);
        if (!activeWallet) throw new Error('Please connect wallet first');
        if (input <= 0) {
          throw new Error('Input amount needs to be greater than 0');
        }
        const payload = routeAndQuote.route.makePayload(input, minOut, true);
        const result = await signAndSubmitTransaction(
          payload as Types.TransactionPayload_EntryFunctionPayload,
          {
            expiration_timestamp_secs: Math.floor(Date.now() / 1000) + 3 * 60
          }
        );
        if (result) {
          message.success('Transaction Success');
          getNotificationMsg(result.hash);
          setRefreshWalletClient(true);
          success = true;
        }
      } catch (error) {
        console.log('request swap by route error:', error);
        if (error instanceof Error) {
          message.error(error?.message);
        }
        success = false;
      } finally {
        return success;
      }
    },
    [activeWallet, getNotificationMsg, signAndSubmitTransaction]
  );
  /*
  const requestDeposit = useCallback(
    async (
      lhsSymbol: string,
      rhsSymbol: string,
      poolType: PoolType,
      lhsUiAmt: number,
      rhsUiAmt: number
    ) => {
      let success = false;
      try {
        if (!activeWallet || !hippoSwap) {
          throw new Error('Please login first');
        }
        const pool = hippoSwap.getDirectPoolsBySymbolsAndPoolType(lhsSymbol, rhsSymbol, poolType);
        if (pool.length === 0) {
          throw new Error('Desired pool does not exist');
        }
        const payload = await pool[0].makeAddLiquidityPayload(lhsUiAmt, rhsUiAmt);
        const result = await signAndSubmitTransaction(payload);
        if (result) {
          message.success('Transaction Success');
          getNotificationMsg(result.hash);
          setRefresh(true);
          success = true;
        }
      } catch (error) {
        console.log('request deposit error:', error);
        if (error instanceof Error) {
          message.error(error?.message);
        }
        success = false;
      } finally {
        return success;
      }
    },
    [hippoSwap, activeWallet, signAndSubmitTransaction]
  );

  const requestWithdraw = useCallback(
    async (
      lhsSymbol: string,
      rhsSymbol: string,
      poolType: PoolType,
      liqiudityAmt: UITokenAmount,
      lhsMinAmt: UITokenAmount,
      rhsMinAmt: UITokenAmount
    ) => {
      let success = false;
      try {
        if (!activeWallet || !hippoSwap) {
          throw new Error('Please login first');
        }
        const pool = hippoSwap.getDirectPoolsBySymbolsAndPoolType(lhsSymbol, rhsSymbol, poolType);
        if (pool.length === 0) {
          throw new Error('Desired pool does not exist');
        }
        const payload = await pool[0].makeRemoveLiquidityPayload(
          liqiudityAmt,
          lhsMinAmt,
          rhsMinAmt
        );
        const result = await signAndSubmitTransaction(payload);
        if (result) {
          message.success('Transaction Success');
          getNotificationMsg(result.hash);
          setRefresh(true);
          success = true;
        }
      } catch (error) {
        console.log('request withdraw error:', error);
        if (error instanceof Error) {
          message.error(error?.message);
        }
        success = false;
      } finally {
        return success;
      }
    },
    [hippoSwap, activeWallet, signAndSubmitTransaction]
  );
  */

  return (
    <HippoClientContext.Provider
      value={{
        hippoWallet,
        hippoAgg,
        tokenStores,
        tokenInfos,
        getTokenInfoByFullName,
        requestSwapByRoute,
        transaction,
        setTransaction,
        requestFaucet
      }}>
      {children}
    </HippoClientContext.Provider>
  );
};

export { HippoClientProvider, HippoClientContext };
