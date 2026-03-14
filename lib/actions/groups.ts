"use server";

import { ApiError } from "../api-auth";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma as db } from "../db";
import { z } from "zod";
import { normalizePhone } from "../validations";
import { resolveActionUserId } from "../action-user";

const createGroupSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อกลุ่ม").max(100),
});

const importContactSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ").max(100).trim(),
  phone: z.string().regex(/^(0[0-9]{9}|\+66[0-9]{9})$/, "เบอร์โทรไม่ถูกต้อง"),
});

const MAX_IMPORT_BATCH = 200;
type GroupWithCount = Prisma.ContactGroupGetPayload<{
  include: { _count: { select: { members: true } } };
}>;

export async function getGroups(): Promise<GroupWithCount[]>;
export async function getGroups(userId: string): Promise<GroupWithCount[]>;
export async function getGroups(userId?: string) {
  userId = await resolveActionUserId(userId);
  return db.contactGroup.findMany({
    where: { userId },
    include: {
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createGroup(data: unknown): Promise<Awaited<ReturnType<typeof db.contactGroup.create>>>;
export async function createGroup(userId: string, data: unknown): Promise<Awaited<ReturnType<typeof db.contactGroup.create>>>;
export async function createGroup(userIdOrData: string | unknown, maybeData?: unknown) {
  const userId = await resolveActionUserId(
    maybeData === undefined ? undefined : userIdOrData as string,
  );
  const parsed = createGroupSchema.safeParse(maybeData === undefined ? userIdOrData : maybeData);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }
  const group = await db.contactGroup.create({
    data: { userId, name: parsed.data.name },
  });
  revalidatePath("/dashboard/groups");
  return group;
}

export async function updateGroup(groupId: string, data: unknown): Promise<Awaited<ReturnType<typeof db.contactGroup.update>>>;
export async function updateGroup(userId: string, groupId: string, data: unknown): Promise<Awaited<ReturnType<typeof db.contactGroup.update>>>;
export async function updateGroup(userIdOrGroupId: string, groupIdOrData: string | unknown, maybeData?: unknown) {
  const hasExplicitUserId = maybeData !== undefined;
  const userId = await resolveActionUserId(hasExplicitUserId ? userIdOrGroupId : undefined);
  const groupId = hasExplicitUserId ? groupIdOrData as string : userIdOrGroupId;
  const parsed = createGroupSchema.safeParse(hasExplicitUserId ? maybeData : groupIdOrData);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }
  const input = parsed.data;
  const existing = await db.contactGroup.findFirst({ where: { id: groupId, userId } });
  if (!existing) throw new ApiError(404, "ไม่พบกลุ่ม");
  const updated = await db.contactGroup.update({
    where: { id: groupId },
    data: { name: input.name },
  });
  revalidatePath("/dashboard/groups");
  return updated;
}

export async function deleteGroup(groupId: string): Promise<void>;
export async function deleteGroup(userId: string, groupId: string): Promise<void>;
export async function deleteGroup(userIdOrGroupId: string, maybeGroupId?: string) {
  const userId = await resolveActionUserId(
    maybeGroupId === undefined ? undefined : userIdOrGroupId,
  );
  const groupId = maybeGroupId ?? userIdOrGroupId;
  const existing = await db.contactGroup.findFirst({ where: { id: groupId, userId } });
  if (!existing) throw new ApiError(404, "ไม่พบกลุ่ม");
  await db.contactGroup.delete({ where: { id: groupId } });
  revalidatePath("/dashboard/groups");
}

export async function getGroupContacts(groupId: string): Promise<Awaited<ReturnType<typeof db.contactGroupMember.findMany>>>;
export async function getGroupContacts(userId: string, groupId: string): Promise<Awaited<ReturnType<typeof db.contactGroupMember.findMany>>>;
export async function getGroupContacts(userIdOrGroupId: string, maybeGroupId?: string) {
  const userId = await resolveActionUserId(
    maybeGroupId === undefined ? undefined : userIdOrGroupId,
  );
  const groupId = maybeGroupId ?? userIdOrGroupId;
  const group = await db.contactGroup.findFirst({ where: { id: groupId, userId } });
  if (!group) throw new ApiError(404, "ไม่พบกลุ่ม");
  return db.contactGroupMember.findMany({
    where: { groupId },
    include: { contact: { select: { id: true, name: true, phone: true, email: true } } },
    orderBy: { contact: { name: "asc" } },
  });
}

export async function addContactToGroup(groupId: string, contactId: string): Promise<Awaited<ReturnType<typeof db.contactGroupMember.create>>>;
export async function addContactToGroup(userId: string, groupId: string, contactId: string): Promise<Awaited<ReturnType<typeof db.contactGroupMember.create>>>;
export async function addContactToGroup(userIdOrGroupId: string, groupIdOrContactId: string, maybeContactId?: string) {
  const hasExplicitUserId = maybeContactId !== undefined;
  const userId = await resolveActionUserId(hasExplicitUserId ? userIdOrGroupId : undefined);
  const groupId = hasExplicitUserId ? groupIdOrContactId : userIdOrGroupId;
  const contactId = hasExplicitUserId ? maybeContactId as string : groupIdOrContactId;
  const [group, contact] = await Promise.all([
    db.contactGroup.findFirst({ where: { id: groupId, userId } }),
    db.contact.findFirst({ where: { id: contactId, userId } }),
  ]);
  if (!group) throw new ApiError(404, "ไม่พบกลุ่ม");
  if (!contact) throw new ApiError(404, "ไม่พบรายชื่อ");

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

export async function removeContactFromGroup(groupId: string, contactId: string): Promise<void>;
export async function removeContactFromGroup(userId: string, groupId: string, contactId: string): Promise<void>;
export async function removeContactFromGroup(userIdOrGroupId: string, groupIdOrContactId: string, maybeContactId?: string) {
  const hasExplicitUserId = maybeContactId !== undefined;
  const userId = await resolveActionUserId(hasExplicitUserId ? userIdOrGroupId : undefined);
  const groupId = hasExplicitUserId ? groupIdOrContactId : userIdOrGroupId;
  const contactId = hasExplicitUserId ? maybeContactId as string : groupIdOrContactId;
  const group = await db.contactGroup.findFirst({ where: { id: groupId, userId } });
  if (!group) throw new ApiError(404, "ไม่พบกลุ่ม");
  await db.contactGroupMember.delete({
    where: { groupId_contactId: { groupId, contactId } },
  });
  revalidatePath("/dashboard/groups");
}

export async function bulkRemoveFromGroup(groupId: string, contactIds: string[]): Promise<{ removed: number }>;
export async function bulkRemoveFromGroup(userId: string, groupId: string, contactIds: string[]): Promise<{ removed: number }>;
export async function bulkRemoveFromGroup(userIdOrGroupId: string, groupIdOrContactIds: string | string[], maybeContactIds?: string[]) {
  const hasExplicitUserId = Array.isArray(maybeContactIds);
  const userId = await resolveActionUserId(hasExplicitUserId ? userIdOrGroupId : undefined);
  const groupId = hasExplicitUserId ? groupIdOrContactIds as string : userIdOrGroupId;
  const contactIds = hasExplicitUserId ? maybeContactIds : groupIdOrContactIds as string[];
  const group = await db.contactGroup.findFirst({ where: { id: groupId, userId } });
  if (!group) throw new ApiError(404, "ไม่พบกลุ่ม");
  if (contactIds.length === 0) throw new ApiError(400, "กรุณาเลือกรายชื่อ");

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
  userId = await resolveActionUserId(userId);

  // Verify group ownership
  const group = await db.contactGroup.findFirst({ where: { id: groupId, userId } });
  if (!group) throw new ApiError(404, "ไม่พบกลุ่ม");

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

export async function getContactsNotInGroup(groupId: string, search?: string): Promise<Awaited<ReturnType<typeof db.contact.findMany>>>;
export async function getContactsNotInGroup(userId: string, groupId: string, search?: string): Promise<Awaited<ReturnType<typeof db.contact.findMany>>>;
export async function getContactsNotInGroup(userIdOrGroupId: string, groupIdOrSearch?: string, maybeSearch?: string) {
  const hasExplicitUserId = maybeSearch !== undefined;
  const userId = await resolveActionUserId(hasExplicitUserId ? userIdOrGroupId : undefined);
  const groupId = hasExplicitUserId ? groupIdOrSearch as string : userIdOrGroupId;
  const search = hasExplicitUserId ? maybeSearch : groupIdOrSearch;
  const group = await db.contactGroup.findFirst({ where: { id: groupId, userId } });
  if (!group) throw new ApiError(404, "ไม่พบกลุ่ม");

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
