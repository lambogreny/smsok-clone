import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { z } from "zod";

const addMembersSchema = z.object({
  contactIds: z.array(z.string().cuid()).min(1, "กรุณาเลือกรายชื่ออย่างน้อย 1 รายการ").max(5000),
});

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
    if (!group) throw new ApiError(404, "ไม่พบกลุ่ม");

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
      members: members.map((m: (typeof members)[number]) => m.contact),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/v1/groups/:id/members — add contacts to group
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "update", "group");
    if (denied) return denied;

    const { id: groupId } = await params;
    const body = await req.json();
    const input = addMembersSchema.parse(body);

    // Verify group ownership
    const group = await prisma.contactGroup.findFirst({
      where: { id: groupId, userId: user.id },
    });
    if (!group) throw new ApiError(404, "ไม่พบกลุ่ม");

    // Verify all contacts belong to user
    const ownedContacts = await prisma.contact.findMany({
      where: { id: { in: input.contactIds }, userId: user.id },
      select: { id: true },
    });
    const ownedIds = new Set(ownedContacts.map((c: (typeof ownedContacts)[number]) => c.id));
    const validIds = input.contactIds.filter((id) => ownedIds.has(id));

    if (validIds.length === 0) {
      throw new ApiError(400, "ไม่พบรายชื่อที่ต้องการเพิ่ม");
    }

    const result = await prisma.contactGroupMember.createMany({
      data: validIds.map((contactId) => ({ groupId, contactId })),
      skipDuplicates: true,
    });

    return apiResponse({
      added: result.count,
      duplicates: validIds.length - result.count,
      invalid: input.contactIds.length - validIds.length,
      total: input.contactIds.length,
    }, 201);
  } catch (error) {
    return apiError(error);
  }
}
