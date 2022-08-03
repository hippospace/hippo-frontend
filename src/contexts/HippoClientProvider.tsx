import { createContext, FC, ReactNode, useCallback, useEffect, useState } from 'react';
import { hippoSwapClient, hippoTradeAggregator, hippoWalletClient } from 'config/hippoClients';
import {
  HippoSwapClient,
  HippoWalletClient,
  PoolType,
  UITokenAmount,
  aptos_framework
} from '@manahippo/hippo-sdk';
import { TradeAggregator } from '@manahippo/hippo-sdk/dist/aggregator/aggregator';
import { Coin_registry } from '@manahippo/hippo-sdk/dist/generated/coin_registry';
import useAptosWallet from 'hooks/useAptosWallet';
// import { aptosClient } from 'config/aptosClient';
import { message, notification } from 'components/Antd';
import { TTransaction } from 'types/hippo';
import { useWallet } from '@manahippo/aptos-wallet-adapter';
import { MaybeHexString } from 'aptos';
import { TransactionPayload, TransactionPayload_ScriptFunctionPayload } from 'aptos/dist/generated';
import { useDispatch } from 'react-redux';
import swapAction from 'modules/swap/actions';

interface HippoClientContextType {
  hippoWallet?: HippoWalletClient;
  hippoAgg?: TradeAggregator;
  hippoSwap?: HippoSwapClient;
  tokenStores?: Record<string, aptos_framework.Coin.CoinStore>;
  tokenInfos?: Record<string, Coin_registry.TokenInfo>;
  requestSwap: (
    fromSymbol: string,
    toSymbol: string,
    uiAmtIn: number,
    uiAmtOutMin: number,
    callback: () => void
  ) => {};
  requestDeposit: (
    lhsSymbol: string,
    rhsSymbol: string,
    poolType: PoolType,
    lhsUiAmt: number,
    rhsUiAmt: number,
    callback: () => void
  ) => {};
  requestWithdraw: (
    lhsSymbol: string,
    rhsSymbol: string,
    poolType: PoolType,
    liqiudityAmt: UITokenAmount,
    lhsMinAmt: UITokenAmount,
    rhsMinAmt: UITokenAmount,
    callback: () => void
  ) => {};
  transaction?: TTransaction;
  setTransaction: (trans?: TTransaction) => void;
  requestFaucet: (symbol: string, callback?: () => void) => void;
}

interface TProviderProps {
  children: ReactNode;
}

const openNotification = (txhash: MaybeHexString) => {
  notification.open({
    message: 'Transaction Success',
    description: (
      <p>
        You can verify the transaction by visiting the{' '}
        <a
          href={`https://explorer.devnet.aptos.dev/txn/${txhash}`}
          target="_blank"
          rel="noreferrer"
          className="underline">
          Aptos Transaction Explorer
        </a>
      </p>
    ),
    placement: 'bottomLeft'
  });
};

const HippoClientContext = createContext<HippoClientContextType>({} as HippoClientContextType);

const payloadV1ToV0 = (payload: TransactionPayload) => {
  const v1 = payload as TransactionPayload_ScriptFunctionPayload;
  return {
    type: 'script_function_payload',
    function: `${v1.function.module.address}::${v1.function.module.name}::${v1.function.name}`,
    type_arguments: v1.type_arguments,
    arguments: v1.arguments
  };
};

