"use client";

import Link from "next/link";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { registerSchema } from "@/lib/validations";
import { blockNonNumeric, blockThai, fieldCls } from "@/lib/form-utils";
import { generateOtpForRegister, verifyOtpForRegister } from "@/lib/actions/otp";
import { registerWithOtp } from "@/lib/actions";
import { motion, AnimatePresence } from "framer-motion";

type Step = "form" | "otp";

const RESEND_COOLDOWN = 60;
const OTP_EXPIRY = 5 * 60;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  const [otpCode, setOtpCode] = useState("");
  const [otpRef, setOtpRef] = useState("");
  const [otpError, setOtpError] = useState("");
  const [countdown, setCountdown] = useState(OTP_EXPIRY);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [debugCode, setDebugCode] = useState<string | null>(null);

  useEffect(() => {
    if (step !== "otp") return;
    const t = setInterval(() => {
      setCountdown(v => Math.max(0, v - 1));
      setResendCooldown(v => Math.max(0, v - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [step, otpRef]);

  function validate(field: string, value: string) {
    const result = registerSchema.partial().safeParse({ [field]: value || undefined });
    const msg = result.success ? "" : (result.error.issues.find(i => String(i.path[0]) === field)?.message ?? "");
    setErrors(prev => ({ ...prev, [field]: msg }));
  }

  const hasErrors = Object.values(errors).some(Boolean);
  const passwordMismatch = confirmPassword.length > 0 && confirmPassword !== password;
  const isFormComplete = name.trim() && email.trim() && phone.trim() && password.trim() && confirmPassword === password;

  function handleSendOtp() {
    if (!isFormComplete || hasErrors) return;
    setFormError("");
    startTransition(async () => {
      try {
        const result = await generateOtpForRegister(phone);
        setOtpRef(result.ref);
        setCountdown(OTP_EXPIRY);
        setResendCooldown(RESEND_COOLDOWN);
        setStep("otp");
        if (result.delivery === "debug") {
          setDebugCode((result as { debugCode?: string }).debugCode ?? null);
        }
      } catch (e) {
        setFormError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
      }
    });
  }

  function handleResend() {
    if (resendCooldown > 0) return;
    startTransition(async () => {
      try {
        const result = await generateOtpForRegister(phone);
        setOtpRef(result.ref);
        setCountdown(OTP_EXPIRY);
        setResendCooldown(RESEND_COOLDOWN);
        setOtpCode("");
        setOtpError("");
        if (result.delivery === "debug") {
          setDebugCode((result as { debugCode?: string }).debugCode ?? null);
        }
      } catch (e) {
        setOtpError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      }
    });
  }

  function handleVerifyOtp() {
    if (otpCode.length < 6) return;
    setOtpError("");
    startTransition(async () => {
      try {
        await verifyOtpForRegister(otpRef, otpCode);
        await registerWithOtp({ name, email, phone, password, otpRef, otpCode });
        router.push("/dashboard");
      } catch (e) {
        setOtpError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      }
    });
  }

  function fmtCountdown(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 mesh-bg relative">
      <div className="fixed top-[30%] right-[10%] w-[350px] h-[350px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(129,140,248,0.08) 0%, transparent 70%)" }} />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-fade-in">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-violet-400 transition-all group-hover:drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.3" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-2xl font-bold gradient-text-mixed">SMSOK</span>
          </Link>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {(["form", "otp"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s ? "bg-violet-500 text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]" :
                i < (step === "otp" ? 1 : 0) ? "bg-emerald-500 text-white" :
                "bg-white/10 text-white/30"
              }`}>
                {i < (step === "otp" ? 1 : 0) ? "✓" : i + 1}
              </div>
              {i < 1 && <div className={`w-8 h-px ${step === "otp" ? "bg-emerald-500" : "bg-white/10"}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }} className="glass p-8 sm:p-10">
              <div className="text-center mb-8">
                <h1 className="text-xl font-semibold text-white mb-1">สมัครสมาชิก</h1>
                <p className="text-white/30 text-sm">สมัครฟรี รับ 15 เครดิตทันที</p>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400 text-sm text-center">{formError}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-medium">ชื่อ-นามสกุล</label>
                  <input type="text" value={name} onChange={(e) => { setName(e.target.value); validate("name", e.target.value); }}
                    className={fieldCls(errors.name, name)} placeholder="สมชาย ใจดี" />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-medium">อีเมล</label>
                  <input type="email" value={email} onKeyDown={blockThai}
                    onChange={(e) => { setEmail(e.target.value); validate("email", e.target.value); }}
                    className={fieldCls(errors.email, email)} placeholder="you@example.com" />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-medium">
                    เบอร์โทร <span className="text-violet-400 text-[10px] normal-case">*ใช้รับ OTP</span>
                  </label>
                  <input type="tel" value={phone} inputMode="numeric" maxLength={10} onKeyDown={blockNonNumeric}
                    onChange={(e) => { setPhone(e.target.value); validate("phone", e.target.value); }}
                    className={fieldCls(errors.phone, phone)} placeholder="0891234567" />
                  {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-medium">รหัสผ่าน (8 ตัวขึ้นไป)</label>
                  <input type="password" value={password} minLength={8}
                    onChange={(e) => { setPassword(e.target.value); validate("password", e.target.value); }}
                    className={fieldCls(errors.password, password)} placeholder="••••••••" />
                  {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                  {password && !errors.password && (
                    <div className="flex gap-1 mt-1.5">
                      {[/[A-Z]/, /[0-9]/, /.{8}/].map((re, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${re.test(password) ? "bg-emerald-500" : "bg-white/10"}`} />
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-medium">ยืนยันรหัสผ่าน</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`input-glass transition-colors ${
                      confirmPassword && confirmPassword === password
                        ? "border-emerald-500/50"
                        : passwordMismatch
                        ? "border-red-500/50"
                        : ""
                    }`}
                    placeholder="••••••••"
                  />
                  {passwordMismatch && <p className="text-red-400 text-xs mt-1">รหัสผ่านไม่ตรงกัน</p>}
                </div>

                <motion.button onClick={handleSendOtp} disabled={isPending || hasErrors || !isFormComplete || passwordMismatch}
                  className="w-full btn-primary py-3 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  {isPending
                    ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>กำลังส่ง OTP...</>
                    : <>รับ OTP ยืนยันเบอร์ →</>}
                </motion.button>
              </div>

              <p className="text-center text-white/25 text-sm mt-6">
                มีบัญชีอยู่แล้ว?{" "}
                <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">เข้าสู่ระบบ →</Link>
              </p>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="glass p-8 sm:p-10">
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
                    <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12" y2="18" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <h1 className="text-xl font-semibold text-white mb-1">ยืนยัน OTP</h1>
                <p className="text-white/40 text-sm">ส่ง OTP ไปยัง {phone}</p>
                {otpRef && <p className="text-violet-400/50 text-[11px] mt-1 font-mono">REF: {otpRef.slice(0, 8).toUpperCase()}</p>}
              </div>

              {debugCode && (
                <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm text-center">
                  <span className="opacity-60 text-xs">DEV — OTP: </span>
                  <span className="font-mono font-bold tracking-widest">{debugCode}</span>
                </div>
              )}
              {otpError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400 text-sm text-center">{otpError}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-medium">รหัส OTP 6 หลัก</label>
                  <input type="text" inputMode="numeric" maxLength={6} value={otpCode} onKeyDown={blockNonNumeric}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="input-glass text-center text-2xl font-mono tracking-[0.5em]"
                    placeholder="••••••" autoFocus />
                </div>

                <div className="flex items-center justify-between text-xs text-white/30">
                  <span>{countdown > 0 ? `หมดอายุใน ${fmtCountdown(countdown)}` : "OTP หมดอายุแล้ว"}</span>
                  <button type="button" onClick={handleResend} disabled={resendCooldown > 0 || isPending}
                    className="text-violet-400 hover:text-violet-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    {resendCooldown > 0 ? `ส่งอีกครั้ง (${resendCooldown}s)` : "ส่งอีกครั้ง"}
                  </button>
                </div>

                <motion.button onClick={handleVerifyOtp} disabled={isPending || otpCode.length < 6 || countdown === 0}
                  className="w-full btn-primary py-3 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  {isPending
                    ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>กำลังยืนยัน...</>
                    : <>ยืนยัน OTP — สมัครสมาชิก</>}
                </motion.button>

                <button type="button" onClick={() => { setStep("form"); setOtpCode(""); setOtpError(""); }}
                  className="w-full text-xs text-white/30 hover:text-white/60 transition-colors py-2">
                  ← แก้ไขข้อมูล
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
