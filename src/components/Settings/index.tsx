import { Input, Radio, RadioChangeEvent, Space } from 'antd';
import { useCallback, useState } from 'react';
import Button from 'components/Button';
import classNames from 'classnames';
import openNotification, { openErrorNotification } from 'utils/notifications';
import { isValidUrl } from 'utils/utility';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import Hint from 'components/Hint';

export enum RPCType {
  Aptos = 'Aptos',
  Nodereal = 'Nodereal',
  Custom = 'Custom'
}

export enum Theme {
  Auto = 'Auto',
  Light = 'Light',
  Dark = 'Dark'
}
interface SettingsState {
  RPCEndPoint: RPCType;
  customRPCs: string[];
  selectedCustomRPCIndex: number;
  setRPCEndPoint: (rpc: RPCType) => void;
  setCustomRPCs: (rpcs: string[]) => void;
  setSelectedCustomRPCIndex: (i: number) => void;
  theme: Theme;
  setTheme: (m: Theme) => void;
}

const DEFAULT_RPC = RPCType.Nodereal;

const preSetRpcs = new Map();
preSetRpcs.set(
  RPCType.Nodereal,
  'https://aptos-mainnet.nodereal.io/v1/3e18914c169e4dfaa5824895a8d1def9/v1'
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
        setSelectedCustomRPCIndex: (i) => set((state) => ({ ...state, selectedCustomRPCIndex: i })),

        theme: Theme.Auto,
        setTheme: (m) => set((state) => ({ ...state, theme: m }))
      }),
      { name: 'hippo-settings-store' }
    )
  )
);

export const useRpcEndpoint = () => {
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

export const useThemeMode = () => {
  return useSettingsStore((state) => state.theme);
};

export const useIsDarkMode = () => {
  const theme = useThemeMode();
  return (
    theme === Theme.Dark ||
    (theme === Theme.Auto && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );
};

export const useTheme = () => {
  const isDarkMode = useIsDarkMode();
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

const Settings = () => {
  const rpcEndpoint = useRpcEndpoint();
  const setRPCEndPointInStore = useSettingsStore((state) => state.setRPCEndPoint);
  const customRPCs = useSettingsStore((state) => state.customRPCs);
  const setCustomRPCs = useSettingsStore((state) => state.setCustomRPCs);
  const selectedCustomRPCIndex = useSettingsStore((state) => state.selectedCustomRPCIndex);
  const setSelectedCustomRPCIndex = useSettingsStore((state) => state.setSelectedCustomRPCIndex);

  const theme = useThemeMode();
  const setDarkMode = useSettingsStore((state) => state.setTheme);

  const setRpcEndpoint = useCallback(
    (v: RPCType) => {
      setRPCEndPointInStore(v);
      openNotification({ detail: 'RPC endpoint switched successfully', type: 'success' });
      if (v === RPCType.Aptos) {
        openNotification({
          type: 'info',
          detail: 'We recommend to use Aptos only as a backup',
          title: 'Note',
          duration: 9
        });
      }
    },
    [setRPCEndPointInStore]
  );

  const [customRPC, setCustomRPC] = useState<string | undefined>(
    customRPCs[selectedCustomRPCIndex]
  );

  const setPredefinedRPC = useCallback(
    (e: RadioChangeEvent) => {
      setRpcEndpoint(e.target.value as RPCType);
    },
    [setRpcEndpoint]
  );
  const switchCustomRPC = useCallback(() => {
    if (!customRPC || !isValidUrl(customRPC)) {
      openErrorNotification({ detail: 'Invalid RPC URL' });
      return;
    }
    setRpcEndpoint(RPCType.Custom);
    setCustomRPCs([customRPC]);
    setSelectedCustomRPCIndex(0);
  }, [customRPC, setCustomRPCs, setRpcEndpoint, setSelectedCustomRPCIndex]);

  return (
    <div className="hippo-settings p-2 mobile:p-0">
      <div className="mb-4">
        <div className="h6 mb-2">Theme</div>
        <Radio.Group onChange={(e) => setDarkMode(e.target.value)} value={theme}>
          <Space direction="vertical">
            {Object.values(Theme).map((mode, index) => {
              return (
                <Radio key={`preset-rpc-${index}`} className="body-medium" value={mode}>
                  {mode} {mode === Theme.Auto && <Hint content="Will follow your OS settings" />}
                </Radio>
              );
            })}
          </Space>
        </Radio.Group>
      </div>
      <div>
        <div className="h6 mb-2">RPC Endpoint</div>
        <Radio.Group onChange={setPredefinedRPC} value={rpcEndpoint}>
          <Space direction="vertical">
            {Array.from(preSetRpcs.keys()).map((rpc, index) => {
              return (
                <Radio key={`preset-rpc-${index}`} className="body-medium" value={rpc}>
                  {rpc}{' '}
                  {rpc === RPCType.Nodereal && (
                    <span className="text-grey-500 body-hint">(Recommended)</span>
                  )}
                </Radio>
              );
            })}
          </Space>
        </Radio.Group>
        <div className="flex gap-x-2 mt-2">
          <div
            className={classNames('flex-grow h-[44px] rounded-xl p-[2px]', {
              'bg-select-border': rpcEndpoint === RPCType.Custom
            })}>
            <Input
              className="w-full h-full"
              placeholder="Cutom RPC URL"
              value={customRPC}
              onChange={(e) => setCustomRPC(e.target.value)}
            />
          </div>
          <Button variant="primary" size="small" onClick={switchCustomRPC}>
            Switch
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
