import { RawCoinInfo as CoinInfo } from '@manahippo/coin-list';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'resources/icons';

const TokenSteps = ({ tokens, className = '' }: { tokens: CoinInfo[]; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    setIsCompact(ref.current.clientWidth < ref.current.scrollWidth);
  }, []);

  const abbr = tokens.map((t) => t.symbol).join('->');

  return (
    <Tooltip placement="top" title={isCompact ? abbr : ''}>
      <div className={classNames('hippo-token-steps overflow-x-auto', className)} ref={ref}>
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
    </Tooltip>
  );
};

export default TokenSteps;
