import { ErrorBoundary } from 'components';
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
          <HippoClientProvider>{props.children}</HippoClientProvider>
        </AptosWalletProvider>
      </WalletProvider>
    </ErrorBoundary>
  );
};

export default Providers;
