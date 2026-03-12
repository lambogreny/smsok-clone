/**
 * Convert number to Thai text for invoices
 * e.g., 1070 → "หนึ่งพันเจ็ดสิบบาทถ้วน"
 * e.g., 1070.50 → "หนึ่งพันเจ็ดสิบบาทห้าสิบสตางค์"
 */

const THAI_DIGITS = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
const THAI_POSITIONS = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];

/**
 * Thai number system: groups of 6 digits separated by ล้าน.
 * Within each 6-digit group: หน่วย สิบ ร้อย พัน หมื่น แสน
 * Groups: [0]=units, [1]=ล้าน, [2]=ล้านล้าน, etc.
 *
 * 10,000,000 = สิบล้าน (group[1]=10 → "สิบ" + "ล้าน")
 * 1,000,001 = หนึ่งล้านเอ็ด (group[1]=1, group[0]=1)
 */
function intToThaiText(n: number): string {
  if (n === 0) return "ศูนย์";
  if (n < 0) return "ลบ" + intToThaiText(-n);

  // Split into groups of 6 digits
  const groups: number[] = [];
  let remaining = Math.floor(n);
  while (remaining > 0) {
    groups.push(remaining % 1_000_000);
    remaining = Math.floor(remaining / 1_000_000);
  }

  let result = "";
  for (let gi = groups.length - 1; gi >= 0; gi--) {
    const group = groups[gi];
    if (group === 0) {
      // Still need to check if we output ล้าน for skipped zero groups
      continue;
    }

    // Convert 6-digit group to Thai text
    const digits: number[] = [];
    let g = group;
    while (g > 0) {
      digits.push(g % 10);
      g = Math.floor(g / 10);
    }

    // Is this group "not alone"? (has higher groups with non-zero values)
    const hasHigherContent = result.length > 0;

    for (let i = digits.length - 1; i >= 0; i--) {
      const digit = digits[i];
      if (digit === 0) continue;

      // เอ็ด: digit 1 at ones position, when not the entire number
      if (i === 0 && digit === 1 && (digits.length > 1 || hasHigherContent)) {
        result += "เอ็ด";
      } else if (i === 1 && digit === 1) {
        result += "สิบ";
      } else if (i === 1 && digit === 2) {
        result += "ยี่สิบ";
      } else {
        result += THAI_DIGITS[digit];
        if (i > 0) result += THAI_POSITIONS[i];
      }
    }

    // Append ล้าน for each group level above units
    if (gi > 0) result += "ล้าน";
  }

  return result;
}

/**
 * Convert amount to Thai text with บาท/สตางค์
 * @param amount Number amount (can have decimals)
 * @returns Thai text string e.g., "หนึ่งพันเจ็ดสิบบาทถ้วน"
 */
export function numberToThaiText(amount: number): string {
  if (amount === 0) return "ศูนย์บาทถ้วน";

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const baht = Math.floor(absAmount);
  const satang = Math.round((absAmount - baht) * 100);

  let result = "";

  if (isNegative) result += "ลบ";

  if (baht > 0) {
    result += intToThaiText(baht) + "บาท";
  }

  if (satang > 0) {
    if (baht === 0) result += "ศูนย์บาท";
    result += intToThaiText(satang) + "สตางค์";
  } else {
    if (baht === 0) return "ศูนย์บาทถ้วน";
    result += "ถ้วน";
  }

  return result;
}
