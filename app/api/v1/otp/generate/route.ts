import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { generateOtp_ } from "@/lib/actions/otp";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

// POST /api/v1/otp/generate
// Body: { phone: "0891234567", purpose?: "verify" | "login" | "transaction" }
// Rate limit: 3 req / 5 min per phone+IP (architect spec #100)
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);

    const body = await req.json();
    const phone = body.phone as string;

    // Dual-key rate limit: phone + IP (architect spec #100)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const phoneLimit = checkRateLimit(`phone:${phone}`, "otp_generate");
    if (!phoneLimit.allowed) return rateLimitResponse(phoneLimit.resetIn);

    const ipLimit = checkRateLimit(`ip:${ip}`, "otp_generate");
    if (!ipLimit.allowed) return rateLimitResponse(ipLimit.resetIn);

    const result = await generateOtp_(user.id, phone, body.purpose);
    return apiResponse(result, 201);
  } catch (error) {
    return apiError(error);
  }
}
