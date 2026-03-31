"use server";

import { ApiError } from "../api-auth";

import { prisma as db } from "../db";
import { revalidatePath } from "next/cache";
import {
  contactFilterSchema,
  createContactSchema,
  updateContactSchema,
  addContactsToGroupSchema,
  idSchema,
  normalizePhone,
} from "../validations";
import { resolveActionUserId } from "../action-user";

const contactInclude = {
  groups: { include: { group: true } },
  contactTags: { include: { tag: true } },
} as const;

const contactDetailInclude = {
  ...contactInclude,
  customFieldValues: {
    include: { field: { select: { id: true, name: true, type: true, options: true } } },
  },
} as const;

type ContactListItem = NonNullable<Awaited<ReturnType<typeof db.contact.findFirst<{ include: typeof contactInclude }>>>>;
type ContactDetailItem = NonNullable<Awaited<ReturnType<typeof db.contact.findFirst<{ include: typeof contactDetailInclude }>>>>;
type ContactsResult = {
  contacts: ContactListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};
type ExportContactRow = {
  name: string;
  phone: string;
  email: string;
  tags: string;
  groups: string;
  createdAt: string;
};
type ContactGroupSummary = { id: string; name: string; memberCount: number };
type ContactMembershipSummary = { id: string; name: string };
type GroupsWithMembershipsResult = {
  groups: ContactGroupSummary[];
  contactGroups: Record<string, string[]>;
};
type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];
type ContactTagAssignment = { contactId: string; tagName: string };

