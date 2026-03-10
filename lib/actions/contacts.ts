"use server";

import { prisma as db } from "../db";
import { revalidatePath } from "next/cache";
import {
  contactFilterSchema,
  createContactSchema,
  updateContactSchema,
  idSchema,
} from "../validations";

const contactInclude = {
  groups: { include: { group: true } },
  contactTags: { include: { tag: true } },
} as const;

// ==========================================
// List contacts
// ==========================================

export async function getContacts(userId: string, filters?: unknown) {
  const input = filters ? contactFilterSchema.parse(filters) : { page: 1, limit: 50, tagId: undefined };
  const skip = (input.page - 1) * input.limit;
  const where = {
    userId,
    ...(input.tagId && {
      contactTags: {
        some: { tagId: input.tagId },
      },
    }),
  };

  const [contacts, total] = await db.$transaction([
    db.contact.findMany({
      where,
      include: contactInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: input.limit,
    }),
    db.contact.count({ where }),
  ]);

  return {
    contacts,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
    },
  };
}

// ==========================================
// Create contact
// ==========================================

export async function createContact(userId: string, data: unknown) {
  const input = createContactSchema.parse(data);

  const existing = await db.contact.findUnique({
    where: { userId_phone: { userId, phone: input.phone } },
  });
  if (existing) throw new Error("เบอร์โทรนี้มีอยู่แล้ว");

  const contact = await db.contact.create({
    data: {
      userId,
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      tags: input.tags || null,
    },
  });

  revalidatePath("/dashboard/contacts");
  return contact;
}

// ==========================================
// Update contact
// ==========================================

export async function updateContact(userId: string, contactId: string, data: unknown) {
  idSchema.parse({ id: contactId });
  const input = updateContactSchema.parse(data);

  const contact = await db.contact.findFirst({
    where: { id: contactId, userId },
  });
  if (!contact) throw new Error("ไม่พบรายชื่อ");

  if (input.phone && input.phone !== contact.phone) {
    const existing = await db.contact.findUnique({
      where: { userId_phone: { userId, phone: input.phone } },
    });
    if (existing) throw new Error("เบอร์โทรนี้มีอยู่แล้ว");
  }

  const updated = await db.contact.update({
    where: { id: contactId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.email !== undefined && { email: input.email || null }),
      ...(input.tags !== undefined && { tags: input.tags || null }),
    },
  });

  revalidatePath("/dashboard/contacts");
  return updated;
}

// ==========================================
// Delete contact
// ==========================================

export async function deleteContact(userId: string, contactId: string) {
  idSchema.parse({ id: contactId });

  const contact = await db.contact.findFirst({
    where: { id: contactId, userId },
  });
  if (!contact) throw new Error("ไม่พบรายชื่อ");

  await db.contact.delete({ where: { id: contactId } });

  revalidatePath("/dashboard/contacts");
}

// ==========================================
// Import contacts from CSV data
// ==========================================

export async function importContacts(
  userId: string,
  contacts: { name: string; phone: string; email?: string; tags?: string }[]
) {
  if (!Array.isArray(contacts) || contacts.length === 0) throw new Error("ไม่มีรายชื่อที่จะนำเข้า");
  if (contacts.length > 200) throw new Error("นำเข้าได้สูงสุด 200 รายชื่อต่อครั้ง");

  // Validate all rows with Zod + deduplicate
  const valid: { name: string; phone: string; email?: string; tags?: string }[] = [];
  const invalidRows: { row: number; error: string }[] = [];
  const seenPhones = new Set<string>();

  for (let i = 0; i < contacts.length; i++) {
    const result = createContactSchema.safeParse(contacts[i]);
    if (!result.success) {
      invalidRows.push({
        row: i + 1,
        error: result.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง",
      });
      continue;
    }
    if (seenPhones.has(result.data.phone)) {
      invalidRows.push({ row: i + 1, error: "เบอร์ซ้ำในไฟล์" });
      continue;
    }
    seenPhones.add(result.data.phone);
    valid.push(result.data);
  }

  if (valid.length === 0) {
    return { imported: 0, skipped: invalidRows.length, total: contacts.length, invalidRows };
  }

  // Find existing phones to determine duplicates (batch query)
  const phones = valid.map((c) => c.phone);
  const existing = await db.contact.findMany({
    where: { userId, phone: { in: phones } },
    select: { phone: true },
  });
  const existingPhones = new Set(existing.map((c) => c.phone));

  const toCreate = valid.filter((c) => !existingPhones.has(c.phone));
  const skipped = valid.length - toCreate.length + invalidRows.length;

  // Bulk create (createMany, not loop)
  if (toCreate.length > 0) {
    await db.contact.createMany({
      data: toCreate.map((c) => ({
        userId,
        name: c.name,
        phone: c.phone,
        email: c.email || null,
        tags: c.tags || null,
      })),
    });
  }

  revalidatePath("/dashboard/contacts");
  return { imported: toCreate.length, skipped, total: contacts.length, invalidRows };
}

