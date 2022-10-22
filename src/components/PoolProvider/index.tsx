import { AggregatorTypes } from '@manahippo/hippo-sdk';
import { FC, useMemo } from 'react';

import hippoLogo from 'resources/img/hippo-icon.svg';
import basiqLogo from 'resources/img/dexes/basiq.jpeg';
import econiaLogo from 'resources/img/dexes/econia.jpeg';
import pontemLogo from 'resources/img/dexes/pontem.jpeg';
import dittoLogo from 'resources/img/dexes/ditto.jpeg';
import tortugaLogo from 'resources/img/dexes/tortuga.jpeg';
import aptoSwapLogo from 'resources/img/dexes/aptoswap.png';
import auxLogo from 'resources/img/dexes/aux.png';
import animeSwapLog from 'resources/img/dexes/animeswap.png';
import classNames from 'classnames';

interface IPoolProviderProps {
  dexType: AggregatorTypes.DexType;
  className?: string;
}

const PoolProvider: FC<IPoolProviderProps> = ({ dexType, className = '' }) => {
  const imgSrc = useMemo(() => {
    if (dexType === AggregatorTypes.DexType.Basiq) {
      return basiqLogo;
    } else if (dexType === AggregatorTypes.DexType.Econia) {
      return econiaLogo;
    } else if (dexType === AggregatorTypes.DexType.Hippo) {
      return hippoLogo;
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
      return animeSwapLog;
    } else {
      return undefined;
    }
  }, [dexType]);
  return (
    <div className={classNames('flex items-center h-full', className)}>
      <img src={imgSrc} alt={'Dex logo'} className="w-6 h-6 rounded-full mr-2" />
      <span className="body-bold text-grey-700">{AggregatorTypes.DexType[dexType]}</span>
    </div>
  );
};

export default PoolProvider;
