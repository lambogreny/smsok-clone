// ── Purchase Package Types & Mock Data ──
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

// ── Mock Data (until backend API #1455 is ready) ──

export const PACKAGE_TIERS: PackageTier[] = [
  // SME (A-D)
  {
    id: "tier-a",
    tier: "A",
    name: "Starter",
    group: "sme",
    smsCredits: 500,
    bonusCredits: 0,
    priceNet: 500,
    pricePerSms: 1.0,
    features: ["500 SMS", "1 Sender Name", "30 วัน", "Email Support"],
    isBestValue: false,
    senderNames: 1,
    validity: 30,
  },
  {
    id: "tier-b",
    tier: "B",
    name: "Growth",
    group: "sme",
    smsCredits: 2000,
    bonusCredits: 100,
    priceNet: 1500,
    pricePerSms: 0.75,
    features: [
      "2,000 SMS",
      "3 Sender Names",
      "90 วัน",
      "Priority Support",
    ],
    isBestValue: true,
    senderNames: 3,
    validity: 90,
  },
  {
    id: "tier-c",
    tier: "C",
    name: "Pro",
    group: "sme",
    smsCredits: 6000,
    bonusCredits: 300,
    priceNet: 2100,
    pricePerSms: 0.35,
    features: [
      "6,000 SMS",
      "5 Sender Names",
      "180 วัน",
      "Priority Support",
    ],
    isBestValue: false,
    senderNames: 5,
    validity: 180,
  },
  {
    id: "tier-d",
    tier: "D",
    name: "Scale",
    group: "sme",
    smsCredits: 15000,
    bonusCredits: 1000,
    priceNet: 4500,
    pricePerSms: 0.3,
    features: [
      "15,000 SMS",
      "10 Sender Names",
      "365 วัน",
      "Dedicated Support",
    ],
    isBestValue: false,
    senderNames: 10,
    validity: 365,
  },
  // Enterprise (E-H)
  {
    id: "tier-e",
    tier: "E",
    name: "Business",
    group: "enterprise",
    smsCredits: 30000,
    bonusCredits: 3000,
    priceNet: 7500,
    pricePerSms: 0.25,
    features: [
      "30,000 SMS",
      "20 Sender Names",
      "365 วัน",
      "Dedicated Support",
    ],
    isBestValue: false,
    senderNames: 20,
    validity: 365,
  },
  {
    id: "tier-f",
    tier: "F",
    name: "Corporate",
    group: "enterprise",
    smsCredits: 80000,
    bonusCredits: 10000,
    priceNet: 16000,
    pricePerSms: 0.2,
    features: [
      "80,000 SMS",
      "50 Sender Names",
      "365 วัน",
      "Dedicated Support",
      "SLA 99.9%",
    ],
    isBestValue: true,
    senderNames: 50,
    validity: 365,
  },
  {
    id: "tier-g",
    tier: "G",
    name: "Premium",
    group: "enterprise",
    smsCredits: 200000,
    bonusCredits: 30000,
    priceNet: 30000,
    pricePerSms: 0.15,
    features: [
      "200,000 SMS",
      "100 Sender Names",
      "365 วัน",
      "Dedicated Support",
      "SLA 99.9%",
      "Custom API",
    ],
    isBestValue: false,
    senderNames: 100,
    validity: 365,
  },
  {
    id: "tier-h",
    tier: "H",
    name: "Unlimited",
    group: "enterprise",
    smsCredits: 500000,
    bonusCredits: 100000,
    priceNet: 50000,
    pricePerSms: 0.1,
    features: [
      "500,000 SMS",
      "ไม่จำกัด Sender Names",
      "365 วัน",
      "Dedicated Account Manager",
      "SLA 99.99%",
      "Custom API",
    ],
    isBestValue: false,
    senderNames: -1,
    validity: 365,
  },
];

export const MOCK_BANK_ACCOUNT = {
  bankName: "ธนาคารกสิกรไทย (KBank)",
  accountName: "บจก.SMSOK",
  accountNumber: "123-4-56789-0",
};

// Comparison table features
export const COMPARISON_FEATURES = [
  { key: "smsCredits", label: "SMS Credits" },
  { key: "bonusCredits", label: "Bonus SMS" },
  { key: "senderNames", label: "Sender Names" },
  { key: "validity", label: "Validity" },
  { key: "pricePerSms", label: "ราคา/SMS" },
  { key: "prioritySupport", label: "Priority Support" },
  { key: "dedicatedSupport", label: "Dedicated Support" },
  { key: "sla", label: "SLA" },
] as const;
