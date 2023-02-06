import CoinIcon from 'components/Coins/CoinIcon';
import CoinLabel from 'components/Coins/CoinLabel';
import useHippoClient from 'hooks/useHippoClient';
import { ReactNode } from 'react';
import { MultiplyIcon } from 'resources/icons';
import { coinPriority } from 'utils/hippo';

const TradingPair = ({
  base,
  quote,
  isShowBridge = true,
  seperator,
  isIconsInvisible = false,
  isLp = false
}: {
  base: string;
  quote: string;
  isShowBridge?: boolean;
  seperator?: ReactNode;
  isIconsInvisible?: boolean;
  isLp?: boolean;
}) => {
  const { getTokenInfoByFullName } = useHippoClient();
  let xCoin = getTokenInfoByFullName(base);
  let yCoin = getTokenInfoByFullName(quote);
  if (xCoin && yCoin) {
    if (coinPriority(xCoin.symbol) < coinPriority(yCoin.symbol)) {
      [xCoin, yCoin] = [yCoin, xCoin];
    }
  }

  return (
    <div className="flex items-center gap-x-2">
      {!isIconsInvisible && (
        <div className="flex gap-x-1">
          <CoinIcon token={xCoin} />
          <CoinIcon token={yCoin} />
        </div>
      )}
      <div className="items-center flex">
        {xCoin ? (
          <CoinLabel coin={xCoin} isShowBridge={isShowBridge} symbolClassName="text-grey-700" />
        ) : (
          <>404</>
        )}
        {seperator ??
          (isLp ? (
            <span className="mx-1 text-grey-500">-</span>
          ) : (
            <MultiplyIcon className="font-icon text-grey-500 mx-1" />
          ))}
        {yCoin ? (
          <CoinLabel coin={yCoin} isShowBridge={isShowBridge} symbolClassName="text-grey-700" />
        ) : (
          <>404</>
        )}
      </div>
    </div>
  );
};

export default TradingPair;
