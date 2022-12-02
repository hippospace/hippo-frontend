import { AggregatorTypes } from '@manahippo/hippo-sdk';
import { FC, useMemo } from 'react';

import basiqLogo from 'resources/img/dexes/basiq.jpeg';
import econiaLogo from 'resources/img/dexes/econia.jpeg';
import pontemLogo from 'resources/img/dexes/pontem.jpeg';
import dittoLogo from 'resources/img/dexes/ditto.jpeg';
import tortugaLogo from 'resources/img/dexes/tortuga.jpeg';
import aptoSwapLogo from 'resources/img/dexes/aptoswap.png';
import auxLogo from 'resources/img/dexes/aux.png';
import animeSwapLogo from 'resources/img/dexes/animeswap.png';
import cetusLogo from 'resources/img/dexes/cetus.png';
import pancakeLogo from 'resources/img/dexes/pancake.jpeg';
import obricLogo from 'resources/img/dexes/obric.png';
import classNames from 'classnames';
import { Tooltip } from 'antd';

interface IPoolProviderProps {
  dexType: AggregatorTypes.DexType;
  className?: string;
}

interface IPoolIconProps extends IPoolProviderProps {
  title?: string;
  isTitleEnabled?: boolean;
}

export const PoolIcon: FC<IPoolIconProps> = ({
  dexType,
  className = '',
  title,
  isTitleEnabled = true
}) => {
  const imgSrc = useMemo(() => {
    if (dexType === AggregatorTypes.DexType.Basiq) {
      return basiqLogo;
    } else if (dexType === AggregatorTypes.DexType.Econia) {
      return econiaLogo;
    } else if (dexType === AggregatorTypes.DexType.Pontem) {
      return pontemLogo;
    } else if (dexType === AggregatorTypes.DexType.Ditto) {
      return dittoLogo;
    } else if (dexType === AggregatorTypes.DexType.Tortuga) {
      return tortugaLogo;
    } else if (dexType === AggregatorTypes.DexType.Aptoswap) {
      return aptoSwapLogo;
    } else if (dexType === AggregatorTypes.DexType.Aux) {
      return auxLogo;
    } else if (dexType === AggregatorTypes.DexType.AnimeSwap) {
      return animeSwapLogo;
    } else if (dexType === AggregatorTypes.DexType.Cetus) {
      return cetusLogo;
    } else if (dexType === AggregatorTypes.DexType.Pancake) {
      return pancakeLogo;
    } else if (dexType === AggregatorTypes.DexType.Obric) {
      return obricLogo;
    } else {
      return undefined;
    }
  }, [dexType]);
  const name = AggregatorTypes.DexType[dexType];
  return (
    <Tooltip placement="left" title={isTitleEnabled ? title ?? name : ''}>
      <img src={imgSrc} alt={name} className={classNames('w-6 h-6 rounded-full', className)} />
    </Tooltip>
  );
};

const PoolProvider: FC<IPoolProviderProps> = ({ dexType, className = '' }) => {
  return (
    <div className={classNames('flex items-center h-full', className)}>
      <PoolIcon dexType={dexType} isTitleEnabled={false} />
      <span className="body-bold text-grey-700 ml-2">{AggregatorTypes.DexType[dexType]}</span>
    </div>
  );
};

export default PoolProvider;
