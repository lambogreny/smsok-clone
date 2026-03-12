import { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";
import {
  calculateOrderAmounts,
  createOrderHistory,
  getUserPrimaryOrganizationId,
  serializeOrder,
  upsertDefaultCompanyTaxProfile,
} from "@/lib/orders/service";
import { generateOrderDocumentNumber } from "@/lib/orders/numbering";

const createSchema = z.object({
  package_tier_id: z.string().min(1),
  customer_type: z.enum(["INDIVIDUAL", "COMPANY"]),
  tax_name: z.string().trim().min(2).max(200),
  tax_id: z.string().regex(/^\d{13}$/),
  tax_address: z.string().trim().min(10).max(1000),
  tax_branch_type: z.enum(["HEAD", "BRANCH"]),
  tax_branch_number: z.string().regex(/^\d{5}$/).optional(),
  has_wht: z.boolean().default(false),
  save_tax_profile: z.boolean().default(false),
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
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const orderSelect = {
  id: true,
  orderNumber: true,
  packageTierId: true,
  packageName: true,
  smsCount: true,
  customerType: true,
  taxName: true,
  taxId: true,
  taxAddress: true,
  taxBranchType: true,
  taxBranchNumber: true,
  netAmount: true,
  vatAmount: true,
  totalAmount: true,
  hasWht: true,
  whtAmount: true,
  payAmount: true,
  status: true,
  expiresAt: true,
  quotationNumber: true,
  quotationUrl: true,
  invoiceNumber: true,
  invoiceUrl: true,
  slipUrl: true,
  whtCertUrl: true,
  easyslipVerified: true,
  rejectReason: true,
  adminNote: true,
  paidAt: true,
  createdAt: true,
} as const;

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const rl = await applyRateLimit(session.id, "purchase");
    if (rl.blocked) return rl.blocked;

    const input = listSchema.parse(Object.fromEntries(new URL(req.url).searchParams));
    const where: Record<string, unknown> = { userId: session.id };

    if (input.status) {
      where.status = input.status;
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
        select: orderSelect,
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      db.order.count({ where }),
      db.order.count({ where: { userId: session.id } }),
      db.order.count({ where: { userId: session.id, status: { in: ["PENDING", "SLIP_UPLOADED", "PENDING_REVIEW"] } } }),
      db.order.count({ where: { userId: session.id, status: "COMPLETED" } }),
      db.order.aggregate({
        where: { userId: session.id, status: "COMPLETED" },
        _sum: { payAmount: true },
      }),
    ]);

    return apiResponse({
      orders: orders.map(serializeOrder),
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / input.limit)),
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
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const rl = await applyRateLimit(session.id, "purchase");
    if (rl.blocked) return rl.blocked;

    const input = createSchema.parse(await req.json());
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

    const organizationId = await getUserPrimaryOrganizationId(session.id);
    const totals = calculateOrderAmounts(Number(tier.price), input.has_wht);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const order = await db.$transaction(async (tx) => {
      const orderNumber = await generateOrderDocumentNumber("order", tx);
      const quotationNumber = await generateOrderDocumentNumber("quotation", tx);

      let taxProfileId: string | null = null;
      if (input.save_tax_profile && input.customer_type === "COMPANY") {
        const profile = await upsertDefaultCompanyTaxProfile(tx, session.id, organizationId, {
          companyName: input.tax_name,
          taxId: input.tax_id,
          address: input.tax_address,
          branchType: input.tax_branch_type,
          branchNumber: input.tax_branch_number ?? null,
        });
        taxProfileId = profile.id;
      }

      const created = await tx.order.create({
        data: {
          userId: session.id,
          organizationId,
          packageTierId: tier.id,
          taxProfileId,
          orderNumber,
          customerType: input.customer_type,
          packageName: tier.name,
          smsCount: tier.totalSms,
          taxName: input.tax_name,
          taxId: input.tax_id,
          taxAddress: input.tax_address,
          taxBranchType: input.tax_branch_type,
          taxBranchNumber: input.tax_branch_type === "HEAD" ? null : input.tax_branch_number ?? null,
          netAmount: totals.netAmount,
          vatAmount: totals.vatAmount,
          totalAmount: totals.totalAmount,
          hasWht: input.has_wht,
          whtAmount: totals.whtAmount,
          payAmount: totals.payAmount,
          status: "PENDING",
          expiresAt,
          quotationNumber,
          quotationUrl: "",
          createdBy: session.id,
        },
        select: orderSelect,
      });

      const quotationUrl = `/api/v1/orders/${created.id}/quotation`;
      const updated = await tx.order.update({
        where: { id: created.id },
        data: { quotationUrl },
        select: orderSelect,
      });

      await createOrderHistory(tx, updated.id, "PENDING", {
        changedBy: session.id,
        note: "Order created",
      });

      return updated;
    });

    return apiResponse(serializeOrder(order), 201);
  } catch (error) {
    return apiError(error);
  }
}