function normalizeTagNames(tags: string | null | undefined) {
  return [...new Set(
    (tags ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  )];
}

async function ensureTagsByName(client: TxClient | typeof db, userId: string, tagNames: string[], color?: string) {
  if (tagNames.length === 0) return [];

  const uniqueTagNames = [...new Set(tagNames)];
  const existing = await client.tag.findMany({
    where: { userId, name: { in: uniqueTagNames } },
    select: { id: true, name: true },
  });
  const existingNames = new Set(existing.map((tag: (typeof existing)[number]) => tag.name));
  const missingNames = uniqueTagNames.filter((tagName) => !existingNames.has(tagName));

  if (missingNames.length > 0) {
    await client.tag.createMany({
      data: missingNames.map((name) => ({ userId, name, ...(color ? { color } : {}) })),
      skipDuplicates: true,
    });
  }

  return client.tag.findMany({
    where: { userId, name: { in: uniqueTagNames } },
    select: { id: true, name: true },
  });
}

async function createContactTagAssignments(
  client: TxClient | typeof db,
  userId: string,
  assignments: ContactTagAssignment[],
) {
  if (assignments.length === 0) return;

  const tags = await ensureTagsByName(
    client,
    userId,
    assignments.map((assignment) => assignment.tagName),
  );
  const tagIdByName = new Map<string, string>(tags.map((tag: { name: string; id: string }) => [tag.name, tag.id] as [string, string]));

  await client.contactTag.createMany({
    data: assignments.flatMap((assignment) => {
      const tagId = tagIdByName.get(assignment.tagName);
      return tagId ? [{ contactId: assignment.contactId, tagId }] : [];
    }),
    skipDuplicates: true,
  });
}

async function replaceContactTags(
  client: TxClient | typeof db,
  userId: string,
  contactId: string,
  tags: string | null | undefined,
) {
  const tagNames = normalizeTagNames(tags);

  if (tagNames.length === 0) {
    await client.contactTag.deleteMany({ where: { contactId } });
    return;
  }

  const tagRows = await ensureTagsByName(client, userId, tagNames);
  const tagIds = tagRows.map((tag: { name: string; id: string }) => tag.id);

  await client.contactTag.deleteMany({
    where: {
      contactId,
      tagId: { notIn: tagIds },
    },
  });

  await client.contactTag.createMany({
    data: tagIds.map((tagId: string) => ({ contactId, tagId })),
    skipDuplicates: true,
  });
}

async function migrateLegacyTagsForContacts(
  client: TxClient | typeof db,
  userId: string,
  contacts: { id: string; tags: string | null }[],
) {
  const assignments = contacts.flatMap((contact) =>
    normalizeTagNames(contact.tags).map((tagName) => ({
      contactId: contact.id,
      tagName,
    })),
  );

  if (assignments.length === 0) return;

  await createContactTagAssignments(client, userId, assignments);
  await client.contact.updateMany({
    where: { id: { in: contacts.map((contact) => contact.id) } },
    data: { tags: null },
  });
}

// ==========================================
// Get single contact by ID (for detail page)
// ==========================================

export async function getContactById(contactId: string): Promise<ContactDetailItem | null>;
export async function getContactById(userId: string, contactId: string): Promise<ContactDetailItem | null>;
export async function getContactById(userIdOrContactId: string, maybeContactId?: string) {
  const userId = await resolveActionUserId(maybeContactId === undefined ? undefined : userIdOrContactId);
  const contactId = maybeContactId ?? userIdOrContactId;
  idSchema.parse({ id: contactId });

  const contact = await db.contact.findFirst({
    where: { id: contactId, userId },
    include: contactDetailInclude,
  });

  if (!contact) return null;
  return contact;
}

// ==========================================
// Update contact consent (opt-in/opt-out)
// ==========================================

export async function updateContactConsent(
  contactId: string,
  data: { smsConsent: boolean; optOutReason?: string },
): Promise<Awaited<ReturnType<typeof db.contact.update>>>;
export async function updateContactConsent(
  userId: string,
  contactId: string,
  data: { smsConsent: boolean; optOutReason?: string },
): Promise<Awaited<ReturnType<typeof db.contact.update>>>;
export async function updateContactConsent(
  userIdOrContactId: string,
  contactIdOrData: string | { smsConsent: boolean; optOutReason?: string },
  maybeData?: { smsConsent: boolean; optOutReason?: string },
) {
  const hasExplicitUserId = maybeData !== undefined;
  const userId = await resolveActionUserId(hasExplicitUserId ? userIdOrContactId : undefined);
  const contactId = hasExplicitUserId ? contactIdOrData as string : userIdOrContactId;
  const data = hasExplicitUserId ? maybeData : contactIdOrData as { smsConsent: boolean; optOutReason?: string };
  idSchema.parse({ id: contactId });

  const contact = await db.contact.findFirst({
    where: { id: contactId, userId },
  });
  if (!contact) throw new ApiError(404, "ไม่พบรายชื่อ");

  const now = new Date();
  const updated = await db.contact.update({
    where: { id: contactId },
    data: {
      smsConsent: data.smsConsent,
      consentStatus: data.smsConsent ? "OPTED_IN" : "OPTED_OUT",
      ...(data.smsConsent
        ? { consentAt: now, optOutAt: null, optOutReason: null }
        : { optOutAt: now, optOutReason: data.optOutReason || null }),
    },
  });

  revalidatePath(`/dashboard/contacts/${contactId}`);
  revalidatePath("/dashboard/contacts");
  return updated;
}

// ==========================================
// Contact stats (for stat cards)
// ==========================================

export type ContactStats = {
  total: number;
  active: number;
  optedOut: number;
  groups: number;
};

export async function getContactStats(): Promise<ContactStats>;
export async function getContactStats(userId: string): Promise<ContactStats>;
export async function getContactStats(userId?: string) {
  userId = await resolveActionUserId(userId);
  const [total, optedOut, groups] = await db.$transaction([
    db.contact.count({ where: { userId } }),
    db.contact.count({ where: { userId, smsConsent: false } }),
    db.contactGroup.count({ where: { userId } }),
  ]);
  return { total, active: total - optedOut, optedOut, groups };
}

// ==========================================
// List contacts
// ==========================================

export async function getContacts(filters?: unknown): Promise<ContactsResult>;
export async function getContacts(userId: string, filters?: unknown): Promise<ContactsResult>;
export async function getContacts(userIdOrFilters?: string | unknown, maybeFilters?: unknown) {
  const hasExplicitUserId = typeof userIdOrFilters === "string" && maybeFilters !== undefined;
  const userId = await resolveActionUserId(hasExplicitUserId ? userIdOrFilters : undefined);
  const input = (hasExplicitUserId ? maybeFilters : userIdOrFilters)
    ? contactFilterSchema.parse(hasExplicitUserId ? maybeFilters : userIdOrFilters)
    : { page: 1, limit: 50, tagId: undefined };
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
// Search contacts (lightweight, for add-to-group dialogs)
// ==========================================

export async function searchContactsBasic(
  search: string,
  limit?: number,
): Promise<Awaited<ReturnType<typeof db.contact.findMany>>>;
export async function searchContactsBasic(
  userId: string,
  search: string,
  limit?: number,
): Promise<Awaited<ReturnType<typeof db.contact.findMany>>>;
export async function searchContactsBasic(
  userIdOrSearch: string,
  searchOrLimit?: string | number,
  maybeLimit = 50,
) {
  const hasExplicitUserId = typeof searchOrLimit === "string";
  const userId = await resolveActionUserId(hasExplicitUserId ? userIdOrSearch : undefined);
  const search = hasExplicitUserId ? searchOrLimit as string : userIdOrSearch;
  const limit = typeof searchOrLimit === "number" ? searchOrLimit : maybeLimit;
  return db.contact.findMany({
    where: {
      userId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    },
    select: { id: true, name: true, phone: true },
    orderBy: { name: "asc" },
    take: limit,
  });
}

// ==========================================
// Create contact
// ==========================================

export async function createContact(data: unknown): Promise<Awaited<ReturnType<typeof db.contact.create>>>;
export async function createContact(userId: string, data: unknown): Promise<Awaited<ReturnType<typeof db.contact.create>>>;
export async function createContact(userIdOrData: string | unknown, maybeData?: unknown) {
  const userId = await resolveActionUserId(
    maybeData === undefined ? undefined : userIdOrData as string,
  );
  const input = createContactSchema.parse(maybeData === undefined ? userIdOrData : maybeData);
  const normalizedPhone = normalizePhone(input.phone);

  const existing = await db.contact.findUnique({
    where: { userId_phone: { userId, phone: normalizedPhone } },
  });
  if (existing) throw new Error("เบอร์โทรนี้มีอยู่แล้ว");

  const consentData =
    input.smsConsent === undefined
      ? {}
      : input.smsConsent
        ? {
            smsConsent: true,
            consentStatus: "OPTED_IN" as const,
            consentAt: new Date(),
            optOutAt: null,
            optOutReason: null,
          }
        : {
            smsConsent: false,
            consentStatus: "OPTED_OUT" as const,
            consentAt: null,
            optOutAt: new Date(),
            optOutReason: null,
          };

  try {
    const contact = await db.$transaction(async (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => {
      const created = await tx.contact.create({
        data: {
          userId,
          name: input.name,
          phone: normalizedPhone,
          email: input.email || null,
          ...consentData,
        },
      });

      await replaceContactTags(tx, userId, created.id, input.tags);
      return created;
    });

    revalidatePath("/dashboard/contacts");
    return contact;
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code: string }).code === "P2002") {
      throw new Error("เบอร์โทรนี้มีอยู่แล้ว");
    }
    throw err;
  }
}

