"use client";

import { getSmsMetrics } from "./SmsCharCounter";

const SAMPLE_DATA: Record<string, string> = {
  name: "สมชาย",
  code: "482910",
  date: "12/03/2026",
  amount: "1,500",
  phone: "089-123-4567",
  company: "บริษัท ตัวอย่าง จำกัด",
  order_id: "ORD-20260312",
};

function substituteVariables(text: string): string {
  return text.replace(/\{\{(\w+)(?:\|([^}]*))?\}\}/g, (_match, key: string, fallback?: string) => {
    return SAMPLE_DATA[key] || fallback || `[${key}]`;
  });
}

function highlightVariablesInPreview(text: string) {
  const parts = text.split(/(\{\{[^}]+\}\})/g);
  return parts.map((part, i) => {
    if (/^\{\{.+\}\}$/.test(part)) {
      const inner = part.replace(/^\{\{|\}\}$/g, "");
      const [key, ...rest] = inner.split("|");
      const fallback = rest.join("|"); // preserve fallback if contains |
      const resolved = SAMPLE_DATA[key] || fallback || key;
      return (
        <span
          key={i}
          className="text-[var(--accent)] font-medium underline decoration-dotted underline-offset-2"
        >
          {resolved}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function PhonePreview({
  message,
  senderName = "SMS",
  showSampleData = true,
}: {
  message: string;
  senderName?: string;
  showSampleData?: boolean;
}) {
  const m = getSmsMetrics(message);

  return (
    <div className="flex flex-col items-center">
      {/* Phone frame */}
      <div
        className="w-full max-w-[280px] rounded-[24px] border-2 overflow-hidden"
        style={{
          borderColor: "var(--border-default)",
          background: "var(--bg-base)",
        }}
      >
        {/* Status bar */}
        <div
          className="flex items-center justify-between px-4 py-1.5 text-[10px]"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          <span className="text-[var(--text-muted)]">SMS</span>
          <span className="text-[var(--text-muted)]">
            {m.segments > 0 && `${m.segments} SMS · ${m.encoding}`}
          </span>
        </div>

        {/* Sender header */}
        <div
          className="px-4 py-2.5 border-b text-center"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div className="text-[11px] text-[var(--text-muted)]">From</div>
          <div className="text-[13px] font-semibold text-[var(--accent)]">{senderName}</div>
        </div>

        {/* Message area */}
        <div className="px-3 py-4 min-h-[140px] max-h-[240px] overflow-y-auto">
          {message ? (
            <div
              className="max-w-[85%] rounded-lg rounded-tl-sm px-3.5 py-2.5 text-[13px] leading-relaxed"
              style={{
                background: "rgba(var(--accent-rgb),0.08)",
                border: "1px solid rgba(var(--accent-rgb),0.12)",
                color: "var(--text-primary)",
              }}
            >
              <span className="whitespace-pre-wrap break-words">
                {showSampleData ? highlightVariablesInPreview(message) : message}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[100px]">
              <span className="text-[12px] text-[var(--text-muted)]">
                ข้อความจะแสดงที่นี่...
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-4 py-2 border-t text-center"
          style={{ borderColor: "var(--border-default)" }}
        >
          <span className="text-[10px] text-[var(--text-muted)]">
            {message
              ? `${m.charCount} chars · ${m.encoding} · ${m.segments} segment${m.segments !== 1 ? "s" : ""}`
              : "Preview"}
          </span>
        </div>
      </div>

      {/* Sample data toggle hint */}
      {showSampleData && message && /\{\{.+\}\}/.test(message) && (
        <p className="text-[10px] text-[var(--text-muted)] mt-2 text-center">
          ตัวแปรแสดงด้วย <span className="text-[var(--accent)]">ข้อมูลตัวอย่าง</span>
        </p>
      )}
    </div>
  );
}
