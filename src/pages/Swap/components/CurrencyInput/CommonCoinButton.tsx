import Button from 'components/Button';
import CoinIcon from 'components/Coins/CoinIcon';
import { RawCoinInfo as CoinInfo } from '@manahippo/coin-list';
import { Tooltip } from 'antd';

interface TProps {
  coin: CoinInfo;
  onClickToken: () => void;
}

const CommonCoinButton: React.FC<TProps> = ({ coin, onClickToken }) => {
  return (
    <Tooltip placement="top" title={coin.name}>
      <Button
        variant="icon"
        onClick={onClickToken}
        className="p-0 overflow-hidden rounded-full !border-0">
        <CoinIcon logoSrc={coin.logo_url} />
        {/* {coin.symbol} */}
      </Button>
    </Tooltip>
  );
};

export default CommonCoinButton;
