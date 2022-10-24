import { useMediaQuery } from 'react-responsive';
import invariant from 'tiny-invariant';
import { config } from 'utils/tailwindCfg';
const breakpoints = config.theme.screens;

export type BreakpointKey = 'desktop' | 'laptop' | 'tablet' | 'mobile';

export function useBreakpoint(breakpointKey: BreakpointKey) {
  const breakPoint = breakpoints[breakpointKey].max as string;
  invariant(
    breakPoint && typeof breakPoint === 'string',
    `Invalid breakpoint ${breakPoint} for key ${breakpointKey}`
  );
  const bool = useMediaQuery({
    query: `(max-width: ${breakPoint})`
  });
  const capitalizedKey = breakpointKey[0].toUpperCase() + breakpointKey.substring(1);
  type Key = `is${Capitalize<BreakpointKey>}`;
  return {
    [`is${capitalizedKey}`]: bool
  } as Record<Key, boolean>;
}