// ==========================================
// Export contacts as JSON (for CSV conversion on client)
// ==========================================

export async function exportContacts(userId: string) {
  const contacts = await db.contact.findMany({
    where: { userId },
    include: {
      groups: { include: { group: { select: { name: true } } } },
      contactTags: { include: { tag: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return contacts.map((c: typeof contacts[number]) => ({
    name: c.name,
    phone: c.phone,
    email: c.email || "",
    tags: c.contactTags.length > 0
      ? c.contactTags.map((item: typeof c.contactTags[number]) => item.tag.name).join(", ")
      : c.tags || "",
    groups: c.groups.map((g: typeof c.groups[number]) => g.group.name).join(", "),
    createdAt: c.createdAt.toISOString(),
  }));
}

// ==========================================
// Add contacts to a group
// ==========================================

export async function addContactsToGroup(
  userId: string,
  groupId: string,
  contactIds: string[]
) {
  idSchema.parse({ id: groupId });
  if (contactIds.length === 0) throw new Error("กรุณาเลือกรายชื่อ");

  // Verify group ownership
  const group = await db.contactGroup.findFirst({
    where: { id: groupId, userId },
  });
  if (!group) throw new Error("ไม่พบกลุ่ม");

  // Verify contacts ownership — reject if any contact doesn't belong to user
  const contacts = await db.contact.findMany({
    where: { id: { in: contactIds }, userId },
    select: { id: true },
  });

  if (contacts.length !== contactIds.length) {
    throw new Error("ไม่พบรายชื่อบางรายการ");
  }

  await db.contactGroupMember.createMany({
    data: contacts.map((c: { id: string }) => ({ groupId, contactId: c.id })),
    skipDuplicates: true,
  });

  revalidatePath("/dashboard/contacts");
}

// ==========================================
// Bulk delete contacts
// ==========================================

export async function bulkDeleteContacts(userId: string, contactIds: string[]) {
  if (contactIds.length === 0) throw new Error("กรุณาเลือกรายชื่อ");

  const contacts = await db.contact.findMany({
    where: { id: { in: contactIds }, userId },
    select: { id: true },
  });

  if (contacts.length === 0) throw new Error("ไม่พบรายชื่อ");

  await db.contact.deleteMany({
    where: { id: { in: contacts.map((c: { id: string }) => c.id) }, userId },
  });

  revalidatePath("/dashboard/contacts");
  return { deleted: contacts.length };
}

// ==========================================
// Get contacts by group
// ==========================================

export async function getContactsByGroup(userId: string, groupId: string) {
  idSchema.parse({ id: groupId });

  const group = await db.contactGroup.findFirst({
    where: { id: groupId, userId },
    include: {
      members: {
        include: { contact: true },
      },
    },
  });
  if (!group) throw new Error("ไม่พบกลุ่ม");

  return group.members.map((m: typeof group.members[number]) => m.contact);
}

// ==========================================
// Get contact groups
// ==========================================

export async function getContactGroups(userId: string) {
  const groups = await db.contactGroup.findMany({
    where: { userId },
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "desc" },
  });

  return groups.map((g: typeof groups[number]) => ({
    id: g.id,
    name: g.name,
    memberCount: g._count.members,
  }));
}

// ==========================================
// Create contact group
// ==========================================

export async function createContactGroup(userId: string, name: string) {
  if (!name || name.trim().length === 0) throw new Error("กรุณากรอกชื่อกลุ่ม");

  return db.contactGroup.create({
    data: { userId, name: name.trim() },
  });
}
