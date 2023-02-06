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
import { CoinListClient, RawCoinInfo as TokenInfo } from '@manahippo/coin-list';
import { ITokenBalance } from 'types/hippo';
import classNames from 'classnames';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { CloseCircleIcon } from 'resources/icons';
import Button from 'components/Button';

interface TProps {
  actionType: 'currencyTo' | 'currencyFrom';
  // isVisible: boolean;
  dismissiModal: () => void;
}

type Filter = 'All' | 'Native' | 'LayerZero' | 'Wormhole' | 'Celer';

// interface TokenWithBalance extends ITokenInfo {
//   balance: string;
// }

const preSetTokens = ['APT', 'WBTC', 'WETH', 'USDT', 'USDC'];

interface ICoinSelectorState {
  filter: Filter;
  setFilter: (f: Filter) => void;

  searchPattern: string;
  setSearchPattern: (s: string) => void;

  recentSelectedTokens: string[];
  addRecentSelectedToken: (fullName: string, coinListCli: CoinListClient) => void;
}

const useCoinSelectorStore = create<ICoinSelectorState>()(
  devtools(
    persist(
      (set) => ({
        filter: 'All',
        setFilter: (f) => set((state) => ({ ...state, filter: f })),

        searchPattern: '',
        setSearchPattern: (s) => set((state) => ({ ...state, searchPattern: s })),

        recentSelectedTokens: [],
        addRecentSelectedToken: (fullName, coinListCli) =>
          set((state) => {
            if (
              state.recentSelectedTokens.includes(fullName) ||
              preSetTokens.includes(coinListCli.getCoinInfoByFullName(fullName)?.symbol!)
            )
              return state;
            return {
              ...state,
              recentSelectedTokens: [
                ...state.recentSelectedTokens.slice(
                  state.recentSelectedTokens.length === 5 ? 1 : 0
                ),
                fullName
              ]
            };
          })
      }),
      { name: 'hippo-coin-selector-store' }
    )
  )
);

const isTokenOfFilter = (token: TokenInfo, filter: Filter) => {
  if (filter === 'All') return true;
  const bridgeArray = token.extensions.data.find((a) => a[0] === 'bridge');
  return bridgeArray && bridgeArray[1]?.startsWith(filter.toLowerCase());
};

const CoinSelector: React.FC<TProps> = ({ dismissiModal, actionType }) => {
  const { hippoAgg } = useHippoClient();
  const { values, setFieldValue } = useFormikContext<ISwapSettings>();
  const tokenList = useSelector(getTokenList);
  // const [filter, setFilter] = useState<Filter>('All');

  const filter = useCoinSelectorStore((state) => state.filter);
  const setFilter = useCoinSelectorStore((state) => state.setFilter);

  const recentSelectedTokens = useCoinSelectorStore((state) => state.recentSelectedTokens);
  const addRecentSelectedToken = useCoinSelectorStore((state) => state.addRecentSelectedToken);

  const commonCoins = useMemo(
    () =>
      preSetTokens
        .map((s) => hippoAgg?.coinListClient.getCoinInfoBySymbol(s)[0])
        .concat(
          ...recentSelectedTokens.map((f) => hippoAgg?.coinListClient.getCoinInfoByFullName(f))
        ),
    [hippoAgg?.coinListClient, recentSelectedTokens]
  );

  // const [searchPattern, setSearchPattern] = useState<string>('');
  const searchPattern = useCoinSelectorStore((state) => state.searchPattern);
  const setSearchPattern = useCoinSelectorStore((state) => state.setSearchPattern);

  const { hippoWallet } = useHippoClient();
  const [tokenListBalance, setTokenListBalance] = useState<ITokenBalance[]>();

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
      if (hippoAgg) addRecentSelectedToken(token.token_type.type, hippoAgg.coinListClient);
      dismissiModal();
    },
    [actionType, addRecentSelectedToken, dismissiModal, hippoAgg, setFieldValue, values]
  );

  const getFilteredTokenListWithBalance = useCallback(() => {
    let tokenListFiltered = tokenList;
    if (searchPattern) {
      tokenListFiltered = tokenListFiltered?.filter((token) => {
        const keysForFilter = [token.name, token.symbol].join(',').toLowerCase();
        return keysForFilter.includes(searchPattern);
      });
    }
    tokenListFiltered = tokenListFiltered?.filter((token) => isTokenOfFilter(token, filter));

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
          {commonCoins.map(
            (coin) =>
              coin && (
                <CommonCoinButton
                  coin={coin}
                  key={`common-coin-${coin.symbol}`}
                  onClickToken={() => onSelectToken(coin)}
                />
              )
          )}
        </div>
        <div className="flex items-center bg-field p-4 rounded-xl">
          <input
            className="bg-transparent flex-grow min-w-0 body-bold text-grey-900 focus:outline-none border-none"
            value={searchPattern}
            onChange={(e) => setSearchPattern(e.target.value.toLowerCase())}
            placeholder="Search"
          />
          {searchPattern && (
            <Button variant="icon" onClick={() => setSearchPattern('')}>
              <CloseCircleIcon className="font-icon h6" />
            </Button>
          )}
        </div>
      </div>
    );
  }, [commonCoins, searchPattern, onSelectToken, setSearchPattern]);

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
  }, [filter, filterTitles, setFilter]);

  const renderTokenList = useMemo(() => {
    return (
      <div className="flex flex-col gap-2 mt-4 flex-grow min-h-0">
        {filters}
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
                itemHeight={69} // minimum height
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
  }, [filters, hippoWallet, tokenListBalance, listHeight, onSelectToken]);

  return (
    <div className="flex flex-col gap-2 h-[50vh] mobile:h-full">
      {renderHeaderSearch}
      {renderTokenList}
    </div>
  );
};

export default CoinSelector;
