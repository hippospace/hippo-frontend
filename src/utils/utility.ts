/** Convert string to hex-encoded utf-8 bytes. */
export const stringToHex = (text: string) => {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(text);
  return Array.from(encoded, (i) => i.toString(16).padStart(2, '0')).join('');
};

export const walletAddressEllipsis = (address: string | undefined) => {
  if (!address) {
    return '';
  }
  return address.slice(0, 4) + '...' + address.slice(-6);
};

export const addDays = (date: Date, days: number) => {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
