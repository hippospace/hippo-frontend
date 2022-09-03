import { CONFIGS, NetworkConfiguration } from '@manahippo/hippo-sdk';

export const readConfig = (): NetworkConfiguration => {
  const isDevnet = true;
  const netConf = isDevnet ? CONFIGS.devnet : CONFIGS.localhost;
  return netConf;
};
