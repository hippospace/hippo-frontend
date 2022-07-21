import { FC } from 'react';
import HomeSpace from 'resources/img/home-space.png';
import HomeTrade from 'resources/img/home-trade.png';
import HomeDev from 'resources/img/home-developer.png';
import HomeMoveToTs from 'resources/img/home-move-to-ts.png';
import HomeWalletInfra from 'resources/img/home-wallet-infra.png';
import HomeProactive from 'resources/img/home-proactive.png';
import HomeBlogPoster1 from 'resources/img/home-blog-poster-1.png';
import HomeBlogPoster2 from 'resources/img/home-blog-poster-2.png';
import BlogsAccessArrow from 'resources/icons/blogsAccessArrow.svg';
import Button from 'components/Button';

interface HomeBlogProps {
  posterSrc: string;
  title: string;
  summary: string;
  url: string;
}

const HomeBlog: FC<HomeBlogProps> = ({ posterSrc, title, summary, url }) => {
  return (
    <div className="home-blog text-left px-6 py-5 border-4 border-solid border-primary shadow-figma">
      <div className="w-[433px]">
        <img src={posterSrc} className="w-full h-[159px] object-cover" />
        <div className="heading-5 mb-2 mt-4 w-full truncate">{title}</div>
        <div className="flex items-end justify-between  min-h-[88px]">
          <div className="subtitle-1-semibold max-w-[323px] line-clamp-4">{summary}</div>
          <Button
            variant="icon"
            onClick={() => {
              window.open(url, '_blank');
            }}>
            <img src={BlogsAccessArrow} className="w-14 h-14" />
          </Button>
        </div>
      </div>
    </div>
  );
};

interface HomeIllustrationProps {
  label: string;
  imageSrc: string;
}

const HomeIllustration: FC<HomeIllustrationProps> = ({ imageSrc, label }) => {
  return (
    <div className="home-illu">
      <div>
        <img src={imageSrc} className="w-[220px] mx-auto" />
      </div>
      <div className="font-bold text-2xl leading-7 mt-6 max-w-[296px]">{label}</div>
    </div>
  );
};

const Home = () => {
  const aboutIllus: HomeIllustrationProps[] = [
    {
      label: 'SPACE',
      imageSrc: HomeSpace
    },
    {
      label: 'TRADE',
      imageSrc: HomeTrade
    },
    {
      label: 'DEVELOPERS',
      imageSrc: HomeDev
    }
  ];
  const offeringIllus: HomeIllustrationProps[] = [
    {
      label: 'Move to Typescript Transpiler',
      imageSrc: HomeMoveToTs
    },
    {
      label: 'Wallet Infrastructure',
      imageSrc: HomeWalletInfra
    },
    {
      label: 'Proactive Liquidity with Concentrated Liquidity Pools',
      imageSrc: HomeProactive
    }
  ];
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
      title: 'Title placeholder 2',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam iaculis pretium ultrices. Pellentesque habitant morbi tristique senectus et netus et...',
      url: ''
    }
  ];
  return (
    <div className="hippo-home text-center mx-auto  max-w-screen-2xl">
      <div className="hippo-home__about mb-56">
        <div className="heading-5 mb-12">About Hippo</div>
        <div className="font-bold text-[80px] leading-[96px] mb-24">
          We are the aggregation layer for Aptos DeFi & Open Source Development
        </div>
        <div className="flex justify-center space-x-36">
          {aboutIllus.map((ilu, index) => (
            <HomeIllustration {...ilu} key={`illu-${index}`} />
          ))}
        </div>
      </div>
      <div className="hippo-home__offerings mb-56">
        <div className="heading-5 mb-12">Our Offerings</div>
        <div className="heading-1 mb-24 max-w-[1108px] mx-auto">
          We’ve built the following open source tooling and Defi Infrastructure:
        </div>
        <div className="flex justify-center space-x-36">
          {offeringIllus.map((ilu, index) => (
            <HomeIllustration {...ilu} key={`illu-${index}`} />
          ))}
        </div>
      </div>
      <div className="hippo-home__blogs">
        <div className="heading-5 mb-12">Blogs</div>
        <div className="flex space-x-40 justify-center">
          {blogs.map((bl, index) => (
            <HomeBlog key={`k-${index}`} {...bl} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
