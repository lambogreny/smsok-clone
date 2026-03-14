"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { requestSenderName } from "@/lib/actions/sender-names";
import { allowAlphaNumericSpace, fieldCls } from "@/lib/form-utils";
import { safeErrorMessage } from "@/lib/error-messages";

type SenderType = "general" | "otp" | "marketing";

const SENDER_TYPES: { value: SenderType; label: string; desc: string }[] = [
  { value: "general", label: "ทั่วไป", desc: "แจ้งเตือน, ข่าวสาร" },
  { value: "otp", label: "OTP", desc: "ยืนยันตัวตน, รหัส OTP" },
  { value: "marketing", label: "การตลาด", desc: "โปรโมชัน, แคมเปญ" },
];

export default function SenderNameForm({ userId }: { userId: string }) {
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [senderType, setSenderType] = useState<SenderType>("general");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isValid = /^[A-Za-z0-9 ]{3,11}$/.test(name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setResult(null);

    try {
      await requestSenderName({ name });
      setResult({ type: "success", message: "ยื่นคำขอเรียบร้อย! ทีมงานจะตรวจสอบภายใน 1-2 วันทำการ" });
      toast.success("ยื่นคำขอ Sender Name สำเร็จ!");
      setName("");
      setPurpose("");
      setSenderType("general");
      setDocumentFile(null);
    } catch (e) {
      const msg = safeErrorMessage(e);
      setResult({ type: "error", message: msg });
      toast.error(msg);
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
          <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2 font-medium">ชื่อผู้ส่ง (3-11 ตัวอักษร, A-Z, 0-9)</label>
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
              <span className="text-xs text-[var(--error)]">3-11 ตัว A-Z 0-9 หรือช่องว่าง</span>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2 font-medium">วัตถุประสงค์การใช้งาน</label>
          <input
            type="text"
            className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none px-3 py-2 w-full"
            placeholder="เช่น ส่ง OTP ให้ลูกค้า, แจ้งโปรโมชัน"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />
          <p className="text-[11px] text-[var(--text-secondary)] mt-2">ระบุเพื่อช่วยให้อนุมัติเร็วขึ้น</p>
        </div>
      </div>

      {/* Sender Type */}
      <div>
        <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2 font-medium">ประเภทการใช้งาน</label>
        <div className="grid grid-cols-3 gap-3">
          {SENDER_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setSenderType(t.value)}
              className="rounded-lg p-3 text-left transition-all cursor-pointer"
              style={{
                border: senderType === t.value
                  ? "2px solid var(--accent)"
                  : "2px solid var(--border-default)",
                background: senderType === t.value
                  ? "rgba(var(--accent-rgb),0.06)"
                  : "var(--bg-surface)",
              }}
            >
              <p className="text-[13px] font-semibold" style={{ color: senderType === t.value ? "var(--accent)" : "var(--text-primary)" }}>
                {t.label}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Document Upload */}
      <div>
        <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2 font-medium">
          เอกสารประกอบ <span style={{ color: "var(--text-muted)" }}>(ไม่บังคับ)</span>
        </label>
        <div
          className="rounded-lg p-4 text-center transition-all"
          style={{ border: "2px dashed var(--border-default)", background: "var(--bg-surface)" }}
        >
          {documentFile ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" />
                </svg>
                <span className="text-[13px]" style={{ color: "var(--text-primary)" }}>{documentFile.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setDocumentFile(null)}
                className="text-[12px] cursor-pointer"
                style={{ color: "var(--error)" }}
              >
                ลบ
              </button>
            </div>
          ) : (
            <>
              <p className="text-[12px] mb-2" style={{ color: "var(--text-muted)" }}>
                อัปโหลดหนังสือรับรองบริษัท หรือเอกสารที่เกี่ยวข้อง (PDF, JPG, PNG)
              </p>
              <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition-colors" style={{ background: "rgba(var(--accent-rgb),0.08)", color: "var(--accent)", border: "1px solid rgba(var(--accent-rgb),0.15)" }}>
                เลือกไฟล์
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setDocumentFile(file);
                  }}
                />
              </label>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <motion.button
          type="submit"
          disabled={!isValid || loading}
          className="btn-primary px-6 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
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
        <p className="text-[11px] text-[var(--text-secondary)]">คำขอจะถูกตรวจสอบโดยทีมงานภายใน 1-2 วันทำการ</p>
      </div>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.type}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`p-4 rounded-lg border text-sm font-medium ${
              result.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-[rgba(var(--error-rgb,239,68,68),0.1)] border-[rgba(var(--error-rgb,239,68,68),0.2)] text-[var(--error)]"
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