// ==========================================
// Update contact
// ==========================================

export async function updateContact(contactId: string, data: unknown): Promise<Awaited<ReturnType<typeof db.contact.update>>>;
export async function updateContact(userId: string, contactId: string, data: unknown): Promise<Awaited<ReturnType<typeof db.contact.update>>>;
export async function updateContact(userIdOrContactId: string, contactIdOrData: string | unknown, maybeData?: unknown) {
  const hasExplicitUserId = maybeData !== undefined;
  const userId = await resolveActionUserId(hasExplicitUserId ? userIdOrContactId : undefined);
  const contactId = hasExplicitUserId ? contactIdOrData as string : userIdOrContactId;
  idSchema.parse({ id: contactId });
  const input = updateContactSchema.parse(hasExplicitUserId ? maybeData : contactIdOrData);

  const contact = await db.contact.findFirst({
    where: { id: contactId, userId },
  });
  if (!contact) throw new ApiError(404, "ไม่พบรายชื่อ");

  const normalizedPhone = input.phone ? normalizePhone(input.phone) : undefined;

  if (normalizedPhone && normalizedPhone !== contact.phone) {
    const existing = await db.contact.findUnique({
      where: { userId_phone: { userId, phone: normalizedPhone } },
    });
    if (existing) throw new Error("เบอร์โทรนี้มีอยู่แล้ว");
  }

  const updated = await db.$transaction(async (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => {
    const nextContact = await tx.contact.update({
      where: { id: contactId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(normalizedPhone !== undefined && { phone: normalizedPhone }),
        ...(input.email !== undefined && { email: input.email || null }),
        ...(input.tags !== undefined && { tags: null }),
      },
    });

    if (input.tags !== undefined) {
      await replaceContactTags(tx, userId, contactId, input.tags);
    }

    return nextContact;
  });

  revalidatePath("/dashboard/contacts");
  return updated;
}

// ==========================================
// Delete contact
// ==========================================

export async function deleteContact(contactId: string): Promise<void>;
export async function deleteContact(userId: string, contactId: string): Promise<void>;
export async function deleteContact(userIdOrContactId: string, maybeContactId?: string) {
  const userId = await resolveActionUserId(
    maybeContactId === undefined ? undefined : userIdOrContactId,
  );
  const contactId = maybeContactId ?? userIdOrContactId;

  const contact = await db.contact.findFirst({
    where: { id: contactId, userId },
  });
  if (!contact) throw new ApiError(404, "ไม่พบผู้ติดต่อ");

  await db.contact.delete({ where: { id: contactId } });

  revalidatePath("/dashboard/contacts");
}

// ==========================================
// Import contacts from CSV data
// ==========================================

export async function importContacts(
  contacts: { name: string; phone: string; email?: string; tags?: string }[],
): Promise<{ imported: number; skipped: number; total: number; invalidRows: { row: number; error: string }[] }>;
export async function importContacts(
  userId: string,
  contacts: { name: string; phone: string; email?: string; tags?: string }[],
): Promise<{ imported: number; skipped: number; total: number; invalidRows: { row: number; error: string }[] }>;
export async function importContacts(
  userIdOrContacts: string | { name: string; phone: string; email?: string; tags?: string }[],
  maybeContacts?: { name: string; phone: string; email?: string; tags?: string }[],
) {
  const userId = await resolveActionUserId(
    maybeContacts === undefined ? undefined : userIdOrContacts as string,
  );
  const contacts = maybeContacts ?? userIdOrContacts as { name: string; phone: string; email?: string; tags?: string }[];
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
    const normalizedPhone = normalizePhone(result.data.phone);
    if (seenPhones.has(normalizedPhone)) {
      invalidRows.push({ row: i + 1, error: "เบอร์ซ้ำในไฟล์" });
      continue;
    }

    seenPhones.add(normalizedPhone);
    valid.push({
      ...result.data,
      phone: normalizedPhone,
    });
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
  const existingPhones = new Set(existing.map((c: (typeof existing)[number]) => c.phone));

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
      })),
    });

    const createdContacts = await db.contact.findMany({
      where: {
        userId,
        phone: { in: toCreate.map((contact) => contact.phone) },
      },
      select: { id: true, phone: true },
    });
    const contactIdByPhone = new Map<string, string>(createdContacts.map((contact: (typeof createdContacts)[number]) => [contact.phone, contact.id] as [string, string]));

    await createContactTagAssignments(
      db,
      userId,
      toCreate.flatMap((contact) =>
        normalizeTagNames(contact.tags).map((tagName) => ({
          contactId: contactIdByPhone.get(contact.phone) ?? "",
          tagName,
        })),
      ).filter((assignment) => assignment.contactId),
    );
  }

  revalidatePath("/dashboard/contacts");
  return { imported: toCreate.length, skipped, total: contacts.length, invalidRows };
}

