import { NextRequest } from "next/server";
import { authenticateApiKey, ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { adminVerifyTransaction, adminGetPendingTransactions } from "@/lib/actions/payments";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

async function requireAdmin(req: NextRequest) {
  const user = await authenticateApiKey(req);
  if (user.role !== "admin") {
    throw new ApiError(403, "Admin access required");
  }
  return user;
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);

    const limit = checkRateLimit(admin.id, "admin");
    if (!limit.allowed) return rateLimitResponse(limit.resetIn);

    const pending = await adminGetPendingTransactions();
    return apiResponse({ transactions: pending });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);

    const limit = checkRateLimit(admin.id, "admin");
    if (!limit.allowed) return rateLimitResponse(limit.resetIn);

    const body = await req.json();
    await adminVerifyTransaction(
      admin.id,
      body.transactionId,
      body.action,
      body.rejectNote
    );
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
