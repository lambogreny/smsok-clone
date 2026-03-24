"use server";


import { revalidatePath } from "next/cache";
import { prisma as db } from "../db";
import { assignContactTagSchema, createTagSchema, idSchema, updateTagSchema } from "../validations";
import { resolveActionUserId, type InternalActionUserToken } from "../action-user";

type TagWithCount = NonNullable<Awaited<ReturnType<typeof db.tag.findFirst<{ include: { _count: { select: { contactTags: true } } } }>>>>;

export async function getTags(): Promise<TagWithCount[]>;
export async function getTags(userId: string): Promise<TagWithCount[]>;
export async function getTags(userId: string, token: InternalActionUserToken): Promise<Awaited<ReturnType<typeof db.tag.findMany>>>;
export async function getTags(userId?: string, token?: InternalActionUserToken) {
  userId = await resolveActionUserId(userId, token);
  return db.tag.findMany({
    where: { userId },
    include: {
      _count: {
        select: { contactTags: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function createTag(data: unknown): Promise<Awaited<ReturnType<typeof db.tag.create>>>;
export async function createTag(userId: string, data: unknown): Promise<Awaited<ReturnType<typeof db.tag.create>>>;
export async function createTag(userId: string, data: unknown, token: InternalActionUserToken): Promise<Awaited<ReturnType<typeof db.tag.create>>>;
export async function createTag(userIdOrData: string | unknown, maybeData?: unknown, token?: InternalActionUserToken) {
  const userId = await resolveActionUserId(
    maybeData === undefined ? undefined : userIdOrData as string,
    token,
  );
  const input = createTagSchema.parse(maybeData === undefined ? userIdOrData : maybeData);

  try {
    const tag = await db.tag.create({
      data: {
        userId,
        name: input.name,
        color: input.color,
      },
    });
    revalidatePath("/dashboard/tags");
    revalidatePath("/dashboard/contacts");
    return tag;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
      throw new Error("ชื่อแท็กนี้มีอยู่แล้ว");
    }
    throw error;
  }
}

export async function updateTag(tagId: string, data: unknown): Promise<Awaited<ReturnType<typeof db.tag.update>>>;
export async function updateTag(userId: string, tagId: string, data: unknown): Promise<Awaited<ReturnType<typeof db.tag.update>>>;
export async function updateTag(userId: string, tagId: string, data: unknown, token: InternalActionUserToken): Promise<Awaited<ReturnType<typeof db.tag.update>>>;
export async function updateTag(userIdOrTagId: string, tagIdOrData: string | unknown, maybeData?: unknown, token?: InternalActionUserToken) {
  const hasExplicitUserId = maybeData !== undefined;
  const userId = await resolveActionUserId(hasExplicitUserId ? userIdOrTagId : undefined, token);
  const tagId = hasExplicitUserId ? tagIdOrData as string : userIdOrTagId;
  idSchema.parse({ id: tagId });
  const input = updateTagSchema.parse(hasExplicitUserId ? maybeData : tagIdOrData);

  const tag = await db.tag.findFirst({
    where: { id: tagId, userId },
  });
  if (!tag) throw new Error("ไม่พบแท็ก");

  try {
    const updated = await db.tag.update({
      where: { id: tagId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.color !== undefined && { color: input.color }),
      },
    });
    revalidatePath("/dashboard/tags");
    revalidatePath("/dashboard/contacts");
    return updated;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
      throw new Error("ชื่อแท็กนี้มีอยู่แล้ว");
    }
    throw error;
  }
}

export async function deleteTag(tagId: string): Promise<void>;
export async function deleteTag(userId: string, tagId: string): Promise<void>;
export async function deleteTag(userId: string, tagId: string, token: InternalActionUserToken): Promise<void>;
export async function deleteTag(userIdOrTagId: string, maybeTagId?: string, token?: InternalActionUserToken) {
  const userId = await resolveActionUserId(maybeTagId === undefined ? undefined : userIdOrTagId, token);
  const tagId = maybeTagId ?? userIdOrTagId;
  idSchema.parse({ id: tagId });

  const tag = await db.tag.findFirst({
    where: { id: tagId, userId },
  });
  if (!tag) throw new Error("ไม่พบแท็ก");

  await db.tag.delete({ where: { id: tagId } });
  revalidatePath("/dashboard/tags");
    revalidatePath("/dashboard/contacts");
}

async function ensureOwnedTagAndContact(userId: string, contactId: string, tagId: string) {
  const [contact, tag] = await Promise.all([
    db.contact.findFirst({
      where: { id: contactId, userId },
      select: { id: true },
    }),
    db.tag.findFirst({
      where: { id: tagId, userId },
      select: { id: true },
    }),
  ]);

  if (!contact) throw new Error("ไม่พบรายชื่อ");
  if (!tag) throw new Error("ไม่พบแท็ก");
}

export async function assignTagToContact(contactId: string, data: unknown): Promise<{ success: true }>;
export async function assignTagToContact(userId: string, contactId: string, data: unknown): Promise<{ success: true }>;
export async function assignTagToContact(userId: string, contactId: string, data: unknown, token: InternalActionUserToken): Promise<{ success: true }>;
export async function assignTagToContact(userIdOrContactId: string, contactIdOrData: string | unknown, maybeData?: unknown, token?: InternalActionUserToken) {
  const hasExplicitUserId = maybeData !== undefined;
  const userId = await resolveActionUserId(hasExplicitUserId ? userIdOrContactId : undefined, token);
  const contactId = hasExplicitUserId ? contactIdOrData as string : userIdOrContactId;
  idSchema.parse({ id: contactId });
  const input = assignContactTagSchema.parse(hasExplicitUserId ? maybeData : contactIdOrData);

  await ensureOwnedTagAndContact(userId, contactId, input.tagId);

  await db.contactTag.upsert({
    where: {
      contactId_tagId: {
        contactId,
        tagId: input.tagId,
      },
    },
    update: {},
    create: {
      contactId,
      tagId: input.tagId,
    },
  });

  revalidatePath("/dashboard/tags");
    revalidatePath("/dashboard/contacts");
  return { success: true };
}

export async function unassignTagFromContact(contactId: string, data: unknown): Promise<{ success: true }>;
export async function unassignTagFromContact(userId: string, contactId: string, data: unknown): Promise<{ success: true }>;
export async function unassignTagFromContact(userId: string, contactId: string, data: unknown, token: InternalActionUserToken): Promise<{ success: true }>;
export async function unassignTagFromContact(userIdOrContactId: string, contactIdOrData: string | unknown, maybeData?: unknown, token?: InternalActionUserToken) {
  const hasExplicitUserId = maybeData !== undefined;
  const userId = await resolveActionUserId(hasExplicitUserId ? userIdOrContactId : undefined, token);
  const contactId = hasExplicitUserId ? contactIdOrData as string : userIdOrContactId;
  idSchema.parse({ id: contactId });
  const input = assignContactTagSchema.parse(hasExplicitUserId ? maybeData : contactIdOrData);

  await ensureOwnedTagAndContact(userId, contactId, input.tagId);

  await db.contactTag.deleteMany({
    where: {
      contactId,
      tagId: input.tagId,
    },
  });

  revalidatePath("/dashboard/tags");
    revalidatePath("/dashboard/contacts");
  return { success: true };
}
