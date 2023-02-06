import { useWallet } from '@manahippo/aptos-wallet-adapter';
import { Skeleton } from 'antd';
import CoinIcon from 'components/Coins/CoinIcon';
import CoinLabel from 'components/Coins/CoinLabel';
import useTokenAmountFormatter from 'hooks/useTokenAmountFormatter';
import { ITokenBalance } from 'types/hippo';

interface TProps {
  item: ITokenBalance;
}

const CoinRow: React.FC<TProps> = ({ item }) => {
  const { connected } = useWallet();
  const [tokenAmountFormatter] = useTokenAmountFormatter();
  return (
    <div className="flex items-center justify-between gap-2 border-2 border-grey-300 w-full p-2 hover:bg-prime-100 dark:hover:bg-prime-900 rounded-xl">
      <div className="flex items-center gap-2 flex-grow">
        <CoinIcon logoSrc={item.token.logo_url} />
        <CoinLabel
          className="flex-grow"
          coin={item.token}
          isShowFullName={true}
          isShowBridge={false}
          isShowNonOfficalSymbol={true}
        />
      </div>
      <div className="text-grey-700 label-large-bold">
        {connected && item.balance < 0 && (
          <Skeleton.Button className="!w-10 !h-4 !min-w-0" active />
        )}
        {(!connected || item.balance >= 0) && tokenAmountFormatter(item.balance, item.token)}
      </div>
    </div>
  );
};

export default CoinRow;
