"use client";

import { useState } from "react";
import {
  Shield,
  Share2,
  Mail,
  Cookie,
  ExternalLink,
  AlertTriangle,
  History,
  Lock,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import PageLayout, { PageHeader } from "@/components/blocks/PageLayout";
import { cn } from "@/lib/utils";

/* ─── Types ─── */

type ConsentType = "service" | "third_party" | "marketing" | "cookie";

type ConsentConfig = {
  type: ConsentType;
  icon: typeof Shield;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  required: boolean;
  policyVersion: string;
  acceptedDate: string;
  policyLink: string;
  withdrawWarning: string;
};

type HistoryEntry = {
  date: string;
  type: string;
  action: "ยินยอม" | "ถอนความยินยอม";
  version: string;
};

/* ─── Config ─── */

const CONSENTS: ConsentConfig[] = [
  {
    type: "service",
    icon: Shield,
    iconColor: "var(--accent)",
    iconBg: "rgba(var(--accent-rgb),0.08)",
    title: "ข้อกำหนดการใช้งาน",
    description:
      "ยินยอมให้เก็บและประมวลผลข้อมูลที่จำเป็นสำหรับการให้บริการ รวมถึงข้อมูลบัญชี ข้อมูลการใช้งาน และ log การส่ง SMS",
    required: true,
    policyVersion: "v1.0",
    acceptedDate: "1 มี.ค. 2026",
    policyLink: "/legal/terms",
    withdrawWarning:
      "ต้องการปิดบัญชี? ติดต่อ support@smsok.com",
  },
  {
    type: "third_party",
    icon: Share2,
    iconColor: "var(--accent-secondary)",
    iconBg: "rgba(var(--accent-secondary-rgb, 50,152,218),0.08)",
    title: "ส่งข้อมูลให้ผู้ให้บริการภายนอก",
    description:
      "ยินยอมให้ส่งข้อมูลไปยัง SMS gateway, ระบบชำระเงิน และผู้ให้บริการอื่นที่จำเป็นสำหรับการส่ง SMS",
    required: true,
    policyVersion: "v1.0",
    acceptedDate: "1 มี.ค. 2026",
    policyLink: "/legal/third-party",
    withdrawWarning: "จะไม่สามารถส่ง SMS ได้",
  },
  {
    type: "marketing",
    icon: Mail,
    iconColor: "var(--warning)",
    iconBg: "rgba(var(--warning-rgb, 245,158,11),0.08)",
    title: "รับ SMS/Email โปรโมชั่น",
    description:
      "ยินยอมรับข่าวสาร โปรโมชั่น และข้อเสนอพิเศษผ่าน SMS และ Email",
    required: false,
    policyVersion: "v1.0",
    acceptedDate: "1 มี.ค. 2026",
    policyLink: "/legal/marketing",
    withdrawWarning: "หยุดรับ SMS/Email โปรโมชั่น?",
  },
  {
    type: "cookie",
    icon: Cookie,
    iconColor: "var(--success)",
    iconBg: "rgba(var(--success-rgb, 16,185,129),0.08)",
    title: "Analytics cookies",
    description:
      "ยินยอมให้ใช้ cookies สำหรับวิเคราะห์พฤติกรรมการใช้งาน เพื่อปรับปรุงประสบการณ์",
    required: false,
    policyVersion: "v1.0",
    acceptedDate: "1 มี.ค. 2026",
    policyLink: "/legal/cookies",
    withdrawWarning: "จะลบ analytics cookies",
  },
];

/* ─── Confirm Dialog ─── */

function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onCancel}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
        role="button"
        tabIndex={-1}
        aria-label="ปิด"
      />
      <div className="relative bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-[var(--warning)]" />
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            {title}
          </h3>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-5">{message}</p>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg border border-[var(--border-default)] transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--error)] hover:bg-[var(--error)]/90 rounded-lg transition-colors cursor-pointer"
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Consent Card ─── */

