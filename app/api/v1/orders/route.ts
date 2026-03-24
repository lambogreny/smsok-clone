import { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError, apiError, apiResponse, authenticateRequest } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";
import { ensureOrderDocument, orderSummarySelect } from "@/lib/orders/api";
import {
  calculateOrderAmounts,
  createOrderHistory,
  getOrderExpirationDate,
  getUserPrimaryOrganizationId,
  isWhtEligible,
  parseLegacyOrderStatus,
  serializeOrder,
  upsertDefaultCompanyTaxProfile,
} from "@/lib/orders/service";
import { generateOrderDocumentNumber } from "@/lib/orders/numbering";

// Strip HTML tags and entities to prevent XSS
const stripHtml = (val: string) =>
  val
    .replace(/<[^>]*>?/g, "")
    .replace(/&(?:lt|gt|amp|quot|#39|#x27|#x2F);?/gi, "");

const createSchema = z.object({
  package_tier_id: z.string().min(1),
  customer_type: z.enum(["INDIVIDUAL", "COMPANY"]),
  company_name: z.string().trim().transform(stripHtml).pipe(z.string().min(2).max(200)).optional(),
  company_address: z.string().trim().transform(stripHtml).pipe(z.string().min(10).max(1000)).optional(),
  tax_name: z.string().trim().transform(stripHtml).pipe(z.string().min(2).max(200)),
  tax_id: z.string().regex(/^\d{13}$/),
  tax_address: z.string().trim().transform(stripHtml).pipe(z.string().min(10).max(1000)),
  tax_branch_type: z.enum(["HEAD", "BRANCH"]),
  tax_branch_number: z.string().regex(/^\d{5}$/).optional(),
  has_wht: z.boolean().default(false),
  wht_applicable: z.boolean().optional(),
  save_tax_profile: z.boolean().default(false),
  payment_method: z.enum(["bank_transfer", "promptpay"]).default("bank_transfer"),
}).superRefine((value, ctx) => {
  if (value.tax_branch_type === "BRANCH" && !value.tax_branch_number) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["tax_branch_number"],
      message: "กรุณาระบุเลขสาขา 5 หลัก",
    });
  }
  if (value.has_wht && value.customer_type !== "COMPANY") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["has_wht"],
      message: "หักภาษี ณ ที่จ่ายใช้ได้เฉพาะนิติบุคคล",
    });
  }
});

