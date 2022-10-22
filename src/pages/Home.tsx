import { FC, useCallback, useEffect, useRef, useState } from 'react';
import HomeBlogPoster1 from 'resources/img/home/home-blog-poster-1.png';
import HomeBlogPoster2 from 'resources/img/home/home-blog-poster-2.png';
import Button from 'components/Button';
import IlluUsers from 'resources/img/illu-users-2x.png';
import DevsIllu from 'resources/img/illu-devs-2x.png';
import Card from 'components/Card';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';
// import { getIsResourcesNotFound } from 'modules/common/reducer';
// import { useSelector } from 'react-redux';
// import { useScrollYPosition } from 'react-use-scroll-position';

interface HomeBlogProps {
  posterSrc: string;
  title: string;
  summary: string;
  url: string;
}

const HomeBlog: FC<HomeBlogProps> = ({ posterSrc, title, summary, url }) => {
  return (
    <Card className="flex-1 max-w-[535px] text-left px-5 pt-4 pb-10">
      <div className="w-full">
        <img src={posterSrc} className="w-full h-[146px] object-cover rounded-xxl" />
      </div>
      {/* line-clamp will automatically truncate the text as boxes shrink but 'truncate' won't */}
      <div className="h4 mb-2 mt-4 w-full text-center line-clamp-1 mobile:subtitle-regular">
        {title}
      </div>
      <div className="subtitle-semibold h-[88px] px-2 text-grey-700 opacity-50 w-full line-clamp-4 mb-9 mobile:body-semibold">
        {summary}
      </div>
      <div className="w-full">
        <Button
          variant="outlined"
          className="mx-auto w-[80%] max-w-[340px]"
          onClick={() => {
            window.open(url, '_blank');
          }}>
          Read More
        </Button>
      </div>
    </Card>
  );
};

const SubTitle = ({ children }: { children: any }) => (
  <div className="text-[64px] leading-[77px] font-bold mb-12 mobile:h4 mobile:mb-6">{children}</div>
);

