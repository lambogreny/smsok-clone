"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Send,
  Loader2,
  Headphones,
  User,
  Paperclip,
  Clock,
  XCircle,
  Tag,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import ErrorState from "@/app/components/ui/ErrorState";
import { formatThaiDateOnly, formatThaiTime, formatThaiDate } from "@/lib/format-thai-date";

// ---------- Types ----------
type Reply = {
  id: string;
  content: string;
  senderType: "CUSTOMER" | "AGENT";
  createdAt: string;
  attachments?: { fileName: string; fileUrl: string }[];
};

type Ticket = {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  replies: Reply[];
};

// ---------- Status / Priority config ----------
const statusConfig: Record<string, { cls: string; label: string }> = {
  OPEN: { cls: "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)]", label: "เปิด" },
  IN_PROGRESS: { cls: "bg-[rgba(var(--info-rgb),0.1)] text-[var(--info)]", label: "กำลังดำเนินการ" },
  AWAITING_RESPONSE: { cls: "bg-[rgba(var(--warning-rgb),0.1)] text-[var(--warning)]", label: "รอตอบกลับ" },
  RESOLVED: { cls: "bg-[rgba(var(--success-rgb),0.1)] text-[var(--success)]", label: "แก้ไขแล้ว" },
  CLOSED: { cls: "bg-white/5 text-[var(--text-muted)]", label: "ปิดแล้ว" },
};

const priorityConfig: Record<string, { cls: string; label: string }> = {
  LOW: { cls: "bg-white/5 text-[var(--text-muted)]", label: "ต่ำ" },
  MEDIUM: { cls: "bg-[rgba(var(--info-rgb),0.1)] text-[var(--info)]", label: "ปานกลาง" },
  HIGH: { cls: "bg-[rgba(var(--warning-rgb),0.1)] text-[var(--warning)]", label: "สูง" },
  URGENT: { cls: "bg-[rgba(var(--error-rgb),0.1)] text-[var(--error)]", label: "เร่งด่วน" },
};

// ---------- Skeleton ----------
function TicketDetailSkeleton() {
  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header skeleton */}
      <div className="shrink-0 p-4 sm:p-6 border-b border-[var(--border-default)]">
        <div className="skeleton h-4 w-24 rounded mb-4" />
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="skeleton h-6 w-64 rounded mb-3" />
            <div className="flex gap-2">
              <div className="skeleton h-5 w-16 rounded-full" />
              <div className="skeleton h-5 w-20 rounded-full" />
              <div className="skeleton h-5 w-16 rounded-full" />
            </div>
          </div>
          <div className="skeleton h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* Description skeleton */}
      <div className="shrink-0 mx-4 sm:mx-6 mt-4">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div className="skeleton h-3 w-20 rounded mb-3" />
          <div className="space-y-2">
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-4 w-1/2 rounded" />
          </div>
        </div>
      </div>

      {/* Replies skeleton */}
      <div className="flex-1 overflow-hidden mx-4 sm:mx-6 mt-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
            <div className="flex gap-3 max-w-[75%]">
              <div className="skeleton h-8 w-8 rounded-full shrink-0" />
              <div className="space-y-2">
                <div className="skeleton h-16 w-56 rounded-lg" />
                <div className="skeleton h-3 w-24 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Composer skeleton */}
      <div className="shrink-0 p-4 sm:p-6 border-t border-[var(--border-default)]">
        <div className="skeleton h-20 w-full rounded-lg mb-3" />
        <div className="skeleton h-10 w-32 rounded-lg ml-auto" />
      </div>
    </div>
  );
}

