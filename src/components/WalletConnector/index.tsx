import Button from 'components/Button';
import useAptosWallet from 'hooks/useAptosWallet';
import { walletAddressEllipsis } from 'utils/utility';
import { Drawer, Popover } from 'components/Antd';
import styles from './WalletConnector.module.scss';
import WalletSelector from './components/WalletSelector';
import WalletMenu from './components/WalletMenu';
import { WalletConnectedIcon, WalletNotConnectedIcon } from 'resources/icons';
import classNames from 'classnames';
import { useWallet } from '@manahippo/aptos-wallet-adapter';

const WalletModal = ({ className = '' }: { className?: string }) => {
  const { activeWallet, closeModal } = useAptosWallet();

  return (
    <div className={className}>
      {activeWallet ? (
        <WalletMenu
          onDisconnected={() => {
            closeModal();
          }}
        />
      ) : (
        <WalletSelector
          onConnected={() => {
            closeModal();
          }}
        />
      )}
    </div>
  );
};

const WalletConnector: React.FC = () => {
  const { wallet } = useWallet();
  const { activeWallet, openModal, open, closeModal } = useAptosWallet();

  return (
    <>
      <Popover
        className="mobile:hidden"
        overlayClassName={classNames(styles.popover)}
        trigger="click"
        visible={open}
        onVisibleChange={(visible) => (visible ? openModal() : closeModal())}
        content={<WalletModal className="mobile:hidden" />}
        destroyTooltipOnHide
        placement="bottomLeft">
        <div className="flex gap-4 items-center">
          <Button
            variant="secondary"
            size="small"
            className="min-w-[156px] h-10 font-bold"
            // onClick={!address ? toggleConnectModal : undefined}
          >
            {activeWallet ? (
              <>
                <img src={wallet?.adapter.icon} className="w-6 h-6 mr-2" />{' '}
                {walletAddressEllipsis(activeWallet?.toString())}
              </>
            ) : (
              'Connect To Wallet'
            )}
          </Button>
        </div>
      </Popover>
      <div className="hidden mobile:block" onClick={() => openModal()}>
        {activeWallet ? (
          <WalletConnectedIcon className="w-6" />
        ) : (
          <WalletNotConnectedIcon className="w-6" />
        )}
      </div>
      <Drawer
        className="hidden mobile:block"
        closable={false}
        title={!activeWallet ? <h6 className="font-bold text-black">Connect your wallet</h6> : ''}
        height={'auto'}
        placement={'bottom'}
        onClose={() => closeModal()}
        visible={open}>
        <WalletModal className="hidden mobile:block" />
      </Drawer>
    </>
  );
};

export default WalletConnector;
