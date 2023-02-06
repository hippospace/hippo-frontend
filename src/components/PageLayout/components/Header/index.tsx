import { Antd, WalletConnector } from 'components';
import { Link, useNavigate } from 'react-router-dom';
import { routes, TRoute } from 'App.routes';
import LogoIcon from 'components/LogoIcon';
import cx from 'classnames';
import styles from './Header.module.scss';
import useCurrentPage from 'hooks/useCurrentPage';
import classNames from 'classnames';
import { CloseIcon, MenuIcon, SettingIcon } from 'resources/icons';
import { Drawer, Popover } from 'antd';
import { useCallback, useState } from 'react';
import Button from 'components/Button';
import { useSelector } from 'react-redux';
import { getIsResourcesNotFound } from 'modules/common/reducer';
import Settings from 'components/Settings';
import BridgeIcon from 'resources/img/bridges/bridge-3x.png';
import AptosBridgeIcon from 'resources/img/bridges/AptosBridge-3x.png';
import CBridgeIcon from 'resources/img/bridges/CBridge-3x.png';
import PortalBridgeIcon from 'resources/img/bridges/PortalBridge.jpeg';
import BridgesMenu, { IBridgeItemProps } from 'components/BridgesMenu';

const { Header } = Antd.Layout;
/*
const SiteBadge = () => {
  return (
    <div className="bg-[#fe6e65] w-[300px] text-white text-center font-bold body-bold h-[44px] leading-[44px] rotate-45 translate-x-[140px] tablet:translate-x-[113px] mobile:scale-[0.6] mobile:pl-[72px]">
      <img src={GithubIcon} className="w-6 inline-block" /> Mainnet Deploying
    </div>
  );
};
*/

interface ISideMenuProps {
  currentPageName: TRoute['name'];
  onRouteSelected: () => void;
}

const bridges: IBridgeItemProps[] = [
  {
    name: 'LayerZero',
    iconSrc: AptosBridgeIcon,
    url: 'https://theaptosbridge.com/bridge'
  },
  {
    name: 'Celer',
    iconSrc: CBridgeIcon,
    url: 'https://cbridge.celer.network/1/12360001/USDC'
  },
  {
    name: 'Wormhole',
    iconSrc: PortalBridgeIcon,
    url: 'https://www.portalbridge.com/#/transfer'
  }
];

const SideMenu = ({ currentPageName, onRouteSelected }: ISideMenuProps) => {
  const navigate = useNavigate();
  const onRoute = useCallback(
    (path: string | undefined) => {
      navigate(path || '/');
      onRouteSelected();
    },
    [navigate, onRouteSelected]
  );
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isBridgesVisible, setIsBridgesVisible] = useState(false);

  const openSettings = useCallback(() => {
    onRouteSelected();
    setIsSettingsVisible(true);
  }, [onRouteSelected]);

  const openBridges = useCallback(() => {
    setIsBridgesVisible(true);
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="w-full space-y-4">
        <Button
          className={classNames('w-full', { 'hip-btn-selected': currentPageName === 'Home' })}
          variant={'outlined'}
          onClick={() => onRoute('/home')}>
          Home
        </Button>
        {routes
          .filter((r) => r.path !== '*' && !r.hidden)
          .map(({ name, path }, index) => {
            const isCurrent = currentPageName === name;
            return (
              <Button
                key={`${name}-${index}-${isCurrent}`}
                className={classNames('w-full', { 'hip-btn-selected': isCurrent })}
                variant={'outlined'}
                onClick={() => onRoute(path)}>
                {name}
              </Button>
            );
          })}
      </div>
      <div className="mt-auto body-bold w-full">
        <Button className="w-full" variant="plain" size="medium" onClick={openBridges}>
          <img src={BridgeIcon} className="w-6 h-6 mr-2" />
          Bridge
        </Button>
      </div>
      <div className="mt-4 body-bold w-full">
        <Button className="w-full" variant="plain" size="medium" onClick={openSettings}>
          <SettingIcon className="font-icon mr-2" />
          Settings
        </Button>
      </div>
      <div className="mt-4 subtitle-regular text-grey-500">V {process.env.REACT_APP_VERSION}</div>
      <Drawer
        title={'Settings'}
        closeIcon={<CloseIcon className="font-icon h5 text-grey-500" />}
        width={'80vw'}
        placement={'left'}
        visible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}>
        <Settings />
      </Drawer>
      <Drawer
        title={'Bridge'}
        closeIcon={<CloseIcon className="font-icon h5 text-grey-500" />}
        width={'50vw'}
        placement={'left'}
        visible={isBridgesVisible}
        onClose={() => setIsBridgesVisible(false)}>
        <BridgesMenu bridges={bridges} />
      </Drawer>
    </div>
  );
};

