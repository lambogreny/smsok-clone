"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Radio,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Plus,
  MoreHorizontal,
  Info,
  Send,
  Calendar,
  Hash,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { formatThaiDateOnly } from "@/lib/format-thai-date";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import { Skeleton } from "@/components/skeletons/Skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CustomSelect from "@/components/ui/CustomSelect";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Sender {
  id: string;
  name: string;
  type: "general" | "otp" | "marketing";
  status: "APPROVED" | "PENDING" | "REJECTED";
  smsSent: number;
  createdAt: string;
  approvedAt?: string | null;
  rejectNote?: string | null;
  note?: string | null;
}

interface Quota {
  used: number;
  limit: number;
  packageName: string;
}

interface SendersResponse {
  senders: Sender[];
  quota: Quota;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const STATUS_CONFIG = {
  approved: {
    label: "อนุมัติแล้ว",
    color: "var(--success)",
    bg: "var(--success-bg)",
    dot: "bg-[var(--success)]",
  },
  pending: {
    label: "รออนุมัติ",
    color: "var(--warning)",
    bg: "var(--warning-bg)",
    dot: "bg-[var(--warning)]",
  },
  rejected: {
    label: "ถูกปฏิเสธ",
    color: "var(--error)",
    bg: "var(--danger-bg)",
    dot: "bg-[var(--error)]",
  },
} as const;

const TYPE_CONFIG = {
  general: {
    label: "ทั่วไป",
    color: "var(--text-muted)",
    bg: "rgba(var(--text-muted-rgb,107,112,117),0.08)",
  },
  otp: {
    label: "OTP",
    color: "var(--info)",
    bg: "var(--info-bg)",
  },
  marketing: {
    label: "การตลาด",
    color: "var(--accent)",
    bg: "rgba(var(--accent-rgb),0.08)",
  },
} as const;

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "approved", label: "อนุมัติแล้ว" },
  { value: "pending", label: "รออนุมัติ" },
  { value: "rejected", label: "ถูกปฏิเสธ" },
];

