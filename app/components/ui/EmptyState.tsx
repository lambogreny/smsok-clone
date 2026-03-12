"use client";

import { motion } from "framer-motion";

type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
};

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-12 text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[var(--text-secondary)]">
        {icon}
      </div>
      <p className="text-sm text-[var(--text-primary)] mb-1">{title}</p>
      <p className="text-xs text-[var(--text-secondary)] mb-5">{description}</p>
      {action && (
        <motion.button
          onClick={action.onClick}
          className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
