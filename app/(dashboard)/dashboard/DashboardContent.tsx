"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sendSms } from "@/lib/actions/sms";

type User = {
  id: string;
  name: string;
  email: string;
  credits: number;
  role: string;
};

type DashboardStats = {
  user: { credits: number; name: string; email: string };
  today: { total: number; delivered: number; failed: number; sent: number; pending: number };
  thisMonth: { total: number; delivered: number; failed: number; sent: number; pending: number };
  recentMessages: { id: string; recipient: string; status: string; senderName: string; creditCost: number; createdAt: Date }[];
};

const statCards = [
  {
    label: "เครดิต",
    key: "credits" as const,
    delta: "+1,000",
    deltaColor: "text-emerald-400",
    sparkline: [2, 4, 3, 6, 8, 6, 4, 5, 7, 9],
    gradient: true,
    accentFrom: "from-sky-400",
    accentTo: "to-cyan-300",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-sky-400">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    label: "ส่งแล้ว",
    key: "sent" as const,
    delta: "+23.5%",
    deltaColor: "text-emerald-400",
    sparkline: [1, 3, 5, 4, 7, 5, 3, 4, 6, 8],
    accentFrom: "from-violet-400",
    accentTo: "to-purple-300",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400/80">
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    ),
  },
  {
    label: "สำเร็จ",
    key: "delivered" as const,
    delta: "98.2%",
    deltaColor: "text-emerald-400",
    sparkline: [6, 8, 8, 9, 8, 9, 9, 9, 8, 9],
    accentFrom: "from-emerald-400",
    accentTo: "to-teal-300",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400/80">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  {
    label: "ล้มเหลว",
    key: "failed" as const,
    delta: "1.8%",
    deltaColor: "text-red-400",
    sparkline: [1, 1, 0, 1, 0, 0, 1, 0, 0, 1],
    accentFrom: "from-rose-400",
    accentTo: "to-red-300",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400/80">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
];

function AnimatedCounter({ value, duration = 1.2 }: { value: string; duration?: number }) {
  const numericValue = parseInt(value.replace(/,/g, ""), 10);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (isNaN(numericValue)) { setDisplay(value); return; }
    let start = 0;
    const end = numericValue;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * end);
      setDisplay(current.toLocaleString());
      if (progress < 1) requestAnimationFrame(animate);
      else setDisplay(end.toLocaleString());
    };
    requestAnimationFrame(animate);
  }, [numericValue, duration, value]);

  return <>{display}</>;
}

