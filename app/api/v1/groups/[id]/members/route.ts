import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import { prisma } from "@/lib/db";

// GET /api/v1/groups/:id/members?search=xxx&page=1&limit=20
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "read", "group");
    if (denied) return denied;

    const { id: groupId } = await params;
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const search = searchParams.get("search");
    const skip = (page - 1) * limit;

    // Verify group ownership
    const group = await prisma.contactGroup.findFirst({
      where: { id: groupId, userId: user.id },
    });
    if (!group) throw new Error("ไม่พบกลุ่ม");

    const memberWhere: Record<string, unknown> = { groupId };
    if (search) {
      memberWhere.contact = {
        OR: [
          { name: { contains: search } },
          { phone: { contains: search } },
        ],
      };
    }

    const [members, total] = await prisma.$transaction([
      prisma.contactGroupMember.findMany({
        where: memberWhere,
        include: {
          contact: { select: { id: true, name: true, phone: true, email: true, createdAt: true } },
        },
        orderBy: { contact: { name: "asc" } },
        skip,
        take: limit,
      }),
      prisma.contactGroupMember.count({ where: memberWhere }),
    ]);

    return apiResponse({
      members: members.map((m) => m.contact),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return apiError(error);
  }
}
