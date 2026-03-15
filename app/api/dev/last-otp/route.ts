import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// DEV-ONLY endpoint — returns last OTP request metadata for QA testing
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const otp = await prisma.otpRequest.findFirst({
      orderBy: { createdAt: "desc" },
      select: {
        phone: true,
        refCode: true,
        purpose: true,
        verified: true,
        attempts: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    if (!otp) {
      return NextResponse.json({ message: "No OTP requests found" });
    }

    return NextResponse.json({
      ...otp,
      note: "OTP plaintext is never returned here. Use DEV_OTP_BYPASS only for local dev fallback when SMS gateway is unavailable.",
      expired: otp.expiresAt < new Date(),
    });
  } catch (error) {
    console.error("[dev/last-otp]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
