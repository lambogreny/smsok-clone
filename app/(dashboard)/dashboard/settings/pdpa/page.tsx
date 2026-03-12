"use client";

import Link from "next/link";
import {
  Shield,
  Link2,
  ClipboardList,
  Clock,
  ArrowRight,
  FileText,
  Check,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PageLayout, { PageHeader } from "@/components/blocks/PageLayout";

/* ─── Config ─── */

const PDPA_CARDS = [
  {
    icon: Shield,
    iconColor: "var(--accent)",
    iconBg: "rgba(var(--accent-rgb),0.08)",
    title: "การจัดการความยินยอม",
    description: "จัดการ consent ของผู้ติดต่อแต่ละราย",
    href: "/dashboard/settings/pdpa/consent",
    action: "จัดการ",
    badge: null,
  },
  {
    icon: Link2,
    iconColor: "var(--info)",
    iconBg: "rgba(var(--info-rgb),0.08)",
    title: "ลิงก์ยกเลิกการรับ",
    description: "สร้าง opt-out link สำหรับใส่ใน SMS",
    href: "/dashboard/settings/pdpa/optout",
    action: "ตั้งค่า",
    badge: null,
  },
  {
    icon: ClipboardList,
    iconColor: "var(--warning)",
    iconBg: "rgba(var(--warning-rgb),0.08)",
    title: "คำขอสิทธิ์ข้อมูล",
    description: "จัดการ data subject rights requests",
    href: "/dashboard/settings/pdpa/requests",
    action: "จัดการ",
    badge: { text: "คำขอรอดำเนินการ: 3", color: "var(--warning)", bg: "rgba(var(--warning-rgb),0.08)" },
  },
  {
    icon: Clock,
    iconColor: "var(--success)",
    iconBg: "rgba(var(--success-rgb),0.08)",
    title: "นโยบายเก็บข้อมูล",
    description: "ตั้งค่า retention period ของข้อมูล",
    href: "/dashboard/settings/pdpa/retention",
    action: "ตั้งค่า",
    badge: { text: "✓ ตั้งค่าแล้ว", color: "var(--success)", bg: "rgba(var(--success-rgb),0.08)" },
  },
];

const LEGAL_DOCS = [
  { name: "Privacy Policy (TH)", done: true },
  { name: "Privacy Policy (EN)", done: true },
  { name: "Terms of Service", done: true },
  { name: "Acceptable Use Policy", done: false },
  { name: "Cookie Policy", done: false },
];

/* ─── Main Component ─── */

export default function PdpaHubPage() {
  return (
    <PageLayout>
      <PageHeader
        title="PDPA และความเป็นส่วนตัว"
        description="จัดการการยินยอมและข้อมูลส่วนบุคคลตาม PDPA"
      />

      {/* Hub Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {PDPA_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ background: card.iconBg }}
                >
                  <Icon className="w-5 h-5" style={{ color: card.iconColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                    {card.title}
                  </h3>
                  <p className="text-[13px] text-[var(--text-secondary)] mb-3 line-clamp-2">
                    {card.description}
                  </p>
                  {card.badge && (
                    <span
                      className="inline-flex text-[11px] font-medium px-2.5 py-1 rounded-full mb-3"
                      style={{ background: card.badge.bg, color: card.badge.color }}
                    >
                      {card.badge.text}
                    </span>
                  )}
                  <Link href={card.href}>
                    <span className="flex items-center gap-1 text-[13px] font-medium text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors cursor-pointer">
                      {card.action} <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legal Documents */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-[var(--text-secondary)]" />
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            เอกสารทางกฎหมาย
          </h3>
        </div>

        <div className="space-y-3">
          {LEGAL_DOCS.map((doc) => (
            <div
              key={doc.name}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-2">
                {doc.done ? (
                  <Check className="w-4 h-4 text-[var(--success)]" />
                ) : (
                  <Circle className="w-4 h-4 text-[var(--text-muted)]" />
                )}
                <span
                  className={`text-sm ${
                    doc.done ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                  }`}
                >
                  {doc.name}
                </span>
              </div>
              <div className="flex gap-2">
                {doc.done ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs"
                    >
                      ดู
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs"
                    >
                      แก้ไข
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[var(--accent)] hover:text-[var(--accent)]/80 text-xs gap-1"
                  >
                    สร้าง <ArrowRight className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
