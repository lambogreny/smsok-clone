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
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  ORDER_STATUS_CONFIG,
  BANK_ACCOUNT,
} from "@/types/order";
import { formatBaht } from "@/types/purchase";

// ── Countdown Timer (Hero) ──

function CountdownTimer({
  expiresAt,
}: {
  expiresAt: string;
}) {
  const [hours, setHours] = useState(0);
  const [mins, setMins] = useState(0);
  const [secs, setSecs] = useState(0);
  const [pct, setPct] = useState(100);
  const [isExpired, setIsExpired] = useState(false);
  const [urgency, setUrgency] = useState<"calm" | "warning" | "urgent">(
    "calm"
  );

  useEffect(() => {
    const target = new Date(expiresAt).getTime();
    const totalMs = 24 * 60 * 60 * 1000; // 24hr window

    function update() {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setIsExpired(true);
        setHours(0);
        setMins(0);
        setSecs(0);
        setPct(0);
        return;
      }

      setHours(Math.floor(diff / (1000 * 60 * 60)));
      setMins(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
      setSecs(Math.floor((diff % (1000 * 60)) / 1000));
      setPct(Math.max(0, (diff / totalMs) * 100));

      if (diff < 60 * 60 * 1000) setUrgency("urgent");
      else if (diff < 6 * 60 * 60 * 1000) setUrgency("warning");
      else setUrgency("calm");
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const barColor =
    urgency === "urgent"
      ? "var(--error)"
      : urgency === "warning"
        ? "var(--warning)"
        : "var(--accent)";

  if (isExpired) {
    return (
      <div
        className="rounded-lg p-6 text-center"
        style={{
          background: "var(--danger-bg)",
          border: "1px solid rgba(var(--error-rgb), 0.2)",
        }}
      >
        <p className="text-lg font-bold" style={{ color: "var(--error)" }}>
          คำสั่งซื้อหมดอายุแล้ว
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg p-6 text-center"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
        ⏱️ หมดอายุใน
      </p>
      <div className="flex items-center justify-center gap-2">
        {[
          { val: hours, label: "ชั่วโมง" },
          { val: mins, label: "นาที" },
          { val: secs, label: "วินาที" },
        ].map((item, i) => (
          <div key={item.label} className="flex items-center gap-2">
            {i > 0 && (
              <span
                className="text-2xl font-light"
                style={{ color: "var(--text-muted)" }}
              >
                :
              </span>
            )}
            <div className="text-center">
              <span
                className="text-[30px] font-bold font-mono tabular-nums"
                style={{
                  color: "var(--text-primary)",
                  animation:
                    urgency === "urgent"
                      ? "pulse 2s infinite"
                      : undefined,
                }}
              >
                {String(item.val).padStart(2, "0")}
              </span>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {item.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div
        className="mt-4 h-1.5 rounded-full overflow-hidden"
        style={{ background: "var(--bg-elevated)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
    </div>
  );
}

// ── Status Badge ──

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = ORDER_STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ color: config.color, backgroundColor: config.bgColor }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: config.dot }}
      />
      {config.label}
    </span>
  );
}

// ── Upload Zone ──

function UploadZone({
  file,
  preview,
  onFileSelect,
  onClear,
  label,
  required,
  accept,
  maxSizeMB,
}: {
  file: File | null;
  preview: string | null;
  onFileSelect: (file: File, preview: string) => void;
  onClear: () => void;
  label: string;
  required?: boolean;
  accept?: string;
  maxSizeMB?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const maxSize = (maxSizeMB ?? 5) * 1024 * 1024;

  function handleFile(f: File) {
    if (f.size > maxSize) {
      toast.error(`ไฟล์ใหญ่เกิน ${maxSizeMB ?? 5}MB`);
      return;
    }
    const url = URL.createObjectURL(f);
    onFileSelect(f, url);
  }

  if (file && preview) {
    return (
      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          background: "var(--bg-base)",
          border: "1px solid var(--border-default)",
        }}
      >
        {file.type.startsWith("image/") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="preview"
            className="w-full max-h-64 object-contain"
          />
        ) : (
          <div className="flex items-center gap-3 p-4">
            <FileText size={24} style={{ color: "var(--accent)" }} />
            <div>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                {file.name}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {(file.size / 1024).toFixed(0)} KB
              </p>
            </div>
          </div>
        )}
        <button
          className="absolute top-2 right-2 p-1 rounded-md"
          style={{ background: "var(--bg-elevated)" }}
          onClick={onClear}
        >
          <X size={14} style={{ color: "var(--text-muted)" }} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg p-8 text-center cursor-pointer transition-all"
      style={{
        background: isDragging
          ? "rgba(var(--accent-rgb), 0.03)"
          : "var(--bg-base)",
        border: isDragging
          ? "2px dashed var(--accent)"
          : "2px dashed var(--border-default)",
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
        if (f) handleFile(f);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept ?? "image/*"}
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <Upload
        size={32}
        className="mx-auto mb-3"
        style={{ color: "var(--text-muted)" }}
      />
      <p className="text-sm" style={{ color: "var(--text-primary)" }}>
        {label}
      </p>
      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
        ลากวาง หรือ คลิกเลือกไฟล์
      </p>
      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
        JPG, PNG{accept?.includes("pdf") ? ", PDF" : ""} — สูงสุด{" "}
        {maxSizeMB ?? 5}MB
      </p>
      {required && (
        <p className="text-xs mt-2" style={{ color: "var(--error)" }}>
          * จำเป็น
        </p>
      )}
    </div>
  );
}

// ── Confetti ──

function Confetti() {
  const colors = ["var(--accent)", "#FFD700", "#FF6B6B", "#4ECDC4"];
  const [particles] = useState(() =>
    Array.from({ length: 50 }, (_, i) => ({
      left: Math.random() * 100,
      duration: 1.5 + Math.random(),
      delay: Math.random() * 0.5,
      rotate: Math.random() * 360,
      drift: (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 40),
      color: colors[i % colors.length],
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            background: p.color,
            left: `${p.left}%`,
            top: "-10%",
            opacity: 0,
            animation: `confetti-fall-${i} ${p.duration}s ease-out ${p.delay}s forwards`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
      <style>
        {particles
          .map(
            (p, i) => `
        @keyframes confetti-fall-${i} {
          0% { top: -10%; opacity: 1; transform: rotate(0deg) translateX(0); }
          100% { top: 100%; opacity: 0; transform: rotate(720deg) translateX(${p.drift}px); }
        }
      `
          )
          .join("")}
      </style>
    </div>
  );
}

// ── Result Screens ──

function VerifiedScreen({ order }: { order: Order }) {
  const router = useRouter();
  return (
    <>
      <Confetti />
      <div className="text-center py-8">
        <div
          className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center animate-in zoom-in-50 duration-300"
          style={{ background: "rgba(var(--accent-rgb), 0.1)" }}
        >
          <CheckCircle2 size={32} style={{ color: "var(--accent)" }} />
        </div>
        <h2
          className="text-xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          ตรวจสอบสำเร็จ!
        </h2>
        <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
          แพ็กเกจ {order.package_name} เปิดใช้งานแล้ว
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--accent)" }}>
          SMS เพิ่ม: {order.sms_count.toLocaleString()} ข้อความ
        </p>

        {/* Documents */}
        <div
          className="mt-6 rounded-lg p-4 text-left"
          style={{
            background: "var(--bg-base)",
            border: "1px solid var(--border-default)",
          }}
        >
          <p
            className="text-sm font-medium mb-3 flex items-center gap-2"
            style={{ color: "var(--text-primary)" }}
          >
            <FileText size={16} style={{ color: "var(--accent)" }} />
            เอกสาร
          </p>
          {order.invoice_number && (
            <div className="flex items-center justify-between py-2">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                ใบกำกับภาษี
              </span>
              <Button variant="ghost" size="sm" disabled title="รอเปิดใช้งาน">
                <Download size={14} /> PDF
              </Button>
            </div>
          )}
          {order.quotation_number && (
            <div className="flex items-center justify-between py-2">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                ใบเสนอราคา
              </span>
              <Button variant="ghost" size="sm" disabled title="รอเปิดใช้งาน">
                <Download size={14} /> PDF
              </Button>
            </div>
          )}
        </div>

        <Button
          className="mt-6 w-full"
          onClick={() => router.push("/dashboard")}
          style={{
            background: "var(--accent)",
            color: "var(--bg-base)",
          }}
        >
          กลับหน้า Dashboard
        </Button>
      </div>
    </>
  );
}

function PendingReviewScreen({ order }: { order: Order }) {
  const router = useRouter();
  return (
    <div className="text-center py-8">
      <div
        className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
        style={{ background: "rgba(245,158,11,0.1)" }}
      >
        <Clock size={32} style={{ color: "var(--warning)" }} />
      </div>
      <h2
        className="text-xl font-bold"
        style={{ color: "var(--text-primary)" }}
      >
        รอตรวจสอบจากเจ้าหน้าที่
      </h2>
      <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
        สลิปไม่สามารถตรวจสอบอัตโนมัติได้
      </p>
      <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
        เจ้าหน้าที่จะตรวจสอบภายใน 30 นาที (จันทร์-ศุกร์ 9:00-18:00)
      </p>
      <div
        className="mt-4 rounded-lg p-3 text-sm"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
        }}
      >
        <span style={{ color: "var(--text-muted)" }}>คำสั่งซื้อ: </span>
        <span
          className="font-mono font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          #{order.order_number}
        </span>
      </div>
      <Button
        className="mt-6 w-full"
        variant="outline"
        onClick={() => router.push("/dashboard")}
      >
        กลับหน้า Dashboard
      </Button>
    </div>
  );
}

// ── Main Order Summary Page ──

export default function OrderSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resultView, setResultView] = useState<
    "verifying" | "verified" | "pending_review" | null
  >(null);

  // Slip upload state
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [whtFile, setWhtFile] = useState<File | null>(null);
  const [whtPreview, setWhtPreview] = useState<string | null>(null);

  // Fetch order
  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/orders/${orderId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch order");
      const data = await res.json();
      setOrder(data);

      // If already completed/verified, show result
      if (
        data.status === "COMPLETED" ||
        data.status === "VERIFIED" ||
        data.status === "APPROVED"
      ) {
        setResultView("verified");
      } else if (data.status === "PENDING_REVIEW") {
        setResultView("pending_review");
      }
    } catch {
      toast.error("ไม่สามารถโหลดคำสั่งซื้อได้");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Cleanup previews
  useEffect(() => {
    return () => {
      if (slipPreview) URL.revokeObjectURL(slipPreview);
      if (whtPreview) URL.revokeObjectURL(whtPreview);
    };
  }, [slipPreview, whtPreview]);

  // Copy bank account
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(
        BANK_ACCOUNT.accountNumber.replace(/-/g, "")
      );
      setCopied(true);
      toast.success("คัดลอกเลขบัญชีแล้ว");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("ไม่สามารถคัดลอกได้");
    }
  }

  // Cancel order
  async function handleCancel() {
    if (!order) return;
    try {
      const res = await fetch(`/api/v1/orders/${order.id}/cancel`, {
        method: "POST",
        credentials: "include",
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

  // Submit payment
  async function handleSubmitPayment() {
    if (!slipFile || !order) return;
    setSubmitting(true);
    setResultView("verifying");

    try {
      const formData = new FormData();
      formData.append("slip", slipFile);
      if (whtFile) formData.append("wht_cert", whtFile);

      const res = await fetch(`/api/v1/orders/${order.id}/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (
          data.status === "VERIFIED" ||
          data.status === "COMPLETED" ||
          data.status === "APPROVED"
        ) {
          setOrder((o) => (o ? { ...o, ...data } : o));
          setResultView("verified");
        } else if (data.status === "PENDING_REVIEW" || data.status === "SLIP_UPLOADED") {
          setOrder((o) => (o ? { ...o, ...data } : o));
          setResultView("pending_review");
        } else {
          setOrder((o) => (o ? { ...o, ...data } : o));
          setResultView("pending_review");
        }
      } else {
        // 4xx/5xx error — show toast, stay on upload state
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error || errData.message || "อัปโหลดไม่สำเร็จ กรุณาลองใหม่";
        toast.error(errMsg);
        setResultView(null);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
      setResultView(null);
    } finally {
      setSubmitting(false);
    }
  }

  // Loading
  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-6xl animate-fade-in-up">
        <div className="space-y-4">
          <div
            className="h-32 rounded-lg animate-pulse"
            style={{ background: "var(--bg-surface)" }}
          />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-4">
              <div
                className="h-40 rounded-lg animate-pulse"
                style={{ background: "var(--bg-surface)" }}
              />
              <div
                className="h-60 rounded-lg animate-pulse"
                style={{ background: "var(--bg-surface)" }}
              />
            </div>
            <div className="lg:col-span-2">
              <div
                className="h-64 rounded-lg animate-pulse"
                style={{ background: "var(--bg-surface)" }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 md:p-8 max-w-6xl text-center py-16">
        <p style={{ color: "var(--text-muted)" }}>ไม่พบคำสั่งซื้อ</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/dashboard/billing/orders")}
        >
          กลับรายการคำสั่งซื้อ
        </Button>
      </div>
    );
  }

  // Result views
  if (resultView === "verifying") {
    return (
      <div className="p-6 md:p-8 max-w-lg mx-auto">
        <div
          className="rounded-lg p-6"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div className="text-center py-12">
            <Loader2
              size={48}
              className="mx-auto animate-spin mb-4"
              style={{ color: "var(--accent)" }}
            />
            <p
              className="text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              กำลังตรวจสอบสลิป...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (resultView === "verified") {
    return (
      <div className="p-6 md:p-8 max-w-lg mx-auto">
        <div
          className="rounded-lg p-6"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <VerifiedScreen order={order} />
        </div>
      </div>
    );
  }

  if (resultView === "pending_review") {
    return (
      <div className="p-6 md:p-8 max-w-lg mx-auto">
        <div
          className="rounded-lg p-6"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <PendingReviewScreen order={order} />
        </div>
      </div>
    );
  }

  const isExpiredOrCancelled =
    order.status === "EXPIRED" || order.status === "CANCELLED";

  return (
    <div className="p-6 md:p-8 max-w-6xl animate-fade-in-up">
      {/* Step Indicator — Step 3 */}
      <div className="mb-6">
        <Link
          href="/dashboard/billing/orders"
          className="inline-flex items-center gap-1 text-xs mb-4 transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={14} />
          คำสั่งซื้อทั้งหมด
        </Link>
      </div>

      {/* Order Header + Timer */}
      <div
        className="rounded-lg p-6 mb-6"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1
              className="text-lg font-bold font-mono"
              style={{ color: "var(--text-primary)" }}
            >
              คำสั่งซื้อ #{order.order_number}
            </h1>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {order.status === "PENDING" && (
          <CountdownTimer expiresAt={order.expires_at} />
        )}
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* Order Details */}
          <div
            className="rounded-lg p-5"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
            }}
          >
            <h3
              className="text-sm font-semibold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              รายละเอียดคำสั่งซื้อ
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>แพ็กเกจ</span>
                <span style={{ color: "var(--text-primary)" }}>
                  {order.package_name} — {order.sms_count.toLocaleString()} SMS
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>ออกเอกสาร</span>
                <span style={{ color: "var(--text-primary)" }}>
                  {order.tax_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>Tax ID</span>
                <span
                  className="font-mono"
                  style={{ color: "var(--text-primary)" }}
                >
                  {order.tax_id}
                </span>
              </div>
            </div>

            {order.quotation_number && (
              <span
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium"
                style={{ color: "var(--text-muted)" }}
                title="รอเปิดใช้งาน — backend กำลังพัฒนา"
              >
                <FileText size={14} />
                ใบเสนอราคา {order.quotation_number}
              </span>
            )}
          </div>

          {/* Bank Account */}
          {!isExpiredOrCancelled && (
            <div>
              <h3
                className="text-sm font-semibold mb-3"
                style={{ color: "var(--text-primary)" }}
              >
                โอนเงินไปที่
              </h3>
              <div
                className="rounded-lg p-5"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Landmark
                    size={18}
                    style={{ color: BANK_ACCOUNT.bankColor }}
                  />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {BANK_ACCOUNT.bankName}
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      ชื่อบัญชี
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {BANK_ACCOUNT.accountName}
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      เลขที่บัญชี
                    </p>
                    <div className="flex items-center justify-between">
                      <p
                        className="text-lg font-bold font-mono tracking-wider"
                        style={{ color: "var(--accent)" }}
                      >
                        {BANK_ACCOUNT.accountNumber}
                      </p>
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        {copied ? (
                          <Check size={14} />
                        ) : (
                          <Copy size={14} />
                        )}
                        {copied ? "คัดลอกแล้ว" : "คัดลอก"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount Warning */}
              <div
                className="mt-3 flex items-start gap-2 rounded-lg p-3"
                style={{
                  background: "rgba(245,158,11,0.05)",
                  border: "1px solid rgba(245,158,11,0.15)",
                }}
              >
                <AlertTriangle
                  size={14}
                  className="shrink-0 mt-0.5"
                  style={{ color: "var(--warning)" }}
                />
                <p className="text-xs" style={{ color: "var(--warning)" }}>
                  กรุณาโอนยอดตรง ฿{formatBaht(order.pay_amount)}{" "}
                  เพื่อให้ตรวจสอบอัตโนมัติแม่นยำ
                </p>
              </div>
            </div>
          )}

          {/* Slip Upload */}
          {order.status === "PENDING" && (
            <div className="space-y-4">
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                โอนเสร็จแล้ว? แนบหลักฐาน
              </h3>

              <div>
                <p className="text-sm mb-2" style={{ color: "var(--text-primary)" }}>
                  สลิปโอนเงิน{" "}
                  <span style={{ color: "var(--error)" }}>*</span>
                </p>
                <UploadZone
                  file={slipFile}
                  preview={slipPreview}
                  onFileSelect={(f, p) => {
                    setSlipFile(f);
                    setSlipPreview(p);
                  }}
                  onClear={() => {
                    setSlipFile(null);
                    setSlipPreview(null);
                  }}
                  label="อัปโหลดสลิปโอนเงิน"
                  required
                />
              </div>

              {order.has_wht && (
                <div>
                  <p
                    className="text-sm mb-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    ใบ 50 ทวิ (ถ้าหัก WHT)
                  </p>
                  <UploadZone
                    file={whtFile}
                    preview={whtPreview}
                    onFileSelect={(f, p) => {
                      setWhtFile(f);
                      setWhtPreview(p);
                    }}
                    onClear={() => {
                      setWhtFile(null);
                      setWhtPreview(null);
                    }}
                    label="อัปโหลดใบ 50 ทวิ"
                    accept="image/*,.pdf"
                    maxSizeMB={10}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4">
                <AlertDialog>
                  <AlertDialogTrigger
                    className="inline-flex items-center justify-center rounded-lg border border-[var(--border-default)] px-4 h-10 text-sm font-medium transition-colors hover:bg-[var(--bg-elevated)]"
                    style={{ color: "var(--error)" }}
                  >
                    ยกเลิกคำสั่งซื้อ
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        ยกเลิกคำสั่งซื้อ #{order.order_number}?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        คำสั่งซื้อที่ยกเลิกแล้วจะไม่สามารถกู้คืนได้
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>ไม่ ย้อนกลับ</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancel}
                        className="bg-[var(--error)] text-white hover:bg-[var(--error)]/90"
                      >
                        ยกเลิก
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button
                  onClick={handleSubmitPayment}
                  disabled={!slipFile || submitting}
                  className="h-11 px-6"
                  style={
                    slipFile
                      ? {
                          background: "var(--accent)",
                          color: "var(--bg-base)",
                        }
                      : undefined
                  }
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      กำลังตรวจสอบ...
                    </>
                  ) : (
                    "ยืนยันการชำระ →"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Rejected state */}
          {order.status === "REJECTED" && (
            <div
              className="rounded-lg p-4"
              style={{
                background: "var(--danger-bg)",
                border: "1px solid rgba(var(--error-rgb), 0.2)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <XCircle size={16} style={{ color: "var(--error)" }} />
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--error)" }}
                >
                  ไม่ผ่านการตรวจสอบ
                </span>
              </div>
              {order.reject_reason && (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  เหตุผล: {order.reject_reason}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Panel — Price Summary */}
        <div className="lg:col-span-2">
          <div
            className="sticky top-20 rounded-lg p-6"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
            }}
          >
            <h3
              className="text-sm font-semibold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              สรุปยอด
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-[13px]">
                <span style={{ color: "var(--text-muted)" }}>ราคาแพ็กเกจ</span>
                <span
                  className="font-mono tabular-nums"
                  style={{ color: "var(--text-primary)" }}
                >
                  ฿{formatBaht(order.net_amount)}
                </span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span style={{ color: "var(--text-muted)" }}>VAT 7%</span>
                <span
                  className="font-mono tabular-nums"
                  style={{ color: "var(--text-primary)" }}
                >
                  ฿{formatBaht(order.vat_amount)}
                </span>
              </div>
              <div
                className="flex justify-between pt-2 mt-2"
                style={{ borderTop: "1px dashed var(--border-default)" }}
              >
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  รวมทั้งสิ้น
                </span>
                <span
                  className="text-sm font-semibold font-mono tabular-nums"
                  style={{ color: "var(--text-primary)" }}
                >
                  ฿{formatBaht(order.total_amount)}
                </span>
              </div>
              {order.has_wht && (
                <div className="flex justify-between text-[13px]">
                  <span style={{ color: "var(--error)" }}>หัก WHT 3%</span>
                  <span
                    className="font-mono tabular-nums"
                    style={{ color: "var(--error)" }}
                  >
                    -฿{formatBaht(order.wht_amount)}
                  </span>
                </div>
              )}
              <div
                className="flex justify-between pt-2 mt-2"
                style={{ borderTop: "1px dashed var(--border-default)" }}
              >
                <span
                  className="text-base font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  ยอดที่ต้องโอน
                </span>
                <span
                  className="text-base font-bold font-mono tabular-nums"
                  style={{ color: "var(--accent)" }}
                >
                  ฿{formatBaht(order.pay_amount)}
                </span>
              </div>
            </div>

            {/* Documents */}
            <div
              className="mt-5 pt-4 space-y-2"
              style={{ borderTop: "1px solid var(--border-default)" }}
            >
              <p
                className="text-xs font-medium mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                เอกสาร
              </p>
              {order.quotation_number && (
                <span
                  className="flex items-center gap-2 text-xs"
                  style={{ color: "var(--text-muted)" }}
                  title="รอเปิดใช้งาน"
                >
                  <Download size={12} />
                  ใบเสนอราคา {order.quotation_number}
                </span>
              )}
              {order.invoice_number && (
                <span
                  className="flex items-center gap-2 text-xs"
                  style={{ color: "var(--text-muted)" }}
                  title="รอเปิดใช้งาน"
                >
                  <Download size={12} />
                  ใบกำกับภาษี {order.invoice_number}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
