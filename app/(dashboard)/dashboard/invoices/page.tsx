"use client";

import { useState, useEffect, useCallback } from "react";
import { FileDown, Search, FileText, Loader2, Receipt } from "lucide-react";
import EmptyStateShared from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import CustomSelect from "@/components/ui/CustomSelect";
import PageLayout, {
  PageHeader,
  FilterBar,
  TableWrapper,
  PaginationBar,
  EmptyState,
} from "@/components/blocks/PageLayout";

/* ─── Types (matching backend API) ─── */

type InvoiceStatus = "PAID" | "DRAFT" | "SENT" | "OVERDUE" | "VOIDED";

type Invoice = {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  subtotal: number;
  vatAmount: number;
  total: number;
  status: InvoiceStatus;
};

/* ─── Config ─── */

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; color: string; bg: string }
> = {
  PAID: {
    label: "✓ ชำระแล้ว",
    color: "var(--success)",
    bg: "rgba(var(--success-rgb),0.08)",
  },
  DRAFT: {
    label: "○ ร่าง",
    color: "var(--text-muted)",
    bg: "rgba(var(--text-muted-rgb),0.08)",
  },
  SENT: {
    label: "● ส่งแล้ว",
    color: "var(--info)",
    bg: "rgba(var(--info-rgb),0.08)",
  },
  OVERDUE: {
    label: "! เกินกำหนด",
    color: "var(--error)",
    bg: "rgba(var(--error-rgb),0.08)",
  },
  VOIDED: {
    label: "✕ ยกเลิก",
    color: "var(--text-secondary)",
    bg: "rgba(var(--text-muted-rgb),0.08)",
  },
};

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "ทุกสถานะ" },
  { value: "PAID", label: "ชำระแล้ว" },
  { value: "DRAFT", label: "ร่าง" },
  { value: "SENT", label: "ส่งแล้ว" },
  { value: "OVERDUE", label: "เกินกำหนด" },
  { value: "VOIDED", label: "ยกเลิก" },
];

const MONTH_FILTER_OPTIONS = [
  { value: "", label: "ทุกเดือน" },
  { value: "2026-03", label: "มี.ค. 2026" },
  { value: "2026-02", label: "ก.พ. 2026" },
  { value: "2026-01", label: "ม.ค. 2026" },
];

/* ─── Helpers ─── */

function formatThaiDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

const PAGE_SIZE = 10;