function Sparkline({ data, color = "#38BDF8" }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const h = 24;
  return (
    <div className="flex items-end gap-[3px] h-6">
      {data.map((v, i) => (
        <motion.div
          key={i}
          className="w-[4px] rounded-full"
          initial={{ height: 2, opacity: 0 }}
          animate={{
            height: Math.max((v / max) * h, 2),
            opacity: 0.3 + (v / max) * 0.7,
          }}
          transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function DashboardContent({ user, stats, senderNames = ["EasySlip"] }: { user: User; stats?: DashboardStats; senderNames?: string[] }) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [senderName, setSenderName] = useState(senderNames[0] || "EasySlip");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const handleQuickSend = async () => {
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
  };

  const statValues = {
    credits: (stats?.user.credits ?? user.credits).toLocaleString(),
    sent: (stats?.today.total ?? 0).toLocaleString(),
    delivered: (stats?.today.delivered ?? 0).toLocaleString(),
    failed: (stats?.today.failed ?? 0).toLocaleString(),
  };

  return (
    <motion.div
      className="p-6 md:p-8 max-w-6xl"
      initial="hidden"
      animate="show"
      variants={stagger}
    >
      {/* Greeting */}
      <motion.div className="mb-8" variants={fadeUp}>
        <p className="text-white/30 text-sm">สวัสดี, <span className="text-white/60">{user.name}</span></p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" variants={stagger}>
        {statCards.map((stat) => (
          <motion.div
            key={stat.key}
            variants={fadeUp}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`glass card-glow p-5 group transition-colors duration-300 ${
              stat.gradient ? "border-sky-500/20 shadow-[0_0_30px_rgba(56,189,248,0.06)]" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {stat.icon}
                <span className="text-[11px] text-white/30 uppercase tracking-wider">{stat.label}</span>
              </div>
              <motion.span
                className={`text-[11px] font-medium ${stat.deltaColor}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                {stat.delta}
              </motion.span>
            </div>
            <div className={`text-2xl font-bold mb-3 ${
              stat.gradient
                ? "bg-gradient-to-r from-sky-300 via-cyan-300 to-sky-400 bg-clip-text text-transparent"
                : stat.key === "delivered"
                ? "bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent"
                : stat.key === "failed"
                ? "text-red-400"
                : "bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent"
            }`}>
              <AnimatedCounter value={statValues[stat.key]} />
            </div>
            <Sparkline
              data={stat.sparkline}
              color={
                stat.key === "failed" ? "#EF4444" :
                stat.key === "delivered" ? "#10B981" :
                stat.key === "sent" ? "#8B5CF6" :
                "#38BDF8"
              }
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Send */}
      <motion.div className="glass p-6 md:p-8 mb-8" variants={fadeUp}>
        <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500/[0.12] to-violet-500/[0.08] border border-sky-500/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </div>
          <span className="bg-gradient-to-r from-sky-300 to-violet-300 bg-clip-text text-transparent">ส่งด่วน</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-white/30 uppercase tracking-wider mb-2 font-medium">ชื่อผู้ส่ง</label>
            <div className="relative">
              <select
                className="input-glass cursor-pointer appearance-none pr-10"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              >
                {senderNames.map((name) => (
                  <option key={name} value={name} className="bg-[#0a0f1a] text-white">
                    {name === "EasySlip" ? "EasySlip (ค่าเริ่มต้น)" : name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs text-white/30 uppercase tracking-wider mb-2 font-medium">เบอร์ปลายทาง</label>
            <input
              type="text"
              className="input-glass"
              placeholder="0891234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-white/30 uppercase tracking-wider mb-2 font-medium">ข้อความ</label>
            <input
              type="text"
              className="input-glass"
              placeholder="รหัส OTP ของคุณคือ {code}"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
        <AnimatePresence>
          {sendResult && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mt-3 text-xs font-medium ${sendResult.includes("สำเร็จ") ? "text-emerald-400" : "text-red-400"}`}
            >
              {sendResult}
            </motion.p>
          )}
        </AnimatePresence>
        <div className="mt-5 flex gap-3">
          <motion.button
            onClick={handleQuickSend}
            disabled={sending || !phone || !message}
            className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-40"
            whileHover={{ scale: 1.02 }}
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Recent Messages */}
      <motion.div className="glass p-6 md:p-8" variants={fadeUp}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/[0.12] to-sky-500/[0.08] border border-violet-500/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <span className="bg-gradient-to-r from-violet-300 to-sky-300 bg-clip-text text-transparent">ข้อความล่าสุด</span>
          </h2>
          <motion.a
            href="/dashboard/messages"
            className="text-xs text-sky-400/80 hover:text-sky-300 transition-colors flex items-center gap-1"
            whileHover={{ x: 4 }}
          >
            ดูทั้งหมด
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </motion.a>
        </div>

        {stats?.recentMessages && stats.recentMessages.length > 0 ? (
          <div className="space-y-2">
            {stats.recentMessages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.06, duration: 0.4 }}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
                className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.015] border border-white/[0.04] transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${
                    msg.status === "delivered" ? "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.4)]" :
                    msg.status === "failed" ? "bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.4)]" :
                    msg.status === "sent" ? "bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.4)]" :
                    "bg-yellow-400 shadow-[0_0_6px_rgba(245,158,11,0.4)]"
                  }`} />
                  <span className="text-sm text-white/50 font-mono">{msg.recipient}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-white/20">{msg.senderName}</span>
                  <span className="text-[11px] text-white/15">฿{msg.creditCost}</span>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                    msg.status === "delivered" ? "bg-emerald-500/10 text-emerald-400" :
                    msg.status === "failed" ? "bg-red-500/10 text-red-400" :
                    msg.status === "sent" ? "bg-blue-500/10 text-blue-400" :
                    "bg-yellow-500/10 text-yellow-400"
                  }`}>{
                    msg.status === "delivered" ? "สำเร็จ" :
                    msg.status === "failed" ? "ล้มเหลว" :
                    msg.status === "sent" ? "ส่งแล้ว" : "รอส่ง"
                  }</span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            className="text-center py-14"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white/10">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <p className="text-sm text-white/25 mb-1">ยังไม่มีข้อความ</p>
            <p className="text-xs text-white/15 mb-5">ส่ง SMS แรกของคุณเลย</p>
            <motion.a
              href="/dashboard/send"
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ส่ง SMS
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </motion.a>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
