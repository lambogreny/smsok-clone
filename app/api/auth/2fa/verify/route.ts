import { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/db"
import { setSession } from "@/lib/auth"
import { ApiError, apiError, apiResponse } from "@/lib/api-auth"
import { startApiLog, setApiLogUser } from "@/lib/api-log"
import { env } from "@/lib/env"
import { verify2FAChallenge } from "@/lib/actions/two-factor"

export async function POST(req: NextRequest) {
  startApiLog(req)
  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON")
    }

    const { challengeToken, code } = body as { challengeToken?: string; code?: string }
    if (!challengeToken) throw new ApiError(400, "กรุณาส่ง challengeToken")
    if (!code) throw new ApiError(400, "กรุณาส่งรหัส 2FA")

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

    // Verify TOTP code
    await verify2FAChallenge(payload.userId, code)

    // Get user info for response
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

    // Set session after 2FA verified
    await setSession(user.id)
    setApiLogUser(user.id)

    return apiResponse({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      mustChangePassword: user.mustChangePassword,
      redirectTo: user.mustChangePassword ? "/dashboard/settings?forceChange=true" : "/dashboard",
    })
  } catch (error) {
    return apiError(error)
  }
}
