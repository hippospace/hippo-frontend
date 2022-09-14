import { AggregatorTypes } from '@manahippo/hippo-sdk';
import Button from 'components/Button';
import { useFormikContext } from 'formik';
import useTokenAmountFormatter from 'hooks/useTokenAmountFormatter';
import { useState } from 'react';
import { ExchangeIcon } from 'resources/icons';
import { ISwapSettings } from '../types';

const SwapDetail = ({
  routeAndQuote,
  fromSymbol,
  toSymbol
}: {
  routeAndQuote: AggregatorTypes.RouteAndQuote;
  fromSymbol: string;
  toSymbol: string;
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
  const priceImpact = `${((routeAndQuote.quote.priceImpact || 0) * 100).toFixed(2)}%`;

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
      label: 'Minimum Received after Slippage',
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
    <div className="flex flex-col gap-2 mt-6 px-2">
      {details.map((detail) => (
        <div className="flex justify-between mobile:block mobile:mb-1" key={detail.label}>
          <div className="small font-bold text-grey-500">{detail.label}</div>
          <div className="small font-bold text-grey-900 mobile:flex mobile:justify-end">
            {detail.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SwapDetail;
