import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { normalizePhone } from "@/lib/validations";
import { readJsonOr400 } from "@/lib/read-json-or-400";

const bulkAddSchema = z.object({
  contacts: z
    .array(
      z.object({
        name: z.string().max(100).optional(),
        phone: z.string().min(1),
      })
    )
    .min(1, "กรุณาเพิ่มรายชื่ออย่างน้อย 1 รายการ")
    .max(5000, "เพิ่มได้สูงสุด 5,000 รายชื่อต่อครั้ง"),
  groupId: z.string().cuid().optional(),
});

const bulkDeleteSchema = z.object({
  contactIds: z.array(z.string().cuid()).min(1).max(5000),
});

// POST /api/v1/contacts/bulk — Quick add multiple contacts
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "create", "contact");
    if (denied) return denied;
    const body = await readJsonOr400(req);
    const input = bulkAddSchema.parse(body);

    // Verify group ownership if provided
    if (input.groupId) {
      const group = await prisma.contactGroup.findFirst({
        where: { id: input.groupId, userId: user.id },
      });
      if (!group) throw new Error("ไม่พบกลุ่มรายชื่อ");
    }

    const validRows: { name: string; phone: string }[] = [];
    const seenPhones = new Set<string>();
    let duplicates = 0;
    let invalid = 0;

    for (const c of input.contacts) {
      const phone = normalizePhone(c.phone);
      if (!/^0[0-9]{9}$/.test(phone) && !/^\+66[0-9]{9}$/.test(phone)) {
        invalid++;
        continue;
      }

      if (seenPhones.has(phone)) {
        duplicates++;
        continue;
      }

      seenPhones.add(phone);
      validRows.push({
        name: c.name?.trim() || phone,
        phone,
      });
    }

    const existingContacts = validRows.length === 0
      ? []
      : await prisma.contact.findMany({
        where: {
          userId: user.id,
          phone: { in: validRows.map((contact) => contact.phone) },
        },
        select: { id: true, phone: true },
      });
    const existingPhones = new Set(existingContacts.map((contact: (typeof existingContacts)[number]) => contact.phone));
    duplicates += existingContacts.length;

    const toCreate = validRows.filter((contact) => !existingPhones.has(contact.phone));
    if (toCreate.length > 0) {
      await prisma.contact.createMany({
        data: toCreate.map((contact) => ({
          userId: user.id,
          name: contact.name,
          phone: contact.phone,
        })),
        skipDuplicates: true,
      });
    }

    const allValidContacts = validRows.length === 0
      ? []
      : await prisma.contact.findMany({
        where: {
          userId: user.id,
          phone: { in: validRows.map((contact) => contact.phone) },
        },
        select: { id: true, phone: true },
      });

    if (input.groupId && allValidContacts.length > 0) {
      await prisma.contactGroupMember.createMany({
        data: allValidContacts.map((contact: (typeof allValidContacts)[number]) => ({
          groupId: input.groupId!,
          contactId: contact.id,
        })),
        skipDuplicates: true,
      });
    }

    return apiResponse({
      imported: toCreate.length,
      addedToGroup: input.groupId ? allValidContacts.length : 0,
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

    const body = await readJsonOr400(req);
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
