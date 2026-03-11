"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CustomSelect from "@/components/ui/CustomSelect";
import { safeErrorMessage } from "@/lib/error-messages";

type CreditEntry = {
  id: string;
  createdAt: string;
  type: "TOPUP" | "SMS_SEND" | "REFUND";
  amount: number;
  balance: number;
  description: string;
};

type HistoryResponse = {
  entries: CreditEntry[];
  total: number;
};

const typeBadge: Record<CreditEntry["type"], { label: string; cls: string }> = {
  TOPUP:    { label: "เติมเครดิต", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  SMS_SEND: { label: "ส่ง SMS",    cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  REFUND:   { label: "คืนเครดิต", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const fadeUp  = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } } };

export default function CreditsPage() {
  const [entries, setEntries] = useState<CreditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | CreditEntry["type"]>("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo)   params.set("to",   dateTo);
      if (typeFilter) params.set("type", typeFilter);
      params.set("page",  String(page));
      params.set("limit", String(PAGE_SIZE));

      const res = await fetch(`/api/credits/history?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
      const data: HistoryResponse = await res.json();
      setEntries(data.entries ?? []);
      setTotal(data.total ?? 0);
      if (data.entries?.[0]?.balance != null && page === 1 && !dateFrom && !dateTo && !typeFilter) {
        setBalance(data.entries[0].balance);
      }
    } catch (e) {
      setError(safeErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, typeFilter, page]);

  // Fetch current balance on mount
  useEffect(() => {
    fetch("/api/credits/history?page=1&limit=1", { credentials: "include" })
      .then(r => r.json())
      .then((data: HistoryResponse) => { if (data.entries?.[0]) setBalance(data.entries[0].balance); })
      .catch(() => {});
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  function handleFilter() {
    setPage(1);
    fetchHistory();
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <motion.div className="p-4 md:p-8 max-w-[1280px] mx-auto" initial="hidden" animate="show" variants={stagger}>

        {/* Header */}
        <motion.div variants={fadeUp} className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight mb-1">
            <span className="gradient-text-mixed">ประวัติเครดิต</span>
          </h1>
          <p className="text-sm text-[var(--text-muted)]">รายการเติมเครดิต การส่ง SMS และการคืนเครดิตทั้งหมด</p>
        </motion.div>

        {/* Balance Card — Prepaid Style */}
        <motion.div variants={fadeUp} className="mb-6">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0d1117] via-[#161b22] to-[#0d1117] p-6 md:p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-[rgba(0,255,167,0.06)] via-transparent to-[rgba(50,152,218,0.06)]" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00FFA7] to-transparent" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium mb-2">ยอดเครดิตคงเหลือ</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl md:text-5xl font-bold text-white tabular-nums tracking-tight">
                    {balance != null ? `฿${balance.toLocaleString()}` : "—"}
                  </span>
                  <span className="text-sm text-[var(--text-muted)]">เครดิต</span>
                </div>
                {total > 0 && (
                  <p className="text-xs text-[var(--text-muted)] mt-2">{total.toLocaleString()} รายการทั้งหมด</p>
                )}
              </div>
              <motion.a
                href="/dashboard/topup"
                className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                เติมเครดิต
              </motion.a>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[var(--bg-elevated)]/80 p-4 mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-[rgba(0,255,167,0.02)] to-[rgba(50,152,218,0.02)]" />
          <div className="relative z-10 flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-[11px] text-[var(--text-muted)] mb-1.5 font-medium uppercase tracking-wider">ตั้งแต่วันที่</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input-glass text-sm py-2 px-3 w-[150px]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[var(--text-muted)] mb-1.5 font-medium uppercase tracking-wider">ถึงวันที่</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input-glass text-sm py-2 px-3 w-[150px]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[var(--text-muted)] mb-1.5 font-medium uppercase tracking-wider">ประเภท</label>
              <CustomSelect
                value={typeFilter}
                onChange={(v) => setTypeFilter(v as "" | CreditEntry["type"])}
                className="w-[160px]"
                options={[
                  { value: "", label: "ทุกประเภท" },
                  { value: "TOPUP", label: "เติมเครดิต" },
                  { value: "SMS_SEND", label: "ส่ง SMS" },
                  { value: "REFUND", label: "คืนเครดิต" },
                ]}
              />
            </div>
            <motion.button
              onClick={handleFilter}
              className="btn-gradient px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              ค้นหา
            </motion.button>
            {(dateFrom || dateTo || typeFilter) && (
              <button
                type="button"
                onClick={() => { setDateFrom(""); setDateTo(""); setTypeFilter(""); setPage(1); }}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors px-3 py-2"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </motion.div>

        {/* Table */}
        <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[var(--bg-elevated)]/80">
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(0,255,167,0.02)] to-transparent" />

          <div className="relative z-10">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_1.5fr] gap-x-4 px-5 py-3 border-b border-[var(--border-subtle)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              <span>วันเวลา</span>
              <span className="text-center">ประเภท</span>
              <span className="text-right">จำนวน</span>
              <span className="text-right">ยอดคงเหลือ</span>
              <span className="pl-4">รายละเอียด</span>
            </div>

            {/* Loading */}
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center justify-center py-16 gap-3"
                >
                  <svg className="animate-spin h-5 w-5 text-[#00FFA7]" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-sm text-[var(--text-muted)]">กำลังโหลด...</span>
                </motion.div>
              )}

              {!loading && error && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16 gap-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/10 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <p className="text-sm text-red-400">{error}</p>
                  <button type="button" onClick={fetchHistory} className="text-xs text-[#00FFA7] hover:text-[#4779FF] transition-colors">ลองใหม่</button>
                </motion.div>
              )}

              {!loading && !error && entries.length === 0 && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16 gap-3"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[rgba(0,255,167,0.1)] to-[rgba(50,152,218,0.05)] border border-[var(--border-subtle)] flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--text-muted)]">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">ยังไม่มีประวัติเครดิต</p>
                  <p className="text-xs text-[var(--text-muted)]">{dateFrom || dateTo || typeFilter ? "ลองเปลี่ยนตัวกรองวันที่หรือประเภท" : "รายการจะแสดงเมื่อมีการเติมเครดิตหรือส่ง SMS"}</p>
                </motion.div>
              )}

              {!loading && !error && entries.length > 0 && (
                <motion.div key="table" variants={stagger} initial="hidden" animate="show">
                  {entries.map((entry, i) => {
                    const badge = typeBadge[entry.type] ?? typeBadge.SMS_SEND;
                    const isPositive = entry.amount > 0;
                    return (
                      <motion.div
                        key={entry.id}
                        variants={fadeUp}
                        className={`grid grid-cols-[1fr_auto_auto_auto_1.5fr] gap-x-4 items-center px-5 py-3.5 border-b border-[var(--border-subtle)] hover:bg-white/[0.015] transition-colors group ${
                          i === entries.length - 1 ? "border-b-0" : ""
                        }`}
                      >
                        {/* Date */}
                        <span className="text-xs text-[var(--text-muted)] font-mono">{formatDate(entry.createdAt)}</span>

                        {/* Type Badge */}
                        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${badge.cls}`}>
                          {badge.label}
                        </span>

                        {/* Amount */}
                        <span className={`text-sm font-bold text-right font-mono tabular-nums ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                          {isPositive ? "+" : ""}{entry.amount.toLocaleString()}
                        </span>

                        {/* Balance */}
                        <span className="text-sm text-[var(--text-secondary)] text-right font-mono tabular-nums">
                          {entry.balance.toLocaleString()}
                        </span>

                        {/* Description */}
                        <span className="text-xs text-[var(--text-muted)] pl-4 truncate group-hover:text-[var(--text-secondary)] transition-colors">
                          {entry.description}
                        </span>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer: count + pagination */}
            {!loading && !error && total > 0 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-subtle)]">
                <span className="text-[11px] text-[var(--text-muted)]">ทั้งหมด {total.toLocaleString()} รายการ</span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-7 h-7 rounded-lg border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:border-[rgba(0,255,167,0.15)] hover:text-[#00FFA7] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs"
                    >
                      ‹
                    </button>
                    <span className="text-xs text-[var(--text-muted)] px-2">{page} / {totalPages}</span>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="w-7 h-7 rounded-lg border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:border-[rgba(0,255,167,0.15)] hover:text-[#00FFA7] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs"
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
    </motion.div>
  );
}
