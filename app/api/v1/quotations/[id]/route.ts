import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { requireApiPermission } from "@/lib/rbac";
import { getQuotation, updateQuotation, deleteQuotation } from "@/lib/actions/quotations";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/v1/quotations/:id
export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const denied = await requireApiPermission(session.id, "read", "invoice");
    if (denied) return denied;

    const { id } = await ctx.params;
    const quotation = await getQuotation(session.id, id);
    return apiResponse({ quotation });
  } catch (error) {
    return apiError(error);
  }
}

// PUT /api/v1/quotations/:id
export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const denied = await requireApiPermission(session.id, "update", "invoice");
    if (denied) return denied;

    const { id } = await ctx.params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }
    const quotation = await updateQuotation(session.id, id, body);
    return apiResponse({ quotation });
  } catch (error) {
    return apiError(error);
  }
}

// DELETE /api/v1/quotations/:id
export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const denied = await requireApiPermission(session.id, "delete", "invoice");
    if (denied) return denied;

    const { id } = await ctx.params;
    await deleteQuotation(session.id, id);
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
