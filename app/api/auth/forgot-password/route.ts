import { NextRequest } from "next/server";
import { apiResponse } from "@/lib/api-auth";
import { forgotPassword } from "@/lib/actions/auth";
import { forgotPasswordSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

const GENERIC_MESSAGE = "หากเบอร์นี้ลงทะเบียนไว้ จะได้รับ SMS";

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = checkRateLimit(ip, "password");

  if (limit.allowed) {
    try {
      const body = await req.json().catch(() => ({}));
      const parsed = forgotPasswordSchema.safeParse(body);
      if (parsed.success) {
        await forgotPassword(parsed.data);
      }
    } catch {
      // Swallow all errors to avoid revealing whether the user exists.
    }
  }

  return apiResponse({ message: GENERIC_MESSAGE });
}
