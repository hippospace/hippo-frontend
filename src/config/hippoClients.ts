import { App, HippoSwapClient, HippoWalletClient } from '@manahippo/hippo-sdk';
import { TradeAggregator } from '@manahippo/hippo-sdk/dist/aggregator/aggregator';
import { AptosAccount, HexString } from 'aptos';
import { ActiveAptosWallet } from 'types/aptos';
import { readConfig } from 'utils/hippoWalletUtil';
import { aptosClient } from './aptosClient';

// A temp fetcher account which will be removed in future
const fetcher = new AptosAccount(
  new HexString('0xd22fbe060ce4b348ff8536039763f9dc1de64b10196a45f464a6a56c1b996e5f').toUint8Array()
);

export const hippoWalletClient = async (account: ActiveAptosWallet) => {
  if (!account) return undefined;
  const { netConf } = readConfig();
  const walletClient = await HippoWalletClient.createInTwoCalls(
    netConf,
    new App(aptosClient),
    account,
    fetcher
  );

  return walletClient;
};

export const hippoSwapClient = async () => {
  const { netConf } = readConfig();
  const swapClient = await HippoSwapClient.createInOneCall(new App(aptosClient), netConf, fetcher);

  return swapClient;
};

export const hippoTradeAggregator = async () => {
  const agg = await TradeAggregator.create(new App(aptosClient), fetcher);
  return agg;
};
