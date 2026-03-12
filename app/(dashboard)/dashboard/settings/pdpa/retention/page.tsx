"use client";

import { useState } from "react";
import {
  MessageSquare,
  Users,
  BarChart3,
  CreditCard,
  KeyRound,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import CustomSelect from "@/components/ui/CustomSelect";
import PageLayout, { PageHeader } from "@/components/blocks/PageLayout";

/* ─── Types ─── */

type RetentionRow = {
  id: string;
  icon: typeof MessageSquare;
  iconColor: string;
  title: string;
  subtitle: string;
  period: string;
  autoPurge: boolean;
  locked?: boolean;
  lockedReason?: string;
};

/* ─── Config ─── */

const PERIOD_OPTIONS = [
  { value: "30d", label: "30 วัน" },
  { value: "60d", label: "60 วัน" },
  { value: "90d", label: "90 วัน" },
  { value: "6m", label: "6 เดือน" },
  { value: "1y", label: "1 ปี" },
  { value: "2y", label: "2 ปี" },
  { value: "5y", label: "5 ปี" },
];

const INITIAL_ROWS: RetentionRow[] = [
  {
    id: "sms-logs",
    icon: MessageSquare,
    iconColor: "var(--info)",
    title: "SMS Logs",
    subtitle: "ข้อความ SMS ที่ส่ง",
    period: "90d",
    autoPurge: false,
  },
  {
    id: "contacts",
    icon: Users,
    iconColor: "var(--accent)",
    title: "ข้อมูลผู้ติดต่อ",
    subtitle: "จนกว่าจะ opt-out + 30 วัน",
    period: "90d",
    autoPurge: false,
  },
  {
    id: "audit-logs",
    icon: BarChart3,
    iconColor: "var(--warning)",
    title: "Audit Logs",
    subtitle: "ประวัติกิจกรรม",
    period: "2y",
    autoPurge: true,
  },
  {
    id: "billing",
    icon: CreditCard,
    iconColor: "var(--success)",
    title: "Billing Records",
    subtitle: "ข้อมูลการเงิน",
    period: "5y",
    autoPurge: true,
    locked: true,
    lockedReason: "กฎหมายกำหนด",
  },
  {
    id: "api-logs",
    icon: KeyRound,
    iconColor: "var(--text-muted)",
    title: "API Logs",
    subtitle: "",
    period: "90d",
    autoPurge: false,
  },
];

/* ─── Main Component ─── */

export default function RetentionPage() {
  const [rows, setRows] = useState(INITIAL_ROWS);

  function updateRow(id: string, field: "period" | "autoPurge", value: string | boolean) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      )
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="นโยบายเก็บรักษาข้อมูล"
        description="ตั้งค่าระยะเวลาเก็บข้อมูลตาม PDPA"
      />

      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden mb-5">
        {/* Header */}
        <div className="grid grid-cols-[1fr_160px_120px] gap-x-4 px-5 py-3 bg-[var(--table-header)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          <span>ประเภทข้อมูล</span>
          <span>ระยะเวลา</span>
          <span className="text-center">ลบอัตโนมัติ</span>
        </div>

        {/* Rows */}
        {rows.map((row, i) => {
          const Icon = row.icon;
          return (
            <div
              key={row.id}
              className={`grid grid-cols-[1fr_160px_120px] gap-x-4 items-center px-5 py-4 border-b border-[var(--table-border)] ${
                row.locked ? "opacity-60" : ""
              } ${i % 2 === 1 ? "bg-[var(--table-alt-row)]" : ""}`}
            >
              {/* Data Type */}
              <div className="flex items-center gap-3">
                <Icon
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: row.iconColor }}
                />
                <div>
                  <div className="text-sm text-[var(--text-primary)] font-medium">
                    {row.title}
                  </div>
                  {row.subtitle && (
                    <div className="text-xs text-[var(--text-muted)]">
                      {row.subtitle}
                    </div>
                  )}
                </div>
              </div>

              {/* Period Select */}
              <CustomSelect
                value={row.period}
                onChange={(v) => updateRow(row.id, "period", v)}
                options={PERIOD_OPTIONS}
                placeholder="เลือก"
              />

              {/* Auto Purge Toggle */}
              <div className="flex items-center justify-center gap-2">
                {row.locked ? (
                  <span className="text-[11px] text-[var(--error)]">
                    ❌ ไม่สามารถปิด
                  </span>
                ) : (
                  <Switch
                    checked={row.autoPurge}
                    onCheckedChange={(v) => updateRow(row.id, "autoPurge", v)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Warning Banner */}
      <div className="rounded-xl border-l-[3px] border-[var(--warning)] bg-[rgba(var(--warning-rgb),0.06)] px-4 py-3 mb-5">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-[var(--warning)] mt-0.5 flex-shrink-0" />
          <div className="text-[13px] text-[var(--text-secondary)]">
            <p>การลบข้อมูลจะดำเนินการอัตโนมัติทุก 00:00 UTC</p>
            <p>ข้อมูล billing ต้องเก็บ 5 ปีตามกฎหมายภาษี</p>
          </div>
        </div>
      </div>

      <Button className="bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--text-on-accent)] font-semibold rounded-xl">
        บันทึกการตั้งค่า
      </Button>
    </PageLayout>
  );
}
