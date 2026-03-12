/**
 * Convert number to Thai Baht text (ตัวอักษรไทย)
 * e.g., 1070 → "หนึ่งพันเจ็ดสิบบาทถ้วน"
 * e.g., 1605.50 → "หนึ่งพันหกร้อยห้าบาทห้าสิบสตางค์"
 */

const THAI_DIGITS = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
const THAI_POSITIONS = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

function convertIntegerPart(num: number): string {
  if (num === 0) return "ศูนย์";

  const numStr = Math.floor(num).toString();
  const len = numStr.length;
  let result = "";

  for (let i = 0; i < len; i++) {
    const digit = parseInt(numStr[i], 10);
    const position = len - i - 1;

    if (digit === 0) continue;

    if (position === 0 && digit === 1 && len > 1) {
      result += "เอ็ด";
    } else if (position === 1 && digit === 1) {
      result += "สิบ";
    } else if (position === 1 && digit === 2) {
      result += "ยี่สิบ";
    } else {
      result += THAI_DIGITS[digit] + THAI_POSITIONS[position % 7];
      if (position >= 7 && position % 6 === 0) {
        result += "ล้าน";
      }
    }
  }

  return result;
}

/**
 * Convert amount in baht (decimal) to Thai text
 * @param amount Amount in baht (e.g., 1605.00)
 */
export function bahtText(amount: number): string {
  if (amount === 0) return "ศูนย์บาทถ้วน";

  const baht = Math.floor(amount);
  const satang = Math.round((amount - baht) * 100);

  let result = convertIntegerPart(baht) + "บาท";

  if (satang === 0) {
    result += "ถ้วน";
  } else {
    result += convertIntegerPart(satang) + "สตางค์";
  }

  return result;
}

/**
 * Convert satang (integer) to Thai text
 * @param satang Amount in satang (e.g., 160500)
 */
export function satangToBahtText(satang: number): string {
  return bahtText(satang / 100);
}

/**
 * Format satang to baht with 2 decimal places
 * @param satang Amount in satang
 */
export function formatBaht(satang: number): string {
  return (satang / 100).toFixed(2);
}
