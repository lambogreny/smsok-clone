import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import { prisma } from "@/lib/db";

// GET /api/v1/groups/:id/available-contacts?search=xxx&tags=vip,bangkok&page=1&limit=50
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
    const search = searchParams.get("search") || undefined;
    const tagsParam = searchParams.get("tags");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    // Verify group ownership
    const group = await prisma.contactGroup.findFirst({
      where: { id: groupId, userId: user.id },
    });
    if (!group) throw new ApiError(404, "ไม่พบกลุ่ม");

    // Get IDs already in group
    const membersInGroup = await prisma.contactGroupMember.findMany({
      where: { groupId },
      select: { contactId: true },
    });
    const excludeIds = membersInGroup.map((m: (typeof membersInGroup)[number]) => m.contactId);

    // Build where
    const where: Record<string, unknown> = {
      userId: user.id,
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
    };

    const andConditions: Record<string, unknown>[] = [];

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search } },
          { phone: { contains: search } },
        ],
      });
    }

    if (tagsParam) {
      const tagNames = tagsParam.split(",").map((t) => t.trim()).filter(Boolean);
      // AND semantics: contact must have ALL specified tags
      for (const tagName of tagNames) {
        andConditions.push({
          contactTags: {
            some: {
              tag: { name: tagName },
            },
          },
        });
      }
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          contactTags: {
            include: { tag: { select: { id: true, name: true, color: true } } },
          },
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contact.count({ where }),
    ]);

    const result = contacts.map((c: (typeof contacts)[number]) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      tags: c.contactTags.map((ct: (typeof c.contactTags)[number]) => ct.tag),
    }));

    return apiResponse({
      contacts: result,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return apiError(error);
  }
}
