"use client";

import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ─── Types ─── */

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumbs?: Breadcrumb[];
  className?: string;
}

/* ─── Component ─── */

export function PageHeader({ title, subtitle, actions, breadcrumbs, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-4", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 mb-2 text-[13px]">
          {breadcrumbs.map((crumb, i) => (
            <Fragment key={`${crumb.label}-${i}`}>
              {i > 0 && <span className="text-[var(--text-muted)]">/</span>}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-[var(--text-secondary)] font-medium">{crumb.label}</span>
              )}
            </Fragment>
          ))}
        </nav>
      )}

      {/* Title row */}
      <div className="flex items-start justify-between gap-4 max-sm:flex-col max-sm:gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-[-0.01em]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[13px] text-[var(--text-muted)] mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0 max-sm:w-full max-sm:justify-end">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
