import Button from 'components/Button';
import { useWallet } from '@manahippo/aptos-wallet-adapter';
import { walletAddressEllipsis } from 'utils/utility';
import useAptosWallet from 'hooks/useAptosWallet';

const WalletMenu = ({ onDisconnected }: { onDisconnected: () => any }) => {
  const { disconnect } = useWallet();
  const { activeWallet } = useAptosWallet();
  return (
    <div className="flex flex-col w-full p-2">
      <div className="hidden mobile:block space-y-2 mb-6 text-center">
        <div className="h6 text-gradient-primary">Wallet connected</div>
        <div className="h5">{walletAddressEllipsis(activeWallet?.toString())}</div>
      </div>
      <Button
        onClick={async () => {
          await disconnect();
          onDisconnected();
        }}
        className="w-full">
        Disconnect wallet
      </Button>
    </div>
  );
};

export default WalletMenu;