const Intro = ({ children, className }: { children: any; className: string }) => {
  return (
    <div
      className={classNames(
        'h5 font-[500] leading-[29px] text-gray-700 max-w-[798px] mobile:h6 mobile:font-[500]',
        className
      )}>
      {children}
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();

  const blogs: HomeBlogProps[] = [
    {
      posterSrc: HomeBlogPoster1,
      title: 'Introducing Hippo — The Aptos Aggregation Layer',
      summary:
        'We’re not just your run-of-the-mill aggregator though; the way we work is a bit different: Hippo provides developers with tools at the compiler, SDK, and framework-level to dramatically increase their productivity. Ultimately, we provide improved product discoverability, interoperability, in aggregate by default.',
      url: 'https://medium.com/@hippolabs/introducing-hippo-the-aptos-aggregation-layer-caefc1a7fc2d'
    },
    {
      posterSrc: HomeBlogPoster2,
      title: 'Move-to-TS: A Dev Framework For Aptos',
      summary: `In Web3 development, developers often spend a lot of time writing code that connects frontends to on-chain data and contracts. For example:
        Writing transaction builders,
        Fetching and parsing on-chain data structures,
        Duplicating contract logic to frontends/bots`,
      url: 'https://medium.com/@hippolabs/move-to-ts-a-dev-framework-for-aptos-4d3ccc97c31a'
    }
  ];

  const isCardAnimationFeatureOn = true;
  // const scrollY = useScrollYPosition();

  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);

  const startPercent = 100;
  const endPercent = 5;
  const [card1TranslatePercent, setCard1TranslatePercent] = useState(startPercent);
  const [card2TranslatePercent, setCard2TranslatePercent] = useState(startPercent);

  const scrollHandler = useCallback(() => {
    setCard1TranslatePercent(
      (() => {
        let startY =
          window.innerHeight -
          (card1Ref.current?.getBoundingClientRect().y || 0) -
          (card1Ref.current?.offsetHeight || 0) * 0.2;

        // if (scrollY < 64) startY = 0;

        if (!isCardAnimationFeatureOn) return endPercent;
        if (startY <= 0) return startPercent;
        else return endPercent;
      })()
    );
    setCard2TranslatePercent(
      (() => {
        const startY =
          window.innerHeight -
          (card2Ref.current?.getBoundingClientRect().y || 0) -
          (card2Ref.current?.offsetHeight || 0) * 0.2;

        if (!isCardAnimationFeatureOn) return -1 * endPercent;
        if (startY <= 0) return -1 * startPercent;
        else return -1 * endPercent;
      })()
    );
  }, [isCardAnimationFeatureOn]);

  useEffect(() => {
    scrollHandler();
    window.addEventListener('scroll', scrollHandler);
    return () => {
      window.removeEventListener('scroll', scrollHandler);
    };
  }, [scrollHandler]);

  // const isResourcesNotFound = useSelector(getIsResourcesNotFound);

  return (
    <div className="hippo-home text-center mx-auto pt-[98px]">
      <div className="flex flex-col items-center space-y-12">
        <div className="text-[96px] leading-[115px] font-bold max-w-[930px] mobile:h3">
          <span className="text-grey-900">The Aggregation Mechanism on</span>{' '}
          <span className="text-gradient-primary">Aptos</span>
        </div>
        <Intro className="max-w-[798px]">
          Using developer tools we are creating in-house, we help Aptos developers build
          applications that are composable by default, and automatically aggregate all the liquidity
          on Aptos, so users can always trade <br className="mobile:hidden" /> with the best rates
        </Intro>
        <div>
          <Button
            className="w-[320px]"
            variant="gradient"
            disabled={false}
            onClick={() => navigate('/swap')}>
            Swap Now
          </Button>
        </div>
      </div>
      <div className="space-y-16 mt-[162px] mb-[72px]">
        <div
          ref={card1Ref}
          className="h-[728px] tablet:h-auto flex tablet:flex-col items-center justify-between bg-home2 shadow-home rounded-tl-xxl rounded-bl-xxl w-full px-[110px] translate-x-[5%] space-x-12 tablet:pl-4 tablet:pr-8 tablet:space-x-0 transition-transform duration-300"
          style={{ transform: `translateX(${card1TranslatePercent}%)` }}>
          <div className="space-y-12 text-left tablet:mt-16">
            <div className="text-[72px] leading-[86px] font-bold text-gradient-secondary mobile:h4">
              Trade Aggregation
            </div>
            <Intro className="max-w-[749px]">
              Aptos has close to a dozen DEX protocols already building on it. We aggregate
              liquidity across all of them so that users can always trade with the best rates.
            </Intro>
            <div>
              <Button
                variant="outlined"
                className="w-[260px]"
                disabled={false}
                onClick={() => navigate('/swap')}>
                Swap Now
              </Button>
            </div>
          </div>
          <div className="my-4 h-full tablet:mb-8 tablet:w-full tablet:h-auto">
            <img
              src={IlluUsers}
              className="h-full w-auto object-contain tablet:w-full tablet:h-auto"
            />
          </div>
        </div>
        <div
          ref={card2Ref}
          className="h-[728px] tablet:h-auto flex tablet:flex-col items-center justify-between bg-home2 shadow-home rounded-tr-xxl rounded-br-xxl w-full px-[110px] -translate-x-[5%] space-x-12 tablet:pr-4 tablet:pl-8 tablet:space-x-0 transition-transform duration-300"
          style={{ transform: `translateX(${card2TranslatePercent}%)` }}>
          <div className="my-4 h-full tablet:mt-8 tablet:w-full tablet:h-auto">
            <img
              src={DevsIllu}
              className="h-full w-auto object-contain tablet:w-full tablet:h-auto"
            />
          </div>
          <div className="space-y-12 text-left tablet:mb-16">
            <div className="text-[72px] leading-[86px] font-bold text-gradient-secondary mobile:h4">
              Developer Tools
            </div>
            <Intro className="max-w-[749px]">
              We are developing tools at the SDK, compiler, language and RPC/validator level to
              streamline the development and deployment process on Aptos. Try our developer SDK and
              be 10x more productive!
            </Intro>
            <div>
              <Button
                variant="outlined"
                className="w-[260px]"
                onClick={() =>
                  window.open(
                    'https://hippo-labs.gitbook.io/dev/move-to-ts/move-to-typescript-transpiler',
                    '_blank'
                  )
                }>
                Move-to-ts Docs
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="hippo-home__blogs">
        <SubTitle>Blogs</SubTitle>
        <div className="flex justify-center items-center gap-x-16 tablet:flex-col tablet:gap-y-8 tablet:gap-x-0">
          {blogs.map((bl, index) => (
            <HomeBlog {...bl} key={`k-${index}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
