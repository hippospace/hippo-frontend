import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import cx from 'classnames';
import styles from './Button.module.scss';

type TProps = {
  className?: string;
  children?: any;
  disabled?: boolean;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'outlined' | 'icon' | 'gradient' | 'plain';
  size?: 'large' | 'medium' | 'small';
  type?: 'button' | 'submit' | 'reset' | undefined;
  onClick?: (e: React.MouseEvent<HTMLElement>) => any;
};

const Button: React.FC<TProps> = (props) => {
  let {
    onClick = () => {},
    isLoading,
    className,
    disabled,
    children,
    variant = 'gradient',
    size = 'large',
    ...rest
  } = props;

  if (variant === 'primary') {
    variant = 'gradient';
  } else if (variant === 'secondary') {
    variant = 'outlined';
  }

  return (
    <button
      className={cx(
        styles.button,
        styles[size],
        styles[variant],
        {
          [styles.disabled]: disabled,
          [styles.loading]: isLoading
        },
        className
      )}
      onClick={onClick}
      disabled={disabled}
      {...rest}>
      {children}
      {isLoading && (
        <LoadingOutlined style={{ color: 'currentColor', fontSize: 16 }} className="ml-2" />
      )}
    </button>
  );
};

export default Button;
