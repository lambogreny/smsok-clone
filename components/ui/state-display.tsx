"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StateDisplayProps {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  errorCode?: string;
  primaryAction?: {
    label: string;
    icon?: LucideIcon;
    onClick?: () => void;
    href?: string;
    variant?: "default" | "outline";
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  countdown?: {
    seconds: number;
    label: string;
    onComplete: () => void;
  };
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: {
    container: "py-8 px-6 min-h-[160px]",
    iconBox: "w-10 h-10 rounded-lg mb-3",
    iconSize: 18,
    title: "text-sm font-semibold",
    desc: "text-xs max-w-[260px]",
    button: "sm" as const,
  },
  md: {
    container: "py-12 px-8 min-h-[300px]",
    iconBox: "w-14 h-14 rounded-xl mb-4",
    iconSize: 24,
    title: "text-base font-semibold",
    desc: "text-[13px] max-w-[320px] max-md:max-w-[280px]",
    button: "default" as const,
  },
  lg: {
    container: "min-h-screen py-16 px-6",
    iconBox: "w-20 h-20 rounded-2xl mb-5",
    iconSize: 32,
    title: "text-xl font-bold",
    desc: "text-sm max-w-[400px] max-md:max-w-[280px]",
    button: "lg" as const,
  },
};

export function StateDisplay({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  description,
  errorCode,
  primaryAction,
  secondaryAction,
  countdown,
  size = "md",
  className,
}: StateDisplayProps) {
  const s = sizes[size];
  const [count, setCount] = useState(countdown?.seconds ?? 0);

  useEffect(() => {
    if (!countdown) return;
    setCount(countdown.seconds);
    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          countdown.onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const isError = !!errorCode;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center text-center animate-[state-enter_300ms_ease-out] motion-reduce:animate-none",
        s.container,
        className,
      )}
    >
      {errorCode && (
        <span
          className="absolute select-none font-black text-[120px] max-md:text-[80px] opacity-[0.04] text-[var(--text-primary)]"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {errorCode}
        </span>
      )}

      <div
        className={cn(
          "flex items-center justify-center",
          s.iconBox,
          isError && "animate-[icon-shake_400ms_ease_200ms] motion-reduce:animate-none",
        )}
        style={{ background: iconBg }}
      >
        <Icon size={s.iconSize} style={{ color: iconColor }} strokeWidth={1.5} />
      </div>

      <h2 className={cn(s.title, "text-[var(--text-primary)] mb-1")}>{title}</h2>
      <p className={cn(s.desc, "text-[var(--text-muted)] leading-relaxed mb-5")}>{description}</p>

      {primaryAction && (
        primaryAction.href ? (
          <Link
            href={primaryAction.href}
            className={cn(
              buttonVariants({ variant: primaryAction.variant ?? "default", size: s.button }),
              "max-md:w-full",
            )}
          >
            {primaryAction.icon && <primaryAction.icon size={16} data-icon="inline-start" />}
            {primaryAction.label}
          </Link>
        ) : (
          <Button
            variant={primaryAction.variant ?? "default"}
            size={s.button}
            onClick={primaryAction.onClick}
            className="max-md:w-full"
          >
            {primaryAction.icon && <primaryAction.icon size={16} data-icon="inline-start" />}
            {primaryAction.label}
          </Button>
        )
      )}

      {secondaryAction && (
        secondaryAction.href ? (
          <Link
            href={secondaryAction.href}
            className="mt-2 text-xs text-[var(--text-muted)] hover:underline transition-colors"
          >
            {secondaryAction.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            className="mt-2 text-xs text-[var(--text-muted)] hover:underline transition-colors cursor-pointer"
          >
            {secondaryAction.label}
          </button>
        )
      )}

      {countdown && count > 0 && (
        <p className="mt-4 text-[11px] text-[var(--text-muted)]">
          {countdown.label.replace("{n}", String(count))}
        </p>
      )}
    </div>
  );
}