// ---------- Main Component ----------
export default function TicketDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);

  const [closing, setClosing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const repliesEndRef = useRef<HTMLDivElement>(null);
  const repliesContainerRef = useRef<HTMLDivElement>(null);

  // Fetch ticket
  const fetchTicket = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/v1/tickets/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setTicket(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  // Auto-scroll to bottom on new replies
  useEffect(() => {
    if (ticket?.replies) {
      repliesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [ticket?.replies]);

  // Send reply
  async function handleSendReply() {
    if (!replyContent.trim() || sending || !id) return;
    setSending(true);
    try {
      const res = await fetch(`/api/v1/tickets/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent.trim() }),
      });
      if (!res.ok) throw new Error("Failed to send");
      const data = await res.json();
      setTicket((prev) =>
        prev ? { ...prev, replies: [...prev.replies, data] } : prev
      );
      setReplyContent("");
    } catch (err) {
      toast.error("ส่งข้อความไม่สำเร็จ", {
        description: err instanceof Error ? err.message : "กรุณาลองใหม่",
      });
    } finally {
      setSending(false);
    }
  }

  // Close ticket
  async function handleCloseTicket() {
    if (closing || !id) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/v1/tickets/${id}/close`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Failed to close");
      const data = await res.json();
      setTicket((prev) => (prev ? { ...prev, status: data.status } : prev));
      setConfirmClose(false);
    } catch (err) {
      toast.error("ปิดตั๋วไม่สำเร็จ", {
        description: err instanceof Error ? err.message : "กรุณาลองใหม่",
      });
    } finally {
      setClosing(false);
    }
  }

  // Handle Ctrl+Enter to send
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSendReply();
    }
  }

  // ---------- Render states ----------
  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <TicketDetailSkeleton />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <ErrorState
          title="ไม่พบตั๋วนี้"
          description="ตั๋วที่คุณกำลังมองหาอาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง"
          onRetry={fetchTicket}
        />
        <Link
          href="/dashboard/support"
          className="mt-6 text-sm text-[var(--accent)] hover:underline inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          กลับหน้ารายการตั๋ว
        </Link>
      </div>
    );
  }

  const status = statusConfig[ticket.status] || statusConfig.OPEN;
  const priority = priorityConfig[ticket.priority] || priorityConfig.LOW;
  const isClosed = ticket.status === "CLOSED";
  const isInProgress = ticket.status === "IN_PROGRESS";
  const canReply = !isClosed && !isInProgress;

  return (
    <div className="h-full flex flex-col">
      {/* ===== Header ===== */}
      <motion.div
        className="shrink-0 p-4 sm:p-6 border-b border-[var(--border-default)]"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Back link */}
        <Link
          href="/dashboard/support"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          กลับหน้ารายการตั๋ว
        </Link>

        <div className="flex flex-wrap items-start gap-3 justify-between">
          <div className="flex-1 min-w-0">
            {/* Subject */}
            <h1 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] truncate mb-2">
              {ticket.subject}
            </h1>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status badge */}
              <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-md font-semibold uppercase tracking-wider ${status.cls}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {status.label}
              </span>

              {/* Priority badge */}
              <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-md font-semibold uppercase tracking-wider ${priority.cls}`}>
                <AlertTriangle size={10} />
                {priority.label}
              </span>

              {/* Category badge */}
              <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-md font-semibold uppercase tracking-wider bg-white/5 text-[var(--text-secondary)]">
                <Tag size={10} />
                {ticket.category}
              </span>

              {/* Created date */}
              <span className="text-[10px] text-[var(--text-muted)] inline-flex items-center gap-1">
                <Clock size={10} />
                {formatThaiDateOnly(ticket.createdAt)}
              </span>
            </div>
          </div>

          {/* Close ticket button */}
          {!isClosed && (
            <motion.button
              onClick={() => setConfirmClose(true)}
              className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--error)] hover:border-red-500/30 hover:bg-red-500/[0.05] transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <XCircle size={14} />
              ปิดตั๋ว
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* ===== Description card ===== */}
      <motion.div
        className="shrink-0 mx-4 sm:mx-6 mt-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-2">
            รายละเอียด
          </p>
          <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
            {ticket.description}
          </p>
        </div>
      </motion.div>

      {/* ===== Replies / Conversation ===== */}
      <div
        ref={repliesContainerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 scrollbar-thin"
      >
        {ticket.replies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
              <Headphones size={20} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              ยังไม่มีข้อความตอบกลับ
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              ทีมงานจะตอบกลับโดยเร็วที่สุด
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {ticket.replies.map((reply, idx) => {
            const isUser = reply.senderType === "CUSTOMER";
            return (
              <motion.div
                key={reply.id}
                className={`flex ${isUser ? "justify-start" : "justify-end"}`}
                initial={{ opacity: 0, y: 15, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25, delay: idx < 20 ? idx * 0.03 : 0 }}
              >
                <div
                  className={`flex gap-2.5 max-w-[85%] sm:max-w-[75%] ${
                    isUser ? "flex-row" : "flex-row-reverse"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isUser
                        ? "bg-[rgba(var(--accent-rgb),0.15)] text-[var(--accent)]"
                        : "bg-[rgba(var(--info-rgb),0.15)] text-[var(--info)]"
                    }`}
                  >
                    {isUser ? <User size={14} /> : <Headphones size={14} />}
                  </div>

                  {/* Bubble */}
                  <div className="flex flex-col gap-1">
                    <div
                      className={`rounded-lg px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? "bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-tl-md"
                          : "bg-[rgba(var(--info-rgb),0.1)] border border-[rgba(var(--info-rgb),0.15)] text-[var(--text-primary)] rounded-tr-md"
                      }`}
                    >
                      {reply.content}
                    </div>

                    {/* Attachments */}
                    {reply.attachments && reply.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {reply.attachments.map((att, i) => (
                          <a
                            key={i}
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-[var(--accent)] bg-[rgba(var(--accent-rgb),0.08)] hover:bg-[rgba(var(--accent-rgb),0.15)] border border-[rgba(var(--accent-rgb),0.15)] rounded-md px-2 py-1 transition-colors"
                          >
                            <Paperclip size={10} />
                            {att.fileName}
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Timestamp */}
                    <span
                      className={`text-[10px] text-[var(--text-muted)] ${
                        isUser ? "text-left" : "text-right"
                      }`}
                    >
                      {formatThaiDate(reply.createdAt)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <div ref={repliesEndRef} />
      </div>

      {/* ===== Reply Composer ===== */}
      {canReply ? (
        <motion.div
          className="shrink-0 p-4 sm:p-6 border-t border-[var(--border-default)] bg-[var(--bg-base)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="relative">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="พิมพ์ข้อความตอบกลับ..."
              rows={3}
              disabled={sending}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[rgba(var(--accent-rgb),0.4)] focus:ring-1 focus:ring-[rgba(var(--accent-rgb),0.2)] transition-all disabled:opacity-50"
            />
          </div>

          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] text-[var(--text-muted)]">
              Ctrl+Enter เพื่อส่ง
            </span>

            <motion.button
              onClick={handleSendReply}
              disabled={!replyContent.trim() || sending}
              className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              whileHover={{ scale: sending ? 1 : 1.02 }}
              whileTap={{ scale: sending ? 1 : 0.98 }}
            >
              {sending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  กำลังส่ง...
                </>
              ) : (
                <>
                  <Send size={14} />
                  ส่งข้อความ
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <div className="shrink-0 p-4 sm:p-6 border-t border-[var(--border-default)] bg-[var(--bg-base)]">
          <div className="flex items-center justify-center gap-2 py-3 text-sm text-[var(--text-muted)]">
            <XCircle size={14} />
            {isClosed
              ? "ตั๋วนี้ถูกปิดแล้ว ไม่สามารถส่งข้อความเพิ่มได้"
              : "ตั๋วอยู่ระหว่างดำเนินการ กรุณารอเจ้าหน้าที่ตอบกลับ"}
          </div>
        </div>
      )}

      {/* ===== Confirm Close Dialog ===== */}
      <ConfirmDialog
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={handleCloseTicket}
        title="ปิดตั๋วนี้?"
        description="เมื่อปิดแล้วคุณจะไม่สามารถส่งข้อความเพิ่มเติมได้ คุณแน่ใจหรือไม่?"
        confirmLabel="ปิดตั๋ว"
        cancelLabel="ยกเลิก"
        variant="warning"
        loading={closing}
      />
    </div>
  );
}
