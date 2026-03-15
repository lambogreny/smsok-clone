"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

// Path segment → Thai label
const LABELS: Record<string, string> = {
  dashboard: "แดชบอร์ด",
  send: "ส่ง SMS",
  messages: "ข้อความ",
  campaigns: "แคมเปญ",
  contacts: "ผู้ติดต่อ",
  groups: "กลุ่ม",
  templates: "เทมเพลต",
  analytics: "วิเคราะห์",
  billing: "การเงิน",
  packages: "แพ็กเกจ",
  orders: "คำสั่งซื้อ",
  topup: "เติม SMS",
  checkout: "ชำระเงิน",
  success: "สำเร็จ",
  history: "ประวัติ",
  invoices: "ใบกำกับภาษี",
  quotations: "ใบเสนอราคา",
  credits: "โควต้า",
  settings: "ตั้งค่า",
  profile: "โปรไฟล์",
  security: "ความปลอดภัย",
  team: "ทีม",
  roles: "บทบาท",
  activity: "กิจกรรม",
  privacy: "ความเป็นส่วนตัว",
  pdpa: "PDPA",
  consent: "ความยินยอม",
  requests: "คำขอข้อมูล",
  retention: "การเก็บข้อมูล",
  optout: "ยกเลิกรับข้อมูล",
  webhooks: "Webhooks",
  "api-keys": "API Keys",
  "api-docs": "API Docs",
  tags: "แท็ก",
  scheduled: "ตั้งเวลา",
};

export default function DashboardBreadcrumb() {
  const pathname = usePathname();

  if (!pathname || pathname === "/dashboard") return null;

  const segments = pathname
    .replace(/^\/dashboard\/?/, "")
    .split("/")
    .filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => {
    const href = "/dashboard/" + segments.slice(0, i + 1).join("/");
    const label = LABELS[seg] || seg;
    const isLast = i === segments.length - 1;
    // UUID-like segments → shorten
    const displayLabel = seg.length > 20 ? `#${seg.slice(0, 8)}` : label;
    return { href, label: displayLabel, isLast };
  });

  return (
    <nav aria-label="breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 text-[12px]">
        <li>
          <Link
            href="/dashboard"
            className="flex items-center gap-1 transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <Home size={12} />
            <span>หน้าหลัก</span>
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-1">
            <ChevronRight size={12} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
            {crumb.isLast ? (
              <span
                className="font-medium"
                style={{ color: "var(--text-secondary)" }}
                aria-current="page"
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="transition-colors hover:underline"
                style={{ color: "var(--text-muted)" }}
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
