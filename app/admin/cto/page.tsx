"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  Gauge,
  AlertTriangle,
  Wifi,
  Layers,
  BellRing,
  CheckCircle2,
  XCircle,
  Info,
  Wrench,
  Trash2,
  HeartPulse,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import PageLayout, {
  PageHeader,
  TableWrapper,
} from "@/components/blocks/PageLayout";

/* ─── Mock Data Generation ─── */

function makeHours() {
  return Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
}

const HOURS = makeHours();

const LATENCY_DATA = HOURS.map((hour) => ({
  hour,
  p50: 35 + Math.round(Math.random() * 20),
  p95: 110 + Math.round(Math.random() * 50),
  p99: 280 + Math.round(Math.random() * 120),
}));

const ERROR_RATE_DATA = HOURS.map((hour) => ({
  hour,
  rate: parseFloat((Math.random() * 0.4).toFixed(3)),
}));

const REQUEST_VOLUME_DATA = HOURS.map((hour) => ({
  hour,
  requests: 800 + Math.round(Math.random() * 1600),
}));

const QUEUE_THROUGHPUT_DATA = HOURS.map((hour) => ({
  hour,
  enqueued: 600 + Math.round(Math.random() * 800),
  processed: 580 + Math.round(Math.random() * 800),
}));

/* ─── Alert Mock Data ─── */

type AlertSeverity = "critical" | "warning" | "info";

const ALERTS: {
  id: string;
  severity: AlertSeverity;
  message: string;
  time: string;
  acked: boolean;
}[] = [
  {
    id: "a1",
    severity: "critical",
    message: "p99 latency บน /api/v1/sms/send เกิน 500ms ต่อเนื่อง 5 นาที",
    time: "14:32:01",
    acked: false,
  },
  {
    id: "a2",
    severity: "warning",
    message: "Queue depth สูงกว่า threshold (current: 487, limit: 500)",
    time: "14:28:45",
    acked: false,
  },
  {
    id: "a3",
    severity: "warning",
    message: "Error rate บน /api/v1/contacts/import เพิ่มขึ้น 2.1% ใน 10 นาทีที่ผ่านมา",
    time: "14:21:10",
    acked: false,
  },
  {
    id: "a4",
    severity: "info",
    message: "Scheduled maintenance window เริ่มต้นใน 2 ชั่วโมง (03:00–04:00)",
    time: "13:59:00",
    acked: false,
  },
];

/* ─── Recent Errors ─── */

const RECENT_ERRORS = [
  {
    id: "e1",
    timestamp: "14:33:02",
    endpoint: "/api/v1/sms/send",
    message: "upstream timeout: ThaiBulkSMS ไม่ตอบสนอง",
    status: 504,
  },
  {
    id: "e2",
    timestamp: "14:31:45",
    endpoint: "/api/v1/contacts/import",
    message: "invalid CSV format: column mismatch at row 142",
    status: 422,
  },
  {
    id: "e3",
    timestamp: "14:29:18",
    endpoint: "/api/v1/campaigns/schedule",
    message: "database write timeout (pool exhausted)",
    status: 500,
  },
  {
    id: "e4",
    timestamp: "14:27:55",
    endpoint: "/api/v1/auth/refresh",
    message: "JWT signature verification failed",
    status: 401,
  },
  {
    id: "e5",
    timestamp: "14:25:30",
    endpoint: "/api/v1/sms/status",
    message: "rate limit exceeded: 429 from Twilio",
    status: 429,
  },
  {
    id: "e6",
    timestamp: "14:22:14",
    endpoint: "/api/v1/contacts/search",
    message: "query execution timeout (>5s) on contacts table",
    status: 503,
  },
];

/* ─── Slow Endpoints ─── */

