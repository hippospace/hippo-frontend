import Button from 'components/Button';
import useAptosWallet from 'hooks/useAptosWallet';
import { walletAddressEllipsis } from 'utils/utility';
import { Drawer, Modal, Popover } from 'components/Antd';
import styles from './WalletConnector.module.scss';
import WalletDisconnector from './components/WalletDisconnector';
import { WalletConnectedIcon, WalletNotConnectedIcon } from 'resources/icons';
import { useWallet } from '@manahippo/aptos-wallet-adapter';
import { useBreakpoint } from 'hooks/useBreakpoint';
import WalletSelector from './components/WalletSelector';

const WalletConnector: React.FC = () => {
  const { wallet } = useWallet();
  const { activeWallet, openModal, open, closeModal } = useAptosWallet();
  const { isMobile } = useBreakpoint('mobile');

  return (
    <>
      {!isMobile && (
        <div className="flex gap-4 items-center">
          <Popover
            overlayClassName={styles.popover}
            trigger="click"
            visible={open && !!activeWallet}
            onVisibleChange={(visible) => (visible ? openModal() : closeModal())}
            content={
              <WalletDisconnector
                onDisconnected={() => {
                  closeModal();
                }}
              />
            }
            destroyTooltipOnHide
            placement="bottomLeft">
            <Button
              variant="secondary"
              size="small"
              className="min-w-[156px] h-10 font-bold"
              onClick={!activeWallet ? () => openModal() : undefined}>
              {activeWallet ? (
                <>
                  <img src={wallet?.adapter.icon} className="w-6 h-6 mr-2" />{' '}
                  {walletAddressEllipsis(activeWallet?.toString())}
                </>
              ) : (
                'Connect To Wallet'
              )}
            </Button>
          </Popover>
          {!isMobile && (
            <Modal
              width={'456px'}
              bodyStyle={{ padding: 0 }}
              visible={open && !activeWallet}
              footer={null}
              closable={false}
              maskClosable={true}
              centered
              destroyOnClose={true}
              onCancel={closeModal}>
              <WalletSelector onConnected={closeModal} onCancel={closeModal} />
            </Modal>
          )}
        </div>
      )}
      {isMobile && (
        <>
          <div className="hidden mobile:block" onClick={() => openModal()}>
            {activeWallet ? (
              <WalletConnectedIcon className="w-6" />
            ) : (
              <WalletNotConnectedIcon className="w-6 dark:fill-grey-900" />
            )}
          </div>
          <Drawer
            className="hidden mobile:block"
            bodyStyle={{ padding: 0 }}
            closable={false}
            height={'auto'}
            placement={'bottom'}
            onClose={() => closeModal()}
            visible={open}>
            {activeWallet ? (
              <WalletDisconnector
                onDisconnected={() => {
                  closeModal();
                }}
              />
            ) : (
              <WalletSelector onConnected={closeModal} onCancel={closeModal} />
            )}
          </Drawer>
        </>
      )}
    </>
  );
};

export default WalletConnector;
