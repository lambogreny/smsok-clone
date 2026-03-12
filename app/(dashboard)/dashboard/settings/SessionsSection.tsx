"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  LogOut,
  Loader2,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";

/* ── Types ── */
interface Session {
  id: string;
  deviceName: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  location: string | null;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

/* ── Helpers ── */
function getDeviceIcon(deviceType: string | null) {
  switch (deviceType?.toLowerCase()) {
    case "mobile":
      return Smartphone;
    case "tablet":
      return Tablet;
    default:
      return Monitor;
  }
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "เมื่อสักครู่";
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} วันที่แล้ว`;
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });
}

function getBrowserOs(browser: string | null, os: string | null): string {
  const parts = [browser, os].filter(Boolean);
  if (parts.length === 0) return "ไม่ทราบอุปกรณ์";
  return parts.join(" on ");
}

/* ── Component ── */
export default function SessionsSection() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [showConfirmAll, setShowConfirmAll] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/settings/sessions");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSessions(data.sessions ?? []);
    } catch {
      toast.error("ไม่สามารถโหลดรายการเซสชันได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  async function handleRevoke(sessionId: string) {
    setRevokingId(sessionId);
    try {
      const res = await fetch(`/api/v1/settings/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "ไม่สามารถเพิกถอนเซสชันได้");
      }
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success("เพิกถอนเซสชันแล้ว");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setRevokingId(null);
    }
  }

  async function handleRevokeAll() {
    setRevokingAll(true);
    try {
      const res = await fetch("/api/v1/settings/sessions/all", {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      setShowConfirmAll(false);
      toast.success(`เพิกถอน ${data.revoked} เซสชันแล้ว`);
    } catch {
      toast.error("ไม่สามารถเพิกถอนเซสชันได้");
    } finally {
      setRevokingAll(false);
    }
  }

  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[rgba(var(--accent-rgb),0.1)] border border-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center">
            <Globe size={16} className="text-[var(--accent)]" />
          </div>
          เซสชันที่ใช้งาน
        </h2>
        {otherSessions.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfirmAll(true)}
            className="text-[var(--error)] border-[rgba(var(--error-rgb),0.2)] hover:bg-[rgba(var(--error-rgb),0.06)]"
          >
            <LogOut size={14} className="mr-1.5" />
            ออกจากระบบทุกเครื่อง
          </Button>
        )}
      </div>

      {/* Confirm All Dialog */}
      {showConfirmAll && (
        <div
          className="flex items-start gap-3 rounded-lg p-4 mb-5"
          style={{
            background: "rgba(var(--error-rgb), 0.06)",
            border: "1px solid rgba(var(--error-rgb), 0.15)",
          }}
        >
          <AlertTriangle size={18} className="mt-0.5 shrink-0" style={{ color: "var(--error)" }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--error)]">
              ยืนยันออกจากระบบทุกเครื่อง?
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              เซสชันทั้งหมด {otherSessions.length} รายการจะถูกเพิกถอน (ยกเว้นเครื่องนี้)
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleRevokeAll}
                disabled={revokingAll}
                className="h-8 px-4 font-semibold bg-[var(--error)] text-white hover:bg-[var(--error)]/90"
              >
                {revokingAll && <Loader2 size={12} className="animate-spin mr-1.5" />}
                {revokingAll ? "กำลังเพิกถอน..." : "ยืนยัน"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmAll(false)}
                className="h-8"
              >
                ยกเลิก
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse flex items-center gap-4 rounded-lg p-4"
              style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)]" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-40 rounded bg-[var(--bg-elevated)]" />
                <div className="h-3 w-24 rounded bg-[var(--bg-elevated)]" />
              </div>
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Shield}
          iconColor="var(--accent)"
          iconBg="rgba(var(--accent-rgb), 0.1)"
          title="ไม่พบเซสชัน"
          description="ไม่มีเซสชันที่ใช้งานอยู่"
          ctaLabel="รีเฟรช"
          ctaAction={fetchSessions}
        />
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => {
            const DeviceIcon = getDeviceIcon(s.deviceType);
            const isRevoking = revokingId === s.id;

            return (
              <div
                key={s.id}
                className="flex items-center gap-4 rounded-lg p-4 transition-colors"
                style={{
                  background: s.isCurrent
                    ? "rgba(var(--accent-rgb), 0.04)"
                    : "var(--bg-base)",
                  border: `1px solid ${
                    s.isCurrent
                      ? "rgba(var(--accent-rgb), 0.15)"
                      : "var(--border-default)"
                  }`,
                }}
              >
                {/* Device icon */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: s.isCurrent
                      ? "rgba(var(--accent-rgb), 0.1)"
                      : "var(--bg-elevated)",
                    border: `1px solid ${
                      s.isCurrent
                        ? "rgba(var(--accent-rgb), 0.15)"
                        : "var(--border-default)"
                    }`,
                  }}
                >
                  <DeviceIcon
                    size={18}
                    style={{
                      color: s.isCurrent ? "var(--accent)" : "var(--text-muted)",
                    }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {getBrowserOs(s.browser, s.os)}
                    </p>
                    {s.isCurrent && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] border border-[rgba(var(--accent-rgb),0.15)] shrink-0">
                        เซสชันปัจจุบัน
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {s.ipAddress && (
                      <span className="text-xs text-[var(--text-muted)] font-mono">
                        {s.ipAddress}
                      </span>
                    )}
                    {s.location && (
                      <span className="text-xs text-[var(--text-muted)]">
                        {s.location}
                      </span>
                    )}
                    <span className="text-xs text-[var(--text-muted)]">
                      {formatRelativeTime(s.lastActiveAt)}
                    </span>
                  </div>
                </div>

                {/* Revoke button */}
                {!s.isCurrent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevoke(s.id)}
                    disabled={isRevoking}
                    className="shrink-0 h-8 text-xs text-[var(--text-muted)] border-[var(--border-default)] hover:text-[var(--error)] hover:border-[rgba(var(--error-rgb),0.3)]"
                  >
                    {isRevoking ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <>
                        <LogOut size={12} className="mr-1" />
                        ออกจากระบบ
                      </>
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Session count */}
      {!loading && sessions.length > 0 && (
        <p className="text-xs text-[var(--text-muted)] mt-4">
          แสดงเซสชันที่ใช้งานใน 30 วันล่าสุด ({sessions.length} รายการ)
        </p>
      )}
    </div>
  );
}
