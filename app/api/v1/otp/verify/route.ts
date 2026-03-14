import { NextRequest } from "next/server";
import { handleVerifyOtp } from "@/lib/otp-api";

// POST /api/v1/otp/verify
// Body: { ref: "ABC123EF", code: "123456" }
export async function POST(req: NextRequest) {
  return handleVerifyOtp(req);
}
