"use server";

import { prisma as db } from "../db";
import { revalidatePath } from "next/cache";
import {
  createContactSchema,
  updateContactSchema,
  idSchema,
  paginationSchema,
} from "../validations";

// ==========================================
// List contacts
// ==========================================

export async function getContacts(userId: string, filters?: unknown) {
  const pagination = filters ? paginationSchema.parse(filters) : { page: 1, limit: 50 };
  const skip = (pagination.page - 1) * pagination.limit;

  const [contacts, total] = await db.$transaction([
    db.contact.findMany({
      where: { userId },
      include: { groups: { include: { group: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: pagination.limit,
    }),
    db.contact.count({ where: { userId } }),
  ]);

  return {
    contacts,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
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
  contacts: { name: string; phone: string }[]
) {
  if (contacts.length === 0) throw new Error("ไม่มีรายชื่อที่จะนำเข้า");
  if (contacts.length > 10000) throw new Error("นำเข้าได้สูงสุด 10,000 รายชื่อต่อครั้ง");

  const validated = contacts.map((c, i) => {
    try {
      return createContactSchema.parse(c);
    } catch {
      throw new Error(`แถวที่ ${i + 1}: ข้อมูลไม่ถูกต้อง`);
    }
  });

  let imported = 0;
  let skipped = 0;

  for (const contact of validated) {
    try {
      await db.contact.create({
        data: {
          userId,
          name: contact.name,
          phone: contact.phone,
          email: contact.email || null,
          tags: contact.tags || null,
        },
      });
      imported++;
    } catch {
      skipped++;
    }
  }

  revalidatePath("/dashboard/contacts");
  return { imported, skipped, total: contacts.length };
}

// ==========================================
// Export contacts as JSON (for CSV conversion on client)
// ==========================================

export async function exportContacts(userId: string) {
  const contacts = await db.contact.findMany({
    where: { userId },
    include: { groups: { include: { group: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return contacts.map((c: typeof contacts[number]) => ({
    name: c.name,
    phone: c.phone,
    email: c.email || "",
    tags: c.tags || "",
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

  // Verify contacts ownership
  const contacts = await db.contact.findMany({
    where: { id: { in: contactIds }, userId },
    select: { id: true },
  });

  await db.contactGroupMember.createMany({
    data: contacts.map((c: { id: string }) => ({ groupId, contactId: c.id })),
    skipDuplicates: true,
  });

  revalidatePath("/dashboard/contacts");
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
