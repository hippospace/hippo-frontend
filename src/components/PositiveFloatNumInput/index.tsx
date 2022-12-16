import classNames from 'classnames';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import invariant from 'tiny-invariant';
import { avoidScientificNotation, cutDecimals, numToGrouped } from './numberFormats';

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

const MIN_DEFAULT = 0;
const MAX_DEFAULT = Number.MAX_SAFE_INTEGER;
const MAX_DECIMALS_DEFAULT = 9;

// eslint-disable-next-line react/display-name
const PositiveFloatNumInput = forwardRef<
  HTMLInputElement,
  PositiveFloatNumInputProps & { ref: React.Ref<HTMLButtonElement> }
>(
  (
    {
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
    },
    ref
  ) => {
    invariant(min >= MIN_DEFAULT, 'Min prop value invalid');
    invariant(max <= MAX_DEFAULT, 'Max prop value invalid');
    invariant(
      maxDecimals <= MAX_DECIMALS_DEFAULT && maxDecimals % 1 === 0,
      'Max decimals prop value invalid'
    );

    const inputRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => inputRef.current);

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
      // Input only changes internal state when there will be an value update to avoid breaking the zero input cases like 0.0000, 1.0000
      if (inputAmount !== parseFloat(internalAmountText)) {
        setInternalAmountText(inputToInternalAmount);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputAmount]);

    const displayText = numToGrouped(internalAmountText);
    const prevoiusDisplayText = useRef<string>(''); // don't use usePrevious

    const selectionStart = inputRef.current?.selectionEnd; // fix ctrl-a
    const previousSelectionStart = useRef<number>(0);

    useEffect(() => {
      const textLengthChange = displayText.length - (prevoiusDisplayText.current?.length ?? 0);
      if (!isDisabled && inputRef.current === document.activeElement) {
        if (Math.abs(textLengthChange) > 0) {
          const fixedCursorPos = Math.min(
            displayText.length,
            Math.max(0, previousSelectionStart.current + textLengthChange)
          );
          previousSelectionStart.current = fixedCursorPos;
          inputRef.current.setSelectionRange(fixedCursorPos, fixedCursorPos);
        } else {
          previousSelectionStart.current = selectionStart;
        }
        prevoiusDisplayText.current = displayText;
      }
      // Caret moving would trigger input re-render
    }, [displayText, isDisabled, selectionStart]);

    const [isCommaDeleted, setIsCommaDeleted] = useState(false);
    useEffect(() => {
      if (!isDisabled && isCommaDeleted) {
        inputRef.current.setSelectionRange(selectionStart, selectionStart);
        setIsCommaDeleted(false);
      }
    }, [isCommaDeleted, isDisabled, selectionStart]);

    return (
      <input
        ref={inputRef}
        className={classNames(
          'positiveFloatNumInput',
          'px-1 focus: outline-none min-w-0',
          { 'cursor-not-allowed': isDisabled },
          className
        )}
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
          onInputChange(event);
          if (valueStr !== internalAmountText) {
            setInternalAmountText(valueStr);
            // When internal value is '', convert to 0
            onAmountChange(parseFloat(valueStr || '0'));
          } else {
            setIsCommaDeleted(true);
          }
        }}
      />
    );
  }
);

export default PositiveFloatNumInput;
