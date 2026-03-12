import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getPromoCodes, createPromoCode } from "@/lib/actions/admin-marketing";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["MARKETING"]);
    const page = Number(req.nextUrl.searchParams.get("page")) || 1;
    const limit = Number(req.nextUrl.searchParams.get("limit")) || 20;
    const data = await getPromoCodes(page, limit);
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["MARKETING"]);
    const body = await req.json();
    const data = await createPromoCode(body);
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
