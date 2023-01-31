import CoinIcon from 'components/Coins/CoinIcon';
import CoinLabel from 'components/Coins/CoinLabel';
import useHippoClient from 'hooks/useHippoClient';
import { ReactNode } from 'react';
import { MultiplyIcon } from 'resources/icons';

const TradingPair = ({
  base,
  quote,
  isShowBridge = true,
  seperator
}: {
  base: string;
  quote: string;
  isShowBridge?: boolean;
  seperator?: ReactNode;
}) => {
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
        {xCoin ? (
          <CoinLabel coin={xCoin} isShowBridge={isShowBridge} symbolClassName="text-grey-700" />
        ) : (
          <>404</>
        )}
        {seperator ?? <MultiplyIcon className="font-icon text-grey-500 mx-1" />}
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
