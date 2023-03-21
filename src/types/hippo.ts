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

export enum PriceChangePeriod {
  '1D' = '1D',
  '7D' = '7D',
  '30D' = '30D'
}
export interface ILpPriceChange {
  lp: string;
  dex: string;
  poolType: number;
  isTVLTooLow?: boolean;
  latestLpPrice?: string;
  priceChanges: Record<PriceChangePeriod, string | undefined>;
}

export interface ICoinPriceChange {
  coin: string;
  type?: 'lp' | 'coin' | 'cToken';
  changes: Record<PriceChangePeriod, string | undefined>;
}

export class HttpError extends Error {
  status: number | undefined;

  info: any | undefined;
}
