import { createAction } from '@reduxjs/toolkit';
import { ISwapSettings } from 'pages/Swap/components/TokenSwap';

const SET_SWAP_SETTING = createAction<ISwapSettings>('swap/SET_SWAP_SETTING');
const SET_IS_PRICE_CHART_OPEN = createAction<boolean>('swap/SET_IS_PRICE_CHART_OPEN');
const SET_FROM_SYMBOL_SAVED = createAction<string>('swap/SET_FROM_SYMBOL_SAVED');
const SET_TO_SYMBOL_SAVED = createAction<string>('swap/SET_TO_symbol_SAVED');

export default {
  SET_SWAP_SETTING,
  SET_IS_PRICE_CHART_OPEN,
  SET_FROM_SYMBOL_SAVED,
  SET_TO_SYMBOL_SAVED
};
