import { Navigate, RouteObject, useRoutes } from 'react-router-dom';

import Swap from 'pages/Swap';
import Faucet from 'pages/Faucet';
import Home from 'pages/Home';
import Stats from 'pages/Stats';

export type TRoute = RouteObject & {
  name: 'Home' | 'Swap' | '404' | 'Faucet' | 'Stats' | 'Bridge' | 'Yield';
  hidden?: boolean; //to hide the visibility in header menu
  type?: 'Page' | 'Button';
};

export const routes: TRoute[] = [
  {
    path: 'home',
    name: 'Home',
    hidden: true,
    element: <Home />
  },
  {
    path: '',
    name: 'Swap',
    element: <Swap />
  },
  {
    path: 'swap/from/:fromSymbol/to/:toSymbol',
    name: 'Swap',
    hidden: true,
    element: <Swap />
  },
  {
    path: 'swap/from/:fromSymbol/amt/:fromAmount/to/:toSymbol',
    name: 'Swap',
    hidden: true,
    element: <Swap />
  },
  {
    path: 'swap/from/:fromSymbol/to/:toSymbol/amt/:toAmount',
    name: 'Swap',
    hidden: true,
    element: <Swap />
  },
  {
    path: 'faucet',
    name: 'Faucet',
    hidden: true,
    element: <Faucet />
  },
  {
    path: 'stats',
    name: 'Stats',
    element: <Stats />
  },
  {
    path: '*',
    name: '404',
    element: <Navigate replace to="/" />
  }
];

const Routes = () => {
  const activeRoutes = [...routes];
  const elements = useRoutes(activeRoutes as RouteObject[]);
  return elements;
};

export default Routes;
