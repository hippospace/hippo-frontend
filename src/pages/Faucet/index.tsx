import { TokenInfo } from '@manahippo/hippo-sdk/dist/generated/coin_registry/coin_registry';
import Card from 'components/Card';
import Button from 'components/Button';
import CoinIcon from 'components/CoinIcon';
import useAptosWallet from 'hooks/useAptosWallet';
import useHippoClient from 'hooks/useHippoClient';
import useTokenBalane from 'hooks/useTokenBalance';
import { useCallback, useMemo, useState } from 'react';

const Balance = ({ symbol }: { symbol: string }) => {
  const [balance] = useTokenBalane(symbol);
  return (
    <div className="text-grey-500 largeTextNormal font-[600]">
      {balance} {symbol}
    </div>
  );
};

const TokenCard = ({ tokenInfo }: { tokenInfo: TokenInfo }) => {
  const [loading, setLoading] = useState('');
  const { requestFaucet } = useHippoClient();
  const symbol = tokenInfo.symbol.str();

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
        <CoinIcon logoSrc={tokenInfo.logo_url.str()} className="w-16 h-16" />
        <div className="ml-4">
          <div className="h4 text-grey-900">{tokenInfo.name.str()}</div>
          <Balance symbol={symbol} />
        </div>
      </div>
      <Button
        variant="secondary"
        isLoading={loading === symbol}
        className="font-bold w-full"
        onClick={() => onRequestFaucet(symbol)}>
        Faucet
      </Button>
    </Card>
  );
};

const Faucet: React.FC = () => {
  const { activeWallet, openModal } = useAptosWallet();
  const { tokenInfos } = useHippoClient();

  const renderTokenList = useMemo(() => {
    if (!activeWallet) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh_-_416px)]">
          <Button className="shadow-main1 w-60" variant="gradient" onClick={openModal}>
            Connect to Wallet
          </Button>
        </div>
      );
    }
    if (tokenInfos) {
      return Object.keys(tokenInfos)
        .filter((symbol) => {
          return tokenInfos[symbol].token_type.moduleName().startsWith('mock_coin');
        })
        .map((symbol) => {
          const tokenInfo = tokenInfos[symbol];
          return <TokenCard key={`card-${symbol}`} tokenInfo={tokenInfo} />;
        });
    }
  }, [activeWallet, tokenInfos, openModal]);

  return (
    <div className="flex gap-6 justify-center flex-wrap max-w-[1500px] mx-auto">
      {renderTokenList}
    </div>
  );
};

export default Faucet;
