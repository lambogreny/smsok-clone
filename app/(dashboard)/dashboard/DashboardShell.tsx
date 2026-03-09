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
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    label: "ภาพรวม",
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
    label: "ประวัติการส่ง",
    href: "/dashboard/messages",
    section: "main",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
    label: "บริการ OTP",
    href: "/dashboard/otp",
    section: "main",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    label: "เทมเพลต",
    href: "/dashboard/templates",
    section: "main",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
    label: "รายชื่อผู้ติดต่อ",
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
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    label: "แคมเปญ",
    href: "/dashboard/campaigns",
    section: "manage",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    label: "รายงาน",
    href: "/dashboard/analytics",
    section: "manage",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
    label: "เติมเครดิต",
    href: "/dashboard/topup",
    section: "settings",
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
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
      </svg>
    ),
    label: "API Docs",
    href: "/dashboard/docs",
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
    <Link href={item.href} className="block relative group">
      {isActive && (
        <>
          {/* Active glow line on left */}
          <motion.div
            layoutId="sidebar-glow-line"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-gradient-to-b from-violet-400 to-cyan-400"
            style={{ boxShadow: "0 0 8px rgba(139,92,246,0.5)" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
          <motion.div
            layoutId="sidebar-active"
            className="absolute inset-0 rounded-lg bg-gradient-to-r from-violet-500/12 to-cyan-500/5"
            style={{ boxShadow: "inset 0 0 0 1px rgba(139,92,246,0.15), 0 0 20px rgba(139,92,246,0.05)" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        </>
      )}
      <motion.div
        className={`sidebar-item relative z-10 ${isActive ? "!text-white font-medium" : ""}`}
        whileHover={{ x: 3 }}
        transition={{ duration: 0.15 }}
      >
        <span className={`flex-shrink-0 transition-colors duration-150 ${isActive ? "text-violet-400 drop-shadow-[0_0_4px_rgba(139,92,246,0.4)]" : "group-hover:text-slate-300"}`}>{item.icon}</span>
        {item.label}
      </motion.div>
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

  const mainItems = sidebarItems.filter(i => i.section === "main");
  const manageItems = sidebarItems.filter(i => i.section === "manage");
  const settingsItems = sidebarItems.filter(i => i.section === "settings");

  return (
    <div className="min-h-screen flex bg-[var(--bg-base)] relative">
      {/* Ambient Orbs — background decoration */}
      <div className="ambient-orb ambient-orb-cyan" aria-hidden="true" />
      <div className="ambient-orb ambient-orb-purple" aria-hidden="true" />
      <div className="ambient-orb ambient-orb-pink" aria-hidden="true" />

      {/* Sidebar — Slim, clean */}
      <aside className="hidden md:flex w-[220px] flex-shrink-0 border-r border-[var(--border-subtle)] bg-[#0D1526]/95 backdrop-blur-xl flex-col">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 px-5 h-14 border-b border-[var(--border-subtle)] group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" fill="currentColor" />
            </svg>
          </div>
          <span className="text-base font-bold tracking-tight gradient-text-mixed">SMSOK</span>
        </Link>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-3 px-3">
          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)] px-3 mb-2 font-medium">เมนูหลัก</div>
          <nav className="space-y-0.5 mb-5">
            {mainItems.map((item) => (
              <SidebarLink key={item.label} item={item} isActive={pathname === item.href} />
            ))}
          </nav>

          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)] px-3 mb-2 font-medium">จัดการ</div>
          <nav className="space-y-0.5 mb-5">
            {manageItems.map((item) => (
              <SidebarLink key={item.label} item={item} isActive={pathname === item.href} />
            ))}
          </nav>

          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)] px-3 mb-2 font-medium">ตั้งค่า</div>
          <nav className="space-y-0.5">
            {settingsItems.map((item) => (
              <SidebarLink key={item.label} item={item} isActive={pathname === item.href} />
            ))}
          </nav>
        </div>

        {/* User section */}
        <div className="border-t border-[var(--border-subtle)] p-3">
          <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/10 border border-violet-500/15 flex items-center justify-center text-xs font-semibold text-violet-300">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-[var(--text-secondary)] font-medium truncate">{user.name}</div>
              <div className="text-[11px] text-[var(--text-muted)] truncate">{user.email}</div>
            </div>
          </div>
          <form action={logout}>
            <button className="sidebar-item w-full text-red-400/40 hover:text-red-400 hover:bg-red-500/5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              ออกจากระบบ
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar — Clean, minimal */}
        <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[#0B1120]/80 backdrop-blur-xl h-14 flex items-center justify-between px-6 md:px-8">
          <h1 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">
            {title || sidebarItems.find(i => i.href === pathname)?.label || "ภาพรวม"}
          </h1>
          <div className="flex items-center gap-2.5">
            {/* Search */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-violet-500/15 transition-colors min-w-[200px] group">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-muted)] group-focus-within:text-violet-400 transition-colors flex-shrink-0">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="ค้นหา..."
                className="bg-transparent text-xs text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] outline-none w-full"
              />
              <kbd className="hidden xl:inline-flex text-[10px] text-[var(--text-muted)] border border-[var(--border-subtle)] px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
            </div>

            {/* Notification */}
            <motion.button
              className="relative w-9 h-9 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-violet-500/15 flex items-center justify-center transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-muted)]">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-violet-500 border-2 border-[#0B1120]" />
            </motion.button>

            {/* Credits */}
            <Link
              href="/dashboard/topup"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-violet-500/20 transition-colors group"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
                <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
              <span className="text-xs text-[var(--text-muted)]">เครดิต</span>
              <span className="text-sm font-semibold gradient-text-cyan">฿{user.credits.toLocaleString()}</span>
            </Link>

            {/* Mobile avatar */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/10 border border-violet-500/15 flex items-center justify-center text-xs font-semibold text-violet-300 md:hidden">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Page Content with transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <footer className="border-t border-[var(--border-subtle)] px-8 py-4 mt-8">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span>v1.0</span>
            <span>&copy; SMSOK</span>
          </div>
        </footer>
      </main>

      {/* Mobile More Menu */}
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
              className="absolute bottom-0 left-0 right-0 bg-[#0D1526] rounded-t-2xl border-t border-[var(--border-subtle)] p-4 pb-8"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="w-10 h-1 rounded-full bg-white/10 mx-auto mb-4" />
              <div className="grid grid-cols-3 gap-2">
                {sidebarItems.filter(i => !["/dashboard", "/dashboard/send", "/dashboard/messages"].includes(i.href)).map((item, idx) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                        pathname === item.href
                          ? "bg-violet-500/10 text-violet-300 border border-violet-500/15"
                          : "text-[var(--text-muted)] hover:bg-[var(--bg-surface)] border border-transparent"
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                <form action={logout}>
                  <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-red-400/50 hover:text-red-400 hover:bg-red-500/5 transition-all text-sm">
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border-subtle)] bg-[#0B1120]/95 backdrop-blur-xl flex items-center justify-around px-2 py-2 safe-area-bottom">
        <Link href="/dashboard" className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors ${pathname === "/dashboard" ? "text-violet-400" : "text-[var(--text-muted)]"}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span className="text-[10px]">หน้าหลัก</span>
        </Link>
        <Link href="/dashboard/send" className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors ${pathname === "/dashboard/send" ? "text-violet-400" : "text-[var(--text-muted)]"}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
          <span className="text-[10px]">ส่ง SMS</span>
        </Link>
        <Link href="/dashboard/send" className="flex items-center justify-center w-11 h-11 -mt-4 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/25">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </Link>
        <Link href="/dashboard/messages" className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors ${pathname === "/dashboard/messages" ? "text-violet-400" : "text-[var(--text-muted)]"}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <span className="text-[10px]">ประวัติ</span>
        </Link>
        <button onClick={() => setMoreOpen(true)} className="flex flex-col items-center gap-0.5 py-1.5 px-3 text-[var(--text-muted)] cursor-pointer min-w-[44px] min-h-[44px]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
          </svg>
          <span className="text-[10px]">เพิ่มเติม</span>
        </button>
      </nav>
    </div>
  );
}
