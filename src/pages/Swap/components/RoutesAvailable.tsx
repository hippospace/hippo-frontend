import { ReactNode, useState } from 'react';
import { GeneralRouteAndQuote, IRoutesGroupedByDex } from 'types/hippo';
import { RoutesSimulateResults } from './TokenSwap';
import { Types } from 'aptos';
import useTokenAmountFormatter from 'hooks/useTokenAmountFormatter';
import { AggregatorTypes } from '@manahippo/hippo-sdk';
import classNames from 'classnames';
import { Skeleton, Tooltip } from 'antd';
import { gasToApt } from 'utils/aptosUtils';
import SwapRoute from './SwapRoute';
import { useTimeout } from 'usehooks-ts';
import VirtualList from 'rc-virtual-list';
import { MoreArrowDown } from 'resources/icons';
import { serializeRouteQuote } from './TokenSwapUtil';
import { SwapContextType } from '..';

interface IRoutesProps {
  className?: string;
  routes: IRoutesGroupedByDex[];
  ctx: SwapContextType;
  routeSelected: GeneralRouteAndQuote | undefined;
  onRouteSelected: (route: GeneralRouteAndQuote, index: number) => void;
  isDesktopScreen?: boolean;
  isRefreshing?: boolean;
  isUserInputChanged?: boolean;
  refreshButton?: ReactNode;
  simuResults?: RoutesSimulateResults;
  isFixedOutputMode?: boolean;
}

interface IRouteRowProps {
  route: GeneralRouteAndQuote;
  ctx: SwapContextType;
  isSelected?: boolean;
  isBestPrice: boolean;
  simuResult?: Types.UserTransaction;
}

const routeRowMinHeight = 70;
const RouteRow: React.FC<IRouteRowProps> = ({
  route,
  ctx,
  isSelected = false,
  isBestPrice = false,
  simuResult
}) => {
  const toToken = route.route.yCoinInfo;
  const outputUiAmt = route.quote.outputUiAmt;
  const outputValue = 0; // TOD0: calculate the output value
  const [tokenAmountFormatter] = useTokenAmountFormatter();
  const outputFormatted = tokenAmountFormatter(outputUiAmt, toToken);
  const customMaxGasAmount = ctx.maxGasFee;

  let rowH = routeRowMinHeight;
  if (route.route instanceof AggregatorTypes.SplitMultiRoute) {
    const routesCount = route.route.units.length;
    rowH += (routesCount - 1) * 24;
  }

  const [isShowDetails, setIsShowDetails] = useState(false);
  console.log(simuResult);

  return (
    <div
      className={classNames('pt-2')}
      style={{ height: `${rowH}px` }}
      onTouchStart={() => setIsShowDetails(true)}
      onTouchEnd={() => setIsShowDetails(false)}
      onMouseEnter={() => setIsShowDetails(true)}
      onMouseLeave={() => setIsShowDetails(false)}>
      <div
        className={classNames(
          'relative h-full flex flex-col justify-center bg-clip-border rounded-lg border-2 cursor-pointer bg-field border-transparent',
          {
            'bg-select-border bg-origin-border bg-cover': isSelected
          }
        )}>
        <div
          className={classNames('w-full h-full px-2 pt-2 pb-[6px] rounded-lg space-y-1', {
            'bg-prime-100/90 dark:bg-prime-900/70': isSelected,
            'bg-field': !isSelected
          })}>
          <div className="flex justify-between items-center body-bold text-grey-700">
            <div className="body-bold mr-1">{outputFormatted}</div>
            <div className="whitespace-nowrap text-grey-500 label-small-bold">
              {simuResult?.success && (
                <Tooltip
                  title={
                    customMaxGasAmount >= parseFloat(simuResult.gas_used)
                      ? 'Simulated Gas cost'
                      : 'Simulated Gas cost is bigger than the custom max gas amount'
                  }>
                  <div
                    className={classNames({
                      'text-error-500': customMaxGasAmount < parseFloat(simuResult.gas_used)
                    })}>
                    {gasToApt(simuResult.gas_used).toFixed(6)} APT Gas
                  </div>
                </Tooltip>
              )}
              {simuResult && !simuResult.success && (
                <Tooltip title={simuResult.vm_status}>
                  <div className={'text-error-500'}>Simulation failed</div>
                </Tooltip>
              )}
              <div className="hidden">${outputValue}</div>
            </div>
          </div>
          <div className="text-grey-500 label-small-bold">
            <SwapRoute r={route} isShowDetails={isShowDetails} />
          </div>
        </div>
        {isBestPrice && (
          <div className="absolute -left-[2px] -top-2 h-4 px-2 label-large-bold bg-[#D483FF] rounded-lg rounded-bl-none flex items-center text-white">
            Best price
          </div>
        )}
      </div>
    </div>
  );
};

