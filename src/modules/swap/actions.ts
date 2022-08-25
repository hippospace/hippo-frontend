import { CoinInfo } from '@manahippo/hippo-sdk/dist/generated/coin_list/coin_list';
import { createAction } from '@reduxjs/toolkit';
import { ISwapSettings } from 'pages/Swap/types';

const SET_IS_FETCHING = createAction<boolean>('swap/SET_IS_FETCHING');
const SET_TOKEN_LIST = createAction<CoinInfo[]>('swap/SET_TOKEN_LIST');
const SET_SWAP_SETTING = createAction<ISwapSettings>('swap/SET_SWAP_SETTING');
const RESET = createAction<ISwapSettings>('swap/RESET');

export default {
  SET_IS_FETCHING,
  SET_TOKEN_LIST,
  SET_SWAP_SETTING,
  RESET
};
