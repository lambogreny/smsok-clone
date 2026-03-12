"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, FileDown, Pencil, Trash2, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

/* ─── Types ─── */

type QuotationStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";

type QuotationItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type QuotationDetail = {
  id: string;
  quotationNumber: string;
  createdAt: string;
  buyerName: string;
  buyerEmail: string | null;
  buyerAddress: string | null;
  subtotal: number;
  vatAmount: number;
  total: number;
  status: QuotationStatus;
  validUntil: string | null;
  notes: string | null;
  items: QuotationItem[];
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

/* ─── Helpers ─── */

function formatThaiDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ─── Main Component ─── */

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [quotation, setQuotation] = useState<QuotationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch quotation detail
  useEffect(() => {
    let cancelled = false;
    async function fetchQuotation() {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(`/api/v1/quotations/${id}`);
        if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
        const data = await res.json();
        if (!cancelled) {
          setQuotation(data.quotation);
        }
      } catch (err) {
        if (!cancelled) {
          setFetchError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchQuotation();
    return () => { cancelled = true; };
  }, [id]);

  const handleDownloadPdf = useCallback(async () => {
    if (!quotation || downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/v1/quotations/${id}/pdf`);
      if (!res.ok) throw new Error("ดาวน์โหลดไม่สำเร็จ");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${quotation.quotationNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("ดาวน์โหลด PDF ไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setDownloading(false);
    }
  }, [quotation, downloading, id]);

  const handleDelete = useCallback(async () => {
    if (!confirm("คุณต้องการลบใบเสนอราคานี้หรือไม่?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/quotations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("ลบไม่สำเร็จ");
      router.push("/dashboard/quotations");
    } catch {
      alert("ลบไม่สำเร็จ กรุณาลองอีกครั้ง");
      setDeleting(false);
    }
  }, [id, router]);

  // Loading state
  if (loading) {
    return (
      <div className="px-8 py-6 max-md:px-4 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (fetchError || !quotation) {
    return (
      <div className="px-8 py-6 max-md:px-4 flex flex-col items-center justify-center min-h-[400px]">
        <FileText className="w-10 h-10 text-[var(--text-muted)] mb-3" />
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">โหลดข้อมูลไม่สำเร็จ</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">{fetchError ?? "ไม่พบใบเสนอราคา"}</p>
        <Link href="/dashboard/quotations">
          <Button variant="outline" className="cursor-pointer">กลับ</Button>
        </Link>
      </div>
    );
  }

  const status = STATUS_CONFIG[quotation.status] || STATUS_CONFIG.DRAFT;

  return (
    <div className="px-8 py-6 max-md:px-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/quotations">
            <button
              type="button"
              className="w-9 h-9 rounded-xl border border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)] font-mono">
              {quotation.quotationNumber}
            </h1>
          </div>
          <span
            className="inline-flex text-[11px] font-medium px-2.5 py-1 rounded-full"
            style={{ background: status.bg, color: status.color }}
          >
            {status.label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/dashboard/quotations/${id}/edit`}>
            <Button variant="outline" className="gap-1.5 cursor-pointer">
              <Pencil className="w-3.5 h-3.5" />
              แก้ไข
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="gap-1.5 cursor-pointer"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5" />
            )}
            PDF
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
            className="gap-1.5 cursor-pointer"
          >
            {deleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            ลบ
          </Button>
        </div>
      </div>

      {/* Quotation Info Card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5 mb-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">ข้อมูลลูกค้า</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="block text-xs text-[var(--text-muted)] mb-0.5">ชื่อลูกค้า</span>
            <span className="text-sm text-[var(--text-primary)]">{quotation.buyerName}</span>
          </div>
          {quotation.buyerEmail && (
            <div>
              <span className="block text-xs text-[var(--text-muted)] mb-0.5">อีเมล</span>
              <span className="text-sm text-[var(--text-primary)]">{quotation.buyerEmail}</span>
            </div>
          )}
          {quotation.buyerAddress && (
            <div className="sm:col-span-2">
              <span className="block text-xs text-[var(--text-muted)] mb-0.5">ที่อยู่</span>
              <span className="text-sm text-[var(--text-primary)] whitespace-pre-line">{quotation.buyerAddress}</span>
            </div>
          )}
          <div>
            <span className="block text-xs text-[var(--text-muted)] mb-0.5">วันที่สร้าง</span>
            <span className="text-sm text-[var(--text-primary)]">{formatThaiDate(quotation.createdAt)}</span>
          </div>
          {quotation.validUntil && (
            <div>
              <span className="block text-xs text-[var(--text-muted)] mb-0.5">ใช้ได้ถึง</span>
              <span className="text-sm text-[var(--text-primary)]">{formatThaiDate(quotation.validUntil)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-[var(--border-default)]">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">รายการ</h2>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-[1fr_80px_100px_100px] gap-x-4 px-5 py-3 bg-[var(--table-header)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          <span>รายการ</span>
          <span className="text-right">จำนวน</span>
          <span className="text-right">ราคาต่อหน่วย</span>
          <span className="text-right">รวม</span>
        </div>

        {/* Table Body */}
        {quotation.items.map((item, i) => (
          <div
            key={item.id}
            className={`grid grid-cols-[1fr_80px_100px_100px] gap-x-4 items-center px-5 py-3.5 border-b border-[var(--table-border)] ${
              i % 2 === 1 ? "bg-[var(--table-alt-row)]" : ""
            }`}
          >
            <span className="text-sm text-[var(--text-primary)]">{item.description}</span>
            <span className="text-sm text-[var(--text-secondary)] text-right tabular-nums">
              {item.quantity}
            </span>
            <span className="text-sm text-[var(--text-secondary)] text-right tabular-nums">
              ฿{item.unitPrice.toFixed(2)}
            </span>
            <span className="text-sm text-[var(--text-primary)] text-right tabular-nums font-medium">
              ฿{item.total.toFixed(2)}
            </span>
          </div>
        ))}

        {/* Summary */}
        <div className="px-5 py-4 space-y-2 border-t border-[var(--border-default)]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-secondary)]">ยอดรวมก่อน VAT</span>
            <span className="text-sm text-[var(--text-primary)] tabular-nums">฿{quotation.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-secondary)]">VAT 7%</span>
            <span className="text-sm text-[var(--text-primary)] tabular-nums">฿{quotation.vatAmount.toFixed(2)}</span>
          </div>
          <div className="h-px bg-[var(--border-default)]" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--text-primary)]">ยอดรวมทั้งหมด</span>
            <span className="text-lg font-bold text-[var(--text-primary)] tabular-nums">฿{quotation.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {quotation.notes && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-2">หมายเหตุ</h2>
          <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">{quotation.notes}</p>
        </div>
      )}
    </div>
  );
}
