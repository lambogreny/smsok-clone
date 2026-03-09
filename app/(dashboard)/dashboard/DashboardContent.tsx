"use client";

import { useState } from "react";
import { logout } from "@/lib/actions";
import { sendSms } from "@/lib/actions/sms";
import Link from "next/link";

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

const sidebarItems = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
    label: "Dashboard",
    href: "/dashboard",
    active: true,
    section: "main",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    ),
    label: "ส่ง SMS",
    href: "/dashboard/send",
    section: "main",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    label: "ข้อความ",
    href: "/dashboard/messages",
    section: "main",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    label: "Campaigns",
    href: "/dashboard/campaigns",
    section: "main",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
    label: "สมุดโทรศัพท์",
    href: "/dashboard/contacts",
    section: "manage",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7h-9M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" />
      </svg>
    ),
    label: "Sender Names",
    href: "/dashboard/senders",
    section: "manage",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
    label: "เติมเงิน",
    href: "/dashboard/topup",
    section: "manage",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
      </svg>
    ),
    label: "API Keys",
    href: "/dashboard/api-keys",
    section: "settings",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
    label: "ตั้งค่า",
    href: "/dashboard/settings",
    section: "settings",
  },
];

const statCards = [
  {
    label: "Credits",
    key: "credits" as const,
    delta: "+1,000",
    deltaColor: "text-emerald-400",
    sparkline: [2, 4, 3, 6, 8, 6, 4, 5, 7, 9],
    gradient: true,
  },
  {
    label: "Messages Sent",
    key: "sent" as const,
    delta: "+23.5%",
    deltaColor: "text-emerald-400",
    sparkline: [1, 3, 5, 4, 7, 5, 3, 4, 6, 8],
  },
  {
    label: "Delivered",
    key: "delivered" as const,
    delta: "98.2%",
    deltaColor: "text-emerald-400",
    sparkline: [6, 8, 8, 9, 8, 9, 9, 9, 8, 9],
  },
  {
    label: "Failed",
    key: "failed" as const,
    delta: "1.8%",
    deltaColor: "text-red-400",
    sparkline: [1, 1, 0, 1, 0, 0, 1, 0, 0, 1],
  },
];

function Sparkline({ data, color = "#38BDF8" }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const h = 20;
  return (
    <div className="flex items-end gap-[2px] h-5">
      {data.map((v, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full"
          style={{
            height: `${Math.max((v / max) * h, 2)}px`,
            backgroundColor: color,
            opacity: 0.4 + (v / max) * 0.6,
          }}
        />
      ))}
    </div>
  );
}

