import classNames from 'classnames';
import Skeleton from 'components/Skeleton';
import useHippoClient from 'hooks/useHippoClient';
import React, { useCallback, useState } from 'react';
import { RawCoinInfo as CoinInfo } from '@manahippo/coin-list';

interface TProps {
  logoSrc?: string;
  className?: string;
  token?: CoinInfo;
  size?: number;
}

// Use size instead of className to set the size of images
const CoinIcon: React.FC<TProps> = ({ logoSrc, size = 24, className, token }) => {
  const { getTokenInfoByFullName } = useHippoClient();
  const [isLoaded, setIsLoaded] = useState(false);
  if (!logoSrc) {
    if (token) logoSrc = getTokenInfoByFullName(token.token_type.type).logo_url;
  }
  const onImgError = () => {
    setIsLoaded(false);
  };
  const onImgLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div
      className={classNames('relative', className)}
      style={{ width: `${size}px`, height: `${size}px` }}>
      {(!logoSrc || !isLoaded) && (
        <Skeleton className="absolute left-0 top-0 w-full h-full" circle={true} height={'100%'} />
      )}
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
    </div>
  );
};

export default CoinIcon;
