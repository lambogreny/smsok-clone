import { ApiError, apiError } from "@/lib/api-auth";

const DEPRECATION_MESSAGE = "Auto top-up ถูกยกเลิกแล้ว ใช้การซื้อแพ็กเกจและแนบสลิปตาม flow ใหม่แทน";

// GET /api/v1/packages/auto-topup — deprecated in package-purchase model
export async function GET() {
  return apiError(new ApiError(410, DEPRECATION_MESSAGE));
}

// POST /api/v1/packages/auto-topup — deprecated in package-purchase model
export async function POST() {
  return apiError(new ApiError(410, DEPRECATION_MESSAGE));
}
