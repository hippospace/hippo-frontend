import { RawCoinInfo as CoinInfo } from '@manahippo/coin-list';
import { AggregatorTypes } from '@manahippo/hippo-sdk';
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

export interface IRoutesGroupedByDex {
  dex: AggregatorTypes.DexType;
  routes: GeneralRouteAndQuote[];
}

export enum PriceChangePeriod {
  '1D' = '1D',
  '7D' = '7D',
  '30D' = '30D'
}

export interface ILp {
  lp: string;
  dex: string;
  poolType: number;
  extra: string;
}
export interface ILpPriceChange extends ILp {
  isTVLTooLow?: boolean;
  latestLpPrice?: string;
  priceChanges: Record<PriceChangePeriod, string | undefined>;
}

export interface IExtra {
  stable?: boolean;
  weights?: number[];
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
