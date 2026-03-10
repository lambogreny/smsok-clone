import { NextRequest } from "next/server";
import { apiError, apiResponse } from "@/lib/api-auth";
import { resetPassword } from "@/lib/actions/auth";
import { resetPasswordSchema } from "@/lib/validations";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  // Rate limit BEFORE processing — prevents token brute-force
  const ip = getClientIp(req);
  const limit = checkRateLimit(ip, "password");
  if (!limit.allowed) {
    return rateLimitResponse(limit.resetIn);
  }

  try {
    const body = await req.json();
    const input = resetPasswordSchema.parse(body);
    const result = await resetPassword(input);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
