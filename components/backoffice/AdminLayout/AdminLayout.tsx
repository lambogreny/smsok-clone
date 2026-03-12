"use client";

import { useState, type ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { MobileSidebarDrawer } from "./MobileSidebarDrawer";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
  badges?: Record<string, string | number>;
}

export function AdminLayout({ children, badges }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[var(--bg-base)]">
      {/* Desktop sidebar */}
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        badges={badges}
        className="hidden md:flex"
      />

      {/* Mobile drawer */}
      <MobileSidebarDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        badges={badges}
      />

      {/* Main content */}
      <div
        className={cn(
          "flex-1 flex flex-col overflow-hidden transition-[margin-left] duration-200",
          collapsed ? "md:ml-16" : "md:ml-60",
        )}
      >
        <AdminHeader
          onMobileMenu={() => setMobileOpen(true)}
          hasNotifications
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
