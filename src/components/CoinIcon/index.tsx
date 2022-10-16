import { CoinInfo } from '@manahippo/hippo-sdk/dist/generated/coin_list/coin_list';
import classNames from 'classnames';
import Skeleton from 'components/Skeleton';
import useHippoClient from 'hooks/useHippoClient';
import React, { useCallback, useState } from 'react';

interface TProps {
  logoSrc?: string;
  className?: string;
  symbol?: string;
  token?: CoinInfo;
  size?: number;
}

// Use size instead of className to set the size of images
const CoinIcon: React.FC<TProps> = ({ logoSrc, size = 24, className, symbol, token }) => {
  const { tokenInfos } = useHippoClient();
  const [isLoaded, setIsLoaded] = useState(false);
  if (!logoSrc) {
    if (token) logoSrc = token?.logo_url.str();
    if (symbol) {
      token = tokenInfos && tokenInfos[symbol];
      logoSrc = token?.logo_url.str();
    }
  }
  const onImgError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    event.currentTarget.src = '';
    event.currentTarget.className = 'bg-black';
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
          className={classNames('w-full h-full rounded-full', { invisible: !isLoaded })}
          alt="coin icon"
          onError={onImgError}
          onLoad={onImgLoad}
        />
      )}
    </div>
  );
};

export default CoinIcon;
