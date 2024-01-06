import { List } from 'components/Antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import VirtualList from 'rc-virtual-list';
import CoinRow from './CoinRow';
import CommonCoinButton from './CommonCoinButton';
import useHippoClient from 'hooks/useHippoClient';
import { CoinListClient, RawCoinInfo } from '@manahippo/coin-list';
import { ITokenBalance } from 'types/hippo';
import classNames from 'classnames';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { CloseCircleIcon } from 'resources/icons';
import Button from 'components/Button';
import { coinBridge } from 'utils/hippo';
import { useCoingeckoPrice } from 'hooks/useCoingecko';
import { SwapContextType } from 'pages/Swap';

interface TProps {
  ctx: SwapContextType;
  actionType: 'currencyTo' | 'currencyFrom';
  // isVisible: boolean;
  dismissiModal: () => void;
}

type Filter = 'All' | 'Native' | 'LayerZero' | 'Wormhole' | 'Celer';

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

const isTokenOfFilter = (token: RawCoinInfo, filter: Filter) => {
  if (filter === 'All') return true;
  const bridgeArray = token.extensions.data.find((a) => a[0] === 'bridge');
  return bridgeArray && bridgeArray[1]?.startsWith(filter.toLowerCase());
};

const CoinSelector: React.FC<TProps> = ({ ctx, dismissiModal, actionType }) => {
  const { coinListClient, rawCoinInfos } = useHippoClient();
  const tokenList = rawCoinInfos;
  const thisIsFrom = actionType === 'currencyFrom';
  const thisCoin = thisIsFrom ? ctx.fromCoin : ctx.toCoin;
  const otherCoin = !thisIsFrom ? ctx.fromCoin : ctx.toCoin;
  const setThisCoin = thisIsFrom ? ctx.setFromCoin : ctx.setToCoin;
  const setOtherCoin = !thisIsFrom ? ctx.setFromCoin : ctx.setToCoin;

  const filter = useCoinSelectorStore((state) => state.filter);
  const setFilter = useCoinSelectorStore((state) => state.setFilter);

  const recentSelectedTokens = useCoinSelectorStore((state) => state.recentSelectedTokens);
  const addRecentSelectedToken = useCoinSelectorStore((state) => state.addRecentSelectedToken);

  const commonCoins = useMemo(
    () =>
      preSetTokens
        .map((s) => coinListClient?.getCoinInfoBySymbol(s)[0])
        .concat(...recentSelectedTokens.map((f) => coinListClient?.getCoinInfoByFullName(f))),
    [coinListClient, recentSelectedTokens]
  );

  const searchPattern = useCoinSelectorStore((state) => state.searchPattern);
  const setSearchPattern = useCoinSelectorStore((state) => state.setSearchPattern);

  const { hippoWallet } = useHippoClient();

  const filterTitles: Filter[] = useMemo(
    () => ['All', 'Native', 'LayerZero', 'Wormhole', 'Celer'],
    []
  );

  const onSelectToken = useCallback(
    (token: RawCoinInfo) => {
      if (token.unique_index === otherCoin?.unique_index) {
        setOtherCoin(thisCoin);
      }
      setThisCoin(token);
      if (coinListClient) addRecentSelectedToken(token.token_type.type, coinListClient);
      dismissiModal();
    },
    [
      addRecentSelectedToken,
      coinListClient,
      dismissiModal,
      setThisCoin,
      setOtherCoin,
      thisCoin,
      otherCoin
    ]
  );

  const tokenListBalanceNotSorted = useMemo<ITokenBalance[]>(() => {
    return tokenList.map((t) => {
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
    });
  }, [hippoWallet, tokenList]);

  const priceTokens = useMemo(
    () => tokenListBalanceNotSorted.filter((t) => t.balance > 0).map((t) => t.token),
    [tokenListBalanceNotSorted]
  );

  const [tokenPrices] = useCoingeckoPrice(priceTokens, {
    refreshInterval: 1000 * 60 * 10
  });

  const tokenListBalance = useMemo(() => {
    let tokenListFiltered = tokenListBalanceNotSorted;
    if (searchPattern) {
      tokenListFiltered = tokenListFiltered?.filter((item) => {
        const keysForFilter = [
          item.token.symbol,
          item.token.official_symbol,
          item.token.name,
          coinBridge(item.token)
        ]
          .join(',')
          .toLowerCase();
        return searchPattern.split(' ').every((s) => keysForFilter.includes(s.toLocaleLowerCase()));
      });
    }
    tokenListFiltered = tokenListFiltered?.filter((item) => isTokenOfFilter(item.token, filter));
    return tokenListFiltered
      .sort((a, b) => (a.token.symbol <= b.token.symbol ? -1 : 1))
      .sort((a, b) => {
        if (a.balance && b.balance) {
          return (
            b.balance * (tokenPrices[b.token.symbol] ?? 0) -
            a.balance * (tokenPrices[a.token.symbol] ?? 0)
          );
        } else if (a.balance === 0 || b.balance === 0) {
          return b.balance - a.balance;
        }
        return 0;
      });
  }, [filter, searchPattern, tokenListBalanceNotSorted, tokenPrices]);

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
            placeholder="Search: symbol, name, bridge"
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
              rowKey={(item) => `list-row-${(item as RawCoinInfo).symbol}`}>
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
