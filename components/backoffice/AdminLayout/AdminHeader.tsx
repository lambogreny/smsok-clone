"use client";

import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
  onMobileMenu: () => void;
  hasNotifications?: boolean;
}

export function AdminHeader({ onMobileMenu, hasNotifications }: AdminHeaderProps) {
  return (
    <header className="h-14 px-8 max-md:px-4 bg-[var(--bg-base)] border-b border-[var(--border-default)] flex items-center justify-between sticky top-0 z-30 shrink-0">
      {/* Left: mobile hamburger */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onMobileMenu}
          className="md:hidden"
        >
          <Menu size={18} />
        </Button>
      </div>

      {/* Right: notification + avatar */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" className="relative">
          <Bell size={16} />
          {hasNotifications && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--error)]" />
          )}
        </Button>

        <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-xs font-bold text-[var(--text-on-accent)] cursor-pointer">
          A
        </div>
      </div>
    </header>
  );
}
