import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { addToBlacklist, removeFromBlacklist, getBlacklist } from "@/lib/actions/admin-ops";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["OPERATIONS", "SUPPORT"]);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const result = await getBlacklist(page);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await authenticateAdmin(req, ["OPERATIONS"]);
    const body = await req.json();
    const item = await addToBlacklist(admin.id, body);
    return apiResponse(item, 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["OPERATIONS"]);
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    if (!phone) throw new Error("กรุณาระบุเบอร์โทร");
    await removeFromBlacklist(phone);
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
