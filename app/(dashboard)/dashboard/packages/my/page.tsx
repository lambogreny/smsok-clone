"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  Smartphone,
  Clock,
  Loader2,
  AlertTriangle,
  Plus,
  Info,
} from "lucide-react";
import { formatThaiDateOnly } from "@/lib/format-thai-date";
import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ─── Types ─── */

interface ActivePackage {
  id: string;
  tier: string;
  name: string;
  smsRemaining: number;
  smsTotal: number;
  sendersUsed: number;
  sendersMax: number | null;
  purchasedAt: string;
  expiresAt: string;
  daysLeft: number;
  autoRenew: boolean;
  isFifoFirst: boolean;
}

interface UsagePoint {
  label: string;
  count: number;
}

interface ExpiredPackage {
  id: string;
  name: string;
  smsUsed: number;
  smsTotal: number;
  expiresAt: string;
}

/* ─── Helpers ─── */

function progressColor(pct: number) {
  if (pct > 50) return "var(--accent)";
  if (pct >= 20) return "var(--warning)";
  return "var(--error)";
}

/* ─── Page ─── */

export default function MyPackagesPage() {
  const [packages, setPackages] = useState<ActivePackage[]>([]);
  const [expired, setExpired] = useState<ExpiredPackage[]>([]);
  const [usage, setUsage] = useState<UsagePoint[]>([]);
  const [usageRange, setUsageRange] = useState<"day" | "week" | "month">("day");
  const [loading, setLoading] = useState(true);

  const totalRemaining = packages.reduce((sum, p) => sum + p.smsRemaining, 0);
  const totalSms = packages.reduce((sum, p) => sum + p.smsTotal, 0);
  const totalSendersUsed = Math.max(...packages.map((p) => p.sendersUsed), 0);
  const totalSendersMax = packages.reduce(
    (max, p) => (p.sendersMax === null ? Infinity : Math.max(max, p.sendersMax ?? 0)),
    0,
  );
  const nearestExpiry =
    packages.length > 0
      ? packages.reduce((min, p) => (p.daysLeft < min.daysLeft ? p : min)).expiresAt
      : "—";
  const remainingPercent = totalSms > 0 ? (totalRemaining / totalSms) * 100 : 0;

  const fetchData = useCallback(async () => {
    try {
      const [pkgRes, usageRes] = await Promise.all([
        fetch("/api/v1/packages/my"),
        fetch(`/api/v1/packages/usage?range=${usageRange}`),
      ]);
      if (pkgRes.ok) {
        const data = await pkgRes.json();
        setPackages(data.active ?? []);
        setExpired(data.expired ?? []);
      }
      if (usageRes.ok) {
        const data = await usageRes.json();
        setUsage(Array.isArray(data) ? data : data.usage ?? []);
      }
    } catch {
      toast.error("ไม่สามารถโหลดข้อมูลแพ็กเกจได้");
    } finally {
      setLoading(false);
    }
  }, [usageRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleToggleAutoRenew(pkgId: string, enabled: boolean) {
    try {
      const res = await fetch(`/api/v1/packages/${pkgId}/auto-renew`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(enabled ? "เปิดต่ออายุอัตโนมัติ" : "ปิดต่ออายุอัตโนมัติ");
      fetchData();
    } catch {
      toast.error("ไม่สามารถเปลี่ยนการตั้งค่าได้");
    }
  }

  const usageTotal = usage.reduce((s, u) => s + u.count, 0);
  const periodLabel = usageRange === "day" ? "สัปดาห์นี้" : usageRange === "week" ? "เดือนนี้" : "ปีนี้";

  if (loading) {
    return (
      <div className="px-8 py-6 max-md:px-4 flex items-center justify-center h-60">
        <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  return (
    <div className="px-8 py-6 max-md:px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">แพ็กเกจของฉัน</h1>
          <p className="text-sm text-[var(--text-muted)]">จัดการแพ็กเกจ SMS ที่ active</p>
        </div>
        <Link href="/dashboard/packages">
          <Button className="gap-2 text-sm font-semibold bg-[var(--accent)] text-[var(--bg-base)] hover:bg-[var(--accent-hover)]">
            <Plus size={14} /> ซื้อเพิ่ม
          </Button>
        </Link>
      </div>

      {/* Warning Banners */}
      {remainingPercent > 0 && remainingPercent < 20 && (
        <div
          className={cn(
            "flex items-center justify-between rounded-lg px-4 py-3 mb-4 border-l-[3px]",
            remainingPercent < 5
              ? "bg-[rgba(var(--error-rgb,239,68,68),0.06)] border border-[rgba(var(--error-rgb,239,68,68),0.15)] border-l-[var(--error)]"
              : "bg-[rgba(var(--warning-rgb,245,158,11),0.06)] border border-[rgba(var(--warning-rgb,245,158,11),0.15)] border-l-[var(--warning)]",
          )}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className={remainingPercent < 5 ? "text-[var(--error)]" : "text-[var(--warning)]"} />
            <span className="text-sm text-[var(--text-primary)]">
              ⚠️ SMS เหลือน้อย{remainingPercent < 5 ? "มาก" : ""} — {totalRemaining.toLocaleString()}/{totalSms.toLocaleString()} ({remainingPercent.toFixed(1)}%)
            </span>
          </div>
          <Link href="/dashboard/packages">
            <Button size="sm" className="text-xs font-medium bg-[var(--accent)] text-[var(--bg-base)] hover:bg-[var(--accent-hover)]">
              ซื้อเพิ่ม →
            </Button>
          </Link>
        </div>
      )}

      {totalRemaining === 0 && totalSms > 0 && (
        <div className="flex items-center justify-between rounded-lg px-4 py-3 mb-4 bg-[rgba(var(--error-rgb,239,68,68),0.06)] border border-[rgba(var(--error-rgb,239,68,68),0.15)] border-l-[3px] border-l-[var(--error)]">
          <span className="text-sm text-[var(--text-primary)]">❌ SMS หมดแล้ว — ซื้อ package ใหม่เพื่อส่ง SMS ต่อ</span>
          <Link href="/dashboard/packages">
            <Button size="sm" className="text-xs font-medium bg-[var(--error)] text-[var(--text-primary)] hover:opacity-90">
              ซื้อ Package →
            </Button>
          </Link>
        </div>
      )}

      {/* SMS Summary Card */}
      <div className="rounded-lg p-7 max-md:p-4 mb-6 bg-[var(--bg-surface)] border border-[var(--border-default)]">
        <p className="text-sm font-medium mb-4 text-[var(--text-muted)]">SMS คงเหลือ</p>

        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-extrabold text-[var(--text-primary)] tabular-nums">
            {totalRemaining.toLocaleString()}
          </span>
          <span className="text-base text-[var(--text-muted)]">/ {totalSms.toLocaleString()} SMS</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 rounded-full mb-2 bg-[var(--border-default)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${remainingPercent}%`, background: progressColor(remainingPercent) }}
          />
        </div>
        <p className="text-sm font-semibold" style={{ color: progressColor(remainingPercent) }}>
          {remainingPercent.toFixed(1)}%
        </p>

        {/* Sub-stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <div className="rounded-xl p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)]">
            <div className="flex items-center gap-2 mb-1">
              <Smartphone size={14} className="text-[var(--text-muted)]" />
              <span className="text-xs text-[var(--text-muted)]">Senders</span>
            </div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {totalSendersUsed} / {totalSendersMax === Infinity ? "∞" : totalSendersMax} used
            </p>
          </div>
          <div className="rounded-xl p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)]">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} className="text-[var(--text-muted)]" />
              <span className="text-xs text-[var(--text-muted)]">หมดอายุเร็วสุด</span>
            </div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{nearestExpiry}</p>
          </div>
        </div>
      </div>

      {/* Active Packages */}
      {packages.length === 0 ? (
        <EmptyState
          icon={Package}
          iconColor="var(--warning)"
          iconBg="rgba(var(--warning-rgb,245,158,11),0.06)"
          iconBorder="rgba(var(--warning-rgb,245,158,11),0.1)"
          title="ยังไม่มี Package ที่ใช้งาน"
          description={"ซื้อ Package เพื่อรับ SMS quota\nเริ่มต้นที่ ฿500 สำหรับ 500 SMS"}
          ctaLabel="🛒 ดู Package ทั้งหมด"
          ctaAction={() => { window.location.href = "/dashboard/packages"; }}
        />
      ) : (
        <div className="space-y-3 mb-6">
          {packages.map((pkg) => {
            const pct = pkg.smsTotal > 0 ? (pkg.smsRemaining / pkg.smsTotal) * 100 : 0;
            const isNearExpiry = pkg.daysLeft < 30;
            return (
              <div
                key={pkg.id}
                className={cn(
                  "relative rounded-lg p-5 max-md:p-3 bg-[var(--bg-surface)] border",
                  isNearExpiry
                    ? "border-[rgba(var(--warning-rgb,245,158,11),0.3)]"
                    : "border-[var(--border-default)]",
                )}
              >
                {pkg.isFifoFirst && (
                  <span className="absolute -top-2 right-4 bg-[var(--warning)] text-[var(--bg-base)] text-[11px] font-bold px-2.5 py-0.5 rounded">
                    ← ใช้ก่อน
                  </span>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <Package size={18} className="text-[var(--accent)]" />
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{pkg.name}</span>
                  <span className="text-[13px] text-[var(--text-muted)]">— {pkg.tier}</span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-[var(--text-primary)] font-medium">
                    {(pkg.smsRemaining ?? 0).toLocaleString()} / {(pkg.smsTotal ?? 0).toLocaleString()} remaining
                  </span>
                </div>

                <div className="w-full h-1.5 rounded-full mb-3 bg-[var(--border-default)]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: progressColor(pct) }}
                  />
                </div>

                <div className="text-[13px] leading-7 text-[var(--text-muted)]">
                  <p>ซื้อเมื่อ: {formatThaiDateOnly(pkg.purchasedAt)}</p>
                  <p>
                    หมดอายุ: {formatThaiDateOnly(pkg.expiresAt)}{" "}
                    <span className={isNearExpiry ? "text-[var(--warning)]" : ""}>
                      ({pkg.daysLeft} วัน)
                    </span>
                  </p>
                  <p>Senders: {pkg.sendersMax ?? "∞"} names</p>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[13px] text-[var(--text-muted)]">Auto-renew:</span>
                  <Switch
                    checked={pkg.autoRenew}
                    onCheckedChange={(checked) => handleToggleAutoRenew(pkg.id, checked)}
                    aria-label="Auto-renew toggle"
                  />
                </div>

                {isNearExpiry && (
                  <p className="mt-2 text-xs text-[var(--warning)] flex items-center gap-1">
                    <AlertTriangle size={12} />
                    หมดอายุใน {pkg.daysLeft} วัน
                  </p>
                )}
              </div>
            );
          })}

          <div className="flex items-center gap-1.5 text-xs italic text-[var(--text-muted)]">
            <Info size={12} />
            <span>FIFO: ระบบจะใช้ SMS จาก Package ที่หมดอายุเร็วกว่าก่อน</span>
          </div>
        </div>
      )}

      {/* Usage Chart — Recharts */}
      <div className="rounded-lg p-6 max-md:p-4 mb-6 bg-[var(--bg-surface)] border border-[var(--border-default)]">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <p className="text-sm font-medium text-[var(--text-primary)]">การใช้งาน SMS</p>
          <div className="flex items-center gap-4">
            <div className="inline-flex rounded-lg p-0.5 bg-[var(--bg-base)]">
              {(["day", "week", "month"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setUsageRange(r)}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs cursor-pointer transition-colors",
                    usageRange === r
                      ? "bg-[var(--border-default)] text-[var(--text-primary)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
                  )}
                >
                  {r === "day" ? "วัน" : r === "week" ? "สัปดาห์" : "เดือน"}
                </button>
              ))}
            </div>
            <span className="text-[13px] text-[var(--text-secondary)]">
              {periodLabel}: {usageTotal.toLocaleString()} SMS
            </span>
          </div>
        </div>

        {usage.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={usage}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              />
              <RechartsTooltip
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                contentStyle={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}
                labelStyle={{ color: "var(--text-muted)", marginBottom: 2 }}
                itemStyle={{ color: "var(--text-primary)" }}
                formatter={(value) => [`${value ?? 0} SMS`, ""]}
              />
              <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-40">
            <p className="text-xs text-[var(--text-muted)]">ยังไม่มีข้อมูลการใช้งาน</p>
          </div>
        )}
      </div>

      {/* Expired / Used Up */}
      {expired.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-3 text-[var(--text-muted)]">หมดอายุ / ใช้หมดแล้ว</p>
          {expired.map((ep) => (
            <div
              key={ep.id}
              className="rounded-xl px-5 py-3.5 mb-2 opacity-60 bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
            >
              <span className="text-[13px] line-through text-[var(--text-muted)]">📦 {ep.name}</span>
              <span className="text-xs ml-3 text-[var(--text-muted)]">
                ใช้ {(ep.smsUsed ?? 0).toLocaleString()}/{(ep.smsTotal ?? 0).toLocaleString()} SMS — หมดเมื่อ {formatThaiDateOnly(ep.expiresAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
