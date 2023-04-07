import cx from 'classnames';
import { ReactNode } from 'react';

const Card = ({ children, className = '' }: { children: ReactNode; className: string }) => (
  <div className={cx('bg-surface rounded-xxl shadow-main', className)}>{children}</div>
);

export default Card;
