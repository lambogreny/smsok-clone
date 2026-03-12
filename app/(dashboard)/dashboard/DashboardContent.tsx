"use client";

const ACCENT = "var(--accent)";

import { useState, useCallback } from "react";
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
} from "recharts";
import { sendSms } from "@/lib/actions/sms";
import { safeErrorMessage } from "@/lib/error-messages";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type DayStats = { day: string; short: string; date: string; sms: number; delivered: number; failed: number };

type DashboardStats = {
  user: { name: string; email: string };
  today: { total: number; delivered: number; failed: number; sent: number; pending: number };
  yesterday: { total: number; delivered: number; failed: number; sent: number; pending: number };
  thisMonth: { total: number; delivered: number; failed: number; sent: number; pending: number };
  recentMessages: { id: string; recipient: string; status: string; senderName: string; creditCost: number; createdAt: Date }[];
  last7Days: DayStats[];
  smsRemaining?: number;
};

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

/* ── Area Chart — 7-day SMS ── */
function SmsAreaChart({ chartData }: { chartData: DayStats[] }) {
  const total = chartData.reduce((a, b) => a + b.sms, 0);
  const avg = Math.round(total / (chartData.length || 1));

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 rounded-full bg-[var(--accent)]" />
          <span className="text-[11px] text-[var(--text-muted)]">รวม {total.toLocaleString()} ข้อความ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--accent-secondary)]" />
          <span className="text-[11px] text-[var(--text-muted)]">สำเร็จ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--error)]" />
          <span className="text-[11px] text-[var(--text-muted)]">ล้มเหลว</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="w-3 h-0.5 rounded-full bg-[var(--warning)] opacity-40" />
          <span className="text-[11px] text-[var(--text-muted)]">เฉลี่ย {avg}/วัน</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <RechartsAreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="gradSms" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity={0.1} />
              <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradDelivered" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-secondary)" stopOpacity={0.1} />
              <stop offset="100%" stopColor="var(--accent-secondary)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradFailed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--error)" stopOpacity={0.1} />
              <stop offset="100%" stopColor="var(--error)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />

          <XAxis
            dataKey="day"
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

          <ReferenceLine y={avg} stroke="rgba(250,205,99,0.25)" strokeDasharray="6 4" label={{ value: "avg", position: "right", fill: "rgba(250,205,99,0.4)", fontSize: 9 }} />

          <Area type="monotone" dataKey="sms" stroke={ACCENT} strokeWidth={2} fill="url(#gradSms)" dot={{ r: 3, fill: ACCENT, stroke: "var(--bg-base)", strokeWidth: 2 }} activeDot={{ r: 5, fill: ACCENT, stroke: "var(--bg-base)", strokeWidth: 2 }} />
          <Area type="monotone" dataKey="delivered" stroke="var(--accent-secondary)" strokeWidth={1.5} strokeDasharray="4 2" fill="url(#gradDelivered)" dot={false} activeDot={{ r: 4, fill: "var(--accent-secondary)", stroke: "var(--bg-base)", strokeWidth: 2 }} />
          <Area type="monotone" dataKey="failed" stroke="var(--error)" strokeWidth={1} fill="url(#gradFailed)" dot={false} activeDot={{ r: 3, fill: "var(--error)", stroke: "var(--bg-base)", strokeWidth: 2 }} />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Status Config ── */
const statusConfig: Record<string, { badge: string; label: string }> = {
  delivered: { badge: "bg-[var(--success-bg)] text-[var(--success)] border border-[rgba(8,153,129,0.2)]", label: "สำเร็จ" },
  sent: { badge: "bg-[rgba(var(--accent-rgb),0.08)] text-[var(--accent)] border border-[rgba(var(--accent-rgb),0.2)]", label: "ส่งแล้ว" },
  pending: { badge: "bg-[var(--warning-bg)] text-[var(--warning)] border border-[rgba(250,205,99,0.2)]", label: "รอส่ง" },
  failed: { badge: "bg-[var(--danger-bg)] text-[var(--error)] border border-[rgba(242,54,69,0.2)]", label: "ล้มเหลว" },
};

/* ── Stat Card Config — Nansen flat style ── */
const statCards = [
  {
    label: "SMS คงเหลือ", key: "credits" as const,
    iconBg: "bg-[rgba(var(--accent-rgb),0.08)]", iconColor: "text-[var(--accent)]",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--accent)]">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: "ส่งวันนี้", key: "sent" as const,
    iconBg: "bg-[rgba(71,121,255,0.08)]", iconColor: "text-[var(--accent-secondary)]",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--accent-secondary)]">
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    ),
  },
  {
    label: "สำเร็จ", key: "delivered" as const,
    iconBg: "bg-[var(--success-bg)]", iconColor: "text-[var(--success)]",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--success)]">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    label: "ล้มเหลว", key: "failed" as const,
    iconBg: "bg-[var(--danger-bg)]", iconColor: "text-[var(--error)]",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--error)]">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
];

