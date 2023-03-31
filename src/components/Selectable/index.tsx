import classNames from 'classnames';
import { ReactNode } from 'react';

const Selectable = ({
  isSelected,
  className = '',
  children,
  onClick = () => {}
}: {
  isSelected: boolean;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) => {
  return (
    <div
      className={classNames(
        'rounded-full h-[40px] h6 border-[2px] border-transparent bg-field text-grey-700 cursor-pointer',
        {
          'bg-select-border bg-clip-border bg-origin-border bg-cover': isSelected
        },
        className
      )}
      onClick={onClick}>
      <div className="h-full w-full rounded-full bg-field flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default Selectable;
