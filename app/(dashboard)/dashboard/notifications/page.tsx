"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, MessageSquare, CircleDollarSign, Check, CheckCheck, Loader2, Filter } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatThaiDateTimeShort } from "@/lib/format-thai-date";

type NotifType = "sms_success" | "sms_failed" | "topup" | "sender_approved" | "sender_rejected" | "security" | "system";
type FilterType = "all" | "unread" | "sms" | "billing" | "system";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

const FILTER_TABS: { value: FilterType; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "unread", label: "ยังไม่อ่าน" },
  { value: "sms", label: "SMS" },
  { value: "billing", label: "การเงิน" },
  { value: "system", label: "ระบบ" },
];

function getNotifIcon(type: NotifType) {
  switch (type) {
    case "sms_success":
    case "sms_failed":
      return MessageSquare;
    case "topup":
      return CircleDollarSign;
    case "sender_approved":
    case "sender_rejected":
      return Check;
    default:
      return Bell;
  }
}

function getNotifColor(type: NotifType) {
  switch (type) {
    case "sms_success":
    case "sender_approved":
      return "bg-[rgba(var(--success-rgb),0.1)] text-[var(--success)]";
    case "sms_failed":
    case "sender_rejected":
      return "bg-[rgba(var(--error-rgb,239,68,68),0.1)] text-[var(--error)]";
    case "topup":
      return "bg-[rgba(var(--accent-secondary-rgb,50,152,218),0.1)] text-[var(--accent-secondary)]";
    default:
      return "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)]";
  }
}

function getNotifTypeLabel(type: NotifType) {
  switch (type) {
    case "sms_success": return "ส่งสำเร็จ";
    case "sms_failed": return "ส่งไม่สำเร็จ";
    case "topup": return "เติมเงิน";
    case "sender_approved": return "อนุมัติ Sender";
    case "sender_rejected": return "ปฏิเสธ Sender";
    case "security": return "ความปลอดภัย";
    case "system": return "ระบบ";
    default: return "แจ้งเตือน";
  }
}

function filterNotif(n: Notification, filter: FilterType): boolean {
  if (filter === "all") return true;
  if (filter === "unread") return !n.read;
  if (filter === "sms") return n.type === "sms_success" || n.type === "sms_failed";
  if (filter === "billing") return n.type === "topup";
  return n.type === "sender_approved" || n.type === "sender_rejected" || n.type === "security" || n.type === "system";
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const mapped: Notification[] = (data.notifications ?? data ?? []).map((n: Record<string, unknown>) => ({
        id: n.id as string,
        type: (n.type as NotifType) ?? "system",
        title: (n.title as string) ?? getNotifTypeLabel((n.type as NotifType) ?? "system"),
        message: n.message as string,
        createdAt: n.createdAt as string,
        read: n.read as boolean,
      }));
      setNotifs(mapped);
    } catch {
      // API not available — show empty state
      setNotifs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications/read", { method: "POST" });
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("อ่านทั้งหมดแล้ว");
    } catch {
      toast.error("ไม่สามารถอัปเดตได้");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      // silent
    }
  };

  const filtered = notifs.filter((n) => filterNotif(n, filter));
  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">การแจ้งเตือน</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {unreadCount > 0 ? `${unreadCount} รายการยังไม่อ่าน` : "ไม่มีรายการใหม่"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer bg-[rgba(var(--accent-rgb),0.08)] text-[var(--accent)] border border-[rgba(var(--accent-rgb),0.15)] hover:border-[rgba(var(--accent-rgb),0.3)] disabled:opacity-50"
          >
            {markingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
            อ่านทั้งหมด
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-5 p-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] overflow-x-auto">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer",
              filter === tab.value
                ? "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] border border-[rgba(var(--accent-rgb),0.2)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            {tab.label}
            {tab.value === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[var(--error)] text-[var(--text-primary)] text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-center justify-center mx-auto mb-4">
            {filter === "all" ? (
              <Bell className="w-7 h-7 text-[var(--text-muted)]" />
            ) : (
              <Filter className="w-7 h-7 text-[var(--text-muted)]" />
            )}
          </div>
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">
            {filter === "all" ? "ยังไม่มีการแจ้งเตือน" : "ไม่พบรายการ"}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {filter === "all"
              ? "เมื่อมีการอัปเดตเกี่ยวกับ SMS, ยอดเงิน หรือ Sender Name จะแสดงที่นี่"
              : "ลองเปลี่ยนตัวกรองดูใหม่"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const Icon = getNotifIcon(n.type);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => !n.read && handleMarkRead(n.id)}
                className={cn(
                  "w-full flex items-start gap-3 p-4 rounded-lg border transition-all text-left cursor-pointer",
                  n.read
                    ? "bg-[var(--bg-surface)] border-[var(--border-default)]"
                    : "bg-[var(--bg-elevated)] border-[rgba(var(--accent-rgb),0.15)] hover:border-[rgba(var(--accent-rgb),0.3)]"
                )}
              >
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5", getNotifColor(n.type))}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                      {getNotifTypeLabel(n.type)}
                    </span>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0" />}
                  </div>
                  <p className={cn(
                    "text-sm leading-relaxed",
                    n.read ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)] font-medium"
                  )}>
                    {n.message}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1.5">
                    {formatThaiDateTimeShort(n.createdAt)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
