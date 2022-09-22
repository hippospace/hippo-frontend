import LogoImg from 'resources/img/hippo-logo.png';
import LogoOnlyIcon from 'resources/img/hippo-icon.svg';
import cx from 'classnames';

interface TProps {
  className: string;
  hasLabel?: boolean;
}

const LogoIcon: React.FC<TProps> = ({ className, hasLabel = true }) => {
  return (
    <img
      src={hasLabel ? LogoImg : LogoOnlyIcon}
      alt="hippo logo"
      className={cx('h-full', className)}
    />
  );
};

export default LogoIcon;
