import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { z } from "zod";

const taxProfileSchema = z.object({
  companyName: z.string().min(2, "กรุณากรอกชื่อบริษัท").max(200),
  taxId: z
    .string()
    .length(13, "เลขทะเบียนนิติบุคคลต้องมี 13 หลัก")
    .regex(/^\d{13}$/, "เลขทะเบียนนิติบุคคลต้องเป็นตัวเลข 13 หลัก"),
  branch: z.string().max(100).default("สำนักงานใหญ่"),
  branchCode: z
    .string()
    .regex(/^\d{5}$/, "รหัสสาขาต้องเป็นตัวเลข 5 หลัก")
    .default("00000"),
  address: z.string().min(10, "ที่อยู่ต้องมีอย่างน้อย 10 ตัวอักษร").max(500),
  contactPerson: z.string().max(200).optional(),
  phone: z
    .string()
    .regex(/^(0[0-9]{9}|\+66[0-9]{9})$/, "เบอร์โทรไม่ถูกต้อง")
    .optional(),
  email: z.string().email("อีเมลไม่ถูกต้อง").optional(),
});

// GET /api/v1/settings/tax-profile — get tax profile
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    // Read from new taxProfile table first (written by order creation)
    const newProfile = await db.taxProfile.findFirst({
      where: { userId: session.id, isDefault: true },
      orderBy: { updatedAt: "desc" },
    });

    if (newProfile) {
      // Check if this profile was saved by an INDIVIDUAL customer
      const latestOrder = await db.order.findFirst({
        where: { userId: session.id, taxProfileId: newProfile.id },
        select: { customerType: true },
        orderBy: { createdAt: "desc" },
      });
      const isIndividual = latestOrder?.customerType === "INDIVIDUAL";

      return apiResponse({
        taxProfile: {
          companyName: newProfile.companyName,
          taxId: newProfile.taxId,
          branch: isIndividual
            ? "INDIVIDUAL"
            : newProfile.branchType === "HEAD" ? "สำนักงานใหญ่" : "สาขา",
          branchCode: newProfile.branchNumber ?? "00000",
          address: newProfile.address,
          updatedAt: newProfile.updatedAt,
        },
      });
    }

    // Fallback to legacy customerTaxInfo table
    const taxInfo = await db.customerTaxInfo.findUnique({
      where: { userId: session.id },
    });

    if (!taxInfo) {
      return apiResponse({ taxProfile: null });
    }

    return apiResponse({
      taxProfile: {
        companyName: taxInfo.companyName,
        taxId: taxInfo.taxId,
        branch: taxInfo.branch,
        branchCode: taxInfo.branchCode,
        address: taxInfo.address,
        contactPerson: taxInfo.contactPerson,
        phone: taxInfo.phone,
        email: taxInfo.email,
        updatedAt: taxInfo.updatedAt,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

// PUT /api/v1/settings/tax-profile — create or update tax profile
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const body = await req.json();
    const input = taxProfileSchema.parse(body);

    const taxInfo = await db.customerTaxInfo.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        ...input,
      },
      update: input,
    });

    return apiResponse({
      taxProfile: {
        companyName: taxInfo.companyName,
        taxId: taxInfo.taxId,
        branch: taxInfo.branch,
        branchCode: taxInfo.branchCode,
        address: taxInfo.address,
        contactPerson: taxInfo.contactPerson,
        phone: taxInfo.phone,
        email: taxInfo.email,
        updatedAt: taxInfo.updatedAt,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
