import { type PrismaClient, type OrderStatus } from "@prisma/client";
import { prisma as db } from "@/lib/db";

type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];
type DbClient = PrismaClient | TxClient;

type OrderRecord = {
  id: string;
  orderNumber: string;
  packageTierId: string;
  packageName: string;
  smsCount: number;
  customerType: "INDIVIDUAL" | "COMPANY";
  taxName: string;
  taxId: string;
  taxAddress: string;
  taxBranchType: "HEAD" | "BRANCH";
  taxBranchNumber: string | null;
  netAmount: { toNumber(): number } | number;
  vatAmount: { toNumber(): number } | number;
  totalAmount: { toNumber(): number } | number;
  hasWht: boolean;
  whtAmount: { toNumber(): number } | number;
  payAmount: { toNumber(): number } | number;
  status: OrderStatus;
  expiresAt: Date;
  quotationNumber: string | null;
  quotationUrl: string | null;
  invoiceNumber: string | null;
  invoiceUrl: string | null;
  slipUrl: string | null;
  whtCertUrl: string | null;
  easyslipVerified: boolean | null;
  rejectReason: string | null;
  adminNote: string | null;
  paidAt: Date | null;
  createdAt: Date;
};

function toNumber(value: { toNumber(): number } | number) {
  return typeof value === "number" ? value : value.toNumber();
}

export function calculateOrderAmounts(netAmount: number, hasWht: boolean) {
  const vatAmount = Math.round(netAmount * 0.07 * 100) / 100;
  const totalAmount = Math.round((netAmount + vatAmount) * 100) / 100;
  const whtAmount = hasWht ? Math.round(netAmount * 0.03 * 100) / 100 : 0;
  const payAmount = Math.round((totalAmount - whtAmount) * 100) / 100;

  return {
    netAmount,
    vatAmount,
    totalAmount,
    whtAmount,
    payAmount,
  };
}

export async function getUserPrimaryOrganizationId(userId: string, client: DbClient = db) {
  const membership = await client.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { organizationId: true },
  });

  return membership?.organizationId ?? null;
}

export async function createOrderHistory(
  client: DbClient,
  orderId: string,
  toStatus: OrderStatus,
  options?: {
    fromStatus?: OrderStatus | null;
    changedBy?: string | null;
    note?: string | null;
  },
) {
  await client.orderHistory.create({
    data: {
      orderId,
      fromStatus: options?.fromStatus ?? null,
      toStatus,
      changedBy: options?.changedBy ?? null,
      note: options?.note ?? null,
    },
  });
}

export async function upsertDefaultCompanyTaxProfile(
  client: DbClient,
  userId: string,
  organizationId: string | null,
  input: {
    companyName: string;
    taxId: string;
    address: string;
    branchType: "HEAD" | "BRANCH";
    branchNumber?: string | null;
  },
) {
  const existing = await client.taxProfile.findFirst({
    where: {
      userId,
      organizationId,
      isDefault: true,
    },
    select: { id: true },
  });

  if (existing) {
    return client.taxProfile.update({
      where: { id: existing.id },
      data: {
        companyName: input.companyName,
        taxId: input.taxId,
        address: input.address,
        branchType: input.branchType,
        branchNumber: input.branchType === "HEAD" ? null : input.branchNumber ?? null,
        isDefault: true,
      },
      select: { id: true },
    });
  }

  return client.taxProfile.create({
    data: {
      userId,
      organizationId,
      companyName: input.companyName,
      taxId: input.taxId,
      address: input.address,
      branchType: input.branchType,
      branchNumber: input.branchType === "HEAD" ? null : input.branchNumber ?? null,
      isDefault: true,
    },
    select: { id: true },
  });
}

export function serializeOrder(order: OrderRecord) {
  return {
    id: order.id,
    order_number: order.orderNumber,
    package_tier_id: order.packageTierId,
    package_name: order.packageName,
    sms_count: order.smsCount,
    customer_type: order.customerType,
    tax_name: order.taxName,
    tax_id: order.taxId,
    tax_address: order.taxAddress,
    tax_branch_type: order.taxBranchType,
    tax_branch_number: order.taxBranchNumber ?? undefined,
    net_amount: toNumber(order.netAmount),
    vat_amount: toNumber(order.vatAmount),
    total_amount: toNumber(order.totalAmount),
    has_wht: order.hasWht,
    wht_amount: toNumber(order.whtAmount),
    pay_amount: toNumber(order.payAmount),
    status: order.status,
    expires_at: order.expiresAt.toISOString(),
    quotation_number: order.quotationNumber ?? undefined,
    quotation_url: order.quotationUrl ?? undefined,
    invoice_number: order.invoiceNumber ?? undefined,
    invoice_url: order.invoiceUrl ?? undefined,
    slip_url: order.slipUrl ?? undefined,
    wht_cert_url: order.whtCertUrl ?? undefined,
    easyslip_verified: order.easyslipVerified ?? undefined,
    reject_reason: order.rejectReason ?? undefined,
    admin_note: order.adminNote ?? undefined,
    paid_at: order.paidAt?.toISOString(),
    created_at: order.createdAt.toISOString(),
  };
}
