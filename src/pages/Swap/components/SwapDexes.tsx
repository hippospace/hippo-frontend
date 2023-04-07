import { AggregatorTypes } from '@manahippo/hippo-sdk';
import { PoolStack } from 'components/PoolProvider';
import { Fragment, useMemo } from 'react';
import { MultiplyIcon } from 'resources/icons';

export const SplitSingleRouteDexes = ({
  sr,
  isShowDetails = false,
  isInMultiRoute = true
}: {
  sr: AggregatorTypes.SplitSingleRoute;
  isShowDetails?: boolean;
  isInMultiRoute?: boolean;
}) => {
  // For debug purpose
  // if (sr.splitSteps.length === 1) sr.splitSteps.push(sr.splitSteps[0], sr.splitSteps[0]);
  const steps = sr.splitSteps.map((st) => [...st.units].sort((a, b) => b.scale - a.scale));
  const dexes = steps.flatMap((st) => st.map((u) => u.step.pool.dexType));
  const isSameDex = dexes.every((d) => d === dexes[0]);

  const stepsUnfoldedNode = useMemo(() => {
    return (
      <>
        {steps.map((units, index) => {
          const titles = units.map(
            (u) =>
              `${AggregatorTypes.DEX_TYPE_NAME[u.step.pool.dexType]}` +
              (units.length > 1 ? `: ${Math.round(u.scale * 100)}%` : '')
          );
          return (
            <Fragment key={index}>
              <PoolStack dexes={units.map((u) => u.step.pool.dexType)} titles={titles} />
              {index !== sr.splitSteps.length - 1 && (
                <MultiplyIcon className="flex-shrink-0 font-icon label-small-bold mx-1 text-grey-700" />
              )}
            </Fragment>
          );
        })}
      </>
    );
  }, [sr.splitSteps.length, steps]);

  return (
    <div className="flex items-center">
      {isInMultiRoute ? (
        !isShowDetails ? (
          <PoolStack dexes={[AggregatorTypes.DexType.Hippo]} />
        ) : isSameDex ? (
          <PoolStack dexes={[dexes[0]]} />
        ) : (
          <>{stepsUnfoldedNode}</>
        )
      ) : isSameDex ? (
        <PoolStack dexes={[dexes[0]]} />
      ) : isShowDetails ? (
        <>{stepsUnfoldedNode}</>
      ) : (
        <PoolStack dexes={[AggregatorTypes.DexType.Hippo]} />
      )}
    </div>
  );
};

const NonSplitSwapDexes = ({
  r,
  isShowDetails = false
}: {
  r: AggregatorTypes.ApiTradeRoute;
  isShowDetails?: boolean;
}) => {
  let dexes = r.steps.map((s) => s.dexType);
  const isSameDex = dexes.every((dexType) => dexType === dexes[0]);
  if (!isSameDex) {
    if (!isShowDetails) {
      dexes = [AggregatorTypes.DexType.Hippo];
    }
  } else {
    dexes = [dexes[0]];
  }
  return (
    <div className="flex items-center">
      {dexes.map((dexType, index) => {
        return (
          <Fragment key={index}>
            <PoolStack dexes={[dexType]} />
            {index !== dexes.length - 1 && (
              <MultiplyIcon className="flex-shrink-0 font-icon label-small-bold mx-1 text-grey-700" />
            )}
          </Fragment>
        );
      })}
    </div>
  );
};

export default NonSplitSwapDexes;
