import { Antd } from 'components';
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import commonAction from 'modules/common/actions';
import { Footer, Header } from './components';
import { getLayoutHeight } from 'modules/common/reducer';
import { useSelector } from 'react-redux';
import useCurrentPage from 'hooks/useCurrentPage';
import classNames from 'classnames';
import SwapIllu from 'resources/img/swap-illu.png';
import { TRoute } from 'App.routes';
// import styles from './PageLayout.module.scss';

const { Content } = Antd.Layout;

const PageLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const contentHeight = useSelector(getLayoutHeight);

  useEffect(() => {
    if (containerRef?.current && containerRef?.current?.clientHeight && !contentHeight)
      dispatch(commonAction.SET_LAYOUT_HEIGHT(containerRef?.current?.clientHeight));
  }, [containerRef, contentHeight, dispatch]);

  const [currentPageName] = useCurrentPage();

  return (
    <Antd.Layout
      className={classNames('relative min-h-screen bg-white overflow-hidden', {
        'bg-home1': currentPageName === 'Home',
        'bg-swap': currentPageName !== 'Home'
      })}>
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
