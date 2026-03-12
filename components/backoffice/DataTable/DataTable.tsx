"use client";

import { type ReactNode, useCallback } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableSearch } from "./DataTableSearch";
import { DataTableSkeleton } from "./DataTableSkeleton";

/* ─── Types ─── */

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  className?: string;
  hideOnMobile?: boolean;
}

export interface SortState {
  column: string;
  direction: "asc" | "desc";
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  bulkActions?: ReactNode;
  selectedRows?: string[];
  onSelectRows?: (ids: string[]) => void;
  rowId?: (row: T) => string;
  onRowClick?: (row: T) => void;
  expandedRow?: string | null;
  renderExpanded?: (row: T) => ReactNode;
  loading?: boolean;
  emptyState?: ReactNode;
  className?: string;
}

/* ─── Component ─── */

export function DataTable<T>({
  columns,
  data,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sort,
  onSortChange,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters,
  bulkActions,
  selectedRows,
  onSelectRows,
  rowId,
  onRowClick,
  expandedRow,
  renderExpanded,
  loading,
  emptyState,
  className,
}: DataTableProps<T>) {
  const selectable = !!onSelectRows && !!rowId;
  const allIds = selectable ? data.map((r) => rowId!(r)) : [];
  const allSelected = selectable && selectedRows!.length > 0 && selectedRows!.length === allIds.length;
  const someSelected = selectable && selectedRows!.length > 0 && !allSelected;

  const getRowId = useCallback((row: T) => rowId?.(row) ?? "", [rowId]);

  const handleSelectAll = useCallback(() => {
    if (!onSelectRows) return;
    if (allSelected) {
      onSelectRows([]);
    } else {
      onSelectRows(allIds);
    }
  }, [allSelected, allIds, onSelectRows]);

  const handleSelectRow = useCallback(
    (id: string) => {
      if (!onSelectRows || !selectedRows) return;
      if (selectedRows.includes(id)) {
        onSelectRows(selectedRows.filter((r) => r !== id));
      } else {
        onSelectRows([...selectedRows, id]);
      }
    },
    [onSelectRows, selectedRows],
  );

  const handleSort = useCallback(
    (columnId: string) => {
      if (!onSortChange) return;
      if (sort?.column === columnId) {
        onSortChange({
          column: columnId,
          direction: sort.direction === "asc" ? "desc" : "asc",
        });
      } else {
        onSortChange({ column: columnId, direction: "asc" });
      }
    },
    [onSortChange, sort],
  );

  const visibleColumns = columns;

  return (
    <div className={cn("rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] overflow-hidden", className)}>
      {/* Toolbar: Search + Filters */}
      {(onSearchChange || filters) && (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-default)] flex-wrap">
          {onSearchChange && (
            <DataTableSearch
              value={searchValue ?? ""}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
              className="w-64 max-sm:w-full"
            />
          )}
          {filters}
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectable && selectedRows && selectedRows.length > 0 && bulkActions && (
        <div className="mx-4 my-2 px-4 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-between animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-medium text-[var(--text-primary)]">
              {selectedRows.length} รายการ selected
            </span>
            <button
              type="button"
              onClick={() => onSelectRows?.([])}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
            >
              เคลียร์
            </button>
          </div>
          <div className="flex items-center gap-2">{bulkActions}</div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <DataTableSkeleton columns={visibleColumns.length + (selectable ? 1 : 0)} />
        ) : data.length === 0 ? (
          <div className="px-6 py-12 text-center">
            {emptyState ?? (
              <p className="text-sm text-[var(--text-muted)]">ไม่มีข้อมูล</p>
            )}
          </div>
        ) : (
          <table className="w-full">
            {/* Header */}
            <thead>
              <tr className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)]">
                {selectable && (
                  <th className="w-10 px-3 py-3">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </th>
                )}
                {visibleColumns.map((col) => (
                  <th
                    key={col.id}
                    className={cn(
                      "px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-[0.05em] whitespace-nowrap select-none",
                      col.sortable && "cursor-pointer hover:text-[var(--text-secondary)]",
                      col.hideOnMobile && "max-md:hidden",
                      col.className,
                    )}
                    style={{ width: col.width }}
                    onClick={col.sortable ? () => handleSort(col.id) : undefined}
                    aria-sort={
                      sort?.column === col.id
                        ? sort.direction === "asc" ? "ascending" : "descending"
                        : undefined
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {col.sortable && (
                        sort?.column === col.id ? (
                          sort.direction === "asc" ? (
                            <ArrowUp size={12} className="text-[var(--accent)]" />
                          ) : (
                            <ArrowDown size={12} className="text-[var(--accent)]" />
                          )
                        ) : (
                          <ArrowUpDown size={12} className="opacity-30" />
                        )
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {data.map((row, i) => {
                const id = getRowId(row);
                const isSelected = selectable && selectedRows?.includes(id);
                const isExpanded = expandedRow != null && expandedRow === id;

                return (
                  <TableRow
                    key={id || i}
                    row={row}
                    columns={visibleColumns}
                    selectable={selectable}
                    isSelected={isSelected ?? false}
                    isExpanded={isExpanded}
                    onSelect={() => handleSelectRow(id)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    renderExpanded={renderExpanded}
                  />
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}

/* ─── Table Row (extracted) ─── */

function TableRow<T>({
  row,
  columns,
  selectable,
  isSelected,
  isExpanded,
  onSelect,
  onClick,
  renderExpanded,
}: {
  row: T;
  columns: ColumnDef<T>[];
  selectable: boolean;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onClick?: () => void;
  renderExpanded?: (row: T) => ReactNode;
}) {
  const totalCols = columns.length + (selectable ? 1 : 0);

  return (
    <>
      <tr
        className={cn(
          "border-b border-[rgba(26,35,50,0.5)] transition-colors duration-100",
          onClick && "cursor-pointer",
          isSelected && "bg-[rgba(var(--accent-rgb),0.02)] border-l-2 border-l-[var(--accent)]",
          isExpanded && "bg-[rgba(var(--accent-rgb),0.02)]",
          !isSelected && !isExpanded && "hover:bg-[rgba(255,255,255,0.02)]",
        )}
        onClick={onClick}
      >
        {selectable && (
          <td className="w-10 px-3 py-3" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              aria-label="Select row"
            />
          </td>
        )}
        {columns.map((col) => (
          <td
            key={col.id}
            className={cn(
              "px-4 py-3 text-[13px] text-[var(--text-secondary)] align-middle",
              col.hideOnMobile && "max-md:hidden",
              col.className,
            )}
          >
            {col.cell
              ? col.cell(row)
              : col.accessorKey != null
                ? String(row[col.accessorKey] ?? "")
                : null}
          </td>
        ))}
      </tr>

      {/* Expanded row */}
      {isExpanded && renderExpanded && (
        <tr className="bg-[var(--bg-elevated)] border-t border-[var(--border-default)] animate-in slide-in-from-top-1 duration-200">
          <td colSpan={totalCols} className="p-6">
            {renderExpanded(row)}
          </td>
        </tr>
      )}
    </>
  );
}
