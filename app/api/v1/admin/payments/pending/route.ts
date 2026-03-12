import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { adminGetPendingTransactions } from "@/lib/actions/payments";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req);

    const transactions = await adminGetPendingTransactions();
    return apiResponse({ transactions });
  } catch (error) {
    return apiError(error);
  }
}
