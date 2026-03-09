"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

/* ── Animated Counter ── */
function AnimatedCounter({ value, duration = 1.2 }: { value: string; duration?: number }) {
  const numericValue = Number.parseInt(value.replace(/,/g, ""), 10);
  const isNumeric = !Number.isNaN(numericValue);
  const [display, setDisplay] = useState(isNumeric ? "0" : value);

  useEffect(() => {
    if (!isNumeric) return;
    const end = numericValue;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.floor(eased * end).toLocaleString());
      if (progress < 1) requestAnimationFrame(animate);
      else setDisplay(end.toLocaleString());
    };
    requestAnimationFrame(animate);
  }, [numericValue, duration, value, isNumeric]);

  return <>{display}</>;
}

/* ── Sparkline Bar Chart ── */
function MiniChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-[3px] h-10">
      {data.map((v, i) => (
        <motion.div
          key={i}
          className="w-[5px] rounded-full"
          initial={{ height: 2, opacity: 0 }}
          animate={{ height: Math.max((v / max) * 40, 3), opacity: 0.3 + (v / max) * 0.7 }}
          transition={{ duration: 0.6, delay: i * 0.04, ease: "easeOut" }}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

/* ── Recharts Area Chart — 7-day SMS ── */
const chartData7d = [
  { day: "จันทร์", short: "จ", sms: 120, delivered: 112, failed: 8 },
  { day: "อังคาร", short: "อ", sms: 180, delivered: 174, failed: 6 },
  { day: "พุธ", short: "พ", sms: 150, delivered: 145, failed: 5 },
  { day: "พฤหัส", short: "พฤ", sms: 220, delivered: 215, failed: 5 },
  { day: "ศุกร์", short: "ศ", sms: 310, delivered: 302, failed: 8 },
  { day: "เสาร์", short: "ส", sms: 190, delivered: 185, failed: 5 },
  { day: "อาทิตย์", short: "อา", sms: 140, delivered: 136, failed: 4 },
];

/* eslint-disable @typescript-eslint/no-explicit-any */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-violet-500/20 bg-[#0B1120]/95 backdrop-blur-xl px-4 py-3 shadow-xl shadow-violet-500/10">
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

function SmsAreaChart() {
  const total = chartData7d.reduce((a, b) => a + b.sms, 0);
  const avg = Math.round(total / chartData7d.length);

  return (
    <div className="relative">
      {/* Summary chips */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" />
          <span className="text-[11px] text-[var(--text-muted)]">รวม {total.toLocaleString()} ข้อความ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400/60" />
          <span className="text-[11px] text-[var(--text-muted)]">สำเร็จ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400/60" />
          <span className="text-[11px] text-[var(--text-muted)]">ล้มเหลว</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="w-3 h-0.5 rounded-full bg-amber-400/40" />
          <span className="text-[11px] text-[var(--text-muted)]">เฉลี่ย {avg}/วัน</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <RechartsAreaChart data={chartData7d} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="gradSms" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.35} />
              <stop offset="50%" stopColor="#22D3EE" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradDelivered" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradFailed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" vertical={false} />

          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "rgba(148,163,184,0.4)", fontSize: 11, fontFamily: "'Noto Sans Thai', 'Inter', sans-serif" }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "rgba(148,163,184,0.3)", fontSize: 9, fontFamily: "'Inter', sans-serif" }}
            width={40}
          />

          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(139,92,246,0.15)", strokeDasharray: "4 4" }} />

          <ReferenceLine y={avg} stroke="rgba(245,158,11,0.25)" strokeDasharray="6 4" label={{ value: "avg", position: "right", fill: "rgba(245,158,11,0.4)", fontSize: 9 }} />

          <Area
            type="monotone"
            dataKey="sms"
            stroke="#8B5CF6"
            strokeWidth={2.5}
            fill="url(#gradSms)"
            dot={{ r: 4, fill: "#8B5CF6", stroke: "#0B1120", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#EC4899", stroke: "#0B1120", strokeWidth: 2 }}
            animationDuration={1800}
            animationEasing="ease-in-out"
          />
          <Area
            type="monotone"
            dataKey="delivered"
            stroke="#10B981"
            strokeWidth={1.5}
            strokeDasharray="4 2"
            fill="url(#gradDelivered)"
            dot={false}
            activeDot={{ r: 4, fill: "#10B981", stroke: "#0B1120", strokeWidth: 2 }}
            animationDuration={2000}
            animationEasing="ease-in-out"
          />
          <Area
            type="monotone"
            dataKey="failed"
            stroke="#EF4444"
            strokeWidth={1}
            fill="url(#gradFailed)"
            dot={false}
            activeDot={{ r: 3, fill: "#EF4444", stroke: "#0B1120", strokeWidth: 2 }}
            animationDuration={2200}
            animationEasing="ease-in-out"
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Activity Ring ── */
function ActivityRing({ percent, color, size = 56, label }: { percent: number; color: string; size?: number; label?: string }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-white/[0.04]" />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold" style={{ color }}>{percent}%</span>
        </div>
      </div>
      {label && <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{label}</span>}
    </div>
  );
}

/* ── Stat Card Config ── */
const statCards = [
  {
    label: "เครดิตคงเหลือ", key: "credits" as const, delta: "+1,000", positive: true,
    sparkline: [2, 4, 3, 6, 8, 6, 4, 5, 7, 9], color: "#22D3EE",
    gradient: "from-cyan-500/10 via-cyan-400/5 to-transparent",
    borderGlow: "hover:border-cyan-500/20 hover:shadow-[0_0_30px_rgba(34,211,238,0.08)]",
    iconBg: "from-cyan-500/20 to-cyan-400/5",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    label: "ส่งวันนี้", key: "sent" as const, delta: "+23.5%", positive: true,
    sparkline: [1, 3, 5, 4, 7, 5, 3, 4, 6, 8], color: "#8B5CF6",
    gradient: "from-violet-500/10 via-violet-400/5 to-transparent",
    borderGlow: "hover:border-violet-500/20 hover:shadow-[0_0_30px_rgba(139,92,246,0.08)]",
    iconBg: "from-violet-500/20 to-violet-400/5",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    ),
  },
  {
    label: "สำเร็จ", key: "delivered" as const, delta: "98.2%", positive: true,
    sparkline: [6, 8, 8, 9, 8, 9, 9, 9, 8, 9], color: "#10B981",
    gradient: "from-emerald-500/10 via-emerald-400/5 to-transparent",
    borderGlow: "hover:border-emerald-500/20 hover:shadow-[0_0_30px_rgba(16,185,129,0.08)]",
    iconBg: "from-emerald-500/20 to-emerald-400/5",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    label: "ล้มเหลว", key: "failed" as const, delta: "1.8%", positive: false,
    sparkline: [1, 1, 0, 1, 0, 0, 1, 0, 0, 1], color: "#EF4444",
    gradient: "from-red-500/10 via-red-400/5 to-transparent",
    borderGlow: "hover:border-red-500/20 hover:shadow-[0_0_30px_rgba(239,68,68,0.08)]",
    iconBg: "from-red-500/20 to-red-400/5",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
];

/* ── Quick Action Buttons ── */
const quickActions = [
  {
    label: "ส่ง SMS", href: "/dashboard/send", desc: "ส่งข้อความทันที",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>,
    gradient: "from-violet-500 to-purple-600", shadow: "shadow-violet-500/20",
    ring: "ring-violet-500/10",
  },
  {
    label: "เติมเครดิต", href: "/dashboard/topup", desc: "เพิ่มเครดิตได้เลย",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>,
    gradient: "from-cyan-500 to-teal-600", shadow: "shadow-cyan-500/20",
    ring: "ring-cyan-500/10",
  },
  {
    label: "ดูรายงาน", href: "/dashboard/analytics", desc: "วิเคราะห์ผลลัพธ์",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
    gradient: "from-pink-500 to-rose-600", shadow: "shadow-pink-500/20",
    ring: "ring-pink-500/10",
  },
  {
    label: "API Docs", href: "/dashboard/api-docs", desc: "คู่มือนักพัฒนา",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg>,
    gradient: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/20",
    ring: "ring-amber-500/10",
  },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

const statusConfig: Record<string, { dot: string; badge: string; label: string }> = {
  delivered: { dot: "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "สำเร็จ" },
  sent: { dot: "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]", badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20", label: "ส่งแล้ว" },
  pending: { dot: "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "รอส่ง" },
  failed: { dot: "bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]", badge: "bg-red-500/10 text-red-400 border-red-500/20", label: "ล้มเหลว" },
};

function useCurrentTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);
  return time;
}

export default function DashboardContent({ user, stats, senderNames = ["EasySlip"] }: { user: User; stats?: DashboardStats; senderNames?: string[] }) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [senderName, setSenderName] = useState(senderNames[0] || "EasySlip");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const now = useCurrentTime();

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
      setSendResult(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
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

  const successRate = stats?.today.total
    ? Math.round((stats.today.delivered / stats.today.total) * 100)
    : 0;

  const hour = now.getHours();
  const greeting = hour < 12 ? "สวัสดีตอนเช้า" : hour < 17 ? "สวัสดีตอนบ่าย" : "สวัสดีตอนเย็น";

  const dateStr = now.toLocaleDateString("th-TH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <motion.div className="p-4 md:p-8 max-w-[1280px] mx-auto" initial="hidden" animate="show" variants={stagger}>

      {/* ═══════════════════════════════════════════════════════
          WELCOME HERO BANNER — Premium glassmorphism
          ═══════════════════════════════════════════════════════ */}
      <motion.div variants={fadeUp} className="relative overflow-hidden rounded-3xl mb-8 border border-white/[0.06] group">
        {/* Animated mesh gradient bg */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 via-[var(--bg-base)] to-cyan-600/20" />
          <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-violet-500/20 blur-[100px] animate-pulse" style={{ animationDuration: "4s" }} />
          <div className="absolute bottom-[-20%] left-[-5%] w-[350px] h-[350px] rounded-full bg-cyan-500/20 blur-[100px] animate-pulse" style={{ animationDuration: "6s" }} />
          <div className="absolute top-[20%] left-[40%] w-[250px] h-[250px] rounded-full bg-pink-500/15 blur-[80px] animate-pulse" style={{ animationDuration: "8s" }} />
          <div className="absolute inset-0 bg-[var(--bg-base)]/40 backdrop-blur-sm" />
        </div>

        {/* Border glow on hover */}
        <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-violet-500/30 via-cyan-500/20 to-pink-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10 blur-[1px]" />

        <div className="relative px-6 py-8 md:px-10 md:py-12">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              {/* Date badge */}
              <motion.div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] mb-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400/60">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span className="text-[11px] text-[var(--text-muted)]">{dateStr}</span>
              </motion.div>

              <motion.p
                className="text-xs text-cyan-300/50 font-medium uppercase tracking-[0.2em] mb-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {greeting}
              </motion.p>

              <motion.h1
                className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span className="gradient-text-mixed">{user.name}</span>
              </motion.h1>

              <motion.div
                className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-muted)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400/60">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                  วันนี้ส่ง <span className="text-violet-400 font-semibold">{stats?.today.total ?? 0}</span> ข้อความ
                </span>
                {successRate > 0 && (
                  <span className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400/60">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    อัตราสำเร็จ <span className="text-emerald-400 font-semibold">{successRate}%</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400/60">
                    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                  เครดิต <span className="text-cyan-400 font-semibold">{(stats?.user.credits ?? user.credits).toLocaleString()}</span>
                </span>
              </motion.div>
            </div>

            {/* Activity Rings */}
            <motion.div
              className="hidden md:flex items-center gap-5"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            >
              <ActivityRing percent={successRate || 0} color="#10B981" size={80} label="สำเร็จ" />
              <ActivityRing
                percent={stats?.today.total ? Math.min(Math.round((stats.today.total / 500) * 100), 100) : 0}
                color="#8B5CF6"
                size={80}
                label="วันนี้"
              />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════
          QUICK ACTIONS — Gradient pill buttons
          ═══════════════════════════════════════════════════════ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {quickActions.map((action) => (
          <motion.div key={action.label} whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Link
              href={action.href}
              className={`relative flex flex-col gap-1 px-4 py-4 rounded-2xl bg-gradient-to-br ${action.gradient} shadow-lg ${action.shadow} text-white transition-all hover:shadow-xl ring-1 ${action.ring} overflow-hidden group`}
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
              <div className="relative flex items-center gap-2.5">
                <span className="opacity-90">{action.icon}</span>
                <span className="text-sm font-semibold">{action.label}</span>
              </div>
              <span className="relative text-[10px] text-white/50 pl-[30px]">{action.desc}</span>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════
          STATS GRID — Premium gradient glow cards
          ═══════════════════════════════════════════════════════ */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" variants={stagger}>
        {statCards.map((stat) => (
          <motion.div
            key={stat.key}
            variants={fadeUp}
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
            className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[var(--bg-elevated)]/80 backdrop-blur-xl p-5 group cursor-default transition-all duration-500 ${stat.borderGlow}`}
          >
            {/* Gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />

            {/* Animated glow orb */}
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[40px]" style={{ backgroundColor: stat.color + "30" }} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.iconBg} border border-white/[0.06] flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  {stat.icon}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${stat.positive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/15" : "bg-red-500/10 text-red-400 border-red-500/15"}`}>
                  {stat.positive ? "↑" : "↓"} {stat.delta}
                </span>
              </div>

              <div className="text-3xl font-bold mb-1.5 text-[var(--text-primary)] tracking-tight">
                <AnimatedCounter value={statValues[stat.key]} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)] font-medium">{stat.label}</span>
                <MiniChart data={stat.sparkline} color={stat.color} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════
          7-DAY CHART — Interactive area chart
          ═══════════════════════════════════════════════════════ */}
      <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[var(--bg-elevated)]/80 backdrop-blur-xl p-6 mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.03] via-transparent to-cyan-500/[0.03]" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/15 to-pink-500/10 border border-violet-500/10 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
                  <path d="M3 3v18h18" /><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold gradient-text-mixed">SMS 7 วันล่าสุด</h3>
                <p className="text-[11px] text-[var(--text-muted)]">เลื่อนเมาส์ดูรายละเอียดแต่ละวัน</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--text-muted)] px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)]">7 วัน</span>
            </div>
          </div>

          <SmsAreaChart />
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════
          TWO-COLUMN: Quick Send + Recent Messages
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">

        {/* Quick Send — 2 cols */}
        <motion.div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[var(--bg-elevated)]/80 backdrop-blur-xl p-6" variants={fadeUp}>
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.03] to-transparent" />

          <div className="relative z-10">
            <h3 className="text-base font-semibold mb-5 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/15 to-cyan-500/10 border border-violet-500/10 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </div>
              <span className="gradient-text-mixed">ส่งด่วน</span>
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">ชื่อผู้ส่ง</label>
                <div className="relative">
                  <select
                    className="input-glass cursor-pointer appearance-none pr-10"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                  >
                    {senderNames.map((name) => (
                      <option key={name} value={name} className="bg-[var(--bg-elevated)] text-white">
                        {name === "EasySlip" ? "EasySlip (ค่าเริ่มต้น)" : name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">เบอร์ปลายทาง</label>
                <input type="text" className="input-glass" placeholder="0891234567" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">ข้อความ</label>
                <textarea className="input-glass resize-none" rows={3} placeholder="รหัส OTP ของคุณคือ {code}" value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>
            </div>

            <AnimatePresence>
              {sendResult && (
                <motion.p
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`mt-3 text-xs font-medium ${sendResult.includes("สำเร็จ") ? "text-emerald-400" : "text-red-400"}`}
                >
                  {sendResult}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              onClick={handleQuickSend}
              disabled={sending || !phone || !message}
              className="btn-gradient w-full mt-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {sending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  กำลังส่ง...
                </span>
              ) : (
                <>
                  ส่ง SMS
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Recent Messages — 3 cols */}
        <motion.div className="lg:col-span-3 relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[var(--bg-elevated)]/80 backdrop-blur-xl p-6" variants={fadeUp}>
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.03] to-transparent" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/15 to-violet-500/10 border border-cyan-500/10 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                </div>
                <span className="gradient-text-cyan">ข้อความล่าสุด</span>
              </h3>
              <motion.div whileHover={{ x: 3 }}>
                <Link href="/dashboard/messages" className="text-xs text-[var(--text-muted)] hover:text-violet-400 transition-colors flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--bg-surface)]/50 border border-[var(--border-subtle)] hover:border-violet-500/20">
                  ดูทั้งหมด
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </Link>
              </motion.div>
            </div>

            {stats?.recentMessages && stats.recentMessages.length > 0 ? (
              <div className="space-y-2">
                {stats.recentMessages.map((msg, i) => {
                  const s = statusConfig[msg.status] || statusConfig.pending;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, ease: "easeOut" }}
                      whileHover={{ x: 4, backgroundColor: "rgba(139,92,246,0.04)" }}
                      className="flex items-center justify-between py-3 px-4 rounded-xl bg-[var(--bg-surface)]/40 border border-[var(--border-subtle)] hover:border-violet-500/15 transition-all cursor-default group"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.dot}`} />
                        <div>
                          <span className="text-sm text-[var(--text-secondary)] font-mono group-hover:text-[var(--text-primary)] transition-colors">{msg.recipient}</span>
                          <span className="text-[11px] text-[var(--text-muted)] ml-2">{msg.senderName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-[var(--text-muted)] font-mono">฿{msg.creditCost}</span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${s.badge}`}>
                          {s.label}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div
                className="text-center py-16"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-500/5 border border-[var(--border-subtle)] flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--text-muted)]">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">ยังไม่มีข้อความ</p>
                <p className="text-xs text-[var(--text-muted)] mb-5">ส่ง SMS แรกของคุณเลย</p>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link href="/dashboard/send" className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold">
                    ส่ง SMS
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MONTHLY OVERVIEW — Progress bars with gradient fills
          ═══════════════════════════════════════════════════════ */}
      {stats?.thisMonth && stats.thisMonth.total > 0 && (
        <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[var(--bg-elevated)]/80 backdrop-blur-xl p-6 mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] to-transparent" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/10 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-400">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                สรุปเดือนนี้
              </h3>
              <span className="text-xs text-[var(--text-muted)] px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)]">{stats.thisMonth.total.toLocaleString()} ข้อความ</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              {[
                { label: "สำเร็จ", value: stats.thisMonth.delivered, color: "bg-gradient-to-r from-emerald-500 to-emerald-400", textColor: "text-emerald-400", pct: Math.round((stats.thisMonth.delivered / stats.thisMonth.total) * 100) },
                { label: "ส่งแล้ว", value: stats.thisMonth.sent, color: "bg-gradient-to-r from-cyan-500 to-cyan-400", textColor: "text-cyan-400", pct: Math.round((stats.thisMonth.sent / stats.thisMonth.total) * 100) },
                { label: "รอดำเนินการ", value: stats.thisMonth.pending, color: "bg-gradient-to-r from-amber-500 to-amber-400", textColor: "text-amber-400", pct: Math.round((stats.thisMonth.pending / stats.thisMonth.total) * 100) },
                { label: "ล้มเหลว", value: stats.thisMonth.failed, color: "bg-gradient-to-r from-red-500 to-red-400", textColor: "text-red-400", pct: Math.round((stats.thisMonth.failed / stats.thisMonth.total) * 100) },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[var(--text-secondary)] font-medium">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${item.textColor}`}>{item.value.toLocaleString()}</span>
                      <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded">{item.pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${item.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.pct}%` }}
                      transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SYSTEM STATUS — Minimal operational grid
          ═══════════════════════════════════════════════════════ */}
      <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[var(--bg-elevated)]/80 backdrop-blur-xl p-6">
        <div className="relative z-10">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/15 to-green-500/10 border border-emerald-500/10 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            สถานะระบบ
            <span className="text-[10px] text-emerald-400/60 font-normal ml-1">ทุกระบบปกติ</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "SMS Gateway", latency: "12ms" },
              { label: "OTP Service", latency: "8ms" },
              { label: "API Server", latency: "5ms" },
              { label: "Database", latency: "3ms" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2.5 py-3 px-3.5 rounded-xl bg-[var(--bg-surface)]/40 border border-[var(--border-subtle)] hover:border-emerald-500/10 transition-colors group">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)] group-hover:shadow-[0_0_12px_rgba(16,185,129,0.7)] transition-shadow" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--text-secondary)]">{s.label}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-emerald-400/60">Operational</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{s.latency}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
