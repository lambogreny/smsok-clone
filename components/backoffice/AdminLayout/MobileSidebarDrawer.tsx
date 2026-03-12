"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminSidebar } from "./AdminSidebar";

interface MobileSidebarDrawerProps {
  open: boolean;
  onClose: () => void;
  badges?: Record<string, string | number>;
}

export function MobileSidebarDrawer({ open, onClose, badges }: MobileSidebarDrawerProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 md:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] transition-transform duration-200 ease-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-3 z-50 w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.05)] cursor-pointer transition-colors"
        >
          <X size={16} />
        </button>

        <AdminSidebar
          collapsed={false}
          onToggleCollapse={() => {}}
          badges={badges}
          className="w-[280px] relative"
        />
      </div>
    </>
  );
}
