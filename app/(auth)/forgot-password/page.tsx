"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { forgotPassword } from "@/lib/actions";
import { blockNonNumeric, fieldCls } from "@/lib/form-utils";
import { motion, AnimatePresence } from "framer-motion";
import { safeErrorMessage } from "@/lib/error-messages";

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  function validatePhone(value: string) {
    if (value && !/^0[689]\d{8}$/.test(value)) {
      setPhoneError("เบอร์โทรไม่ถูกต้อง (ตัวอย่าง: 0891234567)");
    } else {
      setPhoneError("");
    }
  }

  function handleSubmit() {
    if (!phone.trim() || phoneError) return;
    startTransition(async () => {
      try {
        await forgotPassword(phone);
        setResult("success");
      } catch (e) {
        setErrorMsg(safeErrorMessage(e));
        setResult("error");
      }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 mesh-bg relative overflow-hidden">
      {/* Back button */}
      <Link
        href="/"
        className="fixed top-5 left-5 z-20 flex items-center gap-1.5 text-white/40 hover:text-white transition-colors duration-200"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        <span className="text-sm">กลับหน้าหลัก</span>
      </Link>

      {/* Animated blobs */}
      <div className="fixed top-[30%] left-[10%] w-[300px] h-[300px] rounded-full pointer-events-none blob-anim" style={{ background: "radial-gradient(circle, rgba(129,140,248,0.10) 0%, transparent 70%)" }} />
      <div className="fixed bottom-[20%] right-[15%] w-[250px] h-[250px] rounded-full pointer-events-none blob-anim" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)", animationDelay: "4s" }} />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-fade-in">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-violet-400 group-hover:drop-shadow-[0_0_8px_rgba(139,92,246,0.6)] transition-all">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.3" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-2xl font-bold gradient-text-mixed">SMSOK</span>
          </Link>
        </div>

        <div className="glass p-8 sm:p-10 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <AnimatePresence mode="wait">
            {result === "success" ? (
              <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center mx-auto mb-6">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400">
                    <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12" y2="18" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">ส่ง SMS แล้ว!</h2>
                <p className="text-white/40 text-sm mb-6 leading-relaxed">
                  รหัสรีเซ็ตรหัสผ่านถูกส่งไปที่ <span className="text-white/70">{phone}</span>
                  <br />ใช้รหัสนี้กับขั้นตอน reset password ภายใน 5 นาที
                </p>
                <Link href="/login" className="btn-primary px-8 py-3 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
                  ไปหน้า Login →
                </Link>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center mx-auto mb-4">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-1">ลืมรหัสผ่าน</h1>
                  <p className="text-white/40 text-sm">กรอกเบอร์โทรที่ลงทะเบียนไว้</p>
                </div>

                {result === "error" && errorMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400 text-sm text-center">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-white font-medium uppercase tracking-wider mb-2">เบอร์โทรที่ลงทะเบียน</label>
                    <input
                      type="tel" inputMode="numeric" maxLength={10}
                      value={phone}
                      onKeyDown={blockNonNumeric}
                      onChange={(e) => { setPhone(e.target.value); validatePhone(e.target.value); }}
                      onKeyUp={(e) => e.key === "Enter" && handleSubmit()}
                      className={fieldCls(phoneError, phone)}
                      placeholder="0891234567"
                      autoFocus
                    />
                    {phoneError && <p className="text-red-400 text-xs mt-1">{phoneError}</p>}
                  </div>

                  <motion.button
                    onClick={handleSubmit}
                    disabled={isPending || !phone.trim() || !!phoneError}
                    className="w-full btn-primary py-3 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  >
                    {isPending
                      ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>กำลังส่ง SMS...</>
                      : <>รับรหัสรีเซ็ตทาง SMS</>}
                  </motion.button>
                </div>

                <p className="text-center text-white/25 text-sm mt-6">
                  จำรหัสได้แล้ว?{" "}
                  <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">เข้าสู่ระบบ →</Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