// ==========================================
// Export contacts as JSON (for CSV conversion on client)
// ==========================================

export async function exportContacts(): Promise<ExportContactRow[]>;
export async function exportContacts(userId: string): Promise<ExportContactRow[]>;
export async function exportContacts(userId?: string) {
  userId = await resolveActionUserId(userId);
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
  groupId: string,
  contactIds: string[],
): Promise<void>;
export async function addContactsToGroup(
  userId: string,
  groupId: string,
  contactIds: string[],
): Promise<void>;
export async function addContactsToGroup(
  userIdOrGroupId: string,
  groupIdOrContactIds: string | string[],
  maybeContactIds?: string[],
) {
  const hasExplicitUserId = Array.isArray(maybeContactIds);
  const userId = await resolveActionUserId(hasExplicitUserId ? userIdOrGroupId : undefined);
  const groupId = hasExplicitUserId ? groupIdOrContactIds as string : userIdOrGroupId;
  const contactIds = hasExplicitUserId ? maybeContactIds : groupIdOrContactIds as string[];
  addContactsToGroupSchema.parse({ groupId, contactIds });

  // Verify group ownership
  const group = await db.contactGroup.findFirst({
    where: { id: groupId, userId },
  });
  if (!group) throw new ApiError(404, "ไม่พบกลุ่ม");

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

export async function bulkDeleteContacts(contactIds: string[]): Promise<{ deleted: number }>;
export async function bulkDeleteContacts(userId: string, contactIds: string[]): Promise<{ deleted: number }>;
export async function bulkDeleteContacts(userIdOrContactIds: string | string[], maybeContactIds?: string[]) {
  const userId = await resolveActionUserId(
    Array.isArray(maybeContactIds) ? userIdOrContactIds as string : undefined,
  );
  const contactIds = maybeContactIds ?? userIdOrContactIds as string[];
  if (contactIds.length === 0) throw new ApiError(400, "กรุณาเลือกรายชื่อ");

  const contacts = await db.contact.findMany({
    where: { id: { in: contactIds }, userId },
    select: { id: true },
  });

  if (contacts.length === 0) throw new ApiError(404, "ไม่พบรายชื่อ");

  await db.contact.deleteMany({
    where: { id: { in: contacts.map((c: { id: string }) => c.id) }, userId },
  });

  revalidatePath("/dashboard/contacts");
  return { deleted: contacts.length };
}

// ==========================================
// Bulk update tags (single DB transaction)
// ==========================================

export async function bulkUpdateTags(
  userIdOrContactIds: string | string[],
  contactIdsOrTag: string[] | string,
  tagOrAction: string,
  maybeAction?: "add" | "remove",
  color?: string,
) {
  const hasExplicitUserId = maybeAction !== undefined;
  const userId = await resolveActionUserId(hasExplicitUserId ? userIdOrContactIds as string : undefined);
  const contactIds = hasExplicitUserId ? contactIdsOrTag as string[] : userIdOrContactIds as string[];
  const tag = hasExplicitUserId ? tagOrAction as string : contactIdsOrTag as string;
  const action = hasExplicitUserId ? maybeAction as "add" | "remove" : tagOrAction as "add" | "remove";
  if (contactIds.length === 0) throw new ApiError(400, "กรุณาเลือกรายชื่อ");
  if (!tag.trim()) throw new Error("กรุณาระบุแท็ก");

  const contacts = await db.contact.findMany({
    where: { id: { in: contactIds }, userId },
    select: { id: true, tags: true },
  });

  if (contacts.length === 0) throw new ApiError(404, "ไม่พบรายชื่อ");

  const trimmedTag = tag.trim();

  await db.$transaction(async (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => {
    await migrateLegacyTagsForContacts(tx, userId, contacts);

    if (action === "add") {
      const [tagRecord] = await ensureTagsByName(tx, userId, [trimmedTag], color);
      if (!tagRecord) return;

      await tx.contactTag.createMany({
        data: contacts.map((contact: (typeof contacts)[number]) => ({
          contactId: contact.id,
          tagId: tagRecord.id,
        })),
        skipDuplicates: true,
      });
      return;
    }

    const existingTag = await tx.tag.findFirst({
      where: { userId, name: trimmedTag },
      select: { id: true },
    });
    if (!existingTag) return;

    await tx.contactTag.deleteMany({
      where: {
        contactId: { in: contacts.map((contact: (typeof contacts)[number]) => contact.id) },
        tagId: existingTag.id,
      },
    });
  });

  revalidatePath("/dashboard/contacts");
  return { updated: contacts.length };
}

// ==========================================
// Get contacts by group
// ==========================================

export async function getContactsByGroup(groupId: string): Promise<Awaited<ReturnType<typeof db.contact.findMany>>>;
export async function getContactsByGroup(userId: string, groupId: string): Promise<Awaited<ReturnType<typeof db.contact.findMany>>>;
export async function getContactsByGroup(userIdOrGroupId: string, maybeGroupId?: string) {
  const userId = await resolveActionUserId(maybeGroupId === undefined ? undefined : userIdOrGroupId);
  const groupId = maybeGroupId ?? userIdOrGroupId;
  idSchema.parse({ id: groupId });

  const group = await db.contactGroup.findFirst({
    where: { id: groupId, userId },
    include: {
      members: {
        include: { contact: true },
      },
    },
  });
  if (!group) throw new ApiError(404, "ไม่พบกลุ่ม");

  return group.members.map((m: typeof group.members[number]) => m.contact);
}

// ==========================================
// Get all contact groups (for user)
// ==========================================

export async function getContactGroups(): Promise<ContactGroupSummary[]>;
export async function getContactGroups(userId: string): Promise<ContactGroupSummary[]>;
export async function getContactGroups(userId?: string) {
  userId = await resolveActionUserId(userId);
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
// Get groups that a specific contact belongs to
// ==========================================

export async function getGroupsForContact(contactId: string): Promise<ContactMembershipSummary[]>;
export async function getGroupsForContact(userId: string, contactId: string): Promise<ContactMembershipSummary[]>;
export async function getGroupsForContact(userIdOrContactId: string, maybeContactId?: string) {
  const userId = await resolveActionUserId(maybeContactId === undefined ? undefined : userIdOrContactId);
  const contactId = maybeContactId ?? userIdOrContactId;
  idSchema.parse({ id: contactId });

  // Verify contact ownership
  const contact = await db.contact.findFirst({
    where: { id: contactId, userId },
    select: { id: true },
  });
  if (!contact) throw new ApiError(404, "ไม่พบรายชื่อ");

  const memberships = await db.contactGroupMember.findMany({
    where: { contactId },
    include: { group: true },
  });

  return memberships.map((m: typeof memberships[number]) => ({
    id: m.group.id,
    name: m.group.name,
  }));
}

// ==========================================
// Get groups + contact-group membership map (for Add to Group checkbox UI)
// ==========================================

export async function getGroupsWithMemberships(contactIds: string[]): Promise<GroupsWithMembershipsResult>;
export async function getGroupsWithMemberships(userId: string, contactIds: string[]): Promise<GroupsWithMembershipsResult>;
export async function getGroupsWithMemberships(userIdOrContactIds: string | string[], maybeContactIds?: string[]) {
  const hasExplicitUserId = Array.isArray(maybeContactIds);
  const userId = await resolveActionUserId(hasExplicitUserId ? userIdOrContactIds as string : undefined);
  const contactIds = hasExplicitUserId ? maybeContactIds : userIdOrContactIds as string[];
  if (contactIds.length > 100) {
    throw new Error("contactIds ต้องไม่เกิน 100 รายการ")
  }

  if (contactIds.length === 0) {
    const groups = await db.contactGroup.findMany({
      where: { userId },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: "desc" },
    });

    return {
      groups: groups.map((g: typeof groups[number]) => ({
        id: g.id,
        name: g.name,
        memberCount: g._count.members,
      })),
      contactGroups: {} as Record<string, string[]>,
    };
  }

  const [groups, memberships] = await Promise.all([
    db.contactGroup.findMany({
      where: { userId },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.contactGroupMember.findMany({
      where: {
        contactId: { in: contactIds },
        group: { userId }, // ensure ownership
      },
      select: { contactId: true, groupId: true },
    }),
  ]);

  // Build contactId → groupId[] map
  const contactGroups: Record<string, string[]> = {};
  for (const m of memberships) {
    if (!contactGroups[m.contactId]) {
      contactGroups[m.contactId] = [];
    }
    contactGroups[m.contactId].push(m.groupId);
  }

  return {
    groups: groups.map((g: typeof groups[number]) => ({
      id: g.id,
      name: g.name,
      memberCount: g._count.members,
    })),
    contactGroups,
  };
}

// ==========================================
// Create contact group
// ==========================================

export async function createContactGroup(name: string): Promise<Awaited<ReturnType<typeof db.contactGroup.create>>>;
export async function createContactGroup(userId: string, name: string): Promise<Awaited<ReturnType<typeof db.contactGroup.create>>>;
export async function createContactGroup(userIdOrName: string, maybeName?: string) {
  const userId = await resolveActionUserId(maybeName === undefined ? undefined : userIdOrName);
  const name = maybeName ?? userIdOrName;
  if (!name || name.trim().length === 0) throw new Error("กรุณากรอกชื่อกลุ่ม");

  return db.contactGroup.create({
    data: { userId, name: name.trim() },
  });
}
