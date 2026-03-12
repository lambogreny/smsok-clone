"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Send,
  DollarSign,
  Server,
  Layers,
  Pause,
  Play,
  RefreshCw,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Settings,
  Shuffle,
  Trash2,
  Search,
  RotateCcw,
} from "lucide-react";
import {
  LineChart,
  Line,
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
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CustomSelect from "@/components/ui/CustomSelect";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PageLayout, {
  PageHeader,
  FilterBar,
  TableWrapper,
  PaginationBar,
  EmptyState,
} from "@/components/blocks/PageLayout";

/* ─── Helpers ─── */

function thresholdColor(
  value: number,
  good: number,
  warning: number
): string {
  if (value >= good) return "var(--success)";
  if (value >= warning) return "var(--warning)";
  return "var(--error)";
}

/* ─── Chart Tooltip ─── */
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
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-xs font-medium" style={{ color: p.color }}>
          {p.name}: {p.value}
          {typeof p.value === "number" && p.value <= 100 ? "%" : ""}
        </p>
      ))}
    </div>
  );
}

/* ─── Mock Data ─── */

const DELIVERY_RATE = 98.7;
const SMS_TODAY = 12456;
const COST_PER_SMS = 0.32;
const PROVIDER_OK = "3/3";
const QUEUE_BACKLOG = 23;

