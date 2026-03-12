/**
 * Shared form utilities — key handlers & input class helpers
 */

import type { KeyboardEvent } from "react";

// ── Key Handlers ──────────────────────────────────────

/** Block non-numeric keys (allow: 0-9, Backspace, Delete, Tab, arrows) */
export function blockNonNumeric(e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
  if (
    e.key.length === 1 &&
    !/[0-9+]/.test(e.key) &&
    !e.ctrlKey && !e.metaKey
  ) {
    e.preventDefault();
  }
}

/** Block Thai characters from email fields */
export function blockThai(e: KeyboardEvent<HTMLInputElement>) {
  if (/[\u0E00-\u0E7F]/.test(e.key)) {
    e.preventDefault();
  }
}

/** Allow only A-Z a-z 0-9 and space (for sender names) */
export function allowAlphaNumericSpace(e: KeyboardEvent<HTMLInputElement>) {
  if (e.key.length === 1 && !/[a-zA-Z0-9 ]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
  }
}

/** Block non-digits (for OTP / amount fields, no + prefix) */
export function blockNonDigit(e: KeyboardEvent<HTMLInputElement>) {
  if (e.key.length === 1 && !/[0-9]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
  }
}

// ── Input Class Helper ────────────────────────────────

/**
 * Returns className for input based on validation state.
 * Appends to base "input-glass" class.
 */
export function fieldCls(error: string | undefined, value: string, extra = ""): string {
  const border = error
    ? "border-red-500/60 focus:border-red-500"
    : value
      ? "border-emerald-500/40 focus:border-emerald-500/60"
      : "";
  return ["input-glass", border, extra].filter(Boolean).join(" ");
}

// ── SMS Counter ───────────────────────────────────────

export function smsCounterText(message: string): string {
  if (!message) return "";
  const hasThai = /[\u0E00-\u0E7F]/.test(message);
  const hasNonGsm = /[^\x00-\x7F]/.test(message);
  const isUcs2 = hasThai || hasNonGsm;
  // Synced with backend (lib/package/quota.ts)
  const count = isUcs2
    ? (message.length <= 70 ? 1 : Math.ceil(message.length / 67))
    : (message.length <= 160 ? 1 : Math.ceil(message.length / 153));
  const encoding = isUcs2 ? "UCS-2: 70/SMS" : "GSM-7: 160/SMS";
  return `${message.length} chars • ${count} SMS (${encoding})`;
}
