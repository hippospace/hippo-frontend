import invariant from 'tiny-invariant';

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

export const numberGroupFormat = (amount: number, decimals = 2) => {
  return numToGrouped(cutDecimals(avoidScientificNotation(amount), decimals));
};

export const numberOfAbbr = (amount: number, decimals = 0) => {
  const grades = [
    { dec: 9, abbr: 'B' },
    { dec: 6, abbr: 'M' },
    { dec: 3, abbr: 'K' }
  ].sort((a, b) => b.dec - a.dec);
  for (const g of grades) {
    if (amount > 10 ** g.dec) {
      return cutDecimals(avoidScientificNotation(amount / 10 ** g.dec), decimals) + g.abbr;
    }
  }
  return '' + amount;
};