const TYPE_OPTIONS = [
  { value: "general", label: "ทั่วไป" },
  { value: "otp", label: "OTP" },
  { value: "marketing", label: "การตลาด" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SendersPage() {
  const router = useRouter();
  // ---- State ----
  const [senders, setSenders] = useState<Sender[]>([]);
  const [quota, setQuota] = useState<Quota>({ used: 0, limit: 0, packageName: "" });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Add form
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("general");
  const [newNote, setNewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ---- Fetch ----
  const fetchSenders = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/senders");
      if (!res.ok) throw new Error("fetch failed");
      const data: SendersResponse = await res.json();
      setSenders(data.senders);
      setQuota(data.quota);
    } catch {
      toast.error("ไม่สามารถโหลดข้อมูลชื่อผู้ส่งได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSenders();
  }, [fetchSenders]);

  // ---- Derived ----
  const filtered = senders.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.status.toLowerCase() === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    total: senders.length,
    approved: senders.filter((s) => s.status === "APPROVED").length,
    pending: senders.filter((s) => s.status === "PENDING").length,
    rejected: senders.filter((s) => s.status === "REJECTED").length,
  };

  const quotaPercent = quota.limit > 0 ? (quota.used / quota.limit) * 100 : 0;

  // ---- Handlers ----
  async function handleAddSender() {
    if (!newName.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/senders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), type: newType, note: newNote.trim() }),
      });
      if (!res.ok) throw new Error("create failed");
      setDialogOpen(false);
      setNewName("");
      setNewType("general");
      setNewNote("");
      await fetchSenders();
    } catch {
      toast.error("ไม่สามารถเพิ่มชื่อผู้ส่งได้ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    const ok = window.confirm(`ต้องการลบชื่อผู้ส่ง "${name}" ?`);
    if (!ok) return;
    try {
      const res = await fetch(`/api/v1/senders/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      if (expandedId === id) setExpandedId(null);
      await fetchSenders();
    } catch {
      toast.error("ไม่สามารถลบชื่อผู้ส่งได้ กรุณาลองใหม่");
    }
  }

  // ---- Loading skeleton ----
  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-6xl">
        <Skeleton className="h-8 w-48 rounded-lg mb-2" />
        <Skeleton className="h-4 w-72 rounded-lg mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-10 w-full max-w-sm rounded-lg mb-4" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  // ---- Empty state (no senders at all) ----
  if (senders.length === 0) {
    return (
      <div className="p-6 md:p-8 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">ชื่อผู้ส่ง</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">จัดการชื่อผู้ส่ง SMS ของคุณ</p>
        </div>
        <EmptyState
          icon={Radio}
          iconColor="var(--accent)"
          iconBg="rgba(var(--accent-rgb),0.08)"
          iconBorder="rgba(var(--accent-rgb),0.15)"
          title="ยังไม่มีชื่อผู้ส่ง"
          description={"เพิ่มชื่อผู้ส่งเพื่อเริ่มส่ง SMS\nชื่อผู้ส่งจะแสดงเป็นชื่อที่ผู้รับเห็น"}
          ctaLabel="เพิ่มชื่อผู้ส่ง"
          ctaAction={() => setDialogOpen(true)}
          helpLabel="วิธีตั้งชื่อผู้ส่งที่ดี"
          helpAction={() => router.push("/dashboard/docs/senders")}
        />
      </div>
    );
  }

  // ---- Render ----
  return (
    <div className="p-6 md:p-8 max-w-6xl">
      {/* ========== Page Header ========== */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            ชื่อผู้ส่ง
            <span
              className="text-xs font-medium rounded-full px-2.5 py-0.5"
              style={{ color: "var(--text-muted)", background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
            >
              {counts.total}
            </span>
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            จัดการชื่อผู้ส่ง SMS ของคุณ — ยื่นขอ ตรวจสอบสถานะ และลบชื่อที่ไม่ใช้แล้ว
          </p>
        </div>
        <Button
          size="lg"
          className="gap-1.5"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="size-4" />
          เพิ่มชื่อผู้ส่ง
        </Button>
      </div>

      {/* ========== Stat Cards ========== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {/* Total */}
        <div
          className="rounded-lg p-4"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[rgba(var(--text-muted-rgb,107,112,117),0.08)]">
              <Radio className="size-4" style={{ color: "var(--text-muted)" }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{counts.total}</p>
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">ทั้งหมด</p>
            </div>
          </div>
        </div>

        {/* Active */}
        <div
          className="rounded-lg p-4"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderLeft: "3px solid var(--success)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--success-bg)" }}>
              <CheckCircle2 className="size-4" style={{ color: "var(--success)" }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "var(--success)" }}>{counts.approved}</p>
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Active</p>
            </div>
          </div>
        </div>

        {/* Pending */}
        <div
          className="rounded-lg p-4"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderLeft: "3px solid var(--warning)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--warning-bg)" }}>
              <Clock className="size-4" style={{ color: "var(--warning)" }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "var(--warning)" }}>{counts.pending}</p>
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">รออนุมัติ</p>
            </div>
          </div>
        </div>

        {/* Rejected */}
        <div
          className="rounded-lg p-4"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderLeft: "3px solid var(--error)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--danger-bg)" }}>
              <XCircle className="size-4" style={{ color: "var(--error)" }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "var(--error)" }}>{counts.rejected}</p>
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">ถูกปฏิเสธ</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========== Quota Bar ========== */}
      {quota.limit > 0 && (
        <div
          className="rounded-lg p-4 mb-6 flex items-center gap-4"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--text-primary)] font-medium">
                ชื่อผู้ส่งที่ใช้ {quota.used}/{quota.limit}
              </span>
              <span className="text-xs text-[var(--text-muted)]">{quota.packageName}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-base)" }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(quotaPercent, 100)}%`,
                  background: quotaPercent > 90 ? "var(--error)" : quotaPercent > 70 ? "var(--warning)" : "var(--accent)",
                }}
              />
            </div>
          </div>
          {quotaPercent > 70 && (
            <Button
              variant="outline"
              size="sm"
              className="h-[28px] text-xs flex-shrink-0"
            >
              อัปเกรด
            </Button>
          )}
        </div>
      )}

      {/* ========== Filter Bar ========== */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <div className="relative w-full sm:w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อผู้ส่ง..."
            className="h-[36px] pl-9 text-sm"
          />
        </div>
        <CustomSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_FILTER_OPTIONS}
          placeholder="สถานะ"
          className="w-44"
        />
      </div>

      {/* ========== Senders Table ========== */}
      <div
        className="rounded-lg overflow-hidden mb-6"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--table-header, rgba(255,255,255,0.02))" }}>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider font-medium text-[var(--text-muted)]">
                  ชื่อผู้ส่ง
                </th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider font-medium text-[var(--text-muted)]">
                  ประเภท
                </th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider font-medium text-[var(--text-muted)]">
                  สถานะ
                </th>
                <th className="text-right px-5 py-3 text-xs uppercase tracking-wider font-medium text-[var(--text-muted)]">
                  SMS ส่ง
                </th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider font-medium text-[var(--text-muted)]">
                  สร้างเมื่อ
                </th>
                <th className="text-right px-5 py-3 text-xs uppercase tracking-wider font-medium text-[var(--text-muted)]">
                  จัดการ
                </th>
              </tr>
            </thead>
            {filtered.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={6} className="text-center py-14">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-lg flex items-center justify-center" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
                      <Radio className="size-6 text-[var(--text-muted)]" />
                    </div>
                    <p className="text-sm text-[var(--text-primary)] mb-1">ไม่พบชื่อผู้ส่ง</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {search || statusFilter !== "all"
                        ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง"
                        : "เพิ่มชื่อผู้ส่งเพื่อเริ่มใช้งาน"}
                    </p>
                  </td>
                </tr>
              </tbody>
            ) : (
              filtered.map((sender) => {
                const sc = STATUS_CONFIG[sender.status.toLowerCase() as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
                const tc = TYPE_CONFIG[sender.type?.toLowerCase() as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.general;
                const isExpanded = expandedId === sender.id;

                return (
                  <tbody key={sender.id}>
                    <tr
                        className="border-t border-[var(--border-default)] cursor-pointer transition-colors hover:bg-white/[0.02]"
                        onClick={() => setExpandedId(isExpanded ? null : sender.id)}
                      >
                        {/* Name */}
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-[var(--text-primary)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            {sender.name}
                          </span>
                        </td>

                        {/* Type badge */}
                        <td className="px-5 py-3.5">
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{ color: tc.color, background: tc.bg }}
                          >
                            {tc.label}
                          </span>
                        </td>

                        {/* Status badge */}
                        <td className="px-5 py-3.5">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{ color: sc.color, background: sc.bg }}
                          >
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.label}
                          </span>
                        </td>

                        {/* SMS sent */}
                        <td className="px-5 py-3.5 text-right text-[var(--text-primary)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {(sender.smsSent ?? 0).toLocaleString()}
                        </td>

                        {/* Created */}
                        <td className="px-5 py-3.5 text-[var(--text-muted)] text-xs">
                          {formatThaiDateOnly(sender.createdAt)}
                        </td>

                        {/* Kebab */}
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center w-[28px] h-[28px] rounded-lg transition-colors hover:bg-white/[0.06] text-[var(--text-muted)]"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(sender.id, sender.name);
                            }}
                            title="ลบ"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </td>
                      </tr>

                      {/* ========== Expanded Row ========== */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="p-0">
                            <div className="px-5 py-5" style={{ background: "var(--table-alt-row)" }}>
                              {/* Mini stat cards */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                <div
                                  className="rounded-lg p-3 flex items-center gap-3"
                                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                                >
                                  <Send className="size-4 text-[var(--accent)]" />
                                  <div>
                                    <p className="text-lg font-bold text-[var(--text-primary)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                                      {(sender.smsSent ?? 0).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)]">SMS ส่งแล้ว</p>
                                  </div>
                                </div>
                                <div
                                  className="rounded-lg p-3 flex items-center gap-3"
                                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                                >
                                  <Calendar className="size-4 text-[var(--text-muted)]" />
                                  <div>
                                    <p className="text-sm font-medium text-[var(--text-primary)]">
                                      {formatThaiDateOnly(sender.createdAt)}
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)]">วันที่สร้าง</p>
                                  </div>
                                </div>
                                <div
                                  className="rounded-lg p-3 flex items-center gap-3"
                                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                                >
                                  <Hash className="size-4 text-[var(--text-muted)]" />
                                  <div>
                                    <p className="text-sm font-medium text-[var(--text-primary)]">
                                      {tc.label}
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)]">ประเภท</p>
                                  </div>
                                </div>
                              </div>

                              {/* Metadata */}
                              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[var(--text-muted)] mb-4">
                                {sender.approvedAt && (
                                  <span>อนุมัติเมื่อ: {formatThaiDateOnly(sender.approvedAt)}</span>
                                )}
                                {sender.rejectNote && (
                                  <span>เหตุผลที่ปฏิเสธ: {sender.rejectNote}</span>
                                )}
                                {sender.note && (
                                  <span>หมายเหตุ: {sender.note}</span>
                                )}
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-[28px] gap-1.5 text-xs"
                                  onClick={() => handleDelete(sender.id, sender.name)}
                                >
                                  <Trash2 className="size-3.5" />
                                  ลบ
                                </Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  );
                })
              )}
          </table>
        </div>
      </div>

      {/* ========== Info Banner ========== */}
      <div
        className="rounded-lg p-4 flex items-start gap-3"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderLeft: "3px solid var(--accent)",
        }}
      >
        <Info className="size-4 flex-shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
        <div>
          <p className="text-sm text-[var(--text-primary)] font-medium mb-1">
            เกี่ยวกับการอนุมัติชื่อผู้ส่ง
          </p>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            ชื่อผู้ส่ง SMS ต้องผ่านการตรวจสอบจาก กสทช. ก่อนใช้งานจริง
            โดยปกติใช้เวลา 1-3 วันทำการ ชื่อที่ไม่เหมาะสมหรือละเมิดข้อกำหนดจะถูกปฏิเสธ
          </p>
        </div>
      </div>

      {/* ========== Add Sender Dialog ========== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>เพิ่มชื่อผู้ส่งใหม่</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Name */}
            <div>
              <label className="text-xs font-medium text-[var(--text-primary)] mb-1.5 block">
                ชื่อผู้ส่ง
              </label>
              <div className="relative">
                <Input
                  value={newName}
                  onChange={(e) => {
                    if (e.target.value.length <= 11) setNewName(e.target.value);
                  }}
                  placeholder="เช่น MyBrand"
                  maxLength={11}
                  className="h-[36px] text-sm pr-12"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">
                  {newName.length}/11
                </span>
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="text-xs font-medium text-[var(--text-primary)] mb-1.5 block">
                ประเภท
              </label>
              <CustomSelect
                value={newType}
                onChange={setNewType}
                options={TYPE_OPTIONS}
                placeholder="เลือกประเภท"
              />
            </div>

            {/* Note */}
            <div>
              <label className="text-xs font-medium text-[var(--text-primary)] mb-1.5 block">
                หมายเหตุ (ไม่บังคับ)
              </label>
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="อธิบายการใช้งาน เช่น ส่ง OTP สำหรับยืนยันตัวตน"
                rows={3}
                className="text-sm"
              />
            </div>

            {/* Warning */}
            <div
              className="rounded-lg p-3 flex items-start gap-2.5"
              style={{ background: "var(--warning-bg)", border: "1px solid rgba(250,205,99,0.12)" }}
            >
              <AlertTriangle className="size-4 flex-shrink-0 mt-0.5" style={{ color: "var(--warning)" }} />
              <p className="text-xs leading-relaxed" style={{ color: "var(--warning)" }}>
                ชื่อผู้ส่งต้องผ่านการอนุมัติก่อนใช้งาน โดยปกติใช้เวลา 1-3 วันทำการ
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                className=""
                onClick={() => setDialogOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button
                size="sm"
                className="h-[36px] gap-1.5"
                onClick={handleAddSender}
                disabled={!newName.trim() || submitting}
              >
                {submitting ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                {submitting ? "กำลังส่ง..." : "ยื่นคำขอ"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
