"use client";

import { AlertTriangle } from "lucide-react";

/**
 * Marketing SMS can only be sent 08:00-20:00 (Thailand time, ICT UTC+7).
 * Transactional SMS can be sent anytime.
 *
 * Shows a warning banner if the current time or scheduled time is outside allowed hours.
 */

const MARKETING_START_HOUR = 8;
const MARKETING_END_HOUR = 20;

function isOutsideMarketingHours(date: Date): boolean {
  // Convert to Thailand time (UTC+7)
  const thaiHour = new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  ).getHours();
  return thaiHour < MARKETING_START_HOUR || thaiHour >= MARKETING_END_HOUR;
}

export function checkSendingHours(scheduledAt?: string | null): {
  isOutside: boolean;
  message: string;
} {
  const date = scheduledAt ? new Date(scheduledAt) : new Date();
  if (isOutsideMarketingHours(date)) {
    const timeStr = scheduledAt ? "เวลาที่ตั้งไว้" : "ขณะนี้";
    return {
      isOutside: true,
      message: `${timeStr}อยู่นอกเวลาส่ง Marketing SMS (08:00-20:00) — ข้อความจะถูกส่งในช่วงเวลาที่อนุญาตถัดไป`,
    };
  }
  return { isOutside: false, message: "" };
}

export default function SendingHoursWarning({
  scheduledAt,
  className = "",
}: {
  scheduledAt?: string | null;
  className?: string;
}) {
  const { isOutside, message } = checkSendingHours(scheduledAt);

  if (!isOutside) return null;

  return (
    <div
      className={`rounded-xl px-4 py-3 flex items-start gap-2.5 ${className}`}
      style={{
        background: "rgba(245,158,11,0.06)",
        border: "1px solid rgba(245,158,11,0.15)",
      }}
    >
      <AlertTriangle
        size={16}
        className="mt-0.5 flex-shrink-0"
        style={{ color: "var(--warning, #F59E0B)" }}
      />
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--warning, #F59E0B)" }}>
          นอกเวลาส่ง Marketing SMS
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          {message}
        </p>
        <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
          Transactional SMS (OTP, แจ้งเตือน) ส่งได้ตลอด 24 ชม.
        </p>
      </div>
    </div>
  );
}
