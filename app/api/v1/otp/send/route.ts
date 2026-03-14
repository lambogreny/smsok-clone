import { NextRequest } from "next/server";
import { handleSendOtp } from "@/lib/otp-api";

// POST /api/v1/otp/send
// Body: { phone: "0891234567", purpose?: "verify" | "login" | "transaction" }
export async function POST(req: NextRequest) {
  return handleSendOtp(req);
}
