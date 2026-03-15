"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Send,
  Users,
  MessageSquare,
  Plus,
  Search,
  X,
  Loader2,
  Calendar,
  Ban,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import CustomSelect from "@/components/ui/CustomSelect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import PageLayout, { PageHeader, FilterBar, PaginationBar } from "@/components/blocks/PageLayout";

/* ─── Types ─── */

type ScheduledStatus = "pending" | "sent" | "cancelled" | "failed";

type RecipientType = "contacts" | "groups" | "manual";

type ScheduledSmsApi = {
  id: string;
  senderName: string;
  recipient: string;
  content: string;
  scheduledAt: string;
  status: ScheduledStatus;
  creditCost: number;
  errorCode?: string;
  createdAt: string;
};

type ScheduledSms = {
  id: string;
  message: string;
  recipientCount: number;
  recipientType: RecipientType;
  recipientLabel: string;
  scheduledAt: string;
  status: ScheduledStatus;
  senderName: string;
  createdAt: string;
};

/* ─── Config ─── */

const STATUS_OPTIONS = [
  { value: "", label: "ทุกสถานะ" },
  { value: "pending", label: "รอส่ง" },
  { value: "sent", label: "ส่งแล้ว" },
  { value: "cancelled", label: "ยกเลิก" },
  { value: "failed", label: "ล้มเหลว" },
];

/* ─── Helpers ─── */

