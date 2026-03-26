"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

export interface CustomSelectOption {
  value: string;
  label: string;
}

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// Track how many CustomSelect dropdowns are currently open (module-level)
let _openCount = 0;
export function isCustomSelectOpen() {
  return _openCount > 0;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "เลือก...",
  disabled = false,
  className = "",
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(0);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  const close = useCallback(() => setOpen(false), []);

  // Track open/close in module-level counter
  useEffect(() => {
    if (open) {
      _openCount++;
      return () => { _openCount--; };
    }
  }, [open]);

  // Compute trigger position whenever dropdown opens
  function computeRect() {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setRect({ top: r.bottom + 4, left: r.left, width: r.width });
    }
  }

  function toggle() {
    if (disabled) return;
    if (!open) computeRect();
    setOpen((v) => !v);
  }

  // Close on outside click or scroll
  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        close();
      }
    }
    function onScroll() { close(); }
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, close]);

  // Sync focused index on open
  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      const idx = options.findIndex((o) => o.value === value);
      setFocused(idx >= 0 ? idx : 0);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, value, options]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (!open && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
      e.preventDefault();
      computeRect();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "Escape") { close(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setFocused((f) => Math.min(f + 1, options.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setFocused((f) => Math.max(f - 1, 0)); }
    if (e.key === "Enter") {
      e.preventDefault();
      if (options[focused]) { onChange(options[focused].value); close(); }
    }
  }

  const dropdown = rect && (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          style={{ position: "fixed", top: rect.top, left: rect.left, width: rect.width, zIndex: 9999 }}
          data-custom-select-dropdown
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="rounded-lg overflow-hidden
            bg-[var(--bg-elevated)]/95 border border-white/10
            shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        >
          {options.map((opt, i) => (
            <button
              key={opt.value}
              type="button"
              onMouseEnter={() => setFocused(i)}
              onClick={() => { onChange(opt.value); close(); }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors
                ${i === focused ? "bg-white/[0.08] text-white" : "text-[var(--text-secondary)] hover:bg-white/[0.05]"}
                ${opt.value === value ? "text-[var(--accent)] font-medium" : ""}`}
            >
              {opt.label}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm
          bg-[var(--bg-surface)]/80 border transition-colors
          ${open ? "border-[rgba(var(--accent-rgb),0.15)]" : "border-[var(--border-subtle)] hover:border-[rgba(var(--accent-rgb),0.15)]"}
          text-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className={selectedLabel ? "" : "text-[var(--text-muted)]"}>
          {selectedLabel || placeholder}
        </span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.15 }}
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          className="text-[var(--text-muted)] flex-shrink-0 ml-2"
        >
          <polyline points="6 9 12 15 18 9" />
        </motion.svg>
      </button>

      {typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
}
