import { CONFIGS, NetworkConfiguration } from '@manahippo/hippo-sdk';
import { useSettingsStore } from 'components/Settings';

let aptosRPC = '';

const useNetworkConfiguration = () => {
  const currentNetworkEnv = process.env.REACT_APP_CURRENT_NETWORK;
  const rpcEndpoint = useSettingsStore((state) => state.RPCEendPoint);

  let network: NetworkConfiguration;
  if (currentNetworkEnv === 'localhost') {
    network = CONFIGS.localhost;
  } else if (currentNetworkEnv === 'testnet') {
    network = CONFIGS.testnet;
  } else if (currentNetworkEnv === 'mainnet') {
    network = CONFIGS.mainnet;
  } else {
    throw new Error('Invalid network env');
  }
  if (!aptosRPC) aptosRPC = network.fullNodeUrl;
  if (rpcEndpoint) {
    network.fullNodeUrl = rpcEndpoint;
  } else {
    network.fullNodeUrl = aptosRPC;
  }

  return { networkCfg: network };
};

export default useNetworkConfiguration;
