"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CustomSelect from "@/components/ui/CustomSelect";

import {
  Wallet,
  FileText,
  Clock,
  Download,
  Receipt,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CreditCard,
  Plus,
  Image as ImageIcon,
} from "lucide-react";

import { toast } from "sonner";

/* ── Types ── */
type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "PENDING_REVIEW"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED";

type PackageTier = {
  name: string;
  tierCode: string;
  totalSms: number;
};

type Payment = {
  id: string;
  packageTierId: string;
  amount: number;
  vatAmount: number;
  totalAmount: number;
  method: string;
  status: PaymentStatus;
  slipUrl: string | null;
  invoiceNumber: string | null;
  invoiceUrl: string | null;
  paidAt: string | null;
  createdAt: string;
  packageTier: PackageTier;
};

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/* ── Helpers ── */
function formatBaht(satang: number): string {
  return `฿${(satang / 100).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
}

function formatDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    time: d.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; color: string; bgColor: string }
> = {
  PENDING: {
    label: "รอดำเนินการ",
    color: "var(--text-muted)",
    bgColor: "rgba(var(--text-muted-rgb, 128,128,128), 0.1)",
  },
  PROCESSING: {
    label: "กำลังดำเนินการ",
    color: "var(--info)",
    bgColor: "rgba(var(--info-rgb), 0.1)",
  },
  PENDING_REVIEW: {
    label: "รอตรวจสอบ",
    color: "var(--warning)",
    bgColor: "rgba(var(--warning-rgb), 0.1)",
  },
  COMPLETED: {
    label: "สำเร็จ",
    color: "var(--success)",
    bgColor: "rgba(var(--success-rgb), 0.1)",
  },
  FAILED: {
    label: "ล้มเหลว",
    color: "var(--error)",
    bgColor: "rgba(var(--error-rgb), 0.1)",
  },
  REFUNDED: {
    label: "คืนเงิน",
    color: "var(--text-muted)",
    bgColor: "rgba(var(--text-muted-rgb, 128,128,128), 0.1)",
  },
};

const STATUS_OPTIONS = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "COMPLETED", label: "สำเร็จ" },
  { value: "PENDING_REVIEW", label: "รอตรวจสอบ" },
  { value: "FAILED", label: "ล้มเหลว" },
  { value: "REFUNDED", label: "คืนเงิน" },
];

/* ── Status Badge ── */
function StatusBadge({ status }: { status: PaymentStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ color: config.color, backgroundColor: config.bgColor }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  );
}

/* ── Stat Card ── */
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card className="border-[var(--border-default)] bg-[var(--bg-surface)]">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-[var(--text-muted)]">{label}</p>
          <p className="text-xl font-semibold text-[var(--text-primary)] truncate">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Expanded Row Detail ── */
function PaymentDetail({ payment }: { payment: Payment }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-4 py-4 bg-[var(--bg-base)] rounded-lg">
      {/* Slip */}
      <div>
        <p className="text-xs text-[var(--text-muted)] mb-1.5">สลิปการโอน</p>
        {payment.slipUrl ? (
          <a
            href={payment.slipUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] p-2 hover:border-[var(--accent)] transition-colors"
          >
            <ImageIcon className="h-8 w-8 text-[var(--text-muted)] group-hover:text-[var(--accent)]" />
            <span className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--accent)]">
              ดูสลิป
            </span>
          </a>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">ไม่มีสลิป</span>
        )}
      </div>
      {/* Method */}
      <div>
        <p className="text-xs text-[var(--text-muted)] mb-1.5">วิธีชำระเงิน</p>
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-[var(--text-muted)]" />
          <span className="text-sm text-[var(--text-primary)] capitalize">
            {payment.method || "—"}
          </span>
        </div>
      </div>
      {/* Invoice Number */}
      <div>
        <p className="text-xs text-[var(--text-muted)] mb-1.5">
          เลขที่ใบกำกับภาษี
        </p>
        <span className="text-sm font-mono text-[var(--text-primary)]">
          {payment.invoiceNumber || "—"}
        </span>
      </div>
    </div>
  );
}

/* ── Mobile Payment Card ── */
function MobilePaymentCard({
  payment,
  onInvoice,
}: {
  payment: Payment;
  onInvoice: (id: string) => void;
}) {
  const { date, time } = formatDate(payment.createdAt);

  return (
    <Card className="border-[var(--border-default)] bg-[var(--bg-surface)]">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
              {payment.packageTier.name}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {payment.packageTier.totalSms.toLocaleString()} SMS
            </p>
          </div>
          <StatusBadge status={payment.status} />
        </div>

        <Separator className="bg-[var(--border-default)]" />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-[var(--text-primary)]">
              {formatBaht(payment.totalAmount)}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {date} {time}
            </p>
          </div>
          {payment.status === "COMPLETED" && (
            <Button
              variant="outline"
              size="sm"
              className="border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)]"
              onClick={() => onInvoice(payment.id)}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              ใบกำกับภาษี
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Loading Skeleton ── */
function BillingSkeletonInline() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card
            key={i}
            className="border-[var(--border-default)] bg-[var(--bg-surface)]"
          >
            <CardContent className="flex items-center gap-4 p-5">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-28" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Filter bar */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-36" />
      </div>
      {/* Table rows */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/* ── Empty State ── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-lg mb-4"
        style={{
          backgroundColor: "rgba(var(--accent-rgb), 0.1)",
        }}
      >
        <Receipt className="h-8 w-8 text-[var(--accent)]" />
      </div>
      <h3 className="text-lg font-medium text-[var(--text-primary)] mb-1">
        ยังไม่มีรายการชำระเงิน
      </h3>
      <p className="text-sm text-[var(--text-muted)] mb-6 max-w-sm">
        เมื่อคุณซื้อแพ็กเกจ SMS รายการชำระเงินจะแสดงที่นี่
      </p>
      <Link
        href="/dashboard/packages"
        className="inline-flex items-center justify-center rounded-lg px-4 h-10 text-sm font-medium bg-[var(--accent)] text-[var(--bg-base)] hover:bg-[var(--accent)]/90 transition-all"
      >
        ดูแพ็กเกจ
        <ArrowRight className="h-4 w-4 ml-1.5" />
      </Link>
    </div>
  );
}

/* ── Main Page ── */
export default function BillingPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* Filters */
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  /* Fetch payments */
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/payments?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch payments");
      const data = await res.json();

      setPayments(data.payments ?? []);
      setPagination(
        data.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 }
      );
    } catch {
      toast.error("ไม่สามารถโหลดรายการชำระเงินได้");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  /* Reset page when filters change */
  useEffect(() => {
    setPage(1);
  }, [statusFilter, dateFrom, dateTo]);

  /* Stats derived from current page — TODO: use dedicated /api/payments/stats endpoint for accurate totals */
  const stats = useMemo(() => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const thisYearPayments = payments.filter(
      (p) => new Date(p.createdAt) >= yearStart
    );

    const completed = thisYearPayments.filter(
      (p) => p.status === "COMPLETED"
    );
    const totalPaid = completed.reduce((sum, p) => sum + p.totalAmount, 0);
    const pendingCount = payments.filter(
      (p) =>
        p.status === "PENDING" ||
        p.status === "PROCESSING" ||
        p.status === "PENDING_REVIEW"
    ).length;

    return { totalPaid, invoiceCount: completed.length, pendingCount };
  }, [payments]);

  /* Invoice download */
  const handleInvoice = useCallback(async (paymentId: string) => {
    try {
      const res = await fetch(`/api/payments/${paymentId}/invoice`);
      if (!res.ok) throw new Error("Failed to fetch invoice");
      const data = await res.json();
      toast.success(`ใบกำกับภาษี: ${data.invoiceNumber ?? "—"}`);
    } catch {
      toast.error("ไม่สามารถดาวน์โหลดใบกำกับภาษีได้");
    }
  }, []);

  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            ประวัติการชำระเงิน
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            รายการชำระเงินและใบกำกับภาษี
          </p>
        </div>
        <Link
          href="/dashboard/packages"
          className="inline-flex items-center justify-center rounded-lg px-4 h-10 text-sm font-medium bg-[var(--accent)] text-[var(--bg-base)] hover:bg-[var(--accent)]/90 transition-all w-fit"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          เติมเครดิต
        </Link>
      </div>

      {loading ? (
        <BillingSkeletonInline />
      ) : payments.length === 0 &&
        statusFilter === "ALL" &&
        !dateFrom &&
        !dateTo ? (
        <EmptyState />
      ) : (
        <>
          {/* ── Stats Row ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              icon={Wallet}
              label="ยอดชำระปีนี้"
              value={formatBaht(stats.totalPaid)}
              color="var(--accent)"
            />
            <StatCard
              icon={FileText}
              label="ใบกำกับภาษี"
              value={`${stats.invoiceCount} รายการ`}
              color="var(--info)"
            />
            <StatCard
              icon={Clock}
              label="รอดำเนินการ"
              value={`${stats.pendingCount} รายการ`}
              color="var(--warning)"
            />
          </div>

          {/* ── Filter Bar ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-48">
              <CustomSelect
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
                options={STATUS_OPTIONS}
                placeholder="สถานะ"
              />
            </div>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full sm:w-44 bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)]"
              aria-label="ตั้งแต่วันที่"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full sm:w-44 bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)]"
              aria-label="ถึงวันที่"
            />
          </div>

          {/* ── Desktop Table ── */}
          <div className="hidden sm:block rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[var(--border-default)] hover:bg-transparent">
                  <TableHead className="text-[var(--text-muted)] font-medium text-xs">
                    วันที่
                  </TableHead>
                  <TableHead className="text-[var(--text-muted)] font-medium text-xs">
                    แพ็กเกจ
                  </TableHead>
                  <TableHead className="text-[var(--text-muted)] font-medium text-xs text-right">
                    ยอดชำระ
                  </TableHead>
                  <TableHead className="text-[var(--text-muted)] font-medium text-xs">
                    สถานะ
                  </TableHead>
                  <TableHead className="text-[var(--text-muted)] font-medium text-xs text-right">
                    ใบกำกับภาษี
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-12 text-[var(--text-muted)]"
                    >
                      ไม่พบรายการที่ตรงกับตัวกรอง
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => {
                    const { date, time } = formatDate(payment.createdAt);
                    const isExpanded = expandedId === payment.id;

                    return (
                      <TableRow
                        key={payment.id}
                        className={cn(
                          "border-b border-[var(--border-default)] cursor-pointer transition-colors",
                          isExpanded
                            ? "bg-[var(--bg-elevated)]"
                            : "hover:bg-[var(--bg-elevated)]/50"
                        )}
                      >
                        <TableCell
                          colSpan={5}
                          className="p-0"
                        >
                          {/* Clickable row content */}
                          <button
                            type="button"
                            className="w-full text-left"
                            onClick={() =>
                              setExpandedId(isExpanded ? null : payment.id)
                            }
                            aria-expanded={isExpanded}
                          >
                            <div className="grid grid-cols-[1fr_1.2fr_1fr_1fr_0.8fr] items-center px-4 py-3">
                              {/* Date */}
                              <div>
                                <p className="text-sm text-[var(--text-primary)]">
                                  {date}
                                </p>
                                <p className="text-xs text-[var(--text-muted)]">
                                  {time}
                                </p>
                              </div>
                              {/* Package */}
                              <div>
                                <p className="text-sm text-[var(--text-primary)] font-medium">
                                  {payment.packageTier.name}
                                </p>
                                <p className="text-xs text-[var(--text-muted)]">
                                  {payment.packageTier.totalSms.toLocaleString()}{" "}
                                  SMS
                                </p>
                              </div>
                              {/* Amount */}
                              <p className="text-sm text-[var(--text-primary)] font-medium text-right">
                                {formatBaht(payment.totalAmount)}
                              </p>
                              {/* Status */}
                              <div>
                                <StatusBadge status={payment.status} />
                              </div>
                              {/* Invoice */}
                              <div className="flex items-center justify-end gap-2">
                                {payment.status === "COMPLETED" && (
                                  <span
                                    className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                                    role="button"
                                    tabIndex={-1}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleInvoice(payment.id);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.stopPropagation();
                                        handleInvoice(payment.id);
                                      }
                                    }}
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                    ดาวน์โหลด
                                  </span>
                                )}
                                <ChevronDown
                                  className={cn(
                                    "h-4 w-4 text-[var(--text-muted)] transition-transform",
                                    isExpanded && "rotate-180"
                                  )}
                                />
                              </div>
                            </div>
                          </button>
                          {/* Expanded detail */}
                          {isExpanded && (
                            <div className="px-4 pb-4">
                              <PaymentDetail payment={payment} />
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Mobile Card Layout ── */}
          <div className="sm:hidden space-y-3">
            {payments.length === 0 ? (
              <p className="text-center py-12 text-sm text-[var(--text-muted)]">
                ไม่พบรายการที่ตรงกับตัวกรอง
              </p>
            ) : (
              payments.map((payment) => (
                <MobilePaymentCard
                  key={payment.id}
                  payment={payment}
                  onInvoice={handleInvoice}
                />
              ))
            )}
          </div>

          {/* ── Pagination ── */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-[var(--text-muted)]">
                แสดง{" "}
                {Math.min(
                  (pagination.page - 1) * pagination.limit + 1,
                  pagination.total
                )}
                -
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )}{" "}
                จาก {pagination.total} รายการ
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-[var(--border-default)]"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="หน้าก่อนหน้า"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    if (pagination.totalPages <= 7) return true;
                    if (p === 1 || p === pagination.totalPages) return true;
                    if (Math.abs(p - page) <= 1) return true;
                    return false;
                  })
                  .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                    if (idx > 0) {
                      const prev = arr[idx - 1];
                      if (p - prev > 1) acc.push("ellipsis");
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "ellipsis" ? (
                      <span
                        key={`e-${idx}`}
                        className="px-1 text-xs text-[var(--text-muted)]"
                      >
                        ...
                      </span>
                    ) : (
                      <Button
                        key={item}
                        variant={page === item ? "default" : "outline"}
                        size="icon"
                        className={cn(
                          "h-8 w-8 text-xs",
                          page === item
                            ? "bg-[var(--accent)] text-[var(--bg-base)] hover:bg-[var(--accent)]/90"
                            : "border-[var(--border-default)] text-[var(--text-secondary)]"
                        )}
                        onClick={() => setPage(item as number)}
                      >
                        {item}
                      </Button>
                    )
                  )}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-[var(--border-default)]"
                  disabled={page >= pagination.totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  aria-label="หน้าถัดไป"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
