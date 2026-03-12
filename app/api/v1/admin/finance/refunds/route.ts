import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { createRefund, getPendingRefunds } from "@/lib/actions/admin-finance";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["FINANCE"]);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const result = await getPendingRefunds(page);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await authenticateAdmin(req, ["FINANCE"]);
    const body = await req.json();
    const refund = await createRefund(admin.id, body);
    return apiResponse(refund, 201);
  } catch (error) {
    return apiError(error);
  }
}
