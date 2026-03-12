import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { adminVerifyTransaction } from "@/lib/actions/payments";
import { adminVerifyTransactionSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const admin = await authenticateAdmin(req);

    const input = adminVerifyTransactionSchema.parse(await req.json());

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
