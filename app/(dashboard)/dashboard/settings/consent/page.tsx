"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  FileText,
  Clock,
  Check,
  X,
  Loader2,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Download,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PageLayout, { PageHeader } from "@/components/blocks/PageLayout";
import { cn } from "@/lib/utils";

/* ─── Types ─── */

type ConsentType = "service" | "marketing" | "thirdParty";

type ConsentEntry = {
  type: ConsentType;
  label: string;
  description: string;
  required: boolean;
  enabled: boolean;
  policyLink: string;
};

type ConsentHistoryItem = {
  id: string;
  type: ConsentType;
  action: "granted" | "revoked";
  date: string;
  policyVersion: string;
  ipAddress: string;
};

/* ─── Config ─── */

const CONSENT_CONFIG: Omit<ConsentEntry, "enabled">[] = [
  {
    type: "service",
    label: "ยินยอมใช้บริการ",
    description:
      "จำเป็นสำหรับการใช้งาน SMSOK รวมถึงการส่ง SMS, จัดการบัญชี และฟีเจอร์ทั้งหมดของแพลตฟอร์ม",
    required: true,
    policyLink: "/terms",
  },
  {
    type: "marketing",
    label: "รับ SMS/Email การตลาด",
    description:
      "รับข่าวสาร โปรโมชั่น ส่วนลดพิเศษ และข้อเสนอใหม่ๆ จาก SMSOK ผ่าน SMS และ Email",
    required: false,
    policyLink: "/privacy#marketing",
  },
  {
    type: "thirdParty",
    label: "แชร์ข้อมูลให้ SMS Gateway",
    description:
      "อนุญาตให้ส่งข้อมูลที่จำเป็น (เบอร์ผู้รับ, เนื้อหา SMS) แก่ผู้ให้บริการ SMS Gateway ภายนอกเพื่อจัดส่งข้อความ",
    required: false,
    policyLink: "/privacy#sharing",
  },
];

const POLICY_VERSION = "v1.0";
const POLICY_DATE = "1 มีนาคม 2569";

/* ─── Main ─── */

