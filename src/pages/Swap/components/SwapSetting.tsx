import { useFormikContext } from 'formik';
import { ISwapSettings } from 'pages/Swap/types';
import Button from 'components/Button';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import swapAction from 'modules/swap/actions';
import PositiveFloatNumInput from 'components/PositiveFloatNumInput';
import classNames from 'classnames';
import { initState as swapInitState } from 'modules/swap/reducer';

interface TProps {
  onClose: () => void;
}

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

  const isCustomSlippage = !slippageOptions.includes(values.slipTolerance);

  return (
    <div>
      <div className="paragraph bold text-black mobile:hidden">Transaction Settings</div>
      <div className="mt-6 mobile:mt-0">
        <div className="paragraph text-primeBlack80 mb-4">Slippage Tolerance</div>
        <div className="flex gap-2">
          {slippageOptions.map((s, i) => {
            return (
              <Button
                key={`st-${i}`}
                className="flex-1 h-9 rounded-md"
                variant={values.slipTolerance === s ? 'selected' : 'notSelected'}
                onClick={() => setFieldValue('slipTolerance', s)}>
                {s}%
              </Button>
            );
          })}
        </div>
        <div
          className={classNames(
            'flex items-center relative border-[2px] border-grey-300 rounded-md h-11 mt-2 rounded-xl',
            { '!border-primePurple-700': isCustomSlippage }
          )}>
          <PositiveFloatNumInput
            inputAmount={!isCustomSlippage ? 0 : values.slipTolerance}
            min={0}
            max={10}
            isConfine={true}
            placeholder="Custom"
            className={classNames(
              'rounded-xl w-full h-full mr-1 bg-transparent text-grey-900 largeTextBold px-4',
              { '!text-primePurple-700': isCustomSlippage }
            )}
            onAmountChange={(v) => setFieldValue('slipTolerance', v)}
          />
          <div
            className={classNames('mx-4 text-grey-500 largeTextBold', {
              '!text-primePurple-700': isCustomSlippage
            })}>
            %
          </div>
        </div>
      </div>
      <div className="mt-6">
        <div className="paragraph text-primeBlack80 mb-4">Transaction Deadline</div>
        <div className="flex w-full h-11 items-center gap-x-2">
          <PositiveFloatNumInput
            className="h-full grow rounded-xl bg-primaryGrey largeTextBold px-4"
            inputAmount={values.trasactionDeadline}
            isConfine={true}
            placeholder="0"
            min={0}
            max={600}
            onAmountChange={(v) => setFieldValue('trasactionDeadline', v)}
          />
          <div className="paragraph">Seconds</div>
        </div>
      </div>
      <div className="mt-6">
        <div className="paragraph text-primeBlack80 mb-4">Max Gas Fee</div>
        <div className="flex w-full h-11 items-center gap-x-2">
          <PositiveFloatNumInput
            className="h-full grow rounded-xl bg-primaryGrey largeTextBold px-4"
            inputAmount={values.maxGasFee}
            isConfine={true}
            placeholder="0"
            min={0}
            max={1000}
            onAmountChange={(v) => setFieldValue('maxGasFee', v)}
          />
          <div className="paragraph">Gas Units</div>
        </div>
      </div>
      <div className="mt-6 flex gap-6 h-[43px]">
        <Button
          className="grow border-[3px] border-grey-900 font-bold h-full"
          variant="outlined"
          onClick={onResetSwapSetting}>
          Reset
        </Button>
        <Button className="grow font-bold !h-full" variant="gradient" onClick={onConfirm}>
          Confirm
        </Button>
      </div>
    </div>
  );
};

export default SwapSetting;
