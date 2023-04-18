import { CoinListClient, NetworkType, RawCoinInfo } from '@manahippo/coin-list';
import {
  AggregatorTypes,
  CONFIGS,
  NetworkConfiguration,
  TradeAggregatorV2
} from '@manahippo/hippo-sdk';
import { AptosClient } from 'aptos';
import { delay } from 'utils/utility';

export type SwapWorkerMessageCmd =
  | 'initWorker'
  | 'fetchRoutes'
  | 'reloadPools'
  | 'queryIfRoutesExisting'
  | 'queryState';

export interface ISwapWorkerMessage<T> {
  cmd: SwapWorkerMessageCmd;
  args: T;
}

export interface ISwapWorkerReturn<T> {
  cmd: SwapWorkerMessageCmd;
  result: T;
}

export interface ISwapWorkerError {
  cmd: SwapWorkerMessageCmd;
  error: any;
}

export interface ISwapWorkerInitArgs {
  rpcUrl: string;
}

export interface IFetchRoutesArgs {
  ts: number;
  inputUiAmt: number;
  x: RawCoinInfo;
  y: RawCoinInfo;
  maxSteps?: 1 | 2 | 3;
  reloadState?: boolean;
  allowRoundTrip?: boolean;
  customReloadMinInterval?: number | undefined;
  allowHighGas?: boolean;
  isFixedOutput: boolean;
  outputUiAmt?: number;
}

export interface IReloadPoolsArgs {
  ts: number;
  x: RawCoinInfo;
  y: RawCoinInfo;
  fixedOut: boolean;
  maxSteps?: 1 | 2 | 3;
  reloadState?: boolean;
  allowRoundTrip?: boolean;
  customReloadMinInterval?: number | undefined;
  allowHighGas?: boolean;
}
export interface IQueryIfRoutesExistingArgs {
  x: RawCoinInfo;
  y: RawCoinInfo;
  fixedOut: boolean;
  maxSteps?: 1 | 2 | 3;
  allowRoundTrip?: boolean;
}

export interface IFetchRoutesResult {
  allRoutes:
    | {
        quote: AggregatorTypes.QuoteType;
        route: AggregatorTypes.IApiSplitMultiRouteJSON;
      }[]
    | {
        route: AggregatorTypes.IApiRouteJSON;
        quote: AggregatorTypes.QuoteType;
      }[];
  allRoutesCount: number;
  isReloadInternal: boolean;
  isFixedOutput: boolean;
  ts: number;
}
export interface IReloadPoolsResult {
  isReloadInternal: boolean;
  ts: number;
}
export interface IQueryIfRoutesExistingResult {
  hasRoutes: boolean;
}
export interface IQueryStateResult {
  isReady: boolean;
}

let hippoAgg: TradeAggregatorV2 | undefined;
let coinListCli: CoinListClient | undefined;
let aptosClient: AptosClient | undefined;
let network: NetworkConfiguration = (() => {
  const currentNetworkEnv = process.env.REACT_APP_CURRENT_NETWORK;
  if (currentNetworkEnv === 'localhost') {
    return CONFIGS.localhost;
  } else if (currentNetworkEnv === 'testnet') {
    return CONFIGS.testnet;
  } else if (currentNetworkEnv === 'mainnet') {
    return CONFIGS.mainnet;
  } else {
    throw new Error('Invalid network env');
  }
})();
let isReady = false;
let initTs: number = 0;

const initWorker = async (configs: ISwapWorkerInitArgs) => {
  if (isReady && network.fullNodeUrl === configs.rpcUrl) return;

  const now = Date.now();
  initTs = now;
  network.fullNodeUrl = configs.rpcUrl;

  aptosClient = new AptosClient(network.fullNodeUrl, {
    CREDENTIALS: 'same-origin',
    WITH_CREDENTIALS: false
  });

  coinListCli = new CoinListClient(false, network.name as NetworkType);
  await coinListCli.update();

  if (now !== initTs) return;
  hippoAgg = new TradeAggregatorV2(aptosClient, {
    netConfig: network,
    coinListClient: coinListCli,
    poolReloadRequestsRateOfSecond: 400,
    buildDefaultPoolList: true
  });
  try {
    // Important: load full pool list
    await hippoAgg.updatePoolLists();
  } catch (err) {
    console.log('Update Hippo trade aggregator failed', err);
  }
  console.log('Worker init done');

  if (!isReady) {
    isReady = true;
    const msg: ISwapWorkerReturn<IQueryStateResult> = {
      cmd: 'queryState',
      result: {
        isReady
      }
    };
    postMessage(msg);
    for (let i = 0; i < 4; i++) {
      await delay(1000);
      postMessage(msg);
    }
  }
};

