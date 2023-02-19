import { combineReducers } from '@reduxjs/toolkit';
import account from './account';
import common from './common';
import swap from './swap';

const rootReducer = combineReducers({
  account: account.reducer,
  swap: swap.reducer,
  common: common.reducer
});
export default rootReducer;
export type RootState = ReturnType<typeof rootReducer>;

export const initRootState = {
  account: account.initState,
  swap: swap.initState,
  common: common.initState
};
