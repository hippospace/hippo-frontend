import Button from 'components/Button';
import CoinIcon from 'components/CoinIcon';
import { RawCoinInfo as CoinInfo } from '@manahippo/coin-list';

interface TProps {
  coin: CoinInfo;
  onClickToken: () => void;
}

const CommonCoinButton: React.FC<TProps> = ({ coin, onClickToken }) => {
  return (
    <Button
      variant="icon"
      onClick={onClickToken}
      className="p-0 overflow-hidden rounded-full !border-0">
      <CoinIcon logoSrc={coin.logo_url} />
      {/* {coin.symbol} */}
    </Button>
  );
};

export default CommonCoinButton;
