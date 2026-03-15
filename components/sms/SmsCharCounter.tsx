"use client";

import { AlertTriangle } from "lucide-react";

type Encoding = "GSM-7" | "UCS-2";

interface SmsMetrics {
  charCount: number;
  encoding: Encoding;
  singleLimit: number;
  multiLimit: number;
  segments: number;
  isMultipart: boolean;
  hasUnicodeWarning: boolean;
}

export function getSmsMetrics(message: string): SmsMetrics {
  if (!message) {
    return {
      charCount: 0,
      encoding: "GSM-7",
      singleLimit: 160,
      multiLimit: 153,
      segments: 0,
      isMultipart: false,
      hasUnicodeWarning: false,
    };
  }

  const hasThai = /[\u0E00-\u0E7F]/.test(message);
  const hasNonGsm = /[^\x00-\x7F]/.test(message);
  const isUcs2 = hasThai || hasNonGsm;
  const encoding: Encoding = isUcs2 ? "UCS-2" : "GSM-7";
  const singleLimit = isUcs2 ? 70 : 160;
  const multiLimit = isUcs2 ? 67 : 153;
  const charCount = message.length;
  const segments = isUcs2
    ? charCount <= 70 ? 1 : Math.ceil(charCount / 67)
    : charCount <= 160 ? 1 : Math.ceil(charCount / 153);

  return {
    charCount,
    encoding,
    singleLimit,
    multiLimit,
    segments,
    isMultipart: segments > 1,
    hasUnicodeWarning: isUcs2,
  };
}

export function SmsCharCounter({
  message,
  recipientCount = 0,
  costPerSms,
}: {
  message: string;
  recipientCount?: number;
  costPerSms?: number;
}) {
  const m = getSmsMetrics(message);
  if (!message) {
    return (
      <div className="text-xs text-[var(--text-muted)]">
        0/160 chars · 0 SMS (GSM-7)
      </div>
    );
  }

  const charsPerSegment = m.isMultipart ? m.multiLimit : m.singleLimit;
  const charProgress = Math.min((m.charCount / m.singleLimit) * 100, 100);
  const isOverLimit = m.charCount > m.singleLimit;
  const totalCost = m.segments * Math.max(recipientCount, 1);

  return (
    <div className="space-y-1.5">
      {/* Counter row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)]">
            {m.charCount}/{charsPerSegment} chars · {m.segments} SMS
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium"
            style={{
              background: m.encoding === "UCS-2"
                ? "rgba(var(--warning-rgb,245,158,11),0.08)"
                : "rgba(var(--accent-rgb),0.08)",
              color: m.encoding === "UCS-2" ? "var(--warning)" : "var(--accent)",
            }}
          >
            {m.encoding}
          </span>
        </div>
        {recipientCount > 1 && (
          <span className="text-xs font-semibold text-[var(--accent)]">
            {m.segments} SMS x {recipientCount} = {totalCost}
          </span>
        )}
        {recipientCount <= 1 && m.segments > 0 && (
          <span className={`text-xs font-semibold ${isOverLimit ? "text-[var(--warning)]" : "text-[var(--accent)]"}`}>
            {m.segments} SMS
            {costPerSms !== undefined && ` · ~${(costPerSms * m.segments).toFixed(2)} THB`}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-0.5 rounded-full bg-[var(--border-default)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{
            width: `${charProgress}%`,
            background: isOverLimit ? "var(--warning)" : "var(--accent)",
          }}
        />
      </div>
    </div>
  );
}

export function UnicodeWarning({ message }: { message: string }) {
  const m = getSmsMetrics(message);
  if (!m.hasUnicodeWarning || !message) return null;

  return (
    <div
      className="flex items-start gap-2 p-2.5 rounded-lg text-[12px] leading-relaxed border"
      style={{
        background: "rgba(var(--warning-rgb,245,158,11),0.04)",
        borderColor: "rgba(var(--warning-rgb,245,158,11),0.12)",
        color: "var(--warning)",
      }}
    >
      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
      <span>
        ข้อความมีภาษาไทย/Emoji — limit ลดจาก 160 เหลือ <strong>70 ตัวอักษร/SMS</strong> (UCS-2 encoding, ค่าส่งเพิ่ม ~2.3x)
      </span>
    </div>
  );
}
