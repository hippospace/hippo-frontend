import { RawCoinInfo } from '@manahippo/coin-list';
import { ILp, PriceChangePeriod } from 'types/hippo';

export const tokensHavingHippoNativePriceHistory = [
  '0x1::aptos_coin::AptosCoin',
  '0x84d7aeef42d38a5ffc3ccef853e1b82e4958659d16a7de736a29c55fbbeb0114::staked_aptos_coin::StakedAptosCoin', // Tortuga Staked Aptos
  '0xd11107bdf0d6d7040c6c0bfbdecb6545191fdf13e8d8d259952f53e1713f61b5::staked_coin::StakedAptos', // Ditto Staked Aptos
  '0x1000000fa32d122c18a6a31c009ce5e71674f22d06a581bb0a15575e6addadcc::usda::USDA', // Argo USD
  '0xcc8a89c8dce9693d354449f1f73e60e14e347417854f029db5bc8e7454008abb::coin::T', // Wrapped Ether (Wormhole)
  '0xae478ff7d83ed072dbc5e264250e67ef58f57c99d89b447efd8a0a2e8b2be76e::coin::T', // Wrapped BTC (Wormhole)
  '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WETH', // Wrapped Ether (LayerZero)
  '0x159df6b7689437016108a019fd5bef736bac692b6d4a1f10c941f6fbb9a74ca6::oft::CakeOFT' // PancakeSwap Token
];

export const coinPriority = (symbol: string) => {
  const stables = [
    ['USDC', 'zUSDC', 'ceUSDC'], // 10
    ['USDT', 'zUSDT', 'ceUSDT'], // 100
    ['BUSD', 'zBUSD', 'ceBUSD'], // ...
    ['DAI', 'zDAI', 'ceDAI'],
    ['MOD'],
    ['THL']
  ];
  const prios = stables.reduce((pre, cur, index) => {
    const ob = cur.reduce((pre1, cur1, index1) => {
      pre1[cur1] = 10 ** (index + 1) + index1;
      return pre1;
    }, {} as Record<string, number>);
    Object.assign(pre, ob);
    return pre;
  }, {} as Record<string, number>);
  if (symbol in prios) {
    return prios[symbol];
  } else {
    return Infinity;
  }
};

export const coinBridge = (coin: RawCoinInfo) => {
  const bridgeArray = coin.extensions.data.find((a) => a[0] === 'bridge');
  const bridge = (bridgeArray && bridgeArray[1]) ?? '';
  return bridge;
};

export const daysOfPeriod = (p: PriceChangePeriod) => {
  if (p === PriceChangePeriod['1D']) return 1;
  if (p === PriceChangePeriod['7D']) return 7;
  if (p === PriceChangePeriod['30D']) return 30;
};

export function postMessageTyped<T>(
  worker: Worker,
  message: T,
  transferList?: Transferable[],
  options?: StructuredSerializeOptions
) {
  if (transferList && transferList.length > 0) {
    worker.postMessage(message, transferList);
  } else {
    worker.postMessage(message, options);
  }
}

export function lpOfUniqueStr(str: string): ILp {
  const [dex, lp, poolType, ...extra] = str.split(':');
  return {
    dex,
    lp,
    poolType: parseInt(poolType),
    extra: extra.join(':')
  };
}

export function uniqueStrOfLp(lp: ILp) {
  return [lp.dex, lp.lp, lp.poolType, lp.extra].filter((s) => s !== '').join(':');
}
