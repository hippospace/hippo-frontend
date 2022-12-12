import CoinIcon from 'components/Coins/CoinIcon';
import CoinLabel from 'components/Coins/CoinLabel';
import useHippoClient from 'hooks/useHippoClient';
import { MultiplyIcon } from 'resources/icons';

const TradingPair = ({ base, quote }: { base: string; quote: string }) => {
  const { getTokenInfoByFullName } = useHippoClient();
  const xCoin = getTokenInfoByFullName(base);
  const yCoin = getTokenInfoByFullName(quote);
  return (
    <div className="flex items-center gap-x-2">
      <div className="flex gap-x-1">
        <CoinIcon token={xCoin} />
        <CoinIcon token={yCoin} />
      </div>
      <div className="items-center flex">
        <CoinLabel coin={xCoin} symbolClassName="text-grey-700" />
        <MultiplyIcon className="font-icon text-grey-500 mx-1" />
        <CoinLabel coin={yCoin} symbolClassName="text-grey-700" />
      </div>
    </div>
  );
};

export default TradingPair;
