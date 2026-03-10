"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { requestSenderName } from "@/lib/actions/sender-names";
import { allowAlphaNumericSpace, fieldCls } from "@/lib/form-utils";
import { safeErrorMessage } from "@/lib/error-messages";

export default function SenderNameForm({ userId }: { userId: string }) {
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isValid = /^[A-Za-z0-9 ]{3,11}$/.test(name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setResult(null);

    try {
      await requestSenderName(userId, { name });
      setResult({ type: "success", message: "ยื่นคำขอเรียบร้อย! ทีมงานจะตรวจสอบภายใน 1-2 วันทำการ" });
      setName("");
      setPurpose("");
    } catch (e) {
      setResult({ type: "error", message: safeErrorMessage(e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs text-slate-300 uppercase tracking-wider mb-2 font-medium">ชื่อผู้ส่ง (3-11 ตัวอักษร, A-Z, 0-9)</label>
          <input
            type="text"
            onKeyDown={allowAlphaNumericSpace}
            className={fieldCls(name.length > 0 && !isValid ? "error" : undefined, name && isValid ? name : "")}
            placeholder="เช่น MyBrand"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={11}
            minLength={3}
          />
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs ${isValid ? "text-emerald-400" : "text-[var(--text-muted)]"}`}>
              {name.length}/11 ตัวอักษร
            </span>
            {name.length > 0 && !isValid && (
              <span className="text-xs text-red-400">3-11 ตัว A-Z 0-9 หรือช่องว่าง</span>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-300 uppercase tracking-wider mb-2 font-medium">วัตถุประสงค์การใช้งาน</label>
          <input
            type="text"
            className="input-glass"
            placeholder="เช่น ส่ง OTP ให้ลูกค้า, แจ้งโปรโมชัน"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />
          <p className="text-[11px] text-slate-300 mt-2">ระบุเพื่อช่วยให้อนุมัติเร็วขึ้น</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <motion.button
          type="submit"
          disabled={!isValid || loading}
          className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-40 whitespace-nowrap"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
              กำลังส่งคำขอ...
            </span>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M12 18v-6M9 15h6" />
              </svg>
              ยื่นคำขอ
            </>
          )}
        </motion.button>
        <p className="text-[11px] text-slate-300">คำขอจะถูกตรวจสอบโดยทีมงานภายใน 1-2 วันทำการ</p>
      </div>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.type}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`p-4 rounded-xl border text-sm font-medium ${
              result.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            {result.message}
          </motion.div>
        )}
      </AnimatePresence>
    </form>
    </motion.div>
  );
}
