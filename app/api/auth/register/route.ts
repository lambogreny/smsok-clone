import { NextRequest } from "next/server";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { registerWithOtp } from "@/lib/actions";
import { startApiLog } from "@/lib/api-log";

export async function POST(req: NextRequest) {
  startApiLog(req);
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }

    const data = body as {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
      otpRef?: string;
      otpCode?: string;
    };

    if (!data.name || !data.email || !data.phone || !data.password || !data.otpRef || !data.otpCode) {
      throw new ApiError(400, "กรุณากรอกข้อมูลให้ครบถ้วน");
    }

    await registerWithOtp({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      otpRef: data.otpRef,
      otpCode: data.otpCode,
    });

    return apiResponse({ success: true, redirectTo: "/dashboard" }, 201);
  } catch (error) {
    return apiError(error);
  }
}
