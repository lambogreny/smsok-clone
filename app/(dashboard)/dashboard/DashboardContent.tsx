"use client";

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

type User = {
  id: string;
  name: string;
  email: string;
  credits: number;
  role: string;
};

type DayStats = { day: string; short: string; date: string; sms: number; delivered: number; failed: number };

type DashboardStats = {
  user: { credits: number; name: string; email: string };
  today: { total: number; delivered: number; failed: number; sent: number; pending: number };
  yesterday: { total: number; delivered: number; failed: number; sent: number; pending: number };
  thisMonth: { total: number; delivered: number; failed: number; sent: number; pending: number };
  recentMessages: { id: string; recipient: string; status: string; senderName: string; creditCost: number; createdAt: Date }[];
  last7Days: DayStats[];
};

/* ── Chart Tooltip — Nansen flat style ── */
/* eslint-disable @typescript-eslint/no-explicit-any */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#08283B] bg-[#131415] px-4 py-3 shadow-xl">
      <p className="text-xs font-semibold text-white mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[#9BA1A5]">
              {entry.dataKey === "sms" ? "ทั้งหมด" : entry.dataKey === "delivered" ? "สำเร็จ" : "ล้มเหลว"}
            </span>
          </span>
          <span className="font-semibold text-white">{entry.value}</span>
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
          <div className="w-3 h-0.5 rounded-full bg-[#00E2B5]" />
          <span className="text-[11px] text-[#9BA1A5]">รวม {total.toLocaleString()} ข้อความ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#3298DA]" />
          <span className="text-[11px] text-[#9BA1A5]">สำเร็จ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
          <span className="text-[11px] text-[#9BA1A5]">ล้มเหลว</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="w-3 h-0.5 rounded-full bg-[#F59E0B]/40" />
          <span className="text-[11px] text-[#9BA1A5]">เฉลี่ย {avg}/วัน</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <RechartsAreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="gradSms" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00E2B5" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#00E2B5" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradDelivered" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3298DA" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#3298DA" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradFailed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />

          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9BA1A5", fontSize: 12 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9BA1A5", fontSize: 9 }}
            width={40}
          />

          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeDasharray: "4 4" }} />

          <ReferenceLine y={avg} stroke="rgba(245,158,11,0.25)" strokeDasharray="6 4" label={{ value: "avg", position: "right", fill: "rgba(245,158,11,0.4)", fontSize: 9 }} />

          <Area type="monotone" dataKey="sms" stroke="#00E2B5" strokeWidth={2} fill="url(#gradSms)" dot={{ r: 3, fill: "#00E2B5", stroke: "#06080b", strokeWidth: 2 }} activeDot={{ r: 5, fill: "#00E2B5", stroke: "#06080b", strokeWidth: 2 }} />
          <Area type="monotone" dataKey="delivered" stroke="#3298DA" strokeWidth={1.5} strokeDasharray="4 2" fill="url(#gradDelivered)" dot={false} activeDot={{ r: 4, fill: "#3298DA", stroke: "#06080b", strokeWidth: 2 }} />
          <Area type="monotone" dataKey="failed" stroke="#EF4444" strokeWidth={1} fill="url(#gradFailed)" dot={false} activeDot={{ r: 3, fill: "#EF4444", stroke: "#06080b", strokeWidth: 2 }} />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Status Config ── */
const statusConfig: Record<string, { badge: string; label: string }> = {
  delivered: { badge: "bg-[rgba(16,185,129,0.08)] text-[#34D399] border border-[rgba(16,185,129,0.2)]", label: "สำเร็จ" },
  sent: { badge: "bg-[rgba(0,226,181,0.08)] text-[#00E2B5] border border-[rgba(0,226,181,0.2)]", label: "ส่งแล้ว" },
  pending: { badge: "bg-[rgba(245,158,11,0.08)] text-[#FBBF24] border border-[rgba(245,158,11,0.2)]", label: "รอส่ง" },
  failed: { badge: "bg-[rgba(239,68,68,0.08)] text-[#F87171] border border-[rgba(239,68,68,0.2)]", label: "ล้มเหลว" },
};

