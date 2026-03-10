// ==========================================
// Spring Configs — centralized
// ==========================================

export const spring = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

export const springBounce = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
  mass: 0.5,
};

export const springGentle = {
  type: "spring" as const,
  stiffness: 200,
  damping: 30,
  mass: 1,
};

export const springSnappy = {
  type: "spring" as const,
  stiffness: 500,
  damping: 30,
  mass: 0.5,
};

// ==========================================
// Page Transition Variants
// ==========================================

import type { Variants } from "framer-motion";

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12, scale: 0.99 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 30, mass: 0.8 },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.99,
    transition: { duration: 0.15, ease: "easeIn" as const },
  },
};

// ==========================================
// Modal / Dialog Variants
// ==========================================

export const modalOverlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalContentVariants = {
  initial: { opacity: 0, scale: 0.92, y: 24 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 400, damping: 25, mass: 0.5 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 16,
    transition: { duration: 0.15, ease: "easeIn" as const },
  },
};

// ==========================================
// Stagger Variants
// ==========================================

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const staggerFast = {
  animate: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};

export const staggerItemX = {
  initial: { opacity: 0, x: -16 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};

// ==========================================
// General Variants
// ==========================================

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: spring,
};

export const fadeInScale = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  transition: spring,
};

// ==========================================
// Button / Interactive Presets
// ==========================================

export const buttonHover = { scale: 1.02 };
export const buttonTap = { scale: 0.97 };
export const iconHover = { scale: 1.1, rotate: 5 };
export const iconTap = { scale: 0.9 };

// ==========================================
// Sidebar Variants
// ==========================================

export const sidebarVariants = {
  expanded: {
    width: 220,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  collapsed: {
    width: 64,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};

export const sidebarLabelVariants = {
  expanded: { opacity: 1, x: 0, display: "block" },
  collapsed: { opacity: 0, x: -8, transitionEnd: { display: "none" } },
};
