"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  label: string;
  href: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
  badge?: string | number;
  badgeVariant?: "warning" | "accent" | "error";
}

const BADGE_STYLES = {
  warning: "bg-[rgba(245,158,11,0.12)] text-[var(--warning)]",
  accent:  "bg-[rgba(var(--accent-rgb),0.08)] text-[var(--accent)]",
  error:   "bg-[rgba(239,68,68,0.12)] text-[var(--error)]",
} as const;

export function NavItem({
  label,
  href,
  icon: Icon,
  active,
  collapsed,
  badge,
  badgeVariant = "warning",
}: NavItemProps) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 mx-2 rounded-lg text-[13px] font-medium transition-all duration-150",
        collapsed ? "justify-center px-2 py-2" : "px-3 py-2",
        active
          ? "text-[var(--accent)] bg-[rgba(var(--accent-rgb),0.06)] font-semibold border-l-2 border-l-[var(--accent)] -ml-0.5"
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.03)]",
      )}
    >
      <Icon
        size={18}
        className={cn(
          "shrink-0 transition-opacity",
          active ? "opacity-100" : "opacity-70",
        )}
      />

      {!collapsed && (
        <>
          <span className="truncate">{label}</span>
          {badge !== undefined && (
            <span
              className={cn(
                "ml-auto text-[11px] font-semibold min-w-[20px] h-[18px] px-1.5 rounded-full flex items-center justify-center",
                BADGE_STYLES[badgeVariant],
              )}
            >
              {badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}
