import { NextRequest } from "next/server";
import { authenticateRequest, ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { adminVerifyTransaction, adminGetPendingTransactions } from "@/lib/actions/payments";
import { verifyTransactionSchema } from "@/lib/validations";

async function requireAdmin(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (user.role !== "admin") {
    throw new ApiError(403, "Admin access required");
  }
  return user;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const pending = await adminGetPendingTransactions();
    return apiResponse({ transactions: pending });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const input = verifyTransactionSchema.parse(body);
    await adminVerifyTransaction(
      admin.id,
      input.transactionId,
      input.action,
      input.rejectNote
    );
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
