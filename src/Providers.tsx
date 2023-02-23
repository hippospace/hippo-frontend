import { Provider as ReduxProvider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { logger } from 'redux-logger';
import { ErrorBoundary } from 'components';
import reducer, { initRootState } from 'modules/rootReducer';
import { AptosWalletProvider } from 'contexts/AptosWalletProvider';
import { HippoClientProvider } from 'contexts/HippoClientProvider';
import {
  WalletProvider,
  AptosWalletAdapter,
  MartianWalletAdapter,
  PontemWalletAdapter,
  RiseWalletAdapter,
  NightlyWalletAdapter,
  FewchaWalletAdapter,
  SpikaWalletAdapter,
  FletchWalletAdapter,
  HyperPayWalletAdapter,
  TokenPocketWalletAdapter,
  BitkeepWalletAdapter
} from '@manahippo/aptos-wallet-adapter';
import { useMemo } from 'react';
import { openErrorNotification } from 'utils/notifications';
import pickDeep from 'pick-deep';
import debounce from 'lodash/debounce';
import merge from 'lodash/merge';

const isDevelopmentMode = process.env.NODE_ENV === 'development';

const REDUX_PERSIST_KEY = 'redux-state';
const loadReduxSavedState = () => {
  try {
    const item = localStorage.getItem(REDUX_PERSIST_KEY);
    if (!item) return undefined;
    return JSON.parse(item);
  } catch {
    return undefined;
  }
};
const saveReduxState = debounce(<T extends object>(state: T, paths: string[]) => {
  try {
    const stateToSave = pickDeep(state, paths);
    // console.log('Saving redux...');
    localStorage.setItem(REDUX_PERSIST_KEY, JSON.stringify(stateToSave));
  } catch {
    // do nothing
  }
}, 1000);

// fix: saved state without merging initial state would break formik without errors thrown
const preloadedState = merge({}, initRootState, loadReduxSavedState());

export const store = configureStore({
  reducer,
  preloadedState,
  devTools: isDevelopmentMode,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: {
        ignoredPaths: ['connection']
      }
    }).concat(isDevelopmentMode ? [logger] : [])
});

store.subscribe(() => {
  saveReduxState(store.getState(), [
    'swap.swapSettings.slipTolerance',
    'swap.swapSettings.trasactionDeadline',
    'swap.swapSettings.maxGasFee',
    'swap.isPriceChartOpen'
  ]);
});

type TProps = {
  children: any;
};

const Providers: React.FC<TProps> = (props: TProps) => {
  const wallets = useMemo(
    () => [
      new RiseWalletAdapter(),
      new MartianWalletAdapter(),
      new AptosWalletAdapter(),
      new PontemWalletAdapter(),
      new FewchaWalletAdapter(),
      new BitkeepWalletAdapter(),
      new SpikaWalletAdapter(),
      new NightlyWalletAdapter(),
      new FletchWalletAdapter(),
      new TokenPocketWalletAdapter(),
      new HyperPayWalletAdapter()
    ],
    []
  );

  return (
    <ErrorBoundary>
      <WalletProvider
        wallets={wallets}
        autoConnect
        onError={(error: Error) => {
          let text = 'Unknow error';
          if (error.name === 'WalletNotReadyError') {
            text = 'Wallet not ready';
          }
          openErrorNotification({ detail: error.message || text, title: 'Wallet Error' });
          console.log(error);
        }}>
        <AptosWalletProvider>
          <ReduxProvider store={store}>
            <HippoClientProvider>{props.children}</HippoClientProvider>
          </ReduxProvider>
        </AptosWalletProvider>
      </WalletProvider>
    </ErrorBoundary>
  );
};

export default Providers;
