import { NextRequest } from "next/server";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { ERROR_CODES } from "@/lib/api-log";
import { resetPassword } from "@/lib/actions/auth";
import { resetPasswordSchema } from "@/lib/validations";
import { getClientIp } from "@/lib/session-utils";
import { hasValidCsrfOrigin } from "@/lib/csrf";

export async function POST(req: NextRequest) {
  if (!hasValidCsrfOrigin(req)) {
    return apiError(new ApiError(403, "คำขอไม่ถูกต้อง กรุณาลองใหม่", ERROR_CODES.FORBIDDEN));
  }
  const ip = getClientIp(req.headers);
  try {
    const body = await req.json();
    const input = resetPasswordSchema.parse(body);
    const result = await resetPassword(input);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
