import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  contactIds: z.array(z.string().cuid()).min(1).max(1000),
});

// POST /api/v1/groups/:id/members/bulk-remove
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    const { id: groupId } = await params;
    const body = await req.json();
    const input = schema.parse(body);

    // Verify group ownership
    const group = await prisma.contactGroup.findFirst({
      where: { id: groupId, userId: user.id },
    });
    if (!group) throw new Error("ไม่พบกลุ่ม");

    const result = await prisma.contactGroupMember.deleteMany({
      where: {
        groupId,
        contactId: { in: input.contactIds },
      },
    });

    return apiResponse({ removed: result.count });
  } catch (error) {
    return apiError(error);
  }
}