const SLOW_ENDPOINTS = [
  { rank: 1, endpoint: "/api/v1/contacts/import", avgMs: 1842, p99Ms: 4210, reqMin: 3.2 },
  { rank: 2, endpoint: "/api/v1/campaigns/schedule", avgMs: 952, p99Ms: 2890, reqMin: 8.7 },
  { rank: 3, endpoint: "/api/v1/sms/send", avgMs: 487, p99Ms: 1650, reqMin: 142 },
  { rank: 4, endpoint: "/api/v1/contacts/search", avgMs: 390, p99Ms: 980, reqMin: 55 },
  { rank: 5, endpoint: "/api/v1/reports/usage", avgMs: 342, p99Ms: 890, reqMin: 12 },
  { rank: 6, endpoint: "/api/v1/campaigns/list", avgMs: 280, p99Ms: 720, reqMin: 38 },
  { rank: 7, endpoint: "/api/v1/sms/status/batch", avgMs: 245, p99Ms: 630, reqMin: 24 },
  { rank: 8, endpoint: "/api/v1/auth/login", avgMs: 210, p99Ms: 510, reqMin: 18 },
];

/* ─── Alert Config ─── */

const ALERT_CONFIG: Record<
  AlertSeverity,
  { color: string; bg: string; label: string; Icon: typeof XCircle }
> = {
  critical: {
    color: "var(--error)",
    bg: "rgba(var(--error-rgb),0.08)",
    label: "Critical",
    Icon: XCircle,
  },
  warning: {
    color: "var(--warning)",
    bg: "rgba(var(--warning-rgb),0.08)",
    label: "Warning",
    Icon: AlertTriangle,
  },
  info: {
    color: "var(--info)",
    bg: "rgba(var(--info-rgb),0.08)",
    label: "Info",
    Icon: Info,
  },
};

/* ─── Status Code Color ─── */
function statusCodeColor(code: number): string {
  if (code >= 500) return "var(--error)";
  if (code >= 400) return "var(--warning)";
  return "var(--success)";
}

/* ─── Custom Tooltip ─── */
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
    <div
      className="rounded-lg px-3 py-2 shadow-lg text-xs"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      <p className="text-[var(--text-muted)] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-medium" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

/* ─── Main Page ─── */

