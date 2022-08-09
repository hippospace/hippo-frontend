import LogoImg from 'resources/img/hippo-logo.png';
import cx from 'classnames';

interface TProps {
  className: string;
}

const LogoIcon: React.FC<TProps> = ({ className }) => {
  return <img src={LogoImg} alt="hippo logo" className={cx('h-full', className)} />;
};

export default LogoIcon;
