import { Drawer } from 'antd';
import classNames from 'classnames';
import Button from 'components/Button';
import Card from 'components/Card';
import { useBreakpoint } from 'hooks/useBreakpoint';
import { Fragment, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Transition } from 'react-transition-group';
import { CaretIcon, CheckIcon, CloseCircleIcon } from 'resources/icons';
import { searchTabs, YieldTokenType } from '..';

export interface IYieldTokenSelectorOption {
  type: YieldTokenType;
  icon: ReactNode;
  name: ReactNode;
  key: string;
  abbr?: ReactNode;
  sortKey: string;
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
  options: IYieldTokenSelectorOption[];
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

  const [selectedSnap, setSelectedSnap] = useState<Set<string>>(new Set());

  // Assure that selected items be sorted at the front only when the list is re-opend.
  useEffect(() => {
    if (isPopupVisible) {
      setSelectedSnap(new Set(selected));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPopupVisible]);

  const sortValue = useCallback(
    (a: IYieldTokenSelectorOption) => (selectedSnap.has(a.key) ? 0 : 1),
    [selectedSnap]
  );

  const [searchPattern, setSearchPattern] = useState('');
  const [selectedSearchTab, setSelectedSearchTab] = useState<typeof searchTabs[number]>('All');

  const content = useMemo(() => {
    return (
      <div className="p-2 w-96 h-full tablet:w-full rounded-xxl tablet:p-0">
        <div className="flex items-center bg-field p-2 rounded-xl h-9">
          <input
            className="bg-transparent flex-grow min-w-0 body-bold text-grey-900 focus:outline-none border-none"
            value={searchPattern}
            onChange={(e) => setSearchPattern(e.target.value.toLowerCase())}
            placeholder="Search: Coin, Lp, Bridge..."
          />
          {searchPattern && (
            <Button variant="icon" onClick={() => setSearchPattern('')}>
              <CloseCircleIcon className="font-icon h6" />
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between body-bold my-2 text-grey-500">
          {searchTabs.map((s, i) => {
            return (
              <div
                key={i}
                onClick={() => setSelectedSearchTab(s)}
                className={classNames('rounded-xl py-1 px-2 hover:text-grey-700', {
                  'bg-field text-grey-700': selectedSearchTab === s
                })}>
                {s}
              </div>
            );
          })}
        </div>
        <div className="overflow-auto scrollbar max-h-[calc(100%-80px)] h-full relative">
          <div className="space-y-1 ">
            {isAllOptionEnabled && (
              <div
                onClick={onAllClicked}
                className={classNames(
                  'flex items-center rounded-xxl py-1 px-2 h-9 cursor-pointer hover:bg-prime-400/10',
                  {
                    'bg-prime-400/20': isAllSelected
                  }
                )}>
                All
                <div className="ml-auto">{isAllSelected && <CheckIcon />}</div>
              </div>
            )}
            {options
              .sort((a, b) => {
                if (sortValue(a) !== sortValue(b)) {
                  return sortValue(a) - sortValue(b);
                } else if (sortValue(a) === 0) {
                  return (
                    Array.from(selectedSnap).findIndex((s) => s === a.key) -
                    Array.from(selectedSnap).findIndex((s) => s === b.key)
                  );
                } else {
                  return 0;
                }
              })
              .filter((o) => selectedSearchTab === 'All' || o.type === selectedSearchTab)
              .filter(
                (o) =>
                  !searchPattern ||
                  searchPattern
                    .split(' ')
                    .filter((s) => !!s)
                    .map((s) => new RegExp(s, 'i').test(o.sortKey))
                    .every((r) => r)
              )
              .map((o, i) => {
                const isSelected = selected.has(o.key);
                return (
                  <div
                    key={i}
                    onClick={() => onOptionClicked(o.key)}
                    className={classNames(
                      'flex w-full items-center rounded-xxl py-2 px-2 cursor-pointer hover:bg-prime-400/10',
                      {
                        'bg-prime-400/20': isSelected
                      }
                    )}>
                    <div className="flex-1">{o.icon}</div>
                    <div className="ml-1">{o.name}</div>
                    <div className="ml-auto">{isSelected && <CheckIcon />}</div>
                  </div>
                );
              })}
          </div>
          {['Farm'].includes(selectedSearchTab) && (
            <div className="absolute w-full h-full left-0 right-0 flex items-center justify-center bg-surface text-grey-500">
              Coming soon...
            </div>
          )}
        </div>
      </div>
    );
  }, [
    isAllOptionEnabled,
    isAllSelected,
    onAllClicked,
    onOptionClicked,
    options,
    searchPattern,
    selected,
    selectedSearchTab,
    selectedSnap,
    sortValue
  ]);

  const selectedContainerRef = useRef<HTMLDivElement>(null);

  const { isTablet } = useBreakpoint('tablet');
  const nodeRef = useRef(null);

  const duration = 30;
  const defaultStyle = {
    transition: `opacity ${duration}ms ease-in-out`,
    opacity: 0
  };

  const transitionStyles = {
    entering: { opacity: 1 },
    entered: { opacity: 1 },
    exiting: { opacity: 0 },
    exited: { opacity: 0 },
    unmounted: {}
  };

  return (
    <div
      className={classNames(
        'rounded-xxl relative body-bold text-grey-700 bg-field cursor-pointer',
        className
      )}>
      <div
        className="flex items-center min-h-12 pl-2 pr-2 py-1"
        onClick={() => {
          if (!isPopupVisible) {
            setIsPopupVisible(true);
            isCardClicked.current = true;
          } else {
            setIsPopupVisible(false);
          }
        }}>
        {title && <span className="mr-2 pre">{title}</span>}
        <div
          className="flex flex-1 items-center overflow-hidden gap-x-2 flex-wrap gap-y-1"
          ref={selectedContainerRef}>
          {Array.from(selected).map((s, i) => {
            const op = options.find((o) => o.key === s);
            return <Fragment key={i}>{op?.abbr ?? op?.icon}</Fragment>;
          })}
        </div>
        <span className="ml-auto cursor-pointer w-6 h-6 flex items-center justify-center">
          <CaretIcon className="font-icon text-grey-300 label-small-thin" />
        </span>
      </div>
      {!isTablet && (
        <Transition
          nodeRef={nodeRef}
          in={isPopupVisible}
          timeout={duration}
          mountOnEnter={false}
          unmountOnExit={false}>
          {(state) => (
            <div
              className={classNames('top-[100%] left-0 absolute z-50', {
                'pointer-events-none': !isPopupVisible // not interfere charts
              })}
              onClick={() => (isCardClicked.current = true)}
              ref={nodeRef}
              style={{
                ...defaultStyle,
                ...transitionStyles[state]
              }}>
              <Card className="hip-filter-popup shadow-subTitle h-[400px] overflow-hidden">
                {content}
              </Card>
            </div>
          )}
        </Transition>
      )}
      {/* !isTablet && isPopupVisible && (
        <div onClick={() => (isCardClicked.current = true)}>
          <Card className="hip-filter-popup absolute z-50 top-[52px] left-0 shadow-subTitle max-h-[400px] overflow-auto scrollbar">
            {content}
          </Card>
        </div>
      ) */}
      {isTablet && (
        <Drawer
          closable={false}
          title={`Select tokens`}
          bodyStyle={{ padding: '4px 8px' }}
          height={'auto'}
          placement={'bottom'}
          destroyOnClose={false}
          onClose={() => setIsPopupVisible(false)}
          visible={isPopupVisible}>
          <div className="h-[60vh]" onClick={() => (isCardClicked.current = true)}>
            {content}
          </div>
        </Drawer>
      )}
    </div>
  );
};

export default IconMultipleSelector;
