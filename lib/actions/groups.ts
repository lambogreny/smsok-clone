"use server";

import { revalidatePath } from "next/cache";
import { prisma as db } from "../db";
import { z } from "zod";

const createGroupSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อกลุ่ม").max(100),
});

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
  const input = createGroupSchema.parse(data);
  const group = await db.contactGroup.create({
    data: { userId, name: input.name },
  });
  revalidatePath("/dashboard/groups");
  return group;
}

export async function updateGroup(userId: string, groupId: string, data: unknown) {
  const input = createGroupSchema.parse(data);
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
    select: { id: true, name: true, phone: true, email: true },
    orderBy: { name: "asc" },
    take: 50,
  });
}
