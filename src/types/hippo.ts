import { SubmitTransactionRequest } from 'aptos/dist/generated';

export type TTransaction = {
  // type: 'signTransaction' | 'signAndSubmit';
  transaction: SubmitTransactionRequest;
  callback: () => void;
  // transactionInfo: Record<string, string | number>;
};
