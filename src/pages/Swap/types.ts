import { IApiRouteAndQuote } from '@manahippo/hippo-sdk/dist/aggregator/types';
import { RawCoinInfo as TokenInfo } from '@manahippo/coin-list';

export interface ISwapSettings {
  slipTolerance: number;
  trasactionDeadline: number;
  maxGasFee: number;
  quoteChosen?: IApiRouteAndQuote;
  fromSymbolSaved: string;
  toSymbolSaved: string;
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

  isFixedOutput: boolean;
}
