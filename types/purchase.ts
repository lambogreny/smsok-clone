// ── Purchase Package Types ──
// Spec: SMSOK-PURCHASE-PACKAGE-V2-WIREFRAMES-SPEC.md

export type PackageGroup = "sme" | "enterprise";

export interface PackageTier {
  id: string;
  tier: string;
  name: string;
  group: PackageGroup;
  smsCredits: number;
  bonusCredits: number;
  priceNet: number;
  pricePerSms: number;
  features: string[];
  isBestValue: boolean;
  senderNames: number;
  validity: number;
}

export interface TaxProfile {
  id: string;
  companyName: string;
  taxId: string;
  address: string;
  branchType: "HEAD" | "BRANCH";
  branchNumber: string | null;
  isDefault: boolean;
}

export interface PriceBreakdown {
  net: number;
  vat: number;
  total: number;
  wht: number;
  netPay: number;
}

export interface CheckoutState {
  step: 1 | 2 | 3;
  packageTier: PackageTier;
  priceBreakdown: PriceBreakdown;
  wantTaxInvoice: boolean;
  taxProfile: TaxProfile | null;
  hasWht: boolean;
  saveTaxProfile: boolean;
  slipFile: File | null;
  slipPreview: string | null;
  whtCertFile: File | null;
  expiresAt: string;
}

export type PaymentStatus =
  | "pending"
  | "processing"
  | "pending_review"
  | "completed"
  | "failed"
  | "expired"
  | "refunded";

// ── Helpers ──

export function calculateBreakdown(
  net: number,
  hasWht: boolean
): PriceBreakdown {
  const vat = Math.round(net * 0.07 * 100) / 100;
  const total = Math.round((net + vat) * 100) / 100;
  const wht = hasWht ? Math.round(net * 0.03 * 100) / 100 : 0;
  const netPay = Math.round((total - wht) * 100) / 100;
  return { net, vat, total, wht, netPay };
}

export function formatBaht(amount: number): string {
  return amount.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ── Package data fetched from API /api/v1/packages ──
// No hardcoded pricing — fetch via usePackageTiers() hook

export async function fetchPackageTiers(): Promise<PackageTier[]> {
  try {
    const res = await fetch("/api/v1/packages");
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data ?? data.packages ?? data.tiers ?? []) as PackageTier[];
  } catch {
    return [];
  }
}

export async function fetchBankAccount(): Promise<{
  bankName: string;
  accountName: string;
  accountNumber: string;
} | null> {
  try {
    const res = await fetch("/api/v1/payments/bank-account");
    if (!res.ok) return null;
    const data = await res.json();
    return data.data ?? data;
  } catch {
    return null;
  }
}

// Comparison table features
export const COMPARISON_FEATURES = [
  { key: "smsCredits", label: "จำนวน SMS" },
  { key: "bonusCredits", label: "Bonus SMS" },
  { key: "senderNames", label: "Sender Names" },
  { key: "validity", label: "Validity" },
  { key: "pricePerSms", label: "ราคา/SMS" },
  { key: "prioritySupport", label: "Priority Support" },
  { key: "dedicatedSupport", label: "Dedicated Support" },
  { key: "sla", label: "SLA" },
] as const;
