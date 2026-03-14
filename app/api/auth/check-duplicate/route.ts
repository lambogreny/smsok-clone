import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiError, apiResponse, ApiError } from "@/lib/api-auth";
import { getClientIp } from "@/lib/session-utils";
import { normalizePhone } from "@/lib/validations";

const emailSchema = z.string().trim().email();
const phoneSchema = z.string().trim().min(9).max(20);
const DUPLICATE_CHECK_MIN_DELAY_MS = 150;
const GENERIC_CHECK_DUPLICATE_MESSAGE = "หากข้อมูลถูกต้อง คุณสามารถดำเนินการต่อได้";

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
      const email = emailSchema.parse(emailRaw);
      await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      await waitForMinimumResponseTime(startedAt);
      return apiResponse({
        field: "email",
        available: true,
        message: GENERIC_CHECK_DUPLICATE_MESSAGE,
      });
    }

    const normalizedPhone = normalizePhone(phoneSchema.parse(phoneRaw));
    await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      select: { id: true },
    });

    await waitForMinimumResponseTime(startedAt);
    return apiResponse({
      field: "phone",
      available: true,
      message: GENERIC_CHECK_DUPLICATE_MESSAGE,
    });
  } catch (error) {
    return apiError(error);
  }
}
