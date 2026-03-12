"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomSelect from "@/components/ui/CustomSelect";
import { cn } from "@/lib/utils";

interface DataTablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZE_OPTIONS = [20, 50, 100];

export function DataTablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Compute visible page numbers (max 5)
  const pages: (number | "...")[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-default)] max-sm:flex-col max-sm:gap-3">
      {/* Left: info */}
      <span className="text-[13px] text-[var(--text-muted)]">
        แสดง {from}-{to} จาก {total.toLocaleString()} รายการ
      </span>

      {/* Right: controls */}
      <div className="flex items-center gap-2">
        {/* Per page */}
        <div className="flex items-center gap-1.5">
          <CustomSelect
            value={String(pageSize)}
            onChange={(v) => onPageSizeChange(Number(v))}
            options={PAGE_SIZE_OPTIONS.map((s) => ({ value: String(s), label: String(s) }))}
            placeholder="20"
          />
          <span className="text-xs text-[var(--text-muted)]">/ page</span>
        </div>

        {/* Prev */}
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft size={14} />
        </Button>

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="text-xs text-[var(--text-muted)] px-1">...</span>
          ) : (
            <Button
              key={p}
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(p)}
              className={cn(
                "min-w-[32px] text-[13px]",
                p === page
                  ? "bg-[rgba(var(--accent-rgb),0.08)] text-[var(--accent)] font-semibold"
                  : "text-[var(--text-muted)]",
              )}
            >
              {p}
            </Button>
          ),
        )}

        {/* Next */}
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}
