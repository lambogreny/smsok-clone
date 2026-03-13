"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Share2,
  Mail,
  Cookie,
  ExternalLink,
  AlertTriangle,
  History,
  Lock,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import PageLayout, { PageHeader } from "@/components/blocks/PageLayout";
import { cn } from "@/lib/utils";

/* ─── Types ─── */

type ConsentType = "service" | "third_party" | "marketing" | "cookie";

type ConsentConfig = {
  type: ConsentType;
  icon: typeof Shield;
  accentColor: string;
  accentRgb: string;
  title: string;
  description: string;
  required: boolean;
  policyVersion: string | null;
  acceptedDate: string | null;
  policyLink: string;
  withdrawWarning: string;
};

type ConsentMeta = {
  policyVersion: string | null;
  acceptedDate: string | null;
};

type HistoryEntry = {
  date: string;
  type: string;
  action: "ยินยอม" | "ถอนความยินยอม";
  version: string;
};

const EMPTY_CONSENT_META: Record<ConsentType, ConsentMeta> = {
  service: { policyVersion: null, acceptedDate: null },
  third_party: { policyVersion: null, acceptedDate: null },
  marketing: { policyVersion: null, acceptedDate: null },
  cookie: { policyVersion: null, acceptedDate: null },
};

/* ─── Config ─── */

