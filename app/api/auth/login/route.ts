import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, setSession, signToken } from "@/lib/auth";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { loginSchema } from "@/lib/validations";
import { startApiLog, setApiLogUser } from "@/lib/api-log";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import jwt from "jsonwebtoken";
import { env } from "@/lib/env";

// Pre-computed bcrypt hash — used for constant-time dummy comparison when user not found.
// Prevents timing-based email enumeration (user-not-found would otherwise return ~0ms vs ~100ms).
const DUMMY_HASH = "$2b$12$qF1xea/GGCtjbQ6FC32FAu0YSQWxmgOuBDgvb4IVBhTrnjXPVYwoC";

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  startApiLog(req);

  // Rate limit BEFORE any auth logic — prevents brute-force
  const ip = getClientIp(req);
  const limit = checkRateLimit(ip, "auth");
  if (!limit.allowed) {
    return rateLimitResponse(limit.resetIn);
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }
    const input = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        mustChangePassword: true,
        twoFactorAuth: {
          select: { enabled: true },
        },
      },
    });

    if (!user) {
      // Constant-time: always run bcrypt even when user not found
      await verifyPassword(input.password, DUMMY_HASH);
      throw new ApiError(401, "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }

    const valid = await verifyPassword(input.password, user.password);
    if (!valid) {
      throw new ApiError(401, "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }

    // Check if 2FA is enabled
    if (user.twoFactorAuth?.enabled) {
      // Don't set session yet — return a temporary 2FA challenge token
      const challengeToken = jwt.sign(
        { userId: user.id, purpose: "2fa-challenge" },
        env.JWT_SECRET,
        { expiresIn: "5m" }
      );

      setApiLogUser(user.id);
      return apiResponse({
        success: true,
        needs2FA: true,
        challengeToken,
      });
    }

    // No 2FA — set session directly
    await setSession(user.id);
    setApiLogUser(user.id);

    return apiResponse({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      mustChangePassword: user.mustChangePassword,
      redirectTo: user.mustChangePassword ? "/dashboard/settings?forceChange=true" : "/dashboard",
    });
  } catch (error) {
    return apiError(error);
  }
}
