import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { disable2FA } from "@/lib/actions/two-factor";
import { disable2FASchema } from "@/lib/validations";

// POST /api/v1/settings/2fa/disable — verify password + disable 2FA
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    const body = await req.json();
    const { password } = disable2FASchema.parse(body);

    const result = await disable2FA(password);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
