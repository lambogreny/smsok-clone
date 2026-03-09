"use client";

import { motion, AnimatePresence } from "framer-motion";

type Variant = "danger" | "warning" | "info";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  loading?: boolean;
};

const variantConfig: Record<Variant, { icon: string; iconBg: string; iconBorder: string; btnBg: string }> = {
  danger: { icon: "text-red-400", iconBg: "bg-red-500/[0.08]", iconBorder: "border-red-500/10", btnBg: "bg-red-500 hover:bg-red-600" },
  warning: { icon: "text-amber-400", iconBg: "bg-amber-500/[0.08]", iconBorder: "border-amber-500/10", btnBg: "bg-amber-500 hover:bg-amber-600" },
  info: { icon: "text-sky-400", iconBg: "bg-sky-500/[0.08]", iconBorder: "border-sky-500/10", btnBg: "bg-sky-500 hover:bg-sky-600" },
};

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "ยืนยัน",
  cancelLabel = "ยกเลิก",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="glass-elevated relative max-w-sm w-full p-6 rounded-2xl"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className={`w-12 h-12 mx-auto mb-4 rounded-xl ${config.iconBg} border ${config.iconBorder} flex items-center justify-center`}>
              {variant === "danger" ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={config.icon}>
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={config.icon}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              )}
            </div>
            <h3 className="text-lg font-semibold text-white text-center mb-2">{title}</h3>
            <p className="text-sm text-white/40 text-center mb-6">{description}</p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 btn-glass py-2.5 rounded-xl text-sm font-medium"
              >
                {cancelLabel}
              </button>
              <motion.button
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white ${config.btnBg} transition-colors disabled:opacity-40`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    กำลังดำเนินการ...
                  </span>
                ) : confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
