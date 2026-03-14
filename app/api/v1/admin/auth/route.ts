import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-auth";
import {
  ADMIN_SESSION_COOKIE_NAME,
  getAdminSessionCookieOptions,
  loginAdmin,
} from "@/lib/admin-auth";
import { getClientIp } from "@/lib/session-utils";
import { loginSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);

    const body = await req.json();
    const { email, password } = loginSchema.parse(body);
    const result = await loginAdmin(email, password);
    const response = NextResponse.json({
      token: result.token,
      admin: result.admin,
    });
    response.cookies.set(
      ADMIN_SESSION_COOKIE_NAME,
      result.token,
      getAdminSessionCookieOptions(),
    );
    return response;
  } catch (error) {
    return apiError(error);
  }
}