export const RoutesAvailable: React.FC<IRoutesProps> = ({
  routes,
  ctx,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRouteSelected,
  routeSelected,
  className = '',
  isDesktopScreen = false,
  isRefreshing = false,
  isUserInputChanged = true,
  refreshButton,
  simuResults = new Map(),
  isFixedOutputMode = false
}) => {
  const isEmpty = !(routes?.length > 0);

  const [isMore, setIsMore] = useState(false);
  const rowsWhenLess = 2;
  const rowsWhenMore = 4;
  const rowsOnDesktop = 4;

  const rows = isDesktopScreen
    ? isEmpty
      ? rowsOnDesktop
      : Math.min(rowsOnDesktop, routes.length)
    : isEmpty
    ? rowsWhenLess
    : Math.min(routes.length, isMore ? rowsWhenMore : rowsWhenLess);

  const height = rows * routeRowMinHeight;

  const [isRefreshingDelayed, setIsRefreshingDelayed] = useState(false);

  useTimeout(
    () => {
      setIsRefreshingDelayed(isRefreshing);
    },
    isRefreshing ? 300 : 0
  );

  return (
    <div className={className}>
      <div className="label-small-bold text-grey-500 mb-2 flex justify-between items-center">
        {isEmpty || isRefreshingDelayed ? (
          <div>Loading routes...</div>
        ) : (
          <>
            <div> Routes from all DEXes {isFixedOutputMode && '(Exact-output mode)'}</div>
          </>
        )}
        <div>{refreshButton}</div>
      </div>
      <div
        style={{ height }}
        className={classNames({ 'pointer-events-none': !isDesktopScreen && !isMore })}>
        {isEmpty || (isUserInputChanged && isRefreshingDelayed) ? (
          <div className="h-full flex flex-col justify-evenly">
            {new Array(rows).fill(0).map((r, index) => (
              <Skeleton key={index} title={false} paragraph={true} active />
            ))}
          </div>
        ) : (
          <VirtualList
            className="pr-1 scrollbar"
            height={height}
            itemHeight={routeRowMinHeight}
            data={routes}
            itemKey={(item) => serializeRouteQuote(item.routes[0])}>
            {(ro, index) => (
              <div onClick={() => onRouteSelected(ro.routes[0], index)}>
                <RouteRow
                  route={ro.routes[0]}
                  ctx={ctx}
                  isSelected={ro.routes[0] === routeSelected}
                  isBestPrice={index === 0}
                  simuResult={simuResults.get(serializeRouteQuote(ro.routes[0]))}
                />
              </div>
            )}
          </VirtualList>
        )}
      </div>
      {!isDesktopScreen && !isEmpty && routes.length > rowsWhenLess && (
        <div className="flex label-small-bold text-grey-500 mt-2 justify-between">
          <div
            className="ml-auto cursor-pointer hover:opacity-50"
            onClick={() => setIsMore(!isMore)}>
            {isMore ? (
              <>
                Show less <MoreArrowDown className="font-icon rotate-180 align-baseline" />
              </>
            ) : (
              <>
                Show more <MoreArrowDown className="font-icon !align-bottom" />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