function ConsentCard({
  consent,
  enabled,
  onToggle,
}: {
  consent: ConsentConfig;
  enabled: boolean;
  onToggle: () => void;
}) {
  const Icon = consent.icon;

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: consent.iconBg }}
        >
          <Icon className="w-5 h-5" style={{ color: consent.iconColor }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              {consent.title}
            </h3>

            {/* Toggle or Required badge */}
            {consent.required ? (
              <span className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-[rgba(var(--accent-rgb),0.08)] text-[var(--accent)] flex-shrink-0">
                <Lock className="w-3 h-3" />
                จำเป็น
              </span>
            ) : (
              <Switch
                checked={enabled}
                onCheckedChange={onToggle}
                aria-label={`Toggle ${consent.title}`}
              />
            )}
          </div>

          <p className="text-[13px] text-[var(--text-secondary)] mb-3 leading-relaxed">
            {consent.description}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-[11px] text-[var(--text-muted)]">
              เวอร์ชัน:{" "}
              <span className="text-[var(--text-secondary)] font-medium">
                {consent.policyVersion}
              </span>
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              ยินยอมเมื่อ:{" "}
              <span className="text-[var(--text-secondary)] font-medium">
                {consent.acceptedDate}
              </span>
            </span>
            <a
              href={consent.policyLink}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors"
            >
              ดูนโยบายฉบับเต็ม
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Warning for required consents */}
          {consent.required && consent.type === "third_party" && (
            <div className="mt-3 flex items-start gap-2 text-[12px] text-[var(--warning)] bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.15)] rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>
                การถอนความยินยอมจะทำให้ไม่สามารถส่ง SMS ได้ —
                ติดต่อ support หากต้องการดำเนินการ
              </span>
            </div>
          )}
          {consent.required && consent.type === "service" && (
            <div className="mt-3 flex items-start gap-2 text-[12px] text-[var(--text-muted)] bg-[rgba(255,255,255,0.02)] border border-[var(--border-default)] rounded-lg px-3 py-2">
              <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>
                ต้องการปิดบัญชี? ติดต่อ{" "}
                <a
                  href="mailto:support@smsok.com"
                  className="text-[var(--accent)] hover:underline"
                >
                  support@smsok.com
                </a>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function PrivacySettingsPage() {
  const [consents, setConsents] = useState<Record<ConsentType, boolean>>({
    service: true,
    third_party: true,
    marketing: true,
    cookie: true,
  });

  const [history] = useState<HistoryEntry[]>([]);
  const historyLoading = false;

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: ConsentType | null;
    title: string;
    message: string;
  }>({ open: false, type: null, title: "", message: "" });

  const handleToggle = (consent: ConsentConfig) => {
    if (consent.required) return;

    const currentlyEnabled = consents[consent.type];

    if (currentlyEnabled) {
      // Withdrawing — show confirmation
      setConfirmDialog({
        open: true,
        type: consent.type,
        title: "ถอนความยินยอม",
        message: consent.withdrawWarning,
      });
    } else {
      // Re-consenting — no confirmation needed
      setConsents((prev) => ({ ...prev, [consent.type]: true }));
    }
  };

  const handleConfirmWithdraw = () => {
    if (confirmDialog.type) {
      setConsents((prev) => ({
        ...prev,
        [confirmDialog.type!]: false,
      }));
    }
    setConfirmDialog({ open: false, type: null, title: "", message: "" });
  };

  const handleCancelWithdraw = () => {
    setConfirmDialog({ open: false, type: null, title: "", message: "" });
  };

  return (
    <PageLayout>
      <PageHeader
        title="ตั้งค่าความเป็นส่วนตัว"
        description="จัดการความยินยอมและการใช้ข้อมูลส่วนบุคคลของคุณ"
      />

      {/* ─── Current Consents ─── */}
      <div className="space-y-4 mb-8">
        {CONSENTS.map((consent) => (
          <ConsentCard
            key={consent.type}
            consent={consent}
            enabled={consents[consent.type]}
            onToggle={() => handleToggle(consent)}
          />
        ))}
      </div>

      {/* ─── Consent History ─── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--border-default)]">
          <History className="w-5 h-5 text-[var(--text-secondary)]" />
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            ประวัติการยินยอม
          </h3>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border-default)]">
                <th className="px-5 py-3 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  วันที่
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  ประเภท
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  การกระทำ
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  เวอร์ชัน
                </th>
              </tr>
            </thead>
            <tbody>
              {historyLoading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center">
                    <span className="text-[13px] text-[var(--text-muted)]">
                      กำลังโหลดประวัติ...
                    </span>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center">
                    <span className="text-[13px] text-[var(--text-muted)]">
                      ยังไม่มีประวัติกิจกรรม
                    </span>
                  </td>
                </tr>
              ) : (
                history.map((entry, i) => (
                  <tr
                    key={`${entry.date}-${entry.type}-${i}`}
                    className={cn(
                      "border-b border-[var(--border-default)] last:border-b-0",
                      "hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                    )}
                  >
                    <td className="px-5 py-3 text-[13px] text-[var(--text-secondary)] whitespace-nowrap">
                      {entry.date}
                    </td>
                    <td className="px-5 py-3 text-[13px] text-[var(--text-primary)]">
                      {entry.type}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex text-[11px] font-medium px-2.5 py-1 rounded-full",
                          entry.action === "ยินยอม"
                            ? "bg-[rgba(16,185,129,0.08)] text-[var(--success)]"
                            : "bg-[rgba(239,68,68,0.08)] text-[var(--error)]"
                        )}
                      >
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-[var(--text-muted)]">
                      {entry.version}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Confirm Dialog ─── */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={handleConfirmWithdraw}
        onCancel={handleCancelWithdraw}
      />
    </PageLayout>
  );
}
