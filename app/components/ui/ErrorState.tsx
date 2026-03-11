"use client";

import { motion } from "framer-motion";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
};

export default function ErrorState({
  title = "ไม่สามารถโหลดข้อมูลได้",
  description = "กรุณาลองใหม่อีกครั้ง หากยังมีปัญหาติดต่อทีมงาน",
  onRetry,
}: ErrorStateProps) {
  return (
    <motion.div
      className="glass p-12 text-center border-red-500/10"
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.div
        className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/[0.05] border border-red-500/10 flex items-center justify-center"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-red-400/60">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </motion.div>
      <p className="text-sm text-[var(--text-primary)] mb-1">{title}</p>
      <p className="text-xs text-[var(--text-secondary)] mb-5">{description}</p>
      {onRetry && (
        <motion.button
          onClick={onRetry}
          className="btn-glass inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
          </svg>
          ลองใหม่
        </motion.button>
      )}
    </motion.div>
  );
}
