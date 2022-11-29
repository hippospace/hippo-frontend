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
import { ReactNode, useCallback, useState } from 'react';
import Button from 'components/Button';
import { useSelector } from 'react-redux';
import { getIsResourcesNotFound } from 'modules/common/reducer';
import Settings from 'components/Settings';
import TextLink from 'components/TextLink';

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

const DropDownLink = ({ children, href }: { children: ReactNode; href: string }) => {
  return (
    <TextLink href={href} className="block h6 no-underline">
      {children}
    </TextLink>
  );
};

const BridgesMenu = () => {
  return (
    <div className="flex flex-col gap-y-2 p-y-4">
      <DropDownLink href="https://theaptosbridge.com/bridge">LayerZero</DropDownLink>
      <DropDownLink href="https://www.portalbridge.com/#/transfer">Wormhole</DropDownLink>
    </div>
  );
};

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
        {routes
          .filter((r) => r.path !== '*' && !r.hidden)
          .map(({ name, path, type }, index) => {
            const isCurrent = currentPageName === name;
            return (
              <Button
                key={`${name}-${index}-${isCurrent}`}
                className={classNames('w-full', { 'hip-btn-selected': isCurrent })}
                variant={'outlined'}
                onClick={() =>
                  type === 'Button' && name === 'Bridge' ? openBridges() : onRoute(path)
                }>
                {name}
              </Button>
            );
          })}
      </div>
      <div className="mt-auto body-bold w-full">
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
        <BridgesMenu />
      </Drawer>
    </div>
  );
};

const PageHeader: React.FC = () => {
  const [currentPageName] = useCurrentPage();
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const isResourcesNotFound = useSelector(getIsResourcesNotFound);

  const [isBridegMenuOpen, setIsBridgeMenuOpen] = useState(false);

  const renderNavItems = useCallback(() => {
    return routes.map(({ name, path, hidden, type }) => {
      if (path === '*' || hidden) return null;
      return (
        <Antd.Menu.Item key={name}>
          {type === 'Button' && (
            <Popover
              trigger="click"
              visible={isBridegMenuOpen}
              onVisibleChange={(visible) => setIsBridgeMenuOpen(visible)}
              content={<BridgesMenu />}
              placement="bottomLeft">
              <a className="h6 text-grey-500 font-bold">{name}</a>
            </Popover>
          )}
          {(type === 'Page' || !type) && (
            <Link to={path || '/'} className="h6 font-bold">
              {name}
            </Link>
          )}
        </Antd.Menu.Item>
      );
    });
  }, [isBridegMenuOpen]);

  return (
    <Header
      className={classNames(
        'z-20 w-full px-16 py-8 bg-transparent h-[140px] tablet:px-8 mobile:px-4 mobile:py-2 mobile:h-[56px]'
      )}>
      <div className="mx-auto h-full top-0 left-0 flex items-center relative">
        <MenuIcon
          className="!hidden font-icon h5 text-grey-900 mr-4 mobile:!inline-block"
          onClick={() => setIsSideMenuOpen(true)}
        />
        <div
          className={classNames(
            'h-full absolute left-0 top-0 mobile:left-1/2 mobile:-translate-x-1/2'
          )}>
          <Link
            to="/"
            className={classNames('h-full flex items-center justify-center', {
              'mobile:hidden': currentPageName !== 'Home'
            })}>
            <LogoIcon className="w-auto h-[48px] mobile:h-full tablet:hidden mobile:block" />
            <LogoIcon
              className="w-auto h-[48px] mobile:h-full hidden tablet:block mobile:hidden"
              hasLabel={false}
            />
          </Link>
          <div
            className={classNames('hidden h6 h-full text-grey-900', {
              'mobile:flex mobile:items-center': currentPageName !== 'Home'
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
              'flex justify-center h-full min-w-[200px] w-full !bg-transparent mobile:hidden'
            )}
            selectedKeys={[currentPageName]}>
            {!isResourcesNotFound && renderNavItems()}
          </Antd.Menu>
        </div>
        <div className="absolute right-0 top-0 h-full w-fit flex items-center">
          {currentPageName !== 'Home' && (
            <Popover
              className="mobile:!hidden"
              content={<Settings />}
              placement="bottomRight"
              trigger="click">
              <Button size="small" variant="plain" className="!p-3 mr-1">
                <SettingIcon className="font-icon h6 text-grey-900" />
              </Button>
            </Popover>
          )}
          {currentPageName !== 'Home' && <WalletConnector />}
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
