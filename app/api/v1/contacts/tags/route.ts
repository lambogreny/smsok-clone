import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import { prisma } from "@/lib/db";

// GET /api/v1/contacts/tags — list all tags for the user
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "read", "contact");
    if (denied) return denied;

    const tags = await prisma.tag.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, color: true },
      orderBy: { name: "asc" },
    });

    return apiResponse({ tags });
  } catch (error) {
    return apiError(error);
  }
}
