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
import { RawCoinInfo as TokenInfo } from '@manahippo/coin-list';
import { TokenBalance } from 'types/hippo';
import classNames from 'classnames';

interface TProps {
  actionType: 'currencyTo' | 'currencyFrom';
  // isVisible: boolean;
  dismissiModal: () => void;
}

type Filter = 'All' | 'Native' | 'LayerZero' | 'Wormhole' | 'Celer';

// interface TokenWithBalance extends ITokenInfo {
//   balance: string;
// }

const CoinSelector: React.FC<TProps> = ({ dismissiModal, actionType }) => {
  const { values, setFieldValue } = useFormikContext<ISwapSettings>();
  const tokenList = useSelector(getTokenList);
  const commonCoins = tokenList.filter((token) => {
    return ['APT', 'WBTC', 'WETH', 'USDT', 'USDC'].includes(token.symbol);
  });
  const [searchPattern, setSearchPattern] = useState<string>('');
  const { hippoWallet } = useHippoClient();
  const [tokenListBalance, setTokenListBalance] = useState<TokenBalance[]>();

  const [filter, setFilter] = useState<Filter>('All');
  const filterTitles: Filter[] = useMemo(
    () => ['All', 'Native', 'LayerZero', 'Wormhole', 'Celer'],
    []
  );

  const onSelectToken = useCallback(
    (token: TokenInfo) => {
      const otherActionType: TProps['actionType'] =
        actionType === 'currencyFrom' ? 'currencyTo' : 'currencyFrom';
      if (token.symbol === values[otherActionType]?.token?.symbol) {
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
    let tokenListFiltered = tokenList;
    if (searchPattern) {
      tokenListFiltered = tokenListFiltered?.filter((token) => {
        const keysForFilter = [token.name, token.symbol].join(',').toLowerCase();
        return keysForFilter.includes(searchPattern);
      });
    }
    if (filter !== 'All') {
      tokenListFiltered = tokenListFiltered?.filter((token) => {
        const nonNatives: Filter[] = ['LayerZero', 'Wormhole', 'Celer'];
        if (nonNatives.includes(filter)) {
          return new RegExp(filter, 'i').test(token.name);
        } else {
          return !new RegExp(nonNatives.join('|'), 'i').test(token.name);
        }
      });
    }

    const tokenListMapped = tokenListFiltered
      ?.sort((a, b) => (a.symbol <= b.symbol ? -1 : 1))
      .map((t) => {
        const tokenStore = hippoWallet?.symbolToCoinStore[t.symbol];
        const balance = !hippoWallet
          ? -1
          : tokenStore
          ? tokenStore.coin.value.toJsNumber() / Math.pow(10, t.decimals)
          : 0;
        return {
          token: t,
          balance
        };
      })
      .sort((a, b) => b.balance - a.balance); // TODO: sort by values

    setTokenListBalance(tokenListMapped);
  }, [tokenList, searchPattern, filter, hippoWallet]);

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
              key={`common-coin-${coin.symbol}`}
              onClickToken={() => onSelectToken(coin)}
            />
          ))}
        </div>
        <input
          className="bg-field py-4 px-6 body-bold text-grey-900 rounded-xl focus:outline-none border-none"
          value={searchPattern}
          onChange={(e) => setSearchPattern(e.target.value.toLowerCase())}
          placeholder="Search"
        />
      </div>
    );
  }, [searchPattern, onSelectToken, commonCoins]);

  const listRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(0);

  useEffect(() => {
    if (listRef.current?.offsetHeight) setListHeight(listRef.current?.offsetHeight ?? 0);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  const filters = useMemo(() => {
    return (
      <div className="flex gap-x-0">
        {filterTitles.map((f) => (
          <div
            key={f}
            className={classNames(
              'body-bold px-2 py-2 flex-grow text-center cursor-pointer rounded-full text-grey-500 hover:text-grey-700',
              {
                'bg-field !text-grey-900': f === filter
              }
            )}
            onClick={() => setFilter(f)}>
            {f}
          </div>
        ))}
      </div>
    );
  }, [filter, filterTitles]);

  const renderTokenList = useMemo(() => {
    return (
      <div className="flex flex-col gap-2 mt-4 flex-grow min-h-0">
        {/* filters */}
        <div className="flex justify-between">
          <div className="text-grey-500 label-large-bold">Token</div>
          <div className="text-grey-500 label-large-bold">{hippoWallet ? 'Balance' : ''}</div>
        </div>
        <div className="h-auto flex-grow min-h-0" ref={listRef}>
          {tokenListBalance && (
            <List
              className="overflow-y-scroll no-scrollbar border-0 h-full"
              rowKey={(item) => `list-row-${(item as TokenInfo).symbol}`}>
              <VirtualList
                data={tokenListBalance || []}
                height={listHeight}
                itemHeight={73}
                itemKey={(item) => `list-item-${item.token.symbol}`}>
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
