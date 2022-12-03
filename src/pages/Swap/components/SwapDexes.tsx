import { AggregatorTypes } from '@manahippo/hippo-sdk';
import { PoolStack } from 'components/PoolProvider';
import { Fragment } from 'react';
import { MultiplyIcon } from 'resources/icons';

export const SplitSingleRouteDexes = ({ sr }: { sr: AggregatorTypes.SplitSingleRoute }) => {
  // For debug purpose
  // if (sr.splitSteps.length === 1) sr.splitSteps.push(sr.splitSteps[0], sr.splitSteps[0]);
  return (
    <div className="flex items-center">
      {sr.splitSteps.map((step, index) => {
        const unitsSorted = step.units.sort((a, b) => b.scale - a.scale);
        const titles = unitsSorted.map(
          (u) =>
            `${AggregatorTypes.DEX_TYPE_NAME[u.step.pool.dexType]}: ${Math.round(u.scale * 100)}%`
        );
        return (
          <Fragment key={index}>
            <PoolStack dexes={unitsSorted.map((u) => u.step.pool.dexType)} titles={titles} />
            {index !== sr.splitSteps.length - 1 && (
              <MultiplyIcon className="flex-shrink-0 font-icon label-small-bold mx-1 text-grey-700" />
            )}
          </Fragment>
        );
      })}
    </div>
  );
};

const NonSplitSwapDexes = ({ r }: { r: AggregatorTypes.ApiTradeRoute }) => {
  const steps = r.steps;
  return (
    <div className="flex items-center">
      {steps.map((s, index) => {
        return (
          <Fragment key={index}>
            <PoolStack dexes={[s.dexType]} />
            {index !== steps.length - 1 && (
              <MultiplyIcon className="flex-shrink-0 font-icon label-small-bold mx-1 text-grey-700" />
            )}
          </Fragment>
        );
      })}
    </div>
  );
};

export default NonSplitSwapDexes;
