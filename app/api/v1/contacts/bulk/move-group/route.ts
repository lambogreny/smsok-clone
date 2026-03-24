import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  contactIds: z.array(z.string().cuid()).min(1).max(1000),
  fromGroupId: z.string().cuid(),
  toGroupId: z.string().cuid(),
});

// POST /api/v1/contacts/bulk/move-group
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "update", "group");
    if (denied) return denied;

    const body = await req.json();
    const input = schema.parse(body);

    // Verify both groups belong to user
    const [fromGroup, toGroup] = await Promise.all([
      prisma.contactGroup.findFirst({ where: { id: input.fromGroupId, userId: user.id } }),
      prisma.contactGroup.findFirst({ where: { id: input.toGroupId, userId: user.id } }),
    ]);
    if (!fromGroup) throw new Error("ไม่พบกลุ่มต้นทาง");
    if (!toGroup) throw new Error("ไม่พบกลุ่มปลายทาง");

    // Verify contacts belong to user
    const contacts = await prisma.contact.findMany({
      where: { id: { in: input.contactIds }, userId: user.id },
      select: { id: true },
    });
    if (contacts.length !== input.contactIds.length) {
      throw new Error("ไม่พบรายชื่อบางรายการ");
    }

    const contactIds = contacts.map((c: (typeof contacts)[number]) => c.id);

    const [removed, added] = await prisma.$transaction([
      // Remove from old group
      prisma.contactGroupMember.deleteMany({
        where: { groupId: input.fromGroupId, contactId: { in: contactIds } },
      }),
      // Add to new group
      prisma.contactGroupMember.createMany({
        data: contactIds.map((contactId: (typeof contactIds)[number]) => ({
          groupId: input.toGroupId,
          contactId,
        })),
        skipDuplicates: true,
      }),
    ]);

    return apiResponse({
      moved: added.count,
      removedFromSource: removed.count,
      alreadyInTarget: contactIds.length - added.count,
    });
  } catch (error) {
    return apiError(error);
  }
}
