import { coin_list } from '@manahippo/hippo-sdk';
import Button from 'components/Button';
import CoinIcon from 'components/CoinIcon';

interface TProps {
  coin: coin_list.Coin_list.CoinInfo;
  onClickToken: () => void;
}

const CommonCoinButton: React.FC<TProps> = ({ coin, onClickToken }) => {
  return (
    <Button
      variant="outlined"
      onClick={onClickToken}
      className="p-0 overflow-hidden rounded-full !border-0">
      <CoinIcon logoSrc={coin.logo_url.str()} />
      {/* {coin.symbol} */}
    </Button>
  );
};

export default CommonCoinButton;
