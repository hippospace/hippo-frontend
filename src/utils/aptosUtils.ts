import { AptosAccount } from 'aptos';
import { Buffer } from 'buffer';
import {
  ENCRYPTED_WALLET_LIST,
  WALLET_STATE_NETWORK_LOCAL_STORAGE_KEY
} from 'config/aptosConstants';

export function createNewAccount(): AptosAccount {
  const account = new AptosAccount();
  // todo: make request to create account on chain
  return account;
}

export function importAccount(key: string): AptosAccount {
  try {
    const nonHexKey = key.startsWith('0x') ? key.substring(2) : key;
    const encodedKey = Uint8Array.from(Buffer.from(nonHexKey, 'hex'));
    const account = new AptosAccount(encodedKey, undefined);
    return account;
  } catch (error) {
    throw error;
  }
}

export function getEncryptedLocalState(): string | null {
  const item = window.localStorage.getItem(ENCRYPTED_WALLET_LIST);
  return item;
}

export type AptosNetwork = 'http://0.0.0.0:8080' | 'https://fullnode.testnet.aptoslabs.com/v1';

export function getLocalStorageNetworkState(): AptosNetwork | null {
  // Get network from local storage by key
  return window.localStorage.getItem(WALLET_STATE_NETWORK_LOCAL_STORAGE_KEY) as AptosNetwork | null;
}

const GAS_PRICE_OF_RAW_APT = 100; // 100 raw apt per gas
const APT_DECIMALS = 10 ** 8;
export const gasToApt = (gas: number | string) =>
  (parseFloat('' + gas) * GAS_PRICE_OF_RAW_APT) / APT_DECIMALS;
export const aptToGas = (apt: number | string) =>
  (parseFloat('' + apt) * APT_DECIMALS) / GAS_PRICE_OF_RAW_APT;
