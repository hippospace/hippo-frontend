import LogoImg from 'resources/img/hippo-logo.png';
import LogoImgDark from 'resources/img/hippo-logo-dark.png';
import LogoOnlyIcon from 'resources/img/hippo-icon.svg';
import cx from 'classnames';
import { useIsDarkMode } from 'components/Settings';

interface TProps {
  className: string;
  hasLabel?: boolean;
}

const LogoIcon: React.FC<TProps> = ({ className, hasLabel = true }) => {
  const isDarkMode = useIsDarkMode();
  return (
    <img
      src={hasLabel ? (isDarkMode ? LogoImgDark : LogoImg) : LogoOnlyIcon}
      alt="hippo logo"
      className={cx('h-full', className)}
    />
  );
};

export default LogoIcon;
