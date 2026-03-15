"use server";

import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/validations";
import { resolveActionUserId } from "@/lib/action-user";

export type ColumnMapping = {
  name: string;      // column header → name
  phone: string;     // column header → phone
  email?: string;    // column header → email (optional)
  tags?: string;     // column header → tags (optional)
};

export type ImportResult = {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; phone: string; error: string }>;
};

/**
 * Parse Excel/CSV file and return headers + preview rows
 */
export async function parseExcelFile(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("ไม่พบ sheet ในไฟล์");

  const sheet = workbook.Sheets[sheetName]!;
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  if (data.length === 0) throw new Error("ไฟล์ไม่มีข้อมูล");

  const headers = Object.keys(data[0]!);
  const preview = data.slice(0, 5).map((row) => {
    const mapped: Record<string, string> = {};
    for (const h of headers) {
      mapped[h] = String(row[h] ?? "");
    }
    return mapped;
  });

  const allRows = data.map((row) => {
    const mapped: Record<string, string> = {};
    for (const h of headers) {
      mapped[h] = String(row[h] ?? "");
    }
    return mapped;
  });

  return { headers, preview, allRows, totalRows: data.length };
}

/**
 * Import contacts from Excel/CSV with column mapping + batch upsert
 */
export async function importContactsFromExcel(
  buffer: ArrayBuffer,
  mapping: ColumnMapping,
  options?: { updateExisting?: boolean },
): Promise<ImportResult>;
export async function importContactsFromExcel(
  userId: string,
  buffer: ArrayBuffer,
  mapping: ColumnMapping,
  options?: { updateExisting?: boolean },
): Promise<ImportResult>;
export async function importContactsFromExcel(
  userIdOrBuffer: string | ArrayBuffer,
  bufferOrMapping: ArrayBuffer | ColumnMapping,
  mappingOrOptions?: ColumnMapping | { updateExisting?: boolean },
  maybeOptions: { updateExisting?: boolean } = {},
): Promise<ImportResult> {
  const hasExplicitUserId = typeof userIdOrBuffer === "string";
  const userId = await resolveActionUserId(hasExplicitUserId ? userIdOrBuffer : undefined);
  const buffer = hasExplicitUserId ? bufferOrMapping as ArrayBuffer : userIdOrBuffer;
  const mapping = hasExplicitUserId ? mappingOrOptions as ColumnMapping : bufferOrMapping as ColumnMapping;
  const options = hasExplicitUserId
    ? maybeOptions
    : ((mappingOrOptions as { updateExisting?: boolean } | undefined) ?? {});

  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("ไม่พบ sheet ในไฟล์");

  const sheet = workbook.Sheets[sheetName]!;
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  if (rows.length === 0) throw new Error("ไฟล์ไม่มีข้อมูล");
  if (rows.length > 5000) throw new Error("สูงสุด 5,000 รายการต่อครั้ง");

  const result: ImportResult = { total: rows.length, imported: 0, updated: 0, skipped: 0, errors: [] };

  // Process in batches of 100
  const BATCH_SIZE = 100;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    await prisma.$transaction(async (tx) => {
      for (let j = 0; j < batch.length; j++) {
        const row = batch[j]!;
        const rowNum = i + j + 2; // +2 for 1-indexed + header row
        const rawPhone = String(row[mapping.phone] ?? "").trim();
        const name = String(row[mapping.name] ?? "").trim();

        if (!rawPhone || !name) {
          result.skipped++;
          continue;
        }

        let phone: string;
        try {
          phone = normalizePhone(rawPhone);
        } catch {
          result.errors.push({ row: rowNum, phone: rawPhone, error: "เบอร์โทรไม่ถูกต้อง" });
          result.skipped++;
          continue;
        }

        const email = mapping.email ? String(row[mapping.email] ?? "").trim() || null : null;
        const tags = mapping.tags ? String(row[mapping.tags] ?? "").trim() || null : null;

        try {
          const existing = await tx.contact.findUnique({
            where: { userId_phone: { userId, phone } },
          });

          if (existing) {
            if (options.updateExisting) {
              await tx.contact.update({
                where: { id: existing.id },
                data: {
                  name,
                  ...(email !== null && { email }),
                  ...(tags !== null && { tags }),
                },
              });
              result.updated++;
            } else {
              result.skipped++;
            }
          } else {
            await tx.contact.create({
              data: { userId, name, phone, email, tags },
            });
            result.imported++;
          }
        } catch (err) {
          result.errors.push({
            row: rowNum,
            phone,
            error: err instanceof Error ? err.message : "Unknown error",
          });
          result.skipped++;
        }
      }
    });
  }

  return result;
}
