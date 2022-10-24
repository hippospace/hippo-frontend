import { List } from 'components/Antd';
import { useFormikContext } from 'formik';
import { getTokenList } from 'modules/swap/reducer';
import { ISwapSettings } from 'pages/Swap/types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import VirtualList from 'rc-virtual-list';
import CoinRow from './CoinRow';

import CommonCoinButton from './CommonCoinButton';
import useHippoClient from 'hooks/useHippoClient';
import { CoinInfo as TokenInfo } from '@manahippo/hippo-sdk/dist/generated/coin_list/coin_list';
import { TokenBalance } from 'types/hippo';

interface TProps {
  actionType: 'currencyTo' | 'currencyFrom';
  // isVisible: boolean;
  dismissiModal: () => void;
}

// interface TokenWithBalance extends ITokenInfo {
//   balance: string;
// }

const CoinSelector: React.FC<TProps> = ({ dismissiModal, actionType }) => {
  const { values, setFieldValue } = useFormikContext<ISwapSettings>();
  const tokenList = useSelector(getTokenList);
  const commonCoins = tokenList.filter((token) => {
    return ['APT', 'WBTC', 'WETH', 'USDT', 'USDC'].includes(token.symbol.str());
  });
  const [filter, setFilter] = useState<string>('');
  const { hippoWallet } = useHippoClient();
  const [tokenListBalance, setTokenListBalance] = useState<TokenBalance[]>();

  const onSelectToken = useCallback(
    (token: TokenInfo) => {
      const otherActionType: TProps['actionType'] =
        actionType === 'currencyFrom' ? 'currencyTo' : 'currencyFrom';
      if (token.symbol.str() === values[otherActionType]?.token?.symbol.str()) {
        setFieldValue(otherActionType, {
          ...values[otherActionType],
          token: values[actionType]?.token
        });
      }
      setFieldValue(actionType, {
        ...values[actionType],
        token
      });
      dismissiModal();
    },
    [actionType, values, setFieldValue, dismissiModal]
  );

  const getFilteredTokenListWithBalance = useCallback(() => {
    let currentTokenList = tokenList
      ?.sort((a, b) => (a.symbol.str() <= b.symbol.str() ? -1 : 1))
      .map((t) => {
        const tokenStore = hippoWallet?.symbolToCoinStore[t.symbol.str()];
        const balance = !hippoWallet
          ? -1
          : tokenStore
          ? tokenStore.coin.value.toJsNumber() / Math.pow(10, t.decimals.toJsNumber())
          : 0;
        return {
          token: t,
          balance
        };
      })
      .sort((a, b) => b.balance - a.balance); // TODO: sort by values

    if (filter) {
      currentTokenList = currentTokenList?.filter((token) => {
        const keysForFilter = [token.token.name.str(), token.token.symbol.str()]
          .join(',')
          .toLowerCase();
        return keysForFilter.includes(filter);
      });
    }
    setTokenListBalance(currentTokenList);
  }, [filter, hippoWallet, tokenList]);

  useEffect(() => {
    getFilteredTokenListWithBalance();
  }, [getFilteredTokenListWithBalance]);

  const renderHeaderSearch = useMemo(() => {
    return (
      <div className="flex flex-col gap-y-1">
        <div className="flex gap-2 mb-1">
          {commonCoins.map((coin) => (
            <CommonCoinButton
              coin={coin}
              key={`common-coin-${coin.symbol.str()}`}
              onClickToken={() => onSelectToken(coin)}
            />
          ))}
        </div>
        <input
          className="py-4 px-6 body-bold bg-grey-100 text-grey-900 rounded-xl focus:outline-none border-none"
          value={filter}
          onChange={(e) => setFilter(e.target.value.toLowerCase())}
          placeholder="Search"
        />
      </div>
    );
  }, [filter, onSelectToken, commonCoins]);

  const listRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(0);

  useEffect(() => {
    if (listRef.current?.offsetHeight) setListHeight(listRef.current?.offsetHeight ?? 0);
  }, []);

  const renderTokenList = useMemo(() => {
    return (
      <div className="flex flex-col gap-2 mt-4 flex-grow min-h-0">
        <div className="flex justify-between">
          <div className="text-grey-500 label-large-bold">Token</div>
          <div className="text-grey-500 label-large-bold">{hippoWallet ? 'Balance' : ''}</div>
        </div>
        <div className="h-auto flex-grow min-h-0" ref={listRef}>
          {tokenListBalance && (
            <List
              className="overflow-y-scroll no-scrollbar border-0 h-full"
              rowKey={(item) => `list-row-${(item as TokenInfo).symbol.str()}`}>
              <VirtualList
                data={tokenListBalance || []}
                height={listHeight}
                itemHeight={73}
                itemKey={(item) => `list-item-${item.token.symbol.str()}`}>
                {(item) => (
                  <List.Item
                    className="!border-b-0 !px-0 cursor-pointer p-1"
                    onClick={() => onSelectToken(item.token)}>
                    <CoinRow item={item} />
                  </List.Item>
                )}
              </VirtualList>
            </List>
          )}
        </div>
      </div>
    );
  }, [hippoWallet, tokenListBalance, listHeight, onSelectToken]);

  return (
    <div className="flex flex-col gap-2 h-[50vh] mobile:h-full">
      {renderHeaderSearch}
      {renderTokenList}
    </div>
  );
};

export default CoinSelector;
