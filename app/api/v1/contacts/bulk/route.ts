import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import { applyRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { normalizePhone } from "@/lib/validations";

const bulkAddSchema = z.object({
  contacts: z
    .array(
      z.object({
        name: z.string().max(100).optional(),
        phone: z.string().min(1),
      })
    )
    .min(1, "กรุณาเพิ่มรายชื่ออย่างน้อย 1 รายการ")
    .max(1000, "เพิ่มได้สูงสุด 1,000 รายชื่อต่อครั้ง"),
  groupId: z.string().cuid().optional(),
});

const bulkDeleteSchema = z.object({
  contactIds: z.array(z.string().cuid()).min(1).max(1000),
});

// POST /api/v1/contacts/bulk — Quick add multiple contacts
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "create", "contact");
    if (denied) return denied;

    const rl = await applyRateLimit(user.id, "import");
    if (rl.blocked) return rl.blocked;

    const body = await req.json();
    const input = bulkAddSchema.parse(body);

    // Verify group ownership if provided
    if (input.groupId) {
      const group = await prisma.contactGroup.findFirst({
        where: { id: input.groupId, userId: user.id },
      });
      if (!group) throw new Error("ไม่พบกลุ่มรายชื่อ");
    }

    let imported = 0;
    let skipped = 0;
    let duplicates = 0;
    let invalid = 0;
    const createdIds: string[] = [];

    for (const c of input.contacts) {
      const phone = normalizePhone(c.phone);
      if (!/^0[0-9]{9}$/.test(phone) && !/^\+66[0-9]{9}$/.test(phone)) {
        invalid++;
        continue;
      }

      try {
        const contact = await prisma.contact.create({
          data: {
            userId: user.id,
            name: c.name || phone,
            phone,
          },
        });
        createdIds.push(contact.id);
        imported++;
      } catch {
        // Unique constraint violation = duplicate
        duplicates++;
      }
    }

    // Add to group if specified
    if (input.groupId && createdIds.length > 0) {
      await prisma.contactGroupMember.createMany({
        data: createdIds.map((contactId) => ({
          groupId: input.groupId!,
          contactId,
        })),
        skipDuplicates: true,
      });
    }

    return apiResponse({
      imported,
      skipped,
      duplicates,
      invalid,
      total: input.contacts.length,
    }, 201);
  } catch (error) {
    return apiError(error);
  }
}

// DELETE /api/v1/contacts/bulk — Bulk delete contacts
export async function DELETE(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "delete", "contact");
    if (denied) return denied;

    const body = await req.json();
    const input = bulkDeleteSchema.parse(body);

    // Only delete contacts owned by user
    const result = await prisma.contact.deleteMany({
      where: {
        id: { in: input.contactIds },
        userId: user.id,
      },
    });

    return apiResponse({ deleted: result.count });
  } catch (error) {
    return apiError(error);
  }
}
