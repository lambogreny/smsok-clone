"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Loader2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Download,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ShieldOff,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "sonner";
import { formatThaiDateOnly } from "@/lib/format-thai-date";

/* ── Types ── */
interface TwoFactorStatus {
  enabled: boolean;
  setupAt: string | null;
  remainingRecoveryCodes: number;
}

interface SetupData {
  qrCode: string;
  secret: string;
  recoveryCodes: string[];
}

/* ── Helpers ── */
function formatSecret(secret: string): string {
  return secret.replace(/(.{4})/g, "$1 ").trim().toUpperCase();
}

function getProgressColor(remaining: number, total: number): string {
  const pct = total > 0 ? (remaining / total) * 100 : 0;
  if (pct > 50) return "var(--accent)";
  if (pct > 20) return "var(--warning)";
  return "var(--error)";
}

/* ── BackupCodesDisplay ── */
function BackupCodesDisplay({
  codes,
  onCopy,
  onDownload,
}: {
  codes: string[];
  onCopy: () => void;
  onDownload: () => void;
}) {
  return (
    <div>
      <div
        className="rounded-lg p-5 mb-4"
        style={{
          background: "var(--bg-inset, var(--bg-base))",
          border: "1px solid var(--border-default)",
        }}
      >
        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
          {codes.map((code, i) => (
            <div key={code} className="flex items-center gap-2">
              <span
                className="text-xs w-5 text-right"
                style={{ color: "var(--text-muted)" }}
              >
                {i + 1}.
              </span>
              <code
                className="text-sm font-mono tracking-wider"
                style={{ color: "var(--text-primary)" }}
                aria-label={`Backup code ลำดับที่ ${i + 1}`}
              >
                {code}
              </code>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onCopy}
          className="gap-1.5 text-xs"
        >
          <Copy size={12} /> คัดลอก
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          className="gap-1.5 text-xs"
        >
          <Download size={12} /> ดาวน์โหลด .txt
        </Button>
      </div>

      {/* Warning */}
      <div
        className="rounded-lg p-4"
        style={{
          background: "rgba(var(--warning-rgb),0.08)",
          border: "1px solid rgba(var(--warning-rgb),0.15)",
        }}
      >
        <div className="flex items-start gap-2.5">
          <AlertTriangle
            size={16}
            className="shrink-0 mt-0.5"
            style={{ color: "var(--warning)" }}
          />
          <div className="text-[13px]" style={{ color: "var(--warning)" }}>
            <p className="font-medium mb-1">สำคัญ:</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>Backup codes ใช้ได้ครั้งเดียวต่อ 1 code</li>
              <li>เก็บไว้ที่ปลอดภัย — จะไม่แสดงอีกหลังปิดหน้านี้</li>
              <li>ใช้เมื่อเข้าถึงแอป Authenticator ไม่ได้</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function TwoFactorSection() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Enable dialog state
  const [enableOpen, setEnableOpen] = useState(false);
  const [enableStep, setEnableStep] = useState<1 | 2 | 3>(1);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);
  const [savedConfirmed, setSavedConfirmed] = useState(false);

  // Disable dialog state
  const [disableOpen, setDisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableError, setDisableError] = useState("");
  const [disabling, setDisabling] = useState(false);

  // Regenerate dialog state
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenCode, setRegenCode] = useState("");
  const [regenError, setRegenError] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [regenCodes, setRegenCodes] = useState<string[] | null>(null);
  const [regenSaved, setRegenSaved] = useState(false);

  const TOTAL_CODES = 10;

  /* ── Fetch status ── */
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/settings/2fa");
      if (res.ok) {
        const json = await res.json();
        setStatus(json);
      } else {
        setStatus({ enabled: false, setupAt: null, remainingRecoveryCodes: 0 });
      }
    } catch {
      setStatus({ enabled: false, setupAt: null, remainingRecoveryCodes: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  /* ── Enable flow ── */
  async function startEnable() {
    setSetupLoading(true);
    setVerifyError("");
    setVerifyCode("");
    setEnableStep(1);
    setSavedConfirmed(false);
    setShowSecret(false);
    setSecretCopied(false);

    try {
      const res = await fetch("/api/v1/settings/2fa/enable", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "ไม่สามารถเริ่มตั้งค่า 2FA ได้");
      }
      const json = await res.json();
      setSetupData({
        qrCode: json.qrCode,
        secret: json.secret,
        recoveryCodes: json.recoveryCodes,
      });
      setEnableOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSetupLoading(false);
    }
  }

  async function handleVerifyEnable(code: string) {
    if (code.length !== 6) {
      setVerifyError("กรุณากรอกรหัส 6 หลัก");
      return;
    }
    setVerifying(true);
    setVerifyError("");
    try {
      const res = await fetch("/api/v1/settings/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "รหัสไม่ถูกต้อง");
      }
      setEnableStep(3);
      toast.success("เปิดใช้ 2FA สำเร็จ!");
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setVerifyCode("");
    } finally {
      setVerifying(false);
    }
  }

  function handleEnableComplete() {
    setEnableOpen(false);
    setSetupData(null);
    fetchStatus();
  }

  /* ── Disable flow ── */
  async function handleDisable() {
    if (!disablePassword) {
      setDisableError("กรุณากรอกรหัสผ่าน");
      return;
    }
    setDisabling(true);
    setDisableError("");
    try {
      const res = await fetch("/api/v1/settings/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "ไม่สามารถปิด 2FA ได้");
      }
      setDisableOpen(false);
      setDisablePassword("");
      toast.success("ปิด 2FA แล้ว");
      fetchStatus();
    } catch (err) {
      setDisableError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setDisabling(false);
    }
  }

  /* ── Regenerate backup codes ── */
  async function handleRegenerate() {
    if (regenCode.length !== 6) {
      setRegenError("กรุณากรอกรหัส 6 หลัก");
      return;
    }
    setRegenerating(true);
    setRegenError("");
    try {
      const verifyRes = await fetch("/api/v1/settings/2fa/regenerate-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: regenCode }),
      });
      if (!verifyRes.ok) {
        const err = await verifyRes.json().catch(() => ({}));
        throw new Error(err.error || "รหัสไม่ถูกต้อง");
      }
      const json = await verifyRes.json();
      setRegenCodes(json.recoveryCodes ?? []);
      setRegenSaved(false);
      setRegenCode("");
      toast.success("สร้าง Backup Codes ใหม่แล้ว");
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setRegenCode("");
    } finally {
      setRegenerating(false);
    }
  }

  /* ── Copy & Download helpers ── */
  function copyBackupCodes(codes: string[]) {
    const text = codes.map((c, i) => `${i + 1}. ${c}`).join("\n");
    navigator.clipboard.writeText(text);
    toast.success("คัดลอก Backup Codes แล้ว");
  }

  function downloadBackupCodes(codes: string[]) {
    const text = [
      "SMSOK — Backup Codes",
      `Generated: ${new Date().toISOString()}`,
      "",
      "แต่ละ code ใช้ได้ครั้งเดียว เก็บไว้ที่ปลอดภัย",
      "",
      ...codes.map((c, i) => `${String(i + 1).padStart(2, " ")}. ${c}`),
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "smsok-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("ดาวน์โหลด Backup Codes แล้ว");
  }

  function copySecret() {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    }
  }

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div
        className="rounded-lg p-6 md:p-8"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg"
              style={{ background: "var(--bg-elevated)" }}
            />
            <div
              className="h-4 w-48 rounded"
              style={{ background: "var(--bg-elevated)" }}
            />
          </div>
          <div
            className="h-24 rounded-lg"
            style={{ background: "var(--bg-base)" }}
          />
        </div>
      </div>
    );
  }

  const isEnabled = status?.enabled ?? false;
  const remaining = status?.remainingRecoveryCodes ?? 0;

  return (
    <>
      <div
        className="rounded-lg p-6 md:p-8"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
        }}
      >
        {/* Section header */}
        <div className="mb-5">
          <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: isEnabled
                  ? "rgba(var(--success-rgb),0.1)"
                  : "rgba(var(--accent-rgb),0.1)",
                border: `1px solid ${isEnabled ? "rgba(var(--success-rgb),0.15)" : "rgba(var(--accent-rgb),0.15)"}`,
              }}
            >
              <Shield
                size={16}
                style={{
                  color: isEnabled ? "var(--success)" : "var(--accent)",
                }}
              />
            </div>
            การยืนยันตัวตนสองขั้นตอน (2FA)
          </h2>
          <p
            className="text-[13px] mt-1 ml-[42px]"
            style={{ color: "var(--text-muted)" }}
          >
            เพิ่มความปลอดภัยให้บัญชีด้วยรหัสจากแอป Authenticator
          </p>
        </div>

        {/* Status card */}
        <div
          className="rounded-lg p-6"
          style={{
            background: "var(--bg-inset, var(--bg-base))",
            border: "1px solid var(--border-default)",
          }}
        >
          {isEnabled ? (
            /* ── State B: Enabled ── */
            <>
              <div className="flex items-start gap-4 mb-5">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: "rgba(var(--success-rgb),0.1)",
                    border: "1px solid rgba(var(--success-rgb),0.15)",
                  }}
                >
                  <Shield size={24} style={{ color: "var(--success)" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--success)" }}>
                    สถานะ: เปิดอยู่
                  </p>
                  <p className="text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    เปิดใช้เมื่อ:{" "}
                    {status?.setupAt ? formatThaiDateOnly(status.setupAt) : "ไม่ทราบ"}
                  </p>
                </div>
              </div>

              {/* Backup codes remaining */}
              <div className="mb-5">
                <p className="text-[13px] mb-2" style={{ color: "var(--text-muted)" }}>
                  Backup Codes
                </p>
                <div className="flex items-center gap-3 mb-1.5">
                  <div
                    className="flex-1 h-1.5 rounded-full overflow-hidden"
                    style={{ background: "var(--bg-base)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(remaining / TOTAL_CODES) * 100}%`,
                        background: getProgressColor(remaining, TOTAL_CODES),
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-mono shrink-0"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {remaining}/{TOTAL_CODES}
                  </span>
                </div>
                {remaining === 0 && (
                  <p className="text-xs" style={{ color: "var(--error)" }}>
                    Backup codes หมด — กรุณาสร้างใหม่
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRegenCode("");
                    setRegenError("");
                    setRegenCodes(null);
                    setRegenSaved(false);
                    setRegenOpen(true);
                  }}
                  className="gap-1.5 text-xs"
                  style={{
                    borderColor: remaining === 0 ? "rgba(var(--accent-rgb),0.3)" : undefined,
                  }}
                >
                  <RefreshCw size={12} /> สร้าง Backup Codes ใหม่
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDisablePassword("");
                    setDisableError("");
                    setDisableOpen(true);
                  }}
                  className="gap-1.5 text-xs text-[var(--error)] border-[rgba(var(--error-rgb),0.2)] hover:bg-[rgba(var(--error-rgb),0.06)]"
                >
                  <ShieldOff size={12} /> ปิด 2FA
                </Button>
              </div>
            </>
          ) : (
            /* ── State A: Disabled ── */
            <>
              <div className="flex items-start gap-4 mb-5">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: "rgba(var(--error-rgb),0.08)",
                    border: "1px solid rgba(var(--error-rgb),0.12)",
                  }}
                >
                  <Shield size={24} style={{ color: "var(--error)" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--error)" }}>
                    สถานะ: ปิดอยู่
                  </p>
                  <p className="text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    บัญชีของคุณยังไม่ได้เปิดการยืนยันตัวตนสองขั้นตอน
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-2 mb-6">
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  ทำไมต้องเปิด 2FA?
                </p>
                {[
                  "ป้องกันการเข้าถึงบัญชีโดยไม่ได้รับอนุญาต",
                  "จำเป็นสำหรับ: โอน ownership, เปลี่ยน billing, API keys",
                  "รองรับ: Google Authenticator, Authy, 1Password",
                ].map((text) => (
                  <div key={text} className="flex items-start gap-2">
                    <Check
                      size={14}
                      className="shrink-0 mt-0.5"
                      style={{ color: "var(--accent)" }}
                    />
                    <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                      {text}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={startEnable}
                  disabled={setupLoading}
                  className="gap-1.5 font-semibold"
                  style={{
                    background: "var(--accent)",
                    color: "var(--text-on-accent, var(--bg-base))",
                  }}
                >
                  {setupLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      เปิดใช้ 2FA <ArrowRight size={14} />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          Enable 2FA Dialog — 3 Steps
          ═══════════════════════════════════════════════════════ */}
      <Dialog open={enableOpen} onOpenChange={(open) => {
        // Only allow close on step 1-2; step 3 needs explicit completion
        if (!open && enableStep === 3) return;
        setEnableOpen(open);
      }}>
        <DialogContent
          className="sm:max-w-[560px] bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-primary)]"
          showCloseButton={enableStep !== 3}
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-semibold text-[var(--text-primary)]">
                ตั้งค่าการยืนยันตัวตนสองขั้นตอน
              </DialogTitle>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                ขั้นตอน {enableStep}/3
              </span>
            </div>
            <DialogDescription className="text-[13px] text-[var(--text-muted)]">
              {enableStep === 1 && "สแกน QR Code ด้วยแอป Authenticator"}
              {enableStep === 2 && "กรอกรหัส 6 หลักจากแอปเพื่อยืนยัน"}
              {enableStep === 3 && "เปิดใช้ 2FA สำเร็จ! บันทึก Backup Codes"}
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: QR Code */}
          {enableStep === 1 && setupData && (
            <div className="space-y-4 mt-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                  ขั้นตอนที่ 1: สแกน QR Code
                </p>
                <div className="flex flex-col sm:flex-row gap-5">
                  {/* QR Code */}
                  <div
                    className="flex justify-center p-4 rounded-lg self-center"
                    style={{ background: "white" }}
                  >
                    <img
                      src={setupData.qrCode}
                      alt="QR Code สำหรับตั้งค่า 2FA — ใช้แอป Authenticator สแกน"
                      width={200}
                      height={200}
                      className="w-[200px] h-[200px]"
                    />
                  </div>
                  {/* App list */}
                  <div className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                    <p className="mb-2">เปิดแอป Authenticator แล้วสแกน QR Code นี้:</p>
                    <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>แอปที่รองรับ:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Google Authenticator</li>
                      <li>• Authy</li>
                      <li>• 1Password</li>
                      <li>• Microsoft Authenticator</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Manual key */}
              <div>
                <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                  สแกนไม่ได้? ใส่ key ด้วยมือ:
                </p>
                <div
                  className="flex items-center gap-2 rounded-lg px-4 py-3"
                  style={{
                    background: "var(--bg-inset, var(--bg-base))",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  <code
                    className="flex-1 text-sm font-mono tracking-wider"
                    style={{ color: "var(--text-primary)" }}
                    aria-label="Secret key สำหรับใส่ด้วยมือ"
                  >
                    {showSecret
                      ? formatSecret(setupData.secret)
                      : "•••• •••• •••• ••••"}
                  </code>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="p-1.5 rounded-md cursor-pointer hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    aria-label={showSecret ? "ซ่อน secret key" : "แสดง secret key"}
                  >
                    {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={copySecret}
                    className="p-1.5 rounded-md cursor-pointer hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                    style={{ color: secretCopied ? "var(--accent)" : "var(--text-muted)" }}
                    aria-label="คัดลอก secret key"
                  >
                    {secretCopied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEnableOpen(false)}
                  className="text-xs"
                >
                  ยกเลิก
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setEnableStep(2);
                    setVerifyCode("");
                    setVerifyError("");
                  }}
                  className="gap-1.5 text-xs font-semibold"
                  style={{
                    background: "var(--accent)",
                    color: "var(--text-on-accent, var(--bg-base))",
                  }}
                >
                  ถัดไป <ArrowRight size={12} />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Verify TOTP */}
          {enableStep === 2 && (
            <div className="space-y-4 mt-2">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                ขั้นตอนที่ 2: ยืนยันรหัส
              </p>
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                ใส่รหัส 6 หลักจากแอป Authenticator เพื่อยืนยัน:
              </p>

              <div className="flex justify-center py-2">
                <InputOTP
                  maxLength={6}
                  value={verifyCode}
                  onChange={(value) => {
                    setVerifyCode(value);
                    setVerifyError("");
                    if (value.length === 6) {
                      setTimeout(() => handleVerifyEnable(value), 100);
                    }
                  }}
                  disabled={verifying}
                  autoFocus
                >
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2].map((i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="w-12 h-14 bg-[var(--bg-inset)] border-[var(--border-default)] text-[var(--text-primary)] text-2xl font-bold font-mono rounded-lg data-[active=true]:border-[var(--accent)] data-[active=true]:ring-[rgba(var(--accent-rgb),0.12)]"
                        aria-label={`รหัสยืนยัน หลักที่ ${i + 1}`}
                      />
                    ))}
                  </InputOTPGroup>
                  <div className="w-3" />
                  <InputOTPGroup className="gap-2">
                    {[3, 4, 5].map((i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="w-12 h-14 bg-[var(--bg-inset)] border-[var(--border-default)] text-[var(--text-primary)] text-2xl font-bold font-mono rounded-lg data-[active=true]:border-[var(--accent)] data-[active=true]:ring-[rgba(var(--accent-rgb),0.12)]"
                        aria-label={`รหัสยืนยัน หลักที่ ${i + 1}`}
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
                รหัสจะเปลี่ยนทุก 30 วินาที
              </p>

              {verifyError && (
                <div
                  className="text-center text-[13px] p-3 rounded-lg"
                  style={{
                    color: "var(--error)",
                    background: "rgba(var(--error-rgb),0.06)",
                    border: "1px solid rgba(var(--error-rgb),0.12)",
                  }}
                >
                  {verifyError}
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEnableStep(1)}
                  className="gap-1.5 text-xs"
                >
                  <ArrowLeft size={12} /> ย้อนกลับ
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleVerifyEnable(verifyCode)}
                  disabled={verifying || verifyCode.length !== 6}
                  className="gap-1.5 text-xs font-semibold"
                  style={{
                    background: "var(--accent)",
                    color: "var(--text-on-accent, var(--bg-base))",
                  }}
                >
                  {verifying ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> กำลังยืนยัน...
                    </>
                  ) : (
                    <>
                      ยืนยัน <ArrowRight size={12} />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Backup Codes */}
          {enableStep === 3 && setupData && (
            <div className="space-y-4 mt-2">
              <div
                className="flex items-center gap-2 p-3 rounded-lg"
                style={{
                  background: "rgba(var(--success-rgb),0.08)",
                  border: "1px solid rgba(var(--success-rgb),0.15)",
                }}
              >
                <Check size={16} style={{ color: "var(--success)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--success)" }}>
                  เปิดใช้ 2FA สำเร็จ!
                </span>
              </div>

              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Backup Codes — บันทึกไว้ที่ปลอดภัย
              </p>

              <BackupCodesDisplay
                codes={setupData.recoveryCodes}
                onCopy={() => copyBackupCodes(setupData.recoveryCodes)}
                onDownload={() => downloadBackupCodes(setupData.recoveryCodes)}
              />

              {/* Confirmation checkbox */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <Checkbox
                  checked={savedConfirmed}
                  onCheckedChange={(checked) => setSavedConfirmed(checked === true)}
                />
                <span className="text-[13px]" style={{ color: "var(--text-primary)" }}>
                  ฉันบันทึก Backup Codes แล้ว
                </span>
              </label>

              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  onClick={handleEnableComplete}
                  disabled={!savedConfirmed}
                  className="text-xs font-semibold"
                  style={{
                    background: savedConfirmed ? "var(--accent)" : undefined,
                    color: savedConfirmed ? "var(--text-on-accent, var(--bg-base))" : undefined,
                    opacity: savedConfirmed ? 1 : 0.5,
                  }}
                >
                  เสร็จสิ้น
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════
          Disable 2FA Dialog
          ═══════════════════════════════════════════════════════ */}
      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent className="sm:max-w-[480px] bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-primary)]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-[var(--text-primary)]">
              ปิดการยืนยันตัวตนสองขั้นตอน
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Warning */}
            <div
              className="rounded-lg p-4"
              style={{
                background: "rgba(var(--warning-rgb),0.08)",
                border: "1px solid rgba(var(--warning-rgb),0.15)",
              }}
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle
                  size={16}
                  className="shrink-0 mt-0.5"
                  style={{ color: "var(--warning)" }}
                />
                <div className="text-[13px]" style={{ color: "var(--warning)" }}>
                  <p>การปิด 2FA จะลดความปลอดภัยของบัญชี</p>
                  <p className="mt-0.5">บางฟีเจอร์อาจถูกจำกัดการเข้าถึง</p>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-xs font-medium uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                รหัสผ่าน
              </label>
              <Input
                type="password"
                value={disablePassword}
                onChange={(e) => {
                  setDisablePassword(e.target.value);
                  setDisableError("");
                }}
                placeholder="กรอกรหัสผ่านเพื่อยืนยัน"
                className="h-11 bg-[var(--bg-inset)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                autoFocus
              />
            </div>

            {disableError && (
              <p className="text-[13px]" style={{ color: "var(--error)" }}>
                {disableError}
              </p>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDisableOpen(false)}
                className="text-xs"
              >
                ยกเลิก
              </Button>
              <Button
                size="sm"
                onClick={handleDisable}
                disabled={disabling || !disablePassword}
                className="gap-1.5 text-xs font-semibold bg-[var(--error)] text-white hover:bg-[var(--error)]/90"
              >
                {disabling ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> กำลังปิด...
                  </>
                ) : (
                  "ปิด 2FA"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════
          Regenerate Backup Codes Dialog
          ═══════════════════════════════════════════════════════ */}
      <Dialog open={regenOpen} onOpenChange={(open) => {
        if (!open && regenCodes) return; // Don't close while showing new codes
        setRegenOpen(open);
      }}>
        <DialogContent className="sm:max-w-[560px] bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-primary)]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-[var(--text-primary)]">
              สร้าง Backup Codes ใหม่
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {regenCodes ? (
              /* Show new codes */
              <>
                <BackupCodesDisplay
                  codes={regenCodes}
                  onCopy={() => copyBackupCodes(regenCodes)}
                  onDownload={() => downloadBackupCodes(regenCodes)}
                />
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <Checkbox
                    checked={regenSaved}
                    onCheckedChange={(checked) => setRegenSaved(checked === true)}
                  />
                  <span className="text-[13px]" style={{ color: "var(--text-primary)" }}>
                    ฉันบันทึก Backup Codes ใหม่แล้ว
                  </span>
                </label>
                <div className="flex justify-end pt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setRegenOpen(false);
                      setRegenCodes(null);
                      fetchStatus();
                    }}
                    disabled={!regenSaved}
                    className="text-xs font-semibold"
                    style={{
                      background: regenSaved ? "var(--accent)" : undefined,
                      color: regenSaved ? "var(--text-on-accent, var(--bg-base))" : undefined,
                      opacity: regenSaved ? 1 : 0.5,
                    }}
                  >
                    เสร็จสิ้น
                  </Button>
                </div>
              </>
            ) : (
              /* Verify TOTP first */
              <>
                <div
                  className="rounded-lg p-4"
                  style={{
                    background: "rgba(var(--warning-rgb),0.08)",
                    border: "1px solid rgba(var(--warning-rgb),0.15)",
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: "var(--warning)" }} />
                    <span className="text-[13px]" style={{ color: "var(--warning)" }}>
                      Codes เก่าจะหมดอายุทันที
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-[13px] mb-3" style={{ color: "var(--text-muted)" }}>
                    ยืนยันด้วยรหัส 2FA:
                  </p>
                  <div className="flex justify-center py-2">
                    <InputOTP
                      maxLength={6}
                      value={regenCode}
                      onChange={(value) => {
                        setRegenCode(value);
                        setRegenError("");
                        if (value.length === 6) {
                          setTimeout(() => handleRegenerate(), 100);
                        }
                      }}
                      disabled={regenerating}
                      autoFocus
                    >
                      <InputOTPGroup className="gap-2">
                        {[0, 1, 2].map((i) => (
                          <InputOTPSlot
                            key={i}
                            index={i}
                            className="w-12 h-14 bg-[var(--bg-inset)] border-[var(--border-default)] text-[var(--text-primary)] text-2xl font-bold font-mono rounded-lg data-[active=true]:border-[var(--accent)] data-[active=true]:ring-[rgba(var(--accent-rgb),0.12)]"
                          />
                        ))}
                      </InputOTPGroup>
                      <div className="w-3" />
                      <InputOTPGroup className="gap-2">
                        {[3, 4, 5].map((i) => (
                          <InputOTPSlot
                            key={i}
                            index={i}
                            className="w-12 h-14 bg-[var(--bg-inset)] border-[var(--border-default)] text-[var(--text-primary)] text-2xl font-bold font-mono rounded-lg data-[active=true]:border-[var(--accent)] data-[active=true]:ring-[rgba(var(--accent-rgb),0.12)]"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                {regenError && (
                  <p className="text-center text-[13px]" style={{ color: "var(--error)" }}>
                    {regenError}
                  </p>
                )}

                <div className="flex justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRegenOpen(false)}
                    className="text-xs"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleRegenerate}
                    disabled={regenerating || regenCode.length !== 6}
                    className="gap-1.5 text-xs font-semibold"
                    style={{
                      background: "var(--accent)",
                      color: "var(--text-on-accent, var(--bg-base))",
                    }}
                  >
                    {regenerating ? (
                      <>
                        <Loader2 size={12} className="animate-spin" /> กำลังสร้าง...
                      </>
                    ) : (
                      "สร้างใหม่"
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
