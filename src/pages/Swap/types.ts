import { RouteAndQuote } from '@manahippo/hippo-sdk/dist/aggregator/types';
import { TokenInfo } from '@manahippo/hippo-sdk/dist/generated/coin_registry/coin_registry';

export interface ISwapSettings {
  slipTolerance: number;
  trasactionDeadline: number;
  maxGasFee: number;
  quoteChosen?: RouteAndQuote;
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
