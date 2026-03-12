import { NextRequest } from "next/server";
import { handleVerifyOtp } from "@/lib/otp-api";

// POST /api/v1/otp/verify
// Body: { ref: "ABC123EF", code: "123456" }
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { applyRateLimit } = await import("@/lib/rate-limit");
  const rl = await applyRateLimit(ip, "otp_verify");
  if (rl.blocked) return rl.blocked;

  return handleVerifyOtp(req);
}
