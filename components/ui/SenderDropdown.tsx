"use client";

import CustomSelect from "./CustomSelect";

/**
 * Shared SenderDropdown — used in SendSmsForm, CampaignsClient, and any page with sender field.
 * - Dropdown only, no typing allowed
 * - If only 1 sender (EasySlip) → auto-select, show static display
 * - If multiple approved senders → show dropdown
 */
export default function SenderDropdown({
  value,
  onChange,
  senderNames = ["EasySlip"],
}: {
  value: string;
  onChange: (v: string) => void;
  senderNames?: string[];
}) {
  const customSenders = senderNames.filter((n) => n !== "EasySlip");
  const hasMultiple = customSenders.length > 0;

  if (!hasMultiple) {
    return (
      <div>
        <div className="input-glass flex items-center gap-2 text-sm text-white pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
          EasySlip
          <span className="text-[11px] text-[var(--text-muted)] ml-auto">ค่าเริ่มต้น</span>
        </div>
        <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
          ใช้ชื่อค่าเริ่มต้น —{" "}
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
        options={[
          { value: "EasySlip", label: "EasySlip (ค่าเริ่มต้น)" },
          ...customSenders.map((name) => ({ value: name, label: name })),
        ]}
      />
      <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
        {value === "EasySlip" ? "ใช้ชื่อค่าเริ่มต้นได้เลย หรือ" : "Sender ที่ผ่านอนุมัติแล้ว — "}
        <a href="/dashboard/senders" className="text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors">
          ขอ Sender Name ใหม่ →
        </a>
      </p>
    </div>
  );
}
