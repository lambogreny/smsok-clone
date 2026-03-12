import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import { getCustomFields, createCustomField } from "@/lib/actions/custom-fields";

// GET /api/v1/custom-fields — list all custom fields
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "read", "contact");
    if (denied) return denied;

    const fields = await getCustomFields(user.id);
    return apiResponse({ fields });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/v1/custom-fields — create custom field
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "create", "contact");
    if (denied) return denied;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }
    const { name, type, options, required } = body as Record<string, unknown>;
    if (!name || typeof name !== "string") throw new ApiError(400, "กรุณาระบุชื่อฟิลด์");
    if (!type || typeof type !== "string") throw new ApiError(400, "กรุณาระบุประเภทฟิลด์");

    const field = await createCustomField(user.id, {
      name,
      type,
      options: Array.isArray(options) ? options.filter((o): o is string => typeof o === "string") : undefined,
      required: typeof required === "boolean" ? required : undefined,
    });
    return apiResponse(field, 201);
  } catch (error) {
    return apiError(error);
  }
}
