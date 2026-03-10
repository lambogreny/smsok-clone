"use server"

import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { encryptSecret, decryptSecret } from "@/lib/two-factor"
import { z } from "zod"
import { randomUUID } from "crypto"
import type { DocumentType } from "@prisma/client"

// ── Thai Citizen ID Checksum ────────────────────────────

function validateCitizenId(id: string): boolean {
  if (!/^\d{13}$/.test(id)) return false
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(id[i]!) * (13 - i)
  }
  const checkDigit = (11 - (sum % 11)) % 10
  return checkDigit === parseInt(id[12]!)
}

// ── Validation Schemas ──────────────────────────────────

const billingInfoBaseSchema = z.object({
  address: z.string().min(10, "ที่อยู่ต้องมีอย่างน้อย 10 ตัวอักษร").max(500),
  phone: z.string().regex(/^(0[0-9]{9}|\+66[0-9]{9})$/, "เบอร์โทรไม่ถูกต้อง"),
  email: z.string().email("อีเมลไม่ถูกต้อง"),
})

const individualSchema = billingInfoBaseSchema.extend({
  accountType: z.literal("INDIVIDUAL"),
  fullName: z.string().min(2, "กรุณากรอกชื่อ-นามสกุล").max(200),
  citizenId: z.string()
    .length(13, "เลขบัตรประชาชนต้องมี 13 หลัก")
    .regex(/^\d{13}$/, "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก")
    .refine(validateCitizenId, "เลขบัตรประชาชนไม่ถูกต้อง (checksum ไม่ผ่าน)"),
})

const corporationSchema = billingInfoBaseSchema.extend({
  accountType: z.literal("CORPORATION"),
  companyName: z.string().min(2, "กรุณากรอกชื่อบริษัท").max(200),
  taxId: z.string()
    .length(13, "เลขทะเบียนนิติบุคคลต้องมี 13 หลัก")
    .regex(/^\d{13}$/, "เลขทะเบียนนิติบุคคลต้องเป็นตัวเลข 13 หลัก"),
  branchCode: z.string()
    .regex(/^\d{5}$/, "รหัสสาขาต้องเป็นตัวเลข 5 หลัก")
    .default("00000"),
  branchName: z.string().max(100).optional(),
  contactPerson: z.string().min(2, "กรุณากรอกชื่อผู้ติดต่อ").max(200),
})

const billingInfoSchema = z.discriminatedUnion("accountType", [
  individualSchema,
  corporationSchema,
])

// ── Create / Update BillingInfo ─────────────────────────

export async function saveBillingInfo(input: z.input<typeof billingInfoSchema>) {
  const user = await getSession()
  if (!user) throw new Error("กรุณาเข้าสู่ระบบ")

  const parsed = billingInfoSchema.parse(input)

  // Encrypt PII (PDPA compliance) — citizenId/taxId stored as AES-256-GCM ciphertext
  const data =
    parsed.accountType === "INDIVIDUAL"
      ? {
          accountType: "INDIVIDUAL" as const,
          fullName: parsed.fullName,
          citizenId: encryptSecret(parsed.citizenId),
          companyName: null,
          taxId: null,
          branchCode: null,
          branchName: null,
          contactPerson: null,
          address: parsed.address,
          phone: parsed.phone,
          email: parsed.email,
        }
      : {
          accountType: "CORPORATION" as const,
          fullName: null,
          citizenId: null,
          companyName: parsed.companyName,
          taxId: encryptSecret(parsed.taxId),
          branchCode: parsed.branchCode,
          branchName: parsed.branchName ?? (parsed.branchCode === "00000" ? "สำนักงานใหญ่" : null),
          contactPerson: parsed.contactPerson,
          address: parsed.address,
          phone: parsed.phone,
          email: parsed.email,
        }

  const billingInfo = await prisma.billingInfo.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  })

  return billingInfo
}

// ── Get BillingInfo ─────────────────────────────────────

export async function getBillingInfo() {
  const user = await getSession()
  if (!user) throw new Error("กรุณาเข้าสู่ระบบ")

  const billingInfo = await prisma.billingInfo.findUnique({
    where: { userId: user.id },
  })

  if (!billingInfo) return null

  // Decrypt PII fields for display
  return {
    ...billingInfo,
    citizenId: billingInfo.citizenId ? decryptSecret(billingInfo.citizenId) : null,
    taxId: billingInfo.taxId ? decryptSecret(billingInfo.taxId) : null,
  }
}

// ── Delete BillingInfo ──────────────────────────────────

export async function deleteBillingInfo() {
  const user = await getSession()
  if (!user) throw new Error("กรุณาเข้าสู่ระบบ")

  const existing = await prisma.billingInfo.findUnique({
    where: { userId: user.id },
    select: { id: true },
  })
  if (!existing) throw new Error("ไม่พบข้อมูลบิลลิ่ง")

  await prisma.billingInfo.delete({
    where: { userId: user.id },
  })

  return { success: true }
}

// ── Check if billing info is complete ───────────────────

export async function hasBillingInfo(): Promise<boolean> {
  const user = await getSession()
  if (!user) return false

  const info = await prisma.billingInfo.findUnique({
    where: { userId: user.id },
    select: { id: true },
  })

  return info !== null
}

// ── Document Numbering (Atomic) ─────────────────────────
// กฎหมายสรรพากร: เลขที่เอกสารต้องต่อเนื่อง ห้ามมี gap
// Uses INSERT ... ON CONFLICT DO UPDATE for atomic increment

const DOC_PREFIX: Record<DocumentType, string> = {
  TAX_INVOICE: "TIV",
  RECEIPT: "RCP",
  TAX_INVOICE_RECEIPT: "TIR",
  INVOICE: "INV",
  DEBIT_NOTE: "DBN",
  CREDIT_NOTE: "CDN",
}

export async function getNextDocumentNumber(type: DocumentType): Promise<string> {
  const year = new Date().getFullYear()
  const buddhistYear = year + 543 // ปี พ.ศ.

  // Atomic: INSERT if not exists, UPDATE +1 if exists, RETURNING the new number
  // No gap possible — single SQL statement with row-level lock
  const id = randomUUID()
  const result = await prisma.$queryRawUnsafe<[{ last_number: number }]>(
    `INSERT INTO document_sequences (id, type, year, last_number)
     VALUES ($1, $2, $3, 1)
     ON CONFLICT (type, year)
     DO UPDATE SET last_number = document_sequences.last_number + 1
     RETURNING last_number`,
    id,
    type,
    year,
  )

  const seq = result[0]!.last_number
  const prefix = DOC_PREFIX[type]
  // Format: TIV-2569-000001 (prefix-พ.ศ.-6 digit padded)
  return `${prefix}-${buddhistYear}-${String(seq).padStart(6, "0")}`
}