const CONSENTS: ConsentConfig[] = [
  {
    type: "service",
    icon: Shield,
    accentColor: "var(--accent)",
    accentRgb: "var(--accent-rgb)",
    title: "ข้อกำหนดการใช้งาน",
    description:
      "ยินยอมให้เก็บและประมวลผลข้อมูลที่จำเป็นสำหรับการให้บริการ รวมถึงข้อมูลบัญชี ข้อมูลการใช้งาน และ log การส่ง SMS",
    required: true,
    policyVersion: "v1.0",
    acceptedDate: "1 มี.ค. 2026",
    policyLink: "/terms",
    withdrawWarning: "ต้องการปิดบัญชี? ติดต่อ support@smsok.com",
  },
  {
    type: "third_party",
    icon: Share2,
    accentColor: "var(--accent-blue)",
    accentRgb: "71,121,255",
    title: "ส่งข้อมูลให้ผู้ให้บริการภายนอก",
    description:
      "ยินยอมให้ส่งข้อมูลไปยัง SMS gateway, ระบบชำระเงิน และผู้ให้บริการอื่นที่จำเป็นสำหรับการส่ง SMS",
    required: true,
    policyVersion: "v1.0",
    acceptedDate: "1 มี.ค. 2026",
    policyLink: "/privacy",
    withdrawWarning: "จะไม่สามารถส่ง SMS ได้",
  },
  {
    type: "marketing",
    icon: Mail,
    accentColor: "var(--warning)",
    accentRgb: "250,205,99",
    title: "รับ SMS/Email โปรโมชั่น",
    description:
      "ยินยอมรับข่าวสาร โปรโมชั่น และข้อเสนอพิเศษผ่าน SMS และ Email",
    required: false,
    policyVersion: "v1.0",
    acceptedDate: "1 มี.ค. 2026",
    policyLink: "/privacy#marketing",
    withdrawWarning: "หยุดรับ SMS/Email โปรโมชั่น?",
  },
  {
    type: "cookie",
    icon: Cookie,
    accentColor: "var(--accent-purple)",
    accentRgb: "var(--accent-purple-rgb)",
    title: "Analytics cookies",
    description:
      "ยินยอมให้ใช้ cookies สำหรับวิเคราะห์พฤติกรรมการใช้งาน เพื่อปรับปรุงประสบการณ์",
    required: false,
    policyVersion: "v1.0",
    acceptedDate: "1 มี.ค. 2026",
    policyLink: "/cookie-policy",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in-scale">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
        role="button"
        tabIndex={-1}
        aria-label="ปิด"
      />
      <div className="relative bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl">
        {/* Warning icon with glow */}
        <div className="w-12 h-12 rounded-lg bg-[rgba(var(--error-rgb),0.1)] border border-[rgba(var(--error-rgb),0.2)] flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-[var(--error)]" />
        </div>

        <h3 className="text-base font-semibold text-[var(--text-primary)] text-center mb-2">
          {title}
        </h3>
        <p className="text-[13px] text-[var(--text-secondary)] text-center mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[var(--error)] hover:brightness-110 rounded-lg transition-all cursor-pointer shadow-[0_0_16px_rgba(var(--error-rgb),0.3)]"
          >
            ยืนยันถอนความยินยอม
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Consent Card ─── */

function ConsentCard({
  consent,
  meta,
  enabled,
  onToggle,
  index,
}: {
  consent: ConsentConfig;
  meta: ConsentMeta;
  enabled: boolean;
  onToggle: () => void;
  index: number;
}) {
  const Icon = consent.icon;
  const isActive = enabled || consent.required;

  return (
    <div
      className="group relative card-conic bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${consent.accentColor}, transparent)`,
          opacity: isActive ? 0.8 : 0.15,
        }}
      />

      <div className="relative p-5">
        <div className="flex items-start gap-4">
          {/* Icon with glow ring */}
          <div className="relative flex-shrink-0">
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center transition-all duration-300"
              style={{
                background: `rgba(${consent.accentRgb},${isActive ? 0.12 : 0.06})`,
                boxShadow: isActive
                  ? `0 0 20px rgba(${consent.accentRgb},0.08)`
                  : "none",
              }}
            >
              <Icon
                className="w-5 h-5 transition-colors duration-300"
                style={{
                  color: isActive
                    ? consent.accentColor
                    : "var(--text-muted)",
                }}
              />
            </div>
            {/* Status indicator dot */}
            <div
              className={cn(
                "absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--bg-surface)] transition-colors duration-300",
                isActive ? "bg-[var(--success)]" : "bg-[var(--text-subdued)]"
              )}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2.5">
                <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
                  {consent.title}
                </h3>

                {consent.required && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(var(--accent-rgb),0.08)] text-[var(--accent)] border border-[rgba(var(--accent-rgb),0.15)] uppercase tracking-wider">
                    <Lock className="w-2.5 h-2.5" />
                    จำเป็น
                  </span>
                )}
              </div>

              {/* Toggle */}
              {!consent.required && (
                <Switch
                  checked={enabled}
                  onCheckedChange={onToggle}
                  aria-label={`Toggle ${consent.title}`}
                />
              )}
            </div>

            <p className="text-[13px] text-[var(--text-secondary)] mb-3.5 leading-relaxed">
              {consent.description}
            </p>

            {/* Meta row */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: consent.accentColor }}
                />
                <span className="text-[var(--text-secondary)] font-medium">
                  {meta.policyVersion ?? consent.policyVersion ?? "ยังไม่มีเวอร์ชัน"}
                </span>
              </div>

              <span className="text-[var(--border-default)]">|</span>

              <span className="text-[11px] text-[var(--text-muted)]">
                ยินยอมเมื่อ{" "}
                <span className="text-[var(--text-secondary)]">
                  {meta.acceptedDate ?? consent.acceptedDate ?? "ยังไม่มีข้อมูล"}
                </span>
              </span>

              <span className="text-[var(--border-default)]">|</span>

              <a
                href={consent.policyLink}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--accent-blue)] hover:text-[var(--accent)] transition-colors"
              >
                นโยบาย
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Contextual warnings for required consents */}
            {consent.required && consent.type === "third_party" && (
              <div className="mt-3.5 flex items-start gap-2.5 text-[12px] text-[var(--warning)] bg-[rgba(var(--warning-rgb),0.06)] border border-[rgba(var(--warning-rgb),0.12)] rounded-md px-3 py-2.5">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  การถอนความยินยอมจะทำให้ไม่สามารถส่ง SMS ได้ — ติดต่อ
                  support หากต้องการดำเนินการ
                </span>
              </div>
            )}
            {consent.required && consent.type === "service" && (
              <div className="mt-3.5 flex items-start gap-2.5 text-[12px] text-[var(--text-muted)] bg-[var(--bg-muted)] border border-[var(--border-default)] rounded-md px-3 py-2.5">
                <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  ต้องการปิดบัญชี? ติดต่อ{" "}
                  <a
                    href="mailto:support@smsok.com"
                    className="text-[var(--accent-blue)] hover:text-[var(--accent)] transition-colors"
                  >
                    support@smsok.com
                  </a>
                </span>
              </div>
            )}
          </div>
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
    marketing: false,
    cookie: false,
  });
  const [consentMeta, setConsentMeta] = useState<Record<ConsentType, ConsentMeta>>({
    service: { ...EMPTY_CONSENT_META.service },
    third_party: { ...EMPTY_CONSENT_META.third_party },
    marketing: { ...EMPTY_CONSENT_META.marketing },
    cookie: { ...EMPTY_CONSENT_META.cookie },
  });
  const [, setLoading] = useState(true);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyExpanded, setHistoryExpanded] = useState(true);

  // Fetch real consent status from API
  useEffect(() => {
    fetch("/api/v1/consent/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.consents) {
          const mapped: Record<ConsentType, boolean> = {
            service: true,
            third_party: true,
            marketing: true,
            cookie: true,
          };
          for (const c of data.consents) {
            const key = c.consentType?.toLowerCase() as ConsentType;
            if (key in mapped) mapped[key] = c.status === "OPT_IN";
          }
          setConsents(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch consent history
    fetch("/api/v1/consent/logs")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.logs) {
          setHistory(
            data.logs.slice(0, 20).map((l: { createdAt: string; consentType: string; action: string; }) => ({
              date: new Date(l.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }),
              type: l.consentType,
              action: l.action === "OPT_IN" ? "ยินยอม" as const : "ถอนความยินยอม" as const,
              version: "v1.0",
            })),
          );
        }
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: ConsentType | null;
    title: string;
    message: string;
  }>({ open: false, type: null, title: "", message: "" });

  async function persistConsent(type: ConsentType, action: "OPT_IN" | "OPT_OUT") {
    const apiType = type.toUpperCase() as "SERVICE" | "MARKETING" | "THIRD_PARTY" | "COOKIE";
    try {
      const res = await fetch("/api/v1/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consents: [{ consentType: apiType, action }] }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      // Revert on failure
      setConsents((prev) => ({ ...prev, [type]: action === "OPT_OUT" }));
    }
  }

  const handleToggle = (consent: ConsentConfig) => {
    if (consent.required) return;
    const currentlyEnabled = consents[consent.type];
    if (currentlyEnabled) {
      setConfirmDialog({
        open: true,
        type: consent.type,
        title: "ถอนความยินยอม",
        message: consent.withdrawWarning,
      });
    } else {
      setConsents((prev) => ({ ...prev, [consent.type]: true }));
      persistConsent(consent.type, "OPT_IN");
    }
  };

  const handleConfirmWithdraw = () => {
    if (confirmDialog.type) {
      setConsents((prev) => ({
        ...prev,
        [confirmDialog.type!]: false,
      }));
      persistConsent(confirmDialog.type, "OPT_OUT");
    }
    setConfirmDialog({ open: false, type: null, title: "", message: "" });
  };

  const handleCancelWithdraw = () => {
    setConfirmDialog({ open: false, type: null, title: "", message: "" });
  };

  // Summary counts
  const activeCount = Object.values(consents).filter(Boolean).length;
  const totalCount = CONSENTS.length;

  return (
    <PageLayout>
      <PageHeader
        title="ตั้งค่าความเป็นส่วนตัว"
        description="จัดการความยินยอมและการใช้ข้อมูลส่วนบุคคลของคุณ"
      />

      {/* ─── Summary Bar ─── */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse-dot" />
          <span className="text-[13px] text-[var(--text-secondary)]">
            ความยินยอมที่เปิดใช้งาน
          </span>
        </div>
        <span className="text-[15px] font-bold text-[var(--text-primary)] tabular-nums">
          {activeCount}
          <span className="text-[var(--text-muted)] font-normal">
            /{totalCount}
          </span>
        </span>
        <div className="flex-1" />
        <div className="flex gap-1">
          {CONSENTS.map((c) => (
            <div
              key={c.type}
              className="w-8 h-1.5 rounded-full transition-colors duration-300"
              style={{
                background: consents[c.type]
                  ? c.accentColor
                  : "var(--bg-muted)",
                opacity: consents[c.type] ? 1 : 0.4,
              }}
            />
          ))}
        </div>
      </div>

      {/* ─── Consent Cards ─── */}
      <div className="space-y-3 mb-8 stagger-children">
        {CONSENTS.map((consent, i) => (
          <ConsentCard
            key={consent.type}
            consent={consent}
            meta={consentMeta[consent.type]}
            enabled={consents[consent.type]}
            onToggle={() => handleToggle(consent)}
            index={i}
          />
        ))}
      </div>

      {/* ─── Consent History ─── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setHistoryExpanded(!historyExpanded)}
          className="w-full flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[var(--bg-muted)] flex items-center justify-center">
              <History className="w-4 h-4 text-[var(--text-secondary)]" />
            </div>
            <div className="text-left">
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
                ประวัติการยินยอม
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                บันทึกทุกการเปลี่ยนแปลงสิทธิ์
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-[var(--text-muted)] transition-transform duration-300",
              historyExpanded ? "rotate-0" : "-rotate-90"
            )}
          />
        </button>

        <div
          className={cn(
            "expand-content",
            historyExpanded && "open"
          )}
        >
          <div>
            {/* Table */}
            <table className="nansen-table w-full">
              <thead>
                <tr>
                  <th className="text-left">วันที่</th>
                  <th className="text-left">ประเภท</th>
                  <th className="text-left">การกระทำ</th>
                  <th className="text-left">เวอร์ชัน</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  <tr>
                    <td colSpan={4} className="!text-center !py-10">
                      <span className="text-[13px] text-[var(--text-muted)]">
                        กำลังโหลดประวัติ...
                      </span>
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="!text-center !py-12">
                      <div className="flex flex-col items-center gap-2">
                        <History className="w-8 h-8 text-[var(--border-default)]" />
                        <span className="text-[13px] text-[var(--text-muted)]">
                          ยังไม่มีประวัติกิจกรรม
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  history.map((entry, i) => (
                    <tr key={`${entry.date}-${entry.type}-${i}`}>
                      <td className="text-[var(--text-secondary)] !text-[13px] whitespace-nowrap">
                        {entry.date}
                      </td>
                      <td className="!text-[13px]">{entry.type}</td>
                      <td>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full",
                            entry.action === "ยินยอม"
                              ? "bg-[rgba(var(--success-rgb),0.1)] text-[var(--success)] border border-[rgba(var(--success-rgb),0.15)]"
                              : "bg-[rgba(var(--error-rgb),0.1)] text-[var(--error)] border border-[rgba(var(--error-rgb),0.15)]"
                          )}
                        >
                          {entry.action === "ยินยอม" ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                          {entry.action}
                        </span>
                      </td>
                      <td className="text-[var(--text-muted)] !text-[13px]">
                        {entry.version}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
