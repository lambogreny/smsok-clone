import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, setSession } from "@/lib/auth";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { loginSchema } from "@/lib/validations";
import { ERROR_CODES, startApiLog, setApiLogUser } from "@/lib/api-log";
import { applyRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/session-utils";
import jwt from "jsonwebtoken";
import { env } from "@/lib/env";
import { hasValidCsrfOrigin } from "@/lib/csrf";

// Pre-computed bcrypt hash — used for constant-time dummy comparison when user not found.
// Prevents timing-based email enumeration (user-not-found would otherwise return ~0ms vs ~100ms).
const DUMMY_HASH = "$2b$12$qF1xea/GGCtjbQ6FC32FAu0YSQWxmgOuBDgvb4IVBhTrnjXPVYwoC";

export async function POST(req: NextRequest) {
  startApiLog(req);

  if (!hasValidCsrfOrigin(req)) {
    return apiError(new ApiError(403, "คำขอไม่ถูกต้อง กรุณาลองใหม่", ERROR_CODES.FORBIDDEN));
  }

  // Rate limit BEFORE any auth logic — prevents brute-force
  const ip = getClientIp(req.headers);
  const rl = await applyRateLimit(ip, "auth_login");
  if (rl.blocked) return rl.blocked;

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
        failedLoginAttempts: true,
        lockedUntil: true,
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

    // Always run bcrypt first (constant-time) — check lockout AFTER to avoid leaking account existence
    const valid = await verifyPassword(input.password, user.password);

    // Account lockout check — same 401 message to prevent enumeration
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ApiError(401, "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }

    if (!valid) {
      // Increment failed attempts
      const attempts = (user.failedLoginAttempts ?? 0) + 1;
      const lockData: Record<string, unknown> = { failedLoginAttempts: attempts };

      // Lock after 5 failed attempts for 15 minutes
      if (attempts >= 5) {
        const lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        lockData.lockedUntil = lockedUntil;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: lockData,
      });

      // Generic 401 for all failures — don't reveal lockout state
      throw new ApiError(401, "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }

    // Login success — reset failed attempts
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
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
    await setSession(user.id, { headers: req.headers });
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
