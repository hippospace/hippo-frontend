import { CoinInfo } from '@manahippo/hippo-sdk/dist/generated/coin_list/coin_list';
import cx from 'classnames';
import Skeleton from 'components/Skeleton';
import useHippoClient from 'hooks/useHippoClient';
import React from 'react';

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
  return (
    <div className={cx(className)} style={{ width: `${size}px`, height: `${size}px` }}>
      {!logoSrc && <Skeleton circle={true} height={'100%'} />}
      {logoSrc && (
        <img
          src={logoSrc}
          className="w-full h-full rounded-full"
          alt="coin icon"
          onError={onImgError}
        />
      )}
    </div>
  );
};

export default CoinIcon;
