import { NextRequest } from "next/server";
import { apiError, apiResponse } from "@/lib/api-auth";
import { forgotPassword } from "@/lib/actions/auth";
import { forgotPasswordSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = forgotPasswordSchema.parse(body);
    const result = await forgotPassword(input);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
