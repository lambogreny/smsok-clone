"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Radio,
  DollarSign,
  Headphones,
  BarChart3,
  Cpu,
  Megaphone,
  Settings,
  ScrollText,
  Users,
  ChevronLeft,
  ChevronRight,
  Bell,
} from "lucide-react";

/* ─── Nav Config ─── */

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string | number;
  badgeColor?: string;
};

const DASHBOARDS: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  {
    label: "Operations",
    href: "/admin/operations",
    icon: Radio,
    badge: "●",
    badgeColor: "var(--success)",
  },
  {
    label: "Finance",
    href: "/admin/finance",
    icon: DollarSign,
    badge: 8,
    badgeColor: "var(--warning)",
  },
  { label: "Support", href: "/admin/support", icon: Headphones },
  { label: "CEO", href: "/admin/ceo", icon: BarChart3 },
  { label: "CTO", href: "/admin/cto", icon: Cpu },
  { label: "Marketing", href: "/admin/marketing", icon: Megaphone },
];

const SYSTEM: NavItem[] = [
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Audit Log", href: "/admin/audit", icon: ScrollText },
  { label: "Users", href: "/admin/users", icon: Users },
];

/* ─── Admin Layout ─── */

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  function NavLink({ item }: { item: NavItem }) {
    const active = isActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          active
            ? "bg-[rgba(0,226,181,0.08)] text-[var(--accent)] border-l-2 border-[var(--accent)] -ml-[2px]"
            : "text-[var(--text-muted)] hover:text-white hover:bg-[rgba(255,255,255,0.03)]"
        } ${collapsed ? "justify-center px-2" : ""}`}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {item.badge !== undefined && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                style={{
                  color: item.badgeColor,
                  background: `${item.badgeColor}15`,
                }}
              >
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--bg-base)]">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-[var(--border-default)] bg-[var(--bg-base)] transition-[width] duration-200 ${
          collapsed ? "w-[60px]" : "w-[240px]"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-[var(--border-default)]">
          {!collapsed && (
            <span className="text-sm font-bold text-white tracking-tight">
              SMSOK Admin
            </span>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
          >
            {collapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {!collapsed && (
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-3 mb-2">
              Dashboards
            </p>
          )}
          {DASHBOARDS.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}

          <div className="h-px bg-[var(--border-default)] my-3" />

          {!collapsed && (
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-3 mb-2">
              System
            </p>
          )}
          {SYSTEM.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-default)] bg-[var(--bg-base)]">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-white">Admin Panel</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--error)]" />
            </button>
            <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-[var(--text-on-accent)] text-xs font-bold">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
