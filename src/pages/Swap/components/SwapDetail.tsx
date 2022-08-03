import { RouteAndQuote } from '@manahippo/hippo-sdk/dist/aggregator/types';
import Button from 'components/Button';
import { useFormikContext } from 'formik';
import { useState } from 'react';
import { ExchangeIcon } from 'resources/icons';
import { ISwapSettings } from '../types';

const SwapDetail = ({
  routeAndQuote,
  fromSymbol,
  toSymbol
}: {
  routeAndQuote: RouteAndQuote;
  fromSymbol: string;
  toSymbol: string;
}) => {
  const { values: swapSettings } = useFormikContext<ISwapSettings>();
  const [isPriceYToX, setIsPriceYToX] = useState(true);

  const outputUiAmt = routeAndQuote.quote.outputUiAmt;
  const output = `${outputUiAmt.toFixed(4)} ${toSymbol}`;
  const minimum = `${(outputUiAmt * (1 - swapSettings.slipTolerance / 100)).toFixed(
    4
  )} ${toSymbol}`;
  const priceImpact = `${((routeAndQuote.quote.priceImpact || 0) * 100).toFixed(2)}%`;

  const avgPrice = routeAndQuote.quote.outputUiAmt / routeAndQuote.quote.inputUiAmt;
  const rate =
    !avgPrice || avgPrice === Infinity
      ? 'n/a'
      : isPriceYToX
      ? `1 ${fromSymbol} ≈ ${avgPrice} ${toSymbol}`
      : `1 ${toSymbol} ≈ ${1 / avgPrice} ${fromSymbol}`;

  const details = [
    {
      label: 'Rate',
      value: (
        <div className="flex items-center">
          <span className="mr-1">{rate}</span>
          <Button variant="icon" onClick={() => setIsPriceYToX(!isPriceYToX)}>
            <ExchangeIcon className="font-icon" />
          </Button>
        </div>
      )
    },
    {
      label: 'Expected Output',
      value: output
    },
    {
      label: 'Minimum received after slippage',
      value: minimum
    },
    {
      label: 'Price Impact',
      value: priceImpact
    },
    {
      label: 'Slippage tolerance',
      value: `${swapSettings.slipTolerance} %`
    }
  ];

  return (
    <div className="flex flex-col gap-2 py-4 mt-6 -mb-6 px-2">
      {details.map((detail) => (
        <div className="flex justify-between" key={detail.label}>
          <small className="font-bold text-grey-900">{detail.label}</small>
          <small className="font-bold text-grey-900">{detail.value}</small>
        </div>
      ))}
    </div>
  );
};

export default SwapDetail;
