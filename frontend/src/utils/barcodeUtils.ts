/** Generate a valid EAN-13 barcode number with Bangladesh prefix (890). */
export function generateEAN13(): string {
  const prefix = '890';
  const body = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
  const partial = prefix + body;
  const digits = partial.split('').map(Number);
  const sum = digits.reduce((acc, d, i) => acc + (i % 2 === 0 ? d : d * 3), 0);
  const check = (10 - (sum % 10)) % 10;
  return partial + check;
}

/** Validate an EAN-13 check digit. */
export function isValidEAN13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  const digits = code.split('').map(Number);
  const sum = digits.slice(0, 12).reduce((acc, d, i) => acc + (i % 2 === 0 ? d : d * 3), 0);
  return (10 - (sum % 10)) % 10 === digits[12];
}
