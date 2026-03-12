/**
 * Safe error messages for user-facing UI.
 * NEVER expose raw error.message, stack traces, or server internals.
 */

const GENERIC = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";

/** Known safe messages from our own server actions (Thai user-facing strings) */
const SAFE_PATTERNS = [
  // Auth
  "อีเมลนี้ถูกใช้งานแล้ว",
  "เบอร์โทรนี้ถูกใช้งานแล้ว",
  "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  "OTP ไม่ถูกต้อง",
  "OTP หมดอายุ",
  "กรุณารอ",
  "รหัสผ่านปัจจุบันไม่ถูกต้อง",
  // Validation (Zod Thai messages)
  "กรุณากรอก",
  "ต้องมีอย่างน้อย",
  "ต้องไม่เกิน",
  "ไม่ถูกต้อง",
  "รหัสผ่านไม่ตรงกัน",
  // Credits / SMS
  "เครดิตไม่เพียงพอ",
  "เครดิต SMS ไม่เพียงพอ",
  "SMS ไม่เพียงพอ",
  "ไม่พบ",
  "ชื่อผู้ส่ง",
  "กรุณาเลือก",
  "ไฟล์สลิป",
];

/**
 * Returns a safe user-facing error message.
 * Only passes through known Thai messages from our server actions.
 * Everything else gets the generic message.
 */
export function safeErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return GENERIC;

  const msg = error.message;

  // Allow known safe messages from our server actions
  if (SAFE_PATTERNS.some((pattern) => msg.includes(pattern))) {
    return msg;
  }

  return GENERIC;
}
