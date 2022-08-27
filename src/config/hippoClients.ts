import { App, HippoSwapClient, HippoWalletClient } from '@manahippo/hippo-sdk';
import { TradeAggregator } from '@manahippo/hippo-sdk/dist/aggregator/aggregator';
import { ActiveAptosWallet } from 'types/aptos';
import { readConfig } from 'utils/hippoWalletUtil';
import { aptosClient } from './aptosClient';

export const hippoWalletClient = async (account: ActiveAptosWallet) => {
  if (!account) return undefined;
  const netConf = readConfig();
  const walletClient = await HippoWalletClient.createInTwoCalls(
    netConf,
    new App(aptosClient),
    account,
    netConf.simulationKeys
  );

  return walletClient;
};

export const hippoSwapClient = async () => {
  const netConf = readConfig();
  const swapClient = await HippoSwapClient.createInOneCall(
    new App(aptosClient),
    netConf,
    netConf.simulationKeys
  );

  return swapClient;
};

export const hippoTradeAggregator = async () => {
  const netConf = readConfig();
  const agg = await TradeAggregator.create(new App(aptosClient), netConf.simulationKeys);
  return agg;
};
