import { AggregatorTypes } from '@manahippo/hippo-sdk';
import { ApiTradeStep } from '@manahippo/hippo-sdk/dist/aggregator/types/step/ApiTradeStep';
import { PoolIcon } from 'components/PoolProvider';
import { useEffect, useRef, useState } from 'react';
import { MultiplyIcon } from 'resources/icons';
import { GeneralRouteAndQuote } from 'types/hippo';

const SplitStepDex = ({
  splitStep,
  isCompact = false
}: {
  splitStep: AggregatorTypes.SplitStep;
  isCompact?: boolean;
}) => {
  // if (splitStep.units.length === 2) splitStep.units.push(splitStep.units[0]);
  return (
    <div className="flex flex-shrink-0 flex-col rounded-lg px-1 border border-grey-300">
      {splitStep.units.map((u, index) => {
        const dexName = AggregatorTypes.DexType[u.step.pool.dexType];
        const percent = Math.round(u.scale * 100) + '%';
        return (
          <div className="flex justify-between items-center h-[21px]" key={index}>
            <PoolIcon
              dexType={u.step.pool.dexType}
              className="w-4 h-4"
              title={`${dexName}: ${percent}`}
            />
            {!isCompact && <span className="label-large-bold text-grey-500 ml-1">{percent}</span>}
          </div>
        );
      })}
    </div>
  );
};

const SplitSwapDexes = ({ route }: { route: AggregatorTypes.SplitSingleRoute }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isCompact, setIsCompact] = useState(false);

  /*
  if (route.splitSteps.length === 1)
    route.splitSteps.push(route.splitSteps[0], route.splitSteps[0]);
  */

  useEffect(() => {
    setIsCompact(ref.current.clientWidth < ref.current.scrollWidth);
  }, []);
  return (
    <div className="flex items-center gap-x-1 my-1 overflow-x-auto no-scrollbar" ref={ref}>
      {route.splitSteps.map((ss, index) => (
        <>
          <SplitStepDex splitStep={ss} key={index} isCompact={isCompact} />
          {index !== route.splitSteps.length - 1 && (
            <MultiplyIcon key={`m-${index}`} className="flex-shrink-0 font-icon label-large-bold" />
          )}
        </>
      ))}
    </div>
  );
};

const SwapDexes = ({ r }: { r: GeneralRouteAndQuote }) => {
  if (r.route instanceof AggregatorTypes.ApiTradeRoute) {
    const steps = r.route.steps as ApiTradeStep[];
    const dexes = steps.map((s) => AggregatorTypes.DEX_TYPE_NAME[s.dexType]).join(' x ');
    return (
      <div className="truncate" title={dexes}>
        {steps.map((s, index) => {
          return (
            <>
              {/* <span key={index}>{AggregatorTypes.DEX_TYPE_NAME[s.dexType]}</span> */}
              <PoolIcon dexType={s.dexType} className="w-5 h-5 inline-block" />
              {index !== steps.length - 1 && (
                <MultiplyIcon
                  key={`m-${index}`}
                  className="flex-shrink-0 font-icon label-small-bold mx-[2px] text-grey-700"
                />
              )}
            </>
          );
        })}
      </div>
    );
  } else if (r.route instanceof AggregatorTypes.SplitSingleRoute) {
    const route = r.route as AggregatorTypes.SplitSingleRoute;
    return <SplitSwapDexes route={route} />;
  } else {
    throw new Error('Invalid Route type for swap dexes');
  }
};

export default SwapDexes;
