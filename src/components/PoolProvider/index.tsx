import { AggregatorTypes } from '@manahippo/hippo-sdk';
import { CSSProperties, FC, useEffect, useMemo, useRef, useState } from 'react';

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
import thalaLogo from 'resources/img/dexes/thala.jpeg';
import hippoLogo from 'resources/img/hippo-icon.svg';
import abelLogo from 'resources/img/protocols/abel.png';
import eternalLogo from 'resources/img/protocols/eternal.jpeg';
import classNames from 'classnames';
import { Tooltip } from 'antd';
import { DexType } from '@manahippo/hippo-sdk/dist/aggregator/types';

export type ProtocolId = 'Abel' | 'Eternal';

interface IPoolProviderProps {
  dexType?: AggregatorTypes.DexType;
  protocolId?: ProtocolId;
  className?: string;
  isTitleEnabled?: boolean;
  isNameInvisible?: boolean;
  isClickable?: boolean;
}

interface IProtocolIconProps extends IPoolProviderProps {
  title?: string;
  isTitleEnabled?: boolean;
  style?: CSSProperties;
  onMouseHover?: (h: boolean) => void;
  tooltipMouseEnterDelay?: number;
  tooltipMouseLeaveDelay?: number;
}

export const PoolStack = ({
  dexes,
  titles = [],
  className = '',
  iconSize = 20,
  visibleRatios,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  unFoldDirection = 'right'
}: {
  dexes: AggregatorTypes.DexType[];
  titles?: string[];
  className?: string;
  iconSize?: number;
  visibleRatios?: number[];
  unFoldDirection?: 'left' | 'right';
}) => {
  const defaultVisibleRatio = 0.5;
  const defaultScaleTimes = 1.5;

  const [hoverIndex, setHoverIndex] = useState(-1);
  const offsetOnHover =
    (defaultScaleTimes -
      1 +
      ((unFoldDirection === 'right' && hoverIndex > 0) ||
      (unFoldDirection === 'left' && hoverIndex < dexes.length - 1)
        ? 0.5
        : 0)) *
    iconSize;

  if (!visibleRatios) {
    visibleRatios = [1, ...new Array(dexes.length - 1).fill(defaultVisibleRatio)];
  }
  const hoverIndexRef = useRef(-1); // use Ref for comparing as it would change immediately

  const width =
    visibleRatios.reduce((p, c) => p + c) * iconSize + (hoverIndex >= 0 ? offsetOnHover : 0);

  const padding = hoverIndex >= 0 ? offsetOnHover : 0;
  const pdProp = unFoldDirection === 'right' ? 'paddingLeft' : 'paddingRight';

  return (
    <div
      className={classNames('whitespace-nowrap transition-all', className)}
      style={{ width, [pdProp]: padding }}>
      {dexes.map((d, i) => {
        const left =
          -iconSize *
          visibleRatios!
            .map((v) => 1 - v)
            .slice(0, i + 1)
            .reduce((p, c) => p + c);
        const zIndex = hoverIndex === i ? dexes.length + 1 : dexes.length - i;

        const translateX =
          (unFoldDirection === 'right' && i < hoverIndex) ||
          (unFoldDirection === 'left' && i > hoverIndex)
            ? offsetOnHover * (unFoldDirection === 'right' ? -1 : 1)
            : 0;
        const scale = i === hoverIndex ? defaultScaleTimes : 1;

        return (
          <ProtocolIcon
            dexType={d}
            title={titles[i]}
            key={i}
            className={classNames(
              'relative inline-block transform-gpu scale-100 transition-transform translate-x-0',
              {
                'origin-bottom-left': unFoldDirection === 'left',
                'origin-bottom-right': unFoldDirection === 'right'
              }
            )}
            style={
              {
                width: iconSize,
                height: iconSize,
                left: `${left}px`,
                zIndex,
                '--tw-scale-x': scale, // overrides
                '--tw-scale-y': scale,
                '--tw-translate-x': `${translateX}px`
              } as CSSProperties
            }
            onMouseHover={(h) => {
              // console.log(`icon ${i} hover: ${h}`);
              if (!h && hoverIndexRef.current === i) {
                hoverIndexRef.current = -1;
                setHoverIndex(-1);
              } else if (h && hoverIndexRef.current !== i) {
                hoverIndexRef.current = i;
                setHoverIndex(i);
              }
            }}
            tooltipMouseEnterDelay={0.16} // to avoid tooltips position jitter
            tooltipMouseLeaveDelay={0}
          />
        );
      })}
    </div>
  );
};

