import { AggregatorTypes } from '@manahippo/hippo-sdk';
import { coin_list } from '@manahippo/hippo-sdk';

export interface ISwapSettings {
  slipTolerance: number;
  trasactionDeadline: number;
  maxGasFee: number;
  quoteChosen?: AggregatorTypes.RouteAndQuote;
  currencyFrom?: {
    token?: coin_list.Coin_list.CoinInfo;
    amount?: number;
    balance: number;
  };
  currencyTo?: {
    token?: coin_list.Coin_list.CoinInfo;
    amount?: number;
    balance: number;
  };
}