export default function DashboardContent({ user, stats, senderNames = ["EasySlip"] }: { user: User; stats?: DashboardStats; senderNames?: string[] }) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [senderName, setSenderName] = useState(senderNames[0] || "EasySlip");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const handleQuickSend = useCallback(async () => {
    if (!phone || !message) return;
    setSending(true);
    setSendResult(null);
    try {
      const result = await sendSms(user.id, { senderName, recipient: phone, message });

      // Check for structured insufficient credits error (returned, not thrown)
      if (result && typeof result === "object" && "error" in result && (result as { error: string }).error === "INSUFFICIENT_CREDITS") {
        const err = result as { creditsRemaining: number; creditsRequired: number };
        const detail = `เครดิตไม่พอ — เหลือ ${err.creditsRemaining} ต้องการ ${err.creditsRequired}`;
        setSendResult(detail);
        toast.error(detail);
        return;
      }

      setSendResult("ส่งสำเร็จ!");
      toast.success("ส่ง SMS สำเร็จ!");
      setPhone("");
      setMessage("");
    } catch (e) {
      setSendResult(safeErrorMessage(e));
      toast.error(safeErrorMessage(e));
    } finally {
      setSending(false);
    }
  }, [phone, message, user.id, senderName]);

  const statValues = {
    credits: `${(stats?.smsRemaining ?? 0).toLocaleString()} SMS`,
    sent: (stats?.today.total ?? 0).toLocaleString(),
    delivered: (stats?.today.delivered ?? 0).toLocaleString(),
    failed: (stats?.today.failed ?? 0).toLocaleString(),
  };

  const calcDelta = (today: number, yesterday: number): { text: string; positive: boolean } => {
    if (yesterday === 0 && today === 0) return { text: "—", positive: true };
    if (yesterday === 0) return { text: `+${today}`, positive: true };
    const pct = Math.round(((today - yesterday) / yesterday) * 100);
    return { text: `${pct >= 0 ? "+" : ""}${pct}%`, positive: pct >= 0 };
  };

  const deltas = {
    credits: { text: "คงเหลือ", positive: true },
    sent: calcDelta(stats?.today.total ?? 0, stats?.yesterday?.total ?? 0),
    delivered: stats?.today.total
      ? { text: `${Math.round(((stats?.today.delivered ?? 0) / stats.today.total) * 100)}%`, positive: true }
      : { text: "—", positive: true },
    failed: calcDelta(stats?.today.failed ?? 0, stats?.yesterday?.failed ?? 0),
  };

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">ภาพรวม</h1>
        <Link href="/dashboard/send">
          <Button className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold rounded-lg" size="lg">
            ส่ง SMS →
          </Button>
        </Link>
      </div>

      {/* ── 4 Stat Cards — Nansen flat ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const delta = deltas[stat.key];
          return (
            <Card key={stat.key} className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg hover:border-[rgba(var(--accent-rgb),0.15)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:-translate-y-[2px] transition-all duration-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-9 h-9 rounded-md ${stat.iconBg} flex items-center justify-center`}>
                    {stat.icon}
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                    delta.positive
                      ? "bg-[var(--success-bg)] text-[var(--success)] border-[rgba(8,153,129,0.15)]"
                      : "bg-[var(--danger-bg)] text-[var(--error)] border-[rgba(242,54,69,0.15)]"
                  }`}>
                    {delta.positive ? "↑" : "↓"} {delta.text}
                  </span>
                </div>
                <div className="text-[28px] font-bold text-[var(--text-primary)] tracking-tight mb-1">
                  {statValues[stat.key]}
                </div>
                <div className="text-xs font-medium text-[var(--text-muted)] uppercase">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── 7-Day Chart ── */}
      <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">SMS Volume</h3>
            <Tabs defaultValue="W">
              <TabsList className="h-8 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-full p-0.5">
                <TabsTrigger value="D" className="h-7 px-3 text-xs rounded-full data-[state=active]:bg-[var(--bg-surface)] data-[state=active]:text-[var(--text-primary)] data-[state=inactive]:text-[var(--text-muted)]">D</TabsTrigger>
                <TabsTrigger value="W" className="h-7 px-3 text-xs rounded-full data-[state=active]:bg-[var(--bg-surface)] data-[state=active]:text-[var(--text-primary)] data-[state=inactive]:text-[var(--text-muted)]">W</TabsTrigger>
                <TabsTrigger value="M" className="h-7 px-3 text-xs rounded-full data-[state=active]:bg-[var(--bg-surface)] data-[state=active]:text-[var(--text-primary)] data-[state=inactive]:text-[var(--text-muted)]">M</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <SmsAreaChart chartData={stats?.last7Days ?? []} />
        </CardContent>
      </Card>

      {/* ── Two Column: Quick Send + Recent Messages ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Quick Send — 2 cols */}
        <Card className="lg:col-span-2 bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
          <CardContent className="p-5">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-5">ส่งด่วน</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">ชื่อผู้ส่ง</label>
                <Select value={senderName} onValueChange={(v) => v && setSenderName(v)}>
                  <SelectTrigger className="h-11 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] rounded-xl focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(0,255,167,0.15)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-xl">
                    {senderNames.map((name) => (
                      <SelectItem key={name} value={name} className="hover:bg-[var(--bg-base)] text-[var(--text-primary)]">
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">เบอร์ปลายทาง</label>
                <Input
                  type="text"
                  placeholder="0891234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] rounded-xl placeholder:text-[var(--text-muted)] focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(0,255,167,0.15)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">ข้อความ</label>
                <Textarea
                  rows={3}
                  placeholder="รหัส OTP ของคุณคือ {code}"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] rounded-xl resize-none placeholder:text-[var(--text-muted)] focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(0,255,167,0.15)]"
                />
              </div>
            </div>

            {sendResult && (
              <p className={`mt-3 text-xs font-medium transition-opacity duration-200 ${sendResult.includes("สำเร็จ") ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
                {sendResult}
              </p>
            )}

            <Button
              onClick={handleQuickSend}
              disabled={sending || !phone || !message}
              className="w-full mt-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] rounded-lg font-semibold disabled:opacity-50" size="lg"
            >
              {sending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  กำลังส่ง...
                </span>
              ) : (
                <>ส่ง SMS →</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Messages — Nansen Table — 3 cols */}
        <Card className="lg:col-span-3 bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">ข้อความล่าสุด</h3>
            <Link href="/dashboard/messages" className="text-xs text-[var(--accent)] hover:underline transition-colors">
              ดูทั้งหมด →
            </Link>
          </div>

          {stats?.recentMessages && stats.recentMessages.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-[var(--table-header)] border-b border-[var(--border-default)] hover:bg-[var(--table-header)]">
                  <TableHead className="text-[12px] uppercase text-[var(--text-secondary)] font-semibold tracking-[0.05em] py-2.5 px-4">เวลา</TableHead>
                  <TableHead className="text-[12px] uppercase text-[var(--text-secondary)] font-semibold tracking-[0.05em] py-2.5 px-4">ผู้รับ</TableHead>
                  <TableHead className="text-[12px] uppercase text-[var(--text-secondary)] font-semibold tracking-[0.05em] py-2.5 px-4 hidden md:table-cell">ผู้ส่ง</TableHead>
                  <TableHead className="text-[12px] uppercase text-[var(--text-secondary)] font-semibold tracking-[0.05em] py-2.5 px-4 text-right">ราคา</TableHead>
                  <TableHead className="text-[12px] uppercase text-[var(--text-secondary)] font-semibold tracking-[0.05em] py-2.5 px-4 text-center">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentMessages.slice(0, 5).map((msg, i) => {
                  const s = statusConfig[msg.status] || statusConfig.pending;
                  const time = new Date(msg.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
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
                      <TableCell className="text-sm text-[var(--text-primary)] font-mono py-2 px-4 text-right">{msg.creditCost} SMS</TableCell>
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
          ) : (
            <div className="text-center py-16 px-5">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--text-muted)] mx-auto mb-4">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <p className="text-lg font-semibold text-[var(--text-primary)] mb-1">ยังไม่มีข้อความ</p>
              <p className="text-sm text-[var(--text-muted)] mb-5">ส่ง SMS แรกของคุณเลย</p>
              <Link href="/dashboard/send">
                <Button className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold rounded-lg" size="lg">
                  ส่ง SMS →
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* ── System Status ── */}
      <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
        <CardContent className="p-4 px-5">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-sm font-semibold text-[var(--text-primary)] mr-2">System Status</span>
            {[
              { label: "SMS Gateway" },
              { label: "OTP Service" },
              { label: "API Server" },
              { label: "Database" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
                <span className="text-[13px] text-[var(--text-secondary)]">{s.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
