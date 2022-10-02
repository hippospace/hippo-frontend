import { Navigate, RouteObject, useLocation, useNavigate, useRoutes } from 'react-router-dom';

import Swap from 'pages/Swap';
import Faucet from 'pages/Faucet';
import Home from 'pages/Home';
import { useSelector } from 'react-redux';
import { getIsResourcesNotFound } from 'modules/common/reducer';
import Stats from 'pages/Stats';

export type TRoute = RouteObject & {
  name: 'Home' | 'Pools' | 'Swap' | '404' | 'Faucet' | 'Stats';
  hidden?: boolean; //to hide the visibility in header menu
};

export const routes: TRoute[] = [
  {
    path: '',
    name: 'Home',
    element: <Home />
  },
  {
    path: 'swap',
    name: 'Swap',
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
  const isResourcesNotFound = useSelector(getIsResourcesNotFound);
  const nav = useNavigate();
  const location = useLocation();
  if (isResourcesNotFound) {
    activeRoutes.forEach((r) => {
      if (['Swap', 'Faucet'].includes(r.name)) {
        r.hidden = true;
      }
    });
    setTimeout(() => {
      if (location.pathname !== '/') nav('/');
    });
  }

  const elements = useRoutes(activeRoutes as RouteObject[]);
  return elements;
};

export default Routes;
