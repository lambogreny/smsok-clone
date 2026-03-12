/**
 * Thai VAT & WHT Calculation
 * VAT 7% (standard rate), WHT 3% (service)
 * All amounts rounded to 2 decimal places per Thai accounting standard
 */

const VAT_RATE = 7; // percent
const WHT_RATE = 3; // percent for service

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Calculate VAT from amount (exclusive)
 * amount = ราคาก่อน VAT
 */
export function calculateVat(amount: number) {
  const subtotal = round2(amount);
  const vat7pct = round2(subtotal * VAT_RATE / 100);
  const total = round2(subtotal + vat7pct);

  return { subtotal, vatRate: VAT_RATE, vat7pct, total };
}

/**
 * Calculate VAT + WHT from amount (exclusive)
 * WHT 3% is calculated from subtotal (before VAT)
 * Net payable = subtotal + VAT - WHT
 */
export function calculateWithWht(amount: number) {
  const subtotal = round2(amount);
  const vat = round2(subtotal * VAT_RATE / 100);
  const wht3pct = round2(subtotal * WHT_RATE / 100);
  const total = round2(subtotal + vat);
  const netPayable = round2(total - wht3pct);

  return {
    subtotal,
    vatRate: VAT_RATE,
    vat,
    whtRate: WHT_RATE,
    wht3pct,
    total,
    netPayable,
  };
}

/**
 * Extract VAT from VAT-inclusive amount
 * totalInclVat = ราคารวม VAT แล้ว
 */
export function extractVatFromInclusive(totalInclVat: number) {
  const subtotal = round2(totalInclVat / (1 + VAT_RATE / 100));
  const vat = round2(totalInclVat - subtotal);

  return { subtotal, vat, total: round2(totalInclVat) };
}

export { VAT_RATE, WHT_RATE, round2 };
