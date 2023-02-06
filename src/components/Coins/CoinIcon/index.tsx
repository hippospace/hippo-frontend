import classNames from 'classnames';
import Skeleton from 'components/Skeleton';
import useHippoClient from 'hooks/useHippoClient';
import React, { useCallback, useState } from 'react';
import { RawCoinInfo as CoinInfo } from '@manahippo/coin-list';
import Tooltip from 'antd/es/tooltip';

interface TProps {
  logoSrc?: string;
  className?: string;
  token?: CoinInfo;
  size?: number;
  isShowSymbol?: boolean;
}

// Use size instead of className to set the size of images
const CoinIcon: React.FC<TProps> = ({
  logoSrc,
  size = 24,
  className,
  token,
  isShowSymbol = false
}) => {
  const { getTokenInfoByFullName } = useHippoClient();
  const [isLoaded, setIsLoaded] = useState(false);
  if (!logoSrc && token) {
    logoSrc = getTokenInfoByFullName(token.token_type.type)?.logo_url;
  }
  const onImgError = () => {
    setIsLoaded(false);
  };
  const onImgLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const bridgeArray = token?.extensions.data.find((a) => a[0] === 'bridge');
  const bridge = (bridgeArray && bridgeArray[1]) ?? '';

  return (
    <div
      className={classNames('relative', className)}
      style={{ width: `${size}px`, height: `${size}px` }}>
      {(!logoSrc || !isLoaded) && (
        <Skeleton className="absolute left-0 top-0 w-full h-full" circle={true} height={'100%'} />
      )}
      <Tooltip
        title={
          isShowSymbol &&
          token &&
          `${token?.official_symbol}${bridge !== 'native' ? `(${bridge})` : ''}`
        }
        placement="top">
        {logoSrc && (
          <img
            src={logoSrc}
            // eslint-disable-next-line prettier/prettier
          className={classNames('w-full h-auto rounded-full', { 'invisible': !isLoaded })}
            alt="coin icon"
            onError={onImgError}
            onLoad={onImgLoad}
          />
        )}
      </Tooltip>
    </div>
  );
};

export default CoinIcon;
