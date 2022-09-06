import { App, HippoSwapClient, HippoWalletClient } from '@manahippo/hippo-sdk';
import { TradeAggregator } from '@manahippo/hippo-sdk/dist/aggregator/aggregator';
import { CoinListClient } from '@manahippo/hippo-sdk/dist/coinList';
import { message } from 'antd';
import { ActiveAptosWallet } from 'types/aptos';
import { readConfig } from 'utils/hippoWalletUtil';
import { aptosClient } from './aptosClient';

export const hippoWalletClient = async (account: ActiveAptosWallet) => {
  let walletClient: HippoWalletClient | undefined;
  try {
    if (!account) return undefined;
    const netConf = readConfig();
    walletClient = await HippoWalletClient.createInTwoCalls(
      netConf,
      new App(aptosClient),
      account,
      netConf.simulationKeys
    );
  } catch (err: any) {
    message.error(err.message);
  }

  return walletClient;
};

export const hippoSwapClient = async () => {
  let swapClient: HippoSwapClient | undefined;
  try {
    const netConf = readConfig();
    swapClient = await HippoSwapClient.createInOneCall(
      new App(aptosClient),
      netConf,
      netConf.simulationKeys
    );
  } catch (err: any) {
    message.error(err.message);
  }

  return swapClient;
};

export const hippoTradeAggregator = async () => {
  let agg: TradeAggregator | undefined;
  try {
    const netConf = readConfig();
    agg = await TradeAggregator.create(new App(aptosClient), netConf.simulationKeys);
  } catch (err: any) {
    message.error(err.message);
  }
  return agg;
};

export const coinListClient = async () => {
  let client: CoinListClient | undefined;
  try {
    const netConf = readConfig();
    client = await CoinListClient.load(new App(aptosClient), netConf.simulationKeys);
  } catch (err: any) {
    message.error(err.message);
  }

  return client;
};
