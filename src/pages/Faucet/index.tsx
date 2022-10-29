/* eslint-disable @typescript-eslint/no-unused-vars */
import Card from 'components/Card';
import Button from 'components/Button';
import CoinIcon from 'components/CoinIcon';
import useAptosWallet from 'hooks/useAptosWallet';
import useHippoClient from 'hooks/useHippoClient';
import useTokenBalane from 'hooks/useTokenBalance';
import { useCallback, useMemo, useState } from 'react';
import { getTokenList } from 'modules/swap/reducer';
import { useSelector } from 'react-redux';
import { Skeleton } from 'antd';
import useTokenAmountFormatter from 'hooks/useTokenAmountFormatter';
import { RawCoinInfo as CoinInfo } from '@manahippo/coin-list';

const Balance = ({ token }: { token: CoinInfo }) => {
  const [balance, isReady] = useTokenBalane(token);
  const [tokenAmountFormatter] = useTokenAmountFormatter();
  return (
    <div className="text-grey-500 body-medium font-[600]">
      {!isReady && <Skeleton.Button active className={'!w-16 !h-5 !rounded'} />}
      {isReady && (
        <>
          {tokenAmountFormatter(balance, token)} {token.symbol}
        </>
      )}
    </div>
  );
};

const TokenCard = ({ tokenInfo }: { tokenInfo: CoinInfo }) => {
  const [loading, setLoading] = useState('');
  const { requestFaucet, hippoWallet } = useHippoClient();
  const symbol = tokenInfo.symbol;

  const onRequestFaucet = useCallback(
    async (coin: string) => {
      setLoading(coin);
      await requestFaucet(coin);
      setLoading('');
    },
    [requestFaucet]
  );

  return (
    <Card className="w-[340px] h-[200px] flex flex-col items-center justify-between p-5">
      <div className="flex items-center justify-start w-full">
        <CoinIcon logoSrc={tokenInfo.logo_url} size={64} />
        <div className="ml-4">
          <div className="h4 text-grey-900">{tokenInfo.name}</div>
          <Balance token={tokenInfo} />
        </div>
      </div>
      <Button
        variant="secondary"
        isLoading={loading === symbol}
        disabled={!hippoWallet}
        className="font-bold w-full"
        onClick={() => onRequestFaucet(symbol)}>
        Faucet
      </Button>
    </Card>
  );
};

const Faucet: React.FC = () => {
  const { activeWallet, openModal } = useAptosWallet();
  const tokenList = useSelector(getTokenList).filter((t) => t.symbol !== 'APT' && !!t.logo_url);

  const renderTokenList = useMemo(() => {
    if (!activeWallet) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh_-_416px)]">
          <Button className="shadow-main w-60" variant="gradient" onClick={openModal}>
            Connect to Wallet
          </Button>
        </div>
      );
    }
    if (tokenList.length > 0) {
      return tokenList
        .filter((tokenInfo) => tokenInfo.token_type.type.indexOf('devnet_coins') > 0)
        .map((tokenInfo) => {
          return <TokenCard key={`card-${tokenInfo.symbol}`} tokenInfo={tokenInfo} />;
        });
    }
  }, [activeWallet, tokenList, openModal]);

  return (
    <div className="mt-6 flex gap-6 justify-center flex-wrap max-w-[1500px] mx-auto">
      {renderTokenList}
    </div>
  );
};

export default Faucet;
