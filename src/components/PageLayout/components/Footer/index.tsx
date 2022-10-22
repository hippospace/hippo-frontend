import { Antd } from 'components';

import { DiscordIcon, GithubIcon, DocsIcon, MediumIcon, TwitterIcon } from 'resources/icons';

const { Footer } = Antd.Layout;

const URLs = {
  discord: 'https://discord.gg/f7qFxfJWMX',
  github: 'https://github.com/hippospace',
  docs: 'https://hippo-labs.gitbook.io/dev/',
  medium: 'https://medium.com/@hippolabs',
  twitter: 'https://twitter.com/hippolabs__'
};

const Link = ({ href, children }: { href: string; children: any }) => {
  return (
    <a
      target="_blank"
      rel="noreferrer"
      href={href}
      className="flex items-center h6 text-grey-900 opacity-50 gap-2 hover:text-grey-900 hover:opacity-100">
      {children}
    </a>
  );
};

const Label = ({ children }: { children: any }) => {
  return <span className="mobile:hidden">{children}</span>;
};

const PageFooter: React.FC = () => {
  return (
    <Footer className="flex gap-8 items-center justify-center py-16 bg-transparent z-10">
      <Link href={URLs.discord}>
        <DiscordIcon />
        <Label>Discord</Label>
      </Link>
      <Link href={URLs.medium}>
        <MediumIcon />
        <Label>Medium</Label>
      </Link>
      <Link href={URLs.twitter}>
        <TwitterIcon />
        <Label>Twitter</Label>
      </Link>
      <Link href={URLs.github}>
        <GithubIcon />
        <Label>Github</Label>
      </Link>
      <Link href={URLs.docs}>
        <DocsIcon />
        <Label>Docs</Label>
      </Link>
    </Footer>
  );
};

export default PageFooter;
