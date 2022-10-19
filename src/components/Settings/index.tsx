import { Input, Radio, RadioChangeEvent, Space } from 'antd';
import { useCallback, useState } from 'react';
import Button from 'components/Button';
import { useLocalStorage } from 'hooks/useLocalStorage';
import classNames from 'classnames';
import openNotification, { openErrorNotification } from 'utils/notifications';
import { isValidUrl } from 'utils/utility';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface SettingsState {
  RPCEendPoint: string;
  setRPCEndPoint: (rpc: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set) => ({
        RPCEendPoint: '',
        setRPCEndPoint: (rpc) => set((state) => ({ ...state, RPCEendPoint: rpc }))
      }),
      { name: 'hippo-settings-store' }
    )
  )
);

const Settings = () => {
  const rpcEndpoint = useSettingsStore((state) => state.RPCEendPoint);
  const setRPCEndPointInStore = useSettingsStore((state) => state.setRPCEndPoint);
  const setRpcEndpoint = useCallback(
    (v: string) => {
      setRPCEndPointInStore(v);
      openNotification({ detail: 'RPC endpoint switched successfully', type: 'success' });
    },
    [setRPCEndPointInStore]
  );

  const { useLocalStorageState } = useLocalStorage();

  const [customRPCLS, setCustomRPCLS] = useLocalStorageState<string[]>('hippo-custom-rpcs', []);
  const [customRPC, setCustomRPC] = useState<string>(customRPCLS[0]);

  const onChange = useCallback(
    (e: RadioChangeEvent) => {
      setRpcEndpoint(e.target.value);
    },
    [setRpcEndpoint]
  );
  const switchCustomRPC = useCallback(() => {
    if (!isValidUrl(customRPC)) {
      openErrorNotification({ detail: 'Invalid RPC URL' });
      return;
    }
    setRpcEndpoint(customRPC);
    setCustomRPCLS([customRPC]);
  }, [customRPC, setCustomRPCLS, setRpcEndpoint]);

  return (
    <div className="hippo-settings p-2 mobile:p-0">
      <div className="h6 mb-4">RPC Endpoint</div>
      <Radio.Group onChange={onChange} value={rpcEndpoint}>
        <Space direction="vertical">
          <Radio className="largeTextNormal" value={''}>
            Aptos
          </Radio>
          <Radio
            className="largeTextNormal"
            value={'https://aptos-mainnet.nodereal.io/v1/0d8ae3b20f034e029c49e4febe30cbc3'}>
            Nodereal
          </Radio>
        </Space>
      </Radio.Group>
      <div className="flex gap-x-2 mt-2">
        <Input
          className={classNames({
            'text-primePurple-700 font-bold': rpcEndpoint === customRPCLS[0]
          })}
          placeholder="Cutom RPC Endpoint URL"
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
