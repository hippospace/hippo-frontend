import { RawCoinInfo as CoinInfo } from '@manahippo/coin-list';
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
