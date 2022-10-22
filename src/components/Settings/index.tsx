import { Input, Radio, RadioChangeEvent, Space } from 'antd';
import { useCallback, useState } from 'react';
import Button from 'components/Button';
import classNames from 'classnames';
import openNotification, { openErrorNotification } from 'utils/notifications';
import { isValidUrl } from 'utils/utility';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export enum RPCType {
  Aptos = 'Aptos',
  Nodereal = 'Nodereal',
  Custom = 'Custom'
}
interface SettingsState {
  RPCEndPoint: RPCType;
  customRPCs: string[];
  selectedCustomRPCIndex: number;
  setRPCEndPoint: (rpc: RPCType) => void;
  setCustomRPCs: (rpcs: string[]) => void;
  setSelectedCustomRPCIndex: (i: number) => void;
}

const DEFAULT_RPC = RPCType.Nodereal;

const preSetRpcs = new Map();
preSetRpcs.set(
  RPCType.Nodereal,
  'https://aptos-mainnet.nodereal.io/v1/0d8ae3b20f034e029c49e4febe30cbc3'
);
preSetRpcs.set(RPCType.Aptos, '');

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set) => ({
        RPCEndPoint: DEFAULT_RPC,
        customRPCs: [],
        selectedCustomRPCIndex: 0, // currently only support one custom rpc
        setRPCEndPoint: (rpc) => set((state) => ({ ...state, RPCEndPoint: rpc })),
        setCustomRPCs: (rpcs) => set((state) => ({ ...state, customRPCs: rpcs })),
        setSelectedCustomRPCIndex: (i) => set((state) => ({ ...state, selectedCustomRPCIndex: i }))
      }),
      { name: 'hippo-settings-store' }
    )
  )
);

const useRpcEndpoint = () => {
  const rpcEndpoint = useSettingsStore((state) => state.RPCEndPoint);
  const setRPCEndPointInStore = useSettingsStore((state) => state.setRPCEndPoint);
  if (!Object.values(RPCType).includes(rpcEndpoint)) {
    // Backward compatible
    setRPCEndPointInStore(DEFAULT_RPC);
    return DEFAULT_RPC;
  }
  return rpcEndpoint;
};

export const useRPCURL = () => {
  const rpcEndpoint = useRpcEndpoint();
  const selectedCustomRPCIndex = useSettingsStore((state) => state.selectedCustomRPCIndex);
  const customRPCs = useSettingsStore((state) => state.customRPCs);
  if (rpcEndpoint !== RPCType.Custom) {
    return preSetRpcs.get(rpcEndpoint);
  } else if (rpcEndpoint) {
    return customRPCs[selectedCustomRPCIndex];
  }
};

const Settings = () => {
  const rpcEndpoint = useRpcEndpoint();
  const setRPCEndPointInStore = useSettingsStore((state) => state.setRPCEndPoint);
  const customRPCs = useSettingsStore((state) => state.customRPCs);
  const setCustomRPCs = useSettingsStore((state) => state.setCustomRPCs);
  const selectedCustomRPCIndex = useSettingsStore((state) => state.selectedCustomRPCIndex);
  const setSelectedCustomRPCIndex = useSettingsStore((state) => state.setSelectedCustomRPCIndex);

  const setRpcEndpoint = useCallback(
    (v: RPCType) => {
      setRPCEndPointInStore(v);
      openNotification({ detail: 'RPC endpoint switched successfully', type: 'success' });
    },
    [setRPCEndPointInStore]
  );

  const [customRPC, setCustomRPC] = useState<string | undefined>(
    customRPCs[selectedCustomRPCIndex]
  );

  const onChange = useCallback(
    (e: RadioChangeEvent) => {
      setRpcEndpoint(e.target.value as RPCType);
    },
    [setRpcEndpoint]
  );
  const switchCustomRPC = useCallback(() => {
    if (!isValidUrl(customRPC)) {
      openErrorNotification({ detail: 'Invalid RPC URL' });
      return;
    }
    setRpcEndpoint(RPCType.Custom);
    setCustomRPCs([customRPC]);
    setSelectedCustomRPCIndex(0);
  }, [customRPC, setCustomRPCs, setRpcEndpoint, setSelectedCustomRPCIndex]);

  return (
    <div className="hippo-settings p-2 mobile:p-0">
      <div className="h6 mb-4">RPC Endpoint</div>
      <Radio.Group onChange={onChange} value={rpcEndpoint}>
        <Space direction="vertical">
          {Array.from(preSetRpcs.keys()).map((rpc, index) => {
            return (
              <Radio key={`preset-rpc-${index}`} className="body-medium" value={rpc}>
                {rpc}
              </Radio>
            );
          })}
        </Space>
      </Radio.Group>
      <div className="flex gap-x-2 mt-2">
        <Input
          className={classNames({
            'text-prime-700': rpcEndpoint === RPCType.Custom
          })}
          placeholder="Cutom RPC URL"
          value={customRPC}
          onChange={(e) => setCustomRPC(e.target.value)}
        />
        <Button variant="primary" size="small" onClick={switchCustomRPC}>
          Switch
        </Button>
      </div>
    </div>
  );
};

export default Settings;
