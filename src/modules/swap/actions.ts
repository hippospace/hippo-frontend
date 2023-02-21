import { createAction } from '@reduxjs/toolkit';
import { ISwapSettings } from 'pages/Swap/types';
import { RawCoinInfo } from '@manahippo/coin-list';

const SET_IS_FETCHING = createAction<boolean>('swap/SET_IS_FETCHING');
const SET_TOKEN_LIST = createAction<RawCoinInfo[]>('swap/SET_TOKEN_LIST');
const SET_SWAP_SETTING = createAction<ISwapSettings>('swap/SET_SWAP_SETTING');
const RESET = createAction<ISwapSettings>('swap/RESET');
const SET_IS_PRICE_CHART_OPEN = createAction<boolean>('swap/SET_IS_PRICE_CHART_OPEN');

export default {
  SET_IS_FETCHING,
  SET_TOKEN_LIST,
  SET_SWAP_SETTING,
  RESET,
  SET_IS_PRICE_CHART_OPEN
};
