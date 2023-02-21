import { createReducer } from '@reduxjs/toolkit';
import { RootState } from 'modules/rootReducer';
import { ISwapSettings } from 'pages/Swap/types';
import actions from './actions';
import { RawCoinInfo } from '@manahippo/coin-list';

interface SwapState {
  isFetching: boolean;
  isFetched: boolean;
  error: any;
  tokenList: RawCoinInfo[];
  isPriceChartOpen: boolean;
  swapSettings: ISwapSettings;
}

export const initState: SwapState = {
  isFetching: false,
  isFetched: false,
  error: null,
  tokenList: [],
  isPriceChartOpen: false,
  swapSettings: {
    slipTolerance: 0.5,
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
    .addCase(actions.SET_IS_FETCHING, (state, { payload }) => {
      state.isFetching = payload;
      state.isFetched = false;
    })
    .addCase(actions.SET_TOKEN_LIST, (state, { payload }) => {
      state.tokenList = payload;
      state.isFetching = false;
      state.isFetched = true;
    })
    .addCase(actions.SET_SWAP_SETTING, (state, { payload }) => {
      state.swapSettings = payload;
    })
    .addCase(actions.RESET, (state) => {
      state.swapSettings = initState.swapSettings;
    })
    .addCase(actions.SET_IS_PRICE_CHART_OPEN, (state, { payload }) => {
      state.isPriceChartOpen = payload;
    });
});

export const getIsFetchingTokenList = (state: RootState) => state.swap.isFetching;
export const getIsFetchedTokenList = (state: RootState) => state.swap.isFetched;
export const getTokenList = (state: RootState) => state.swap.tokenList;
export const getSwapSettings = (state: RootState) => state.swap.swapSettings;
export const getIsPriceChartOpen = (state: RootState) => state.swap.isPriceChartOpen;
