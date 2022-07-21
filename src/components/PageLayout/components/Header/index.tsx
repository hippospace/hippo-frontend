import { Antd, WalletConnector } from 'components';
import { Link } from 'react-router-dom';
import { routes } from 'App.routes';
import LogoIcon from 'components/LogoIcon';
import cx from 'classnames';
import styles from './Header.module.scss';
import useCurrentPage from 'hooks/useCurrentPage';
import { useScrollYPosition } from 'react-use-scroll-position';
import classNames from 'classnames';
import GithubIcon from 'resources/icons/GitHub-Mark-Light-120px-plus.png';

const { Header } = Antd.Layout;

const SiteBadge = () => {
  return (
    <div className={styles.siteBadge}>
      <img src={GithubIcon} className="w-6 inline-block" /> Coming soon
    </div>
  );
};

const PageHeader: React.FC = () => {
  const [currentPageName] = useCurrentPage();

  const renderNavItems = () => {
    return routes.map(({ name, path, hidden }) => {
      if (path === '*' || hidden) return null;
      // if (path && isDisabledFeature(path))
      //   return (
      //     <Antd.Menu.Item key={name} className={styles.disabledItem}>
      //       {name}
      //     </Antd.Menu.Item>
      //   );

      return (
        <Antd.Menu.Item key={name} className="">
          <Link to={path || '/'} className="header5 bold">
            {name}
          </Link>
        </Antd.Menu.Item>
      );
    });
  };

  const scrollY = useScrollYPosition();

  return (
    <Header
      className={classNames('fixed z-20 w-full px-16 pt-12 pb-8 bg-transparent h-auto', {
        [styles.blur]: scrollY > 64
      })}>
      <div className="mx-auto h-[72px] top-0 left-0 flex items-center">
        <div className="grow h-full">
          <Link
            to="/"
            className="w-[72px] h-full bg-secondary flex items-center justify-center rounded-xl">
            <LogoIcon className="w-full h-full" />
          </Link>
        </div>
        <div className="flex grow items-center h-full ml-[180px]">
          <Antd.Menu
            mode="horizontal"
            theme="dark"
            className={cx(styles.menu, 'h-full min-w-[200px] w-full !bg-transparent')}
            selectedKeys={[currentPageName]}>
            {renderNavItems()}
          </Antd.Menu>
        </div>
        {currentPageName !== 'Home' && <WalletConnector />}
        {currentPageName === 'Home' && <SiteBadge />}
        <div />
      </div>
    </Header>
  );
};

export default PageHeader;