const listSchema = z.object({
  status: z.enum([
    "PENDING",
    "SLIP_UPLOADED",
    "VERIFIED",
    "PENDING_REVIEW",
    "APPROVED",
    "COMPLETED",
    "EXPIRED",
    "CANCELLED",
    "REJECTED",
  ]).optional(),
  search: z.string().trim().optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    await db.order.updateMany({
      where: {
        userId: user.id,
        status: { in: ["DRAFT", "PENDING_PAYMENT"] },
        expiresAt: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    });

    const input = listSchema.parse(Object.fromEntries(new URL(req.url).searchParams));
    const where: Record<string, unknown> = { userId: user.id };

    if (input.status) {
      const mappedStatuses = parseLegacyOrderStatus(input.status);
      if (mappedStatuses?.length) {
        where.status = { in: mappedStatuses };
      }
      // REJECTED maps to PENDING_PAYMENT — narrow to only rejected ones
      if (input.status === "REJECTED") {
        where.rejectReason = { not: null };
      }
      // PENDING should exclude rejected orders
      if (input.status === "PENDING") {
        where.rejectReason = null;
      }
    }

    if (input.from || input.to) {
      where.createdAt = {
        ...(input.from ? { gte: new Date(`${input.from}T00:00:00.000Z`) } : {}),
        ...(input.to ? { lte: new Date(`${input.to}T23:59:59.999Z`) } : {}),
      };
    }

    if (input.search) {
      where.OR = [
        { orderNumber: { contains: input.search, mode: "insensitive" } },
        { packageName: { contains: input.search, mode: "insensitive" } },
        { taxName: { contains: input.search, mode: "insensitive" } },
      ];
    }

    const [orders, total, totalOrders, pendingOrders, completedOrders, spent] = await Promise.all([
      db.order.findMany({
        where,
        select: orderSummarySelect,
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      db.order.count({ where }),
      db.order.count({ where: { userId: user.id } }),
      db.order.count({
        where: {
          userId: user.id,
          status: { in: ["DRAFT", "PENDING_PAYMENT", "VERIFYING"] },
        },
      }),
      db.order.count({ where: { userId: user.id, status: "PAID" } }),
      db.order.aggregate({
        where: { userId: user.id, status: "PAID" },
        _sum: { payAmount: true },
      }),
    ]);

    return apiResponse({
      orders: orders.map(serializeOrder),
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / input.limit),
      },
      stats: {
        total: totalOrders,
        pending: pendingOrders,
        completed: completedOrders,
        total_spent: spent._sum.payAmount?.toNumber() ?? 0,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const input = createSchema.parse(await req.json());
    const companyName = input.customer_type === "COMPANY" ? input.company_name?.trim() || input.tax_name : input.tax_name;
    const companyAddress =
      input.customer_type === "COMPANY" ? input.company_address?.trim() || input.tax_address : input.tax_address;
    const hasWht = input.wht_applicable ?? input.has_wht;
    const tier = await db.packageTier.findUnique({
      where: { id: input.package_tier_id },
      select: {
        id: true,
        name: true,
        price: true,
        totalSms: true,
        isActive: true,
      },
    });
    if (!tier || !tier.isActive) throw new ApiError(404, "ไม่พบแพ็กเกจ");
    if (hasWht && !isWhtEligible(Number(tier.price), input.customer_type)) {
      throw new ApiError(400, "หักภาษี ณ ที่จ่ายใช้ได้เมื่อเป็นนิติบุคคลและยอดก่อน VAT ตั้งแต่ 1,000 เครดิต");
    }

    const organizationId = await getUserPrimaryOrganizationId(user.id);
    const totals = calculateOrderAmounts(Number(tier.price), hasWht);
    const expiresAt = getOrderExpirationDate(input.payment_method);

    const order = await db.$transaction(async (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => {
      const orderNumber = await generateOrderDocumentNumber("order", tx);
      const quotationNumber = await generateOrderDocumentNumber("quotation", tx);

      let taxProfileId: string | null = null;
      if (input.save_tax_profile) {
        const profile = await upsertDefaultCompanyTaxProfile(tx, user.id, organizationId, {
          companyName,
          taxId: input.tax_id,
          address: companyAddress,
          branchType: input.tax_branch_type,
          branchNumber: input.tax_branch_number ?? null,
        });
        taxProfileId = profile.id;
      }

      const created = await tx.order.create({
        data: {
          userId: user.id,
          organizationId,
          packageTierId: tier.id,
          taxProfileId,
          orderNumber,
          customerType: input.customer_type,
          packageName: tier.name,
          smsCount: tier.totalSms,
          taxName: companyName,
          taxId: input.tax_id,
          taxAddress: companyAddress,
          taxBranchType: input.tax_branch_type,
          taxBranchNumber: input.tax_branch_type === "HEAD" ? null : input.tax_branch_number ?? null,
          netAmount: totals.netAmount,
          vatAmount: totals.vatAmount,
          totalAmount: totals.totalAmount,
          hasWht,
          whtAmount: totals.whtAmount,
          payAmount: totals.payAmount,
          status: "PENDING_PAYMENT",
          expiresAt,
          quotationNumber,
          quotationUrl: "",
          createdBy: user.id,
        },
        select: orderSummarySelect,
      });

      const quotationUrl = `/api/v1/orders/${created.id}/quotation`;

      const updated = await tx.order.update({
        where: { id: created.id },
        data: { quotationUrl },
        select: orderSummarySelect,
      });

      await createOrderHistory(tx, updated.id, "PENDING_PAYMENT", {
        changedBy: user.id,
        note: "Order created",
      });

      return updated;
    });

    // Generate invoice document outside transaction — non-fatal
    try {
      await ensureOrderDocument(db, { id: order.id }, "INVOICE");
    } catch (docErr) {
      console.error("[orders] Invoice document generation failed (non-fatal):", docErr);
    }

    return apiResponse(serializeOrder(order), 201);
  } catch (error) {
    return apiError(error);
  }
}
