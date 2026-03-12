export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "PENDING_REVIEW"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED"
  | "EXPIRED";

export interface SlipVerifyResult {
  verified: boolean;
  amount: number | null;
  bank: string | null;
  date: string | null;
  error: string | null; // "amount_mismatch" | "unreadable" | "fake" | null
}

export const PAYMENT_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PROCESSING", "EXPIRED"],
  PROCESSING: ["COMPLETED", "PENDING_REVIEW", "FAILED"],
  PENDING_REVIEW: ["COMPLETED", "FAILED"],
  COMPLETED: ["REFUNDED"],
  FAILED: [],
  REFUNDED: [],
  EXPIRED: [],
};

/** Calculate VAT 7% — amounts in satang (integer) */
export function calculateVat(amountSatang: number) {
  const vatAmount = Math.round(amountSatang * 7 / 107); // extract VAT from total
  return { amount: amountSatang - vatAmount, vatAmount, totalAmount: amountSatang };
}

/** Generate invoice number: INV-YYYYMM-XXXX */
export function generateInvoiceNumber(sequence: number): string {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `INV-${ym}-${String(sequence).padStart(4, "0")}`;
}
