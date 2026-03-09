"use client";

import { login } from "@/lib/actions";
import Link from "next/link";
import { useActionState } from "react";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return await login(formData);
    },
    null
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-6 mesh-bg relative">
      {/* Extra ambient orb */}
      <div className="fixed top-[20%] left-[15%] w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)" }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="relative">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-sky-400 transition-all group-hover:drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.3" />
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="absolute inset-0 bg-sky-400/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-2xl font-bold neon-blue">SMSOK</span>
          </Link>
        </div>

        {/* Glass Card */}
        <div className="glass p-8 sm:p-10 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="text-center mb-8">
            <h1 className="text-xl font-semibold text-white mb-1">Welcome back</h1>
            <p className="text-white/30 text-sm">เข้าสู่ระบบเพื่อจัดการ SMS</p>
          </div>

          {state?.error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400 text-sm text-center animate-shake">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-5">
            <div>
              <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-medium">อีเมล</label>
              <input type="email" name="email" required className="input-glass" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-medium">รหัสผ่าน</label>
              <input type="password" name="password" required className="input-glass" placeholder="••••••••" />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="w-full btn-primary py-3 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  กำลังเข้าสู่ระบบ...
                </span>
              ) : (
                <>
                  Sign In
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-white/25 text-sm mt-6">
            ยังไม่มีบัญชี?{" "}
            <Link href="/register" className="text-sky-400 hover:text-sky-300 transition-colors">
              สมัครฟรี →
            </Link>
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/[0.04]" />
            <span className="text-xs text-white/15">or continue with</span>
            <div className="flex-1 h-px bg-white/[0.04]" />
          </div>

          {/* Social Login */}
          <div className="flex gap-3">
            <button className="btn-glass flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button className="btn-glass flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </button>
          </div>
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
