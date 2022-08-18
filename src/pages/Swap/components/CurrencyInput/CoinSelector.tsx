import { List } from 'components/Antd';
import { useFormikContext } from 'formik';
import { getTokenList } from 'modules/swap/reducer';
import { ISwapSettings } from 'pages/Swap/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import VirtualList from 'rc-virtual-list';
import CoinRow from './CoinRow';

import CommonCoinButton from './CommonCoinButton';
import useHippoClient from 'hooks/useHippoClient';
import { TokenInfo } from '@manahippo/hippo-sdk/dist/generated/coin_registry/coin_registry';

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
    return ['BTC', 'USDT', 'USDC'].includes(token.symbol.str());
  });
  const [filter, setFilter] = useState<string>('');
  const { hippoWallet } = useHippoClient();
  const [tokenListBalance, setTokenListBalance] = useState<TokenInfo[]>();

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

  // const filteredTokenList = useMemo(() => {
  //   if (!filter) return tokenList;
  //   return tokenList.filter((token) => {
  //     const keysForFilter = [token.name, token.symbol, token.address].join(',').toLowerCase();
  //     return keysForFilter.includes(filter);
  //   });
  // }, [tokenList, filter]);

  const getFilteredTokenListWithBalance = useCallback(() => {
    let currentTokenList = tokenList.filter((t) => t.symbol.str() !== 'APT');
    if (filter) {
      currentTokenList = currentTokenList.filter((token) => {
        const keysForFilter = [token.name.str(), token.symbol.str()].join(',').toLowerCase();
        return keysForFilter.includes(filter);
      });
    }
    setTokenListBalance(currentTokenList);
  }, [filter, tokenList]);

  useEffect(() => {
    getFilteredTokenListWithBalance();
  }, [getFilteredTokenListWithBalance]);

  const renderHeaderSearch = useMemo(() => {
    return (
      <div className="flex flex-col gap-y-1">
        <div className="flex gap-2">
          {commonCoins.map((coin) => (
            <CommonCoinButton
              coin={coin}
              key={`common-coin-${coin.symbol.str()}`}
              onClickToken={() => onSelectToken(coin)}
            />
          ))}
        </div>
        <input
          className="py-4 px-6 font-bold text-base bg-primaryGrey text-grey-900 rounded-xl focus:outline-none border-none"
          value={filter}
          onChange={(e) => setFilter(e.target.value.toLowerCase())}
          placeholder="Search"
        />
      </div>
    );
  }, [filter, onSelectToken, commonCoins]);

  const renderTokenList = useMemo(() => {
    return (
      <div className="flex flex-col gap-2 mt-4">
        <div className="flex justify-between">
          <small className="text-grey-500 font-bold">Token</small>
          <small className="text-grey-500 font-bold">{hippoWallet ? 'Balance' : ''}</small>
        </div>
        <List
          className="h-[376px] overflow-y-scroll no-scrollbar border-0"
          rowKey={(item) => `list-row-${(item as TokenInfo).symbol.str()}`}>
          <VirtualList
            data={tokenListBalance || []}
            height={376}
            itemHeight={56}
            itemKey={(item) => `list-item-${item.symbol.str()}`}>
            {(item) => (
              <List.Item
                className="!border-b-0 !px-0 cursor-pointer p-1"
                onClick={() => onSelectToken(item)}>
                <CoinRow item={item} />
              </List.Item>
            )}
          </VirtualList>
        </List>
      </div>
    );
  }, [hippoWallet, tokenListBalance, onSelectToken]);

  return (
    <div className="flex flex-col gap-2">
      {renderHeaderSearch}
      {renderTokenList}
    </div>
  );
};

export default CoinSelector;
