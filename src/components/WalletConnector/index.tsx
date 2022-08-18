import Button from 'components/Button';
import useAptosWallet from 'hooks/useAptosWallet';
import { walletAddressEllipsis } from 'utils/utility';
import { Drawer, Popover } from 'components/Antd';
import styles from './WalletConnector.module.scss';
// import WebWallet from 'components/WebWallet';
import WalletSelector from './components/WalletSelector';
import WalletMenu from './components/WalletMenu';
import { useWallet } from '@manahippo/aptos-wallet-adapter';
import { useCallback, useState } from 'react';
import WebWallet from 'components/WebWallet';
import { WalletIcon } from 'resources/icons';
import classNames from 'classnames';
// import { useCallback } from 'react';

const WalletConnector: React.FC = () => {
  const { activeWallet, openModal, open, closeModal } = useAptosWallet();
  const { wallet } = useWallet();
  const [isMobileDrawerVisible, setIsMobileDrawerVisible] = useState(false);

  const renderContent = useCallback(() => {
    if (wallet && wallet.adapter.name === 'Hippo Web Wallet') {
      return <WebWallet />;
    }
    // TODO: send notification messages when wallet connected/disconnected
    return activeWallet ? (
      <WalletMenu
        onDisconnected={() => {
          closeModal();
          setIsMobileDrawerVisible(false);
        }}
      />
    ) : (
      <WalletSelector
        onConnected={() => {
          closeModal();
          setIsMobileDrawerVisible(false);
        }}
      />
    );
  }, [activeWallet, closeModal, wallet]);

  return (
    <>
      <Popover
        className="mobile:hidden"
        overlayClassName={classNames(styles.popover)}
        trigger="click"
        visible={open}
        onVisibleChange={(visible) => (visible ? openModal() : closeModal())}
        content={renderContent}
        destroyTooltipOnHide
        placement="bottomLeft">
        <div className="flex gap-4 items-center">
          <Button
            variant="secondary"
            size="small"
            className="min-w-[156px] h-10 font-bold"
            // onClick={!address ? toggleConnectModal : undefined}
          >
            {activeWallet ? walletAddressEllipsis(activeWallet?.toString()) : 'Connect To Wallet'}
          </Button>
        </div>
      </Popover>
      <div className="hidden mobile:block">
        <WalletIcon
          className={classNames('font-icon text-[28px] !align-[-0.28em]', {
            'text-primePurple-700': activeWallet
          })}
          onClick={() => setIsMobileDrawerVisible(true)}
        />
      </div>
      <Drawer
        closable={!activeWallet}
        title={!activeWallet ? <h6 className="font-bold text-black">Connect your wallet</h6> : ''}
        height={'auto'}
        placement={'bottom'}
        onClose={() => setIsMobileDrawerVisible(false)}
        visible={isMobileDrawerVisible}>
        {renderContent()}
      </Drawer>
    </>
  );
};

export default WalletConnector;
