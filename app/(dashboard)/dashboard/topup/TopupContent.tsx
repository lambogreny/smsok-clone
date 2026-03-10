"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "@/app/components/ui/EmptyState";
import { safeErrorMessage } from "@/lib/error-messages";

type Package = {
  id?: string;
  name: string;
  price: number;
  bonusPercent: number;
  totalCredits: number;
  maxSenders?: number;
  durationDays: number;
  isBestSeller?: boolean;
};

type User = {
  id: string;
  name: string;
  email: string;
  credits: number;
  role: string;
};

function formatPrice(satang: number): string {
  return (satang / 100).toLocaleString("th-TH");
}

function formatDuration(days: number): string {
  if (days >= 365) return `${Math.floor(days / 365)} ปี`;
  if (days >= 30) return `${Math.floor(days / 30)} เดือน`;
  return `${days} วัน`;
}

/* ── Slip Upload Section ── */
function SlipUploadSection({ userId }: { userId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File | null) {
    if (!f) return;
    setFile(f);
    setMessage(null);
    setStatus("idle");
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }

  async function handleSubmit() {
    if (!file) return;
    setStatus("loading");
    setMessage(null);
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = (e) => res((e.target?.result as string).split(",")[1] ?? "");
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const resp = await fetch("/api/topup/verify-slip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: base64 }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? "ไม่สามารถยืนยันได้");
      setStatus("success");
      setMessage("ยืนยันสำเร็จ! เครดิตถูกเพิ่มแล้ว");
      setCredits(data.creditsAdded ?? null);
    } catch (e) {
      setStatus("error");
      setMessage(safeErrorMessage(e));
    }
  }

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[var(--bg-elevated)]/80 backdrop-blur-xl p-6 mb-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.03] via-transparent to-cyan-500/[0.03]" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/15 to-cyan-500/10 border border-violet-500/10 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
              <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold gradient-text-mixed">วิธีเติมเครดิต</h2>
            <p className="text-[11px] text-[var(--text-muted)]">โอนเงินแล้วแนบสลิปเพื่อรับเครดิตทันที</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bank Details */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">บัญชีรับโอน</p>

            <div className="rounded-xl bg-[var(--bg-surface)]/60 border border-[var(--border-subtle)] p-4 space-y-3">
              {/* Bank */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">ธนาคาร</span>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white">S</span>
                  </div>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">ไทยพาณิชย์ (SCB)</span>
                </div>
              </div>
              {/* Account Number */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">เลขบัญชี</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText("4078240476")}
                  className="flex items-center gap-1.5 text-sm font-mono font-semibold text-cyan-400 hover:text-cyan-300 transition-colors group"
                >
                  407-8-24047-6
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                </button>
              </div>
              {/* Name */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">ชื่อบัญชี</span>
                <span className="text-sm text-[var(--text-secondary)]">นายภูมิชนะ อุดแก้ว</span>
              </div>
            </div>

            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed px-1">
              โอนเงินแล้วถ่ายสลิปอัพโหลดด้านขวา ระบบจะตรวจสอบและเพิ่มเครดิตอัตโนมัติภายใน 1-5 นาที
            </p>
          </div>

          {/* Slip Upload */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">อัพโหลดสลิป</p>

            {/* Drop Zone */}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-[var(--border-subtle)] hover:border-violet-500/30 bg-[var(--bg-surface)]/40 hover:bg-violet-500/[0.03] transition-all cursor-pointer group overflow-hidden"
              style={{ minHeight: "140px" }}
            >
              {preview ? (
                <div className="relative">
                  {/* biome-ignore lint/performance/noImgElement: slip preview */}
                  <img src={preview} alt="slip" className="w-full h-36 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-xs text-white font-medium">เปลี่ยนรูป</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/15 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">คลิกหรือลากไฟล์มาวาง</span>
                  <span className="text-[10px] text-[var(--text-muted)]/60">PNG, JPG, WEBP — สูงสุด 10MB</span>
                </div>
              )}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />

            {file && (
              <p className="text-[11px] text-[var(--text-muted)] truncate px-1">
                <span className="text-violet-400">✓</span> {file.name}
              </p>
            )}

            {/* Submit */}
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={!file || status === "loading" || status === "success"}
              className="btn-gradient w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              whileHover={{ scale: status === "idle" && file ? 1.01 : 1 }}
              whileTap={{ scale: 0.98 }}
            >
              {status === "loading" ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  กำลังตรวจสอบ...
                </>
              ) : status === "success" ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  ยืนยันแล้ว
                </>
              ) : (
                <>
                  ยืนยันการโอน
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </>
              )}
            </motion.button>

            {/* Result */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`rounded-xl px-4 py-3 text-sm font-medium border ${
                    status === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-red-500/10 border-red-500/20 text-red-400"
                  }`}
                >
                  {status === "success" && credits !== null && (
                    <span className="block text-xs text-emerald-300 mb-0.5">เครดิตใหม่: {credits.toLocaleString()} เครดิต</span>
                  )}
                  {message}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function TopupContent({ user, packages }: { user: User; packages: Package[] }) {
  return (
    <motion.div className="p-6 md:p-8 max-w-6xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
      <h1 className="text-2xl font-bold tracking-tight mb-1">
        <span className="gradient-text-cyan">เติมเงิน</span>
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">เลือกแพ็กเกจเพื่อเติมเครดิต SMS</p>

      {/* Current Credits */}
      <div className="glass-cyan p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/[0.08] border border-cyan-500/10 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
                <circle cx="12" cy="12" r="10" /><text x="12" y="16" textAnchor="middle" fill="currentColor" stroke="none" fontSize="12" fontWeight="bold">฿</text>
              </svg>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">เครดิตคงเหลือ</p>
              <p className="text-3xl font-bold gradient-text-cyan">{user.credits.toLocaleString()}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--text-muted)]">ประมาณ</p>
            <p className="text-sm text-[var(--text-secondary)]">{user.credits.toLocaleString()} SMS</p>
          </div>
        </div>
      </div>

      {/* Slip Upload */}
      <SlipUploadSection userId={user.id} />

      {/* Credit Rate Info Box */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 mb-6">
        <h3 className="text-sm font-semibold text-white mb-3">💡 การคิดเครดิต</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-2">
            <p className="text-[var(--text-muted)] text-xs uppercase tracking-wide">ส่ง SMS</p>
            <div className="flex justify-between"><span className="text-slate-300 text-xs">EN ≤160 ตัวอักษร</span><span className="text-amber-400 text-xs">1 เครดิต</span></div>
            <div className="flex justify-between"><span className="text-slate-300 text-xs">EN 161-320 ตัวอักษร</span><span className="text-amber-400 text-xs">2 เครดิต</span></div>
            <div className="flex justify-between"><span className="text-slate-300 text-xs">ไทย ≤70 ตัวอักษร</span><span className="text-amber-400 text-xs">1 เครดิต</span></div>
            <div className="flex justify-between"><span className="text-slate-300 text-xs">ไทย 71-140 ตัวอักษร</span><span className="text-amber-400 text-xs">2 เครดิต</span></div>
          </div>
          <div className="space-y-2">
            <p className="text-[var(--text-muted)] text-xs uppercase tracking-wide">บริการอื่น</p>
            <div className="flex justify-between"><span className="text-slate-300 text-xs">OTP SMS</span><span className="text-amber-400 text-xs">1 เครดิต</span></div>
            <div className="flex justify-between mt-2"><span className="text-[var(--text-muted)] text-xs">เครดิตไม่หมดอายุ</span><span className="text-emerald-400 text-xs">✓</span></div>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
        {packages.map((pkg, i) => (
          <motion.div
            key={pkg.id ?? i}
            className={`glass card-hover p-6 flex flex-col ${pkg.isBestSeller ? "glass-cyan border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.08)]" : ""}`}
            whileHover={{ y: -6, transition: { duration: 0.3 } }}
          >
            {/* Best Seller Badge */}
            {pkg.isBestSeller && (
              <div className="mb-3">
                <span className="badge-glow-info text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md">BEST SELLER</span>
              </div>
            )}

            {/* Package Name */}
            <h3 className="text-lg font-bold text-white mb-1">{pkg.name}</h3>

            {/* Price */}
            <div className="mb-4">
              <span className="text-2xl font-bold gradient-text-cyan">฿{formatPrice(pkg.price)}</span>
            </div>

            {/* Details */}
            <div className="space-y-2.5 mb-6 flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">เครดิต</span>
                <span className="text-white font-semibold">{pkg.totalCredits.toLocaleString()}</span>
              </div>
              {pkg.bonusPercent > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">โบนัส</span>
                  <span className="text-emerald-400 font-semibold">+{pkg.bonusPercent}%</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">ระยะเวลา</span>
                <span className="text-[var(--text-secondary)]">{formatDuration(pkg.durationDays)}</span>
              </div>
              {pkg.maxSenders !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">ชื่อผู้ส่ง</span>
                  <span className="text-[var(--text-secondary)]">{pkg.maxSenders === -1 ? "ไม่จำกัด" : pkg.maxSenders}</span>
                </div>
              )}
            </div>

            {/* Buy Button */}
            <motion.button
              className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 ${
                pkg.isBestSeller ? "btn-primary" : "btn-glass"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              ซื้อแพ็กเกจ
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </motion.button>
          </motion.div>
        ))}
      </div>

      {packages.length === 0 && (
        <EmptyState
          icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="12" r="10" /><text x="12" y="16" textAnchor="middle" fill="currentColor" stroke="none" fontSize="12" fontWeight="bold">฿</text></svg>}
          title="ยังไม่มีแพ็กเกจ"
          description="แพ็กเกจจะแสดงที่นี่เมื่อพร้อมใช้งาน"
        />
      )}
    </motion.div>
  );
}
