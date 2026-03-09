"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type User = {
  id: string;
  name: string;
  email: string;
  credits: number;
  role: string;
};

const sidebarItems = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
    label: "แดชบอร์ด",
    href: "/dashboard",
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
    label: "แคมเปญ",
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
    label: "ชื่อผู้ส่ง",
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
    label: "คีย์ API",
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

function SidebarLink({ item, isActive }: { item: typeof sidebarItems[0]; isActive: boolean }) {
  return (
    <Link href={item.href} className="block relative">
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-xl bg-sky-500/8 border-l-2 border-sky-400"
          style={{ boxShadow: "inset 0 0 20px rgba(56,189,248,0.03)" }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <div className={`sidebar-item relative z-10 ${isActive ? "text-white" : ""}`}>
        <span className="flex-shrink-0">{item.icon}</span>
        {item.label}
      </div>
    </Link>
  );
}

export default function DashboardShell({
  user,
  title = "",
  children,
}: {
  user: User;
  title?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[var(--bg-base)]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-[240px] border-r border-white/[0.04] bg-[var(--bg-base)]/95 backdrop-blur-2xl flex-col p-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 px-4 py-3 mb-6 group">
          <motion.svg
            width="22" height="22" viewBox="0 0 24 24" fill="none"
            className="text-sky-400"
            whileHover={{ rotate: 12, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.3" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
          <span className="text-lg font-bold bg-gradient-to-r from-sky-300 via-cyan-300 to-sky-400 bg-clip-text text-transparent">SMSOK</span>
        </Link>

        {/* Main */}
        <div className="text-[10px] uppercase tracking-[0.15em] text-white/15 px-4 mb-2 font-semibold">หลัก</div>
        <nav className="space-y-0.5 mb-6">
          {sidebarItems.filter(i => i.section === "main").map((item) => (
            <SidebarLink key={item.label} item={item} isActive={pathname === item.href} />
          ))}
        </nav>

        {/* Management */}
        <div className="text-[10px] uppercase tracking-[0.15em] text-white/15 px-4 mb-2 font-semibold">จัดการ</div>
        <nav className="space-y-0.5 mb-6">
          {sidebarItems.filter(i => i.section === "manage").map((item) => (
            <SidebarLink key={item.label} item={item} isActive={pathname === item.href} />
          ))}
        </nav>

        {/* Settings */}
        <div className="text-[10px] uppercase tracking-[0.15em] text-white/15 px-4 mb-2 font-semibold">ตั้งค่า</div>
        <nav className="space-y-0.5 flex-1">
          {sidebarItems.filter(i => i.section === "settings").map((item) => (
            <SidebarLink key={item.label} item={item} isActive={pathname === item.href} />
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-white/[0.04] pt-4 px-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500/30 to-violet-500/20 border border-sky-500/20 flex items-center justify-center text-xs font-semibold text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.1)]">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white/60 truncate">{user.name}</div>
              <div className="text-[11px] text-white/20 truncate">{user.email}</div>
            </div>
          </div>
          <form action={logout}>
            <button className="sidebar-item w-full text-red-400/40 hover:text-red-400">
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
        <header className="sticky top-0 z-40 border-b border-white/[0.04] bg-[var(--bg-base)]/80 backdrop-blur-2xl px-6 md:px-8 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white tracking-tight">{title || sidebarItems.find(i => i.href === pathname)?.label || "แดชบอร์ด"}</h1>
          <div className="flex items-center gap-4">
            <motion.div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-500/[0.06] to-violet-500/[0.04] border border-sky-500/10"
              whileHover={{ scale: 1.03, borderColor: "rgba(56,189,248,0.25)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-sky-400">
                <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
              <span className="text-xs text-white/40">เครดิต:</span>
              <span className="text-sm font-semibold bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text text-transparent">{user.credits.toLocaleString()}</span>
            </motion.div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500/30 to-violet-500/20 border border-sky-500/20 flex items-center justify-center text-xs font-semibold text-sky-300 md:hidden">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        {children}

        {/* Footer */}
        <footer className="border-t border-white/[0.03] px-8 py-4 mt-8">
          <div className="flex items-center justify-between text-[11px] text-white/15">
            <span>v1.0</span>
            <span>&copy; SMSOK — แพลตฟอร์มส่ง SMS</span>
          </div>
        </footer>
      </main>

      {/* Mobile More Menu Overlay */}
      <AnimatePresence>
        {moreOpen && (
          <div className="md:hidden fixed inset-0 z-[60]">
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 glass rounded-t-2xl border-t border-white/10 p-4 pb-8"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="w-10 h-1 rounded-full bg-white/10 mx-auto mb-4" />
              <div className="grid grid-cols-3 gap-3">
                {sidebarItems.filter(i => !["/dashboard", "/dashboard/send", "/dashboard/messages"].includes(i.href)).map((item, idx) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all min-h-[72px] ${
                        pathname === item.href
                          ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                          : "bg-white/[0.02] text-white/40 hover:bg-white/[0.04] border border-white/[0.04]"
                      }`}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      <span className="text-[11px] font-medium text-center leading-tight">{item.label}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <form action={logout}>
                  <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-all text-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                    ออกจากระบบ
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.04] bg-[var(--bg-base)]/90 backdrop-blur-2xl flex items-center justify-around px-2 py-2 safe-area-bottom">
        <Link href="/dashboard" className={`flex flex-col items-center gap-1 py-1 px-3 ${pathname === "/dashboard" ? "text-sky-400" : "text-white/30"}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
          </svg>
          <span className="text-[10px]">หน้าหลัก</span>
          {pathname === "/dashboard" && <div className="w-1 h-1 rounded-full bg-sky-400 shadow-[0_0_4px_rgba(56,189,248,0.6)]" />}
        </Link>
        <Link href="/dashboard/send" className={`flex flex-col items-center gap-1 py-1 px-3 ${pathname === "/dashboard/send" ? "text-sky-400" : "text-white/30"}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
          <span className="text-[10px]">ส่ง SMS</span>
        </Link>
        <Link href="/dashboard/send" className="flex items-center justify-center w-12 h-12 -mt-5 rounded-full bg-gradient-to-br from-sky-400 via-cyan-400 to-violet-500 shadow-[0_0_25px_rgba(56,189,248,0.4),0_4px_12px_rgba(0,0,0,0.3)]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </Link>
        <Link href="/dashboard/messages" className={`flex flex-col items-center gap-1 py-1 px-3 ${pathname === "/dashboard/messages" ? "text-sky-400" : "text-white/30"}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <span className="text-[10px]">ข้อความ</span>
        </Link>
        <button onClick={() => setMoreOpen(true)} className="flex flex-col items-center gap-1 py-1 px-3 text-white/30 cursor-pointer min-w-[44px] min-h-[44px]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
          </svg>
          <span className="text-[10px]">เพิ่มเติม</span>
        </button>
      </nav>
    </div>
  );
}