function StatusBadge({ status }: { status: ScheduledStatus }) {
  const config = {
    pending: {
      label: "รอส่ง",
      bg: "rgba(var(--warning-rgb),0.1)",
      border: "rgba(var(--warning-rgb),0.2)",
      color: "var(--warning)",
      icon: Clock,
    },
    sent: {
      label: "ส่งแล้ว",
      bg: "rgba(var(--success-rgb),0.1)",
      border: "rgba(var(--success-rgb),0.2)",
      color: "var(--success)",
      icon: CheckCircle,
    },
    cancelled: {
      label: "ยกเลิก",
      bg: "rgba(var(--error-rgb),0.1)",
      border: "rgba(var(--error-rgb),0.2)",
      color: "var(--error)",
      icon: XCircle,
    },
    failed: {
      label: "ล้มเหลว",
      bg: "rgba(var(--error-rgb),0.1)",
      border: "rgba(var(--error-rgb),0.2)",
      color: "var(--error)",
      icon: AlertTriangle,
    },
  }[status];

  const Icon = config.icon;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium"
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: config.color,
      }}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function formatScheduledDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("th-TH", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/* ─── Stat Card ─── */

function StatCard({
  icon,
  iconRgb,
  value,
  label,
}: {
  icon: React.ReactNode;
  iconRgb: string;
  value: string | number;
  label: string;
}) {
  return (
    <div
      className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4 min-w-[140px] snap-start shrink-0 sm:min-w-0"
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center"
          style={{ background: `rgba(${iconRgb},0.1)` }}
        >
          {icon}
        </div>
        <span className="text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-[0.04em]">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
        {value}
      </div>
    </div>
  );
}

/* ─── Main ─── */

export default function ScheduledSmsPage() {
  const [items, setItems] = useState<ScheduledSms[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [cancelTarget, setCancelTarget] = useState<ScheduledSms | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const fetchScheduled = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/sms/scheduled");
      if (!res.ok) throw new Error();
      const data = await res.json();
      const raw: ScheduledSmsApi[] = data.scheduled ?? data.data?.scheduled ?? (Array.isArray(data) ? data : []);
      setItems(
        raw.map((item) => ({
          id: item.id,
          message: item.content,
          recipientCount: item.recipient ? item.recipient.split(",").length : 1,
          recipientType: "manual" as RecipientType,
          recipientLabel: item.recipient ?? "—",
          scheduledAt: item.scheduledAt,
          status: item.status,
          senderName: item.senderName,
          createdAt: item.createdAt,
        }))
      );
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduled();
  }, [fetchScheduled]);

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const sentCount = items.filter((i) => i.status === "sent").length;
  const cancelledCount = items.filter((i) => i.status === "cancelled").length;

  const filtered = items.filter((item) => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (
      searchQuery &&
      !item.message.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.recipientLabel.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/v1/sms/scheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", id: cancelTarget.id }),
      });
      if (!res.ok) throw new Error();

      setItems((prev) =>
        prev.map((i) =>
          i.id === cancelTarget.id ? { ...i, status: "cancelled" as const } : i
        )
      );
      toast.success("ยกเลิก SMS สำเร็จ");
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  }

  return (
    <PageLayout>
      <PageHeader
        title="SMS ตั้งเวลา"
        count={items.length}
        actions={
          <Button
            onClick={() => setShowCreate(true)}
            className="gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)]"
          >
            <Plus className="w-4 h-4" /> ตั้งเวลาส่ง
          </Button>
        }
      />

      {/* Stats */}
      <div className="flex gap-3 overflow-x-auto snap-x pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar mb-4 sm:grid sm:grid-cols-3">
        <StatCard
          icon={<Clock className="w-4 h-4" style={{ color: "var(--warning)" }} />}
          iconRgb="var(--warning-rgb)"
          value={pendingCount}
          label="รอส่ง"
        />
        <StatCard
          icon={<CheckCircle className="w-4 h-4" style={{ color: "var(--success)" }} />}
          iconRgb="var(--success-rgb)"
          value={sentCount}
          label="ส่งแล้ว"
        />
        <StatCard
          icon={<XCircle className="w-4 h-4" style={{ color: "var(--error)" }} />}
          iconRgb="var(--error-rgb)"
          value={cancelledCount}
          label="ยกเลิก"
        />
      </div>

      {/* Filters */}
      <FilterBar>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <Input
            placeholder="ค้นหาข้อความ/ผู้รับ..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] focus:border-[var(--accent)]"
          />
        </div>
        <CustomSelect
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          placeholder="สถานะ"
        />
      </FilterBar>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
          <span className="text-[13px] text-[var(--text-muted)]">กำลังโหลด...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 rounded-lg bg-[var(--bg-muted)] flex items-center justify-center">
            <Calendar className="w-7 h-7 text-[var(--text-muted)]" />
          </div>
          <p className="text-[15px] font-medium text-[var(--text-primary)]">
            ยังไม่มี SMS ตั้งเวลา
          </p>
          <p className="text-[13px] text-[var(--text-muted)]">
            กดปุ่ม &quot;ตั้งเวลาส่ง&quot; เพื่อสร้าง SMS ตั้งเวลาแรก
          </p>
          <Button
            onClick={() => setShowCreate(true)}
            className="gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] mt-2"
          >
            <Plus className="w-4 h-4" /> ตั้งเวลาส่ง
          </Button>
        </div>
      ) : (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden">
          <table className="nansen-table nansen-table-dense w-full">
            <thead>
              <tr>
                <th className="text-left">ข้อความ</th>
                <th className="text-center">ผู้รับ</th>
                <th className="text-left">เวลาส่ง</th>
                <th className="text-center">สถานะ</th>
                <th className="text-left">ชื่อผู้ส่ง</th>
                <th className="w-[80px]" />
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="!text-center !py-12">
                    <span className="text-[13px] text-[var(--text-muted)]">
                      ไม่พบข้อมูลที่ตรงกับตัวกรอง
                    </span>
                  </td>
                </tr>
              ) : (
                paged.map((item) => (
                  <tr key={item.id} className="group">
                    <td className="max-w-[300px]">
                      <p className="text-[13px] text-[var(--text-primary)] truncate">
                        {item.message}
                      </p>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span className="text-[13px] font-medium text-[var(--text-primary)] tabular-nums">
                          {item.recipientCount.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span className="text-[13px] text-[var(--text-secondary)]">
                          {formatScheduledDate(item.scheduledAt)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex justify-center">
                        <StatusBadge status={item.status} />
                      </div>
                    </td>
                    <td>
                      <span className="text-[13px] text-[var(--text-secondary)]">
                        {item.senderName}
                      </span>
                    </td>
                    <td>
                      {item.status === "pending" && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setCancelTarget(item)}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[rgba(var(--error-rgb),0.08)] transition-all"
                            title="ยกเลิก"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

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
        </div>
      )}

      {/* Cancel Dialog */}
      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={() => !cancelling && setCancelTarget(null)}
      >
        <AlertDialogContent className="bg-[var(--bg-surface)] border-[var(--border-default)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[var(--text-primary)]">
              ยกเลิก SMS ตั้งเวลา?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--text-muted)]">
              SMS นี้จะไม่ถูกส่งตามเวลาที่กำหนด การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          {cancelTarget && (
            <div
              className="p-3 rounded-lg my-2 text-[12px]"
              style={{
                background: "var(--bg-base)",
                border: "1px solid var(--border-default)",
              }}
            >
              <p className="text-[var(--text-primary)] mb-1 line-clamp-2">
                &quot;{cancelTarget.message}&quot;
              </p>
              <p className="text-[var(--text-muted)]">
                ผู้รับ {cancelTarget.recipientCount} คน · {formatScheduledDate(cancelTarget.scheduledAt)}
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={cancelling}
              className="border-[var(--border-default)] text-[var(--text-secondary)]"
            >
              ไม่ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-[var(--error)] hover:bg-[var(--error)]/90 text-white"
            >
              {cancelling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "ยืนยันยกเลิก"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Dialog */}
      <CreateScheduledSmsDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          fetchScheduled();
        }}
      />
    </PageLayout>
  );
}

