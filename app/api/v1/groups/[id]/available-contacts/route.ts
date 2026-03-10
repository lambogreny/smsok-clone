import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

// GET /api/v1/groups/:id/available-contacts?search=xxx&tags=vip,bangkok
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateApiKey(req);
    const { id: groupId } = await params;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const tagsParam = searchParams.get("tags");

    // Verify group ownership
    const group = await prisma.contactGroup.findFirst({
      where: { id: groupId, userId: user.id },
    });
    if (!group) throw new Error("ไม่พบกลุ่ม");

    // Get IDs already in group
    const membersInGroup = await prisma.contactGroupMember.findMany({
      where: { groupId },
      select: { contactId: true },
    });
    const excludeIds = membersInGroup.map((m) => m.contactId);

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
      if (tagNames.length > 0) {
        andConditions.push({
          contactTags: {
            some: {
              tag: { name: { in: tagNames } },
            },
          },
        });
      }
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const contacts = await prisma.contact.findMany({
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
      take: 50,
    });

    const result = contacts.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      tags: c.contactTags.map((ct) => ct.tag),
    }));

    return apiResponse({ contacts: result });
  } catch (error) {
    return apiError(error);
  }
}
