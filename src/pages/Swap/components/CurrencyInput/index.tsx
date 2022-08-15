import { useFormikContext } from 'formik';
import { ISwapSettings } from 'pages/Swap/types';
import { CaretIcon } from 'resources/icons';
import cx from 'classnames';
import styles from './CurrencyInput.module.scss';
import CoinSelector from './CoinSelector';
import { useCallback, useMemo, useState } from 'react';
import CoinIcon from 'components/CoinIcon';
import { Drawer, Popover } from 'antd';
import useTokenBalane from 'hooks/useTokenBalance';
import { useSelector } from 'react-redux';
import { getTokenList } from 'modules/swap/reducer';
import classNames from 'classnames';
import PositiveFloatNumInput from 'components/PositiveFloatNumInput';
import useDebouncedCallback from 'hooks/useDebouncedCallback';

interface TProps {
  actionType: 'currencyTo' | 'currencyFrom';
}

const CurrencyInput: React.FC<TProps> = ({ actionType }) => {
  const [isVisibile, setIsVisible] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const { values, setFieldValue } = useFormikContext<ISwapSettings>();

  const selectedCurrency = values[actionType];
  const selectedSymbol = selectedCurrency?.token?.symbol.str();
  const [uiBalance] = useTokenBalane(selectedSymbol);
  const tokenList = useSelector(getTokenList);
  const isCoinSelectorDisabled = !tokenList || tokenList.length === 0;

  const coinSelectorButton = useMemo(() => {
    return (
      <div
        className={classNames('flex items-center gap-2 font-bold cursor-pointer', {
          'cursor-not-allowed': isCoinSelectorDisabled
        })}>
        {selectedCurrency?.token?.symbol ? (
          <div className="flex gap-2 uppercase items-center">
            <CoinIcon logoSrc={selectedCurrency.token.logo_url.str()} />
            {selectedCurrency.token.symbol.str()}
          </div>
        ) : (
          <div>Select Currency</div>
        )}
        <CaretIcon className="fill-black" />
      </div>
    );
  }, [isCoinSelectorDisabled, selectedCurrency?.token?.symbol, selectedCurrency?.token?.logo_url]);

  // The debounce delay should be bigger than the average of key input intervals
  const onAmountChange = useDebouncedCallback(
    useCallback(
      (a: number) => {
        console.log(`Currency input num: ${a}`);
        setFieldValue(actionType, {
          ...selectedCurrency,
          amount: a
        });
      },
      [actionType, selectedCurrency, setFieldValue]
    ),
    200
  );

  return (
    <div
      className={cx(
        styles.currencyInput,
        'bg-primaryGrey w-full py-4 px-6 rounded-xl h-[77px] flex flex-col justify-center mobile:px-2'
      )}>
      <div className="flex gap-1">
        <Popover
          className="mobile:hidden"
          overlayClassName={styles.popover}
          trigger="click"
          visible={isVisibile}
          onVisibleChange={(visible) => setIsVisible(!isCoinSelectorDisabled && visible)}
          content={
            <CoinSelector actionType={actionType} dismissiModal={() => setIsVisible(!isVisibile)} />
          }>
          {coinSelectorButton}
        </Popover>
        <div className="hidden mobile:block" onClick={() => setIsDrawerVisible(true)}>
          {coinSelectorButton}
        </div>
        <PositiveFloatNumInput
          min={0}
          max={1e11}
          maxDecimals={values[actionType]?.token?.decimals.toJsNumber() || 9}
          isDisabled={actionType === 'currencyTo'}
          placeholder="0.00"
          className="grow font-bold title bg-transparent text-right pr-0 pl-1"
          inputAmount={selectedCurrency?.amount || 0}
          onAmountChange={onAmountChange}
        />
      </div>
      {typeof uiBalance === 'number' && (
        <div className="flex justify-between font-bold text-grey-500 mt-1 cursor-auto pointer-events-none">
          <small>Current Balance:</small>
          <small
            className={classNames({
              'cursor-pointer pointer-events-auto underline': actionType === 'currencyFrom'
            })}
            onClick={() => {
              if (actionType === 'currencyFrom') {
                setFieldValue(actionType, {
                  ...selectedCurrency,
                  amount: uiBalance
                });
              }
            }}>
            {uiBalance}
          </small>
        </div>
      )}
      <Drawer
        title={<div className="paragraph bold text-black">Select a Token</div>}
        height={'100vh'}
        placement={'bottom'}
        onClose={() => setIsDrawerVisible(false)}
        visible={isDrawerVisible}>
        <CoinSelector actionType={actionType} dismissiModal={() => setIsDrawerVisible(false)} />
      </Drawer>
    </div>
  );
};

export default CurrencyInput;