/* ── Stat Card Config — Nansen flat style ── */
const statCards = [
  {
    label: "เครดิตคงเหลือ", key: "credits" as const,
    iconBg: "bg-[rgba(0,226,181,0.08)]", iconColor: "text-[#00E2B5]",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#00E2B5]">
        <circle cx="12" cy="12" r="10" /><text x="12" y="16" textAnchor="middle" fill="currentColor" stroke="none" fontSize="12" fontWeight="bold">฿</text>
      </svg>
    ),
  },
  {
    label: "ส่งวันนี้", key: "sent" as const,
    iconBg: "bg-[rgba(50,152,218,0.08)]", iconColor: "text-[#3298DA]",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#3298DA]">
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    ),
  },
  {
    label: "สำเร็จ", key: "delivered" as const,
    iconBg: "bg-[rgba(16,185,129,0.08)]", iconColor: "text-[#10B981]",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#10B981]">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    label: "ล้มเหลว", key: "failed" as const,
    iconBg: "bg-[rgba(239,68,68,0.08)]", iconColor: "text-[#EF4444]",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#EF4444]">
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
      await sendSms(user.id, { senderName, recipient: phone, message });
      setSendResult("ส่งสำเร็จ!");
      setPhone("");
      setMessage("");
    } catch (e) {
      setSendResult(safeErrorMessage(e));
    } finally {
      setSending(false);
    }
  }, [phone, message, user.id, senderName]);

  const statValues = {
    credits: (stats?.user.credits ?? user.credits).toLocaleString(),
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
    credits: { text: `฿${(stats?.user.credits ?? user.credits).toLocaleString()}`, positive: true },
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
        <h1 className="text-2xl font-bold text-white">ภาพรวม</h1>
        <Link href="/dashboard/send">
          <Button className="bg-[#00E2B5] hover:bg-[#0AE99C] text-[#06080b] font-semibold rounded-[20px] h-11 px-6">
            ส่ง SMS →
          </Button>
        </Link>
      </div>

      {/* ── 4 Stat Cards — Nansen flat ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const delta = deltas[stat.key];
          return (
            <Card key={stat.key} className="bg-[#131415] border-[#08283B] rounded-[20px] hover:border-[rgba(0,226,181,0.15)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:-translate-y-[2px] transition-all duration-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-9 h-9 rounded-[10px] ${stat.iconBg} flex items-center justify-center`}>
                    {stat.icon}
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                    delta.positive
                      ? "bg-[rgba(16,185,129,0.08)] text-[#10B981] border-[rgba(16,185,129,0.15)]"
                      : "bg-[rgba(239,68,68,0.08)] text-[#EF4444] border-[rgba(239,68,68,0.15)]"
                  }`}>
                    {delta.positive ? "↑" : "↓"} {delta.text}
                  </span>
                </div>
                <div className="text-[28px] font-bold text-white tracking-tight mb-1">
                  {statValues[stat.key]}
                </div>
                <div className="text-xs font-medium text-[#9BA1A5] uppercase">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── 7-Day Chart ── */}
      <Card className="bg-[#131415] border-[#08283B] rounded-[20px]">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-white">SMS Volume (7 วัน)</h3>
            <span className="text-xs text-[#9BA1A5] px-3 py-1 rounded-full bg-[#06080b] border border-[#08283B]">7 วัน</span>
          </div>
          <SmsAreaChart chartData={stats?.last7Days ?? []} />
        </CardContent>
      </Card>

      {/* ── Two Column: Quick Send + Recent Messages ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Quick Send — 2 cols */}
        <Card className="lg:col-span-2 bg-[#131415] border-[#08283B] rounded-[20px]">
          <CardContent className="p-5">
            <h3 className="text-base font-semibold text-white mb-5">ส่งด่วน</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[#9BA1A5] mb-1.5 font-medium">ชื่อผู้ส่ง</label>
                <Select value={senderName} onValueChange={(v) => v && setSenderName(v)}>
                  <SelectTrigger className="h-11 bg-[#06080b] border-[#08283B] text-white rounded-xl focus:border-[rgba(0,226,181,0.6)] focus:ring-[rgba(0,226,181,0.15)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#131415] border-[#08283B] rounded-xl">
                    {senderNames.map((name) => (
                      <SelectItem key={name} value={name} className="hover:bg-[#000000] text-white">
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs text-[#9BA1A5] mb-1.5 font-medium">เบอร์ปลายทาง</label>
                <Input
                  type="text"
                  placeholder="0891234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 bg-[#06080b] border-[#08283B] text-white rounded-xl placeholder:text-[#9BA1A5] focus:border-[rgba(0,226,181,0.6)] focus:ring-[rgba(0,226,181,0.15)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#9BA1A5] mb-1.5 font-medium">ข้อความ</label>
                <Textarea
                  rows={3}
                  placeholder="รหัส OTP ของคุณคือ {code}"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-[#06080b] border-[#08283B] text-white rounded-xl resize-none placeholder:text-[#9BA1A5] focus:border-[rgba(0,226,181,0.6)] focus:ring-[rgba(0,226,181,0.15)]"
                />
              </div>
            </div>

            {sendResult && (
              <p className={`mt-3 text-xs font-medium transition-opacity duration-200 ${sendResult.includes("สำเร็จ") ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                {sendResult}
              </p>
            )}

            <Button
              onClick={handleQuickSend}
              disabled={sending || !phone || !message}
              className="w-full mt-4 h-11 bg-[#00E2B5] hover:bg-[#0AE99C] text-[#06080b] rounded-[20px] font-semibold disabled:opacity-50"
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
        <Card className="lg:col-span-3 bg-[#131415] border-[#08283B] rounded-[20px] overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <h3 className="text-base font-semibold text-white">ข้อความล่าสุด</h3>
            <Link href="/dashboard/messages" className="text-xs text-[#2060DF] hover:underline transition-colors">
              ดูทั้งหมด →
            </Link>
          </div>

          {stats?.recentMessages && stats.recentMessages.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#093A57] border-b border-[#08283B] hover:bg-[#093A57]">
                  <TableHead className="text-[12px] uppercase text-[#C4C4C4] font-semibold tracking-[0.05em] py-2.5 px-4">เวลา</TableHead>
                  <TableHead className="text-[12px] uppercase text-[#C4C4C4] font-semibold tracking-[0.05em] py-2.5 px-4">ผู้รับ</TableHead>
                  <TableHead className="text-[12px] uppercase text-[#C4C4C4] font-semibold tracking-[0.05em] py-2.5 px-4 hidden md:table-cell">ผู้ส่ง</TableHead>
                  <TableHead className="text-[12px] uppercase text-[#C4C4C4] font-semibold tracking-[0.05em] py-2.5 px-4 text-right">ราคา</TableHead>
                  <TableHead className="text-[12px] uppercase text-[#C4C4C4] font-semibold tracking-[0.05em] py-2.5 px-4 text-center">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentMessages.slice(0, 5).map((msg, i) => {
                  const s = statusConfig[msg.status] || statusConfig.pending;
                  const time = new Date(msg.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <TableRow
                      key={msg.id}
                      className={`border-b border-[#08283B] hover:bg-[#000000] transition-[background] duration-150 h-10 ${
                        i % 2 === 1 ? "bg-[#042133]" : "bg-transparent"
                      }`}
                    >
                      <TableCell className="text-sm text-white font-mono py-2 px-4">{time}</TableCell>
                      <TableCell className="text-sm text-white font-mono py-2 px-4">{msg.recipient}</TableCell>
                      <TableCell className="text-sm text-[#C4C4C4] py-2 px-4 hidden md:table-cell">{msg.senderName}</TableCell>
                      <TableCell className="text-sm text-white font-mono py-2 px-4 text-right">฿{msg.creditCost}</TableCell>
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
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[#9BA1A5] mx-auto mb-4">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <p className="text-lg font-semibold text-white mb-1">ยังไม่มีข้อความ</p>
              <p className="text-sm text-[#9BA1A5] mb-5">ส่ง SMS แรกของคุณเลย</p>
              <Link href="/dashboard/send">
                <Button className="bg-[#00E2B5] hover:bg-[#0AE99C] text-[#06080b] font-semibold rounded-[20px] h-11 px-6">
                  ส่ง SMS →
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* ── System Status ── */}
      <Card className="bg-[#131415] border-[#08283B] rounded-[20px]">
        <CardContent className="p-4 px-5">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-sm font-semibold text-white mr-2">System Status</span>
            {[
              { label: "SMS Gateway" },
              { label: "OTP Service" },
              { label: "API Server" },
              { label: "Database" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span className="text-[13px] text-[#C4C4C4]">{s.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
