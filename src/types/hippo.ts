import { CoinInfo } from '@manahippo/hippo-sdk/dist/generated/coin_list/coin_list';
import { Types } from 'aptos';

export type TTransaction = {
  // type: 'signTransaction' | 'signAndSubmit';
  transaction: Types.SubmitTransactionRequest;
  callback: () => void;
  // transactionInfo: Record<string, string | number>;
};

export interface TokenBalance {
  token: CoinInfo;
  balance: number;
}
