/**
 * Sender Name Validation — กสทช. (NBTC) naming rules
 */

const NAME_REGEX = /^[A-Za-z0-9.\-_ ]{3,11}$/;

const BLOCKED_WORDS = [
  "OTP", "SMS", "NOTICE", "VERIFY", "ALERT", "INFO",
  "CASINO", "LOAN", "BET", "SLOT", "GAMBLE",
  "AIS", "TRUE", "DTAC", "NT", "NBTC",
];

const BLOCKED_SHORTENERS = [
  "bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly",
  "is.gd", "buff.ly", "rebrand.ly", "cutt.ly", "shorturl.at",
];

export type ValidationResult = {
  valid: boolean;
  checks: Array<{ rule: string; passed: boolean; message: string }>;
};

export function validateSenderName(name: string): ValidationResult {
  const checks: ValidationResult["checks"] = [];

  // Length check
  checks.push({
    rule: "length",
    passed: name.length >= 3 && name.length <= 11,
    message: `ความยาว: ${name.length} ตัว (ต้อง 3-11)`,
  });

  // Character check
  checks.push({
    rule: "characters",
    passed: NAME_REGEX.test(name),
    message: NAME_REGEX.test(name)
      ? "อักขระถูกต้อง"
      : "อนุญาตเฉพาะ A-Z, 0-9, .-_ เท่านั้น",
  });

  // Blocked words check
  const upper = name.toUpperCase();
  const hasBlocked = BLOCKED_WORDS.some((w) => upper.includes(w));
  checks.push({
    rule: "blocked_words",
    passed: !hasBlocked,
    message: hasBlocked ? "ชื่อมีคำต้องห้าม" : "ไม่ใช่คำต้องห้าม",
  });

  return {
    valid: checks.every((c) => c.passed),
    checks,
  };
}

export function validateUrls(urls: string[]): { valid: boolean; blocked: string[] } {
  const blocked: string[] = [];
  for (const url of urls) {
    const lower = url.toLowerCase();
    for (const shortener of BLOCKED_SHORTENERS) {
      if (lower.includes(shortener)) {
        blocked.push(url);
        break;
      }
    }
  }
  return { valid: blocked.length === 0, blocked };
}
