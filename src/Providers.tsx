import { Provider as ReduxProvider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { logger } from 'redux-logger';
import { ErrorBoundary } from 'components';
import reducer from 'modules/rootReducer';
import { AptosWalletProvider } from 'contexts/AptosWalletProvider';
import { HippoClientProvider } from 'contexts/HippoClientProvider';
import {
  WalletProvider,
  AptosWalletAdapter,
  MartianWalletAdapter,
  PontemWalletAdapter,
  SpikaWalletAdapter,
  RiseWalletAdapter
} from '@manahippo/aptos-wallet-adapter';
import { useMemo } from 'react';
import { message } from 'antd';

const isDevelopmentMode = process.env.NODE_ENV === 'development';

export const store = configureStore({
  reducer,
  devTools: isDevelopmentMode,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: {
        ignoredPaths: ['connection']
      }
    }).concat(isDevelopmentMode ? [logger] : [])
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
      new SpikaWalletAdapter()
    ],
    []
  );

  return (
    <ErrorBoundary>
      <WalletProvider
        wallets={wallets}
        autoConnect
        onError={(error: Error) => {
          console.log('wallet errors: ', error);
          let text = '';
          if (error.name === 'WalletNotReadyError') {
            text = 'Wallet not ready';
          }
          message.error(error.message || text);
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