/* ─── Main Component ─── */

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [page, setPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Fetch invoices from API
  useEffect(() => {
    let cancelled = false;
    async function fetchInvoices() {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await fetch("/api/v1/invoices");
        if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
        const data = await res.json();
        if (!cancelled) {
          setInvoices(data.invoices ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setFetchError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchInvoices();
    return () => { cancelled = true; };
  }, []);

  const handleDownloadPdf = useCallback(async (invoiceId: string, invoiceNumber: string) => {
    if (downloadingId) return;
    setDownloadingId(invoiceId);
    try {
      const res = await fetch(`/api/v1/invoices/${invoiceId}/pdf`);
      if (!res.ok) throw new Error("ดาวน์โหลดไม่สำเร็จ");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("ดาวน์โหลด PDF ไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setDownloadingId(null);
    }
  }, [downloadingId]);

  const filtered = invoices.filter((inv) => {
    if (
      searchQuery &&
      !inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    if (statusFilter && inv.status !== statusFilter) return false;
    if (monthFilter && !inv.createdAt.startsWith(monthFilter)) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <PageLayout>
      <PageHeader title="ใบแจ้งหนี้" count={filtered.length} />

      <FilterBar>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <Input
            placeholder="ค้นหาเลขที่..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)]"
          />
        </div>
        <CustomSelect
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          options={STATUS_FILTER_OPTIONS}
          placeholder="สถานะ"
        />
        <CustomSelect
          value={monthFilter}
          onChange={(v) => {
            setMonthFilter(v);
            setPage(1);
          }}
          options={MONTH_FILTER_OPTIONS}
          placeholder="เดือน"
        />
      </FilterBar>

      <TableWrapper>
        {/* Table Header */}
        <div className="grid grid-cols-[140px_100px_100px_80px_100px_100px_60px] gap-x-4 px-5 py-3 bg-[var(--table-header)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          <span>เลขที่</span>
          <span>วันที่</span>
          <span className="text-right">จำนวน</span>
          <span className="text-right">VAT</span>
          <span className="text-right">รวม</span>
          <span>สถานะ</span>
          <span />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-12 text-[var(--text-muted)]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">กำลังโหลด...</span>
          </div>
        )}

        {/* Error State */}
        {!loading && fetchError && (
          <EmptyState
            icon={<FileText className="w-10 h-10" />}
            title="โหลดข้อมูลไม่สำเร็จ"
            subtitle={fetchError}
          />
        )}

        {/* Empty State */}
        {!loading && !fetchError && paged.length === 0 && invoices.length === 0 && (
          <EmptyStateShared
            icon={Receipt}
            iconColor="var(--success)"
            iconBg="rgba(var(--success-rgb,16,185,129),0.06)"
            iconBorder="rgba(var(--success-rgb,16,185,129),0.1)"
            title="ยังไม่มีใบกำกับภาษี"
            description={"ใบกำกับภาษีจะสร้างอัตโนมัติเมื่อซื้อ Package\nสามารถดาวน์โหลด PDF ได้ที่นี่"}
            ctaLabel="🛒 ซื้อ Package แรก"
            ctaAction={() => window.location.href = "/dashboard/packages"}
          />
        )}
        {!loading && !fetchError && paged.length === 0 && invoices.length > 0 && (
          <EmptyState
            icon={<FileText className="w-10 h-10" />}
            title="ไม่พบใบแจ้งหนี้"
            subtitle="ลองเปลี่ยนตัวกรองหรือค้นหาด้วยคำอื่น"
          />
        )}

        {/* Table Body */}
        {!loading && !fetchError &&
          paged.map((inv, i) => {
            const status = STATUS_CONFIG[inv.status] || STATUS_CONFIG.DRAFT;
            return (
              <div
                key={inv.id}
                className={`grid grid-cols-[140px_100px_100px_80px_100px_100px_60px] gap-x-4 items-center px-5 py-3.5 border-b border-[var(--table-border)] hover:bg-[rgba(255,255,255,0.015)] transition-colors ${
                  i % 2 === 1 ? "bg-[var(--table-alt-row)]" : ""
                }`}
              >
                {/* Invoice Number */}
                <span className="text-sm text-[var(--text-primary)] font-mono">
                  {inv.invoiceNumber}
                </span>

                {/* Date */}
                <span className="text-xs text-[var(--text-secondary)]">
                  {formatThaiDate(inv.createdAt)}
                </span>

                {/* Subtotal */}
                <span className="text-sm text-[var(--text-primary)] text-right tabular-nums">
                  ฿{inv.subtotal.toFixed(2)}
                </span>

                {/* VAT */}
                <span className="text-sm text-[var(--text-secondary)] text-right tabular-nums">
                  ฿{inv.vatAmount.toFixed(2)}
                </span>

                {/* Total */}
                <span className="text-sm text-[var(--text-primary)] text-right tabular-nums font-semibold">
                  ฿{inv.total.toFixed(2)}
                </span>

                {/* Status Badge */}
                <span
                  className="inline-flex text-[11px] font-medium px-2.5 py-1 rounded-full w-fit"
                  style={{ background: status.bg, color: status.color }}
                >
                  {status.label}
                </span>

                {/* PDF Download */}
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                  disabled={downloadingId === inv.id}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] disabled:opacity-50 transition-colors cursor-pointer"
                  title="ดาวน์โหลด PDF"
                >
                  {downloadingId === inv.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            );
          })}

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <PaginationBar
            from={(page - 1) * PAGE_SIZE + 1}
            to={Math.min(page * PAGE_SIZE, filtered.length)}
            total={filtered.length}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </TableWrapper>
    </PageLayout>
  );
}
