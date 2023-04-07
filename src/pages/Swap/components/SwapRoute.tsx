import { AggregatorTypes } from '@manahippo/hippo-sdk';
import { SplitMultiRoute, SplitSingleRoute } from '@manahippo/hippo-sdk/dist/aggregator/types';
import { GeneralRouteAndQuote } from 'types/hippo';
import NonSplitSwapDexes, { SplitSingleRouteDexes } from './SwapDexes';
import TokenSteps from './TokenSteps';

const APITradeRoute = ({
  r,
  isShowDetails = false
}: {
  r: AggregatorTypes.ApiTradeRoute;
  isShowDetails?: boolean;
}) => {
  return (
    <div className="flex items-center justify-between">
      <TokenSteps tokens={r.tokens} />
      <NonSplitSwapDexes r={r} isShowDetails={isShowDetails} />
    </div>
  );
};

const SplitSingleRouteComp = ({
  r,
  scale,
  isShowDetails,
  isInMultiRoute = true
}: {
  r: SplitSingleRoute;
  scale?: number;
  isShowDetails?: boolean;
  isInMultiRoute?: boolean;
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center min-w-0">
        {scale && scale !== 1 && (
          <span className="mr-1 px-1 bg-prime-500 rounded text-grey-100">
            {Math.round(scale * 100)}%
          </span>
        )}
        <TokenSteps tokens={r.tokens} className="truncate" />
      </div>
      <SplitSingleRouteDexes sr={r} isShowDetails={isShowDetails} isInMultiRoute={isInMultiRoute} />
    </div>
  );
};

const SplitMultiRouteComp = ({
  r,
  isShowDetails
}: {
  r: SplitMultiRoute;
  isShowDetails?: boolean;
}) => {
  return (
    <div className="space-y-1">
      {[...r.units]
        .sort((a, b) => b.scale - a.scale)
        .map((u, index) => {
          return (
            <SplitSingleRouteComp
              key={index}
              r={u.route}
              scale={u.scale}
              isShowDetails={isShowDetails}
              isInMultiRoute={r.units.length > 1}
            />
          );
        })}
    </div>
  );
};

const SwapRoute = ({ r, isShowDetails }: { r: GeneralRouteAndQuote; isShowDetails?: boolean }) => {
  if (r.route instanceof AggregatorTypes.ApiTradeRoute) {
    return <APITradeRoute r={r.route} isShowDetails={isShowDetails} />;
  } else if (r.route instanceof AggregatorTypes.SplitSingleRoute) {
    return (
      <SplitSingleRouteComp r={r.route} isShowDetails={isShowDetails} isInMultiRoute={false} />
    );
  } else if (r.route instanceof AggregatorTypes.SplitMultiRoute) {
    return <SplitMultiRouteComp r={r.route} isShowDetails={isShowDetails} />;
  } else {
    throw new Error('Invalid route type for SwapRoute');
  }
};

export default SwapRoute;