/* ─── Create Scheduled SMS Dialog ─── */

function CreateScheduledSmsDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [message, setMessage] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [recipientType, setRecipientType] = useState<RecipientType>("manual");
  const [manualNumbers, setManualNumbers] = useState("");
  const [senderName, setSenderName] = useState("");
  const [creating, setCreating] = useState(false);

  const charCount = message.length;
  const smsCount = charCount === 0 ? 0 : Math.ceil(charCount / 70);
  const recipientCount =
    recipientType === "manual"
      ? manualNumbers
          .split(/[\n,;]+/)
          .filter((n) => n.trim().length >= 9).length
      : 0;

  async function handleCreate() {
    if (!message.trim() || !scheduledDate || !scheduledTime) {
      toast.error("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    setCreating(true);
    try {
      const scheduledAt = new Date(
        `${scheduledDate}T${scheduledTime}:00+07:00`
      ).toISOString();

      const numbers =
        recipientType === "manual"
          ? manualNumbers
              .split(/[\n,;]+/)
              .map((n) => n.trim())
              .filter((n) => n.length >= 9)
          : [];

      const res = await fetch("/api/v1/sms/scheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: senderName.trim() || "SMSOK",
          to: numbers.join(","),
          message: message.trim(),
          scheduledAt,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success("สร้าง SMS ตั้งเวลาสำเร็จ");
      setMessage("");
      setScheduledDate("");
      setScheduledTime("");
      setManualNumbers("");
      setSenderName("");
      onCreated();
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !creating && !v && onClose()}>
      <DialogContent className="bg-[var(--bg-surface)] border-[var(--border-default)] max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[var(--text-primary)] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--accent)]" />
            ตั้งเวลาส่ง SMS
          </DialogTitle>
          <DialogDescription className="text-[var(--text-muted)]">
            ตั้งเวลาส่ง SMS ล่วงหน้า (เวลาไทย GMT+7)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Message */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)] block mb-1.5">
              ข้อความ <span className="text-[var(--error)]">*</span>
            </label>
            <Textarea
              placeholder="พิมพ์ข้อความ SMS..."
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] resize-none"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[11px] text-[var(--text-muted)]">
                {charCount} ตัวอักษร · {smsCount} SMS
              </span>
            </div>
          </div>

          {/* Schedule Date/Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)] block mb-1.5">
                วันที่ <span className="text-[var(--error)]">*</span>
              </label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)] block mb-1.5">
                เวลา (Asia/Bangkok) <span className="text-[var(--error)]">*</span>
              </label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] focus:border-[var(--accent)]"
              />
            </div>
          </div>

          {/* Recipient Type */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)] block mb-1.5">
              ผู้รับ
            </label>
            <CustomSelect
              value={recipientType}
              onChange={(v) => setRecipientType(v as RecipientType)}
              options={[
                { value: "manual", label: "พิมพ์เบอร์เอง" },
                { value: "contacts", label: "เลือกจากรายชื่อ" },
                { value: "groups", label: "เลือกจากกลุ่ม" },
              ]}
              placeholder="เลือกวิธีระบุผู้รับ"
            />
          </div>

          {/* Manual Numbers */}
          {recipientType === "manual" && (
            <div>
              <Textarea
                placeholder={"เบอร์โทร (คั่นด้วย Enter หรือ ,)\n0891234567\n0898765432"}
                rows={3}
                value={manualNumbers}
                onChange={(e) => setManualNumbers(e.target.value)}
                className="bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] resize-none font-mono text-[13px]"
              />
              {recipientCount > 0 && (
                <p className="text-[11px] text-[var(--accent)] mt-1">
                  {recipientCount} เบอร์
                </p>
              )}
            </div>
          )}

          {recipientType !== "manual" && (
            <p className="text-[12px] text-[var(--text-muted)] text-center py-4 bg-[var(--bg-base)] rounded-lg border border-[var(--border-default)]">
              เร็วๆ นี้ — เลือกจาก{recipientType === "contacts" ? "รายชื่อ" : "กลุ่ม"}จะพร้อมใช้เมื่อ API พร้อม
            </p>
          )}

          {/* Sender Name */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)] block mb-1.5">
              ชื่อผู้ส่ง
            </label>
            <Input
              placeholder="SMSOK (ค่าเริ่มต้น)"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              maxLength={11}
              className="bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={creating}
            className="border-[var(--border-default)] text-[var(--text-secondary)]"
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating || !message.trim() || !scheduledDate || !scheduledTime}
            className="gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)]"
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" /> ตั้งเวลาส่ง
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
