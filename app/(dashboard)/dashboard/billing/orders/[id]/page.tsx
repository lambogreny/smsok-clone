"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  Upload,
  X,
  Clock,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  FileText,
  Landmark,
  Download,
  XCircle,
  Plus,
  Send,
  Trash2,
  Receipt,
  Package,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  type Order,
  type OrderStatus,
  type OrderStatusEvent,
} from "@/types/order";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { formatBaht } from "@/types/purchase";
import { formatThaiDate, formatThaiDateTimeShort } from "@/lib/format-thai-date";

interface BankAccount {
  bank: string;
  accountNumber: string;
  accountName: string;
  logo: string;
}

type CanonicalOrderHistoryEntry = {
  to_status?: string | null;
  created_at?: string | null;
};

type CanonicalOrderPayload = Omit<Order, "status" | "timeline"> & {
  status: string;
  history?: CanonicalOrderHistoryEntry[];
  timeline?: OrderStatusEvent[];
};

function openDocument(url?: string) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

function getPendingReviewDescription(order: Order) {
  const note = order.admin_note ?? order.latest_status_note ?? "";

  if (
    note.includes("application_expired") ||
    note.includes("API key not configured") ||
    note.includes("EasySlip unavailable")
  ) {
    return "ระบบตรวจสอบอัตโนมัติไม่พร้อม กรุณารอเจ้าหน้าที่ตรวจสลิป";
  }

  if (note.includes("amount mismatch")) {
    return "ยอดในสลิปไม่ตรง ระบบส่งให้เจ้าหน้าที่ตรวจต่อ";
  }

  return "เรากำลังตรวจสอบหลักฐานการชำระเงิน โดยปกติใช้เวลาไม่เกิน 30 นาที";
}

const CANONICAL_TO_LEGACY_STATUS: Record<string, OrderStatus> = {
  draft: "PENDING",
  pending_payment: "PENDING",
  verifying: "PENDING_REVIEW",
  paid: "COMPLETED",
  expired: "EXPIRED",
  cancelled: "CANCELLED",
  pending: "PENDING",
  slip_uploaded: "SLIP_UPLOADED",
  verified: "VERIFIED",
  pending_review: "PENDING_REVIEW",
  approved: "APPROVED",
  completed: "COMPLETED",
  rejected: "REJECTED",
};

function toLegacyOrderStatus(status: string | null | undefined): OrderStatus {
  const normalized = status?.trim().toLowerCase() ?? "";
  return CANONICAL_TO_LEGACY_STATUS[normalized] ?? "PENDING";
}

function normalizeOrderPayload(payload: CanonicalOrderPayload): Order {
  const timeline = payload.timeline ?? payload.history?.map((entry) => ({
    status: toLegacyOrderStatus(entry.to_status),
    timestamp: entry.created_at ?? null,
  }));

  return {
    ...payload,
    status: toLegacyOrderStatus(payload.status),
    timeline,
  };
}

// ── Status Banner Config ──

const STATUS_BANNER_CONFIG: Record<
  string,
  {
    title: string;
    description: (order: Order) => string;
    accent: string;
    bg: string;
    border: string;
  }
> = {
  PENDING: {
    title: "รอชำระเงิน",
    description: (o) =>
      `กรุณาโอนเงินและแนบสลิปภายใน ${formatThaiDate(o.expires_at)}`,
    accent: "var(--warning)",
    bg: "rgba(var(--warning-rgb),0.04)",
    border: "1px solid rgba(var(--warning-rgb),0.2)",
  },
  SLIP_UPLOADED: {
    title: "กำลังตรวจสอบสลิป",
    description: (o) => getPendingReviewDescription(o),
    accent: "var(--warning)",
    bg: "rgba(var(--warning-rgb),0.04)",
    border: "1px solid rgba(var(--warning-rgb),0.2)",
  },
  VERIFIED: {
    title: "ชำระเงินเรียบร้อย",
    description: () => "โควต้าข้อความถูกเพิ่มในบัญชีแล้ว",
    accent: "var(--success)",
    bg: "rgba(var(--success-rgb),0.04)",
    border: "1px solid rgba(var(--success-rgb),0.2)",
  },
  PENDING_REVIEW: {
    title: "กำลังตรวจสอบสลิป",
    description: (o) => getPendingReviewDescription(o),
    accent: "var(--warning)",
    bg: "rgba(var(--warning-rgb),0.04)",
    border: "1px solid rgba(var(--warning-rgb),0.2)",
  },
  APPROVED: {
    title: "ชำระเงินเรียบร้อย",
    description: () => "โควต้าข้อความถูกเพิ่มในบัญชีแล้ว",
    accent: "var(--success)",
    bg: "rgba(var(--success-rgb),0.04)",
    border: "1px solid rgba(var(--success-rgb),0.2)",
  },
  COMPLETED: {
    title: "ชำระเงินเรียบร้อย",
    description: () => "โควต้าข้อความถูกเพิ่มในบัญชีแล้ว",
    accent: "var(--success)",
    bg: "rgba(var(--success-rgb),0.04)",
    border: "1px solid rgba(var(--success-rgb),0.2)",
  },
  EXPIRED: {
    title: "หมดอายุ",
    description: () => "คำสั่งซื้อนี้หมดอายุแล้ว กรุณาสร้างคำสั่งซื้อใหม่",
    accent: "var(--text-muted)",
    bg: "rgba(var(--text-muted-rgb),0.04)",
    border: "1px solid rgba(var(--text-muted-rgb),0.2)",
  },
  CANCELLED: {
    title: "ยกเลิกแล้ว",
    description: (o) =>
      `คำสั่งซื้อนี้ถูกยกเลิก${o.cancellation_reason ? ": " + o.cancellation_reason : ""}`,
    accent: "var(--error)",
    bg: "rgba(var(--error-rgb),0.04)",
    border: "1px solid rgba(var(--error-rgb),0.2)",
  },
  REJECTED: {
    title: "ไม่ผ่านการตรวจสอบ",
    description: (o) =>
      o.reject_reason
        ? `เหตุผล: ${o.reject_reason}`
        : "สลิปไม่ผ่านการตรวจสอบ กรุณาแนบสลิปใหม่",
    accent: "var(--error)",
    bg: "rgba(var(--error-rgb),0.04)",
    border: "1px solid rgba(var(--error-rgb),0.2)",
  },
};

