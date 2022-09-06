import classNames from 'classnames';
import { FC, useEffect, useMemo, useState } from 'react';
import invariant from 'tiny-invariant';

type PositiveFloatNumInputProps = {
  inputAmount?: number;
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

export const numToGrouped = (num: string) => {
  return num
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

export const avoidScientificNotation = (x: number) => {
  invariant(x >= 0 && x <= Number.MAX_SAFE_INTEGER, 'Invalid number range');
  let res = x.toString();
  if (Math.abs(x) < 1.0) {
    const e = parseInt(x.toString().split('e-')[1]);
    if (e) {
      x *= Math.pow(10, e - 1);
      res = '0.' + new Array(e).join('0') + x.toString().substring(2);
    }
  }
  // Note we don't consider the case x >= 1e21 which would also be converted to scientific notation by js
  return res;
};

// Cut decimals to its max allowed count
export const cutDecimals = (v: string, maxDecimals: number | undefined) => {
  const decimalsLength = v.split('.')[1]?.length || 0;
  if (typeof maxDecimals === 'number' && decimalsLength > maxDecimals) {
    v = v
      .split('.')
      .map((vs, index) => {
        if (index > 0) {
          return vs.slice(0, maxDecimals);
        }
        return vs;
      })
      .join('.');
    if (/^[\d]+\.$/.test(v)) v = v.replace('.', '');
  }
  return v;
};

const MIN_DEFAULT = 0;
const MAX_DEFAULT = Number.MAX_SAFE_INTEGER;
const MAX_DECIMALS_DEFAULT = 9;

const PositiveFloatNumInput: FC<PositiveFloatNumInputProps> = ({
  inputAmount,
  isDisabled = false,
  placeholder = '0',
  className = '',
  styles = {},
  min = MIN_DEFAULT,
  max = MAX_DEFAULT,
  isConfine = false,
  maxDecimals = MAX_DECIMALS_DEFAULT,
  onInputChange = () => {},
  onEnter = () => {},
  onAmountChange = () => {}
}) => {
  invariant(min >= MIN_DEFAULT, 'Min prop value invalid');
  invariant(max <= MAX_DEFAULT, 'Max prop value invalid');
  invariant(
    maxDecimals <= MAX_DECIMALS_DEFAULT && maxDecimals % 1 === 0,
    'Max decimals prop value invalid'
  );

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter') {
      onEnter();
    }
  };
  const inputToInternalAmount = useMemo(() => {
    if (!inputAmount) return '';
    let inputAmountTemp = inputAmount;
    if (inputAmount > max || inputAmount < min) {
      if (!isConfine) {
        throw new Error('Invalid input amount');
      } else {
        inputAmountTemp = inputAmount > max ? max : min;
      }
    }

    return cutDecimals(avoidScientificNotation(inputAmountTemp), maxDecimals);
  }, [inputAmount, isConfine, max, maxDecimals, min]);

  const [internalAmountText, setInternalAmountText] = useState<string>(inputToInternalAmount); // can be ''

  useEffect(() => {
    // Input only changes internal state when there will be an value update for the zero input cases like 0.0000, 1.0000
    if (inputAmount !== parseFloat(internalAmountText)) {
      setInternalAmountText(inputToInternalAmount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputAmount]);

  const displayText = numToGrouped(internalAmountText);

  return (
    <input
      className={classNames('positiveFloatNumInput', 'px-1 focus: outline-none min-w-0', className)}
      value={displayText}
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
        // Remove group separator
        let valueStr = event.target.value
          .split('')
          .filter((l) => l !== ',')
          .join('');
        // Avoid the case to parse strings like '.123'
        if (/^\./.test(valueStr)) valueStr = '0' + valueStr;

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
        setInternalAmountText(valueStr);
        onInputChange(event);
        // When internal value is '', convert to 0
        onAmountChange(parseFloat(valueStr || '0'));
      }}
    />
  );
};

export default PositiveFloatNumInput;
