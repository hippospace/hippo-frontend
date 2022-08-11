import cx from 'classnames';

const Card = ({ children, className = '' }) => (
  <div className={cx('bg-secondary rounded-xxl shadow-md', className)}>{children}</div>
);

export default Card;
