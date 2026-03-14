export const MAX_SLIP_ATTEMPTS = 5;

export const SLIP_REJECT_CODES = [
  "DUPLICATE_SLIP",
  "INVALID_SLIP",
  "AMOUNT_MISMATCH",
  "EXPIRED_SLIP",
  "WRONG_ACCOUNT",
  "UNREADABLE_SLIP",
] as const;

export type SlipRejectCode = (typeof SLIP_REJECT_CODES)[number];

export function isSlipRejectCode(value: string | null | undefined): value is SlipRejectCode {
  return typeof value === "string" && (SLIP_REJECT_CODES as readonly string[]).includes(value);
}
