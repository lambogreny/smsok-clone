import { cn } from "@/lib/utils";

/* ─── Types ─── */

export type StatusVariant =
  | "pending" | "approved" | "rejected" | "draft"
  | "sent" | "delivered" | "failed" | "scheduled"
  | "active" | "inactive" | "expired"
  | "open" | "closed" | "in_progress";

interface StatusBadgeProps {
  status: StatusVariant | (string & {});
  label?: string;
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

/* ─── Config ─── */

const STATUS_CONFIG: Record<StatusVariant, { bg: string; color: string; label: string }> = {
  // Approval flow
  pending:     { bg: "rgba(245,158,11,0.08)",  color: "var(--warning)", label: "รอตรวจสอบ" },
  approved:    { bg: "rgba(16,185,129,0.08)",   color: "var(--success)", label: "อนุมัติแล้ว" },
  rejected:    { bg: "rgba(239,68,68,0.08)",    color: "var(--error)",   label: "ปฏิเสธ" },
  draft:       { bg: "rgba(85,102,119,0.08)",   color: "var(--neutral)", label: "แบบร่าง" },

  // SMS delivery
  sent:        { bg: "rgba(59,130,246,0.08)",   color: "var(--info)",    label: "ส่งแล้ว" },
  delivered:   { bg: "rgba(16,185,129,0.08)",   color: "var(--success)", label: "สำเร็จ" },
  failed:      { bg: "rgba(239,68,68,0.08)",    color: "var(--error)",   label: "ล้มเหลว" },
  scheduled:   { bg: "rgba(59,130,246,0.08)",   color: "var(--info)",    label: "ตั้งเวลา" },

  // General
  active:      { bg: "rgba(16,185,129,0.08)",   color: "var(--success)", label: "ใช้งาน" },
  inactive:    { bg: "rgba(85,102,119,0.08)",   color: "var(--neutral)", label: "ปิดใช้งาน" },
  expired:     { bg: "rgba(239,68,68,0.08)",    color: "var(--error)",   label: "หมดอายุ" },

  // Support
  open:        { bg: "rgba(245,158,11,0.08)",   color: "var(--warning)", label: "เปิด" },
  closed:      { bg: "rgba(85,102,119,0.08)",   color: "var(--neutral)", label: "ปิดแล้ว" },
  in_progress: { bg: "rgba(59,130,246,0.08)",   color: "var(--info)",    label: "กำลังดำเนินการ" },
};

/* ─── Component ─── */

const DEFAULT_STATUS: { bg: string; color: string; label: string } = {
  bg: "rgba(85,102,119,0.08)",
  color: "var(--text-muted)",
  label: "ไม่ทราบ",
};

export function StatusBadge({ status, label, size = "sm", dot = true, className }: StatusBadgeProps) {
  const config = (STATUS_CONFIG as Record<string, { bg: string; color: string; label: string }>)[status] ?? DEFAULT_STATUS;
  const displayLabel = label ?? config.label;

  return (
    <span
      aria-label={`สถานะ: ${displayLabel}`}
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold",
        size === "sm" && "text-[11px] px-2 py-0.5 rounded-full",
        size === "md" && "text-xs px-2.5 py-1 rounded-full",
        className,
      )}
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: config.color }}
        />
      )}
      {displayLabel}
    </span>
  );
}
