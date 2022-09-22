import { CoinInfo } from '@manahippo/hippo-sdk/dist/generated/coin_list/coin_list';
import { Skeleton } from 'antd';
import cx from 'classnames';
import useHippoClient from 'hooks/useHippoClient';
import React from 'react';
import invariant from 'tiny-invariant';

interface TProps {
  logoSrc?: string;
  className?: string;
  symbol?: string;
  token?: CoinInfo;
}

const CoinIcon: React.FC<TProps> = ({ logoSrc, className, symbol, token }) => {
  invariant(logoSrc || symbol || token, 'Invalid props');
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
    <div className={cx('w-6 h-6', className)}>
      {!logoSrc && <Skeleton.Avatar active={true} className="h-full" shape="circle" />}
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
