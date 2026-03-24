import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  contactIds: z.array(z.string().cuid()).min(1).max(1000),
  groupId: z.string().cuid(),
});

// POST /api/v1/contacts/bulk/add-to-group
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "update", "group");
    if (denied) return denied;

    const body = await req.json();
    const input = schema.parse(body);

    // Verify group ownership
    const group = await prisma.contactGroup.findFirst({
      where: { id: input.groupId, userId: user.id },
    });
    if (!group) throw new Error("ไม่พบกลุ่มรายชื่อ");

    // Verify contacts belong to user
    const contacts = await prisma.contact.findMany({
      where: { id: { in: input.contactIds }, userId: user.id },
      select: { id: true },
    });

    const result = await prisma.contactGroupMember.createMany({
      data: contacts.map((c: (typeof contacts)[number]) => ({
        groupId: input.groupId,
        contactId: c.id,
      })),
      skipDuplicates: true,
    });

    return apiResponse({
      success: true,
      added: result.count,
      alreadyMember: contacts.length - result.count,
      notFound: input.contactIds.length - contacts.length,
    });
  } catch (error) {
    return apiError(error);
  }
}
