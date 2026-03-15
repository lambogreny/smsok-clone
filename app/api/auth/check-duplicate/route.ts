import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiError, apiResponse, ApiError } from "@/lib/api-auth";
import { getClientIp } from "@/lib/session-utils";
import { normalizePhone } from "@/lib/validations";

const emailSchema = z.string().trim().email();
const phoneSchema = z.string().trim().min(9).max(20);
const DUPLICATE_CHECK_MIN_DELAY_MS = 150;
const MESSAGES = {
  email_available: "อีเมลนี้ใช้ได้",
  email_taken: "อีเมลนี้ถูกใช้งานแล้ว",
  phone_available: "เบอร์โทรนี้ใช้ได้",
  phone_taken: "เบอร์โทรนี้ถูกใช้งานแล้ว",
};

async function waitForMinimumResponseTime(startedAt: number) {
  const elapsed = Date.now() - startedAt;
  const remaining = DUPLICATE_CHECK_MIN_DELAY_MS - elapsed;
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const startedAt = Date.now();

  try {
    const emailRaw = req.nextUrl.searchParams.get("email");
    const phoneRaw = req.nextUrl.searchParams.get("phone");

    if (!emailRaw && !phoneRaw) {
      throw new ApiError(400, "กรุณาระบุ email หรือ phone");
    }
    if (emailRaw && phoneRaw) {
      throw new ApiError(400, "ตรวจสอบได้ทีละ field");
    }

    if (emailRaw) {
      const email = emailSchema.parse(emailRaw).toLowerCase();
      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      await waitForMinimumResponseTime(startedAt);
      const available = !existing;
      return apiResponse({
        field: "email",
        available,
        message: available ? MESSAGES.email_available : MESSAGES.email_taken,
      });
    }

    const normalizedPhone = normalizePhone(phoneSchema.parse(phoneRaw));
    const existing = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      select: { id: true },
    });

    await waitForMinimumResponseTime(startedAt);
    const available = !existing;
    return apiResponse({
      field: "phone",
      available,
      message: available ? MESSAGES.phone_available : MESSAGES.phone_taken,
    });
  } catch (error) {
    return apiError(error);
  }
}
