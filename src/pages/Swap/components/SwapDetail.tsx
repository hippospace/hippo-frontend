import classNames from 'classnames';
import Button from 'components/Button';
import { useFormikContext } from 'formik';
import useTokenAmountFormatter from 'hooks/useTokenAmountFormatter';
import { useState } from 'react';
import { ExchangeIcon } from 'resources/icons';
import { ISwapSettings } from '../types';
import { RawCoinInfo as CoinInfo } from '@manahippo/coin-list';
import useCoingeckoRate from 'hooks/useCoingecko';
import TextLink from 'components/TextLink';
import { cutDecimals } from 'components/PositiveFloatNumInput/numberFormats';
import { useBinanceRate } from 'hooks/useBinance';
import Hint from 'components/Hint';
import { GeneralRouteAndQuote } from 'types/hippo';

const RateCompare = ({
  rate,
  rateReferrence,
  apiReferrence,
  referrenceName,
  tip
}: {
  rate: number;
  rateReferrence: number;
  apiReferrence: string;
  referrenceName: string;
  tip?: string;
}) => {
  const diff = Math.abs(rate - rateReferrence) / rateReferrence;
  const diffStr = diff < 0.0001 ? '<0.01%' : `${cutDecimals('' + diff * 100, 2)}%`;

  return (
    <div>
      {rate <= rateReferrence && (
        <span className={classNames('text-success-500')}>{diffStr} cheaper than</span>
      )}
      {rate > rateReferrence && diff <= 0.01 && (
        <span className="text-success-500">Within {diffStr}</span>
      )}
      {rate > rateReferrence && diff > 0.01 && (
        <span
          className={classNames({
            'text-error-500': diff >= 0.05,
            'text-warn-500': diff < 0.05
          })}>
          {diffStr} more expensive than
        </span>
      )}{' '}
      <TextLink href={apiReferrence} className="">
        {referrenceName} {tip && <Hint content={tip} />}
      </TextLink>
    </div>
  );
};

const SwapDetail = ({
  routeAndQuote,
  fromToken,
  toToken,
  className = '',
  isPriceImpactEnabled = true
}: {
  routeAndQuote: GeneralRouteAndQuote | null | undefined;
  fromToken: CoinInfo;
  toToken: CoinInfo;
  className?: string;
  isPriceImpactEnabled?: boolean;
}) => {
  const [coingeckoRate, coingeckoApi] = useCoingeckoRate(fromToken, toToken);
  const [binanceRate, binanceApi] = useBinanceRate(fromToken, toToken);

  const { values: swapSettings } = useFormikContext<ISwapSettings>();
  const [isPriceYToX, setIsPriceYToX] = useState(false);
  const [tokenAmountFormatter] = useTokenAmountFormatter();

  let rate: string = '-';
  let output: string = '-';
  let minimum: string = '-';
  let priceImpactText: string = '-';
  let priceImpact = 0;
  let toTokenRate = undefined;
  if (routeAndQuote) {
    const outputUiAmt = routeAndQuote.quote.outputUiAmt;
    output = `${tokenAmountFormatter(outputUiAmt, toToken)} ${toToken?.symbol}`;
    minimum = `${tokenAmountFormatter(
      outputUiAmt * (1 - swapSettings.slipTolerance / 100),
      toToken
    )} ${toToken?.symbol}`;
    priceImpact = Math.abs(routeAndQuote.quote.priceImpact || 0);
    if (isPriceImpactEnabled) {
      priceImpactText = priceImpact >= 0.0001 ? `${(priceImpact * 100).toFixed(2)}%` : '<0.01%';
    }

    const avgPrice = routeAndQuote.quote.outputUiAmt / routeAndQuote.quote.inputUiAmt;
    rate =
      !avgPrice || avgPrice === Infinity
        ? 'n/a'
        : isPriceYToX
        ? `1 ${fromToken?.symbol} ≈ ${tokenAmountFormatter(avgPrice, toToken)} ${toToken?.symbol}`
        : `1 ${toToken?.symbol} ≈ ${tokenAmountFormatter(1 / avgPrice, fromToken)} ${
            fromToken?.symbol
          }`;

    toTokenRate = 1 / avgPrice;
  }

  const details = [
    {
      label: 'Rate',
      value: (
        <div className="flex flex-col items-end mb-1">
          <div
            className="flex items-center cursor-pointer"
            onClick={() => setIsPriceYToX(!isPriceYToX)}>
            <span className="mr-1">{rate}</span>
            <Button variant="icon" className="mobile:hidden">
              <ExchangeIcon className="font-icon body-regular" />
            </Button>
          </div>
          {coingeckoRate &&
            toTokenRate &&
            // for cases when switching tokens
            fromToken.token_type.type === routeAndQuote.route.xCoinInfo.token_type.type &&
            toToken.token_type.type === routeAndQuote.route.yCoinInfo.token_type.type && (
              <RateCompare
                rate={toTokenRate}
                rateReferrence={coingeckoRate}
                apiReferrence={coingeckoApi}
                referrenceName={'CoinGecko rate'}
              />
            )}
          {binanceRate &&
            toTokenRate &&
            // for cases when switching tokens
            fromToken.token_type.type === routeAndQuote.route.xCoinInfo.token_type.type &&
            toToken.token_type.type === routeAndQuote.route.yCoinInfo.token_type.type && (
              <RateCompare
                rate={toTokenRate}
                rateReferrence={binanceRate}
                apiReferrence={binanceApi}
                referrenceName={'Binance rate'}
                tip={'Assuming the ratio of USDC to BUSD is 1:1'}
              />
            )}
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
      value: (
        <div
          className={classNames({
            'text-success-500': isPriceImpactEnabled && priceImpact <= 0.01,
            'text-warn-500': priceImpact > 0.01 && priceImpact <= 0.05 && isPriceImpactEnabled,
            'text-error-500': priceImpact > 0.05 && isPriceImpactEnabled
          })}>
          {priceImpactText}
        </div>
      )
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