export default function ConsentSettingsPage() {
  const [consents, setConsents] = useState<ConsentEntry[]>([]);
  const [history, setHistory] = useState<ConsentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<ConsentType | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: ConsentType | null;
    newValue: boolean;
    label: string;
  }>({ open: false, type: null, newValue: false, label: "" });

  const fetchConsents = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch consent status + history in parallel
      const [statusRes, logsRes] = await Promise.all([
        fetch("/api/v1/consent/status"),
        fetch("/api/v1/consent/logs"),
      ]);

      // Parse consent status
      const statusData = statusRes.ok ? await statusRes.json() : null;
      const apiConsents: { consentType?: string; type?: string; status?: string }[] =
        statusData?.consents ?? statusData?.data?.consents ?? [];

      const consentEntries: ConsentEntry[] = CONSENT_CONFIG.map((c) => {
        // Map local type to API type: service→SERVICE, marketing→MARKETING, thirdParty→THIRD_PARTY
        const apiType = c.type === "thirdParty" ? "THIRD_PARTY" : c.type.toUpperCase();
        const match = apiConsents.find(
          (ac) => (ac.consentType ?? ac.type)?.toUpperCase() === apiType
        );
        return {
          ...c,
          enabled: match ? match.status === "OPT_IN" : c.required,
        };
      });
      setConsents(consentEntries);

      // Parse consent logs
      const logsData = logsRes.ok ? await logsRes.json() : null;
      const rawLogs: { id?: string; consentType?: string; action?: string; recordedAt?: string; createdAt?: string; policyVersion?: string; policy?: { version?: string }; ipAddress?: string }[] =
        logsData?.logs ?? logsData?.data?.logs ?? [];
      setHistory(
        rawLogs.slice(0, 20).map((l, i) => ({
          id: l.id ?? `log-${i}`,
          type: (l.consentType?.toLowerCase() === "third_party" ? "thirdParty" : l.consentType?.toLowerCase() ?? "service") as ConsentType,
          action: l.action === "OPT_IN" ? "granted" as const : "revoked" as const,
          date: l.recordedAt ?? l.createdAt ?? new Date().toISOString(),
          policyVersion: l.policy?.version ?? l.policyVersion ?? POLICY_VERSION,
          ipAddress: l.ipAddress ?? "—",
        }))
      );
    } catch {
      // API not ready — show defaults
      setConsents(
        CONSENT_CONFIG.map((c) => ({ ...c, enabled: c.required }))
      );
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsents();
  }, [fetchConsents]);

  function requestToggle(type: ConsentType, newValue: boolean) {
    const entry = consents.find((c) => c.type === type);
    if (!entry || entry.required) return;

    // Show confirmation dialog when revoking consent
    if (!newValue) {
      setConfirmDialog({
        open: true,
        type,
        newValue,
        label: entry.label,
      });
      return;
    }

    // Granting consent — proceed directly
    executeToggle(type, newValue);
  }

  async function executeToggle(type: ConsentType, newValue: boolean) {
    const entry = consents.find((c) => c.type === type);
    if (!entry) return;

    setSaving(type);
    try {
      const apiType = type === "thirdParty" ? "THIRD_PARTY" : type.toUpperCase();
      let res: Response;
      if (newValue) {
        // OPT_IN → POST /api/v1/consent
        res = await fetch("/api/v1/consent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            consents: [{ consentType: apiType, action: "OPT_IN" }],
          }),
        });
      } else {
        // OPT_OUT → POST /api/v1/consent/withdraw
        res = await fetch("/api/v1/consent/withdraw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ consentType: apiType }),
        });
      }

      if (!res.ok) throw new Error("Failed to update");

      setConsents((prev) =>
        prev.map((c) => (c.type === type ? { ...c, enabled: newValue } : c))
      );

      const actionLabel = newValue ? "เปิดใช้งาน" : "ปิดใช้งาน";
      toast.success(`${actionLabel} "${entry.label}" สำเร็จ`);

      // Add to local history
      setHistory((prev) => [
        {
          id: `local-${Date.now()}`,
          type,
          action: newValue ? "granted" : "revoked",
          date: new Date().toISOString(),
          policyVersion: POLICY_VERSION,
          ipAddress: "—",
        },
        ...prev,
      ]);
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(null);
    }
  }

  function handleConfirmRevoke() {
    if (confirmDialog.type) {
      executeToggle(confirmDialog.type, confirmDialog.newValue);
    }
    setConfirmDialog({ open: false, type: null, newValue: false, label: "" });
  }

  function handleCancelRevoke() {
    setConfirmDialog({ open: false, type: null, newValue: false, label: "" });
  }

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  function getConsentLabel(type: ConsentType): string {
    return (
      CONSENT_CONFIG.find((c) => c.type === type)?.label ?? type
    );
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
          <span className="text-[13px] text-[var(--text-muted)]">
            กำลังโหลดข้อมูลความยินยอม...
          </span>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="จัดการความยินยอม"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchConsents}
            className="gap-2 border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[rgba(var(--accent-rgb),0.2)]"
          >
            <RefreshCw className="w-3.5 h-3.5" /> รีเฟรช
          </Button>
        }
      />

      {/* Policy Version Banner */}
      <div
        className="flex items-center gap-3 p-4 rounded-lg mb-6"
        style={{
          background: "rgba(var(--accent-rgb), 0.04)",
          border: "1px solid rgba(var(--accent-rgb), 0.12)",
        }}
      >
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
          style={{ background: "rgba(var(--accent-rgb), 0.1)" }}
        >
          <FileText className="w-4 h-4 text-[var(--accent)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-[var(--text-primary)]">
            นโยบายความเป็นส่วนตัว {POLICY_VERSION}
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">
            มีผลตั้งแต่ {POLICY_DATE}
          </p>
        </div>
        <Link
          href="/privacy"
          target="_blank"
          className="flex items-center gap-1 text-[12px] text-[var(--accent)] hover:underline shrink-0"
        >
          อ่านฉบับเต็ม <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Consent Toggles */}
      <div className="space-y-3 mb-8">
        {consents.map((entry) => (
          <div
            key={entry.type}
            className={cn(
              "flex items-start gap-4 p-5 rounded-lg transition-all duration-200",
              entry.enabled
                ? "bg-[var(--bg-surface)] border border-[rgba(var(--accent-rgb),0.15)]"
                : "bg-[var(--bg-surface)] border border-[var(--border-default)]"
            )}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{
                background: entry.enabled
                  ? "rgba(var(--accent-rgb), 0.1)"
                  : "var(--bg-elevated)",
              }}
            >
              <Shield
                className="w-5 h-5"
                style={{
                  color: entry.enabled
                    ? "var(--accent)"
                    : "var(--text-muted)",
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
                  {entry.label}
                </h3>
                {entry.required && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[rgba(var(--accent-rgb),0.08)] text-[var(--accent)]">
                    จำเป็น
                  </span>
                )}
              </div>
              <p className="text-[12px] text-[var(--text-muted)] leading-relaxed mb-2">
                {entry.description}
              </p>
              <Link
                href={entry.policyLink}
                target="_blank"
                className="inline-flex items-center gap-1 text-[11px] text-[var(--accent-blue)] hover:underline"
              >
                อ่านรายละเอียด <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            </div>

            <div className="shrink-0 pt-1">
              {saving === entry.type ? (
                <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
              ) : (
                <Switch
                  checked={entry.enabled}
                  onCheckedChange={(checked) =>
                    requestToggle(entry.type, !!checked)
                  }
                  disabled={entry.required}
                  aria-label={entry.label}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Consent History */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-[var(--text-muted)]" />
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
            ประวัติการเปลี่ยนแปลง
          </h2>
        </div>

        {history.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12 rounded-lg"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
            }}
          >
            <Clock className="w-8 h-8 text-[var(--text-muted)] mb-3" />
            <p className="text-[13px] text-[var(--text-muted)]">
              ยังไม่มีประวัติการเปลี่ยนแปลง
            </p>
          </div>
        ) : (
          <div
            className="rounded-lg overflow-hidden"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
            }}
          >
            <table className="nansen-table nansen-table-dense w-full">
              <thead>
                <tr>
                  <th className="text-left">ความยินยอม</th>
                  <th className="text-center">การดำเนินการ</th>
                  <th className="text-left">Policy</th>
                  <th className="text-left">วันที่</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 20).map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="text-[13px] font-medium text-[var(--text-primary)]">
                        {getConsentLabel(item.type)}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-center">
                        {item.action === "granted" ? (
                          <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--success)]">
                            <div className="w-5 h-5 rounded-full bg-[rgba(var(--success-rgb),0.12)] flex items-center justify-center">
                              <Check className="w-3 h-3" />
                            </div>
                            ให้ความยินยอม
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--error)]">
                            <div className="w-5 h-5 rounded-full bg-[rgba(var(--error-rgb),0.12)] flex items-center justify-center">
                              <X className="w-3 h-3" />
                            </div>
                            ถอนความยินยอม
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-[12px] text-[var(--text-muted)] font-mono">
                        {item.policyVersion}
                      </span>
                    </td>
                    <td>
                      <span className="text-[12px] text-[var(--text-secondary)]">
                        {formatDate(item.date)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Data Rights (PDPA) */}
      <div className="mt-8 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-md bg-[var(--bg-elevated)] flex items-center justify-center">
            <Shield className="w-4 h-4 text-[var(--text-secondary)]" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
              สิทธิ์ของเจ้าของข้อมูล (PDPA)
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              ขอสำเนาข้อมูลหรือขอลบข้อมูลส่วนบุคคลของคุณ
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-[var(--border-default)] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-[var(--accent)]" />
              <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                ส่งออกข้อมูล
              </span>
            </div>
            <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
              ขอสำเนาข้อมูลส่วนบุคคลทั้งหมด (บัญชี, ประวัติ SMS, รายชื่อ)
            </p>
            <Link
              href="/dashboard/settings/privacy"
              className="block w-full text-center px-4 py-2.5 text-[13px] font-medium rounded-lg border border-[rgba(var(--accent-rgb),0.2)] text-[var(--accent)] hover:bg-[rgba(var(--accent-rgb),0.06)] transition-all"
            >
              ขอสำเนาข้อมูล
            </Link>
          </div>

          <div className="rounded-lg border border-[var(--border-default)] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-[var(--error)]" />
              <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                ขอลบข้อมูล
              </span>
            </div>
            <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
              ขอให้ลบข้อมูลส่วนบุคคลทั้งหมด — บัญชีจะถูกปิดใช้งาน
            </p>
            <Link
              href="/dashboard/settings/privacy"
              className="block w-full text-center px-4 py-2.5 text-[13px] font-medium rounded-lg border border-[rgba(var(--error-rgb),0.2)] text-[var(--error)] hover:bg-[rgba(var(--error-rgb),0.06)] transition-all"
            >
              ขอลบข้อมูลส่วนบุคคล
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-6 p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)]">
        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
          การถอนความยินยอมบางรายการอาจส่งผลต่อการใช้บริการ
          หากต้องการลบข้อมูลส่วนบุคคลทั้งหมด กรุณาติดต่อ{" "}
          <Link
            href="/dashboard/support/new"
            className="text-[var(--accent-blue)] hover:underline"
          >
            ฝ่ายสนับสนุน
          </Link>
        </p>
      </div>

      {/* Confirm Revoke Dialog */}
      {confirmDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in-scale">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleCancelRevoke}
            onKeyDown={(e) => { if (e.key === "Escape") handleCancelRevoke(); }}
            role="button"
            tabIndex={-1}
            aria-label="ปิด"
          />
          <div className="relative bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="w-12 h-12 rounded-lg bg-[rgba(var(--error-rgb),0.1)] border border-[rgba(var(--error-rgb),0.2)] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-[var(--error)]" />
            </div>
            <h3 className="text-base font-semibold text-[var(--text-primary)] text-center mb-2">
              ถอนความยินยอม
            </h3>
            <p className="text-[13px] text-[var(--text-secondary)] text-center mb-6 leading-relaxed">
              คุณต้องการถอนความยินยอม &ldquo;{confirmDialog.label}&rdquo; หรือไม่?
              การดำเนินการนี้อาจส่งผลต่อการใช้บริการบางส่วน
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancelRevoke}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[var(--error)] hover:brightness-110 rounded-lg transition-all cursor-pointer shadow-[0_0_16px_rgba(var(--error-rgb),0.3)]"
              >
                ยืนยันถอนความยินยอม
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
