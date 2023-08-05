import { createReducer } from '@reduxjs/toolkit';
import { RootState } from 'modules/rootReducer';
import { ISwapSettings } from 'pages/Swap/types';
import actions from './actions';

interface SwapState {
  error: any;
  isPriceChartOpen: boolean;
  fromSymbolSaved: string;
  toSymbolSaved: string;
  swapSettings: ISwapSettings;
}

export const initState: SwapState = {
  error: null,
  isPriceChartOpen: false,
  fromSymbolSaved: 'USDC',
  toSymbolSaved: 'APT',
  swapSettings: {
    slipTolerance: 0.1,
    trasactionDeadline: 60,
    maxGasFee: 20000,
    quoteChosen: undefined,
    currencyFrom: {
      token: undefined,
      amount: undefined,
      balance: 0
    },
    currencyTo: {
      token: undefined,
      amount: undefined,
      balance: 0
    },

    isFixedOutput: false
  }
};

export default createReducer(initState, (builder) => {
  builder
    .addCase(actions.SET_SWAP_SETTING, (state, { payload }) => {
      state.swapSettings = payload;
    })
    .addCase(actions.RESET, (state) => {
      state.swapSettings = initState.swapSettings;
    })
    .addCase(actions.SET_IS_PRICE_CHART_OPEN, (state, { payload }) => {
      state.isPriceChartOpen = payload;
    })
    .addCase(actions.SET_FROM_SYMBOL_SAVED, (state, { payload }) => {
      state.fromSymbolSaved = payload;
    })
    .addCase(actions.SET_TO_SYMBOL_SAVED, (state, { payload }) => {
      state.toSymbolSaved = payload;
    });
});

export const getSwapSettings = (state: RootState) => state.swap.swapSettings;
export const getIsPriceChartOpen = (state: RootState) => state.swap.isPriceChartOpen;
export const getFromSymbolSaved = (state: RootState) => state.swap.fromSymbolSaved;
export const getToSymbolSaved = (state: RootState) => state.swap.toSymbolSaved;
