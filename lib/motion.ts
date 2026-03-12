/**
 * Motion System — Springs, Variants, Accessibility
 * SMSOK Animation Spec v1 + Nansen Design DNA
 *
 * Usage:
 *   import { pageVariants, springs, cardHover } from "@/lib/motion"
 */

import type { Variants } from "framer-motion";

// ─── Spring Config Presets ──────────────────────────

export const springs = {
  snappy: { type: "spring" as const, stiffness: 400, damping: 28, mass: 0.8 },
  smooth: { type: "spring" as const, stiffness: 200, damping: 20, mass: 1.0 },
  bouncy: { type: "spring" as const, stiffness: 300, damping: 15, mass: 1.0 },
  heavy: { type: "spring" as const, stiffness: 150, damping: 25, mass: 1.5 },
  micro: { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.5 },
} as const;

export type SpringPreset = keyof typeof springs;

// Legacy spring exports (backward compat)
export const spring = springs.bouncy;
export const springBounce = springs.snappy;
export const springGentle = springs.smooth;
export const springSnappy = springs.micro;

// ─── Page Transitions ───────────────────────────────

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12, scale: 0.99 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...springs.snappy, staggerChildren: 0.08 },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.99,
    transition: { duration: 0.15, ease: "easeIn" as const },
  },
};

export const slideRight: Variants = {
  initial: { x: -30, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
  exit: { x: 30, opacity: 0, transition: { duration: 0.15 } },
};

export const slideLeft: Variants = {
  initial: { x: 30, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
  exit: { x: -30, opacity: 0, transition: { duration: 0.15 } },
};

export const scaleUp: Variants = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { ...springs.snappy } },
  exit: { scale: 0.95, opacity: 0, transition: { duration: 0.12 } },
};

// ─── Stagger Containers ─────────────────────────────

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
  // Legacy key for backward compat
  animate: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

export const staggerFast: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
  animate: {
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...springs.smooth },
  },
  // Legacy keys
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};

export const staggerItemX: Variants = {
  initial: { opacity: 0, x: -16 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};

export const rowVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export const sidebarItemVariants: Variants = {
  hidden: { opacity: 0, x: -15 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 250, damping: 22 },
  },
};

// ─── Micro-Interactions ─────────────────────────────

export const buttonVariants: Variants = {
  idle: { scale: 1 },
  hover: {
    scale: 1.03,
    transition: { type: "spring", stiffness: 400, damping: 15 },
  },
  tap: {
    scale: 0.97,
    transition: { type: "spring", stiffness: 500, damping: 20 },
  },
};

export const primaryButtonVariants: Variants = {
  idle: { scale: 1 },
  hover: {
    scale: 1.03,
    boxShadow: "0 0 20px rgba(0, 255, 167, 0.3)",
    transition: { type: "spring", stiffness: 400, damping: 15 },
  },
  tap: {
    scale: 0.97,
    transition: { type: "spring", stiffness: 500, damping: 20 },
  },
};

export const shakeVariants: Variants = {
  idle: { x: 0 },
  shake: {
    x: [0, -8, 8, -5, 5, -2, 2, 0],
    transition: { duration: 0.5 },
  },
};

// Legacy button presets
export const buttonHover = { scale: 1.02 };
export const buttonTap = { scale: 0.97 };
export const iconHover = { scale: 1.1, rotate: 5 };
export const iconTap = { scale: 0.9 };

export const cardHover: Variants = {
  rest: {
    y: 0,
    boxShadow: "0 0 0 0 rgba(0, 255, 167, 0)",
    borderColor: "#2B3540",
  },
  hover: {
    y: -4,
    boxShadow: "0 8px 30px rgba(0, 255, 167, 0.1)",
    borderColor: "var(--accent)",
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
};

export const toggleVariants: Variants = {
  off: { x: 0, backgroundColor: "#121C26" },
  on: {
    x: 20,
    backgroundColor: "var(--accent)",
    transition: { ...springs.micro },
  },
};

export const bellWiggle: Variants = {
  idle: { rotate: 0 },
  wiggle: {
    rotate: [0, -15, 15, -10, 10, -5, 5, 0],
    transition: { duration: 0.6, ease: "easeInOut" },
  },
};

export const tooltipVariants: Variants = {
  hidden: { opacity: 0, y: 5, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...springs.snappy },
  },
};

// ─── Modal & Drawer ─────────────────────────────────

export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

// Legacy modal variant names
export const modalOverlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 25,
      mass: 0.8,
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15 },
  },
};

export const modalContentVariants: Variants = {
  initial: { opacity: 0, scale: 0.92, y: 24 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { ...springs.snappy },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 16,
    transition: { duration: 0.15, ease: "easeIn" as const },
  },
};

export const drawerVariants: Variants = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: { y: "100%", transition: { duration: 0.2 } },
};

// ─── Sidebar ────────────────────────────────────────

export const sidebarVariants: Variants = {
  expanded: {
    width: 280,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  collapsed: {
    width: 72,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};

export const menuTextVariants: Variants = {
  expanded: { opacity: 1, x: 0, display: "block" },
  collapsed: { opacity: 0, x: -10, transitionEnd: { display: "none" } },
};

// Legacy sidebar label exports
export const sidebarLabelVariants = menuTextVariants;

// ─── Skeleton / Loading ─────────────────────────────

export const shimmerVariants: Variants = {
  initial: { x: "-100%" },
  animate: {
    x: "100%",
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: "linear",
    },
  },
};

export const contentReveal: Variants = {
  hidden: { opacity: 0, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

// ─── General Variants ───────────────────────────────

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

// ─── Accessibility — Reduced Motion ─────────────────

export const reducedMotionVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

export const reducedStaggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.15 } },
};

export const reducedStaggerItem: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.15 } },
};