export const ProtocolIcon: FC<IProtocolIconProps> = ({
  dexType,
  protocolId,
  className = '',
  title,
  isTitleEnabled = true,
  style,
  onMouseHover = () => {},
  tooltipMouseEnterDelay = 0.1,
  tooltipMouseLeaveDelay = 0.1
}) => {
  const imgSrc = useMemo(() => {
    if (protocolId === 'Abel') {
      return abelLogo;
    } else if (protocolId === 'Eternal') {
      return eternalLogo;
    } else if (dexType === AggregatorTypes.DexType.Hippo) {
      return hippoLogo;
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
    } else if (dexType === AggregatorTypes.DexType.CetusV2) {
      return cetusLogo;
    } else if (dexType === AggregatorTypes.DexType.Thala) {
      return thalaLogo;
    } else {
      return undefined;
    }
  }, [dexType, protocolId]);
  const name = dexType ? AggregatorTypes.DexType[dexType] : protocolId;
  const [isHover, setIsHover] = useState(false);

  useEffect(() => {
    onMouseHover(isHover);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHover]);

  return (
    <Tooltip
      placement="top"
      title={isTitleEnabled ? title ?? name : ''}
      mouseEnterDelay={tooltipMouseEnterDelay}
      mouseLeaveDelay={tooltipMouseLeaveDelay}>
      <img
        src={imgSrc}
        alt={name || protocolId}
        className={classNames('w-6 h-6 rounded-full', className)}
        style={style}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
      />
    </Tooltip>
  );
};

const ProtocolProvider: FC<IPoolProviderProps> = ({
  dexType,
  protocolId,
  className = '',
  isTitleEnabled = false,
  isNameInvisible = false,
  isClickable = true
}) => {
  return (
    <div
      className={classNames(
        'flex items-center h-full',
        { 'cursor-pointer': isClickable },
        className
      )}
      onClick={() => isClickable && window.open(poolUrl(dexType), '_blank')}>
      <ProtocolIcon dexType={dexType} protocolId={protocolId} isTitleEnabled={isTitleEnabled} />
      {!isNameInvisible && (
        <span className="body-bold text-grey-700 ml-2">
          {protocolId ?? (dexType && AggregatorTypes.DexType[dexType])}
        </span>
      )}
    </div>
  );
};

export const poolUrl = (dexType?: DexType, protocolId?: ProtocolId) => {
  if (protocolId === 'Abel') {
    return 'https://abelfinance.xyz/';
  } else if (protocolId === 'Eternal') {
    return 'https://app.eternalfinance.io/';
  } else if (dexType === AggregatorTypes.DexType.Econia) {
    return 'https://www.econia.dev/';
  } else if (dexType === AggregatorTypes.DexType.Pontem) {
    return 'https://pontem.network/';
  } else if (dexType === AggregatorTypes.DexType.Ditto) {
    return 'https://www.dittofinance.io/';
  } else if (dexType === AggregatorTypes.DexType.Tortuga) {
    return 'https://tortuga.finance/';
  } else if (dexType === AggregatorTypes.DexType.Aptoswap) {
    return 'https://aptoswap.net/';
  } else if (dexType === AggregatorTypes.DexType.Aux) {
    return 'https://aux.exchange/';
  } else if (dexType === AggregatorTypes.DexType.AnimeSwap) {
    return 'https://animeswap.org/';
  } else if (dexType === AggregatorTypes.DexType.Cetus) {
    return 'https://www.cetus.zone/';
  } else if (dexType === AggregatorTypes.DexType.CetusV2) {
    return 'https://www.cetus.zone/';
  } else if (dexType === AggregatorTypes.DexType.Pancake) {
    return 'https://pancakeswap.finance/';
  } else if (dexType === AggregatorTypes.DexType.Obric) {
    return 'https://obric.xyz/';
  } else if (dexType === AggregatorTypes.DexType.Thala) {
    return 'https://app.thala.fi/';
  } else {
    return undefined;
  }
};

export default ProtocolProvider;