// Provider delivery chart
const PROVIDER_CHART_DATA = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, "0")}:00`,
  Twilio: 97 + Math.random() * 3,
  ThaiBulk: 96 + Math.random() * 3,
  Backup: 94 + Math.random() * 4,
}));

// Carrier bar chart
const CARRIER_CHART_DATA = [
  { name: "AIS", rate: 99.1 },
  { name: "DTAC", rate: 98.3 },
  { name: "True", rate: 97.5 },
  { name: "NT", rate: 98.8 },
];
const CARRIER_COLORS = ["var(--accent)", "var(--info)", "var(--warning)", "var(--text-muted)"];

// Cost trend
const COST_TREND_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  cost: 0.28 + Math.random() * 0.08,
}));

// Failure pie
const FAILURE_PIE_DATA = [
  { name: "Invalid Number", value: 45, color: "var(--error)" },
  { name: "Carrier Reject", value: 30, color: "var(--warning)" },
  { name: "Timeout", value: 15, color: "var(--info)" },
  { name: "Blocked", value: 10, color: "var(--text-secondary)" },
];

// Providers
const PROVIDERS = [
  {
    name: "Twilio",
    status: "ok" as const,
    balance: "$1,234",
    rate: "0.28฿",
    priority: 1,
    label: "Primary",
  },
  {
    name: "ThaiBulkSMS",
    status: "ok" as const,
    balance: "฿45,000",
    rate: "0.25฿",
    priority: 2,
    label: "Secondary",
  },
  {
    name: "Backup SMS",
    status: "degraded" as const,
    balance: "฿12,000",
    rate: "0.35฿",
    priority: 3,
    label: "Tertiary",
  },
];

const PROVIDER_STATUS = {
  ok: { label: "🟢 OK", color: "var(--success)", bg: "rgba(var(--success-rgb),0.08)" },
  degraded: {
    label: "🟡 Degraded",
    color: "var(--warning)",
    bg: "rgba(var(--warning-rgb),0.08)",
  },
  down: { label: "🔴 Down", color: "var(--error)", bg: "rgba(var(--error-rgb),0.08)" },
};

const PRIORITY_COLORS: Record<number, string> = {
  1: "var(--accent)",
  2: "var(--info)",
  3: "var(--text-muted)",
};

// Carriers
const CARRIERS = [
  { name: "AIS", rate: 99.1, latency: 45, failures: 2 },
  { name: "DTAC", rate: 98.3, latency: 52, failures: 5 },
  { name: "True", rate: 97.5, latency: 78, failures: 12 },
  { name: "NT", rate: 98.8, latency: 41, failures: 1 },
];

// Failed messages
const FAILED_MESSAGES = [
  {
    id: "1",
    time: "14:30:25",
    phone: "081-xxx-xxxx",
    provider: "Twilio",
    carrier: "AIS",
    reason: "Timeout",
    retryable: true,
  },
  {
    id: "2",
    time: "14:28:12",
    phone: "089-xxx-xxxx",
    provider: "ThaiBulk",
    carrier: "DTAC",
    reason: "Invalid Number",
    retryable: false,
  },
  {
    id: "3",
    time: "14:25:01",
    phone: "092-xxx-xxxx",
    provider: "Twilio",
    carrier: "True",
    reason: "Carrier Reject",
    retryable: true,
  },
  {
    id: "4",
    time: "14:22:45",
    phone: "095-xxx-xxxx",
    provider: "Backup",
    carrier: "NT",
    reason: "Timeout",
    retryable: true,
  },
  {
    id: "5",
    time: "14:20:10",
    phone: "088-xxx-xxxx",
    provider: "ThaiBulk",
    carrier: "AIS",
    reason: "Blocked",
    retryable: false,
  },
];

const REASON_CONFIG: Record<string, { color: string; bg: string }> = {
  "Invalid Number": { color: "var(--error)", bg: "rgba(239,68,68,0.08)" },
  "Carrier Reject": { color: "var(--warning)", bg: "rgba(245,158,11,0.08)" },
  Timeout: { color: "var(--info)", bg: "rgba(50,152,218,0.08)" },
  Blocked: { color: "var(--text-secondary)", bg: "rgba(107,112,117,0.08)" },
};

const REASON_OPTIONS = [
  { value: "", label: "ทุก Reason" },
  { value: "Invalid Number", label: "Invalid Number" },
  { value: "Carrier Reject", label: "Carrier Reject" },
  { value: "Timeout", label: "Timeout" },
  { value: "Blocked", label: "Blocked" },
];

const PROVIDER_OPTIONS = [
  { value: "", label: "ทุก Provider" },
  { value: "Twilio", label: "Twilio" },
  { value: "ThaiBulk", label: "ThaiBulk" },
  { value: "Backup", label: "Backup" },
];

/* ─── Main Component ─── */

export default function OperationsPage() {
  const [isPaused, setIsPaused] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("เมื่อสักครู่");
  const [reasonFilter, setReasonFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  function handleRefresh() {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdate("เมื่อสักครู่");
    }, 1000);
  }

  // Auto-refresh timer
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate("อัปเดต 30 วินาทีที่แล้ว");
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredFailed = FAILED_MESSAGES.filter((m) => {
    if (reasonFilter && m.reason !== reasonFilter) return false;
    if (providerFilter && m.provider !== providerFilter) return false;
    if (searchQuery && !m.phone.includes(searchQuery)) return false;
    return true;
  });

  return (
    <PageLayout>
      {/* Header */}
      {/* Live Indicator */}
      <div className="flex items-center gap-2 mb-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
        <span className="text-[var(--success)] font-semibold text-[11px]">Live</span>
        <span className="text-[var(--text-muted)] text-[11px]">— {lastUpdate}</span>
      </div>

      <PageHeader
        title="Operations Dashboard"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={isPaused ? "default" : "destructive"}
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              className="gap-1.5"
            >
              {isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5" /> เริ่มส่งต่อ
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" /> หยุดส่ง
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="gap-1.5 border-[var(--border-default)] text-[var(--text-secondary)]"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              รีเฟรช
            </Button>
          </div>
        }
      />

      {/* 5 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        {/* Delivery Rate */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center mb-3"
            style={{ background: "rgba(0,226,181,0.08)" }}
          >
            <BarChart3 className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div
            className="text-2xl font-bold tabular-nums"
            style={{ color: thresholdColor(DELIVERY_RATE, 98, 95) }}
          >
            {DELIVERY_RATE}%
          </div>
          <div className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-[0.04em] mt-0.5">
            Delivery Rate
          </div>
          <span className="inline-block text-[11px] mt-1.5 px-2 py-0.5 rounded-full bg-[rgba(var(--success-rgb),0.08)] text-[var(--success)]">
            ↑ 0.2%
          </span>
        </div>

        {/* SMS Sent Today */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center mb-3"
            style={{ background: "rgba(50,152,218,0.08)" }}
          >
            <Send className="w-4 h-4 text-[var(--info)]" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {SMS_TODAY.toLocaleString()}
          </div>
          <div className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-[0.04em] mt-0.5">
            ส่งวันนี้
          </div>
          <span className="inline-block text-[11px] mt-1.5 px-2 py-0.5 rounded-full bg-[rgba(var(--info-rgb),0.08)] text-[var(--info)]">
            +1,234 ชม.นี้
          </span>
        </div>

        {/* Cost per SMS */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center mb-3"
            style={{ background: "rgba(245,158,11,0.08)" }}
          >
            <DollarSign className="w-4 h-4 text-[var(--warning)]" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            ฿{COST_PER_SMS}
          </div>
          <div className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-[0.04em] mt-0.5">
            ต้นทุน/SMS
          </div>
          <span className="inline-block text-[11px] mt-1.5 px-2 py-0.5 rounded-full bg-[rgba(var(--success-rgb),0.08)] text-[var(--success)]">
            ↓ ฿0.01
          </span>
        </div>

        {/* Provider Health */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center mb-3"
            style={{ background: "rgba(16,185,129,0.08)" }}
          >
            <Server className="w-4 h-4 text-[var(--success)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--success)] tabular-nums">
            {PROVIDER_OK}
          </div>
          <div className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-[0.04em] mt-0.5">
            Provider OK
          </div>
        </div>

        {/* Queue */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center mb-3"
            style={{ background: "rgba(176,180,184,0.08)" }}
          >
            <Layers className="w-4 h-4 text-[var(--text-secondary)]" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {QUEUE_BACKLOG}
          </div>
          <div className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-[0.04em] mt-0.5">
            Queue
          </div>
          <div className="text-xs text-[var(--success)] mt-1">normal</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Provider Delivery Line Chart */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Delivery by Provider
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={PROVIDER_CHART_DATA}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="hour"
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={5}
              />
              <YAxis
                domain={[92, 100]}
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={35}
              />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine
                y={98}
                stroke="var(--success)"
                strokeDasharray="5 5"
                strokeOpacity={0.5}
              />
              <Line
                type="monotone"
                dataKey="Twilio"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="ThaiBulk"
                stroke="var(--info)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Backup"
                stroke="var(--warning)"
                strokeWidth={2}
                dot={false}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Carrier Bar Chart */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Delivery by Carrier
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={CARRIER_CHART_DATA}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[95, 100]}
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={35}
              />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine
                y={98}
                stroke="var(--success)"
                strokeDasharray="5 5"
                strokeOpacity={0.5}
              />
              <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                {CARRIER_CHART_DATA.map((_, i) => (
                  <Cell key={`cell-${CARRIER_COLORS[i]}`} fill={CARRIER_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Cost Trend */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Cost Trend (30d)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={COST_TREND_DATA}>
              <defs>
                <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--warning)" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="var(--warning)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={6}
              />
              <YAxis
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
                tickFormatter={(v) => `฿${v.toFixed(2)}`}
              />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine
                y={0.32}
                stroke="var(--text-muted)"
                strokeDasharray="5 5"
                strokeOpacity={0.4}
                label={{ value: "avg", fill: "var(--text-secondary)", fontSize: 10 }}
              />
              <Area
                type="monotone"
                dataKey="cost"
                stroke="var(--warning)"
                strokeWidth={2}
                fill="url(#costGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Failure Pie */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Failure Breakdown
          </h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={FAILURE_PIE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {FAILURE_PIE_DATA.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {FAILURE_PIE_DATA.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: entry.color }}
                  />
                  <span className="text-xs text-[var(--text-secondary)]">
                    {entry.name}
                  </span>
                  <span className="text-xs font-semibold text-white">
                    {entry.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Provider Management */}
      <PageHeader title="Provider Management" />
      <TableWrapper>
        <div className="grid grid-cols-[1fr_100px_120px_80px_100px_80px_60px] gap-x-4 px-5 py-3 bg-[var(--table-header)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          <span>Provider</span>
          <span>สถานะ</span>
          <span>Balance</span>
          <span>Rate</span>
          <span>Priority</span>
          <span>Failover</span>
          <span />
        </div>
        {PROVIDERS.map((prov, i) => {
          const status = PROVIDER_STATUS[prov.status];
          return (
            <div
              key={prov.name}
              className={`grid grid-cols-[1fr_100px_120px_80px_100px_80px_60px] gap-x-4 items-center px-5 py-3.5 border-b border-[var(--table-border)] hover:bg-[rgba(255,255,255,0.015)] transition-colors ${
                i % 2 === 1 ? "bg-[var(--table-alt-row)]" : ""
              }`}
            >
              <span className="text-sm text-white font-medium">
                {prov.name}
              </span>
              <span
                className="inline-flex text-[11px] font-medium px-2.5 py-1 rounded-full w-fit"
                style={{ background: status.bg, color: status.color }}
              >
                {status.label}
              </span>
              <span className="text-sm text-white tabular-nums font-mono">
                {prov.balance}
              </span>
              <span className="text-sm text-[var(--text-secondary)] tabular-nums">
                {prov.rate}
              </span>
              <span
                className="inline-flex text-[11px] font-medium px-2.5 py-1 rounded-full w-fit"
                style={{
                  color: PRIORITY_COLORS[prov.priority],
                  background: `${PRIORITY_COLORS[prov.priority]}15`,
                }}
              >
                {prov.priority} ({prov.label})
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-[var(--text-muted)] hover:text-white"
              >
                <Settings className="w-3.5 h-3.5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer">
                  <MoreHorizontal className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <ArrowUp className="w-3.5 h-3.5" /> เลื่อน Priority
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <ArrowDown className="w-3.5 h-3.5" /> ลด Priority
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <Pause className="w-3.5 h-3.5" /> หยุดใช้ชั่วคราว
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <Shuffle className="w-3.5 h-3.5" /> Failover ทันที
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 text-[var(--error)] cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" /> ลบ provider
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </TableWrapper>

      {/* Carrier Status */}
      <div className="mt-4">
        <PageHeader title="Carrier Status" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {CARRIERS.map((carrier) => {
          const dotColor = thresholdColor(carrier.rate, 98, 95);
          const failColor =
            carrier.failures < 5
              ? "var(--success)"
              : carrier.failures < 20
                ? "var(--warning)"
                : "var(--error)";
          return (
            <div
              key={carrier.name}
              className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: dotColor }}
                />
                <span className="text-base font-semibold text-white">
                  {carrier.name}
                </span>
              </div>
              <div
                className="text-2xl font-bold tabular-nums mb-1"
                style={{ color: thresholdColor(carrier.rate, 98, 95) }}
              >
                {carrier.rate}%
              </div>
              <p className="text-[13px] text-[var(--text-secondary)]">
                {carrier.latency}ms avg
              </p>
              <p className="text-[13px]" style={{ color: failColor }}>
                {carrier.failures} fails
              </p>
            </div>
          );
        })}
      </div>

      {/* Failed Messages */}
      <PageHeader
        title="Failed Messages"
        actions={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-[var(--border-default)] text-[var(--text-secondary)]"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Retry All Failed
          </Button>
        }
      />

      <FilterBar>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <Input
            placeholder="ค้นหาเบอร์..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)]"
          />
        </div>
        <CustomSelect
          value={reasonFilter}
          onChange={(v) => {
            setReasonFilter(v);
            setPage(1);
          }}
          options={REASON_OPTIONS}
          placeholder="Reason"
        />
        <CustomSelect
          value={providerFilter}
          onChange={(v) => {
            setProviderFilter(v);
            setPage(1);
          }}
          options={PROVIDER_OPTIONS}
          placeholder="Provider"
        />
      </FilterBar>

      <TableWrapper>
        <div className="grid grid-cols-[120px_120px_100px_80px_1fr_80px] gap-x-4 px-5 py-3 bg-[var(--table-header)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          <span>เวลา</span>
          <span>เบอร์</span>
          <span>Provider</span>
          <span>Carrier</span>
          <span>Reason</span>
          <span>Retry</span>
        </div>

        {filteredFailed.length === 0 ? (
          <EmptyState
            icon={<Send className="w-10 h-10" />}
            title="ไม่พบข้อความที่ล้มเหลว"
          />
        ) : (
          filteredFailed.map((msg, i) => {
            const reasonStyle = REASON_CONFIG[msg.reason] ?? REASON_CONFIG.Blocked;
            return (
              <div
                key={msg.id}
                className={`grid grid-cols-[120px_120px_100px_80px_1fr_80px] gap-x-4 items-center px-5 py-3.5 border-b border-[var(--table-border)] hover:bg-[rgba(255,255,255,0.015)] transition-colors ${
                  i % 2 === 1 ? "bg-[var(--table-alt-row)]" : ""
                }`}
              >
                <span className="text-xs text-[var(--text-secondary)] font-mono">
                  {msg.time}
                </span>
                <span className="text-xs text-white font-mono">
                  {msg.phone}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">{msg.provider}</span>
                <span className="text-xs text-[var(--text-secondary)]">{msg.carrier}</span>
                <span
                  className="inline-flex text-[11px] font-medium px-2.5 py-1 rounded-full w-fit"
                  style={{
                    background: reasonStyle.bg,
                    color: reasonStyle.color,
                  }}
                >
                  {msg.reason}
                </span>
                {msg.retryable ? (
                  <button
                    type="button"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--accent)] hover:bg-[rgba(0,226,181,0.08)] transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-xs text-[var(--bg-muted)] text-center">—</span>
                )}
              </div>
            );
          })
        )}
      </TableWrapper>
    </PageLayout>
  );
}
