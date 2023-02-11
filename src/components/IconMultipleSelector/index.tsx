import { Drawer } from 'antd';
import classNames from 'classnames';
import Card from 'components/Card';
import { useBreakpoint } from 'hooks/useBreakpoint';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CaretIcon, CheckIcon } from 'resources/icons';

export interface IFilterOption {
  icon: ReactNode;
  name: ReactNode;
  key: string;
}

export const IconMultipleSelector = ({
  title,
  className,
  options,
  isAllOptionEnabled = true,
  defaultSelected = [],
  onSelectedUpdate
}: {
  title: string;
  className?: string;
  options: IFilterOption[];
  defaultSelected?: string[];
  isAllOptionEnabled?: boolean;
  onSelectedUpdate: (selected: string[]) => void;
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultSelected));
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const onOptionClicked = useCallback(
    (key: string) => {
      if (selected.has(key)) selected.delete(key);
      else selected.add(key);
      setSelected(new Set(selected));
    },
    [selected]
  );
  useEffect(() => {
    onSelectedUpdate(Array.from(selected));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const isCardClicked = useRef(false);

  const docuClickCallback = useCallback(() => {
    if (!isCardClicked.current) {
      setIsPopupVisible(false);
    } else {
      isCardClicked.current = false;
    }
  }, []);

  useEffect(() => {
    document.addEventListener('click', docuClickCallback);
    return () => {
      document.removeEventListener('click', docuClickCallback);
    };
  }, [docuClickCallback]);

  const isAllSelected = options.map((o) => o.key).every((k) => selected.has(k));
  const onAllClicked = useCallback(() => {
    if (isAllSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(options.map((o) => o.key)));
    }
  }, [isAllSelected, options]);

  const content = useMemo(() => {
    return (
      <div className="p-2 w-64 tablet:w-full space-y-1 rounded-xxl">
        {isAllOptionEnabled && (
          <div
            onClick={onAllClicked}
            className={classNames(
              'flex items-center rounded-xxl py-1 px-2 h-9 cursor-pointer hover:bg-prime-100',
              {
                'bg-prime-100': isAllSelected
              }
            )}>
            All
            <div className="ml-auto">{isAllSelected && <CheckIcon />}</div>
          </div>
        )}
        {options.map((o, i) => {
          const isSelected = selected.has(o.key);
          return (
            <div
              key={i}
              onClick={() => onOptionClicked(o.key)}
              className={classNames(
                'flex w-full items-center rounded-xxl py-1 px-2 cursor-pointer hover:bg-prime-100',
                {
                  'bg-prime-100': isSelected
                }
              )}>
              <div className="w-6 h-6">{o.icon}</div>
              <div className="ml-1">{o.name}</div>
              <div className="ml-auto">{isSelected && <CheckIcon />}</div>
            </div>
          );
        })}
      </div>
    );
  }, [isAllOptionEnabled, isAllSelected, onAllClicked, onOptionClicked, options, selected]);

  const selectedContainerRef = useRef<HTMLDivElement>(null);
  const [iconsPositions, setIconsPositions] = useState(Infinity);
  useEffect(() => {
    if (selectedContainerRef.current && selectedContainerRef.current.offsetWidth) {
      setIconsPositions(Math.floor((selectedContainerRef.current.offsetWidth + 8) / 32));
    }
  }, []);

  let selectedArray = Array.from(selected);
  let moreIcons = 0;
  if (selectedArray.length > iconsPositions) {
    moreIcons = selectedArray.length - iconsPositions + 1;
    selectedArray = selectedArray.slice(0, iconsPositions - 1);
  }

  const { isTablet } = useBreakpoint('tablet');

  return (
    <div
      className={classNames(
        'bg-surface rounded-full relative body-bold text-grey-700 shadow-main cursor-pointer',
        className
      )}>
      <div
        className="flex items-center h-10 pl-4 pr-2"
        onClick={() => {
          if (!isPopupVisible) {
            setIsPopupVisible(true);
            isCardClicked.current = true;
          } else {
            setIsPopupVisible(false);
          }
        }}>
        <span className="mr-2 pre">{title}</span>
        <div className="flex flex-1 items-start gap-x-2 flex-wrap" ref={selectedContainerRef}>
          {selectedArray.map((s, i) => (
            <span key={i} className="w-6 h-6">
              {options.find((o) => o.key === s)?.icon}
            </span>
          ))}
          {moreIcons > 0 && (
            <span className="w-6 h-6 rounded-full bg-prime-100 text-prime-700 flex items-center justify-center label-small-regular">
              +{moreIcons}
            </span>
          )}
        </div>
        <span className="ml-auto cursor-pointer w-6 h-6 flex items-center justify-center">
          <CaretIcon className="font-icon text-grey-300 label-small-thin" />
        </span>
      </div>
      {!isTablet && isPopupVisible && (
        <div onClick={() => (isCardClicked.current = true)}>
          <Card className="hip-filter-popup absolute z-50 top-[52px] left-0 shadow-subTitle max-h-[400px] overflow-auto scrollbar">
            {content}
          </Card>
        </div>
      )}
      {isTablet && (
        <Drawer
          closable={false}
          title={`Select ${title}`}
          height={'80vh'}
          placement={'bottom'}
          onClose={() => setIsPopupVisible(false)}
          visible={isPopupVisible}>
          <div onClick={() => (isCardClicked.current = true)}>{content}</div>
        </Drawer>
      )}
    </div>
  );
};

export default IconMultipleSelector;
