"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package,
  Clock,
  CheckCircle2,
  Search,
  Eye,
  FileText,
  Banknote,
  ClipboardCheck,
  X,
  ZoomIn,
  ZoomOut,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CustomSelect from "@/components/ui/CustomSelect";
import PillTabs from "@/components/ui/PillTabs";
import { toast } from "sonner";
import {
  type Order,
  type OrderStatus,
} from "@/types/order";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { formatBaht } from "@/types/purchase";
import PageLayout, { PageHeader } from "@/components/blocks/PageLayout";

// ── Types ──

interface AdminOrderStats {
  total: number;
  pending: number;
  pending_review: number;
  completed: number;
  revenue: number;
}

// ── Stat Card ──

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
          style={{
            backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
          }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-[var(--text-muted)]">{label}</p>
          <p className="text-xl font-semibold text-[var(--text-primary)] truncate">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Format Date ──

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

// ── Admin Review Dialog ──

function AdminReviewDialog({
  order,
  open,
  onClose,
  onApprove,
  onReject,
}: {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (!order) return null;

  const currentOrder = order;

  async function handleApprove() {
    setProcessing(true);
    try {
      await onApprove(currentOrder.id);
      onClose();
    } finally {
      setProcessing(false);
    }
  }

  function handleRejectClick() {
    if (!rejectReason.trim()) {
      toast.error("กรุณาใส่เหตุผลการปฏิเสธ");
      return;
    }
    setShowRejectConfirm(true);
  }

  async function handleRejectConfirm() {
    setProcessing(true);
    try {
      await onReject(currentOrder.id, rejectReason.trim());
      setShowRejectConfirm(false);
      setRejectReason("");
      onClose();
    } finally {
      setProcessing(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-[720px] bg-[var(--bg-surface)] border-[var(--border-default)] p-0 gap-0">
          <DialogHeader className="p-6 pb-4 border-b border-[var(--border-default)]">
            <DialogTitle className="text-base font-semibold text-[var(--text-primary)]">
              ตรวจสอบคำสั่งซื้อ #{order.order_number}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Left: Slip Image */}
            <div className="p-6 border-b md:border-b-0 md:border-r border-[var(--border-default)]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  สลิปโอนเงิน
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    aria-label="ซูมออก"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    aria-label="ซูมเข้า"
                  >
                    <ZoomIn size={14} />
                  </button>
                </div>
              </div>
              <div className="rounded-lg overflow-hidden bg-[var(--bg-base)] border border-[var(--border-default)] aspect-[3/4] flex items-center justify-center">
                {order.slip_url ? (
                  <img
                    src={order.slip_url}
                    alt={`สลิปโอนเงิน Order #${order.order_number}`}
                    className="max-w-full max-h-full object-contain transition-transform"
                    style={{ transform: `scale(${zoom})` }}
                  />
                ) : (
                  <p className="text-xs text-[var(--text-muted)]">
                    ไม่มีสลิป
                  </p>
                )}
              </div>

              {/* 50 ทวิ preview */}
              {order.wht_cert_url && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    ใบ 50 ทวิ
                  </p>
                  <div className="rounded-lg overflow-hidden bg-[var(--bg-base)] border border-[var(--border-default)] aspect-video flex items-center justify-center">
                    <img
                      src={order.wht_cert_url}
                      alt="ใบ 50 ทวิ"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right: Order Info */}
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-[var(--text-muted)]">คำสั่งซื้อ</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)] font-mono">
                    #{order.order_number}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)]">ลูกค้า</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {order.tax_name}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] font-mono">
                    Tax ID: {order.tax_id}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)]">แพ็กเกจ</p>
                  <p className="text-sm text-[var(--text-primary)]">
                    {order.package_name} — {order.sms_count.toLocaleString()} SMS
                  </p>
                </div>

                <div
                  className="pt-3 space-y-2"
                  style={{
                    borderTop: "1px dashed var(--border-default)",
                  }}
                >
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[var(--text-muted)]">
                      ยอดที่ควรได้รับ
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-[var(--accent)]">
                      ฿{formatBaht(order.pay_amount)}
                    </span>
                  </div>
                  {order.has_wht && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[var(--text-muted)]">WHT 3%</span>
                      <span className="font-mono tabular-nums text-[var(--error)]">
                        -฿{formatBaht(order.wht_amount)}
                      </span>
                    </div>
                  )}
                </div>

                {order.easyslip_verified !== undefined && (
                  <div
                    className="rounded-lg p-3"
                    style={{
                      background: order.easyslip_verified
                        ? "rgba(16,185,129,0.08)"
                        : "rgba(239,68,68,0.08)",
                      border: `1px solid ${order.easyslip_verified ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}`,
                    }}
                  >
                    <p className="text-xs font-medium mb-1" style={{ color: order.easyslip_verified ? "var(--success)" : "var(--error)" }}>
                      EasySlip: {order.easyslip_verified ? "ยอดตรง" : "ยอดไม่ตรง / ตรวจไม่ได้"}
                    </p>
                  </div>
                )}
              </div>

              {/* Admin note / reject reason */}
              <div>
                <label
                  htmlFor="admin-note"
                  className="text-xs font-medium text-[var(--text-muted)] block mb-1.5"
                >
                  หมายเหตุ / เหตุผลปฏิเสธ
                </label>
                <Textarea
                  id="admin-note"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="เหตุผล (จำเป็นสำหรับการปฏิเสธ)..."
                  className="min-h-[80px] text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 text-[var(--error)] border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.08)]"
                  onClick={handleRejectClick}
                  disabled={processing}
                >
                  <X size={14} className="mr-1.5" />
                  ปฏิเสธ
                </Button>
                <Button
                  className="flex-1"
                  style={{
                    background: "var(--accent)",
                    color: "var(--bg-base)",
                  }}
                  onClick={handleApprove}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 size={14} className="animate-spin mr-1.5" />
                  ) : (
                    <CheckCircle2 size={14} className="mr-1.5" />
                  )}
                  อนุมัติ
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation */}
      <AlertDialog open={showRejectConfirm} onOpenChange={setShowRejectConfirm}>
        <AlertDialogContent className="bg-[var(--bg-surface)] border-[var(--border-default)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[var(--text-primary)]">
              ยืนยันการปฏิเสธ
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--text-muted)]">
              ปฏิเสธคำสั่งซื้อ #{order.order_number}?
              <br />
              เหตุผล: {rejectReason}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[var(--error)] text-white hover:bg-[var(--error)]/90"
              onClick={handleRejectConfirm}
              disabled={processing}
            >
              {processing ? (
                <Loader2 size={14} className="animate-spin mr-1.5" />
              ) : null}
              ยืนยันปฏิเสธ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── Tab Filter Config ──

