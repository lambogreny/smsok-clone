import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { getUserTransactions } from "@/lib/actions/payments";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const transactions = await getUserTransactions(user.id);
    return apiResponse({ transactions });
  } catch (error) {
    return apiError(error);
  }
}
