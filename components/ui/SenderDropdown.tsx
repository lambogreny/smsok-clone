"use client";

import { useEffect } from "react";
import CustomSelect from "./CustomSelect";

/**
 * Shared SenderDropdown — used in SendSmsForm, CampaignsClient, and any page with sender field.
 * - Shows only DB-approved senders (no hardcoded defaults)
 * - If only 1 sender → auto-select, show static display
 * - If multiple approved senders → show dropdown
 * - If no senders → show warning
 */
export default function SenderDropdown({
  value,
  onChange,
  senderNames = [],
}: {
  value: string;
  onChange: (v: string) => void;
  senderNames?: string[];
}) {
  // Auto-select when only 1 sender available
  useEffect(() => {
    if (senderNames.length === 1 && !value) onChange(senderNames[0]);
  }, [senderNames, value, onChange]);

  if (senderNames.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] px-3 py-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)]">
          <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
          ยังไม่มีชื่อผู้ส่งที่อนุมัติ
        </div>
        <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
          <a href="/dashboard/senders" className="text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors">
            ขอ Sender Name →
          </a>
        </p>
      </div>
    );
  }

  if (senderNames.length === 1) {
    return (
      <div>
        <div className="flex items-center gap-2 text-sm text-white pointer-events-none px-3 py-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
          {senderNames[0]}
        </div>
        <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
          Sender ที่ผ่านอนุมัติแล้ว —{" "}
          <a href="/dashboard/senders" className="text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors">
            ขอ Sender Name ใหม่ →
          </a>
        </p>
      </div>
    );
  }

  return (
    <div>
      <CustomSelect
        value={value}
        onChange={onChange}
        options={senderNames.map((name) => ({ value: name, label: name }))}
      />
      <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
        Sender ที่ผ่านอนุมัติแล้ว —{" "}
        <a href="/dashboard/senders" className="text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors">
          ขอ Sender Name ใหม่ →
        </a>
      </p>
    </div>
  );
}
