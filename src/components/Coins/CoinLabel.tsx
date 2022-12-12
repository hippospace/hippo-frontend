import { RawCoinInfo } from '@manahippo/coin-list';
import Tooltip from 'antd/es/tooltip';
import classNames from 'classnames';

const CoinLabel = ({
  coin,
  className = '',
  symbolClassName = '',
  bridgeClassName = '',
  fullNameClassName = '',
  isShowNonOfficalSymbol = false,
  isShowFullName = false,
  isShowBridge = true
}: {
  coin: RawCoinInfo;
  className?: string;
  symbolClassName?: string;
  bridgeClassName?: string;
  fullNameClassName?: string;
  isShowNonOfficalSymbol?: boolean;
  isShowFullName?: boolean;
  isShowBridge?: boolean;
}) => {
  const bridgeArray = coin.extensions.data.find((a) => a[0] === 'bridge');
  const bridge = (bridgeArray && bridgeArray[1]) ?? '';
  return (
    <div className={classNames(className)}>
      <div className="flex w-full items-center">
        <span className={classNames('text-grey-900 body-bold', symbolClassName)}>
          {coin.official_symbol}
        </span>
        {isShowNonOfficalSymbol && coin.official_symbol !== coin.symbol && (
          <Tooltip
            title={`This coin's globally unique symbol in aptos-coin-list is ${coin.symbol}`}>
            <span className="text-grey-100 label-large-bold bg-prime-500 px-[6px] rounded-lg ml-1">
              {coin.symbol}
            </span>
          </Tooltip>
        )}
      </div>
      {isShowFullName && (
        <div className={classNames('text-grey-500 label-large-regular', fullNameClassName)}>
          {coin.name}
        </div>
      )}
      {isShowBridge && bridge && bridge !== 'native' && (
        <div
          className={classNames(
            'text-grey-500 label-small-bold leading-none capitalize',
            bridgeClassName
          )}>
          {bridge}
        </div>
      )}
    </div>
  );
};

export default CoinLabel;
