"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ToastType = "success" | "error" | "warning" | "info";

type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

const toastConfig: Record<ToastType, { dot: string; border: string; bg: string; text: string }> = {
  success: { dot: "bg-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/5", text: "text-emerald-400" },
  error: { dot: "bg-red-400", border: "border-red-500/20", bg: "bg-red-500/5", text: "text-red-400" },
  warning: { dot: "bg-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/5", text: "text-amber-400" },
  info: { dot: "bg-[var(--accent)]", border: "border-[rgba(var(--accent-rgb),0.15)]", bg: "bg-[rgba(var(--accent-rgb),0.1)]", text: "text-[var(--accent)]" },
};

let globalAddToast: ((type: ToastType, message: string) => void) | null = null;

export function useToast() {
  const toast = useCallback((type: ToastType, message: string) => {
    globalAddToast?.(type, message);
  }, []);
  return { toast };
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    globalAddToast = addToast;
    return () => { globalAddToast = null; };
  }, [addToast]);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm" role="status" aria-live="polite" aria-atomic="false">
      <AnimatePresence>
        {toasts.map((t) => {
          const config = toastConfig[t.type];
          return (
            <ToastItem key={t.id} toast={t} config={config} onDismiss={() => removeToast(t.id)} />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, config, onDismiss }: { toast: Toast; config: typeof toastConfig.success; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${config.border} ${config.bg}`}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} />
      <p className={`text-sm font-medium flex-1 ${config.text}`}>{toast.message}</p>
      <button onClick={onDismiss} className="text-white/20 hover:text-white/40 transition-colors flex-shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}