const TAB_OPTIONS = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "PENDING", label: "รอชำระ" },
  { value: "PENDING_REVIEW", label: "รอตรวจสลิป" },
  { value: "COMPLETED", label: "สำเร็จ" },
  { value: "EXPIRED", label: "หมดอายุ" },
  { value: "CANCELLED", label: "ยกเลิก" },
];

// ── Main Page ──

export default function AdminOrderDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<AdminOrderStats>({
    total: 0,
    pending: 0,
    pending_review: 0,
    completed: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tabFilter, setTabFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Review dialog
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tabFilter !== "ALL") params.set("status", tabFilter);
      if (searchQuery) params.set("search", searchQuery);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();

      setOrders(data.orders ?? data.data ?? []);
      setTotalPages(data.pagination?.totalPages ?? 1);

      if (data.stats) {
        setStats(data.stats);
      } else {
        const allOrders: Order[] = data.orders ?? data.data ?? [];
        setStats({
          total: allOrders.length,
          pending: allOrders.filter((o) => o.status === "PENDING").length,
          pending_review: allOrders.filter(
            (o) =>
              o.status === "PENDING_REVIEW" || o.status === "SLIP_UPLOADED",
          ).length,
          completed: allOrders.filter((o) => o.status === "COMPLETED").length,
          revenue: allOrders
            .filter((o) => o.status === "COMPLETED")
            .reduce((sum, o) => sum + o.pay_amount, 0),
        });
      }
    } catch {
      toast.error("ไม่สามารถโหลดคำสั่งซื้อได้");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [tabFilter, searchQuery, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setPage(1);
  }, [tabFilter, searchQuery, dateFrom, dateTo]);

  // Fetch stats separately
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/orders/stats", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.stats) setStats(data.stats);
        }
      } catch {
        // Stats fail silently — derived stats are used as fallback
      }
    }
    fetchStats();
  }, []);

  // Approve
  async function handleApprove(orderId: string) {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "ไม่สามารถอนุมัติได้");
      }
      toast.success("อนุมัติคำสั่งซื้อสำเร็จ");
      fetchOrders();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาด",
      );
    }
  }

  // Reject
  async function handleReject(orderId: string, reason: string) {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "ไม่สามารถปฏิเสธได้");
      }
      toast.success("ปฏิเสธคำสั่งซื้อแล้ว");
      fetchOrders();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาด",
      );
    }
  }

  // Action buttons per status
  function renderAction(order: Order) {
    if (
      order.status === "PENDING_REVIEW" ||
      order.status === "SLIP_UPLOADED"
    ) {
      return (
        <Button
          size="sm"
          className="text-xs"
          style={{
            background: "var(--accent)",
            color: "var(--bg-base)",
          }}
          onClick={(e) => {
            e.stopPropagation();
            setReviewOrder(order);
          }}
        >
          <Eye size={12} className="mr-1" />
          ตรวจ
        </Button>
      );
    }
    if (order.status === "COMPLETED" || order.status === "APPROVED") {
      return (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="ดาวน์โหลดใบกำกับภาษี"
          onClick={(e) => {
            e.stopPropagation();
            const url =
              order.invoice_url ||
              order.tax_invoice_url ||
              `/api/v1/orders/${order.id}/invoice`;
            window.open(url, "_blank", "noopener,noreferrer");
          }}
        >
          <FileText size={14} style={{ color: "var(--accent)" }} />
        </Button>
      );
    }
    return (
      <span className="text-xs text-[var(--text-muted)]">—</span>
    );
  }

  // Loading skeleton
  if (loading && orders.length === 0) {
    return (
      <PageLayout>
        <PageHeader
          title="จัดการคำสั่งซื้อ"
          description="ตรวจสอบและจัดการคำสั่งซื้อทั้งหมด"
        />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-10 w-full mb-4" />
        <div className="flex gap-3 mb-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-36" />
        </div>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-14 rounded-lg mb-2" />
        ))}
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="จัดการคำสั่งซื้อ"
        description="ตรวจสอบและจัดการคำสั่งซื้อทั้งหมด"
      />

      {/* Stats — 5 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          icon={Package}
          label="ทั้งหมด"
          value={`${stats.total}`}
          color="var(--accent)"
        />
        <StatCard
          icon={Clock}
          label="รอชำระ"
          value={`${stats.pending}`}
          color="var(--warning)"
        />
        <StatCard
          icon={ClipboardCheck}
          label="รอตรวจสลิป"
          value={`${stats.pending_review}`}
          color="var(--info)"
        />
        <StatCard
          icon={CheckCircle2}
          label="สำเร็จ"
          value={`${stats.completed}`}
          color="var(--success)"
        />
        <StatCard
          icon={Banknote}
          label="รายได้"
          value={`฿${stats.revenue >= 1000 ? `${Math.round(stats.revenue / 1000)}K` : formatBaht(stats.revenue)}`}
          color="var(--info)"
        />
      </div>

      {/* Tab Filter */}
      <div className="mb-4">
        <PillTabs
          value={tabFilter}
          onChange={setTabFilter}
          label="กรองตามสถานะคำสั่งซื้อ"
          options={TAB_OPTIONS.map((opt) => ({
            ...opt,
            label:
              opt.value === "PENDING"
                ? `${opt.label} (${stats.pending})`
                : opt.value === "PENDING_REVIEW"
                  ? `${opt.label} (${stats.pending_review})`
                  : opt.value === "COMPLETED"
                    ? `${opt.label} (${stats.completed})`
                    : opt.label,
          }))}
        />
      </div>

      {/* Search + Date Filter */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
        <div className="relative flex-1 max-w-xs min-w-[200px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหา Order# / ลูกค้า..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full sm:w-[140px] text-xs"
            title="จากวันที่"
          />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            —
          </span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full sm:w-[140px] text-xs"
            title="ถึงวันที่"
          />
        </div>
      </div>

      {/* Empty State */}
      {orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-[var(--text-muted)]">
            {tabFilter === "PENDING_REVIEW"
              ? "ไม่มีสลิปรอตรวจ"
              : "ไม่พบคำสั่งซื้อที่ตรงกับตัวกรอง"}
          </p>
          {tabFilter === "PENDING_REVIEW" && (
            <p className="text-xs text-[var(--text-muted)] mt-1">
              ยังไม่มี order ที่ต้องตรวจสอบ
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Orders Table */}
          <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[var(--border-default)] hover:bg-transparent">
                  <TableHead className="text-[var(--text-muted)] font-medium text-xs w-[100px]">
                    Order#
                  </TableHead>
                  <TableHead className="text-[var(--text-muted)] font-medium text-xs">
                    ลูกค้า
                  </TableHead>
                  <TableHead className="text-[var(--text-muted)] font-medium text-xs">
                    Package
                  </TableHead>
                  <TableHead className="text-[var(--text-muted)] font-medium text-xs text-right w-[100px]">
                    ยอด
                  </TableHead>
                  <TableHead className="text-[var(--text-muted)] font-medium text-xs w-[120px]">
                    สถานะ
                  </TableHead>
                  <TableHead className="text-[var(--text-muted)] font-medium text-xs text-right w-[100px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="border-b border-[var(--border-default)] hover:bg-[var(--bg-elevated)]/50 transition-colors"
                  >
                    <TableCell className="py-3">
                      <p className="text-sm font-semibold font-mono text-[var(--text-primary)]">
                        #{order.order_number}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {formatDate(order.created_at)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[200px]">
                        {order.tax_name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] font-mono">
                        {order.tax_id}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-[var(--text-primary)]">
                        {order.package_name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {order.sms_count.toLocaleString()} SMS
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-medium font-mono tabular-nums text-[var(--text-primary)]">
                        ฿{formatBaht(order.pay_amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {renderAction(order)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} />
              </Button>
              <span
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Review Dialog */}
      <AdminReviewDialog
        order={reviewOrder}
        open={reviewOrder !== null}
        onClose={() => setReviewOrder(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </PageLayout>
  );
}