const PageHeader: React.FC = () => {
  const [currentPageName] = useCurrentPage();
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const isResourcesNotFound = useSelector(getIsResourcesNotFound);

  const renderNavItems = useCallback(() => {
    return routes.map(({ name, path, hidden, type }) => {
      if (path === '*' || hidden) return null;
      return (
        <Antd.Menu.Item key={name}>
          {(type === 'Page' || !type) && (
            <Link to={path || '/'} className="h6 font-bold">
              {name}
            </Link>
          )}
        </Antd.Menu.Item>
      );
    });
  }, []);

  return (
    <Header
      className={classNames(
        'z-20 w-full px-16 py-8 bg-transparent h-[140px] tablet:px-8 mobile:px-4 mobile:py-2 mobile:h-[56px]'
      )}>
      <div className="mx-auto h-full top-0 left-0 flex items-center relative">
        <MenuIcon
          className="!hidden font-icon h5 text-grey-900 mr-4 tablet:!inline-block"
          onClick={() => setIsSideMenuOpen(true)}
        />
        <div
          className={classNames(
            'h-full absolute left-0 top-0 tablet:left-1/2 tablet:-translate-x-1/2'
          )}>
          <Link
            to="/home"
            className={classNames('h-full flex items-center justify-center', {
              'tablet:hidden': currentPageName !== 'Home'
            })}>
            <LogoIcon className="w-auto h-[48px] mobile:h-full tablet:block" />
          </Link>
          <div
            className={classNames('hidden h6 h-full text-grey-900', {
              'tablet:flex tablet:items-center': currentPageName !== 'Home'
            })}>
            {currentPageName}
          </div>
        </div>
        <div className="grow items-center justify-center h-full">
          <Antd.Menu
            mode="horizontal"
            theme="dark"
            className={cx(
              styles.menu,
              'flex justify-center h-full min-w-[200px] w-full !bg-transparent tablet:hidden'
            )}
            selectedKeys={[currentPageName]}>
            {!isResourcesNotFound && renderNavItems()}
          </Antd.Menu>
        </div>
        <div className="absolute right-0 top-0 h-full w-fit flex items-center gap-x-2">
          {currentPageName !== 'Home' && (
            <>
              <Popover
                className="tablet:hidden"
                content={<BridgesMenu bridges={bridges} />}
                placement="bottomRight"
                trigger="click">
                <Button size="small" variant="plain" className="!p-3 w-[144px]">
                  <div className="text-prime-700 dark:text-prime-400 body-bold flex items-center">
                    <img src={BridgeIcon} className="w-6 h-6 mr-1" />
                    Bridge
                  </div>
                </Button>
              </Popover>
              <Popover
                className="tablet:hidden"
                content={<Settings />}
                placement="bottomRight"
                trigger="click">
                <Button size="small" variant="plain" className="!p-3">
                  <SettingIcon className="font-icon h6 text-grey-900" />
                </Button>
              </Popover>
              <WalletConnector />
            </>
          )}
          {/* currentPageName === 'Home' && <SiteBadge /> */}
        </div>
      </div>
      <Drawer
        visible={isSideMenuOpen}
        placement="left"
        closeIcon={<CloseIcon className="font-icon h5 text-grey-500" />}
        width="70%"
        onClose={() => setIsSideMenuOpen(false)}>
        {!isResourcesNotFound && (
          <SideMenu
            currentPageName={currentPageName}
            onRouteSelected={() => setIsSideMenuOpen(false)}
          />
        )}
      </Drawer>
    </Header>
  );
};

export default PageHeader;
