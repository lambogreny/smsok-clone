"use client";

import { useState, useEffect, useCallback } from "react";
import { FileDown, Search, FileText, Loader2, Plus, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CustomSelect from "@/components/ui/CustomSelect";
import PageLayout, {
  PageHeader,
  FilterBar,
  TableWrapper,
  PaginationBar,
  EmptyState,
} from "@/components/blocks/PageLayout";
import Link from "next/link";
import { formatThaiDateShort } from "@/lib/format-thai-date";

/* ─── Types (matching backend API) ─── */

type QuotationStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";

type Quotation = {
  id: string;
  quotationNumber: string;
  createdAt: string;
  buyerName: string;
  subtotal: number;
  vatAmount: number;
  total: number;
  status: QuotationStatus;
  validUntil: string;
};

/* ─── Config ─── */

const STATUS_CONFIG: Record<
  QuotationStatus,
  { label: string; color: string; bg: string }
> = {
  DRAFT: {
    label: "○ ร่าง",
    color: "var(--text-muted)",
    bg: "rgba(var(--text-muted-rgb),0.08)",
  },
  SENT: {
    label: "● ส่งแล้ว",
    color: "var(--info)",
    bg: "var(--info-bg)",
  },
  ACCEPTED: {
    label: "✓ ยอมรับ",
    color: "var(--success)",
    bg: "var(--success-bg)",
  },
  REJECTED: {
    label: "✕ ปฏิเสธ",
    color: "var(--error)",
    bg: "var(--danger-bg)",
  },
  EXPIRED: {
    label: "⏰ หมดอายุ",
    color: "var(--warning)",
    bg: "var(--warning-bg)",
  },
};

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "ทุกสถานะ" },
  { value: "DRAFT", label: "ร่าง" },
  { value: "SENT", label: "ส่งแล้ว" },
  { value: "ACCEPTED", label: "ยอมรับ" },
  { value: "REJECTED", label: "ปฏิเสธ" },
  { value: "EXPIRED", label: "หมดอายุ" },
];

const MONTH_FILTER_OPTIONS = [
  { value: "", label: "ทุกเดือน" },
  { value: "2026-03", label: "มี.ค. 2026" },
  { value: "2026-02", label: "ก.พ. 2026" },
  { value: "2026-01", label: "ม.ค. 2026" },
];

const PAGE_SIZE = 10;

/* ─── Main Component ─── */

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [page, setPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Fetch quotations from API
  useEffect(() => {
    let cancelled = false;
    async function fetchQuotations() {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await fetch("/api/v1/quotations");
        if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
        const data = await res.json();
        if (!cancelled) {
          setQuotations(data.quotations ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setFetchError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchQuotations();
    return () => { cancelled = true; };
  }, []);

  const handleDownloadPdf = useCallback(async (quotationId: string, quotationNumber: string) => {
    if (downloadingId) return;
    setDownloadingId(quotationId);
    try {
      const res = await fetch(`/api/v1/quotations/${quotationId}/pdf`);
      if (!res.ok) throw new Error("ดาวน์โหลดไม่สำเร็จ");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${quotationNumber}.pdf`;
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

  const filtered = quotations.filter((q) => {
    if (
      searchQuery &&
      !q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !q.buyerName.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    if (statusFilter && q.status !== statusFilter) return false;
    if (monthFilter && !q.createdAt.startsWith(monthFilter)) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <PageLayout>
      <PageHeader
        title="ใบเสนอราคา"
        count={filtered.length}
        actions={
          <Link href="/dashboard/quotations/new">
            <Button className="gap-1.5 cursor-pointer">
              <Plus className="w-4 h-4" />
              สร้างใบเสนอราคา
            </Button>
          </Link>
        }
      />

      <FilterBar>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <Input
            placeholder="ค้นหาเลขที่หรือชื่อลูกค้า..."
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
        <div className="grid grid-cols-[120px_140px_80px_90px_70px_90px_80px_100px_60px] gap-x-4 px-5 py-3 bg-[var(--table-header)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          <span>เลขที่</span>
          <span>ลูกค้า</span>
          <span>วันที่</span>
          <span className="text-right">จำนวน</span>
          <span className="text-right">VAT</span>
          <span className="text-right">รวม</span>
          <span>ใช้ได้ถึง</span>
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
        {!loading && !fetchError && paged.length === 0 && (
          <EmptyState
            icon={<FileText className="w-10 h-10" />}
            title={searchQuery || statusFilter ? "ไม่พบใบเสนอราคาที่ตรงกับตัวกรอง" : "ยังไม่มีใบเสนอราคา"}
            subtitle={searchQuery || statusFilter ? "ลองเปลี่ยนตัวกรองหรือค้นหาด้วยคำอื่น" : "สร้างใบเสนอราคาใหม่เพื่อเริ่มต้น"}
          />
        )}

        {/* Table Body */}
        {!loading && !fetchError &&
          paged.map((q, i) => {
            const status = STATUS_CONFIG[q.status] || STATUS_CONFIG.DRAFT;
            return (
              <Link
                key={q.id}
                href={`/dashboard/quotations/${q.id}`}
                className={`grid grid-cols-[120px_140px_80px_90px_70px_90px_80px_100px_60px] gap-x-4 items-center px-5 py-3.5 border-b border-[var(--table-border)] hover:bg-[rgba(255,255,255,0.015)] transition-colors ${
                  i % 2 === 1 ? "bg-[var(--table-alt-row)]" : ""
                }`}
              >
                {/* Quotation Number */}
                <span className="text-sm text-[var(--text-primary)] font-mono">
                  {q.quotationNumber}
                </span>

                {/* Customer Name */}
                <span className="text-sm text-[var(--text-secondary)] truncate">
                  {q.buyerName}
                </span>

                {/* Date */}
                <span className="text-xs text-[var(--text-secondary)]">
                  {formatThaiDateShort(q.createdAt)}
                </span>

                {/* Subtotal */}
                <span className="text-sm text-[var(--text-primary)] text-right tabular-nums">
                  ฿{q.subtotal.toFixed(2)}
                </span>

                {/* VAT */}
                <span className="text-sm text-[var(--text-secondary)] text-right tabular-nums">
                  ฿{q.vatAmount.toFixed(2)}
                </span>

                {/* Total */}
                <span className="text-sm text-[var(--text-primary)] text-right tabular-nums font-semibold">
                  ฿{q.total.toFixed(2)}
                </span>

                {/* Valid Until */}
                <span className="text-xs text-[var(--text-secondary)]">
                  {formatThaiDateShort(q.validUntil)}
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDownloadPdf(q.id, q.quotationNumber);
                  }}
                  disabled={downloadingId === q.id}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] disabled:opacity-50 transition-colors cursor-pointer"
                  title="ดาวน์โหลด PDF"
                >
                  {downloadingId === q.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4" />
                  )}
                </button>
              </Link>
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
