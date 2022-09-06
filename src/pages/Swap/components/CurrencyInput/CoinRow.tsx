import { useWallet } from '@manahippo/aptos-wallet-adapter';
import { CoinInfo } from '@manahippo/hippo-sdk/dist/generated/coin_list/coin_list';
import { Skeleton } from 'antd';
import CoinIcon from 'components/CoinIcon';
import useTokenAmountFormatter from 'hooks/useTokenAmountFormatter';
import useTokenBalane from 'hooks/useTokenBalance';

interface TProps {
  item: CoinInfo;
}

const CoinRow: React.FC<TProps> = ({ item }) => {
  const [balance, isReady] = useTokenBalane(item.symbol.str());
  const { connected } = useWallet();
  const [tokenAmountFormatter] = useTokenAmountFormatter();
  return (
    <div className="flex items-center justify-between gap-2 border-2 border-grey-300 w-full p-2 hover:bg-primePurple-100 rounded-xl">
      <div className="flex items-center gap-2">
        <CoinIcon logoSrc={item.logo_url.str()} />
        <div className="">
          <div className="font-bold text-grey-900 uppercase">{item.symbol.str()}</div>
          <small className="text-grey-500 font-bold">{item.name.str()}</small>
        </div>
      </div>
      <small className="text-grey-700 font-bold">
        {connected && !isReady && <Skeleton.Button className="!w-10 !h-4 !min-w-0" active />}
        {(!connected || isReady) && tokenAmountFormatter(balance, item.symbol.str())}
      </small>
    </div>
  );
};

export default CoinRow;
