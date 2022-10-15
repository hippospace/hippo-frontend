import cx from 'classnames';
import { ReactNode } from 'react';

interface TProps {
  className?: string;
  href: string;
  alt?: string;
  onClick?: () => void;
  children: ReactNode | string;
}

const TextLink: React.FC<TProps> = ({ className, children, ...rest }) => {
  return (
    <a
      className={cx('text-purple-700 underline hover:underline hover:text-purple-500', className)}
      {...rest}
      target="_blank"
      rel="noreferrer">
      {children}
    </a>
  );
};

export default TextLink;
