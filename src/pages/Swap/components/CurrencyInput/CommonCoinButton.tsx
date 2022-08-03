import { TokenInfo } from '@manahippo/hippo-sdk/dist/generated/coin_registry/coin_registry';
import Button from 'components/Button';
import CoinIcon from 'components/CoinIcon';

interface TProps {
  coin: TokenInfo;
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
