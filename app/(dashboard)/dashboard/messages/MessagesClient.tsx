"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  id: string;
  recipient: string;
  content: string;
  senderName: string;
  status: string;
  creditCost: number;
  createdAt: Date;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const statusConfig: Record<string, { badge: string; label: string; dot: string }> = {
  delivered: { badge: "bg-emerald-500/10 text-emerald-400", label: "ส่งสำเร็จ", dot: "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.4)]" },
  sent: { badge: "bg-cyan-500/10 text-cyan-400", label: "ส่งแล้ว", dot: "bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.4)]" },
  pending: { badge: "bg-yellow-500/10 text-yellow-400", label: "รอส่ง", dot: "bg-yellow-400 shadow-[0_0_6px_rgba(245,158,11,0.4)]" },
  failed: { badge: "bg-red-500/10 text-red-400", label: "ล้มเหลว", dot: "bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.4)]" },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const rowVariant = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export default function MessagesClient({
  messages,
  pagination,
}: {
  messages: Message[];
  pagination: Pagination;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = messages.filter((msg) => {
    const matchSearch =
      !search ||
      msg.recipient.includes(search) ||
      msg.content.toLowerCase().includes(search.toLowerCase()) ||
      msg.senderName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || msg.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <motion.div
      className="p-6 md:p-8 max-w-6xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight gradient-text-mixed">
            ประวัติการส่ง
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            ประวัติการส่ง SMS ทั้งหมด ({pagination.total} รายการ)
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link
            href="/dashboard/send"
            className="btn-primary px-5 py-2.5 text-sm rounded-xl inline-flex items-center gap-2"
          >
            ส่ง SMS
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </motion.div>
      </div>

      {/* Search & Filter */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3 mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <div className="relative flex-1">
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            className="input-glass pl-10"
            placeholder="ค้นหาเบอร์โทร, ข้อความ, ชื่อผู้ส่ง..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <select
            className="input-glass cursor-pointer appearance-none pr-10 min-w-[140px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all" className="bg-[var(--bg-elevated)] text-white">ทุกสถานะ</option>
            <option value="delivered" className="bg-[var(--bg-elevated)] text-white">ส่งสำเร็จ</option>
            <option value="sent" className="bg-[var(--bg-elevated)] text-white">ส่งแล้ว</option>
            <option value="pending" className="bg-[var(--bg-elevated)] text-white">รอส่ง</option>
            <option value="failed" className="bg-[var(--bg-elevated)] text-white">ล้มเหลว</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {filtered.length > 0 ? (
          <motion.div
            key="table"
            className="glass overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">ผู้รับ</th>
                    <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium hidden md:table-cell">ข้อความ</th>
                    <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">ชื่อผู้ส่ง</th>
                    <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">สถานะ</th>
                    <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">เครดิต</th>
                    <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">วันที่</th>
                  </tr>
                </thead>
                <motion.tbody variants={stagger} initial="hidden" animate="show">
                  {filtered.map((msg) => {
                    const status = statusConfig[msg.status] || statusConfig.pending;
                    return (
                      <motion.tr
                        key={msg.id}
                        variants={rowVariant}
                        className="table-row group"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${status.dot}`} />
                            <span className="text-slate-200 font-mono text-xs">{msg.recipient}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-[var(--text-muted)] text-xs max-w-[200px] truncate hidden md:table-cell">{msg.content}</td>
                        <td className="px-5 py-3.5 text-[var(--text-secondary)] text-xs">{msg.senderName}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md ${status.badge}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-[var(--text-secondary)] font-mono text-xs">฿{msg.creditCost}</td>
                        <td className="px-5 py-3.5 text-[var(--text-muted)] text-xs">
                          {new Date(msg.createdAt).toLocaleString("th-TH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </motion.tr>
                    );
                  })}
                </motion.tbody>
              </table>
            </div>

            {/* Result count */}
            <div className="border-t border-[var(--border-subtle)] px-5 py-3 flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>
                {search || statusFilter !== "all"
                  ? `พบ ${filtered.length} จาก ${messages.length} รายการ`
                  : `หน้า ${pagination.page} จาก ${pagination.totalPages}`}
              </span>
              <span>{pagination.total} ข้อความทั้งหมด</span>
            </div>
          </motion.div>
        ) : messages.length > 0 ? (
          <motion.div
            key="no-results"
            className="glass p-12 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-1">ไม่พบผลลัพธ์</p>
            <p className="text-xs text-[var(--text-muted)]">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            className="glass p-12 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-1">ยังไม่มีข้อความ</p>
            <p className="text-xs text-[var(--text-muted)] mb-5">ส่ง SMS แรกของคุณเลย</p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/dashboard/send"
                className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
              >
                ส่ง SMS
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
