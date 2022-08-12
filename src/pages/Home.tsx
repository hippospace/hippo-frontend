import { FC } from 'react';
import HomeBlogPoster1 from 'resources/img/home/home-blog-poster-1.png';
import HomeBlogPoster2 from 'resources/img/home/home-blog-poster-2.png';
import BlogsAccessArrow from 'resources/icons/blogsAccessArrow.svg';
import Button from 'components/Button';
import IlluUsers from 'resources/img/illu-users-2x.png';
import DevsIllu from 'resources/img/illu-devs-2x.png';

interface HomeBlogProps {
  posterSrc: string;
  title: string;
  summary: string;
  url: string;
}

const HomeBlog: FC<HomeBlogProps> = ({ posterSrc, title, summary, url }) => {
  return (
    <div className="flex-1 max-w-[380px] text-left px-6 py-5 border-4 border-solid border-primary shadow-figma">
      <div className="w-full aspect-w-16 aspect-h-9">
        <img src={posterSrc} className="w-full object-cover" />
      </div>
      {/* line-clamp will automatically truncate the text as boxes shrink but 'truncate' won't */}
      <div className="h5 mb-2 mt-4 w-full line-clamp-1 mobile:title bold">{title}</div>
      <div className="flex items-end justify-between  min-h-[88px]">
        <div className="title w-full line-clamp-4 mr-2 mobile:paragraph">{summary}</div>
        <Button
          variant="icon"
          onClick={() => {
            window.open(url, '_blank');
          }}>
          <img src={BlogsAccessArrow} className="w-14 h-14" />
        </Button>
      </div>
    </div>
  );
};

const SubTitle = ({ children }: { children: any }) => (
  <div className="text-[64px] leading-[77px] font-bold mb-12 mobile:h6 mobile:mb-6">{children}</div>
);

const Home = () => {
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
    <div className="hippo-home text-center mx-auto">
      <div className="flex flex-col items-center space-y-12">
        <div className="text-[96px] leading-[115px] font-bold max-w-[907px] text-gradient">
          <span className="bg-grey-900 bg-clip-text [-webkit-text-fill-color:transparent]">
            The Aggregation Mechanism on{' '}
          </span>{' '}
          <span>Aptos</span>
        </div>
        <div className="h5 font-[500] max-w-[798px]">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam nec orci ornare, iaculis
          sapien vitae, malesuada tortor. Proin euismod metus sit amet mi feugiat, quis rhoncus ex
          varius.
        </div>
        <div>
          <Button className="w-[320px]" variant="gradient">
            TRY SWAP
          </Button>
        </div>
      </div>
      <div className="space-y-16 mt-[162px] mb-[72px]">
        <div className="h-[728px] flex items-center justify-between bg-home2 shadow-home rounded-xxl w-full px-[110px] translate-x-[72px]">
          <div className="mr-12 space-y-12 text-left">
            <div className="text-[72px] leading-[86px] font-bold text-gradient-secondary">
              For Users
            </div>
            <div className="h5 font-[500] max-w-[749px]">
              The liquidity infrastructure on Aptos to give users access to best trading rates
              across all Aptos DEXs. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam
              nec orci ornare, iaculis sapien vitae, Lorem ipsum dolor.
            </div>
            <div>
              <Button variant="outlined">Placeholder</Button>
            </div>
          </div>
          <div className="my-4 h-full">
            <img src={IlluUsers} className="h-full w-auto object-contain" />
          </div>
        </div>
        <div className="h-[728px] flex items-center justify-between bg-home2 shadow-home rounded-xxl w-full px-[110px] -translate-x-[72px]">
          <div className="my-4 h-full">
            <img src={DevsIllu} className="h-full w-auto object-contain" />
          </div>
          <div className="mr-12 space-y-12 text-left">
            <div className="text-[72px] leading-[86px] font-bold text-gradient-secondary">
              For Developers
            </div>
            <div className="h5 font-[500] max-w-[749px]">
              Tools at the SDK, compiler, and language level to streamline development process and
              maximise developer productivity. Lorem ipsum dolor sit amet, consectetur adipiscing
              elit. Nullam nec orci ornare, iaculis sapien vitae, Lorem ipsum dolor.
            </div>
            <div>
              <Button variant="outlined">Placeholder</Button>
            </div>
          </div>
        </div>
      </div>
      <div className="hippo-home__blogs">
        <SubTitle>Blogs</SubTitle>
        <div className="flex justify-center items-center gap-x-16 tablet:flex-col tablet:gap-y-8">
          {blogs.map((bl, index) => (
            <HomeBlog {...bl} key={`k-${index}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
