import { getTokenList } from 'modules/swap/reducer';
import { useSelector } from 'react-redux';
import { IPoolToken } from 'types/pool';

const useToken = () => {
  const tokenList = useSelector(getTokenList);

  const retreiveTokenImg = (tokens: IPoolToken[]) => {
    return tokens.map((token) => {
      const existToken = tokenList.find((t) => t.symbol.str() === token.symbol);
      return existToken?.logo_url.str();
    });
  };

  return { retreiveTokenImg };
};

export default useToken;
