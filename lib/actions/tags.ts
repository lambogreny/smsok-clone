"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma as db } from "../db";
import { assignContactTagSchema, createTagSchema, idSchema, updateTagSchema } from "../validations";

export async function getTags(userId: string) {
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

export async function createTag(userId: string, data: unknown) {
  const input = createTagSchema.parse(data);

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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("ชื่อแท็กนี้มีอยู่แล้ว");
    }
    throw error;
  }
}

export async function updateTag(userId: string, tagId: string, data: unknown) {
  idSchema.parse({ id: tagId });
  const input = updateTagSchema.parse(data);

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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("ชื่อแท็กนี้มีอยู่แล้ว");
    }
    throw error;
  }
}

export async function deleteTag(userId: string, tagId: string) {
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

export async function assignTagToContact(userId: string, contactId: string, data: unknown) {
  idSchema.parse({ id: contactId });
  const input = assignContactTagSchema.parse(data);

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

export async function unassignTagFromContact(userId: string, contactId: string, data: unknown) {
  idSchema.parse({ id: contactId });
  const input = assignContactTagSchema.parse(data);

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
