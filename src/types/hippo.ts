import { RawCoinInfo as CoinInfo } from '@manahippo/coin-list';
import {
  IApiRouteAndQuote,
  SplitMultiRouteAndQuote,
  SplitSingleRouteAndQuote
} from '@manahippo/hippo-sdk/dist/aggregator/types';
import { Types } from 'aptos';

export type TTransaction = {
  // type: 'signTransaction' | 'signAndSubmit';
  transaction: Types.SubmitTransactionRequest;
  callback: () => void;
  // transactionInfo: Record<string, string | number>;
};

export interface ITokenBalance {
  token: CoinInfo;
  balance: number;
}

export type GeneralRouteAndQuote =
  | IApiRouteAndQuote
  | SplitSingleRouteAndQuote
  | SplitMultiRouteAndQuote;

export enum LpPriceChangePeriod {
  '6H' = '6H',
  '1D' = '1D',
  '7D' = '7D'
}
export interface ILpPriceChange {
  lp: string;
  dex: string;
  poolType: number;
  latestLpPrice: string;
  priceChanges: Record<LpPriceChangePeriod, string>;
}
