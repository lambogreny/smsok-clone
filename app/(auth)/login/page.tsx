"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { blockThai, fieldCls } from "@/lib/form-utils";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  function validateEmail(v: string) {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    setErrors(prev => ({ ...prev, email: v && !isValid ? "อีเมลไม่ถูกต้อง" : "" }));
  }

  const hasErrors = Object.values(errors).some(Boolean);
  const isComplete = email.trim() && password.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isComplete || hasErrors) return;
    setServerError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setServerError(data.error || "เกิดข้อผิดพลาด กรุณาลองใหม่");
          return;
        }
        router.push(data.redirectTo ?? "/dashboard");
      } catch {
        setServerError("ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่");
      }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 mesh-bg relative overflow-hidden">
      {/* Back button */}
      <Link
        href="/"
        className="fixed top-5 left-5 z-20 flex items-center gap-1.5 text-white/40 hover:text-white transition-colors duration-200 group"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        <span className="text-sm">กลับหน้าหลัก</span>
      </Link>

      {/* Animated blobs */}
      <div className="fixed top-[20%] left-[15%] w-[400px] h-[400px] rounded-full pointer-events-none blob-anim" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)" }} />
      <div className="fixed bottom-[15%] right-[10%] w-[300px] h-[300px] rounded-full pointer-events-none blob-anim" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)", animationDelay: "3s" }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="relative">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-violet-400 transition-all group-hover:drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.3" />
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="absolute inset-0 bg-violet-400/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-2xl font-bold gradient-text-mixed">SMSOK</span>
          </Link>
        </div>

        {/* Glass Card */}
        <div className="glass p-8 sm:p-10 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">ยินดีต้อนรับกลับ</h1>
            <p className="text-white/40 text-sm">เข้าสู่ระบบเพื่อจัดการการส่ง SMS ของคุณ</p>
          </div>

          {serverError && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400 text-sm text-center animate-shake">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-white font-medium uppercase tracking-wider mb-2">อีเมล</label>
              <input
                type="email" name="email" required
                value={email}
                onKeyDown={blockThai}
                onChange={(e) => { setEmail(e.target.value); validateEmail(e.target.value); }}
                className={fieldCls(errors.email, email)}
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-xs text-white font-medium uppercase tracking-wider mb-2">รหัสผ่าน</label>
              <input
                type="password" name="password" required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldCls(errors.password, password)}
                placeholder="••••••••"
              />
            </div>
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs text-violet-400/70 hover:text-violet-400 transition-colors">
                ลืมรหัสผ่าน?
              </Link>
            </div>
            <button
              type="submit"
              disabled={isPending || hasErrors}
              className="w-full btn-primary py-3 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  กำลังเข้าสู่ระบบ...
                </span>
              ) : (
                <>
                  เข้าสู่ระบบ
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-white/25 text-sm mt-6">
            ยังไม่มีบัญชี?{" "}
            <Link href="/register" className="text-violet-400 hover:text-violet-300 transition-colors">
              สมัครฟรี →
            </Link>
          </p>
        </div>

        {/* Testimonial */}
        <div className="mt-5 glass p-5 text-center animate-fade-in" style={{ animationDelay: "0.25s" }}>
          <p className="text-sm text-white/30 italic">&ldquo;ส่ง SMS 10,000+ ข้อความในคลิกเดียว&rdquo;</p>
          <p className="text-xs text-white/15 mt-2">ธุรกิจกว่า 500+ ไว้วางใจ</p>
        </div>
      </div>
    </div>
  );
}
