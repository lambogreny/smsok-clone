"use client";

import { useState } from "react";
import {
  UserPlus,
  Target,
  Zap,
  Heart,
  Download,
  Plus,
  Tag,
} from "lucide-react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import PageLayout, {
  PageHeader,
  StatCard,
  StatsRow,
  TableWrapper,
} from "@/components/blocks/PageLayout";

/* ─── Types ─── */

type DateRange = "7d" | "30d" | "90d" | "ytd";

/* ─── Tooltip Helper ─── */

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--table-header)] border border-[var(--border-default)] rounded-lg px-3 py-2 shadow-lg">
      {label && (
        <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      )}
      {payload.map((p) => (
        <p key={p.name} className="text-xs font-medium" style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

/* ─── Mock Data ─── */

// Signup funnel (horizontal bar)
const FUNNEL_DATA = [
  { stage: "Visit", count: 8420 },
  { stage: "Register", count: 3180 },
  { stage: "Verify", count: 2410 },
  { stage: "Activate", count: 1640 },
  { stage: "Convert", count: 1048 },
];

// Cohort retention (6 cohort months × 6 periods)
const COHORT_DATA = [
  { period: "M+0", Jan: 100, Feb: 100, Mar: 100, Apr: 100, May: 100, Jun: 100 },
  { period: "M+1", Jan: 85, Feb: 82, Mar: 88, Apr: 80, May: 84, Jun: 87 },
  { period: "M+2", Jan: 74, Feb: 70, Mar: 78, Apr: 68, May: 72, Jun: 76 },
  { period: "M+3", Jan: 66, Feb: 62, Mar: 71, Apr: 59, May: 65, Jun: 69 },
  { period: "M+4", Jan: 58, Feb: 55, Mar: 64, Apr: 52, May: 58, Jun: 62 },
  { period: "M+5", Jan: 52, Feb: 49, Mar: 58, Apr: 46, May: 52, Jun: 56 },
];

const COHORT_COLORS = ["var(--accent)", "var(--info)", "var(--accent-secondary)", "var(--warning)", "var(--error)", "var(--warning)"];
const COHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

// Acquisition channels pie
const CHANNEL_DATA = [
  { name: "Direct", value: 38, color: "var(--accent)" },
  { name: "Google", value: 28, color: "var(--info)" },
  { name: "Facebook", value: 18, color: "var(--accent-secondary)" },
  { name: "Referral", value: 11, color: "var(--warning)" },
  { name: "Other", value: 5, color: "var(--text-secondary)" },
];

// Inactive users
const INACTIVE_USERS = [
  { name: "บริษัท สยามเทค จำกัด", lastActive: "8 ก.พ. 2026", plan: "Basic" },
  { name: "วรรณา พาณิชย์", lastActive: "15 ม.ค. 2026", plan: "Pro" },
  { name: "ฟู้ดเดลิเวอรี่ ไทย", lastActive: "3 ก.พ. 2026", plan: "Basic" },
  { name: "จักรพงษ์ สมาร์ทช็อป", lastActive: "20 ม.ค. 2026", plan: "Starter" },
  { name: "ร้านยาเพื่อนใจ", lastActive: "29 ม.ค. 2026", plan: "Basic" },
];

// Power users
const POWER_USERS = [
  { name: "ออมสิน ดิจิทัล", smsByMonth: 48200, plan: "Enterprise", since: "มิ.ย. 2024" },
  { name: "MBK eCommerce", smsByMonth: 32500, plan: "Enterprise", since: "ส.ค. 2024" },
  { name: "ธนาคารชุมชน", smsByMonth: 28900, plan: "Enterprise", since: "ต.ค. 2024" },
  { name: "ไลน์แมน อินเตอร์", smsByMonth: 19400, plan: "Pro", since: "ม.ค. 2025" },
  { name: "อโรมา คอฟฟี่ เชน", smsByMonth: 12600, plan: "Pro", since: "มี.ค. 2025" },
];

// Trial → Paid conversions
const CONVERSIONS = [
  { name: "สตาร์ทอัพ ฟินเทค", trialStart: "1 ก.พ.", converted: "14 ก.พ.", plan: "Pro", mrr: 2490 },
  { name: "เทคโนโลยี เฮลท์", trialStart: "5 ก.พ.", converted: "18 ก.พ.", plan: "Basic", mrr: 890 },
  { name: "นวัตกรรม เอดูเคชัน", trialStart: "10 ก.พ.", converted: "22 ก.พ.", plan: "Pro", mrr: 2490 },
  { name: "กรีน ฟาร์มาซี", trialStart: "15 ก.พ.", converted: "28 ก.พ.", plan: "Starter", mrr: 390 },
  { name: "เซนทรัล โลจิสติกส์", trialStart: "20 ก.พ.", converted: "5 มี.ค.", plan: "Enterprise", mrr: 9900 },
];

// Promo codes
type PromoStatus = "active" | "expired" | "depleted";

const PROMO_CODES: Array<{
  code: string;
  discount: number;
  maxUses: number;
  used: number;
  expiry: string;
  status: PromoStatus;
}> = [
  { code: "WELCOME30", discount: 30, maxUses: 500, used: 482, expiry: "31 มี.ค. 2026", status: "active" },
  { code: "NEWYEAR50", discount: 50, maxUses: 200, used: 200, expiry: "15 ม.ค. 2026", status: "depleted" },
  { code: "STARTUP20", discount: 20, maxUses: 1000, used: 344, expiry: "30 มิ.ย. 2026", status: "active" },
  { code: "FLASH2025", discount: 40, maxUses: 100, used: 100, expiry: "31 ธ.ค. 2025", status: "expired" },
  { code: "REFER15", discount: 15, maxUses: 999, used: 87, expiry: "31 ธ.ค. 2026", status: "active" },
];

const PROMO_STATUS_CONFIG: Record<PromoStatus, { label: string; bg: string; text: string }> = {
  active:   { label: "Active",    bg: "rgba(var(--success-rgb),0.1)",  text: "var(--success)" },
  expired:  { label: "Expired",   bg: "rgba(var(--warning-rgb),0.1)",  text: "var(--warning)" },
  depleted: { label: "Depleted",  bg: "rgba(var(--error-rgb),0.1)",   text: "var(--error)" },
};

/* ─── Sub-components ─── */

function SectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--table-header)]">
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3 text-sm text-[var(--text-secondary)] border-b border-[var(--table-border)] ${className}`}>
      {children}
    </td>
  );
}

/* ─── Page ─── */

export default function MarketingDashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  const DATE_PILLS: { value: DateRange; label: string }[] = [
    { value: "7d",  label: "7d"  },
    { value: "30d", label: "30d" },
    { value: "90d", label: "90d" },
    { value: "ytd", label: "YTD" },
  ];

  return (
    <PageLayout>
      {/* Header */}
      <PageHeader
        title="Marketing Dashboard"
        description="การเติบโตและ Conversion"
        actions={
          <div className="flex items-center gap-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl p-1">
            {DATE_PILLS.map((pill) => (
              <button
                key={pill.value}
                type="button"
                onClick={() => setDateRange(pill.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  dateRange === pill.value
                    ? "bg-[var(--accent)] text-[var(--text-on-accent)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Stat Cards */}
      <StatsRow columns={4}>
        <StatCard
          icon={<UserPlus size={18} style={{ color: "var(--success)" }} />}
          iconColor="var(--success-rgb)"
          value="142"
          label="New Signups (เดือนนี้)"
          delta="+18%"
          deltaType="positive"
        />
        <StatCard
          icon={<Target size={18} style={{ color: "var(--info)" }} />}
          iconColor="var(--info-rgb)"
          value="12.4%"
          label="Conversion Rate"
        />
        <StatCard
          icon={<Zap size={18} style={{ color: "var(--warning)" }} />}
          iconColor="var(--warning-rgb)"
          value="68%"
          label="Activation Rate"
          subtitle="ผู้ใช้ที่ส่ง SMS แรก"
        />
        <StatCard
          icon={<Heart size={18} style={{ color: "var(--success)" }} />}
          iconColor="var(--success-rgb)"
          value="85%"
          label="Retention 30d"
        />
      </StatsRow>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Funnel Bar (horizontal) */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Signup Funnel</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={FUNNEL_DATA}
              layout="vertical"
              margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="funnelGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--info)" />
                  <stop offset="100%" stopColor="var(--success)" />
                </linearGradient>
              </defs>
              <CartesianGrid horizontal={false} stroke="var(--border-default)" />
              <XAxis
                type="number"
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="stage"
                type="category"
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={64}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" fill="url(#funnelGrad)" radius={[0, 6, 6, 0]} name="ผู้ใช้" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cohort Retention Area */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Cohort Retention</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={COHORT_DATA} margin={{ top: 0, right: 8, bottom: 0, left: -24 }}>
              <defs>
                {COHORT_MONTHS.map((m, i) => (
                  <linearGradient key={m} id={`cohortGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COHORT_COLORS[i]} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={COHORT_COLORS[i]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke="var(--border-default)" strokeDasharray="3 3" />
              <XAxis
                dataKey="period"
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                unit="%"
              />
              <Tooltip content={<ChartTooltip />} />
              {COHORT_MONTHS.map((m, i) => (
                <Area
                  key={m}
                  type="monotone"
                  dataKey={m}
                  stroke={COHORT_COLORS[i]}
                  strokeWidth={1.5}
                  fill={`url(#cohortGrad${i})`}
                  dot={false}
                  name={m}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Acquisition Channels Pie */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Acquisition Channels</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={CHANNEL_DATA}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {CHANNEL_DATA.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0];
                  return (
                    <div className="bg-[var(--table-header)] border border-[var(--border-default)] rounded-lg px-3 py-2 shadow-lg">
                      <p className="text-xs font-medium" style={{ color: d.payload.color }}>
                        {d.name}: {d.value}%
                      </p>
                    </div>
                  );
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3-col Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Inactive Users */}
        <SectionCard title="Inactive Users (30+ วัน)">
          <table className="w-full">
            <thead>
              <tr>
                <Th>ชื่อ</Th>
                <Th>Last Active</Th>
                <Th>Plan</Th>
                <Th> </Th>
              </tr>
            </thead>
            <tbody>
              {INACTIVE_USERS.map((u) => (
                <tr key={u.name} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                  <Td>
                    <span className="text-[var(--text-primary)] font-medium text-xs leading-tight block max-w-[100px] truncate">
                      {u.name}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-xs">{u.lastActive}</span>
                  </Td>
                  <Td>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                      {u.plan}
                    </span>
                  </Td>
                  <Td>
                    <button
                      type="button"
                      className="text-[10px] font-medium px-2 py-1 rounded-lg bg-[rgba(0,255,167,0.08)] text-[var(--accent)] hover:bg-[rgba(0,255,167,0.15)] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      ส่ง Win-back
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        {/* Power Users */}
        <SectionCard title="Power Users">
          <table className="w-full">
            <thead>
              <tr>
                <Th>ชื่อ</Th>
                <Th>SMS/เดือน</Th>
                <Th>Plan</Th>
                <Th>Since</Th>
              </tr>
            </thead>
            <tbody>
              {POWER_USERS.map((u) => (
                <tr key={u.name} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                  <Td>
                    <span className="text-[var(--text-primary)] font-medium text-xs leading-tight block max-w-[90px] truncate">
                      {u.name}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-[var(--accent)] font-semibold text-xs">
                      {u.smsByMonth.toLocaleString()}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(0,255,167,0.08)] text-[var(--accent)]">
                      {u.plan}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-xs">{u.since}</span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        {/* Trial → Paid */}
        <SectionCard title="Trial → Paid Conversion">
          <table className="w-full">
            <thead>
              <tr>
                <Th>ชื่อ</Th>
                <Th>Trial</Th>
                <Th>Converted</Th>
                <Th>MRR</Th>
              </tr>
            </thead>
            <tbody>
              {CONVERSIONS.map((c) => (
                <tr key={c.name} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                  <Td>
                    <span className="text-[var(--text-primary)] font-medium text-xs leading-tight block max-w-[90px] truncate">
                      {c.name}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-xs">{c.trialStart}</span>
                  </Td>
                  <Td>
                    <span className="text-xs">{c.converted}</span>
                  </Td>
                  <Td>
                    <span className="text-[var(--accent)] font-semibold text-xs">
                      ฿{c.mrr.toLocaleString()}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      </div>

      {/* Promo Codes */}
      <div className="mb-4">
        <SectionCard
          title="Promo Codes"
          action={
            <Button size="sm" className="gap-1.5 h-8 text-xs">
              <Plus size={13} />
              สร้าง Code ใหม่
            </Button>
          }
        >
          <table className="w-full">
            <thead>
              <tr>
                <Th>Code</Th>
                <Th>Discount</Th>
                <Th>Max Uses</Th>
                <Th>Used</Th>
                <Th>Expiry</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {PROMO_CODES.map((p) => {
                const cfg = PROMO_STATUS_CONFIG[p.status];
                return (
                  <tr key={p.code} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                    <Td>
                      <div className="flex items-center gap-2">
                        <Tag size={13} className="text-[var(--text-muted)]" />
                        <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                          {p.code}
                        </span>
                      </div>
                    </Td>
                    <Td>
                      <span className="text-xs font-semibold text-[var(--accent)]">{p.discount}%</span>
                    </Td>
                    <Td>
                      <span className="text-xs">{p.maxUses.toLocaleString()}</span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-[60px] h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.round((p.used / p.maxUses) * 100)}%`,
                              background: p.used >= p.maxUses ? "var(--error)" : "var(--accent)",
                            }}
                          />
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">
                          {p.used}/{p.maxUses}
                        </span>
                      </div>
                    </Td>
                    <Td>
                      <span className="text-xs">{p.expiry}</span>
                    </Td>
                    <Td>
                      <span
                        className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: cfg.bg, color: cfg.text }}
                      >
                        {cfg.label}
                      </span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </SectionCard>
      </div>

      {/* Export Buttons */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="gap-2">
          <Download size={14} />
          Export User List
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <Download size={14} />
          Export Funnel Data
        </Button>
      </div>
    </PageLayout>
  );
}
