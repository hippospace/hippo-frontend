import { CONFIGS } from '@manahippo/hippo-sdk';
import { AptosClient } from 'aptos';
import { FaucetClient } from 'aptos';

export const faucetClient = new FaucetClient(
  CONFIGS.testnet.fullNodeUrl,
  CONFIGS.testnet.faucetUrl
);

export const aptosClient = new AptosClient(CONFIGS.testnet.fullNodeUrl);
