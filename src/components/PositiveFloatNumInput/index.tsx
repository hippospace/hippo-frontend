import classNames from 'classnames';
import { FC, useEffect, useState } from 'react';
import './PositiveFloatNumInput.module.scss';

type PositiveFloatNumInputProps = {
  inputAmount: number;
  className?: string;
  isDisabled?: boolean;
  placeholder?: string;
  styles?: Object;
  min?: number;
  max?: number;
  isConfine?: boolean;
  maxDecimals?: number;
  onInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEnter?: () => {};
  onAmountChange?: (a: number) => void;
};

export const numToGrouped = (num: string | number) => {
  return num
    .toString()
    .split('.')
    .map((v, index) => {
      if (index > 0) return v;
      else {
        return v
          .split('')
          .map((l, index2) => {
            const revertIndex = v.length - index2;
            if ((revertIndex - 1) % 3 === 0 && revertIndex !== 1) {
              return `${l},`;
            } else {
              return l;
            }
          })
          .join('');
      }
    })
    .join('.');
};

const PositiveFloatNumInput: FC<PositiveFloatNumInputProps> = ({
  inputAmount,
  isDisabled = false,
  placeholder = '0',
  className = '',
  styles = {},
  min = 0,
  max = Infinity,
  isConfine = false,
  maxDecimals,
  onInputChange = () => {},
  onEnter = () => {},
  onAmountChange = () => {}
}) => {
  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter') {
      onEnter();
    }
  };
  const [amount, setAmount] = useState<number | string>(inputAmount);

  useEffect(() => {
    setAmount(inputAmount);
  }, [inputAmount]);

  const inputValue = amount === 0 ? '' : numToGrouped(amount);

  return (
    <input
      className={classNames('positiveFloatNumInput', 'px-1', className)}
      value={inputValue}
      placeholder={placeholder}
      inputMode="decimal"
      type="text"
      min={min}
      max={max}
      disabled={isDisabled}
      style={styles}
      onKeyDown={onKeyDown}
      onChange={(event) => {
        if (!/^[0-9,]*[.]?[0-9]*$/.test(event.target.value)) {
          return;
        }
        let valueStr = event.target.value
          .split('')
          .filter((l) => l !== ',')
          .join('');
        if (valueStr !== '') {
          const decimalsLength = valueStr.split('.')[1]?.length || 0;
          if (maxDecimals !== undefined && decimalsLength > maxDecimals) {
            return;
          }
          const value = parseFloat(valueStr);
          if (value < min) {
            if (isConfine) valueStr = '0';
            else return;
          } else if (value > max) {
            if (isConfine) valueStr = '' + max;
            else return;
          }
        }

        setAmount(valueStr);
        onInputChange(event);
        onAmountChange(parseFloat(valueStr || '0'));
      }}
    />
  );
};

export default PositiveFloatNumInput;
