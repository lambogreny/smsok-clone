"use client";

import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Receipt,
  MessageSquare,
  Radio,
  Megaphone,
  TrendingUp,
  Settings,
  ScrollText,
  Headphones,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavItem } from "./NavItem";
import { cn } from "@/lib/utils";

/* ─── Nav Config ─── */

const NAV_CONFIG = {
  main: {
    label: "MAIN",
    items: [
      { label: "Dashboard",    href: "/admin",              icon: LayoutDashboard },
      { label: "Users",        href: "/admin/users",        icon: Users },
      { label: "Transactions", href: "/admin/transactions", icon: Receipt },
      { label: "SMS",          href: "/admin/sms",          icon: MessageSquare },
      { label: "Senders",      href: "/admin/senders",      icon: Radio,     badge: "pending" as const },
      { label: "Campaigns",    href: "/admin/campaigns",    icon: Megaphone },
    ],
  },
  system: {
    label: "SYSTEM",
    items: [
      { label: "Revenue",  href: "/admin/revenue",  icon: TrendingUp, badge: "mtdRevenue" as const },
      { label: "Settings", href: "/admin/settings", icon: Settings },
      { label: "Logs",     href: "/admin/logs",     icon: ScrollText },
      { label: "Support",  href: "/admin/support",  icon: Headphones, badge: "openTickets" as const },
    ],
  },
} as const;

/* ─── Types ─── */

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  badges?: Record<string, string | number>;
  className?: string;
}

/* ─── Component ─── */

export function AdminSidebar({
  collapsed,
  onToggleCollapse,
  badges = {},
  className,
}: AdminSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  function getBadgeValue(item: Record<string, unknown>): string | number | undefined {
    if (!("badge" in item) || !item.badge) return undefined;
    return badges[item.badge as string];
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col bg-[var(--bg-base)] border-r border-[var(--border-default)] transition-[width] duration-200",
        collapsed ? "w-16" : "w-60",
        className,
      )}
    >
      {/* Logo Section */}
      <div className="relative flex items-center gap-3 h-14 px-4 border-b border-[var(--border-default)] shrink-0">
        <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center shrink-0">
          <span className="text-sm font-extrabold text-[var(--text-on-accent)]">S</span>
        </div>
        {!collapsed && (
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-[var(--text-primary)] tracking-[-0.02em]">SMSOK</span>
            <span className="text-[11px] font-medium text-[var(--text-muted)]">Admin</span>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="absolute -right-3 top-5 w-6 h-6 rounded-full bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-center justify-center cursor-pointer hover:bg-[var(--bg-elevated)] hover:border-[var(--border-hover)] transition-colors z-50"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {Object.entries(NAV_CONFIG).map(([key, group]) => (
          <div key={key} className="mb-1">
            {/* Group label */}
            {collapsed ? (
              <div className="h-px bg-[var(--border-default)] mx-3 my-2" />
            ) : (
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.05em] px-5 pt-2 pb-1 mt-2">
                {group.label}
              </p>
            )}

            {/* Items */}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.href}
                  label={item.label}
                  href={item.href}
                  icon={item.icon}
                  active={isActive(item.href)}
                  collapsed={collapsed}
                  badge={getBadgeValue(item)}
                  badgeVariant={
                    "badge" in item && item.badge === "mtdRevenue"
                      ? "accent"
                      : "badge" in item && item.badge === "openTickets"
                        ? "error"
                        : "warning"
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer — Admin info */}
      <div className="border-t border-[var(--border-default)] p-3 shrink-0">
        {collapsed ? (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-xs font-bold text-[var(--text-on-accent)]">
              A
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-xs font-bold text-[var(--text-on-accent)] shrink-0">
              A
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">Admin</p>
              <p className="text-[11px] text-[var(--text-muted)]">Super Admin</p>
            </div>
            <Button variant="ghost" size="icon-sm" className="ml-auto shrink-0">
              <LogOut size={14} />
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
