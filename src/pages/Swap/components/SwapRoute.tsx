import { AggregatorTypes } from '@manahippo/hippo-sdk';
import { SplitMultiRoute, SplitSingleRoute } from '@manahippo/hippo-sdk/dist/aggregator/types';
import { GeneralRouteAndQuote } from 'types/hippo';
import NonSplitSwapDexes, { SplitSingleRouteDexes } from './SwapDexes';
import TokenSteps from './TokenSteps';

const APITradeRoute = ({ r }: { r: AggregatorTypes.ApiTradeRoute }) => {
  return (
    <div className="flex items-center justify-between">
      <TokenSteps tokens={r.tokens} />
      <NonSplitSwapDexes r={r} />
    </div>
  );
};

const SplitSingleRouteComp = ({ r, scale }: { r: SplitSingleRoute; scale?: number }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center min-w-0">
        {scale && (
          <span className="mr-1 px-1 bg-prime-500 rounded text-grey-100">
            {Math.round(scale * 100)}%
          </span>
        )}
        <TokenSteps tokens={r.tokens} className="truncate" />
      </div>
      <SplitSingleRouteDexes sr={r} />
    </div>
  );
};

const SplitMultiRouteComp = ({ r }: { r: SplitMultiRoute }) => {
  return (
    <div className="space-y-1">
      {[...r.units]
        .sort((a, b) => b.scale - a.scale)
        .map((u, index) => {
          return <SplitSingleRouteComp key={index} r={u.route} scale={u.scale} />;
        })}
    </div>
  );
};

const SwapRoute = ({ r }: { r: GeneralRouteAndQuote }) => {
  if (r.route instanceof AggregatorTypes.ApiTradeRoute) {
    return <APITradeRoute r={r.route} />;
  } else if (r.route instanceof AggregatorTypes.SplitSingleRoute) {
    return <SplitSingleRouteComp r={r.route} />;
  } else if (r.route instanceof AggregatorTypes.SplitMultiRoute) {
    return <SplitMultiRouteComp r={r.route} />;
  } else {
    throw new Error('Invalid route type for SwapRoute');
  }
};

export default SwapRoute;
