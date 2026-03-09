import { NextRequest } from "next/server";
import { apiError, apiResponse } from "@/lib/api-auth";
import { resetPassword } from "@/lib/actions/auth";
import { resetPasswordSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = resetPasswordSchema.parse(body);
    const result = await resetPassword(input);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
