import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { requireApiPermission } from "@/lib/rbac";
import { createQuotation, listQuotations } from "@/lib/actions/quotations";

// GET /api/v1/quotations — list quotations
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const denied = await requireApiPermission(session.id, "read", "invoice");
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    const filters = {
      page: Number(searchParams.get("page")) || 1,
      limit: Number(searchParams.get("limit")) || 20,
      status: searchParams.get("status") || undefined,
    };

    const result = await listQuotations(session.id, filters);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/v1/quotations — create quotation
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const denied = await requireApiPermission(session.id, "create", "invoice");
    if (denied) return denied;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }
    const quotation = await createQuotation(session.id, body);
    return apiResponse({ quotation }, 201);
  } catch (error) {
    return apiError(error);
  }
}
