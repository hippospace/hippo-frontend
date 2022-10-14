import { App, HippoWalletClient } from '@manahippo/hippo-sdk';
import { TradeAggregator } from '@manahippo/hippo-sdk';
import { CoinListClient } from '@manahippo/hippo-sdk';
// import { store } from 'Providers';
import { ActiveAptosWallet } from 'types/aptos';
import { readConfig } from 'utils/hippoWalletUtil';
import { aptosClient } from './aptosClient';
// import commonActions from 'modules/common/actions';
import { debounce } from 'lodash';
import { message } from 'antd';

const errorHandler = debounce(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (_err: any) => {
    // store.dispatch(commonActions.SET_RESOURCES_NOT_FOUND(true));
    message.error('Resource not found or loaded');
  },
  1000,
  { leading: false, trailing: true }
);

export const hippoWalletClient = async (account: ActiveAptosWallet) => {
  let walletClient: HippoWalletClient | undefined;
  try {
    if (!account) return undefined;
    const netConf = readConfig();
    walletClient = await HippoWalletClient.createInTwoCalls(netConf, new App(aptosClient), account);
  } catch (err: any) {
    if (err.errorCode === 'account_not_found') {
      message.error("Cann't find your account. Please fund your account first.");
      return;
    }
    console.log('Get hippo wallet client failed', err);
    errorHandler(err);
  }

  return walletClient;
};

export const hippoTradeAggregator = async () => {
  let agg: TradeAggregator | undefined;
  try {
    agg = await TradeAggregator.create(aptosClient);
  } catch (err: any) {
    console.log('Get hippo trade aggregator failed', err);
    errorHandler(err);
  }
  return agg;
};

export const coinListClient = async () => {
  let client: CoinListClient | undefined;
  try {
    client = await CoinListClient.load(new App(aptosClient));
  } catch (err: any) {
    console.log('Get coin list client failed', err);
    errorHandler(err);
  }

  return client;
};
