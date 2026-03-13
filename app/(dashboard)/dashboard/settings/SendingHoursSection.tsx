"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, AlertTriangle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import CustomSelect from "@/components/ui/CustomSelect";
import { formatThaiTime } from "@/lib/format-thai-date";

/* ── Types ── */
interface SendingHoursStatus {
  allowed: boolean;
  reason?: string;
  nextAllowedAt?: string;
  blockStart: string;
  blockEnd: string;
  timezone: string;
}

/* ── Constants ── */
const NBTC_START = 8; // กสทช. อนุญาต 08:00
const NBTC_END = 20; // กสทช. ห้ามหลัง 20:00

const HOUR_OPTIONS = Array.from({ length: NBTC_END - NBTC_START + 1 }, (_, i) => {
  const h = NBTC_START + i;
  return { value: String(h), label: `${String(h).padStart(2, "0")}:00` };
});

function formatRelativeTime(isoStr: string): string {
  const target = new Date(isoStr);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return "ตอนนี้";
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `อีก ${hours} ชม. ${mins} นาที`;
  return `อีก ${mins} นาที`;
}

/* ── Component ── */
export default function SendingHoursSection() {
  const [status, setStatus] = useState<SendingHoursStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Custom hours state
  const [useCustom, setUseCustom] = useState(false);
  const [startHour, setStartHour] = useState(String(NBTC_START));
  const [endHour, setEndHour] = useState(String(NBTC_END));
  const [saving, setSaving] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/sending-hours");
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data);
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Validate: end must be after start, both within NBTC bounds
  const startNum = Number(startHour);
  const endNum = Number(endHour);
  const isValid = endNum > startNum && startNum >= NBTC_START && endNum <= NBTC_END;

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sendingHoursStart: startNum,
          sendingHoursEnd: endNum,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "ไม่สามารถบันทึกได้");
      }
      toast.success("บันทึกเวลาส่งสำเร็จ");
      await fetchStatus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ไม่สามารถบันทึกได้");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-6 md:p-8">
      {/* Header */}
      <h2 className="text-base font-semibold text-[var(--text-primary)] mb-5 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[rgba(var(--accent-rgb),0.1)] border border-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center">
          <Clock size={16} className="text-[var(--accent)]" />
        </div>
        เวลาส่ง SMS
      </h2>

      {/* Current status */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Loader2 size={14} className="animate-spin" />
          กำลังโหลด...
        </div>
      ) : status ? (
        <div className="space-y-4">
          {/* Status indicator */}
          <div
            className="flex items-start gap-3 rounded-lg p-4"
            style={{
              background: status.allowed
                ? "rgba(var(--success-rgb), 0.06)"
                : "rgba(var(--warning-rgb), 0.06)",
              border: `1px solid ${
                status.allowed
                  ? "rgba(var(--success-rgb), 0.15)"
                  : "rgba(var(--warning-rgb), 0.15)"
              }`,
            }}
          >
            {status.allowed ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{ color: "var(--success)" }} />
            ) : (
              <AlertTriangle size={18} className="mt-0.5 shrink-0" style={{ color: "var(--warning)" }} />
            )}
            <div className="min-w-0">
              <p
                className="text-sm font-medium"
                style={{ color: status.allowed ? "var(--success)" : "var(--warning)" }}
              >
                {status.allowed
                  ? "อนุญาตส่ง SMS ได้"
                  : "อยู่ในช่วงเวลาห้ามส่ง"}
              </p>
              {!status.allowed && status.nextAllowedAt && (
                <p className="text-xs mt-1 text-[var(--text-muted)]">
                  ส่งได้อีกครั้ง: {formatRelativeTime(status.nextAllowedAt)} (
                  {formatThaiTime(status.nextAllowedAt)}
                  )
                </p>
              )}
              {status.allowed && (
                <p className="text-xs mt-1 text-[var(--text-muted)]">
                  ช่วงเวลาที่ส่งได้: {status.blockEnd} - {status.blockStart} น.
                </p>
              )}
            </div>
          </div>

          {/* NBTC info */}
          <div
            className="flex items-start gap-3 rounded-lg px-4 py-3"
            style={{
              background: "rgba(var(--info-rgb), 0.06)",
              border: "1px solid rgba(var(--info-rgb), 0.15)",
            }}
          >
            <Info size={16} className="mt-0.5 shrink-0" style={{ color: "var(--info)" }} />
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              <strong className="text-[var(--text-secondary)]">กสทช.</strong> กำหนดห้ามส่ง SMS
              โฆษณาระหว่าง 20:00-08:00 น. (เวลาประเทศไทย) — ข้อความ OTP และ Transactional
              ไม่ได้รับผลกระทบ
            </p>
          </div>

          {/* Custom sending hours toggle */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <Switch
                checked={useCustom}
                onCheckedChange={setUseCustom}
              />
              <span className="text-sm text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                กำหนดเวลาส่งเอง
              </span>
            </label>
            <p className="text-xs text-[var(--text-muted)] mt-1.5 ml-[52px]">
              จำกัดเวลาส่ง SMS ให้แคบกว่าเวลาที่ กสทช. กำหนด (08:00-20:00)
            </p>
          </div>

          {/* Time pickers */}
          {useCustom && (
            <div className="ml-[52px] space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-2 gap-4 max-w-xs">
                <div>
                  <label className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-medium">
                    เริ่มส่งได้
                  </label>
                  <CustomSelect
                    value={startHour}
                    onChange={(v) => setStartHour(v)}
                    options={HOUR_OPTIONS.filter((o) => Number(o.value) < endNum)}
                    placeholder="เลือกเวลา"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-medium">
                    ส่งได้ถึง
                  </label>
                  <CustomSelect
                    value={endHour}
                    onChange={(v) => setEndHour(v)}
                    options={HOUR_OPTIONS.filter((o) => Number(o.value) > startNum)}
                    placeholder="เลือกเวลา"
                  />
                </div>
              </div>

              {!isValid && (
                <p className="text-xs text-[var(--error)]">
                  เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น
                </p>
              )}

              <p className="text-xs text-[var(--text-muted)]">
                SMS จะส่งได้เฉพาะช่วง{" "}
                <strong className="text-[var(--text-secondary)]">
                  {String(startNum).padStart(2, "0")}:00 - {String(endNum).padStart(2, "0")}:00 น.
                </strong>
              </p>

              <Button
                onClick={handleSave}
                disabled={!isValid || saving}
                className="h-9 px-5 font-semibold"
                style={{
                  background: isValid ? "var(--accent)" : "var(--bg-elevated)",
                  color: isValid ? "var(--bg-base)" : "var(--text-muted)",
                }}
              >
                {saving && <Loader2 size={14} className="animate-spin mr-1.5" />}
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">ไม่สามารถโหลดข้อมูลเวลาส่งได้</p>
      )}
    </div>
  );
}
