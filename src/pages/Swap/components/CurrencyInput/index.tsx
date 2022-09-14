import { useFormikContext } from 'formik';
import { ISwapSettings } from 'pages/Swap/types';
import { CaretIcon, TrashIcon } from 'resources/icons';
import cx from 'classnames';
import styles from './CurrencyInput.module.scss';
import CoinSelector from './CoinSelector';
import { useCallback, useRef, useState } from 'react';
import CoinIcon from 'components/CoinIcon';
import { Drawer, Popover, Skeleton } from 'antd';
import useTokenBalane from 'hooks/useTokenBalance';
import { useSelector } from 'react-redux';
import { getTokenList } from 'modules/swap/reducer';
import classNames from 'classnames';
import PositiveFloatNumInput from 'components/PositiveFloatNumInput';
import useDebouncedCallback from 'hooks/useDebouncedCallback';
import { coin_list } from '@manahippo/hippo-sdk';
import useTokenAmountFormatter from 'hooks/useTokenAmountFormatter';
import { useWallet } from '@manahippo/aptos-wallet-adapter';
import Button from 'components/Button';

interface TProps {
  actionType: 'currencyTo' | 'currencyFrom';
  trashButtonContainerWidth?: string;
}

const CoinSelectButton = ({
  className = '',
  token,
  isDisabled = false,
  onClick = () => {}
}: {
  className?: string;
  token: coin_list.Coin_list.CoinInfo | undefined;
  isDisabled?: Boolean;
  onClick?: () => void;
}) => {
  return (
    <div
      className={classNames(
        'flex items-center gap-2 font-bold cursor-pointer',
        {
          'cursor-not-allowed pointer-events-none': isDisabled
        },
        className
      )}
      onClick={onClick}>
      {token?.symbol ? (
        <>
          <div className="flex gap-2 uppercase items-center">
            <CoinIcon logoSrc={token.logo_url.str()} />
            {token.symbol.str()}
          </div>
          <CaretIcon className="font-icon text-grey-300" />
        </>
      ) : (
        <>
          <div className="small">--</div>
          <CaretIcon className="font-icon text-grey-300" />
        </>
      )}
    </div>
  );
};

const CurrencyInput: React.FC<TProps> = ({ actionType, trashButtonContainerWidth = '32px' }) => {
  const [tokenAmountFormatter] = useTokenAmountFormatter();
  const [isVisibile, setIsVisible] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const { values, setFieldValue } = useFormikContext<ISwapSettings>();
  const { connected } = useWallet();

  const selectedCurrency = values[actionType];
  const selectedSymbol = selectedCurrency?.token?.symbol.str();
  const [uiBalance, isReady] = useTokenBalane(selectedSymbol);
  const tokenList = useSelector(getTokenList);
  const isCoinSelectorDisabled = !tokenList || tokenList.length === 0;

  // The debounce delay should be bigger than the average of key input intervals
  const onAmountChange = useDebouncedCallback(
    useCallback(
      (a: number) => {
        console.log(`Currency input num: ${a} of type ${typeof a}`);
        setFieldValue(actionType, {
          ...selectedCurrency,
          amount: a
        });
      },
      [actionType, selectedCurrency, setFieldValue]
    ),
    200
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const onTrashClick = useCallback(() => {
    setFieldValue(actionType, {
      ...selectedCurrency,
      amount: 0
    });
    inputRef.current?.focus();
  }, [actionType, selectedCurrency, setFieldValue]);

  return (
    <div
      className={cx(
        styles.currencyInput,
        'bg-primaryGrey w-full py-4 px-3 rounded-xl h-[77px] flex flex-col justify-center mobile:px-2 relative group'
      )}>
      <div className="flex gap-1 items-center">
        <Popover
          className="mobile:hidden"
          overlayClassName={styles.popover}
          trigger="click"
          visible={isVisibile}
          onVisibleChange={(visible) => setIsVisible(!isCoinSelectorDisabled && visible)}
          content={
            <CoinSelector actionType={actionType} dismissiModal={() => setIsVisible(!isVisibile)} />
          }>
          <CoinSelectButton token={selectedCurrency?.token} isDisabled={isCoinSelectorDisabled} />
        </Popover>
        <CoinSelectButton
          className="hidden min-w-fit mobile:flex"
          isDisabled={isCoinSelectorDisabled}
          token={selectedCurrency?.token}
          onClick={() => setIsDrawerVisible(true)}
        />
        <PositiveFloatNumInput
          ref={inputRef}
          min={0}
          max={1e11}
          maxDecimals={values[actionType]?.token?.decimals.toJsNumber() || 9}
          isDisabled={actionType === 'currencyTo'}
          placeholder="0.00"
          className="grow h6 font-[900] bg-transparent text-right pr-0 pl-1"
          inputAmount={selectedCurrency?.amount || 0}
          onAmountChange={onAmountChange}
        />
        {actionType === 'currencyFrom' && !!selectedCurrency?.amount && (
          <div
            style={{ width: trashButtonContainerWidth, right: `-${trashButtonContainerWidth}` }}
            className="mobile:hidden tablet:hidden absolute h-full flex opacity-0 group-hover:opacity-100 hover:opacity-100 items-center justify-center">
            <Button size="small" variant="icon" onClick={onTrashClick}>
              <TrashIcon className="font-icon text-grey-500" />
            </Button>
          </div>
        )}
      </div>
      {connected && (
        <div className="flex justify-between font-bold text-grey-500 mt-1 cursor-auto pointer-events-none">
          <small>Current Balance:</small>
          {isReady && (
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
              {tokenAmountFormatter(uiBalance, selectedSymbol)}
            </small>
          )}
          {!isReady && <Skeleton.Button active className="!w-10 !h-4 !min-w-[40px] !rounded" />}
        </div>
      )}
      <Drawer
        title={<div className="paragraph bold text-black">Select a Token</div>}
        closable={false}
        height={'80vh'}
        placement={'bottom'}
        onClose={() => setIsDrawerVisible(false)}
        visible={isDrawerVisible}>
        <CoinSelector actionType={actionType} dismissiModal={() => setIsDrawerVisible(false)} />
      </Drawer>
    </div>
  );
};

export default CurrencyInput;
