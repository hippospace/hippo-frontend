import CoinIcon from 'components/CoinIcon';
import useHippoClient from 'hooks/useHippoClient';

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
      <div className="items-center body-bold text-grey-700">
        {xCoin?.symbol.str() || '--'}/{yCoin?.symbol.str() || '--'}
      </div>
    </div>
  );
};

export default TradingPair;
