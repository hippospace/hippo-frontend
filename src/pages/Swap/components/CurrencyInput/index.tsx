import { useFormikContext } from 'formik';
import { ISwapSettings } from 'pages/Swap/types';
import { CaretIcon, TrashIcon } from 'resources/icons';
import cx from 'classnames';
import styles from './CurrencyInput.module.scss';
import CoinSelector from './CoinSelector';
import { useCallback, useRef, useState } from 'react';
import CoinIcon from 'components/CoinIcon';
import { Modal, Drawer } from 'components/Antd';
import useTokenBalane from 'hooks/useTokenBalance';
import { useSelector } from 'react-redux';
import { getTokenList } from 'modules/swap/reducer';
import classNames from 'classnames';
import PositiveFloatNumInput from 'components/PositiveFloatNumInput';
import useDebouncedCallback from 'hooks/useDebouncedCallback';
import { CoinInfo as TokenInfo } from '@manahippo/hippo-sdk/dist/generated/coin_list/coin_list';
import useTokenAmountFormatter from 'hooks/useTokenAmountFormatter';
import { useWallet } from '@manahippo/aptos-wallet-adapter';
import Button from 'components/Button';
import Skeleton from 'components/Skeleton';

interface TProps {
  actionType: 'currencyTo' | 'currencyFrom';
  trashButtonContainerWidth?: string;
  isDisableAmountInput?: boolean;
}

const CoinSelectButton = ({
  className = '',
  token,
  isDisabled = false,
  onClick = () => {}
}: {
  className?: string;
  token: TokenInfo | undefined;
  isDisabled?: Boolean;
  onClick?: () => void;
}) => {
  return (
    <div
      className={classNames(
        'flex items-center gap-2 font-bold cursor-pointer min-w-fit',
        {
          'cursor-not-allowed pointer-events-none': isDisabled
        },
        className
      )}
      onClick={onClick}>
      {token?.symbol ? (
        <>
          <div className="flex gap-2 items-center">
            <CoinIcon logoSrc={token.logo_url.str()} />
            {token.symbol.str()}
          </div>
          <CaretIcon className="font-icon text-grey-300" />
        </>
      ) : (
        <>
          <div className="label-large-bold">--</div>
          <CaretIcon className="font-icon text-grey-300" />
        </>
      )}
    </div>
  );
};

const CurrencyInput: React.FC<TProps> = ({
  actionType,
  isDisableAmountInput = false,
  trashButtonContainerWidth = '32px'
}) => {
  const [tokenAmountFormatter] = useTokenAmountFormatter();
  const [isCoinSelectorVisible, setIsCoinSelectorVisible] = useState(false);
  const [isCSDrawerVisible, setIsCSDrawerVisible] = useState(false);
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
        'bg-grey-100 w-full py-4 px-3 rounded-xl h-[77px] flex flex-col justify-center mobile:px-2 relative group'
      )}>
      <div className="flex gap-1 items-center">
        <CoinSelectButton
          className="flex mobile:hidden"
          isDisabled={isCoinSelectorDisabled}
          token={selectedCurrency?.token}
          onClick={() => setIsCoinSelectorVisible(true)}
        />
        <CoinSelectButton
          className="hidden mobile:flex"
          isDisabled={isCSDrawerVisible}
          token={selectedCurrency?.token}
          onClick={() => setIsCSDrawerVisible(true)}
        />
        <PositiveFloatNumInput
          ref={inputRef}
          min={0}
          max={1e11}
          maxDecimals={values[actionType]?.token?.decimals.toJsNumber() || 9}
          isDisabled={actionType === 'currencyTo' || isDisableAmountInput}
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
          <div className="label-large-bold">Current Balance:</div>
          {isReady && (
            <div
              className={classNames('label-large-bold', {
                'cursor-pointer pointer-events-auto underline':
                  actionType === 'currencyFrom' && !isDisableAmountInput
              })}
              onClick={() => {
                if (actionType === 'currencyFrom' && !isDisableAmountInput) {
                  setFieldValue(actionType, {
                    ...selectedCurrency,
                    amount: uiBalance
                  });
                }
              }}>
              {tokenAmountFormatter(uiBalance, selectedSymbol)}
            </div>
          )}
          {!isReady && <Skeleton width={30} />}
        </div>
      )}
      {/* destroyOnClose is critical for getting the correct height of token list wrapper in CoinSelector */}
      <Modal
        visible={isCoinSelectorVisible}
        footer={null}
        closable={false}
        maskClosable={true}
        centered
        destroyOnClose
        width={400}
        onCancel={() => setIsCoinSelectorVisible(false)}>
        <div className="mobile:hidden">
          <CoinSelector
            actionType={actionType}
            dismissiModal={() => setIsCoinSelectorVisible(false)}
          />
        </div>
      </Modal>
      <Drawer
        className="hidden mobile:block"
        title={<div className="body-bold text-black">Select a Token</div>}
        closable={false}
        height={'80vh'}
        placement={'bottom'}
        destroyOnClose
        onClose={() => setIsCSDrawerVisible(false)}
        visible={isCSDrawerVisible}>
        <CoinSelector actionType={actionType} dismissiModal={() => setIsCSDrawerVisible(false)} />
      </Drawer>
    </div>
  );
};

export default CurrencyInput;
