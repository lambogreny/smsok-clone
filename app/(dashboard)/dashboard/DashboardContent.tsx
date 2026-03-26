"use client";

const ACCENT = "var(--accent)";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Line,
  LineChart,
} from "recharts";
import {
  Send,
  Megaphone,
  UserPlus,
  Package,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Trophy,
  Copy,
  X,
  ChevronRight,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OnboardingChecklist from "@/components/blocks/OnboardingChecklist";
import TrialBanner, { TrialNotice } from "@/components/blocks/TrialBanner";
import { formatThaiDateOnly, formatThaiDateShort, formatThaiTime } from "@/lib/format-thai-date";

/* ── Types ── */

type DayStats = {
  day: string;
  short: string;
  date: string;
  sms: number;
  delivered: number;
  failed: number;
};

type DashboardStats = {
  user: { name: string; email: string };
  today: { total: number; delivered: number; failed: number; sent: number; pending: number };
  yesterday: { total: number; delivered: number; failed: number; sent: number; pending: number };
  thisMonth: { total: number; delivered: number; failed: number; sent: number; pending: number };
  recentMessages: {
    id: string;
    recipient: string;
    status: string;
    senderName: string;
    creditCost: number;
    createdAt: string;
  }[];
  last7Days: DayStats[];
  smsRemaining?: number;
};

type QuotaPackage = {
  id: string;
  smsTotal: number;
  smsUsed: number;
  expiresAt: string;
  tier: { name: string; tierCode: string };
};

type QuotaData = {
  packages: QuotaPackage[];
  totalSms: number;
  totalUsed: number;
  totalRemaining: number;
};

type ActivityItem = {
  id: string;
  type: string;
  icon: typeof CheckCircle;
  color: string;
  title: string;
  subtitle?: string;
  time: string;
};

type AccountStatus = "trial" | "active" | "suspended";

type Props = {
  stats?: DashboardStats;
  quota?: QuotaData;
  onboardingSteps?: string[];
  showOnboarding?: boolean;
  accountStatus?: AccountStatus;
  alerts?: SmartAlert[];
  trialCreditsRemaining?: number;
  trialCreditsTotal?: number;
  trialDaysRemaining?: number;
};

/* ── Package Upgrade Banner ── */
function PackageUpgradeBanner({ quota }: { quota?: QuotaData }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || !quota) return null;

  const remaining = quota.totalRemaining;
  const total = quota.totalSms;
  const pct = total > 0 ? Math.round((remaining / total) * 100) : 0;

  const firstPkg = quota.packages?.[0];
  const pkgName = firstPkg?.tier?.name ?? "—";
  const expiresAt = firstPkg?.expiresAt ? new Date(firstPkg.expiresAt) : null;
  const daysUntilExpiry = expiresAt
    ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Show only when credits < 20% OR expiring within 7 days
  const isLowCredits = pct < 20;
  const isExpiring = daysUntilExpiry !== null && daysUntilExpiry <= 7;
  if (!isLowCredits && !isExpiring) return null;

  const isEmpty = remaining === 0;
  const borderColor = isEmpty ? "var(--error)" : "var(--accent)";
  const bgGradient = isEmpty
    ? "linear-gradient(135deg, var(--bg-base), rgba(var(--error-rgb),0.06))"
    : "linear-gradient(135deg, var(--bg-base), rgba(var(--accent-rgb),0.06))";

  return (
    <div
      className="rounded-xl p-5 relative"
      style={{ background: bgGradient, borderLeft: `4px solid ${borderColor}` }}
      role="alert"
    >
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1 rounded-md hover:bg-[rgba(var(--text-primary-rgb),0.05)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
        aria-label="ปิดแจ้งเตือน"
      >
        <X size={14} />
      </button>

      <div className="flex items-start gap-2 mb-2">
        <span className="text-base">{isEmpty ? "🔴" : "⚡"}</span>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          {isEmpty
            ? "แพคเกจหมดแล้ว!"
            : `แพคเกจใกล้หมด — เหลือ ${remaining.toLocaleString()} ข้อความ (${pct}%)`}
        </h3>
      </div>

      <div className="text-xs text-[var(--text-muted)] space-y-0.5 mb-3 ml-6">
        <p>แพคเกจปัจจุบัน: {pkgName} ({total.toLocaleString()} ข้อความ)</p>
        {expiresAt && (
          <p>
            หมดอายุ: {formatThaiDateOnly(firstPkg!.expiresAt)}
            {daysUntilExpiry !== null && daysUntilExpiry <= 3 && (
              <span className="text-[var(--error)] font-medium ml-1">
                (เหลืออีก {daysUntilExpiry} วัน)
              </span>
            )}
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div className="ml-6 mb-4">
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ background: "rgba(var(--text-primary-rgb),0.08)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(pct, 100)}%`,
              background: isEmpty ? "var(--error)" : "linear-gradient(90deg, var(--accent), var(--accent-hover))",
            }}
          />
        </div>
        <div className="text-right text-[10px] text-[var(--text-muted)] mt-0.5">{pct}%</div>
      </div>

      <div className="ml-6">
        <Link href="/dashboard/billing/packages">
          <Button
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold rounded-lg"
            size="sm"
          >
            ซื้อแพ็กเกจ →
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* ── Smart Alert Cards ── */
type SmartAlert = {
  id: string;
  type: "campaign_running" | "sender_approved" | "sender_rejected" | "order_approved" | "order_pending" | "low_credits" | "system_notice";
  icon: string;
  borderColor: string;
  title: string;
  action: { label: string; href: string };
  time: string;
};

function SmartAlertCards({ alerts }: { alerts: SmartAlert[] }) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visible = alerts.filter((a) => !dismissedIds.has(a.id));
  if (visible.length === 0) return null;

  const shown = visible.slice(0, 3);
  const remaining = visible.length - 3;

  function dismiss(id: string) {
    setDismissedIds((prev) => new Set([...prev, id]));
  }

  return (
    <div className="space-y-2">
      {shown.map((alert) => (
        <div
          key={alert.id}
          className="flex items-start gap-3 rounded-lg px-4 py-3 relative bg-[var(--bg-surface)]/80 backdrop-blur border border-white/5"
          style={{ borderLeftWidth: 3, borderLeftColor: alert.borderColor }}
        >
          <span className="text-sm mt-0.5 shrink-0">{alert.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[var(--text-primary)]">{alert.title}</p>
            <div className="flex items-center gap-3 mt-1">
              <Link
                href={alert.action.href}
                className="text-xs font-medium hover:underline"
                style={{ color: alert.borderColor }}
              >
                {alert.action.label}
              </Link>
              <span className="text-[11px] text-[var(--text-muted)]">{alert.time}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => dismiss(alert.id)}
            className="p-1 rounded-md hover:bg-[rgba(255,255,255,0.05)] transition-colors text-[var(--text-muted)] hover:text-white cursor-pointer shrink-0"
            aria-label="ปิด"
          >
            <X size={12} />
          </button>
        </div>
      ))}
      {remaining > 0 && (
        <Link
          href="/dashboard/notifications"
          className="block text-center text-xs text-[var(--accent)] hover:underline py-1"
        >
          ดูการแจ้งเตือนทั้งหมด ({visible.length}) →
        </Link>
      )}
    </div>
  );
}

/* ── Quick Actions ── */
const QUICK_ACTIONS = [
  { icon: Send, label: "ส่ง SMS", href: "/dashboard/send", color: "var(--accent)" },
  { icon: Megaphone, label: "สร้างแคมเปญ", href: "/dashboard/campaigns", color: "var(--accent-secondary)" },
  { icon: UserPlus, label: "เพิ่มรายชื่อ", href: "/dashboard/contacts", color: "var(--accent-purple)" },
  { icon: Package, label: "ซื้อแพ็กเกจ", href: "/dashboard/billing/packages", color: "var(--accent-warm)" },
];

function QuickActionsBar() {
  return (
    <div className="flex gap-3 overflow-x-auto pt-1 pb-1 -mx-1 px-1 scrollbar-hide">
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-4 py-3 min-w-[140px] shrink-0 flex-1 hover:shadow-sm hover:-translate-y-[1px] transition-all duration-200"
            style={{ "--action-color": action.color } as React.CSSProperties}
          >
            <div
              className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
              style={{ background: `color-mix(in srgb, ${action.color} 10%, transparent)` }}
            >
              <Icon size={18} style={{ color: action.color }} />
            </div>
            <span className="text-sm font-medium text-[var(--text-primary)]">{action.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

/* ── Sparkline (mini chart) ── */
function Sparkline({ data, color = ACCENT }: { data: number[]; color?: string }) {
  const chartData = data.map((v, i) => ({ v, i }));
  return (
    <div className="h-6 w-full min-w-0" aria-hidden="true">
      <ResponsiveContainer width="100%" height={24} minWidth={0}>
        <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Enhanced Stat Cards ── */
function StatCardsGrid({
  stats,
  quota,
  sparklineData,
}: {
  stats?: DashboardStats;
  quota?: QuotaData;
  sparklineData: number[];
}) {
  const remaining = quota?.totalRemaining ?? stats?.smsRemaining ?? 0;
  const total = quota?.totalSms ?? 0;
  const quotaPct = total > 0 ? Math.round((remaining / total) * 100) : 0;
  const quotaBarColor = quotaPct < 5 ? "var(--error)" : quotaPct < 20 ? "var(--warning)" : "var(--accent)";

  const todayTotal = stats?.today.total ?? 0;
  const yesterdayTotal = stats?.yesterday?.total ?? 0;
  const sentDelta = calcDelta(todayTotal, yesterdayTotal);

  const deliveryRate = todayTotal > 0
    ? Math.round(((stats?.today.delivered ?? 0) / todayTotal) * 100 * 10) / 10
    : 0;
  const lastWeekDelivered = stats?.last7Days
    ? stats.last7Days.reduce((a, d) => a + d.delivered, 0)
    : 0;
  const lastWeekTotal = stats?.last7Days
    ? stats.last7Days.reduce((a, d) => a + d.sms, 0)
    : 0;
  const weekRate = lastWeekTotal > 0 ? Math.round((lastWeekDelivered / lastWeekTotal) * 100 * 10) / 10 : 0;
  const rateDelta = deliveryRate - weekRate;

  // Get first package name for display
  const firstPkg = quota?.packages?.[0];
  const pkgName = firstPkg?.tier?.name ?? "—";
  const pkgExpiry = firstPkg?.expiresAt
    ? formatThaiDateOnly(firstPkg.expiresAt)
    : "";

  const cards = [
    {
      key: "remaining",
      label: "SMS คงเหลือ",
      value: remaining.toLocaleString(),
      href: "/dashboard/packages/my",
      iconBg: "rgba(var(--accent-rgb),0.08)",
      iconColor: "var(--accent)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--accent)]">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      bottom: (
        <div className="mt-2 space-y-1.5">
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ background: "var(--bg-muted, var(--border-default))" }}
            role="progressbar"
            aria-valuenow={remaining}
            aria-valuemax={total}
            aria-label={`โควต้าเหลือ ${quotaPct}%`}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(quotaPct, 100)}%`, background: quotaBarColor }}
            />
          </div>
          <div className="flex justify-between text-[10px]" style={{ color: "var(--text-muted)" }}>
            <span>{pkgName}</span>
            <span>{quotaPct}%</span>
          </div>
        </div>
      ),
    },
    {
      key: "sent",
      label: "ส่งวันนี้",
      value: todayTotal.toLocaleString(),
      href: "/dashboard/messages",
      iconBg: "rgba(var(--accent-blue-rgb),0.08)",
      iconColor: "var(--accent-secondary)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--accent-secondary)]">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
      ),
      delta: sentDelta,
      bottom: <Sparkline data={sparklineData} color="var(--accent-secondary)" />,
    },
    {
      key: "rate",
      label: "อัตราสำเร็จ",
      value: `${deliveryRate}%`,
      href: "/dashboard/messages",
      iconBg: "var(--success-bg)",
      iconColor: "var(--success)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--success)]">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      delta: {
        text: `${rateDelta >= 0 ? "+" : ""}${rateDelta.toFixed(1)}%`,
        positive: rateDelta >= 0,
        sub: "vs สัปดาห์",
      },
      bottom: (
        <Sparkline
          data={stats?.last7Days?.map((d) => (d.sms > 0 ? Math.round((d.delivered / d.sms) * 100) : 0)) ?? []}
          color="var(--success)"
        />
      ),
    },
    {
      key: "failed",
      label: "ล้มเหลว",
      value: (stats?.today.failed ?? 0).toLocaleString(),
      href: "/dashboard/messages",
      iconBg: "var(--danger-bg)",
      iconColor: "var(--error)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--error)]">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      delta: calcDelta(stats?.today.failed ?? 0, stats?.yesterday?.failed ?? 0),
      bottom: (
        <Sparkline
          data={stats?.last7Days?.map((d) => d.failed) ?? []}
          color="var(--error)"
        />
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Link key={card.key} href={card.href}>
          <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg hover:border-[var(--border-light)] hover:-translate-y-[1px] transition-all duration-200 h-full cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-md flex items-center justify-center"
                  style={{ background: card.iconBg }}
                >
                  {card.icon}
                </div>
                {card.delta && (
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                      card.delta.positive
                        ? "bg-[var(--success-bg)] text-[var(--success)] border-[rgba(8,153,129,0.15)]"
                        : "bg-[var(--danger-bg)] text-[var(--error)] border-[rgba(242,54,69,0.15)]"
                    }`}
                  >
                    {card.delta.positive ? "↑" : "↓"} {card.delta.text}
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-0.5">
                {card.value}
              </div>
              <div className="text-xs font-medium text-[var(--text-secondary)] mb-2">
                {card.label}
              </div>
              {card.bottom}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

/* ── Chart Tooltip — Nansen flat style ── */
/* eslint-disable @typescript-eslint/no-explicit-any */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3 shadow-xl">
      <p className="text-xs font-semibold text-[var(--text-primary)] mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[var(--text-muted)]">
              {entry.dataKey === "sms" ? "ทั้งหมด" : entry.dataKey === "delivered" ? "สำเร็จ" : "ล้มเหลว"}
            </span>
          </span>
          <span className="font-semibold text-[var(--text-primary)]">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ── Usage Chart ── */
function UsageChart({ chartData }: { chartData: DayStats[] }) {
  const [period, setPeriod] = useState<"D" | "W" | "M">("W");

  const total = chartData.reduce((a, b) => a + b.sms, 0);
  const delivered = chartData.reduce((a, b) => a + b.delivered, 0);
  const failed = chartData.reduce((a, b) => a + b.failed, 0);
  const avg = Math.round(total / (chartData.length || 1));
  const rate = total > 0 ? ((delivered / total) * 100).toFixed(1) : "0";

  return (
    <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">ปริมาณ SMS</h3>
          <div className="flex gap-1 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-full p-0.5">
            {(["D", "W", "M"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPeriod(tab)}
                className={`h-7 px-3 text-xs rounded-full font-medium transition-colors ${
                  period === tab
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Legend row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span className="text-[var(--text-muted)]">ส่งทั้งหมด: {total.toLocaleString()}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-secondary)]" />
            <span className="text-[var(--text-muted)]">สำเร็จ: {delivered.toLocaleString()} ({rate}%)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--error)]" />
            <span className="text-[var(--text-muted)]">ล้มเหลว: {failed.toLocaleString()}</span>
          </span>
          <span className="flex items-center gap-1.5 ml-auto">
            <span className="w-3 h-0.5 rounded-full bg-[var(--warning)] opacity-40" />
            <span className="text-[var(--text-muted)]">เฉลี่ย/วัน: {avg}</span>
          </span>
        </div>

        <div aria-label="กราฟปริมาณ SMS">
          <ResponsiveContainer width="100%" height={260}>
            <RechartsAreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradSms" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ACCENT} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradDelivered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-secondary)" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="var(--accent-secondary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="short"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--text-muted)", fontSize: 9 }}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeDasharray: "4 4" }} />
              <ReferenceLine
                y={avg}
                stroke="rgba(var(--warning-rgb),0.25)"
                strokeDasharray="6 4"
                label={{ value: "avg", position: "right", fill: "rgba(var(--warning-rgb),0.4)", fontSize: 9 }}
              />
              <Area
                type="monotone"
                dataKey="sms"
                stroke={ACCENT}
                strokeWidth={2}
                fill="url(#gradSms)"
                dot={{ r: 3, fill: ACCENT, stroke: "var(--bg-base)", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: ACCENT, stroke: "var(--bg-base)", strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="delivered"
                stroke="var(--accent-secondary)"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                fill="url(#gradDelivered)"
                dot={false}
                activeDot={{ r: 4, fill: "var(--accent-secondary)", stroke: "var(--bg-base)", strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="failed"
                stroke="var(--error)"
                strokeWidth={1}
                fill="none"
                dot={false}
                activeDot={{ r: 3, fill: "var(--error)", stroke: "var(--bg-base)", strokeWidth: 2 }}
              />
            </RechartsAreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Quota Widget ── */
function QuotaWidget({ quota }: { quota?: QuotaData }) {
  const remaining = quota?.totalRemaining ?? 0;
  const total = quota?.totalSms ?? 0;
  const pct = total > 0 ? Math.round((remaining / total) * 100) : 0;
  const barColor = pct < 5 ? "var(--error)" : pct < 20 ? "var(--warning)" : "var(--accent)";

  const packages = quota?.packages ?? [];
  const firstPkg = packages[0];

  return (
    <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
      <CardContent className="p-5">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">โควต้าข้อความ</h3>

        {/* Main quota */}
        <div className="text-center mb-3">
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {remaining.toLocaleString()} <span className="text-sm font-normal text-[var(--text-muted)]">/ {total.toLocaleString()}</span>
          </div>
        </div>

        <div
          className="w-full h-2 rounded-full overflow-hidden mb-1"
          style={{ background: "var(--border-default)" }}
          role="progressbar"
          aria-valuenow={remaining}
          aria-valuemax={total}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(pct, 100)}%`, background: barColor }}
          />
        </div>
        <div className="text-center text-xs font-medium mb-4" style={{ color: "var(--text-muted)" }}>
          {pct}%
        </div>

        {firstPkg && (
          <div className="text-xs space-y-1 mb-4" style={{ color: "var(--text-muted)" }}>
            <div className="flex justify-between">
              <span>แพ็กเกจ</span>
              <span className="text-[var(--text-primary)] font-medium">{firstPkg.tier.name}</span>
            </div>
            <div className="flex justify-between">
              <span>หมดอายุ</span>
              <span className="text-[var(--text-primary)]">
                {formatThaiDateOnly(firstPkg.expiresAt)}
              </span>
            </div>
          </div>
        )}

        <Link href="/dashboard/billing/packages">
          <Button
            variant="outline"
            className="w-full border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-base)] rounded-lg"
            size="sm"
          >
            ซื้อเพิ่ม →
          </Button>
        </Link>

        {/* FIFO Package List */}
        {packages.length > 1 && (
          <div className="mt-5 pt-4 border-t border-[var(--border-default)]">
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              แพ็กเกจคงเหลือ (FIFO)
            </h4>
            <div className="space-y-3">
              {packages.map((pkg, idx) => {
                const pkgRemaining = pkg.smsTotal - pkg.smsUsed;
                const pkgPct = pkg.smsTotal > 0 ? Math.round((pkgRemaining / pkg.smsTotal) * 100) : 0;
                return (
                  <div key={pkg.id} className="text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5">
                        <Package size={12} style={{ color: "var(--text-muted)" }} />
                        <span className="font-medium text-[var(--text-primary)]">{pkg.tier.name}</span>
                        {idx === 0 && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(var(--warning-rgb),0.15)", color: "var(--warning)" }}
                          >
                            ใช้ก่อน
                          </span>
                        )}
                      </span>
                      <span className="text-[var(--text-muted)]">{pkgRemaining.toLocaleString()} ข้อความ</span>
                    </div>
                    <div
                      className="w-full h-1 rounded-full overflow-hidden"
                      style={{ background: "var(--border-default)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pkgPct}%`, background: idx === 0 ? "var(--accent)" : "var(--text-muted)" }}
                      />
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      หมดอายุ: {formatThaiDateShort(pkg.expiresAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Activity Feed ── */
function ActivityFeed({ messages }: { messages: DashboardStats["recentMessages"] }) {
  // Generate activity items from recent messages
  const items: ActivityItem[] = useMemo(() => {
    if (!messages?.length) return [];
    return messages.slice(0, 10).map((msg) => {
      const time = formatThaiTime(msg.createdAt);
      if (msg.status === "delivered" || msg.status === "sent") {
        return {
          id: msg.id,
          type: "sms_sent",
          icon: CheckCircle,
          color: "var(--success)",
          title: `SMS ส่งสำเร็จ ถึง ${msg.recipient}`,
          subtitle: `Sender: ${msg.senderName}`,
          time,
        };
      }
      if (msg.status === "failed") {
        return {
          id: msg.id,
          type: "sms_failed",
          icon: XCircle,
          color: "var(--error)",
          title: `SMS ล้มเหลว ถึง ${msg.recipient}`,
          subtitle: `Sender: ${msg.senderName}`,
          time,
        };
      }
      return {
        id: msg.id,
        type: "sms_pending",
        icon: Info,
        color: "var(--warning)",
        title: `กำลังส่ง SMS ถึง ${msg.recipient}`,
        subtitle: `Sender: ${msg.senderName}`,
        time,
      };
    });
  }, [messages]);

  return (
    <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">กิจกรรมล่าสุด</h3>
          <Link href="/dashboard/messages" className="text-xs text-[var(--accent)] hover:underline">
            ดูทั้งหมด →
          </Link>
        </div>

        {items.length > 0 ? (
          <ol className="space-y-0" aria-label="กิจกรรมล่าสุด">
            {items.slice(0, 8).map((item, idx) => {
              const Icon = item.icon;
              return (
                <li key={item.id} className="flex gap-3 relative">
                  {/* Timeline line */}
                  {idx < items.length - 1 && (
                    <div
                      className="absolute left-[9px] top-[24px] w-[2px] h-[calc(100%-4px)]"
                      style={{ background: "var(--border-subtle)" }}
                    />
                  )}
                  {/* Dot */}
                  <div className="shrink-0 relative z-10 mt-1">
                    <div
                      className="w-[20px] h-[20px] rounded-full flex items-center justify-center"
                      style={{ background: `color-mix(in srgb, ${item.color} 15%, transparent)` }}
                    >
                      <Icon size={11} style={{ color: item.color }} />
                    </div>
                  </div>
                  {/* Content */}
                  <div className="flex-1 pb-4 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[11px] font-mono shrink-0" style={{ color: "var(--text-muted)" }}>
                        {item.time}
                      </span>
                      <span className="text-sm text-[var(--text-primary)] truncate">{item.title}</span>
                    </div>
                    {item.subtitle && (
                      <span className="text-xs block mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="text-center py-8">
            <Info size={24} style={{ color: "var(--text-muted)" }} className="mx-auto mb-2" />
            <p className="text-sm text-[var(--text-muted)]">ยังไม่มีกิจกรรม</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Recent Messages Table ── */
const statusConfig: Record<string, { badge: string; label: string }> = {
  delivered: { badge: "bg-[var(--success-bg)] text-[var(--success)] border border-[rgba(8,153,129,0.2)]", label: "สำเร็จ" },
  sent: { badge: "bg-[rgba(var(--accent-rgb),0.08)] text-[var(--accent)] border border-[rgba(var(--accent-rgb),0.2)]", label: "ส่งแล้ว" },
  pending: { badge: "bg-[var(--warning-bg)] text-[var(--warning)] border border-[rgba(var(--warning-rgb),0.2)]", label: "รอส่ง" },
  failed: { badge: "bg-[var(--danger-bg)] text-[var(--error)] border border-[rgba(242,54,69,0.2)]", label: "ล้มเหลว" },
};

function RecentMessagesTable({ messages }: { messages: DashboardStats["recentMessages"] }) {
  return (
    <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">ข้อความล่าสุด</h3>
        <Link href="/dashboard/messages" className="text-xs text-[var(--accent)] hover:underline">
          ดูทั้งหมด →
        </Link>
      </div>

      {messages && messages.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[var(--table-header)] border-b border-[var(--border-default)] hover:bg-[var(--table-header)]">
                <TableHead className="text-[12px] uppercase text-[var(--text-secondary)] font-semibold tracking-[0.05em] py-2.5 px-4">เวลา</TableHead>
                <TableHead className="text-[12px] uppercase text-[var(--text-secondary)] font-semibold tracking-[0.05em] py-2.5 px-4">ผู้รับ</TableHead>
                <TableHead className="text-[12px] uppercase text-[var(--text-secondary)] font-semibold tracking-[0.05em] py-2.5 px-4 hidden md:table-cell">ผู้ส่ง</TableHead>
                <TableHead className="text-[12px] uppercase text-[var(--text-secondary)] font-semibold tracking-[0.05em] py-2.5 px-4 text-center">สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.slice(0, 5).map((msg, i) => {
                const s = statusConfig[msg.status] || statusConfig.pending;
                const time = formatThaiTime(msg.createdAt);
                return (
                  <TableRow
                    key={msg.id}
                    className={`border-b border-[var(--border-default)] hover:bg-[var(--bg-base)] transition-[background] duration-150 h-10 ${
                      i % 2 === 0 ? "bg-transparent" : "bg-[var(--table-alt-row)]"
                    }`}
                  >
                    <TableCell className="text-sm text-[var(--text-primary)] font-mono py-2 px-4">{time}</TableCell>
                    <TableCell className="text-sm text-[var(--text-primary)] font-mono py-2 px-4">{msg.recipient}</TableCell>
                    <TableCell className="text-sm text-[var(--text-secondary)] py-2 px-4 hidden md:table-cell">{msg.senderName}</TableCell>
                    <TableCell className="py-2 px-4 text-center">
                      <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${s.badge}`}>
                        {s.label}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 px-5">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--text-muted)] mx-auto mb-3">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <p className="text-sm font-medium text-[var(--text-primary)] mb-1">ยังไม่มีข้อความ</p>
          <p className="text-xs text-[var(--text-muted)]">ส่ง SMS แรกของคุณเลย</p>
        </div>
      )}
    </Card>
  );
}

/* ── Account Status Badge ── */
const accountStatusConfig: Record<AccountStatus, { label: string; cls: string }> = {
  trial: {
    label: "ทดลองใช้งาน",
    cls: "bg-[rgba(var(--accent-purple-rgb),0.1)] text-[var(--accent-purple)] border-[rgba(var(--accent-purple-rgb),0.2)]",
  },
  active: {
    label: "ใช้งานอยู่",
    cls: "bg-[var(--success-bg)] text-[var(--success)] border-[rgba(8,153,129,0.2)]",
  },
  suspended: {
    label: "ถูกระงับ",
    cls: "bg-[var(--danger-bg)] text-[var(--error)] border-[rgba(242,54,69,0.2)]",
  },
};

function AccountStatusBadge({ status }: { status?: AccountStatus }) {
  if (!status) return null;
  const cfg = accountStatusConfig[status];
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

/* ── Credit Usage Chart Widget ── */
type CreditUsageDay = { date: string; label: string; used: number };

function CreditUsageChart({ quota }: { quota?: QuotaData }) {
  const [data, setData] = useState<CreditUsageDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d">("7d");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/credits/usage?period=${period}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        const days: { date: string; creditsUsed: number }[] =
          res?.usage ?? res?.data?.usage ?? [];
        if (days.length > 0) {
          setData(
            days.map((d) => ({
              date: d.date,
              label: new Date(d.date).toLocaleDateString("th-TH", {
                day: "numeric",
                month: "short",
              }),
              used: d.creditsUsed,
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const remaining = quota?.totalRemaining ?? 0;
  const total = quota?.totalSms ?? 0;
  const pct = total > 0 ? Math.round((remaining / total) * 100) : 0;
  const isLow = pct < 10;

  const totalUsed = data.reduce((a, b) => a + b.used, 0);
  const avgPerDay = data.length > 0 ? Math.round(totalUsed / data.length) : 0;
  const maxUsed = Math.max(...data.map((d) => d.used), 0);

  return (
    <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            เครดิตที่ใช้
          </h3>
          <div className="flex gap-1 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-full p-0.5">
            {(["7d", "30d"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPeriod(tab)}
                className={`h-7 px-3 text-xs rounded-full font-medium transition-colors ${
                  period === tab
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {tab === "7d" ? "7 วัน" : "30 วัน"}
              </button>
            ))}
          </div>
        </div>

        {/* Balance + Warning */}
        <div className="flex items-center gap-4 mb-4">
          <div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {remaining.toLocaleString()}
            </div>
            <div className="text-xs text-[var(--text-muted)]">เครดิตคงเหลือ</div>
          </div>
          {isLow && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(var(--error-rgb),0.08)] border border-[rgba(var(--error-rgb),0.15)]">
              <AlertTriangle size={14} className="text-[var(--error)]" />
              <span className="text-xs font-medium text-[var(--error)]">
                เหลือน้อยกว่า {pct}%
              </span>
            </div>
          )}
          <div className="ml-auto">
            <Link href="/dashboard/billing/packages">
              <Button
                size="sm"
                className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] rounded-lg text-xs"
              >
                ซื้อเพิ่ม →
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary row */}
        <div className="flex gap-4 mb-3 text-[11px] text-[var(--text-muted)]">
          <span>
            ใช้ทั้งหมด:{" "}
            <span className="font-semibold text-[var(--text-primary)]">
              {totalUsed.toLocaleString()}
            </span>
          </span>
          <span>
            เฉลี่ย/วัน:{" "}
            <span className="font-semibold text-[var(--text-primary)]">
              {avgPerDay.toLocaleString()}
            </span>
          </span>
        </div>

        {/* Chart */}
        {loading ? (
          <div className="flex items-center justify-center h-[180px]">
            <span className="text-xs text-[var(--text-muted)]">กำลังโหลด...</span>
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCredit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-warm)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--accent-warm)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                dy={6}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--text-muted)", fontSize: 9 }}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--text-primary)", fontWeight: 600 }}
                itemStyle={{ color: "var(--text-muted)" }}
                formatter={(value) => [
                  `${Number(value).toLocaleString()} เครดิต`,
                  "ใช้ไป",
                ]}
              />
              <ReferenceLine
                y={avgPerDay}
                stroke="rgba(var(--warning-rgb),0.25)"
                strokeDasharray="6 4"
                label={{
                  value: "avg",
                  position: "right",
                  fill: "rgba(var(--warning-rgb),0.4)",
                  fontSize: 9,
                }}
              />
              <Line
                type="monotone"
                dataKey="used"
                stroke="var(--accent-warm)"
                strokeWidth={2}
                dot={{
                  r: 3,
                  fill: "var(--accent-warm)",
                  stroke: "var(--bg-base)",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 5,
                  fill: "var(--accent-warm)",
                  stroke: "var(--bg-base)",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[180px] text-center">
            <Info
              size={24}
              className="text-[var(--text-muted)] mb-2"
            />
            <p className="text-xs text-[var(--text-muted)]">
              ยังไม่มีข้อมูลการใช้เครดิต
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Helpers ── */
function calcDelta(today: number, yesterday: number): { text: string; positive: boolean } {
  if (yesterday === 0 && today === 0) return { text: "—", positive: true };
  if (yesterday === 0) return { text: `+${today}`, positive: true };
  const pct = Math.round(((today - yesterday) / yesterday) * 100);
  return { text: `${pct >= 0 ? "+" : ""}${pct}%`, positive: pct >= 0 };
}

/* ── Main Dashboard ── */
export default function DashboardContent({
  stats,
  quota,
  onboardingSteps = [],
  showOnboarding = false,
  accountStatus,
  alerts = [],
  trialCreditsRemaining,
  trialCreditsTotal,
  trialDaysRemaining,
}: Props) {
  const sparklineData = stats?.last7Days?.map((d) => d.sms) ?? [];

  // Determine trial status
  const trialStatus = accountStatus === "trial"
    ? (trialDaysRemaining !== undefined && trialDaysRemaining <= 0) || (trialCreditsRemaining !== undefined && trialCreditsRemaining <= 0)
      ? "expired" as const
      : "active" as const
    : "none" as const;

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">ภาพรวม</h1>
          <AccountStatusBadge status={accountStatus} />
        </div>
        <Link href="/dashboard/send">
          <Button
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold rounded-lg"
            size="lg"
          >
            ส่ง SMS →
          </Button>
        </Link>
      </div>

      {/* ── Trial Banner (conditional) ── */}
      <TrialBanner
        status={trialStatus}
        creditsRemaining={trialCreditsRemaining}
        creditsTotal={trialCreditsTotal}
        daysRemaining={trialDaysRemaining}
      />

      {/* ── Package Upgrade Banner (conditional) ── */}
      <PackageUpgradeBanner quota={quota} />

      {/* ── Smart Alert Cards ── */}
      <SmartAlertCards alerts={alerts} />

      {/* ── Onboarding Checklist (conditional) ── */}
      {showOnboarding && <OnboardingChecklist completedSteps={onboardingSteps} />}

      {/* ── Quick Actions Bar ── */}
      <QuickActionsBar />

      {/* ── Stat Cards ── */}
      <StatCardsGrid stats={stats} quota={quota} sparklineData={sparklineData} />

      {/* ── Chart + Quota Widget (60/40 split) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <UsageChart chartData={stats?.last7Days ?? []} />
        </div>
        <div className="lg:col-span-2">
          <QuotaWidget quota={quota} />
        </div>
      </div>

      {/* ── Trial API Limit Notice ── */}
      {accountStatus === "trial" && (
        <TrialNotice variant="api-limit" />
      )}

      {/* ── Credit Usage Chart ── */}
      <CreditUsageChart quota={quota} />

      {/* ── Activity Feed + Recent Messages (50/50 split) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ActivityFeed messages={stats?.recentMessages ?? []} />
        <RecentMessagesTable messages={stats?.recentMessages ?? []} />
      </div>
    </div>
  );
}
