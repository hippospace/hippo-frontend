import { App, HippoWalletClient, NetworkConfiguration } from '@manahippo/hippo-sdk';
import { TradeAggregator } from '@manahippo/hippo-sdk';
import { CoinListClient } from '@manahippo/hippo-sdk';
import { ActiveAptosWallet } from 'types/aptos';
import { debounce } from 'lodash';
import { openErrorNotification } from 'utils/notifications';
import { AptosClient } from 'aptos';

const errorHandler = debounce(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (_err: any) => {
    // store.dispatch(commonActions.SET_RESOURCES_NOT_FOUND(true));
    openErrorNotification({ detail: 'Resource not found or loaded' });
  },
  1000,
  { leading: false, trailing: true }
);

export const hippoWalletClient = async (
  account: ActiveAptosWallet,
  netConf: NetworkConfiguration,
  aptosClient: AptosClient,
  version: undefined | number | bigint
) => {
  let walletClient: HippoWalletClient | undefined;
  try {
    if (!account) return undefined;
    walletClient = await HippoWalletClient.createInTwoCalls(
      netConf,
      new App(aptosClient),
      account,
      version
    );
  } catch (err: any) {
    if (err.errorCode === 'account_not_found') {
      openErrorNotification({
        detail: "Cann't find your account. Please fund your account first."
      });
      return;
    }
    console.log('Get hippo wallet client failed', err);
    errorHandler(err);
  }

  return walletClient;
};

export const hippoTradeAggregator = async (aptosClient: AptosClient) => {
  let agg: TradeAggregator | undefined;
  try {
    agg = await TradeAggregator.create(aptosClient);
  } catch (err: any) {
    console.log('Get hippo trade aggregator failed', err);
    errorHandler(err);
  }
  return agg;
};

export const coinListClient = async (aptosClient: AptosClient) => {
  let client: CoinListClient | undefined;
  try {
    client = await CoinListClient.load(new App(aptosClient));
  } catch (err: any) {
    console.log('Get coin list client failed', err);
    errorHandler(err);
  }

  return client;
};