// ── Countdown Timer (inline in banner) ──

function CountdownInline({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    function update() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft("หมดเวลาแล้ว");
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-sm font-bold tabular-nums"
      style={{ color: isExpired ? "var(--error)" : "var(--warning)" }}
    >
      <Clock size={14} />
      {timeLeft}
    </span>
  );
}

// ── Timeline ──

const TIMELINE_STEPS = [
  { key: "created", label: "สร้าง", mobileLabel: "สร้าง" },
  { key: "pending", label: "รอชำระ", mobileLabel: "รอชำระ" },
  { key: "verifying", label: "ตรวจสอบ", mobileLabel: "ตรวจ" },
  { key: "paid", label: "ชำระแล้ว", mobileLabel: "สำเร็จ" },
];

const STATUS_TO_STEP: Record<string, number> = {
  PENDING: 1,
  SLIP_UPLOADED: 2,
  PENDING_REVIEW: 2,
  VERIFIED: 3,
  APPROVED: 3,
  COMPLETED: 3,
  EXPIRED: -1,
  CANCELLED: -1,
  REJECTED: -1,
};

function OrderTimeline({ order }: { order: Order }) {
  const currentStep = STATUS_TO_STEP[order.status] ?? -1;
  const isTerminal = currentStep === -1;
  const accent =
    STATUS_BANNER_CONFIG[order.status]?.accent ?? "var(--accent)";

  function getTimestamp(stepIdx: number): string | null {
    if (order.timeline) {
      if (stepIdx === 0) {
        const ev = order.timeline.find((e) => e.status === "PENDING");
        return ev?.timestamp ?? order.created_at;
      }
      if (stepIdx === 3) {
        const ev = order.timeline.find(
          (e) =>
            e.status === "COMPLETED" ||
            e.status === "VERIFIED" ||
            e.status === "APPROVED"
        );
        return ev?.timestamp ?? order.paid_at ?? null;
      }
    }
    if (stepIdx === 0) return order.created_at;
    if (stepIdx === 3) return order.paid_at ?? null;
    return null;
  }

  return (
    <div className="flex items-start mt-5">
      {TIMELINE_STEPS.map((step, i) => {
        const isDone = !isTerminal && currentStep > i;
        const isCurrent = !isTerminal && currentStep === i;
        const ts = getTimestamp(i);

        return (
          <div key={step.key} className="flex items-start flex-1 min-w-0">
            <div className="flex flex-col items-center text-center flex-1">
              {/* Circle */}
              <div
                className="flex items-center justify-center rounded-full transition-all"
                style={{
                  width: 28,
                  height: 28,
                  background: isDone ? accent : "transparent",
                  border: isDone
                    ? "none"
                    : isCurrent
                      ? `2px solid ${accent}`
                      : "2px solid var(--border-default)",
                  boxShadow: isCurrent
                    ? `0 0 0 4px ${accent}26`
                    : "none",
                }}
              >
                {isDone ? (
                  <Check size={14} strokeWidth={3} color="var(--text-primary)" />
                ) : isCurrent ? (
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: accent }}
                  />
                ) : null}
              </div>
              {/* Label */}
              <span
                className="text-[11px] font-medium mt-1.5 whitespace-nowrap sm:hidden"
                style={{
                  color:
                    isDone || isCurrent ? "white" : "var(--text-muted)",
                }}
              >
                {step.mobileLabel}
              </span>
              <span
                className="text-[11px] font-medium mt-1.5 whitespace-nowrap hidden sm:block"
                style={{
                  color:
                    isDone || isCurrent ? "white" : "var(--text-muted)",
                }}
              >
                {step.label}
              </span>
              {/* Timestamp */}
              {ts && (isDone || isCurrent) && (
                <span
                  className="text-[10px] mt-0.5 font-mono"
                  style={{ color: "var(--text-muted)" }}
                >
                  {formatThaiDateTimeShort(ts)}
                </span>
              )}
            </div>
            {/* Connector */}
            {i < TIMELINE_STEPS.length - 1 && (
              <div
                className="mt-3.5 mx-1"
                style={{
                  height: 2,
                  flex: "0 0 24px",
                  background:
                    !isTerminal && currentStep > i ? accent : "var(--border-default)",
                  borderRadius: 1,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Status Banner ──

function StatusBanner({ order }: { order: Order }) {
  const config = STATUS_BANNER_CONFIG[order.status];
  if (!config) return null;

  const isPaid =
    order.status === "COMPLETED" ||
    order.status === "VERIFIED" ||
    order.status === "APPROVED";

  return (
    <div
      className="rounded-xl p-6 mb-6 relative overflow-hidden"
      style={{ background: config.bg, border: config.border }}
    >
      {/* Top-left glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -40,
          left: -40,
          width: 120,
          height: 120,
          background: `radial-gradient(${config.accent} 0%, transparent 70%)`,
          opacity: 0.06,
        }}
      />

      {/* Status title */}
      <div className="flex items-center gap-2.5 relative">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{
            background: config.accent,
            animation: isPaid ? "pulse 2s infinite" : undefined,
          }}
        />
        <h2
          className="text-lg font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {config.title}
        </h2>
      </div>

      {/* Description */}
      <p
        className="text-[13px] mt-1 relative"
        style={{ color: "var(--text-secondary)" }}
      >
        {config.description(order)}
      </p>

      {/* Countdown for pending */}
      {order.status === "PENDING" && (
        <div className="mt-3 relative">
          <CountdownInline expiresAt={order.expires_at} />
        </div>
      )}

      {/* Timeline */}
      <OrderTimeline order={order} />
    </div>
  );
}

// ── Order Info Card ──

function OrderInfoCard({ order }: { order: Order }) {
  const isB2B = order.customer_type === "COMPANY";
  const showExpiry =
    order.status === "PENDING" || order.status === "SLIP_UPLOADED";

  return (
    <div
      className="rounded-xl p-5 mb-4"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      <h3
        className="text-sm font-semibold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        ข้อมูลคำสั่งซื้อ
      </h3>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "140px 1fr" }}
      >
        <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          Order ID
        </span>
        <span
          className="text-[13px] font-mono font-medium"
          style={{ color: "var(--accent)" }}
        >
          {order.order_number}
        </span>

        <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          วันที่สร้าง
        </span>
        <span className="text-[13px]" style={{ color: "var(--text-primary)" }}>
          {formatThaiDate(order.created_at)}
        </span>

        {showExpiry && (
          <>
            <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              หมดอายุ
            </span>
            <span
              className="text-[13px] flex items-center gap-1.5"
              style={{ color: "var(--warning)" }}
            >
              <Clock size={14} />
              {formatThaiDate(order.expires_at)}
            </span>
          </>
        )}

        <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          ชื่อลูกค้า
        </span>
        <span className="text-[13px]" style={{ color: "var(--text-primary)" }}>
          {order.tax_name}
        </span>

        {isB2B && (
          <>
            <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              เลขผู้เสียภาษี
            </span>
            <span
              className="text-[13px] font-mono tracking-wide"
              style={{ color: "var(--text-primary)" }}
            >
              {order.tax_id}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Itemized Breakdown ──

function ItemizedTable({ order }: { order: Order }) {
  const pricePerSms =
    order.price_per_sms ??
    (order.sms_count > 0 ? order.net_amount / order.sms_count : 0);

  return (
    <div
      className="rounded-xl overflow-hidden mb-4"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div className="p-5 pb-0">
        <h3
          className="text-sm font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          รายการ
        </h3>
      </div>
      <table className="w-full text-[13px]">
        <thead>
          <tr style={{ background: "var(--bg-base)" }}>
            <th
              className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              รายการ
            </th>
            <th
              className="text-right px-5 py-2.5 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)", width: 120 }}
            >
              จำนวน
            </th>
            <th
              className="text-right px-5 py-2.5 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell"
              style={{ color: "var(--text-muted)", width: 120 }}
            >
              ราคา/หน่วย
            </th>
            <th
              className="text-right px-5 py-2.5 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)", width: 120 }}
            >
              ยอดรวม
            </th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderTop: "1px solid var(--border-default)" }}>
            <td className="px-5 py-3" style={{ color: "var(--text-primary)" }}>
              {order.package_name}
            </td>
            <td
              className="text-right px-5 py-3 tabular-nums"
              style={{ color: "var(--text-primary)" }}
            >
              {order.sms_count.toLocaleString()} SMS
            </td>
            <td
              className="text-right px-5 py-3 font-mono tabular-nums hidden sm:table-cell"
              style={{ color: "var(--text-secondary)" }}
            >
              ฿{pricePerSms.toFixed(2)}
            </td>
            <td
              className="text-right px-5 py-3 font-mono tabular-nums font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              ฿{formatBaht(order.net_amount)}
            </td>
          </tr>
          {order.bonus_sms && order.bonus_sms > 0 && (
            <tr style={{ borderTop: "1px solid rgba(32,37,44,0.5)" }}>
              <td className="px-5 py-3 text-xs" style={{ color: "var(--accent)" }}>
                Bonus SMS
              </td>
              <td
                className="text-right px-5 py-3 tabular-nums text-xs"
                style={{ color: "var(--accent)" }}
              >
                +{order.bonus_sms.toLocaleString()} SMS
              </td>
              <td
                className="text-right px-5 py-3 text-xs hidden sm:table-cell"
                style={{ color: "var(--text-muted)" }}
              >
                ฟรี
              </td>
              <td
                className="text-right px-5 py-3 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                ฿0.00
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Pricing Card (Right Column) ──

function PricingCard({ order }: { order: Order }) {
  const hasWht = order.has_wht && order.wht_amount > 0 && order.customer_type === "COMPANY";

  return (
    <div
      className="rounded-xl p-5 mb-4"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      <h3
        className="text-sm font-semibold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        สรุปยอดชำระ
      </h3>
      <div className="space-y-1.5">
        <div className="flex justify-between py-1.5 text-[13px]">
          <span style={{ color: "var(--text-secondary)" }}>ราคาแพ็กเกจ</span>
          <span
            className="font-mono tabular-nums"
            style={{ color: "var(--text-primary)" }}
          >
            ฿{formatBaht(order.net_amount)}
          </span>
        </div>
        <div className="flex justify-between py-1.5 text-[13px]">
          <span style={{ color: "var(--text-secondary)" }}>VAT 7%</span>
          <span
            className="font-mono tabular-nums"
            style={{ color: "var(--text-primary)" }}
          >
            ฿{formatBaht(order.vat_amount)}
          </span>
        </div>

        <div
          className="my-2"
          style={{ borderTop: "1px solid var(--border-default)" }}
        />

        <div className="flex justify-between py-1.5">
          <span
            className="text-base font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            รวมทั้งสิ้น
          </span>
          <span
            className="text-base font-bold font-mono tabular-nums"
            style={{ color: hasWht ? "var(--text-primary)" : "var(--accent)" }}
          >
            ฿{formatBaht(order.total_amount)}
          </span>
        </div>

        {hasWht && (
          <>
            <div className="flex justify-between py-1.5 text-[13px]">
              <span style={{ color: "var(--warning)" }}>หัก ณ ที่จ่าย 3%</span>
              <span
                className="font-mono tabular-nums"
                style={{ color: "var(--warning)" }}
              >
                -฿{formatBaht(order.wht_amount)}
              </span>
            </div>

            <div
              className="my-2"
              style={{ borderTop: "1px solid var(--border-default)" }}
            />

            <div className="flex justify-between py-1.5">
              <span
                className="text-lg font-extrabold"
                style={{ color: "var(--text-primary)" }}
              >
                ยอดที่ต้องโอน
              </span>
              <span
                className="text-lg font-extrabold font-mono tabular-nums"
                style={{ color: "var(--accent)" }}
              >
                ฿{formatBaht(order.pay_amount)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Documents Card (Right Column) ──

const DOC_TYPE_LABELS: Record<string, string> = {
  invoice: "ใบแจ้งหนี้",
  tax_invoice: "ใบกำกับภาษี",
  receipt: "ใบเสร็จรับเงิน",
  credit_note: "ใบลดหนี้",
};

function DocumentsCard({ order }: { order: Order }) {
  // Build document list from both old fields and new documents array
  const docs: { label: string; number: string | null; url: string | null }[] = [
    {
      label: "ใบแจ้งหนี้",
      number: order.invoice_number ?? null,
      url: order.invoice_url ?? (order.invoice_number ? `/api/v1/orders/${order.id}/documents/invoice` : null),
    },
    {
      label: "ใบกำกับภาษี",
      number: order.tax_invoice_number ?? null,
      url: order.tax_invoice_url ?? (order.tax_invoice_number ? `/api/v1/orders/${order.id}/documents/tax-invoice` : null),
    },
    {
      label: "ใบเสร็จรับเงิน",
      number: order.receipt_number ?? null,
      url: order.receipt_url ?? (order.receipt_number ? `/api/v1/orders/${order.id}/documents/receipt` : null),
    },
  ];

  // Merge from documents array
  if (order.documents) {
    for (const doc of order.documents) {
      const exists = docs.some((d) => d.number === doc.document_number);
      if (!exists) {
        docs.push({
          label: DOC_TYPE_LABELS[doc.type] ?? doc.type,
          number: doc.document_number,
          url: doc.url,
        });
      }
    }
  }

  // Determine which docs to show based on status
  const isPaid =
    order.status === "COMPLETED" ||
    order.status === "VERIFIED" ||
    order.status === "APPROVED";

  return (
    <div
      className="rounded-xl p-5 mb-4"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      <h3
        className="text-sm font-semibold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        เอกสาร
      </h3>
      <div className="flex flex-col gap-2">
        {docs.map((doc) => {
          const hasDoc = !!doc.number;
          return (
            <div
              key={doc.label}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{
                background: "var(--bg-base)",
                border: "1px solid var(--border-default)",
                opacity: hasDoc ? 1 : isPaid ? 0.7 : 0.4,
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex items-center justify-center rounded-md"
                  style={{
                    width: 32,
                    height: 32,
                    background: hasDoc
                      ? "rgba(var(--accent-rgb),0.08)"
                      : "rgba(var(--text-muted-rgb),0.08)",
                  }}
                >
                  <FileText
                    size={16}
                    style={{
                      color: hasDoc ? "var(--accent)" : "var(--text-muted)",
                    }}
                  />
                </div>
                <div>
                  <p
                    className="text-[13px] font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {doc.label}
                  </p>
                  {hasDoc ? (
                    <p
                      className="text-[11px] font-mono"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {doc.number}
                    </p>
                  ) : (
                    <p className="text-[11px]" style={{ color: isPaid ? "var(--warning)" : "var(--text-muted)" }}>
                      {isPaid ? "กำลังสร้างเอกสาร..." : "ยังไม่ออก"}
                    </p>
                  )}
                </div>
              </div>
              {hasDoc && doc.url && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs h-8 px-2"
                    style={{ color: "var(--text-secondary)" }}
                    onClick={() => openDocument(doc.url!)}
                    title="ดูตัวอย่าง"
                  >
                    <Eye size={14} />
                    ดู
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs h-8 px-2"
                    style={{ color: "var(--accent)" }}
                    onClick={() => openDocument(doc.url! + (doc.url!.includes("?") ? "&" : "?") + "download=1")}
                    title="ดาวน์โหลด PDF"
                  >
                    <Download size={14} />
                    PDF
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Bank Account Card (shown on order detail for PENDING orders) ──

function BankAccountCard({ bankAccount }: { bankAccount: BankAccount | null }) {
  const [copied, setCopied] = useState(false);

  if (!bankAccount) return null;

  function handleCopy() {
    navigator.clipboard.writeText(bankAccount!.accountNumber).then(() => {
      setCopied(true);
      toast.success("คัดลอกเลขบัญชีแล้ว");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="rounded-xl p-5 mb-4"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Landmark size={18} style={{ color: "var(--accent)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          บัญชีสำหรับโอนเงิน
        </h3>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>ธนาคาร</span>
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {bankAccount.bank}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>เลขที่บัญชี</span>
          <div className="flex items-center gap-2">
            <span
              className="text-base font-semibold font-mono tracking-wide"
              style={{ color: "var(--text-primary)" }}
            >
              {bankAccount.accountNumber}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-md transition-colors"
              style={{
                color: copied ? "var(--success)" : "var(--text-muted)",
                background: copied ? "rgba(var(--success-rgb),0.08)" : "transparent",
              }}
              aria-label="คัดลอกเลขบัญชี"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>ชื่อบัญชี</span>
          <span className="text-sm" style={{ color: "var(--text-primary)" }}>
            {bankAccount.accountName}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Payment Proof Card ──

function PaymentProofCard({
  order,
  onUpload,
}: {
  order: Order;
  onUpload: () => void;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentTime] = useState(() => Date.now());
  const isPending = order.status === "PENDING";
  const isVerifying =
    order.status === "SLIP_UPLOADED" || order.status === "PENDING_REVIEW";
  const isPaid =
    order.status === "COMPLETED" ||
    order.status === "VERIFIED" ||
    order.status === "APPROVED";
  const isTerminal =
    order.status === "EXPIRED" || order.status === "CANCELLED";
  const hasSlip = !!order.slip_url;

  return (
    <div
      className="rounded-xl p-5 mb-4"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      <h3
        className="text-sm font-semibold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        หลักฐานการชำระเงิน
      </h3>

      {/* State A: No slip */}
      {!hasSlip && isPending && (() => {
        const expiresAt = order.expires_at ? new Date(order.expires_at).getTime() : 0;
        const isExpired = order.expires_at && expiresAt < currentTime;
        return isExpired ? (
          <div className="text-center py-6">
            <AlertTriangle size={36} style={{ color: "var(--text-muted)" }} className="mx-auto" />
            <p className="text-[13px] mt-3 font-medium" style={{ color: "var(--error)" }}>
              คำสั่งซื้อหมดอายุ
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              กรุณาสร้างคำสั่งซื้อใหม่
            </p>
          </div>
        ) : (
          <div className="text-center py-6">
            <Receipt size={36} style={{ color: "var(--border-default)" }} className="mx-auto" />
            <p
              className="text-[13px] mt-3"
              style={{ color: "var(--text-muted)" }}
            >
              ยังไม่ได้แนบสลิป
            </p>
            <Button
              className="mt-4 h-10 px-5"
              style={{
                background: "var(--accent)",
                color: "var(--bg-base)",
              }}
              onClick={onUpload}
            >
              <Upload size={16} className="mr-2" />
              แนบสลิปโอนเงิน
            </Button>
          </div>
        );
      })()}

      {/* State B: Slip uploaded */}
      {hasSlip && (
        <div className="flex flex-col gap-3">
          <div
            className="relative rounded-lg overflow-hidden cursor-pointer"
            style={{ border: "1px solid var(--border-default)" }}
            onClick={() => setLightboxOpen(true)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={order.slip_url}
              alt="สลิปโอนเงิน"
              className="w-full max-h-[300px] object-contain"
              style={{ background: "var(--bg-base)" }}
            />
            {/* Overlay info */}
            <div
              className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2"
              style={{
                background: "rgba(11,17,24,0.85)",
                backdropFilter: "blur(4px)",
              }}
            >
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                อัปโหลดเมื่อ {order.latest_slip_uploaded_at ? formatThaiDateTimeShort(order.latest_slip_uploaded_at) : "—"}
              </span>
              {isVerifying && (
                <span
                  className="text-xs flex items-center gap-1.5"
                  style={{ color: "var(--warning)" }}
                >
                  <Loader2 size={12} className="animate-spin" />
                  กำลังตรวจสอบ
                </span>
              )}
              {isPaid && (
                <span
                  className="text-xs flex items-center gap-1.5"
                  style={{ color: "var(--success)" }}
                >
                  <CheckCircle2 size={12} />
                  ยืนยันแล้ว
                </span>
              )}
            </div>
          </div>

          {/* Upload more (pending only) */}
          {isPending && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={onUpload}
            >
              <Plus size={14} />
              แนบสลิปเพิ่ม
            </Button>
          )}
        </div>
      )}

      {/* State C: Terminal with no slip */}
      {!hasSlip && isTerminal && (
        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          ไม่ได้แนบสลิป
        </p>
      )}

      {/* Lightbox */}
      {hasSlip && (
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent
            className="max-w-[90vw] max-h-[90vh] p-0 border-none"
            style={{ background: "rgba(0,0,0,0.9)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={order.slip_url}
              alt="สลิปโอนเงิน"
              className="w-full h-full object-contain"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ── Slip Upload Dialog ──

function SlipUploadDialog({
  open,
  onClose,
  order,
  bankAccount,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  order: Order;
  bankAccount: BankAccount | null;
  onSubmit: (slip: File, whtCert?: File) => Promise<void>;
}) {
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [whtFile, setWhtFile] = useState<File | null>(null);
  const [whtPreview, setWhtPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const whtInputRef = useRef<HTMLInputElement>(null);

  const hasWht = order.has_wht && order.wht_amount > 0 && order.customer_type === "COMPANY";
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  function handleSlipFile(f: File) {
    setError(null);
    if (!f.type.startsWith("image/")) {
      setError("รองรับเฉพาะไฟล์ JPEG และ PNG เท่านั้น");
      return;
    }
    if (f.size > MAX_SIZE) {
      setError("ไฟล์ใหญ่เกิน 5MB กรุณาเลือกไฟล์ใหม่");
      return;
    }
    setSlipFile(f);
    setSlipPreview(URL.createObjectURL(f));
  }

  function handleWhtFile(f: File) {
    if (f.size > MAX_SIZE) {
      toast.error("ไฟล์ใหญ่เกิน 5MB");
      return;
    }
    setWhtFile(f);
    setWhtPreview(URL.createObjectURL(f));
  }

  function clearSlip() {
    if (slipPreview) URL.revokeObjectURL(slipPreview);
    setSlipFile(null);
    setSlipPreview(null);
    setError(null);
  }

  function clearWht() {
    if (whtPreview) URL.revokeObjectURL(whtPreview);
    setWhtFile(null);
    setWhtPreview(null);
  }

  async function handleSubmit() {
    if (!slipFile) return;
    setSubmitting(true);
    try {
      await onSubmit(slipFile, whtFile ?? undefined);
      clearSlip();
      clearWht();
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setSubmitting(false);
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (slipPreview) URL.revokeObjectURL(slipPreview);
      if (whtPreview) URL.revokeObjectURL(whtPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-[480px] w-[calc(100vw-32px)] p-0 sm:max-w-[480px]"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: 12,
        }}
      >
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle
            className="text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            แนบสลิปโอนเงิน
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="px-5 py-4 space-y-4">
          {/* Amount Reminder */}
          <div
            className="rounded-lg p-3"
            style={{
              background: "var(--bg-base)",
              border: "1px solid var(--border-default)",
            }}
          >
            <p
              className="text-xl font-bold font-mono tabular-nums"
              style={{ color: "var(--text-primary)" }}
            >
              ฿{formatBaht(order.pay_amount)}
            </p>
            {bankAccount && (
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                {bankAccount.bank} {bankAccount.accountNumber} ·{" "}
                {bankAccount.accountName}
              </p>
            )}
          </div>

          {/* Slip Upload Zone */}
          <div>
            <p className="text-[13px] font-medium mb-2" style={{ color: "var(--text-primary)" }}>
              สลิปโอนเงิน{" "}
              <span style={{ color: "var(--error)" }}>*</span>
            </p>

            {!slipFile ? (
              <div
                className="rounded-xl text-center cursor-pointer transition-all"
                style={{
                  padding: "40px 24px",
                  border: isDragging
                    ? "2px solid var(--accent)"
                    : "2px dashed var(--border-default)",
                  background: isDragging
                    ? "rgba(var(--accent-rgb),0.04)"
                    : "transparent",
                  transform: isDragging ? "scale(1.01)" : undefined,
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleSlipFile(f);
                }}
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleSlipFile(f);
                  }}
                />
                <Upload
                  size={32}
                  className="mx-auto mb-3"
                  style={{
                    color: isDragging ? "var(--accent)" : "var(--border-default)",
                  }}
                />
                <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                  ลากไฟล์มาที่นี่ หรือ คลิกเลือก
                </p>
                <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                  JPEG, PNG — สูงสุด 5MB
                </p>
              </div>
            ) : (
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid var(--border-default)" }}
              >
                {slipPreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={slipPreview}
                    alt="สลิป preview"
                    className="w-full max-h-[280px] object-contain"
                    style={{ background: "var(--bg-base)" }}
                  />
                )}
                <div
                  className="flex items-center justify-between px-3 py-2"
                  style={{
                    background: "var(--bg-base)",
                    borderTop: "1px solid var(--border-default)",
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-xs truncate"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {slipFile.name}
                    </span>
                    <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
                      {(slipFile.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                  <button
                    className="p-1.5 rounded-md transition-colors hover:bg-[rgba(var(--error-rgb),0.1)]"
                    onClick={clearSlip}
                  >
                    <Trash2 size={14} style={{ color: "var(--error)" }} />
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <p
                className="flex items-center gap-1.5 text-xs mt-2"
                style={{ color: "var(--error)" }}
              >
                <AlertTriangle size={14} />
                {error}
              </p>
            )}
          </div>

          {/* WHT Certificate Upload (conditional) */}
          {hasWht && (
            <div>
              <p className="text-[13px] font-medium mb-2 flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                ใบ 50 ทวิ (หนังสือรับรองหัก ณ ที่จ่าย)
              </p>

              {!whtFile ? (
                <div
                  className="rounded-xl p-6 text-center cursor-pointer transition-all"
                  style={{
                    border: "2px dashed var(--border-default)",
                  }}
                  onClick={() => whtInputRef.current?.click()}
                >
                  <input
                    ref={whtInputRef}
                    type="file"
                    accept="image/jpeg,image/png,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleWhtFile(f);
                    }}
                  />
                  <Upload size={24} className="mx-auto mb-2" style={{ color: "var(--border-default)" }} />
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    PDF, JPG, PNG — สูงสุด 5MB
                  </p>
                </div>
              ) : (
                <div
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={16} style={{ color: "var(--accent)" }} />
                    <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                      {whtFile.name}
                    </span>
                  </div>
                  <button
                    className="p-1.5 rounded-md hover:bg-[rgba(var(--error-rgb),0.1)]"
                    onClick={clearWht}
                  >
                    <Trash2 size={14} style={{ color: "var(--error)" }} />
                  </button>
                </div>
              )}

              <p
                className="flex items-center gap-1 text-[11px] mt-1 italic"
                style={{ color: "var(--text-muted)" }}
              >
                ℹ️ หากเลือกหัก ณ ที่จ่าย ต้องแนบใบ 50 ทวิพร้อมสลิปในครั้งนี้
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex justify-between items-center px-5 py-4"
          style={{ borderTop: "1px solid var(--border-default)" }}
        >
          <Button variant="ghost" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button
            disabled={!slipFile || submitting}
            className="h-10 px-5"
            style={
              slipFile
                ? { background: "var(--accent)", color: "var(--bg-base)" }
                : undefined
            }
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                กำลังอัปโหลด...
              </>
            ) : (
              <>
                <Send size={16} className="mr-2" />
                ส่งสลิป
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Action Buttons (Bottom) ──

function ActionButtons({
  order,
  onUpload,
  onCancel,
}: {
  order: Order;
  onUpload: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const status = order.status;

  if (status === "PENDING" || status === "REJECTED") {
    return (
      <div
        className="flex items-center justify-between mt-6 pt-6"
        style={{ borderTop: "1px solid var(--border-default)" }}
      >
        <AlertDialog>
          <AlertDialogTrigger
            className="inline-flex items-center justify-center rounded-lg border px-4 h-10 text-sm font-medium gap-2 transition-colors"
            style={{
              color: "var(--error)",
              borderColor: "rgba(var(--error-rgb),0.3)",
            }}
          >
            <X size={16} />
            ยกเลิกคำสั่งซื้อ
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ยกเลิกคำสั่งซื้อ?</AlertDialogTitle>
              <AlertDialogDescription>
                คำสั่งซื้อ {order.order_number} จะถูกยกเลิก
                ถ้าออกใบแจ้งหนี้แล้ว ระบบจะออกใบลดหนี้อัตโนมัติ
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ไม่ยกเลิก</AlertDialogCancel>
              <AlertDialogAction
                onClick={onCancel}
                className="bg-[var(--error)] text-white hover:bg-[var(--error)]/80"
              >
                ยืนยันยกเลิก
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          className="gap-2 h-10 px-5"
          style={{
            background: "var(--accent)",
            color: "var(--bg-base)",
          }}
          onClick={onUpload}
        >
          <Upload size={16} />
          แนบสลิปโอนเงิน
        </Button>
      </div>
    );
  }

  if (status === "SLIP_UPLOADED" || status === "PENDING_REVIEW") {
    return (
      <div
        className="flex justify-end mt-6 pt-6"
        style={{ borderTop: "1px solid var(--border-default)" }}
      >
        <Button disabled className="gap-2 h-10">
          <Loader2 size={16} className="animate-spin" />
          กำลังตรวจสอบ...
        </Button>
      </div>
    );
  }

  if (
    status === "COMPLETED" ||
    status === "VERIFIED" ||
    status === "APPROVED"
  ) {
    const receiptUrl =
      order.receipt_url ??
      (order.receipt_number
        ? `/api/v1/orders/${order.id}/documents/receipt`
        : null);
    return (
      <div
        className="flex justify-end mt-6 pt-6"
        style={{ borderTop: "1px solid var(--border-default)" }}
      >
        {receiptUrl && (
          <Button
            variant="outline"
            className="gap-2 h-10"
            onClick={() => openDocument(receiptUrl)}
          >
            <Download size={16} />
            ดาวน์โหลดใบเสร็จ
          </Button>
        )}
      </div>
    );
  }

  if (status === "EXPIRED") {
    return (
      <div
        className="flex justify-end mt-6 pt-6"
        style={{ borderTop: "1px solid var(--border-default)" }}
      >
        <Button
          className="gap-2 h-10"
          style={{ background: "var(--accent)", color: "var(--bg-base)" }}
          onClick={() => router.push("/dashboard/billing/packages")}
        >
          <Plus size={16} />
          สร้างคำสั่งซื้อใหม่
        </Button>
      </div>
    );
  }

  if (status === "CANCELLED") {
    return (
      <div
        className="flex justify-end mt-6 pt-6"
        style={{ borderTop: "1px solid var(--border-default)" }}
      >
        <Button
          variant="outline"
          className="gap-2 h-10"
          onClick={() => router.push("/dashboard/billing/packages")}
        >
          <Plus size={16} />
          สร้างคำสั่งซื้อใหม่
        </Button>
      </div>
    );
  }

  return null;
}

// ── Main Order Detail Page ──

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Fetch bank account
  useEffect(() => {
    async function fetchBank() {
      try {
        const res = await fetch("/api/v1/payments/bank-accounts", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setBankAccount(data.account ?? null);
        }
      } catch {
        // Fallback: will show without bank info
      }
    }
    fetchBank();
  }, []);

  // Fetch order
  const fetchOrder = useCallback(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch order");
        const data = normalizeOrderPayload(await res.json());
        setOrder(data);
      } catch {
        toast.error("ไม่สามารถโหลดคำสั่งซื้อได้");
      } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Cancel order
  async function handleCancel() {
    if (!order) return;
    const currentOrder = order;
    try {
      const res = await fetch(`/api/orders/${currentOrder.id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "ยกเลิกไม่สำเร็จ");
      }
      toast.success("ยกเลิกคำสั่งซื้อแล้ว");
      router.push("/dashboard/billing/orders");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาด"
      );
    }
  }

  // Submit slip
  async function handleSubmitSlip(slip: File, whtCert?: File) {
    if (!order) return;
    const currentOrder = order;
    const formData = new FormData();
    formData.append("slip", slip);
    if (whtCert) formData.append("wht_cert", whtCert);

    const res = await fetch(`/api/orders/${currentOrder.id}/slip`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (res.ok) {
      const data = normalizeOrderPayload(await res.json());
      await fetchOrder();
      toast.success("ส่งสลิปเรียบร้อย", {
        description:
          data.status === "COMPLETED"
            ? "ระบบยืนยันการชำระเงินแล้ว"
            : getPendingReviewDescription(data),
      });
    } else {
      const errData = await res.json().catch(() => ({}));
      const errMsg =
        errData.error || errData.message || "อัปโหลดไม่สำเร็จ กรุณาลองใหม่";
      toast.error(errMsg);
      throw new Error(errMsg);
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto animate-fade-in-up">
        <div className="space-y-4">
          <div
            className="h-8 w-32 rounded-lg animate-pulse"
            style={{ background: "var(--bg-surface)" }}
          />
          <div
            className="h-40 rounded-xl animate-pulse"
            style={{ background: "var(--bg-surface)" }}
          />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
            <div className="space-y-4">
              <div
                className="h-32 rounded-xl animate-pulse"
                style={{ background: "var(--bg-surface)" }}
              />
              <div
                className="h-48 rounded-xl animate-pulse"
                style={{ background: "var(--bg-surface)" }}
              />
            </div>
            <div>
              <div
                className="h-64 rounded-xl animate-pulse"
                style={{ background: "var(--bg-surface)" }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not found
  if (!order) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto text-center py-16">
        <Package size={48} style={{ color: "var(--border-default)" }} className="mx-auto" />
        <p className="text-base font-semibold mt-4" style={{ color: "var(--text-primary)" }}>
          ไม่พบคำสั่งซื้อ
        </p>
        <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
          คำสั่งซื้อนี้อาจถูกลบหรือไม่มีอยู่ในระบบ
        </p>
        <Button
          variant="outline"
          className="mt-5"
          onClick={() => router.push("/dashboard/billing/orders")}
        >
          กลับรายการคำสั่งซื้อ
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto animate-fade-in-up">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-[13px]"
          style={{ color: "var(--text-secondary)" }}
          onClick={() => router.push("/dashboard/billing/orders")}
        >
          <ArrowLeft size={16} />
          ย้อนกลับ
        </Button>
        <span
          className="text-sm font-mono font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          {order.order_number}
        </span>
      </div>

      {/* Section 1: Status Banner + Timeline */}
      <StatusBanner order={order} />

      {/* 2-Column Layout */}
      <div
        className="grid gap-6"
        style={{
          gridTemplateColumns: "1fr",
        }}
      >
        {/* Desktop: 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Left Column */}
          <div>
            {/* Section 2: Order Info */}
            <OrderInfoCard order={order} />

            {/* Section 3: Itemized Breakdown */}
            <ItemizedTable order={order} />

            {/* Section 5: Bank Account (PENDING / SLIP_UPLOADED only) */}
            {(order.status === "PENDING" || order.status === "SLIP_UPLOADED") && (
              <BankAccountCard bankAccount={bankAccount} />
            )}

            {/* Section 6: Payment Proof */}
            <PaymentProofCard
              order={order}
              onUpload={() => setUploadDialogOpen(true)}
            />
          </div>

          {/* Right Column (sticky) */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            {/* Section 4: Pricing Breakdown */}
            <PricingCard order={order} />

            {/* Section 5: Documents */}
            <DocumentsCard order={order} />
          </div>
        </div>
      </div>

      {/* Section 7: Action Buttons */}
      <ActionButtons
        order={order}
        onUpload={() => setUploadDialogOpen(true)}
        onCancel={handleCancel}
      />

      {/* Slip Upload Dialog */}
      <SlipUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        order={order}
        bankAccount={bankAccount}
        onSubmit={handleSubmitSlip}
      />
    </div>
  );
}
