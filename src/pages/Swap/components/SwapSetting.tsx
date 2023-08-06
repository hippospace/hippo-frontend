import Button from 'components/Button';
import { useCallback } from 'react';
import PositiveFloatNumInput from 'components/PositiveFloatNumInput';
import classNames from 'classnames';
import Selectable from 'components/Selectable';
import { SwapContextType } from '..';

interface TProps {
  ctx: SwapContextType;
  maxGas?: number;
  onClose: () => void;
}

const SubTitle = ({ children }: { children: string }) => {
  return <div className="label-large-bold text-grey-900 mb-3">{children}</div>;
};

const SwapSetting: React.FC<TProps> = ({ ctx, onClose, maxGas }) => {
  const slippageOptions = [0.1, 0.5, 1];

  const onConfirm = useCallback(() => {
    onClose();
  }, [onClose]);

  const onResetSwapSetting = useCallback(() => {
    ctx.setSlippageTolerance(0.1);
    ctx.setTransactionDeadline(60);
    ctx.setMaxGasFee(20000);
  }, [ctx]);

  // TODO: manage state here!
  const isCustomSlippage = !slippageOptions.includes(ctx.slippageTolerance);

  return (
    <div className="w-full">
      <div className="">
        <SubTitle>Slippage Tolerance</SubTitle>
        <div className="flex gap-x-4 gap-y-3 flex-wrap">
          {slippageOptions.map((s, i) => {
            return (
              <Selectable
                key={`st-${i}`}
                className="flex-auto body-bold"
                isSelected={ctx.slippageTolerance === s}
                onClick={() => ctx.setSlippageTolerance(s)}>
                {s}%
              </Selectable>
            );
          })}
          <Selectable
            isSelected={isCustomSlippage}
            className={classNames('flex items-center relative w-full')}>
            <PositiveFloatNumInput
              inputAmount={!isCustomSlippage ? 0 : ctx.slippageTolerance}
              min={0}
              max={10}
              isConfine={true}
              placeholder="Custom"
              className={classNames(
                'h6 rounded-xl w-full h-full mr-1 bg-transparent text-grey-900 body-bold !px-4'
              )}
              onAmountChange={(v) => ctx.setSlippageTolerance(v)}
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
            className="grow rounded-full bg-field !px-4 w-[140px] h-[40px] body-bold text-grey-700"
            inputAmount={ctx.transactionDeadline}
            isConfine={true}
            placeholder="0"
            min={0}
            max={600}
            onAmountChange={(v) => ctx.setTransactionDeadline(v)}
          />
          <div className="body-bold text-grey-700">Seconds</div>
        </div>
      </div>
      <div className="mt-6">
        <SubTitle>Max Gas Fee</SubTitle>
        <div className="flex w-fit items-center gap-x-2">
          <PositiveFloatNumInput
            className="grow rounded-full bg-field !px-4 w-[140px] h-[40px] body-bold text-grey-700"
            inputAmount={ctx.maxGasFee}
            isConfine={true}
            placeholder="0"
            min={0}
            max={maxGas}
            onAmountChange={(v) => ctx.setMaxGasFee(v)}
          />
          <div className="body-bold text-grey-700">Gas Units</div>
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