export default function DashboardContent({ user, stats }: { user: User; stats?: DashboardStats }) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const handleQuickSend = async () => {
    if (!phone || !message) return;
    setSending(true);
    setSendResult(null);
    try {
      await sendSms(user.id, { senderName: "SMSOK", recipient: phone, message });
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
    <div className="min-h-screen flex bg-[var(--bg-base)]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 border-r border-white/5 bg-[#060A14]/90 backdrop-blur-xl flex-col p-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 px-4 py-3 mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-sky-400">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.3" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-lg font-bold neon-purple">SMSOK</span>
        </Link>

        {/* Main */}
        <div className="text-[10px] uppercase tracking-[0.15em] text-white/20 px-4 mb-2">Main</div>
        <nav className="space-y-0.5 mb-4">
          {sidebarItems.filter(i => i.section === "main").map((item) => (
            <a key={item.label} href={item.href} className={`sidebar-item ${item.active ? "active" : ""}`}>
              <span className="flex-shrink-0">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        {/* Management */}
        <div className="text-[10px] uppercase tracking-[0.15em] text-white/20 px-4 mb-2">Management</div>
        <nav className="space-y-0.5 mb-4">
          {sidebarItems.filter(i => i.section === "manage").map((item) => (
            <a key={item.label} href={item.href} className="sidebar-item">
              <span className="flex-shrink-0">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        {/* Settings */}
        <div className="text-[10px] uppercase tracking-[0.15em] text-white/20 px-4 mb-2">Settings</div>
        <nav className="space-y-0.5 flex-1">
          {sidebarItems.filter(i => i.section === "settings").map((item) => (
            <a key={item.label} href={item.href} className="sidebar-item">
              <span className="flex-shrink-0">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-white/5 pt-4 px-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-xs font-semibold text-sky-300">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white/70 truncate">{user.name}</div>
              <div className="text-[11px] text-white/30 truncate">{user.email}</div>
            </div>
          </div>
          <form action={logout}>
            <button className="sidebar-item w-full text-red-400/50 hover:text-red-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              ออกจากระบบ
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 border-b border-white/5 bg-[var(--bg-base)]/80 backdrop-blur-xl px-6 md:px-8 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-3">
            <div className="text-xs text-white/30">
              เครดิต: <span className="text-sky-400 font-semibold">{user.credits.toLocaleString()}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-xs font-semibold text-sky-300 md:hidden">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        <div className="p-6 md:p-8 max-w-6xl">
          <p className="text-white/40 mb-6 text-sm">สวัสดี, {user.name}</p>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat, i) => (
              <div
                key={stat.key}
                className={`glass p-5 group hover:animate-breathe transition-all animate-fade-in ${
                  stat.gradient ? "border-sky-500/30 shadow-[0_0_30px_rgba(56,189,248,0.1)]" : ""
                }`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] text-white/40 uppercase tracking-wider">{stat.label}</span>
                  <span className={`text-[11px] ${stat.deltaColor}`}>{stat.delta}</span>
                </div>
                <div className={`text-2xl font-bold mb-3 ${stat.gradient ? "neon-purple" : "text-white"}`}>
                  {statValues[stat.key]}
                </div>
                <Sparkline data={stat.sparkline} color={stat.key === "failed" ? "#EF4444" : "#38BDF8"} />
              </div>
            ))}
          </div>

          {/* Quick Send */}
          <div className="glass p-6 md:p-8 mb-8 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
              Quick Send
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">เบอร์ปลายทาง</label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="0891234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">ข้อความ</label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="Your OTP is {code}"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>
            {sendResult && (
              <p className={`mt-2 text-xs ${sendResult.includes("สำเร็จ") ? "text-emerald-400" : "text-red-400"}`}>{sendResult}</p>
            )}
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleQuickSend}
                disabled={sending || !phone || !message}
                className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {sending ? "กำลังส่ง..." : "Send SMS"}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Recent Messages */}
          <div className="glass p-6 md:p-8 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                Recent Messages
              </h2>
              <a href="/dashboard/messages" className="text-xs text-sky-400 hover:text-sky-300 transition-colors">
                View All →
              </a>
            </div>

            {stats?.recentMessages && stats.recentMessages.length > 0 ? (
              <div className="space-y-2">
                {stats.recentMessages.map((msg) => (
                  <div key={msg.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${
                        msg.status === "delivered" ? "bg-emerald-400" :
                        msg.status === "failed" ? "bg-red-400" :
                        msg.status === "sent" ? "bg-blue-400" :
                        "bg-yellow-400"
                      }`} />
                      <span className="text-sm text-white/60 font-mono">{msg.recipient}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-white/30">{msg.senderName}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                        msg.status === "delivered" ? "bg-emerald-500/10 text-emerald-400" :
                        msg.status === "failed" ? "bg-red-500/10 text-red-400" :
                        msg.status === "sent" ? "bg-blue-500/10 text-blue-400" :
                        "bg-yellow-500/10 text-yellow-400"
                      }`}>{msg.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-white/10 mb-4">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                <p className="text-sm text-white/30 mb-1">No messages yet</p>
                <p className="text-xs text-white/20 mb-4">ส่ง SMS แรกของคุณเลย</p>
                <a href="/dashboard/send" className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm">
                  Send SMS
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/5 px-8 py-4 mt-8">
          <div className="flex items-center justify-between text-[11px] text-white/20">
            <span>v1.0</span>
            <span>© SMSOK Clone — designed by uxui</span>
          </div>
        </footer>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-[var(--bg-base)]/90 backdrop-blur-xl flex items-center justify-around px-2 py-2 safe-area-bottom">
        <a href="/dashboard" className="flex flex-col items-center gap-1 py-1 px-3 text-sky-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
          </svg>
          <span className="text-[10px]">Home</span>
          <div className="w-1 h-1 rounded-full bg-sky-400" />
        </a>
        <a href="/dashboard/send" className="flex flex-col items-center gap-1 py-1 px-3 text-white/40">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
          <span className="text-[10px]">Send</span>
        </a>
        <a href="/dashboard/send" className="flex items-center justify-center w-12 h-12 -mt-5 rounded-full bg-gradient-to-br from-sky-500 to-sky-700 shadow-[0_0_20px_rgba(56,189,248,0.4)]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </a>
        <a href="/dashboard/messages" className="flex flex-col items-center gap-1 py-1 px-3 text-white/40">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <span className="text-[10px]">Msgs</span>
        </a>
        <button className="flex flex-col items-center gap-1 py-1 px-3 text-white/40 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
          </svg>
          <span className="text-[10px]">More</span>
        </button>
      </nav>
    </div>
  );
}