self.onmessage = async (message: { data: ISwapWorkerMessage<unknown> }) => {
  console.log('worker data', message.data);
  const { cmd, args } = message.data;

  try {
    if (cmd === 'queryState') {
      const msg: ISwapWorkerReturn<IQueryStateResult> = {
        cmd: 'queryState',
        result: {
          isReady
        }
      };
      postMessage(msg);
    } else if (cmd === 'initWorker') {
      const { rpcUrl } = args as ISwapWorkerInitArgs;
      await initWorker({ rpcUrl });
    } else if (cmd === 'fetchRoutes' && hippoAgg) {
      const {
        ts,
        inputUiAmt: fromUiAmt,
        x: fromToken,
        y: toToken,
        maxSteps,
        reloadState: isReloadInternal,
        customReloadMinInterval: poolReloadMinInterval,
        allowHighGas: isAllowHighGas,
        isFixedOutput,
        outputUiAmt: toUiAmt
      } = args as IFetchRoutesArgs;

      const { routes: allRoutes, allRoutesCount } = await (async () => {
        if (!isFixedOutput && fromUiAmt) {
          console.time('GetQuotes');
          const routes = await hippoAgg.getQuotes(fromUiAmt, fromToken, toToken, {
            maxSteps,
            reloadState: isReloadInternal,
            customReloadMinInterval: poolReloadMinInterval,
            allowHighGas: isAllowHighGas
          });
          console.timeEnd('GetQuotes');
          return {
            allRoutesCount: routes.length,
            routes: routes.map((r) => ({
              quote: r.quote,
              route: r.route.toJSON()
            }))
          };
        } else if (isFixedOutput && toUiAmt) {
          const routeAndQuote = await hippoAgg.getQuotesWithFixedOutputWithChange(
            toUiAmt,
            fromToken,
            toToken,
            {
              reloadState: isReloadInternal,
              customReloadMinInterval: poolReloadMinInterval,
              allowHighGas: isAllowHighGas
            }
          );
          const fixedOutputRoutes = routeAndQuote
            ? [routeAndQuote].map((r) => ({
                ...r,
                route: r.route.toJSON()
              }))
            : [];
          return {
            allRoutesCount: fixedOutputRoutes.length,
            routes: fixedOutputRoutes
          };
        } else {
          throw new Error('Unreachable branch');
        }
      })();
      const msg: ISwapWorkerReturn<IFetchRoutesResult> = {
        cmd,
        result: {
          allRoutes,
          allRoutesCount,
          isFixedOutput,
          ts,
          isReloadInternal: !!isReloadInternal
        }
      };
      postMessage(msg);
    } else if (cmd === 'reloadPools' && hippoAgg) {
      const { ts, x, y, maxSteps, reloadState, customReloadMinInterval, allowHighGas } =
        args as IReloadPoolsArgs;
      await hippoAgg.reloadPools(x, y, {
        maxSteps,
        reloadState,
        customReloadMinInterval,
        allowHighGas
      });
      const msg: ISwapWorkerReturn<IReloadPoolsResult> = {
        cmd,
        result: {
          ts,
          isReloadInternal: !!reloadState
        }
      };
      postMessage(msg);
    } else if (cmd === 'queryIfRoutesExisting' && hippoAgg) {
      const { x, y, maxSteps } = args as IQueryIfRoutesExistingArgs;
      const hasRoutes = hippoAgg.hasRoute(x, y, { maxSteps });
      const msg: ISwapWorkerReturn<IQueryIfRoutesExistingResult> = {
        cmd,
        result: {
          hasRoutes
        }
      };
      postMessage(msg);
    } else {
      console.error('Unknown command', cmd);
    }
  } catch (error) {
    const errMsg: ISwapWorkerError = {
      cmd,
      error
    };
    postMessage(errMsg);
  }
};

export {};
