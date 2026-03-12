"use server";

import { revalidatePath } from "next/cache";
import { prisma as db } from "../db";
import { z } from "zod";
import { normalizePhone } from "../validations";
import { checkRateLimit } from "../rate-limit";

const createGroupSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อกลุ่ม").max(100),
});

const importContactSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ").max(100).trim(),
  phone: z.string().regex(/^(0[0-9]{9}|\+66[0-9]{9})$/, "เบอร์โทรไม่ถูกต้อง"),
});

const MAX_IMPORT_BATCH = 200;

export async function getGroups(userId: string) {
  return db.contactGroup.findMany({
    where: { userId },
    include: {
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createGroup(userId: string, data: unknown) {
  const parsed = createGroupSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }
  const group = await db.contactGroup.create({
    data: { userId, name: parsed.data.name },
  });
  revalidatePath("/dashboard/groups");
  return group;
}

export async function updateGroup(userId: string, groupId: string, data: unknown) {
  const parsed = createGroupSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }
  const input = parsed.data;
  const existing = await db.contactGroup.findFirst({ where: { id: groupId, userId } });
  if (!existing) throw new Error("ไม่พบกลุ่ม");
  const updated = await db.contactGroup.update({
    where: { id: groupId },
    data: { name: input.name },
  });
  revalidatePath("/dashboard/groups");
  return updated;
}

export async function deleteGroup(userId: string, groupId: string) {
  const existing = await db.contactGroup.findFirst({ where: { id: groupId, userId } });
  if (!existing) throw new Error("ไม่พบกลุ่ม");
  await db.contactGroup.delete({ where: { id: groupId } });
  revalidatePath("/dashboard/groups");
}

export async function getGroupContacts(userId: string, groupId: string) {
  const group = await db.contactGroup.findFirst({ where: { id: groupId, userId } });
  if (!group) throw new Error("ไม่พบกลุ่ม");
  return db.contactGroupMember.findMany({
    where: { groupId },
    include: { contact: { select: { id: true, name: true, phone: true, email: true } } },
    orderBy: { contact: { name: "asc" } },
  });
}

export async function addContactToGroup(userId: string, groupId: string, contactId: string) {
  const [group, contact] = await Promise.all([
    db.contactGroup.findFirst({ where: { id: groupId, userId } }),
    db.contact.findFirst({ where: { id: contactId, userId } }),
  ]);
  if (!group) throw new Error("ไม่พบกลุ่ม");
  if (!contact) throw new Error("ไม่พบรายชื่อ");

  // Check if already a member (prevent unique constraint error)
  const existing = await db.contactGroupMember.findUnique({
    where: { groupId_contactId: { groupId, contactId } },
    include: { contact: { select: { id: true, name: true, phone: true, email: true } } },
  });
  if (existing) return existing;

  const member = await db.contactGroupMember.create({
    data: { groupId, contactId },
    include: { contact: { select: { id: true, name: true, phone: true, email: true } } },
  });
  revalidatePath("/dashboard/groups");
  return member;
}

export async function removeContactFromGroup(userId: string, groupId: string, contactId: string) {
  const group = await db.contactGroup.findFirst({ where: { id: groupId, userId } });
  if (!group) throw new Error("ไม่พบกลุ่ม");
  await db.contactGroupMember.delete({
    where: { groupId_contactId: { groupId, contactId } },
  });
  revalidatePath("/dashboard/groups");
}

export async function bulkRemoveFromGroup(userId: string, groupId: string, contactIds: string[]) {
  const group = await db.contactGroup.findFirst({ where: { id: groupId, userId } });
  if (!group) throw new Error("ไม่พบกลุ่ม");
  if (contactIds.length === 0) throw new Error("กรุณาเลือกรายชื่อ");

  await db.contactGroupMember.deleteMany({
    where: { groupId, contactId: { in: contactIds } },
  });

  revalidatePath("/dashboard/groups");
  return { removed: contactIds.length };
}

// ==========================================
// Import contacts to group (create + add in one transaction)
// ==========================================

export async function importContactsToGroup(
  userId: string,
  groupId: string,
  csvData: { name: string; phone: string }[]
) {
  // Rate limit
  const limit = await checkRateLimit(userId, "import");
  if (!limit.allowed) throw new Error("นำเข้าบ่อยเกินไป กรุณารอสักครู่");

  // Verify group ownership
  const group = await db.contactGroup.findFirst({ where: { id: groupId, userId } });
  if (!group) throw new Error("ไม่พบกลุ่ม");

  if (!Array.isArray(csvData) || csvData.length === 0) throw new Error("ไม่มีรายชื่อที่จะนำเข้า");
  if (csvData.length > MAX_IMPORT_BATCH) throw new Error(`นำเข้าได้สูงสุด ${MAX_IMPORT_BATCH} รายชื่อต่อครั้ง`);

  // Step 1: Validate all rows with Zod + deduplicate phones
  const valid: { name: string; phone: string }[] = [];
  const invalid: { row: number; name?: string; phone?: string; error: string }[] = [];
  const seenPhones = new Set<string>();

  for (let i = 0; i < csvData.length; i++) {
    const result = importContactSchema.safeParse(csvData[i]);
    if (!result.success) {
      invalid.push({
        row: i + 1,
        name: csvData[i]?.name,
        phone: csvData[i]?.phone,
        error: result.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง",
      });
      continue;
    }

    const normalized = normalizePhone(result.data.phone);
    if (seenPhones.has(normalized)) {
      invalid.push({
        row: i + 1,
        name: result.data.name,
        phone: result.data.phone,
        error: "เบอร์ซ้ำในไฟล์",
      });
      continue;
    }
    seenPhones.add(normalized);
    valid.push({ name: result.data.name, phone: normalized });
  }

  if (valid.length === 0) {
    return {
      imported: 0,
      duplicates: 0,
      invalid: invalid.length,
      addedToGroup: 0,
      total: csvData.length,
      invalidRows: invalid,
    };
  }

  // Step 2: Bulk create + add to group in one transaction
  const validPhones = valid.map((v) => v.phone);

  const result = await db.$transaction(async (tx) => {
    // Find existing contacts by phone (batch query, not N+1)
    const existingContacts = await tx.contact.findMany({
      where: { userId, phone: { in: validPhones } },
      select: { id: true, phone: true },
    });
    const existingPhoneMap = new Map(existingContacts.map((c) => [c.phone, c.id]));

    // Split into new vs existing
    const toCreate = valid.filter((v) => !existingPhoneMap.has(v.phone));
    const duplicateCount = valid.length - toCreate.length;

    // Bulk create new contacts (createMany, not loop)
    if (toCreate.length > 0) {
      await tx.contact.createMany({
        data: toCreate.map((c) => ({ userId, name: c.name, phone: c.phone })),
      });
    }

    // Fetch all contact IDs (existing + newly created) in one query
    const allContacts = await tx.contact.findMany({
      where: { userId, phone: { in: validPhones } },
      select: { id: true },
    });

    // Bulk add all to group (createMany, not loop)
    if (allContacts.length > 0) {
      await tx.contactGroupMember.createMany({
        data: allContacts.map((c) => ({ groupId, contactId: c.id })),
        skipDuplicates: true,
      });
    }

    return {
      imported: toCreate.length,
      duplicates: duplicateCount,
      addedToGroup: allContacts.length,
    };
  });

  revalidatePath("/dashboard/groups");
  revalidatePath("/dashboard/contacts");

  return {
    imported: result.imported,
    duplicates: result.duplicates,
    invalid: invalid.length,
    addedToGroup: result.addedToGroup,
    total: csvData.length,
    invalidRows: invalid,
  };
}

export async function getContactsNotInGroup(userId: string, groupId: string, search?: string) {
  const group = await db.contactGroup.findFirst({ where: { id: groupId, userId } });
  if (!group) throw new Error("ไม่พบกลุ่ม");

  const membersInGroup = await db.contactGroupMember.findMany({
    where: { groupId },
    select: { contactId: true },
  });
  const excludeIds = membersInGroup.map((m) => m.contactId);

  return db.contact.findMany({
    where: {
      userId,
      id: { notIn: excludeIds },
      ...(search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
        ],
      } : {}),
    },
    select: { id: true, name: true, phone: true, email: true, tags: true },
    orderBy: { name: "asc" },
    take: 200,
  });
}
