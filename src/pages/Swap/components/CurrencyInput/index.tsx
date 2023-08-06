import { CaretIcon, TrashIcon } from 'resources/icons';
import cx from 'classnames';
import styles from './CurrencyInput.module.scss';
import CoinSelector from './CoinSelector';
import { useCallback, useRef, useState } from 'react';
import CoinIcon from 'components/Coins/CoinIcon';
import { Modal, Drawer } from 'components/Antd';
import useTokenBalane from 'hooks/useTokenBalance';
import classNames from 'classnames';
import PositiveFloatNumInput from 'components/PositiveFloatNumInput';
import useDebouncedCallback from 'hooks/useDebouncedCallback';
import useTokenAmountFormatter from 'hooks/useTokenAmountFormatter';
import { useWallet } from '@manahippo/aptos-wallet-adapter';
import Button from 'components/Button';
import Skeleton from 'components/Skeleton';
import { RawCoinInfo as TokenInfo } from '@manahippo/coin-list';
import { useBreakpoint } from 'hooks/useBreakpoint';
import CoinLabel from 'components/Coins/CoinLabel';
import useHippoClient from 'hooks/useHippoClient';
import { SwapContextType } from 'pages/Swap';

interface TProps {
  ctx: SwapContextType;
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
            <CoinIcon logoSrc={token.logo_url} />
            <CoinLabel coin={token} />
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
  ctx,
  actionType,
  isDisableAmountInput = false,
  trashButtonContainerWidth = '32px'
}) => {
  const [tokenAmountFormatter] = useTokenAmountFormatter();
  const [isCoinSelectorVisible, setIsCoinSelectorVisible] = useState(false);
  const [isCSDrawerVisible, setIsCSDrawerVisible] = useState(false);
  const { connected } = useWallet();
  const coinlist = useHippoClient().coinListClient!;

  const thisIsFrom = actionType === 'currencyFrom';
  const setSelectedAmount = thisIsFrom ? ctx.setFromAmount : ctx.setToAmount;
  const selectedSymbol = thisIsFrom ? ctx.fromSymbol : ctx.toSymbol;
  const selectedAmount = thisIsFrom ? ctx.fromAmount : ctx.toAmount;
  const selectedCoinInfo = selectedSymbol
    ? coinlist.getCoinInfoBySymbol(selectedSymbol)[0]
    : undefined;
  const [uiBalance, isReady] = useTokenBalane(selectedCoinInfo);
  const tokenList = useHippoClient().rawCoinInfos;
  const isCoinSelectorDisabled = !tokenList || tokenList.length === 0;

  // The debounce delay should be bigger than the average of key input intervals
  const onAmountChange = useDebouncedCallback(
    useCallback(
      (a: number) => {
        ctx.setIsFixedOutput(!thisIsFrom);
        setSelectedAmount(a);
      },
      [thisIsFrom, setSelectedAmount, ctx]
    ),
    0
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const onTrashClick = useCallback(() => {
    ctx.setIsFixedOutput(!thisIsFrom);
    setSelectedAmount(0);
    inputRef.current?.focus();
  }, [setSelectedAmount, ctx, thisIsFrom]);

  const { isMobile } = useBreakpoint('mobile');

  return (
    <div
      className={cx(
        styles.currencyInput,
        'bg-field w-full py-4 px-3 rounded-xl h-[77px] flex flex-col justify-center mobile:px-2 relative group'
      )}>
      <div className="flex gap-1 items-center">
        {!isMobile && (
          <CoinSelectButton
            className="flex mobile:hidden"
            isDisabled={isCoinSelectorDisabled}
            token={selectedCoinInfo}
            onClick={() => setIsCoinSelectorVisible(true)}
          />
        )}
        {isMobile && (
          <CoinSelectButton
            className="hidden mobile:flex"
            isDisabled={isCSDrawerVisible}
            token={selectedCoinInfo}
            onClick={() => setIsCSDrawerVisible(true)}
          />
        )}
        <PositiveFloatNumInput
          ref={inputRef}
          min={0}
          max={1e11}
          maxDecimals={selectedCoinInfo?.decimals || 9}
          isDisabled={isDisableAmountInput}
          placeholder="0.00"
          className="grow h5 bg-transparent text-right pr-0 pl-1 text-grey-900"
          inputAmount={selectedAmount || 0}
          onAmountChange={onAmountChange}
        />
        {!isDisableAmountInput && !!selectedAmount && (
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
                  let amount = uiBalance;
                  if (typeof amount === 'number') {
                    if (selectedSymbol === 'APT') {
                      amount = Math.max(amount - 0.05, 0);
                    }
                    setSelectedAmount(amount);
                  }
                }
              }}>
              {tokenAmountFormatter(uiBalance, selectedCoinInfo)}
            </div>
          )}
          {!isReady && <Skeleton width={30} />}
        </div>
      )}
      <Modal
        visible={isCoinSelectorVisible}
        footer={null}
        closable={false}
        maskClosable={true}
        centered
        destroyOnClose={true}
        width={400}
        onCancel={() => setIsCoinSelectorVisible(false)}>
        <div className="mobile:hidden">
          <CoinSelector
            ctx={ctx}
            actionType={actionType}
            dismissiModal={() => setIsCoinSelectorVisible(false)}
          />
        </div>
      </Modal>
      <Drawer
        className="hidden mobile:block"
        title={<div className="body-bold text-grey-900">Select a Token</div>}
        closable={false}
        height={'80vh'}
        placement={'bottom'}
        destroyOnClose={true}
        onClose={() => setIsCSDrawerVisible(false)}
        visible={isCSDrawerVisible}>
        <CoinSelector
          ctx={ctx}
          actionType={actionType}
          dismissiModal={() => setIsCSDrawerVisible(false)}
        />
      </Drawer>
    </div>
  );
};

export default CurrencyInput;
