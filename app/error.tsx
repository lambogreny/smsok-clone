"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error.digest || error.message);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-[rgba(var(--error-rgb,239,68,68),0.1)] border border-[rgba(var(--error-rgb,239,68,68),0.2)] flex items-center justify-center mx-auto mb-4">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-[var(--error)]"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          เกิดข้อผิดพลาด
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          ระบบพบปัญหาบางอย่าง กรุณาลองใหม่อีกครั้ง
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-sm font-medium rounded-lg border border-[var(--border)] transition-colors cursor-pointer"
        >
          ลองใหม่
        </button>
      </div>
    </div>
  );
}
