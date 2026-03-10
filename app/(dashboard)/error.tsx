"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service (no details shown to user)
    console.error("[dashboard-error]", error.digest ?? "unknown");
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 mesh-bg relative overflow-hidden">
      <div className="fixed top-[30%] right-[10%] w-[350px] h-[350px] rounded-full pointer-events-none blob-anim" style={{ background: "radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)" }} />
      <div className="fixed bottom-[10%] left-[5%] w-[280px] h-[280px] rounded-full pointer-events-none blob-anim" style={{ background: "radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 70%)", animationDelay: "2.5s" }} />

      <motion.div
        className="glass p-10 sm:p-14 max-w-md w-full text-center relative z-10"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/15 flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">เกิดข้อผิดพลาด</h1>
        <p className="text-white/40 text-sm mb-8 leading-relaxed">
          กรุณาลองใหม่อีกครั้ง หากปัญหายังคงอยู่<br />กรุณาติดต่อทีมสนับสนุน
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            onClick={reset}
            className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            ลองใหม่
          </motion.button>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-xl text-sm font-semibold border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all inline-flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              กลับหน้าหลัก
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
