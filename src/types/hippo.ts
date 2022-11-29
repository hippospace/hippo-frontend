import { RawCoinInfo as CoinInfo } from '@manahippo/coin-list';
import { IApiRouteAndQuote, SplitRouteAndQuote } from '@manahippo/hippo-sdk/dist/aggregator/types';
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

export type GeneralRouteAndQuote = IApiRouteAndQuote | SplitRouteAndQuote;
