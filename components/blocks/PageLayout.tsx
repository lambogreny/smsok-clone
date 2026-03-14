"use client";

import type { ReactNode } from "react";

/* ─── Page Header ─── */

type PageHeaderProps = {
  title: string;
  count?: number | string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, count, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h1 className="text-xl font-semibold text-white leading-7">
          {title}
          {count !== undefined && (
            <span className="text-[var(--text-secondary)]"> ({count})</span>
          )}
        </h1>
        {description && (
          <p className="text-sm text-[var(--text-secondary)] mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ─── Filter Bar ─── */

type FilterBarProps = {
  children: ReactNode;
};

export function FilterBar({ children }: FilterBarProps) {
  return (
    <div className="flex items-center gap-2.5 flex-wrap mb-4">
      {children}
    </div>
  );
}

/* ─── Stats Row ─── */

type StatsRowProps = {
  children: ReactNode;
  columns?: 2 | 3 | 4;
};

export function StatsRow({ children, columns = 4 }: StatsRowProps) {
  const colClass =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 3
        ? "sm:grid-cols-3"
        : "sm:grid-cols-2 md:grid-cols-4";

  return (
    <>
      {/* Mobile: horizontal scroll strip */}
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:hidden no-scrollbar mb-4">
        {children}
      </div>
      {/* Desktop: grid */}
      <div className={`hidden sm:grid ${colClass} gap-4 mb-4`}>
        {children}
      </div>
    </>
  );
}

/* ─── Stat Card ─── */

type StatCardProps = {
  icon: ReactNode;
  iconColor: string;
  value: string | number;
  label: string;
  delta?: string;
  deltaType?: "positive" | "negative";
  subtitle?: string;
};

export function StatCard({
  icon,
  iconColor,
  value,
  label,
  delta,
  deltaType = "positive",
  subtitle,
}: StatCardProps) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4 snap-start shrink-0 min-w-[160px] sm:min-w-0">
      <div
        className="w-9 h-9 rounded-md flex items-center justify-center mb-3"
        style={{ background: `rgba(${iconColor},0.08)` }}
      >
        {icon}
      </div>
      <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
      <div className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-[0.04em] mt-0.5">
        {label}
      </div>
      {delta && (
        <span
          className={`inline-block text-[11px] mt-1.5 px-2 py-0.5 rounded-full ${
            deltaType === "positive"
              ? "bg-[rgba(var(--success-rgb),0.08)] text-[var(--success)]"
              : "bg-[rgba(var(--error-rgb),0.08)] text-[var(--error)]"
          }`}
        >
          {delta}
        </span>
      )}
      {subtitle && (
        <div className="text-xs text-[var(--text-secondary)] mt-1">{subtitle}</div>
      )}
    </div>
  );
}

/* ─── Batch Bar ─── */

type BatchBarProps = {
  count: number;
  children: ReactNode;
  onCancel: () => void;
};

export function BatchBar({ count, children, onCancel }: BatchBarProps) {
  if (count === 0) return null;

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 flex items-center gap-3 mb-3 animate-fade-in">
      <span className="text-[13px] font-medium text-white">
        เลือก {count} รายการ
      </span>
      <div className="w-px h-4 bg-[var(--border-default)]" />
      <div className="flex items-center gap-2">{children}</div>
      <button
        type="button"
        onClick={onCancel}
        className="ml-auto text-[13px] text-[var(--text-secondary)] hover:text-white transition-colors cursor-pointer"
      >
        ยกเลิก
      </button>
    </div>
  );
}

/* ─── Table Wrapper ─── */

type TableWrapperProps = {
  children: ReactNode;
};

export function TableWrapper({ children }: TableWrapperProps) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-x-auto">
      {children}
    </div>
  );
}

/* ─── Pagination ─── */

type PaginationBarProps = {
  from: number;
  to: number;
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function PaginationBar({
  from,
  to,
  total,
  page,
  totalPages,
  onPageChange,
}: PaginationBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-default)]">
      <span className="text-[13px] text-[var(--text-secondary)]">
        แสดง {from}-{to} จาก {total.toLocaleString()}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 rounded-lg border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const p = i + 1;
          const isActive = p === page;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg border text-[13px] font-medium transition-colors cursor-pointer ${
                isActive
                  ? "bg-[rgba(var(--accent-rgb),0.08)] border-[rgba(var(--accent-rgb),0.3)] text-[var(--accent)]"
                  : "border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-white"
              }`}
            >
              {p}
            </button>
          );
        })}
        {totalPages > 5 && (
          <span className="text-[var(--text-secondary)] text-xs px-1">...</span>
        )}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-8 h-8 rounded-lg border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>
    </div>
  );
}

/* ─── Empty State ─── */

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-[var(--text-secondary)] mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      {subtitle && (
        <p className="text-sm text-[var(--text-secondary)] mb-4">{subtitle}</p>
      )}
      {action}
    </div>
  );
}

/* ─── Page Layout (combines all sections) ─── */

type PageLayoutProps = {
  children: ReactNode;
};

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="px-8 py-6 max-md:px-4">
      {children}
    </div>
  );
}
