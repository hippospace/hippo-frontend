import { CONFIGS, NetworkConfiguration } from '@manahippo/hippo-sdk';

export const readConfig = (): NetworkConfiguration => {
  const isTestnet = true;
  const netConf = isTestnet ? CONFIGS.testnet : CONFIGS.localhost;
  return netConf;
};
