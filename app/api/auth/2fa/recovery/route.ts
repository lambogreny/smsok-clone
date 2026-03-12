import { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/db"
import { setSession } from "@/lib/auth"
import { ApiError, apiError, apiResponse } from "@/lib/api-auth"
import { startApiLog, setApiLogUser } from "@/lib/api-log"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { env } from "@/lib/env"
import { useRecoveryCode } from "@/lib/actions/two-factor"
import { recovery2FASchema } from "@/lib/validations"

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  )
}

export async function POST(req: NextRequest) {
  startApiLog(req)

  // Rate limit BEFORE auth — prevents recovery code brute-force
  const ip = getClientIp(req)
  const limit = await checkRateLimit(ip, "auth")
  if (!limit.allowed) {
    return rateLimitResponse(limit.resetIn)
  }

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON")
    }

    const { challengeToken, recoveryCode } = recovery2FASchema.parse(body)

    // Verify challenge token
    let payload: { userId: string; purpose: string }
    try {
      payload = jwt.verify(challengeToken, env.JWT_SECRET) as { userId: string; purpose: string }
    } catch {
      throw new ApiError(401, "Challenge token ไม่ถูกต้องหรือหมดอายุ")
    }

    if (payload.purpose !== "2fa-challenge") {
      throw new ApiError(401, "Token ไม่ถูกต้อง")
    }

    // Verify recovery code
    const result = await useRecoveryCode(payload.userId, recoveryCode)

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        mustChangePassword: true,
      },
    })
    if (!user) throw new ApiError(404, "ไม่พบผู้ใช้")

    // Set session after recovery code verified
    await setSession(user.id, { headers: req.headers })
    setApiLogUser(user.id)

    return apiResponse({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      remainingRecoveryCodes: result.remainingCodes,
      mustChangePassword: user.mustChangePassword,
      redirectTo: user.mustChangePassword ? "/dashboard/settings?forceChange=true" : "/dashboard",
    })
  } catch (error) {
    return apiError(error)
  }
}
