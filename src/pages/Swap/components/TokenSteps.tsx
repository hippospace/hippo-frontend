import { RawCoinInfo as CoinInfo } from '@manahippo/coin-list';
import classNames from 'classnames';
import { ArrowRight } from 'resources/icons';

const TokenSteps = ({ tokens, className = '' }: { tokens: CoinInfo[]; className: string }) => {
  return (
    <div className={classNames('hippo-token-steps', className)}>
      {tokens
        .map((t) => t.symbol)
        .map((t, index) => {
          if (index === 0) return t;
          else
            return (
              <span key={`r-${index}`}>
                <ArrowRight className="font-icon inline-block mx-[2px]" />
                {t}
              </span>
            );
        })}
    </div>
  );
};

export default TokenSteps;
