type StatusBadgeProps = {
  status: string;
  size?: "sm" | "md";
};

const statusConfig: Record<string, { badge: string; label: string; dot: string }> = {
  delivered: {
    badge: "badge-success",
    label: "ส่งสำเร็จ",
    dot: "bg-emerald-400",
  },
  sent: {
    badge: "badge-info",
    label: "ส่งแล้ว",
    dot: "bg-blue-400",
  },
  pending: {
    badge: "badge-warning",
    label: "รอส่ง",
    dot: "bg-yellow-400",
  },
  failed: {
    badge: "badge-error",
    label: "ล้มเหลว",
    dot: "bg-red-400",
  },
  approved: {
    badge: "badge-success",
    label: "อนุมัติแล้ว",
    dot: "bg-emerald-400",
  },
  rejected: {
    badge: "badge-error",
    label: "ถูกปฏิเสธ",
    dot: "bg-red-400",
  },
  active: {
    badge: "badge-success",
    label: "ใช้งาน",
    dot: "bg-emerald-400",
  },
  inactive: {
    badge: "badge-error",
    label: "ปิดใช้งาน",
    dot: "bg-red-400",
  },
};

const DEFAULT_CONFIG = {
  badge: "badge-neutral",
  label: "ไม่ทราบ",
  dot: "bg-gray-400",
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = statusConfig[status] ?? DEFAULT_CONFIG;
  const sizeClasses = size === "sm" ? "text-[10px] px-2.5 py-0.5" : "text-xs px-3 py-1";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md font-semibold uppercase tracking-wider ${config.badge} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
