import { Antd } from 'components';
import { useRef } from 'react';
import { Footer, Header } from './components';
import useCurrentPage from 'hooks/useCurrentPage';
import classNames from 'classnames';
import SwapIllu from 'resources/img/swap-illu.png';
import { TRoute } from 'App.routes';
// import styles from './PageLayout.module.scss';

const { Content } = Antd.Layout;

const PageLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentPageName] = useCurrentPage();

  return (
    <Antd.Layout
      className={classNames(
        'relative min-h-screen bg-white overflow-hidden bg-primeLight dark:bg-primeDark dark:bg-none'
      )}>
      {(['Swap', 'Faucet'] as TRoute['name'][]).includes(currentPageName) && (
        <>
          <img src={SwapIllu} className="absolute top-0 left-0 mx-auto w-full" />
        </>
      )}
      <Header />
      <Content className={classNames('relative px-16 tablet:px-8 mobile:px-4 mobile:pt-[56px]')}>
        <div ref={containerRef} className="relative z-10">
          {children}
        </div>
      </Content>
      <Footer />
    </Antd.Layout>
  );
};

export default PageLayout;
