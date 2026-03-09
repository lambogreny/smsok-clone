import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, setSession } from "@/lib/auth";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { loginSchema } from "@/lib/validations";

// Pre-computed bcrypt hash — used for constant-time dummy comparison when user not found.
// Prevents timing-based email enumeration (user-not-found would otherwise return ~0ms vs ~100ms).
const DUMMY_HASH = "$2b$12$qF1xea/GGCtjbQ6FC32FAu0YSQWxmgOuBDgvb4IVBhTrnjXPVYwoC";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        mustChangePassword: true,
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

    await setSession(user.id);

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
