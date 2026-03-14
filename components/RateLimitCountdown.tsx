"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock } from "lucide-react";

/**
 * Extracts seconds from rate limit error messages like:
 * "กรุณารอ 900 วินาที" or "คำขอมากเกินไป กรุณารอ 45 วินาที"
 */
export function extractRateLimitSeconds(message: string): number | null {
  const match = message.match(/(\d+)\s*วินาที/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Formats seconds into human-readable Thai format:
 * 900 → "15:00"  |  90 → "1:30"  |  45 → "0:45"
 */
export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Returns a friendly message instead of raw seconds
 */
export function friendlyRateLimitMessage(seconds: number): string {
  if (seconds > 300) return "คุณส่งคำขอบ่อยเกินไป กรุณารอสักครู่";
  if (seconds > 60) return "กรุณารอสักครู่ก่อนลองอีกครั้ง";
  return "กรุณารอสักครู่ก่อนลองอีกครั้ง";
}

interface RateLimitCountdownProps {
  seconds: number;
  onExpire?: () => void;
}

export default function RateLimitCountdown({ seconds, onExpire }: RateLimitCountdownProps) {
  const [remaining, setRemaining] = useState(seconds);

  const handleExpire = useCallback(() => {
    onExpire?.();
  }, [onExpire]);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      handleExpire();
      return;
    }
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [remaining, handleExpire]);

  if (remaining <= 0) return null;

  return (
    <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-[rgba(var(--warning-rgb,245,158,11),0.06)] border border-[rgba(var(--warning-rgb,245,158,11),0.15)] text-[13px]">
      <Clock className="w-4 h-4 text-[var(--warning)] shrink-0" />
      <span className="text-[var(--warning)]">
        {friendlyRateLimitMessage(remaining)}
      </span>
      <span className="font-mono font-bold text-[var(--warning)] ml-1">
        {formatCountdown(remaining)}
      </span>
    </div>
  );
}
