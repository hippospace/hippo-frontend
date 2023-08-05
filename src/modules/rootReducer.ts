import { combineReducers } from '@reduxjs/toolkit';
import swap from './swap';

const rootReducer = combineReducers({
  swap: swap.reducer
});
export default rootReducer;
export type RootState = ReturnType<typeof rootReducer>;

export const initRootState = {
  swap: swap.initState
};
