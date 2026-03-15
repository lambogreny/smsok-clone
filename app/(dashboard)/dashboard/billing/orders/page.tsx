"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { DateRange } from "react-day-picker";
import {
  Package,
  Clock,
  CheckCircle2,
  Search,
  Plus,
  FileText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  ArrowRight,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StateDisplay } from "@/components/ui/state-display";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CustomSelect from "@/components/ui/CustomSelect";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { toast } from "sonner";
import {
  type Order,
  type OrderStats,
} from "@/types/order";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { formatBaht } from "@/types/purchase";
import { formatThaiDateOnly } from "@/lib/format-thai-date";

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

// ── Status Options ──

const STATUS_OPTIONS = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "PENDING", label: "รอชำระ" },
  { value: "PENDING_REVIEW", label: "รอตรวจสอบ" },
  { value: "COMPLETED", label: "สำเร็จ" },
  { value: "REJECTED", label: "ไม่ผ่าน" },
  { value: "EXPIRED", label: "หมดอายุ" },
  { value: "CANCELLED", label: "ยกเลิก" },
];

// ── Main Page ──

export default function OrderManagementPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    completed: 0,
    total_spent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);
      if (dateRange?.from) {
        params.set("from", dateRange.from.toISOString().slice(0, 10));
      }
      if (dateRange?.to) {
        params.set("to", dateRange.to.toISOString().slice(0, 10));
      }
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/v1/orders?${params.toString()}`, {
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
          completed: allOrders.filter((o) => o.status === "COMPLETED").length,
          total_spent: allOrders
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
  }, [statusFilter, searchQuery, dateRange, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchQuery, dateRange]);

  // Clone (reorder)
  function handleReorder(orderId: string) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    sessionStorage.setItem(
      "smsok_reorder",
      JSON.stringify({
        taxName: order.tax_name,
        taxId: order.tax_id,
        taxAddress: order.tax_address,
        customerType: order.customer_type,
        branchType: order.tax_branch_type,
        branchNumber: order.tax_branch_number || "",
        hasWht: order.has_wht,
        saveTaxProfile: false,
      }),
    );
    router.push(`/dashboard/billing/checkout?tier=${order.package_tier_id}&reorder=1`);
  }

  function openOrderDocument(url?: string, fallbackUrl?: string) {
    const target = url || fallbackUrl;
    if (!target) {
      toast.error("ยังไม่มีเอกสารสำหรับคำสั่งซื้อนี้");
      return;
    }
    window.open(target, "_blank", "noopener,noreferrer");
  }

  function navigateToOrder(orderId: string) {
    router.push(`/dashboard/billing/orders/${orderId}`);
  }

  // Action button per status
  function renderAction(order: Order) {
    switch (order.status) {
      case "PENDING":
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
              navigateToOrder(order.id);
            }}
          >
            ชำระ →
          </Button>
        );
      case "COMPLETED":
      case "APPROVED":
      case "VERIFIED":
        return (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title={
              order.invoice_url || order.invoice_number
                ? "เปิดใบกำกับภาษี"
                : "ดูรายละเอียดคำสั่งซื้อ"
            }
            onClick={(e) => {
              e.stopPropagation();
              if (order.invoice_url || order.invoice_number) {
                openOrderDocument(
                  order.invoice_url,
                  `/api/v1/orders/${order.id}/invoice`,
                );
                return;
              }
              navigateToOrder(order.id);
            }}
          >
            <FileText
              size={14}
              style={{
                color:
                  order.invoice_url || order.invoice_number
                    ? "var(--accent)"
                    : "var(--text-muted)",
              }}
            />
          </Button>
        );
      case "EXPIRED":
      case "CANCELLED":
      case "REJECTED":
        return (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            title="สั่งใหม่"
            onClick={(e) => {
              e.stopPropagation();
              handleReorder(order.id);
            }}
          >
            <RefreshCw size={14} />
          </Button>
        );
      case "SLIP_UPLOADED":
      case "PENDING_REVIEW":
        return (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled
            title="กำลังตรวจสอบ"
          >
            <Clock size={14} style={{ color: "var(--text-muted)" }} />
          </Button>
        );
      default:
        return null;
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-6xl space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-36" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            คำสั่งซื้อของฉัน
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            ประวัติคำสั่งซื้อและสถานะการชำระ
          </p>
        </div>
        <Link
          href="/dashboard/billing/packages"
          className="inline-flex items-center justify-center rounded-lg px-4 h-10 text-sm font-medium w-fit"
          style={{
            background: "var(--accent)",
            color: "var(--bg-base)",
          }}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          สั่งซื้อใหม่
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
          icon={CheckCircle2}
          label="สำเร็จ"
          value={`${stats.completed}`}
          color="var(--success)"
        />
        <StatCard
          icon={ShoppingCart}
          label="ยอดรวม"
          value={`฿${formatBaht(stats.total_spent)}`}
          color="var(--info)"
        />
      </div>

      {/* Filter Bar */}
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
            placeholder="ค้นหา Order#..."
            className="pl-9"
          />
        </div>
        <div className="w-40">
          <CustomSelect
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            options={STATUS_OPTIONS}
            placeholder="สถานะ"
          />
        </div>
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          placeholder="ช่วงวันที่"
          className="w-full sm:w-auto"
        />
        {dateRange?.from && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-[var(--text-muted)] h-10"
            onClick={() => setDateRange(undefined)}
          >
            ล้างวันที่
          </Button>
        )}
      </div>

      {/* Empty State */}
      {orders.length === 0 && statusFilter === "ALL" && !searchQuery && !dateRange?.from ? (
        <StateDisplay
          icon={Package}
          iconColor="#00FFA7"
          iconBg="rgba(0,255,167,0.08)"
          title="ยังไม่มีคำสั่งซื้อ"
          description="เริ่มต้นใช้งานด้วยการสั่งซื้อแพ็กเกจ SMS ตัวแรก"
          primaryAction={{
            label: "สั่งซื้อแพ็กเกจ",
            icon: Package,
            href: "/dashboard/billing/packages",
          }}
          secondaryAction={{
            label: "ดูแพ็กเกจทั้งหมด",
            href: "/pricing",
          }}
          size="md"
        />
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-[var(--text-muted)]">
            ไม่พบคำสั่งซื้อที่ตรงกับตัวกรอง
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[var(--border-default)] hover:bg-transparent">
                  <TableHead className="text-[var(--text-muted)] font-medium text-xs w-[140px]">
                    Order#
                  </TableHead>
                  <TableHead className="text-[var(--text-muted)] font-medium text-xs">
                    Package
                  </TableHead>
                  <TableHead className="text-[var(--text-muted)] font-medium text-xs text-right w-[120px]">
                    ยอดโอน
                  </TableHead>
                  <TableHead className="text-[var(--text-muted)] font-medium text-xs w-[130px]">
                    สถานะ
                  </TableHead>
                  <TableHead className="text-[var(--text-muted)] font-medium text-xs w-[120px]">
                    วันที่
                  </TableHead>
                  <TableHead className="text-[var(--text-muted)] font-medium text-xs text-right w-[80px]">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="border-b border-[var(--border-default)] cursor-pointer hover:bg-[var(--bg-elevated)]/50 transition-colors"
                    onClick={() => navigateToOrder(order.id)}
                  >
                    <TableCell className="py-3">
                      <p
                        className="text-sm font-semibold font-mono"
                        style={{ color: "var(--text-primary)" }}
                      >
                        #{order.order_number}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {order.package_name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {order.sms_count.toLocaleString()} SMS
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className="text-sm font-medium font-mono tabular-nums"
                        style={{ color: "var(--text-primary)" }}
                      >
                        ฿{formatBaht(order.pay_amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                      {order.status === "REJECTED" && order.reject_reason && (
                        <p
                          className="text-[10px] mt-0.5 line-clamp-1 max-w-[120px]"
                          style={{ color: "var(--error)" }}
                        >
                          {order.reject_reason}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {formatThaiDateOnly(order.created_at)}
                      </p>
                      {order.status === "COMPLETED" && order.paid_at && (
                        <p
                          className="text-[10px] mt-0.5"
                          style={{ color: "var(--success)" }}
                        >
                          ชำระ {formatThaiDateOnly(order.paid_at)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {renderAction(order)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card Layout */}
          <div className="sm:hidden space-y-3">
            {orders.map((order) => (
              <button
                type="button"
                key={order.id}
                className="w-full rounded-lg p-4 cursor-pointer transition-colors text-left"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                }}
                onClick={() => navigateToOrder(order.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <span
                    className="text-sm font-semibold font-mono"
                    style={{ color: "var(--text-primary)" }}
                  >
                    #{order.order_number}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {order.package_name} · {order.sms_count.toLocaleString()} SMS
                </p>
                {order.status === "REJECTED" && order.reject_reason && (
                  <p className="text-xs mt-1 line-clamp-1" style={{ color: "var(--error)" }}>
                    {order.reject_reason}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span
                    className="text-sm font-semibold font-mono tabular-nums"
                    style={{ color: "var(--text-primary)" }}
                  >
                    ฿{formatBaht(order.pay_amount)}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {formatThaiDateOnly(order.created_at)}
                  </span>
                </div>
                <div className="mt-3">{renderAction(order)}</div>
              </button>
            ))}
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
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
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
    </div>
  );
}
