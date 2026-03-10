"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import CustomSelect from "@/components/ui/CustomSelect";

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
  sent:      { badge: "bg-cyan-500/10 text-cyan-400",    label: "ส่งแล้ว",   dot: "bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.4)]" },
  pending:   { badge: "bg-yellow-500/10 text-yellow-400", label: "รอส่ง",    dot: "bg-yellow-400 shadow-[0_0_6px_rgba(245,158,11,0.4)]" },
  failed:    { badge: "bg-red-500/10 text-red-400",      label: "ล้มเหลว",   dot: "bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.4)]" },
};

/** Heuristic: numeric 4-8 digit content = OTP */
function detectType(content: string): "OTP" | "SMS" {
  return /^\d{4,8}$/.test(content.trim()) ? "OTP" : "SMS";
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const rowVariant = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export default function MessagesClient({
  messages,
  pagination,
  initialSearch,
}: {
  messages: Message[];
  pagination: Pagination;
  initialSearch?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch ?? "");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filtered = messages.filter((msg) => {
    const matchSearch =
      !search ||
      msg.recipient.includes(search) ||
      msg.content.toLowerCase().includes(search.toLowerCase()) ||
      msg.senderName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || msg.status === statusFilter;
    const matchType = typeFilter === "all" || detectType(msg.content) === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`?${params.toString()}`);
  }

  const { page, limit, total, totalPages } = pagination;
  const showingFrom = Math.min((page - 1) * limit + 1, total);
  const showingTo   = Math.min(page * limit, total);

  return (
    <motion.div
      className="p-6 md:p-8 max-w-7xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight gradient-text-mixed">ประวัติการส่ง</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            ประวัติการส่ง SMS ทั้งหมด ({total} รายการ)
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link href="/dashboard/send" className="btn-primary px-5 py-2.5 text-sm rounded-xl inline-flex items-center gap-2">
            ส่ง SMS
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            className="input-glass pl-10"
            placeholder="ค้นหาเบอร์โทร, ข้อความ, ชื่อผู้ส่ง..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <CustomSelect
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: "all", label: "ทุกประเภท" },
            { value: "SMS", label: "SMS" },
            { value: "OTP", label: "OTP" },
          ]}
          className="min-w-[120px]"
        />
        <CustomSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all",       label: "ทุกสถานะ" },
            { value: "delivered", label: "ส่งสำเร็จ" },
            { value: "sent",      label: "ส่งแล้ว" },
            { value: "pending",   label: "รอส่ง" },
            { value: "failed",    label: "ล้มเหลว" },
          ]}
          className="min-w-[140px]"
        />
      </motion.div>

      <AnimatePresence mode="wait">
        {filtered.length > 0 ? (
          <motion.div key="table" className="glass overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <th className="text-left px-4 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium whitespace-nowrap">วันที่/เวลา</th>
                    <th className="text-left px-4 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">ผู้รับ</th>
                    <th className="text-left px-4 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium hidden md:table-cell">เนื้อหา</th>
                    <th className="text-left px-4 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">ประเภท</th>
                    <th className="text-left px-4 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium hidden md:table-cell">ช่องทาง</th>
                    <th className="text-left px-4 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium hidden lg:table-cell">Sender</th>
                    <th className="text-right px-4 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium whitespace-nowrap">ราคา</th>
                    <th className="text-left px-4 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">สถานะ</th>
                  </tr>
                </thead>
                <motion.tbody variants={stagger} initial="hidden" animate="show">
                  {filtered.map((msg) => {
                    const status = statusConfig[msg.status] ?? statusConfig.pending;
                    const msgType = detectType(msg.content);
                    return (
                      <motion.tr key={msg.id} variants={rowVariant} className="table-row group">
                        {/* วันที่/เวลา */}
                        <td className="px-4 py-3.5 text-[var(--text-muted)] text-xs whitespace-nowrap">
                          {new Date(msg.createdAt).toLocaleString("th-TH", {
                            year: "2-digit",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        {/* ผู้รับ */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status.dot}`} />
                            <span className="text-slate-200 font-mono text-xs">{msg.recipient}</span>
                          </div>
                        </td>
                        {/* เนื้อหา */}
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <span className="text-[var(--text-secondary)] text-xs truncate block max-w-[200px]" title={msg.content}>
                            {msg.content.length > 40 ? `${msg.content.slice(0, 40)}...` : msg.content}
                          </span>
                        </td>
                        {/* ประเภท */}
                        <td className="px-4 py-3.5">
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            msgType === "OTP"
                              ? "bg-violet-500/10 text-violet-400"
                              : "bg-blue-500/10 text-blue-400"
                          }`}>
                            {msgType}
                          </span>
                        </td>
                        {/* ช่องทาง — placeholder "เว็บ" จนกว่า backend จะ migrate schema */}
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-500/15 text-zinc-400">
                            เว็บ
                          </span>
                        </td>
                        {/* Sender */}
                        <td className="px-4 py-3.5 text-[var(--text-secondary)] text-xs hidden lg:table-cell">{msg.senderName}</td>
                        {/* ราคา */}
                        <td className="px-4 py-3.5 text-right">
                          <span className="text-[var(--text-secondary)] font-mono text-xs">฿{msg.creditCost}</span>
                        </td>
                        {/* สถานะ */}
                        <td className="px-4 py-3.5">
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md ${status.badge}`}>
                            {status.label}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </motion.tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="border-t border-[var(--border-subtle)] px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
              {/* Showing X-Y of Z */}
              <span>
                {search || statusFilter !== "all"
                  ? `กรอง: พบ ${filtered.length} รายการ จากหน้านี้ (${showingFrom}–${showingTo} จาก ${total} ทั้งหมด)`
                  : `แสดง ${showingFrom}–${showingTo} จาก ${total} รายการ`}
              </span>

              {/* Prev / Next */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-violet-500/30 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
                    ก่อนหน้า
                  </button>

                  {/* Page numbers — show at most 5 */}
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let p: number;
                      if (totalPages <= 5) {
                        p = i + 1;
                      } else if (page <= 3) {
                        p = i + 1;
                      } else if (page >= totalPages - 2) {
                        p = totalPages - 4 + i;
                      } else {
                        p = page - 2 + i;
                      }
                      return (
                        <button
                          key={p}
                          onClick={() => goToPage(p)}
                          className={`w-7 h-7 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            p === page
                              ? "bg-violet-500/15 border border-violet-500/30 text-violet-300"
                              : "hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-slate-200"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                  <span className="sm:hidden text-[var(--text-muted)]">หน้า {page}/{totalPages}</span>

                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-violet-500/30 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    ถัดไป
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ) : messages.length > 0 ? (
          <motion.div key="no-results" className="glass p-12 text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-1">ไม่พบผลลัพธ์</p>
            <p className="text-xs text-[var(--text-muted)]">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
          </motion.div>
        ) : (
          <motion.div key="empty" className="glass p-12 text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-1">ยังไม่มีข้อความ</p>
            <p className="text-xs text-[var(--text-muted)] mb-5">ส่ง SMS แรกของคุณเลย</p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/dashboard/send" className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold">
                ส่ง SMS
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
