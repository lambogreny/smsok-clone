import { NextRequest } from "next/server"
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth"
import { acceptTerms, getTermsStatus } from "@/lib/actions/terms"

// GET /api/v1/tos — get current ToS version + user acceptance status
export async function GET(req: NextRequest) {
  try {
    await authenticateApiKey(req)
    const status = await getTermsStatus()
    return apiResponse(status)
  } catch (error) {
    return apiError(error)
  }
}

// POST /api/v1/tos — accept current ToS version
export async function POST(req: NextRequest) {
  try {
    await authenticateApiKey(req)
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      undefined
    const userAgent = req.headers.get("user-agent") || undefined

    const result = await acceptTerms({ ipAddress, userAgent })
    return apiResponse(result, 201)
  } catch (error) {
    return apiError(error)
  }
}
