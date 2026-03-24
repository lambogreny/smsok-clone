import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { createContactSchema, normalizePhone } from "@/lib/validations";
import { z } from "zod";
import { readJsonOr400 } from "@/lib/read-json-or-400";

const MAX_TEXT_IMPORT_BYTES = 1024 * 1024;
const MAX_IMPORT_ROWS = 5000;
const CSV_TEXT_MIME_TYPES = new Set([
  "text/csv",
  "application/csv",
  "text/plain",
  "application/vnd.ms-excel",
]);
const contactsArraySchema = z.array(
  z.object({
    name: z.string().optional(),
    phone: z.string(),
  }),
);

const importedContactNameSchema = createContactSchema.shape.name;

function isCsvTextFile(file: File) {
  return file.name.match(/\.(csv|txt)$/i) || CSV_TEXT_MIME_TYPES.has(file.type);
}

// POST /api/v1/groups/:id/import — Import CSV directly into a group
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "create", "group");
    if (denied) return denied;

    const { id: groupId } = await params;
    // Verify group ownership
    const group = await prisma.contactGroup.findFirst({
      where: { id: groupId, userId: user.id },
    });
    if (!group) throw new ApiError(404, "ไม่พบกลุ่ม");

    let rows: { name?: string; phone: string }[] = [];
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) throw new ApiError(400, "กรุณาอัพโหลดไฟล์");
      if (!isCsvTextFile(file)) {
        throw new ApiError(400, "รองรับเฉพาะไฟล์ CSV หรือ TXT");
      }
      if (file.size > MAX_TEXT_IMPORT_BYTES) {
        throw new ApiError(400, "ไฟล์ CSV/TXT ต้องไม่เกิน 1MB");
      }
      rows = parseCsv(await file.text());
    } else {
      const body = await readJsonOr400<{
        data?: string;
        contacts?: { name?: string; phone: string }[];
      }>(req);
      if (typeof body.data === "string") {
        if (Buffer.byteLength(body.data, "utf8") > MAX_TEXT_IMPORT_BYTES) {
          throw new ApiError(400, "ข้อมูล CSV/TXT ต้องไม่เกิน 1MB");
        }
        rows = parseCsv(body.data);
      } else if (Array.isArray(body.contacts)) {
        if (body.contacts.length > MAX_IMPORT_ROWS) {
          throw new ApiError(400, "นำเข้าได้สูงสุด 5,000 รายชื่อต่อครั้ง");
        }
        rows = contactsArraySchema.parse(body.contacts);
      } else {
        throw new ApiError(400, "กรุณาส่ง contacts array หรือ data string");
      }
    }

    if (rows.length === 0) throw new ApiError(400, "ไม่มีรายชื่อที่จะนำเข้า");
    if (rows.length > MAX_IMPORT_ROWS) throw new ApiError(400, "นำเข้าได้สูงสุด 5,000 รายชื่อต่อครั้ง");

    const validRows: { name: string; phone: string }[] = [];
    const seenPhones = new Set<string>();
    let duplicates = 0;
    let invalid = 0;

    for (const row of rows) {
      const phone = normalizePhone(row.phone || "");
      if (!/^0[0-9]{9}$/.test(phone) && !/^\+66[0-9]{9}$/.test(phone)) {
        invalid++;
        continue;
      }

      if (seenPhones.has(phone)) {
        duplicates++;
        continue;
      }

      seenPhones.add(phone);

      let name = phone;
      if (typeof row.name === "string" && row.name.trim() !== "") {
        const parsedName = importedContactNameSchema.safeParse(row.name);
        if (!parsedName.success) {
          invalid++;
          continue;
        }
        name = parsedName.data;
      }

      validRows.push({
        name,
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

    const allContacts = validRows.length === 0
      ? []
      : await prisma.contact.findMany({
        where: {
          userId: user.id,
          phone: { in: validRows.map((contact) => contact.phone) },
        },
        select: { id: true },
      });

    if (allContacts.length > 0) {
      await prisma.contactGroupMember.createMany({
        data: allContacts.map((contact: (typeof allContacts)[number]) => ({ groupId, contactId: contact.id })),
        skipDuplicates: true,
      });
    }

    return apiResponse({
      total: rows.length,
      imported: toCreate.length,
      updated: 0,
      skipped: duplicates + invalid,
      errors: [],
    }, 201);
  } catch (error) {
    return apiError(error);
  }
}

function parseCsv(text: string): { name?: string; phone: string }[] {
  const lines = text.split(/[\n\r]+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes("name") || firstLine.includes("phone") || firstLine.includes("เบอร์");
  const dataLines = hasHeader ? lines.slice(1) : lines;
  if (dataLines.length > MAX_IMPORT_ROWS) {
    throw new ApiError(400, "นำเข้าได้สูงสุด 5,000 รายชื่อต่อครั้ง");
  }

  return dataLines.map((line) => {
    const parts = line.split(/[,\t]/).map((p) => p.trim().replace(/^["']|["']$/g, ""));
    if (parts.length >= 2) {
      return { name: parts[0], phone: parts[1] };
    }
    return { phone: parts[0] };
  });
}