export default function CTODashboardPage() {
  const [lastUpdate, setLastUpdate] = useState("เมื่อสักครู่");
  const [ackedAlerts, setAckedAlerts] = useState<Set<string>>(new Set());
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate("อัปเดต 30 วินาทีที่แล้ว");
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  function ackAlert(id: string) {
    setAckedAlerts((prev) => new Set([...prev, id]));
  }

  const activeAlerts = ALERTS.filter((a) => !ackedAlerts.has(a.id));

  /* Stat thresholds */
  const ERROR_RATE = 0.12;
  const QUEUE_DEPTH = 234;

  const errorRateColor =
    ERROR_RATE >= 5 ? "var(--error)" : ERROR_RATE >= 1 ? "var(--warning)" : "var(--success)";
  const queueColor = QUEUE_DEPTH > 500 ? "var(--warning)" : "var(--text-secondary)";

  return (
    <PageLayout>
      {/* Live indicator */}
      <div className="flex items-center gap-2 mb-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
        <span className="text-[var(--success)] font-semibold text-[11px]">Live</span>
        <span className="text-[var(--text-muted)] text-[11px]">— {lastUpdate}</span>
      </div>

      <PageHeader
        title="CTO Dashboard"
        description="ระบบและ Infrastructure"
      />

      {/* ─── 5 Stat Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        {/* Uptime */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center mb-3"
            style={{ background: "rgba(16,185,129,0.08)" }}
          >
            <Activity className="w-4 h-4 text-[var(--success)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--success)] tabular-nums">99.97%</div>
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-[0.04em] mt-0.5">
            Uptime
          </div>
          <div className="text-xs text-[var(--success)] mt-1">last 30d</div>
        </div>

        {/* API Latency */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center mb-3"
            style={{ background: "rgba(50,152,218,0.08)" }}
          >
            <Gauge className="w-4 h-4 text-[var(--info)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--info)] tabular-nums">42ms</div>
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-[0.04em] mt-0.5">
            API Latency p50
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">
            p95: 128ms · p99: 340ms
          </div>
        </div>

        {/* Error Rate */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center mb-3"
            style={{ background: `${errorRateColor}15` }}
          >
            <AlertTriangle className="w-4 h-4" style={{ color: errorRateColor }} />
          </div>
          <div
            className="text-2xl font-bold tabular-nums"
            style={{ color: errorRateColor }}
          >
            {ERROR_RATE}%
          </div>
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-[0.04em] mt-0.5">
            Error Rate
          </div>
          <div className="text-xs mt-1" style={{ color: errorRateColor }}>
            {ERROR_RATE < 1 ? "within normal" : "above threshold"}
          </div>
        </div>

        {/* Active Connections */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center mb-3"
            style={{ background: "rgba(50,152,218,0.08)" }}
          >
            <Wifi className="w-4 h-4 text-[var(--info)]" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">1,847</div>
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-[0.04em] mt-0.5">
            Active Connections
          </div>
          <span className="inline-block text-[11px] mt-1.5 px-2 py-0.5 rounded-full bg-[rgba(var(--info-rgb),0.08)] text-[var(--info)]">
            WebSocket
          </span>
        </div>

        {/* Queue Depth */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center mb-3"
            style={{ background: `${queueColor}15` }}
          >
            <Layers className="w-4 h-4" style={{ color: queueColor }} />
          </div>
          <div
            className="text-2xl font-bold tabular-nums"
            style={{ color: queueColor }}
          >
            {QUEUE_DEPTH.toLocaleString()}
          </div>
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-[0.04em] mt-0.5">
            Queue Depth
          </div>
          <div className="text-xs mt-1" style={{ color: queueColor }}>
            {QUEUE_DEPTH > 500 ? "high — check workers" : "normal"}
          </div>
        </div>
      </div>

      {/* ─── Charts 2×2 ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* API Latency 24h Line */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-white mb-4">API Latency 24h (ms)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={LATENCY_DATA}>
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
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                content={<ChartTooltip />}
                contentStyle={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} />
              <Line
                type="monotone"
                dataKey="p50"
                name="p50"
                stroke="var(--info)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="p95"
                name="p95"
                stroke="var(--warning)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="p99"
                name="p99"
                stroke="var(--error)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Error Rate per Hour Bar */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Error Rate per Hour (%)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ERROR_RATE_DATA}>
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
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                content={<ChartTooltip />}
                contentStyle={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                }}
              />
              <Bar dataKey="rate" name="error %" fill="var(--error)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Request Volume Area */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Request Volume 24h</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={REQUEST_VOLUME_DATA}>
              <defs>
                <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--info)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="var(--info)" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={45}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                content={<ChartTooltip />}
                contentStyle={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                }}
              />
              <Area
                type="monotone"
                dataKey="requests"
                name="req/hr"
                stroke="var(--info)"
                strokeWidth={2}
                fill="url(#reqGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* SMS Queue Throughput Line */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-white mb-4">SMS Queue Throughput 24h</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={QUEUE_THROUGHPUT_DATA}>
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
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={45}
              />
              <Tooltip
                content={<ChartTooltip />}
                contentStyle={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} />
              <Line
                type="monotone"
                dataKey="enqueued"
                name="enqueued"
                stroke="var(--info)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="processed"
                name="processed"
                stroke="var(--success)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Active Alerts Panel ─── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <BellRing className="w-4 h-4 text-white" />
            <h3 className="text-sm font-semibold text-white">Active Alerts</h3>
            {activeAlerts.length > 0 && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(var(--error-rgb),0.12)] text-[var(--error)]">
                {activeAlerts.length}
              </span>
            )}
          </div>
          {activeAlerts.length === 0 && (
            <div className="flex items-center gap-1.5 text-[var(--success)]">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-medium">All clear</span>
            </div>
          )}
        </div>

        {activeAlerts.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-4">
            ไม่มี alert ที่ต้องดำเนินการ
          </p>
        ) : (
          <div className="space-y-2">
            {activeAlerts.map((alert) => {
              const cfg = ALERT_CONFIG[alert.severity];
              const IconComp = cfg.Icon;
              return (
                <div
                  key={alert.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                  style={{
                    background: cfg.bg,
                    borderColor: `${cfg.color}25`,
                  }}
                >
                  <IconComp className="w-4 h-4 flex-shrink-0" style={{ color: cfg.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white leading-snug">{alert.message}</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{alert.time}</p>
                  </div>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: `${cfg.color}20`, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => ackAlert(alert.id)}
                    className="text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-colors flex-shrink-0 cursor-pointer"
                    style={{
                      borderColor: `${cfg.color}30`,
                      color: cfg.color,
                    }}
                  >
                    Ack
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── 2-col Tables ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Recent Errors */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-2">Recent Errors</h3>
          <TableWrapper>
            <div className="grid grid-cols-[80px_1fr_160px_70px] gap-x-3 px-4 py-2.5 bg-[var(--table-header)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              <span>เวลา</span>
              <span>Endpoint</span>
              <span>ข้อความ</span>
              <span>Status</span>
            </div>
            {RECENT_ERRORS.map((err, i) => (
              <div
                key={err.id}
                className={`grid grid-cols-[80px_1fr_160px_70px] gap-x-3 items-start px-4 py-3 border-b border-[var(--table-border)] hover:bg-[rgba(255,255,255,0.015)] transition-colors last:border-0 ${
                  i % 2 === 1 ? "bg-[var(--table-alt-row)]" : ""
                }`}
              >
                <span className="text-[11px] text-[var(--text-muted)] font-mono pt-0.5">
                  {err.timestamp}
                </span>
                <span className="text-xs text-white font-mono break-all leading-snug">
                  {err.endpoint}
                </span>
                <span className="text-[11px] text-[var(--text-secondary)] leading-snug">
                  {err.message}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[11px] font-bold tabular-nums"
                    style={{ color: statusCodeColor(err.status) }}
                  >
                    {err.status}
                  </span>
                  <button
                    type="button"
                    className="text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer underline underline-offset-2"
                  >
                    Stack
                  </button>
                </div>
              </div>
            ))}
          </TableWrapper>
        </div>

        {/* Slow Endpoints Top 10 */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-2">Slow Endpoints Top 10</h3>
          <TableWrapper>
            <div className="grid grid-cols-[28px_1fr_80px_80px_70px] gap-x-3 px-4 py-2.5 bg-[var(--table-header)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              <span>#</span>
              <span>Endpoint</span>
              <span>Avg</span>
              <span>p99</span>
              <span>req/min</span>
            </div>
            {SLOW_ENDPOINTS.map((ep, i) => {
              const avgColor =
                ep.avgMs > 1000 ? "var(--error)" : ep.avgMs > 500 ? "var(--warning)" : "var(--text-secondary)";
              return (
                <div
                  key={ep.rank}
                  className={`grid grid-cols-[28px_1fr_80px_80px_70px] gap-x-3 items-center px-4 py-3 border-b border-[var(--table-border)] hover:bg-[rgba(255,255,255,0.015)] transition-colors last:border-0 ${
                    i % 2 === 1 ? "bg-[var(--table-alt-row)]" : ""
                  }`}
                >
                  <span className="text-[11px] text-[var(--text-muted)] font-medium">
                    {ep.rank}
                  </span>
                  <span className="text-xs text-white font-mono break-all leading-snug">
                    {ep.endpoint}
                  </span>
                  <span
                    className="text-xs font-semibold tabular-nums"
                    style={{ color: avgColor }}
                  >
                    {ep.avgMs}ms
                  </span>
                  <span className="text-xs text-[var(--error)] font-semibold tabular-nums">
                    {ep.p99Ms}ms
                  </span>
                  <span className="text-xs text-[var(--text-secondary)] tabular-nums">
                    {ep.reqMin}
                  </span>
                </div>
              );
            })}
          </TableWrapper>
        </div>
      </div>

      {/* ─── Action Buttons ─── */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMaintenanceMode((v) => !v)}
          className="gap-2 border-[var(--warning)] text-[var(--warning)] hover:bg-[rgba(var(--warning-rgb),0.08)] hover:text-[var(--warning)]"
        >
          <Wrench className="w-3.5 h-3.5" />
          {maintenanceMode ? "ปิด Maintenance Mode" : "เปิด Maintenance Mode"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-[var(--border-default)] text-[var(--text-secondary)]"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Queue
        </Button>
        <Button
          size="sm"
          className="gap-2 bg-[var(--accent)] text-[var(--text-on-accent)] hover:opacity-90"
        >
          <HeartPulse className="w-3.5 h-3.5" />
          Health Check
        </Button>
      </div>
    </PageLayout>
  );
}
