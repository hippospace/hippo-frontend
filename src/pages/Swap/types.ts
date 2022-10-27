import { IApiRouteAndQuote } from '@manahippo/hippo-sdk/dist/aggregator/types';
import { RawCoinInfo as TokenInfo } from '@manahippo/coin-list';

export interface ISwapSettings {
  slipTolerance: number;
  trasactionDeadline: number;
  maxGasFee: number;
  quoteChosen?: IApiRouteAndQuote;
  currencyFrom?: {
    token?: TokenInfo;
    amount?: number;
    balance: number;
  };
  currencyTo?: {
    token?: TokenInfo;
    amount?: number;
    balance: number;
  };
}
