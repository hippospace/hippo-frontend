import { RawCoinInfo } from '@manahippo/coin-list';
import { AggregatorTypes } from '@manahippo/hippo-sdk';
import { ApiTradeStep } from '@manahippo/hippo-sdk/dist/aggregator/types';
import invariant from 'tiny-invariant';
import { GeneralRouteAndQuote, IRoutesGroupedByDex } from 'types/hippo';

export const serializeRouteQuote = (rq: GeneralRouteAndQuote) => {
  const stepStr = (s: ApiTradeStep) => `${s.dexType}(${s.poolType.toJsNumber()})`;

  const tokensStr = (tokens: RawCoinInfo[]) => tokens.map((t) => t.symbol).join('->');

  const routesStr = (
    r:
      | AggregatorTypes.ApiTradeRoute
      | AggregatorTypes.SplitSingleRoute
      | AggregatorTypes.SplitMultiRoute
  ): string | string[] => {
    if (r instanceof AggregatorTypes.ApiTradeRoute) {
      return r.steps.map((s) => stepStr(s)).join('x') + `:${tokensStr(r.tokens)}`;
    } else if (r instanceof AggregatorTypes.SplitSingleRoute) {
      return (
        r.splitSteps
          .map((ss) =>
            ss.units.map((u) => `${u.scale}*${stepStr(u.step.toApiTradeStep())}`).join('|')
          )
          .join('x') + `:${tokensStr(r.tokens)}`
      );
    } else if (r instanceof AggregatorTypes.SplitMultiRoute) {
      return r.units.map((u) => `[${u.scale}*${routesStr(u.route)}]`);
    } else {
      throw new Error('Invalid route type to print steps');
    }
  };

  // Same dexType might have different poolTypes
  return `${rq.quote.inputUiAmt}->${rq.quote.outputUiAmt}:${routesStr(rq.route)}`;
};

export function getMergedRoutes(allRoutes: GeneralRouteAndQuote[]): IRoutesGroupedByDex[] {
  const mRoutes: Map<AggregatorTypes.DexType, GeneralRouteAndQuote[]> = new Map();

  allRoutes.forEach((r) => {
    let dex: AggregatorTypes.DexType | undefined = undefined;
    if (r.route instanceof AggregatorTypes.ApiTradeRoute) {
      const dexes = r.route.steps.map((s) => s.dexType);
      if (dexes.every((d) => d === dexes[0])) {
        dex = dexes[0];
      }
    } else if (r.route instanceof AggregatorTypes.SplitSingleRoute) {
      // do nothing
    } else if (r.route instanceof AggregatorTypes.SplitMultiRoute) {
      const unitRoutes = r.route.units.map((u) => u.route);
      const dexes = unitRoutes.flatMap((ur) =>
        ur.splitSteps.flatMap((ss) => ss.units.map((u) => u.step.pool.dexType))
      );
      if (dexes.every((d) => d === dexes[0])) {
        dex = dexes[0];
      }
    } else {
      throw new Error('Invalid route type for mergedRoutes');
    }

    if (dex === undefined) {
      if (!mRoutes.has(AggregatorTypes.DexType.Hippo)) {
        mRoutes.set(AggregatorTypes.DexType.Hippo, []);
      }
      mRoutes.get(AggregatorTypes.DexType.Hippo)?.push(r);
    } else {
      if (!mRoutes.has(dex)) {
        mRoutes.set(dex, []);
      }
      mRoutes.get(dex)?.push(r);
    }
  });
  const mRoutesValues = Array.from(mRoutes.values());
  invariant(
    mRoutesValues.length === 0 || mRoutesValues.every((routes) => routes.length > 0),
    'Make sure routes in mRoutes is not empty'
  );
  const mRoutesArr = [];
  for (const [key, value] of mRoutes) {
    mRoutesArr.push({
      dex: key,
      routes: value
    });
  }
  mRoutesArr.sort((a, b) => b.routes[0].quote.outputUiAmt - a.routes[0].quote.outputUiAmt);
  return mRoutesArr;
}