const HippoClientProvider: FC<TProviderProps> = ({ children }) => {
  const { activeWallet } = useAptosWallet();
  const { signAndSubmitTransaction } = useWallet();
  const [hippoWallet, setHippoWallet] = useState<HippoWalletClient>();
  const [hippoSwap, setHippoSwapClient] = useState<HippoSwapClient>();
  const [hippoAgg, setHippoAgg] = useState<TradeAggregator>();
  const [refresh, setRefresh] = useState(false);
  const [transaction, setTransaction] = useState<TTransaction>();
  const [tokenStores, setTokenStores] = useState<Record<string, aptos_framework.Coin.CoinStore>>();
  const [tokenInfos, setTokenInfos] = useState<Record<string, Coin_registry.TokenInfo>>();
  const dispatch = useDispatch();

  const requestFaucet = useCallback(
    async (symbol: string, callback?: () => void) => {
      try {
        if (!activeWallet) throw new Error('Please login first');
        if (symbol !== 'APTOS') {
          const uiAmtUsed = symbol === 'BTC' ? 0.01 : 10;
          const payload = hippoWallet?.makeFaucetMintToPayload(uiAmtUsed, symbol);
          if (payload) {
            const result = await signAndSubmitTransaction(payloadV1ToV0(payload));
            if (result) {
              openNotification(result.hash);
              await hippoWallet?.refreshStores();
              setRefresh(true);
              if (callback) callback();
            }
          }
        }
      } catch (error) {
        console.log('request faucet error:', error);
        if (error instanceof Error) {
          message.error(error?.message);
        }
      }
    },
    [activeWallet, hippoWallet, signAndSubmitTransaction]
  );

  const getHippoWalletClient = useCallback(async () => {
    if (activeWallet) {
      const client = await hippoWalletClient(activeWallet);
      setHippoWallet(client);
    }
  }, [activeWallet]);

  const getHippoSwapClient = useCallback(async () => {
    const sClient = await hippoSwapClient();
    setHippoSwapClient(sClient);
  }, []);

  const getHippoTradeAggregator = useCallback(async () => {
    setHippoAgg(await hippoTradeAggregator());
  }, []);

  useEffect(() => {
    getHippoWalletClient();
    getHippoSwapClient();
    getHippoTradeAggregator();
  }, [getHippoWalletClient, getHippoSwapClient, getHippoTradeAggregator]);

  useEffect(() => {
    if (hippoWallet) {
      setTokenStores(hippoWallet?.symbolToCoinStore);
      setTokenInfos(hippoWallet?.symbolToTokenInfo);
      if (refresh) {
        getHippoWalletClient();
        setRefresh(false);
      }
    }
  }, [hippoWallet, refresh, getHippoWalletClient]);

  useEffect(() => {
    if (hippoSwap) {
      dispatch(swapAction.SET_TOKEN_LIST(hippoSwap.singleTokens));
    }
  }, [dispatch, hippoSwap]);

  const requestSwap = useCallback(
    async (
      fromSymbol: string,
      toSymbol: string,
      uiAmtIn: number,
      uiAmtOutMin: number,
      callback: () => void
    ) => {
      try {
        if (!activeWallet || !hippoSwap) throw new Error('Please login first');
        if (uiAmtIn <= 0) {
          throw new Error('Input amount needs to be greater than 0');
        }
        const bestQuote = await hippoSwap.getBestQuoteBySymbols(fromSymbol, toSymbol, uiAmtIn, 3);
        if (!bestQuote) {
          throw new Error(`No route exists from ${fromSymbol} to ${toSymbol}`);
        }
        const payload = await bestQuote.bestRoute.makeSwapPayload(uiAmtIn, uiAmtOutMin);
        console.log('request swap payload', payload);
        const result = await signAndSubmitTransaction(payloadV1ToV0(payload));
        if (result) {
          message.success('Transaction Success');
          setRefresh(true);
          callback();
        }
      } catch (error) {
        console.log('request swap error:', error);
        if (error instanceof Error) {
          message.error(error?.message);
        }
      }
    },
    [hippoSwap, activeWallet, signAndSubmitTransaction]
  );

  const requestDeposit = useCallback(
    async (
      lhsSymbol: string,
      rhsSymbol: string,
      poolType: PoolType,
      lhsUiAmt: number,
      rhsUiAmt: number,
      callback: () => void
    ) => {
      try {
        if (!activeWallet || !hippoSwap) {
          throw new Error('Please login first');
        }
        const pool = hippoSwap.getDirectPoolsBySymbolsAndPoolType(lhsSymbol, rhsSymbol, poolType);
        if (pool.length === 0) {
          throw new Error('Desired pool does not exist');
        }
        const payload = await pool[0].makeAddLiquidityPayload(lhsUiAmt, rhsUiAmt);
        const result = await signAndSubmitTransaction(payloadV1ToV0(payload));
        if (result) {
          message.success('Transaction Success');
          setRefresh(true);
          callback();
        }
      } catch (error) {
        console.log('request deposit error:', error);
        if (error instanceof Error) {
          message.error(error?.message);
        }
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
      rhsMinAmt: UITokenAmount,
      callback: () => void
    ) => {
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
        const result = await signAndSubmitTransaction(payloadV1ToV0(payload));
        if (result) {
          message.success('Transaction Success');
          setRefresh(true);
          callback();
        }
      } catch (error) {
        console.log('request withdraw error:', error);
        if (error instanceof Error) {
          message.error(error?.message);
        }
      }
    },
    [hippoSwap, activeWallet, signAndSubmitTransaction]
  );

  return (
    <HippoClientContext.Provider
      value={{
        hippoWallet,
        hippoSwap,
        hippoAgg,
        tokenStores,
        tokenInfos,
        requestSwap,
        requestDeposit,
        requestWithdraw,
        transaction,
        setTransaction,
        requestFaucet
      }}>
      {children}
    </HippoClientContext.Provider>
  );
};

export { HippoClientProvider, HippoClientContext };
