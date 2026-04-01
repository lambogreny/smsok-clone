"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Mail,
  MessageSquare,
  CreditCard,
  BarChart3,
  FileText,
  Shield,
  Package,
  Loader2,
  Check,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PageLayout, { PageHeader } from "@/components/blocks/PageLayout";

/* ─── Types ─── */

type NotificationPrefs = {
  emailCreditLow: boolean;
  emailCampaignDone: boolean;
  emailWeeklyReport: boolean;
  emailPackageExpiry: boolean;
  emailInvoice: boolean;
  emailSecurity: boolean;
  smsCreditLow: boolean;
  smsCampaignDone: boolean;
};

type PrefKey = keyof NotificationPrefs;

type NotificationGroup = {
  title: string;
  icon: typeof Bell;
  accentColor: string;
  accentRgb: string;
  items: {
    key: PrefKey;
    label: string;
    description: string;
    channel: "email" | "sms";
  }[];
};

/* ─── Config ─── */

const GROUPS: NotificationGroup[] = [
  {
    title: "การเงิน & เครดิต",
    icon: CreditCard,
    accentColor: "var(--warning)",
    accentRgb: "var(--warning-rgb)",
    items: [
      {
        key: "emailCreditLow",
        label: "เครดิตเหลือน้อย",
        description: "แจ้งเตือนเมื่อเครดิต SMS เหลือต่ำกว่า 10%",
        channel: "email",
      },
      {
        key: "smsCreditLow",
        label: "เครดิตเหลือน้อย (SMS)",
        description: "ส่ง SMS แจ้งเตือนเมื่อเครดิตเหลือน้อย",
        channel: "sms",
      },
      {
        key: "emailInvoice",
        label: "ใบแจ้งหนี้ & ใบเสร็จ",
        description: "ส่ง invoice/receipt ทาง email หลังชำระเงิน",
        channel: "email",
      },
      {
        key: "emailPackageExpiry",
        label: "แพ็กเกจใกล้หมดอายุ",
        description: "แจ้งเตือนก่อนแพ็กเกจหมดอายุ 7 วัน",
        channel: "email",
      },
    ],
  },
  {
    title: "แคมเปญ & การส่ง",
    icon: MessageSquare,
    accentColor: "var(--accent)",
    accentRgb: "var(--accent-rgb)",
    items: [
      {
        key: "emailCampaignDone",
        label: "แคมเปญส่งเสร็จ",
        description: "แจ้งเตือนเมื่อแคมเปญส่งครบทุกคน",
        channel: "email",
      },
      {
        key: "smsCampaignDone",
        label: "แคมเปญส่งเสร็จ (SMS)",
        description: "ส่ง SMS แจ้งเมื่อแคมเปญส่งครบ",
        channel: "sms",
      },
    ],
  },
  {
    title: "รายงาน",
    icon: BarChart3,
    accentColor: "var(--accent-blue)",
    accentRgb: "var(--accent-blue-rgb)",
    items: [
      {
        key: "emailWeeklyReport",
        label: "สรุปรายสัปดาห์",
        description: "รายงานสรุปการส่ง SMS ทุกวันจันทร์ทาง email",
        channel: "email",
      },
    ],
  },
  {
    title: "ความปลอดภัย",
    icon: Shield,
    accentColor: "var(--error)",
    accentRgb: "var(--error-rgb)",
    items: [
      {
        key: "emailSecurity",
        label: "แจ้งเตือนความปลอดภัย",
        description: "เข้าสู่ระบบจากอุปกรณ์ใหม่, เปลี่ยนรหัสผ่าน, เปิด/ปิด 2FA",
        channel: "email",
      },
    ],
  },
];

const DEFAULT_PREFS: NotificationPrefs = {
  emailCreditLow: true,
  emailCampaignDone: true,
  emailWeeklyReport: true,
  emailPackageExpiry: true,
  emailInvoice: true,
  emailSecurity: true,
  smsCreditLow: true,
  smsCampaignDone: true,
};

/* ─── Main ─── */

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch("/api/v1/settings/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const data = json?.data ?? json;
        if (data) {
          setPrefs({ ...DEFAULT_PREFS, ...data });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleToggle(key: PrefKey) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }
      toast.success("บันทึกการตั้งค่าสำเร็จ");
      setDirty(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
          <span className="text-[13px] text-[var(--text-muted)]">
            กำลังโหลดการตั้งค่า...
          </span>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="ตั้งค่าการแจ้งเตือน"
        description="เลือกประเภทการแจ้งเตือนที่ต้องการรับทาง Email และ SMS"
        actions={
          <Button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)]"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        }
      />

      {/* Channel Legend */}
      <div className="flex items-center gap-4 mb-6 p-3.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[rgba(var(--accent-rgb),0.08)] flex items-center justify-center">
            <Mail className="w-3.5 h-3.5 text-[var(--accent)]" />
          </div>
          <span className="text-[12px] text-[var(--text-secondary)]">Email</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[rgba(var(--accent-blue-rgb),0.08)] flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
          </div>
          <span className="text-[12px] text-[var(--text-secondary)]">SMS</span>
        </div>
        <div className="flex-1" />
        <span className="text-[11px] text-[var(--text-muted)]">
          {Object.values(prefs).filter(Boolean).length}/{Object.keys(prefs).length} เปิดใช้งาน
        </span>
      </div>

      {/* Groups */}
      <div className="space-y-4">
        {GROUPS.map((group) => {
          const Icon = group.icon;
          return (
            <div
              key={group.title}
              className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden"
            >
              {/* Group Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-default)]">
                <div
                  className="w-9 h-9 rounded-md flex items-center justify-center"
                  style={{ background: `rgba(${group.accentRgb},0.08)` }}
                >
                  <Icon
                    className="w-4.5 h-4.5"
                    style={{ color: group.accentColor }}
                  />
                </div>
                <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
                  {group.title}
                </h3>
              </div>

              {/* Items */}
              <div className="divide-y divide-[var(--border-default)]">
                {group.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-[rgba(255,255,255,0.01)] transition-colors"
                  >
                    {/* Channel badge */}
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                      style={{
                        background:
                          item.channel === "email"
                            ? "rgba(var(--accent-rgb),0.06)"
                            : "rgba(var(--accent-blue-rgb),0.06)",
                      }}
                    >
                      {item.channel === "email" ? (
                        <Mail
                          className="w-3.5 h-3.5"
                          style={{ color: "var(--accent)" }}
                        />
                      ) : (
                        <MessageSquare
                          className="w-3.5 h-3.5"
                          style={{ color: "var(--accent-blue)" }}
                        />
                      )}
                    </div>

                    {/* Label */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[var(--text-primary)]">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Toggle */}
                    <Switch
                      checked={prefs[item.key]}
                      onCheckedChange={() => handleToggle(item.key)}
                      aria-label={item.label}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="mt-6 p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)]">
        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
          การแจ้งเตือนความปลอดภัยที่สำคัญ (เช่น เข้าสู่ระบบจากอุปกรณ์ใหม่)
          จะส่งเสมอแม้ปิดการแจ้งเตือน เพื่อความปลอดภัยของบัญชี
        </p>
      </div>
    </PageLayout>
  );
}
