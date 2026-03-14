import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  authenticateAdmin,
  revokeAdminSession,
} from "@/lib/admin-auth";
import { apiError } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const admin = await authenticateAdmin(req);
    await revokeAdminSession(admin.sessionId);

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(0),
    });
    return response;
  } catch (error) {
    return apiError(error);
  }
}
