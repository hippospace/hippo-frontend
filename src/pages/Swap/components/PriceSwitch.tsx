import classNames from 'classnames';
import { useIsDarkMode } from 'components/Settings';
import { useCallback, useEffect, useState } from 'react';
import { PriceChartIcon } from 'resources/icons';

const PriceSwitch = ({
  className = '',
  isStateOn = false,
  onUpdate = () => {}
}: {
  className?: string;
  isStateOn: boolean;
  onUpdate: (isStateOn: boolean) => void;
}) => {
  const [isOn, setIsOn] = useState(isStateOn);
  useEffect(() => {
    setIsOn(isStateOn);
  }, [isStateOn]);
  const onClickInternal = useCallback(() => {
    setIsOn(!isOn);
    onUpdate(!isOn);
  }, [isOn, onUpdate]);
  const isDark = useIsDarkMode();

  return (
    <div
      className={classNames(
        'cursor-pointer w-8 h-8 rounded-full shadow-subTitle flex items-center justify-center active:scale-95',
        { [isDark ? 'bg-prime-400' : 'bg-prime-700']: isOn },
        { 'bg-surface': !isOn },
        className
      )}
      onClick={onClickInternal}>
      <PriceChartIcon
        className={classNames(
          'font-icon',
          { [isDark ? 'text-prime-400' : 'text-prime-700']: !isOn },
          { 'text-white': isOn }
        )}
      />
    </div>
  );
};

export default PriceSwitch;
