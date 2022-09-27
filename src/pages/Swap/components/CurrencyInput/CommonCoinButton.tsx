import { CoinInfo } from '@manahippo/hippo-sdk/dist/generated/coin_list/coin_list';
import Button from 'components/Button';
import CoinIcon from 'components/CoinIcon';

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
      <CoinIcon logoSrc={coin.logo_url.str()} />
      {/* {coin.symbol} */}
    </Button>
  );
};

export default CommonCoinButton;
