import { useWallet, WalletReadyState, Wallet } from '@manahippo/aptos-wallet-adapter';
import classNames from 'classnames';
import Button from 'components/Button';
import { useCallback, useMemo, useState } from 'react';
import { MoreArrowDown, MultiplyIcon } from 'resources/icons';

const DetectedWalletItem = ({ wallet }: { wallet: Wallet }) => {
  return (
    <div className="h-[86px] w-[96px] rounded-xxl border border-grey-700/10 flex items-center justify-center flex-col cursor-pointer hover:border-prime-400 hover:bg-prime-400/10">
      <img src={wallet.adapter.icon} className="w-8 h-8 rounded-full" />
      <div className="label-small-bold mt-2 text-grey-700">{wallet.adapter.name}</div>
    </div>
  );
};

const NotDetectedWalletItem = ({ wallet }: { wallet: Wallet }) => {
  return (
    <div className="w-[200px] h-[62px] rounded-xxl flex items-center cursor-pointer px-5 border border-grey-700/10 hover:border-prime-400 hover:bg-prime-400/10">
      <img src={wallet.adapter.icon} className="w-8 h-8 rounded-full" />
      <div className="label-small-bold ml-2 text-grey-700">{wallet.adapter.name}</div>
    </div>
  );
};

const WalletSelector = ({
  onConnected,
  onCancel
}: {
  onConnected: () => void;
  onCancel: () => void;
}) => {
  const { wallets, select } = useWallet();
  const [detectedWallets, notDetectedWallets] = useMemo(() => {
    const detectedWallets2: Wallet[] = [];
    const notDetectedWallets2: Wallet[] = [];
    wallets.forEach((w) => {
      if (
        w.readyState === WalletReadyState.Installed ||
        w.readyState === WalletReadyState.Loadable
      ) {
        detectedWallets2.push(w);
      } else {
        notDetectedWallets2.push(w);
      }
    });
    return [detectedWallets2, notDetectedWallets2];
  }, [wallets]);
  const [isMoreWalletsUnfolded, setIsMoreWalletsUnfolded] = useState(false);

  const onSelectWallet = useCallback(
    (w: Wallet) => {
      select(w.adapter.name);
      onConnected();
    },
    [onConnected, select]
  );

  return (
    <div className="rounded-xxl bg-surface">
      <div className="px-6 h-[76px] border-b border-grey-700/10 flex items-center justify-between">
        <div className="h6 text-grey-900">Connect Wallet</div>
        <Button
          variant="icon"
          className="rounded-full bg-grey-700/10 !w-6 !h-6"
          onClick={() => onCancel()}>
          <MultiplyIcon className="font-icon text-[12px] text-grey-900"></MultiplyIcon>
        </Button>
      </div>
      <div className="p-6 overflow-y-auto scrollbar" style={{ maxHeight: 'calc(80vh - 76px)' }}>
        <div className="mb-8">
          <div className="mb-4">
            <div className="body-semibold text-grey-700">Detected Wallets</div>
          </div>
          <div className="flex flex-wrap gap-x-2 gap-y-4 justify-start">
            {detectedWallets.map((w, i) => (
              <div key={i} onClick={() => onSelectWallet(w)}>
                <DetectedWalletItem wallet={w} />
              </div>
            ))}
          </div>
        </div>
        <div className="">
          <div className="mb-4 flex items-center justify-between text-grey-700">
            <div className="body-semibold">More Wallets</div>
            <Button
              variant="icon"
              className="!w-6 !h-6"
              onClick={() => setIsMoreWalletsUnfolded(!isMoreWalletsUnfolded)}>
              <MoreArrowDown
                className={classNames('font-icon text-[16px] !align-bottom', {
                  'rotate-180': isMoreWalletsUnfolded
                })}
              />
            </Button>
          </div>
          {isMoreWalletsUnfolded && (
            <div className="flex flex-wrap gap-x-2 gap-y-4 justify-start">
              {notDetectedWallets.map((w, i) => (
                <div key={i} onClick={() => onSelectWallet(w)}>
                  <NotDetectedWalletItem wallet={w} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletSelector;
