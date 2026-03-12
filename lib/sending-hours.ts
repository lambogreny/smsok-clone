/**
 * Sending Hours Enforcement — PDPA Compliance
 * Marketing SMS blocked outside organization's configured hours
 * Default: 08:00-20:00 (Thailand time, ICT UTC+7)
 * Legal minimum: start >= 8, end <= 20
 */

import { prisma as db } from "./db";
import { ApiError } from "./api-auth";

const DEFAULT_START = 8;  // 08:00
const DEFAULT_END = 20;   // 20:00
const TIMEZONE = "Asia/Bangkok";

/**
 * Get sending hours config for an organization (or defaults)
 */
async function getOrgHours(orgId?: string): Promise<{ start: number; end: number }> {
  if (!orgId) return { start: DEFAULT_START, end: DEFAULT_END };

  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { sendingHoursStart: true, sendingHoursEnd: true },
  });

  if (!org) return { start: DEFAULT_START, end: DEFAULT_END };

  // Enforce legal bounds: start >= 8, end <= 20
  const start = Math.max(org.sendingHoursStart ?? DEFAULT_START, 8);
  const end = Math.min(org.sendingHoursEnd ?? DEFAULT_END, 20);

  return { start, end };
}

/**
 * Check if current time is within allowed sending hours for marketing SMS.
 * Returns { allowed: true } or { allowed: false, reason, nextAllowedAt }
 */
export async function checkSendingHours(orgId?: string): Promise<{
  allowed: boolean;
  reason?: string;
  nextAllowedAt?: string;
  blockStart?: string;
  blockEnd?: string;
}> {
  const { start, end } = await getOrgHours(orgId);

  const now = new Date();
  const thaiTime = new Date(
    now.toLocaleString("en-US", { timeZone: TIMEZONE })
  );
  const hour = thaiTime.getHours();

  const blockStart = `${String(end).padStart(2, "0")}:00`;
  const blockEnd = `${String(start).padStart(2, "0")}:00`;

  // Blocked: outside start-end range
  if (hour >= end || hour < start) {
    // Calculate next allowed time
    const nextAllowed = new Date(thaiTime);
    if (hour >= end) {
      // After end → next morning at start
      nextAllowed.setDate(nextAllowed.getDate() + 1);
    }
    nextAllowed.setHours(start, 0, 0, 0);

    return {
      allowed: false,
      reason: `ไม่สามารถส่ง SMS การตลาดระหว่าง ${blockStart}-${blockEnd} น. (PDPA)`,
      nextAllowedAt: nextAllowed.toISOString(),
      blockStart,
      blockEnd,
    };
  }

  return { allowed: true, blockStart, blockEnd };
}

/**
 * Assert sending hours — throws if blocked.
 * Use in SMS send flows for marketing messages.
 */
export async function assertSendingHours(orgId?: string): Promise<void> {
  const result = await checkSendingHours(orgId);
  if (!result.allowed) {
    const reason = result.reason || "ไม่สามารถส่ง SMS นอกเวลาที่กำหนด";
    throw new ApiError(400, reason);
  }
}

/**
 * Validate sending hours configuration
 * Legal requirement: start >= 8, end <= 20, start < end
 */
export function validateSendingHours(start: number, end: number): { valid: boolean; error?: string } {
  if (start < 8) return { valid: false, error: "เวลาเริ่มต้นต้องไม่น้อยกว่า 08:00 (กฎหมาย PDPA)" };
  if (end > 20) return { valid: false, error: "เวลาสิ้นสุดต้องไม่เกิน 20:00 (กฎหมาย PDPA)" };
  if (start >= end) return { valid: false, error: "เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด" };
  return { valid: true };
}
