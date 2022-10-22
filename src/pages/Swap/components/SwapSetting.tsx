import { useFormikContext } from 'formik';
import { ISwapSettings } from 'pages/Swap/types';
import Button from 'components/Button';
import { ReactNode, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import swapAction from 'modules/swap/actions';
import PositiveFloatNumInput from 'components/PositiveFloatNumInput';
import classNames from 'classnames';
import { initState as swapInitState } from 'modules/swap/reducer';

interface TProps {
  onClose: () => void;
}

const SubTitle = ({ children }: { children: string }) => {
  return <div className="label-large-bold font-extrabold text-grey-700 mb-3">{children}</div>;
};

const Selectable = ({
  isSelected,
  className,
  children,
  onClick = () => {}
}: {
  isSelected: boolean;
  className: string;
  children: ReactNode;
  onClick?: () => void;
}) => {
  return (
    <div
      className={classNames(
        'rounded-full h-[40px] h6 border-[2px] border-transparent bg-grey-100 text-grey-700 cursor-pointer',
        {
          'bg-[linear-gradient(90deg,#D483FF_86.1%,#9747FF_95.98%,#6E6CCA_105.2%)] bg-clip-border bg-origin-border bg-cover':
            isSelected
        },
        className
      )}
      onClick={onClick}>
      <div className="h-full w-full rounded-full bg-grey-100 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

const SwapSetting: React.FC<TProps> = ({ onClose }) => {
  const slippageOptions = [0.5, 1, 2];

  const dispatch = useDispatch();
  const { values, setFieldValue } = useFormikContext<ISwapSettings>();

  const onConfirm = useCallback(() => {
    dispatch(swapAction.SET_SWAP_SETTING(values));
    onClose();
  }, [onClose, values, dispatch]);

  const onResetSwapSetting = useCallback(() => {
    setFieldValue('slipTolerance', swapInitState.swapSettings.slipTolerance);
    setFieldValue('trasactionDeadline', swapInitState.swapSettings.trasactionDeadline);
    setFieldValue('maxGasFee', swapInitState.swapSettings.maxGasFee);
  }, [setFieldValue]);

  // TODO: manage state here!
  const isCustomSlippage = !slippageOptions.includes(values.slipTolerance);

  return (
    <div className="w-full">
      <div className="h6 font-bold text-grey-900 text-center tablet:hidden">
        Transaction Settings
      </div>
      <div className="mt-6 mobile:mt-0">
        <SubTitle>Slippage Tolerance</SubTitle>
        <div className="flex gap-x-2 gap-y-3 flex-wrap">
          {slippageOptions.map((s, i) => {
            return (
              <Selectable
                key={`st-${i}`}
                className="flex-1"
                isSelected={values.slipTolerance === s}
                onClick={() => setFieldValue('slipTolerance', s)}>
                {s}%
              </Selectable>
            );
          })}
          <Selectable
            isSelected={isCustomSlippage}
            className={classNames('flex items-center relative w-full')}>
            <PositiveFloatNumInput
              inputAmount={!isCustomSlippage ? 0 : values.slipTolerance}
              min={0}
              max={10}
              isConfine={true}
              placeholder="Custom"
              className={classNames(
                'h6 rounded-xl w-full h-full mr-1 bg-transparent text-grey-900 body-bold px-4'
              )}
              onAmountChange={(v) => setFieldValue('slipTolerance', v)}
            />
            <div
              className={classNames('mx-4 text-grey-500 body-bold', {
                '!text-grey-900': isCustomSlippage
              })}>
              %
            </div>
          </Selectable>
        </div>
      </div>
      <div className="mt-6">
        <SubTitle>Transaction Deadline</SubTitle>
        <div className="flex w-fit items-center gap-x-2">
          <PositiveFloatNumInput
            className="grow rounded-full bg-grey-100 px-4 w-[180px] h-[40px] h6"
            inputAmount={values.trasactionDeadline}
            isConfine={true}
            placeholder="0"
            min={0}
            max={600}
            onAmountChange={(v) => setFieldValue('trasactionDeadline', v)}
          />
          <div className="h6">Seconds</div>
        </div>
      </div>
      <div className="mt-6">
        <SubTitle>Max Gas Fee</SubTitle>
        <div className="flex w-fit items-center gap-x-2">
          <PositiveFloatNumInput
            className="grow rounded-full bg-grey-100 px-4 w-[180px] h-[40px] h6"
            inputAmount={values.maxGasFee}
            isConfine={true}
            placeholder="0"
            min={0}
            onAmountChange={(v) => setFieldValue('maxGasFee', v)}
          />
          <div className="h6">Gas Units</div>
        </div>
      </div>
      <div className="mt-6 flex gap-6">
        <Button className="flex-1" variant="secondary" size="small" onClick={onResetSwapSetting}>
          Reset
        </Button>
        <Button className="flex-1" variant="primary" size="small" onClick={onConfirm}>
          Close
        </Button>
      </div>
    </div>
  );
};

export default SwapSetting;
