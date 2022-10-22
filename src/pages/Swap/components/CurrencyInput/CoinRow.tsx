import { useWallet } from '@manahippo/aptos-wallet-adapter';
import { Skeleton } from 'antd';
import CoinIcon from 'components/CoinIcon';
import useTokenAmountFormatter from 'hooks/useTokenAmountFormatter';
import { TokenBalance } from 'types/hippo';

interface TProps {
  item: TokenBalance;
}

const CoinRow: React.FC<TProps> = ({ item }) => {
  const { connected } = useWallet();
  const [tokenAmountFormatter] = useTokenAmountFormatter();
  return (
    <div className="flex items-center justify-between gap-2 border-2 border-grey-300 w-full p-2 hover:bg-prime-100 rounded-xl">
      <div className="flex items-center gap-2">
        <CoinIcon logoSrc={item.token.logo_url.str()} />
        <div className="">
          <div className="font-bold text-grey-900">{item.token.symbol.str()}</div>
          <div className="text-grey-500 label-large-bold">{item.token.name.str()}</div>
        </div>
      </div>
      <div className="text-grey-700 label-large-bold">
        {connected && item.balance < 0 && (
          <Skeleton.Button className="!w-10 !h-4 !min-w-0" active />
        )}
        {(!connected || item.balance >= 0) &&
          tokenAmountFormatter(item.balance, item.token.symbol.str())}
      </div>
    </div>
  );
};

export default CoinRow;
