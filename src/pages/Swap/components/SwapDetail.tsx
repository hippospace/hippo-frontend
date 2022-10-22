import { RouteAndQuote } from '@manahippo/hippo-sdk/dist/aggregator/types';
import classNames from 'classnames';
import Button from 'components/Button';
import { useFormikContext } from 'formik';
import useTokenAmountFormatter from 'hooks/useTokenAmountFormatter';
import { useState } from 'react';
import { ExchangeIcon } from 'resources/icons';
import { ISwapSettings } from '../types';

const SwapDetail = ({
  routeAndQuote,
  fromSymbol,
  toSymbol,
  className = ''
}: {
  routeAndQuote: RouteAndQuote;
  fromSymbol: string;
  toSymbol: string;
  className?: string;
}) => {
  const { values: swapSettings } = useFormikContext<ISwapSettings>();
  const [isPriceYToX, setIsPriceYToX] = useState(true);
  const [tokenAmountFormatter] = useTokenAmountFormatter();

  const outputUiAmt = routeAndQuote.quote.outputUiAmt;
  const output = `${tokenAmountFormatter(outputUiAmt, toSymbol)} ${toSymbol}`;
  const minimum = `${tokenAmountFormatter(
    outputUiAmt * (1 - swapSettings.slipTolerance / 100),
    toSymbol
  )} ${toSymbol}`;
  const priceImpact =
    (routeAndQuote.quote.priceImpact || 0) >= 0.0001
      ? `${((routeAndQuote.quote.priceImpact || 0) * 100).toFixed(2)}%`
      : '<0.01%';

  const avgPrice = routeAndQuote.quote.outputUiAmt / routeAndQuote.quote.inputUiAmt;
  const rate =
    !avgPrice || avgPrice === Infinity
      ? 'n/a'
      : isPriceYToX
      ? `1 ${fromSymbol} ≈ ${tokenAmountFormatter(avgPrice, toSymbol)} ${toSymbol}`
      : `1 ${toSymbol} ≈ ${tokenAmountFormatter(1 / avgPrice, fromSymbol)} ${fromSymbol}`;

  const details = [
    {
      label: 'Rate',
      value: (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => setIsPriceYToX(!isPriceYToX)}>
          <span className="mr-1">{rate}</span>
          <Button variant="icon" className="mobile:hidden">
            <ExchangeIcon className="w-4 h-4" />
          </Button>
        </div>
      )
    },
    {
      label: 'Expected Output',
      value: output
    },
    {
      label: 'Minimum Received',
      value: minimum
    },
    {
      label: 'Price Impact',
      value: priceImpact
    },
    {
      label: 'Slippage Tolerance',
      value: `${swapSettings.slipTolerance} %`
    },
    {
      label: 'Max Gas Fee',
      value: `${swapSettings.maxGasFee} Gas Units`
    }
  ];

  return (
    <div className={classNames('flex flex-col gap-1 mt-6 px-2', className)}>
      {details.map((detail) => (
        <div className="flex justify-between" key={detail.label}>
          <div className="text-grey-500 label-large-bold laptop:label-small-bold">
            {detail.label}
          </div>
          <div className="label-large-bold text-grey-700 mobile:flex mobile:justify-end mobile:label-small-bold">
            {detail.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SwapDetail;
