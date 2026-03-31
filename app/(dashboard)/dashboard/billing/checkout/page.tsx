"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Check,
  Loader2,
  Clock,
  AlertTriangle,
  Save,
  Building2,
  User,
  Info,
  HelpCircle,
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  type PackageTier,
  calculateBreakdown,
  formatBaht,
} from "@/types/purchase";
import type { CustomerType, BranchType, OrderCreatePayload } from "@/types/order";

// ── Map API tier to PackageTier ──

interface ApiTier {
  id: string;
  name: string;
  tierCode: string;
  price: number;
  smsQuota: number;
  bonusPercent: number;
  totalSms: number;
  senderNameLimit: number;
  expiryMonths: number;
}

function mapApiTier(t: ApiTier): PackageTier {
  return {
    id: t.id,
    tier: t.tierCode,
    name: t.name,
    group: t.smsQuota <= 15000 ? "sme" : "enterprise",
    smsCredits: t.smsQuota,
    bonusCredits: Math.round((t.smsQuota * t.bonusPercent) / 100),
    priceNet: t.price,
    pricePerSms: t.totalSms > 0 ? Math.round((t.price / t.totalSms) * 100) / 100 : 0,
    features: [],
    isBestValue: false,
    senderNames: t.senderNameLimit,
    validity: t.expiryMonths * 30,
  };
}

// ── Tax ID Validation (13-digit checksum) ──

function formatTaxId(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 1) return digits;
  const parts: string[] = [];
  if (digits.length > 0) parts.push(digits.slice(0, 1));
  if (digits.length > 1) parts.push(digits.slice(1, 5));
  if (digits.length > 5) parts.push(digits.slice(5, 10));
  if (digits.length > 10) parts.push(digits.slice(10, 12));
  if (digits.length > 12) parts.push(digits.slice(12, 13));
  return parts.join("-");
}

function unformatTaxId(formatted: string): string {
  return formatted.replace(/\D/g, "");
}

function validateTaxIdChecksum(digits: string): boolean {
  if (digits.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(digits[i]) * (13 - i);
  }
  const check = (11 - (sum % 11)) % 10;
  return check === Number(digits[12]);
}

// ── Step Indicator ──

function StepIndicator({ current }: { current: number }) {
  const steps = [
    { num: 1, label: "เลือกแพ็กเกจ" },
    { num: 2, label: "กรอกข้อมูล" },
    { num: 3, label: "ชำระเงิน" },
    { num: 4, label: "สำเร็จ" },
  ];

  return (
    <div className="flex items-center justify-center gap-1 py-4 px-6">
      {steps.map((s, i) => {
        const isDone = s.num < current;
        const isActive = s.num === current;
        return (
          <div key={s.num} className="flex items-center gap-1">
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all"
                style={{
                  background: isDone
                    ? "var(--accent)"
                    : isActive
                      ? "rgba(var(--accent-rgb), 0.15)"
                      : "var(--bg-elevated)",
                  color: isDone
                    ? "var(--bg-base)"
                    : isActive
                      ? "var(--accent)"
                      : "var(--text-muted)",
                  border: isActive
                    ? "1.5px solid var(--accent)"
                    : "1.5px solid transparent",
                }}
              >
                {isDone ? <Check size={12} /> : s.num}
              </div>
              <span
                className="text-xs font-medium hidden sm:inline"
                style={{
                  color: isActive
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                }}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="w-6 sm:w-10 h-px mx-1"
                style={{
                  background:
                    s.num < current
                      ? "var(--accent)"
                      : "var(--border-default)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Price Summary Card (Right Panel — Sticky) ──

function PriceSummaryCard({
  tier,
  net,
  vat,
  total,
  hasWht,
  wht,
  payAmount,
  customerType,
}: {
  tier: PackageTier;
  net: number;
  vat: number;
  total: number;
  hasWht: boolean;
  wht: number;
  payAmount: number;
  customerType: CustomerType;
}) {
  return (
    <div
      className="sticky top-20 rounded-lg p-6"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      <h3
        className="text-base font-semibold mb-1"
        style={{ color: "var(--text-primary)" }}
      >
        สรุปคำสั่งซื้อ
      </h3>
      <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
        {tier.name} ({tier.tier})
      </p>

      <div className="space-y-2.5">
        <div className="flex justify-between text-[13px]">
          <span style={{ color: "var(--text-muted)" }}>
            {tier.smsCredits.toLocaleString()} SMS
          </span>
        </div>

        <div
          className="pt-3 mt-3 space-y-2"
          style={{ borderTop: "1px dashed var(--border-default)" }}
        >
          <div className="flex justify-between text-[13px]">
            <span style={{ color: "var(--text-muted)" }}>ราคาแพ็กเกจ</span>
            <span
              className="font-mono tabular-nums"
              style={{ color: "var(--text-primary)" }}
            >
              ฿{formatBaht(net)}
            </span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span style={{ color: "var(--text-muted)" }}>VAT 7%</span>
            <span
              className="font-mono tabular-nums"
              style={{ color: "var(--text-primary)" }}
            >
              ฿{formatBaht(vat)}
            </span>
          </div>
          <div
            className="flex justify-between pt-2 mt-2"
            style={{ borderTop: "1px dashed var(--border-default)" }}
          >
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              รวมทั้งสิ้น
            </span>
            <span
              className="text-sm font-semibold font-mono tabular-nums"
              style={{ color: "var(--text-primary)" }}
            >
              ฿{formatBaht(total)}
            </span>
          </div>

          {hasWht && (
            <div className="flex justify-between text-[13px]">
              <span style={{ color: "var(--error)" }}>หัก WHT 3%</span>
              <span
                className="font-mono tabular-nums"
                style={{ color: "var(--error)" }}
              >
                -฿{formatBaht(wht)}
              </span>
            </div>
          )}

          <div
            className="flex justify-between pt-2 mt-2"
            style={{ borderTop: "1px dashed var(--border-default)" }}
          >
            <span
              className="text-base font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              ยอดที่ต้องโอน
            </span>
            <span
              className="text-base font-bold font-mono tabular-nums"
              style={{ color: "var(--accent)" }}
            >
              ฿{formatBaht(payAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Documents section */}
      <div
        className="mt-5 pt-4 space-y-2"
        style={{ borderTop: "1px solid var(--border-default)" }}
      >
        <p
          className="text-xs font-medium mb-2"
          style={{ color: "var(--text-muted)" }}
        >
          เอกสารที่จะได้
        </p>
        <div className="flex items-center gap-2">
          <Check size={14} style={{ color: "var(--accent)" }} />
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            ใบเสนอราคา (ทันที)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Check size={14} style={{ color: "var(--accent)" }} />
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {customerType === "COMPANY"
              ? "ใบกำกับภาษี (หลังชำระ)"
              : "ใบเสร็จรับเงิน (หลังชำระ)"}
          </span>
        </div>
      </div>

      {/* Expiry note */}
      <div className="flex items-center gap-2 mt-4">
        <Clock size={12} style={{ color: "var(--warning)" }} />
        <span className="text-xs" style={{ color: "var(--warning)" }}>
          หมดอายุใน 24 ชม. หลังสร้างคำสั่งซื้อ
        </span>
      </div>
    </div>
  );
}

// ── Main Checkout Page ──

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tierParam = searchParams.get("packageId") ?? searchParams.get("tier");
  const isReorder = searchParams.get("reorder") === "1";

  const [tiers, setTiers] = useState<PackageTier[]>([]);
  const [tiersLoading, setTiersLoading] = useState(true);

  // Fetch real package tiers from API
  useEffect(() => {
    async function fetchTiers() {
      try {
        const res = await fetch("/api/v1/packages");
        if (res.ok) {
          const json = await res.json();
          const apiTiers: ApiTier[] = json.data?.tiers ?? json.tiers ?? [];
          setTiers(apiTiers.map(mapApiTier));
        }
      } catch {
        // Fallback: empty
      } finally {
        setTiersLoading(false);
      }
    }
    fetchTiers();
  }, []);

  // Find tier by ID (from reorder) or by tierCode (from package selection)
  const tier = useMemo(
    () =>
      tiers.find((t) => t.id === tierParam) ??
      tiers.find((t) => t.tier === tierParam) ??
      null,
    [tierParam, tiers]
  );

  // Form state
  const [customerType, setCustomerType] = useState<CustomerType>("INDIVIDUAL");
  const [taxName, setTaxName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [taxAddress, setTaxAddress] = useState("");
  const [branchType, setBranchType] = useState<BranchType>("HEAD");
  const [branchNumber, setBranchNumber] = useState("");
  const [hasWht, setHasWht] = useState(false);
  const [saveTaxProfile, setSaveTaxProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Tax ID validation
  const rawTaxId = unformatTaxId(taxId);
  const taxIdValid =
    rawTaxId.length === 13 && validateTaxIdChecksum(rawTaxId);
  const taxIdPartial = rawTaxId.length > 0 && rawTaxId.length < 13;

  // Reset WHT when switching to individual
  useEffect(() => {
    if (customerType === "INDIVIDUAL") setHasWht(false);
  }, [customerType]);

  // Load tax profile — from reorder params or saved profile
  useEffect(() => {
    // Reorder: populate from sessionStorage (sensitive data not in URL)
    if (isReorder) {
      try {
        const stored = sessionStorage.getItem("smsok_reorder");
        if (stored) {
          const data = JSON.parse(stored);
          if (data.customerType) setCustomerType(data.customerType);
          if (data.taxName) setTaxName(data.taxName);
          if (data.taxId) setTaxId(formatTaxId(data.taxId));
          if (data.taxAddress) setTaxAddress(data.taxAddress);
          if (data.branchType) setBranchType(data.branchType);
          if (data.branchNumber) setBranchNumber(data.branchNumber);
          if (data.hasWht) setHasWht(true);
          if (data.saveTaxProfile === false) setSaveTaxProfile(false);
          // Clean up after reading
          sessionStorage.removeItem("smsok_reorder");
        }
      } catch {
        // sessionStorage unavailable or invalid data
      }
      return;
    }

    // Normal: load from saved tax profile
    async function loadTaxProfile() {
      try {
        const res = await fetch("/api/v1/settings/tax-profile");
        if (res.ok) {
          const json = await res.json();
          const tp = json?.data?.taxProfile ?? json?.taxProfile;
          if (tp && tp.companyName) {
            const isIndividual = tp.branch === "INDIVIDUAL";
            setCustomerType(isIndividual ? "INDIVIDUAL" : "COMPANY");
            setTaxName(tp.companyName || "");
            setTaxId(tp.taxId ? formatTaxId(tp.taxId) : "");
            setTaxAddress(tp.address || "");
            if (!isIndividual) {
              const isHq = !tp.branch || tp.branch === "สำนักงานใหญ่";
              setBranchType(isHq ? "HEAD" : "BRANCH");
              if (!isHq && tp.branchCode) setBranchNumber(tp.branchCode);
            }
          }
        }
      } catch {
        // No saved profile
      }
    }
    loadTaxProfile();
  }, [isReorder]);

  // Price breakdown
  const breakdown = useMemo(
    () => (tier ? calculateBreakdown(tier.priceNet, hasWht) : null),
    [tier, hasWht]
  );

  // Form validation
  const isFormValid = useMemo(() => {
    if (taxName.trim().length < 2) return false;
    if (rawTaxId.length !== 13) return false;
    if (taxAddress.trim().length < 10) return false;
    if (branchType === "BRANCH" && branchNumber.length !== 5) return false;
    return true;
  }, [taxName, rawTaxId, taxAddress, branchType, branchNumber]);

  // Track which fields have been touched for inline error display
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const markTouched = (field: string) => setTouched((p) => ({ ...p, [field]: true }));

  // Validation errors per field
  const fieldErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (touched.taxName && taxName.trim().length === 0) errors.taxName = "กรุณากรอกชื่อ";
    else if (touched.taxName && taxName.trim().length < 2) errors.taxName = "ต้องมีอย่างน้อย 2 ตัวอักษร";
    if (touched.taxId && rawTaxId.length > 0 && rawTaxId.length < 13) errors.taxId = `${rawTaxId.length}/13 หลัก`;
    if (touched.taxId && rawTaxId.length === 13 && !taxIdValid) errors.taxId = "เลขไม่ถูกต้อง";
    if (touched.taxAddress && taxAddress.trim().length === 0) errors.taxAddress = "กรุณากรอกที่อยู่";
    else if (touched.taxAddress && taxAddress.trim().length < 10) errors.taxAddress = "ต้องมีอย่างน้อย 10 ตัวอักษร";
    if (touched.branchNumber && branchType === "BRANCH" && branchNumber.length > 0 && branchNumber.length < 5) errors.branchNumber = `${branchNumber.length}/5 หลัก`;
    return errors;
  }, [touched, taxName, rawTaxId, taxIdValid, taxAddress, branchType, branchNumber]);

  // Submit — create order
  async function handleCreateOrder() {
    if (!tier || !breakdown) return;

    // Mark all fields as touched to show errors
    if (!isFormValid) {
      setTouched({ taxName: true, taxId: true, taxAddress: true, branchNumber: true });
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setSubmitting(true);

    try {
      const payload: OrderCreatePayload = {
        package_tier_id: tier.id,
        customer_type: customerType,
        tax_name: taxName.trim(),
        tax_id: rawTaxId,
        tax_address: taxAddress.trim(),
        tax_branch_type: branchType,
        tax_branch_number:
          branchType === "BRANCH" ? branchNumber : undefined,
        has_wht: hasWht,
        save_tax_profile: saveTaxProfile,
      };

      const res = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "ไม่สามารถสร้างคำสั่งซื้อได้");
      }

      const json = await res.json();
      const order = json.data ?? json;
      toast.success("สร้างคำสั่งซื้อสำเร็จ");
      const orderId = String(order.id ?? "");
      if (/^[a-zA-Z0-9_-]+$/.test(orderId)) {
        router.push(`/dashboard/billing/orders/${orderId}`);
      } else {
        router.push("/dashboard/billing");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาด"
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Loading tiers
  if (tiersLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Loader2 size={24} className="mx-auto animate-spin mb-3" style={{ color: "var(--accent)" }} />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>กำลังโหลดข้อมูลแพ็กเกจ...</p>
      </div>
    );
  }

  // No tier found
  if (!tier || !breakdown) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          ไม่พบแพ็กเกจที่เลือก
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/dashboard/billing/packages")}
        >
          <ArrowLeft size={14} />
          กลับไปเลือกแพ็กเกจ
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 lg:pb-8 max-w-6xl animate-fade-in-up">
      {/* Step Indicator */}
      <StepIndicator current={2} />

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-4">
        {/* Left Panel (60%) — Form */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header */}
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              สร้างคำสั่งซื้อ
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              กรอกข้อมูลสำหรับออกเอกสาร
            </p>
          </div>

          {/* Package Summary Card */}
          <div
            className="rounded-lg p-4 flex items-center justify-between"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
            }}
          >
            <div className="flex items-center gap-3">
              <Package size={20} style={{ color: "var(--accent)" }} />
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {tier.name} ({tier.tier}) — {tier.smsCredits.toLocaleString()}{" "}
                  SMS
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  ฿{tier.pricePerSms}/SMS · ฿{formatBaht(tier.priceNet)}
                </p>
              </div>
            </div>
            <button
              className="text-xs font-medium transition-colors"
              style={{ color: "var(--accent)" }}
              onClick={() => router.push("/dashboard/billing/packages")}
            >
              เปลี่ยนแพ็กเกจ
            </button>
          </div>

          {/* Bank Transfer Info Banner */}
          <div
            className="rounded-lg p-4 flex items-start gap-3"
            style={{
              background: "rgba(var(--accent-rgb), 0.04)",
              border: "1px solid rgba(var(--accent-rgb), 0.15)",
            }}
          >
            <Info
              size={18}
              className="shrink-0 mt-0.5"
              style={{ color: "var(--accent)" }}
            />
            <div>
              <p
                className="text-[13px] font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                ชำระเงินผ่านโอนเงินธนาคารเท่านั้น
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                หลังสร้างคำสั่งซื้อ ระบบจะแสดงเลขบัญชีสำหรับโอนเงิน
                กรุณาโอนภายใน 24 ชม. แล้วแนบสลิปเพื่อยืนยันการชำระเงิน
              </p>
            </div>
          </div>

          {/* Customer Type Selector */}
          <div>
            <p
              className="text-sm font-medium mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              ประเภทลูกค้า
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  {
                    type: "INDIVIDUAL" as CustomerType,
                    icon: User,
                    title: "บุคคลธรรมดา",
                    desc: "ใบเสร็จรับเงิน",
                  },
                  {
                    type: "COMPANY" as CustomerType,
                    icon: Building2,
                    title: "นิติบุคคล",
                    desc: "ใบกำกับภาษี + WHT 3%",
                  },
                ] as const
              ).map((opt) => {
                const isSelected = customerType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setCustomerType(opt.type)}
                    className="relative rounded-lg p-5 text-left transition-all"
                    style={{
                      background: isSelected
                        ? "rgba(var(--accent-rgb), 0.02)"
                        : "var(--bg-surface)",
                      border: isSelected
                        ? "2px solid var(--accent)"
                        : "1px solid var(--border-default)",
                    }}
                  >
                    {/* Radio dot */}
                    <div
                      className="absolute top-3 right-3 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{
                        border: isSelected
                          ? "2px solid var(--accent)"
                          : "2px solid var(--border-default)",
                      }}
                    >
                      {isSelected && (
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: "var(--accent)" }}
                        />
                      )}
                    </div>

                    <opt.icon
                      size={24}
                      className="mb-2"
                      style={{
                        color: isSelected
                          ? "var(--accent)"
                          : "var(--text-muted)",
                      }}
                    />
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {opt.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tax Info Form */}
          <div
            className="rounded-lg p-6 space-y-4"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
            }}
          >
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              ข้อมูลออกเอกสาร
            </h3>

            {/* Name */}
            <div>
              <Label
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                {customerType === "COMPANY"
                  ? "ชื่อบริษัท"
                  : "ชื่อ-นามสกุล"}{" "}
                <span style={{ color: "var(--error)" }}>*</span>
              </Label>
              <Input
                value={taxName}
                onChange={(e) => setTaxName(e.target.value)}
                onBlur={() => markTouched("taxName")}
                placeholder={
                  customerType === "COMPANY"
                    ? "บริษัท ABC จำกัด"
                    : "สมชาย กรุงเทพมหานคร"
                }
                className={`mt-1.5 ${fieldErrors.taxName ? "border-[rgba(242,54,69,0.6)]" : ""}`}
              />
              {fieldErrors.taxName && (
                <p className="text-xs mt-1" style={{ color: "var(--error)" }}>{fieldErrors.taxName}</p>
              )}
            </div>

            {/* Tax ID */}
            <div>
              <Label
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                {customerType === "COMPANY"
                  ? "เลขประจำตัวผู้เสียภาษี (Tax ID)"
                  : "เลขบัตรประชาชน"}{" "}
                <span style={{ color: "var(--error)" }}>*</span>
              </Label>
              <Input
                value={taxId}
                onChange={(e) => {
                  const v = e.target.value;
                  const digits = v.replace(/\D/g, "");
                  if (digits.length <= 13) setTaxId(formatTaxId(v));
                }}
                onBlur={() => markTouched("taxId")}
                placeholder="X-XXXX-XXXXX-XX-X"
                className={`mt-1.5 font-mono tracking-wider ${fieldErrors.taxId ? "border-[rgba(242,54,69,0.6)]" : taxIdValid ? "border-[rgba(16,185,129,0.4)]" : ""}`}
              />
              {taxIdValid && (
                <p
                  className="text-xs mt-1 flex items-center gap-1"
                  style={{ color: "var(--success)" }}
                >
                  <Check size={12} /> ถูกต้อง
                </p>
              )}
              {fieldErrors.taxId ? (
                <p className="text-xs mt-1" style={{ color: "var(--error)" }}>
                  {fieldErrors.taxId}
                </p>
              ) : taxIdPartial ? (
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {rawTaxId.length}/13 หลัก
                </p>
              ) : null}
            </div>

            {/* Branch (Company only) */}
            {customerType === "COMPANY" && (
              <div>
                <Label
                  className="text-xs mb-2 block"
                  style={{ color: "var(--text-muted)" }}
                >
                  สาขา <span style={{ color: "var(--error)" }}>*</span>
                </Label>
                <RadioGroup
                  value={branchType}
                  onValueChange={(v) => setBranchType(v as BranchType)}
                  className="flex items-center gap-3"
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="HEAD" />
                    <span
                      className="text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      สำนักงานใหญ่ (00000)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="BRANCH" />
                    <span
                      className="text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      สาขาที่
                    </span>
                  </label>
                  {branchType === "BRANCH" && (
                    <Input
                      value={branchNumber}
                      onChange={(e) =>
                        setBranchNumber(
                          e.target.value.replace(/\D/g, "").slice(0, 5)
                        )
                      }
                      onBlur={() => markTouched("branchNumber")}
                      placeholder="00001"
                      className={`w-24 h-8 font-mono text-center ${fieldErrors.branchNumber ? "border-[rgba(242,54,69,0.6)]" : ""}`}
                    />
                  )}
                </RadioGroup>
              </div>
            )}

            {/* Address */}
            <div>
              <Label
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                {customerType === "COMPANY"
                  ? "ที่อยู่จดทะเบียน"
                  : "ที่อยู่"}{" "}
                <span style={{ color: "var(--error)" }}>*</span>
              </Label>
              <Textarea
                value={taxAddress}
                onChange={(e) => setTaxAddress(e.target.value)}
                onBlur={() => markTouched("taxAddress")}
                placeholder="123/45 ถนนสีลม แขวงสุริยวงศ์ เขตบางรัก กรุงเทพฯ 10500"
                className={`mt-1.5 min-h-[80px] ${fieldErrors.taxAddress ? "border-[rgba(242,54,69,0.6)]" : ""}`}
              />
              {fieldErrors.taxAddress && (
                <p className="text-xs mt-1" style={{ color: "var(--error)" }}>{fieldErrors.taxAddress}</p>
              )}
            </div>
          </div>

          {/* WHT Section (Company only) */}
          {customerType === "COMPANY" && (
            <div
              className="rounded-lg p-5"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
              }}
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={hasWht}
                  onCheckedChange={(v) => setHasWht(!!v)}
                />
                <div>
                  <span
                    className="text-sm font-medium flex items-center gap-1.5"
                    style={{ color: "var(--text-primary)" }}
                  >
                    หักภาษี ณ ที่จ่าย 3%
                    <Popover>
                      <PopoverTrigger
                        className="inline-flex"
                        aria-label="ข้อมูลภาษีหัก ณ ที่จ่าย"
                      >
                        <HelpCircle
                          size={14}
                          className="cursor-help"
                          style={{ color: "var(--text-muted)" }}
                        />
                      </PopoverTrigger>
                      <PopoverContent
                        side="top"
                        sideOffset={8}
                        className="w-80 p-0"
                        style={{
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border-default)",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                        }}
                      >
                        <div className="px-4 pt-3 pb-2">
                          <p
                            className="text-[13px] font-semibold mb-1"
                            style={{ color: "var(--text-primary)" }}
                          >
                            หักภาษี ณ ที่จ่าย (WHT) คืออะไร?
                          </p>
                          <p
                            className="text-xs leading-relaxed"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            นิติบุคคลสามารถหักภาษี ณ ที่จ่าย 3%
                            จากค่าบริการ (ก่อน VAT) ได้ตามกฎหมาย
                            โดยต้องแนบหนังสือรับรองหัก ณ ที่จ่าย (ใบ 50 ทวิ)
                            พร้อมสลิปโอนเงินทุกครั้ง
                          </p>
                        </div>
                        <div
                          className="mx-4 mb-3 mt-1 rounded-md p-3"
                          style={{
                            background: "var(--bg-base)",
                            border: "1px solid var(--border-default)",
                          }}
                        >
                          <p
                            className="text-[11px] font-semibold uppercase tracking-wide mb-2"
                            style={{ color: "var(--text-muted)" }}
                          >
                            ตัวอย่างการคำนวณ
                          </p>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span style={{ color: "var(--text-muted)" }}>ค่าบริการ</span>
                              <span className="font-mono tabular-nums" style={{ color: "var(--text-primary)" }}>฿10,000.00</span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ color: "var(--text-muted)" }}>VAT 7%</span>
                              <span className="font-mono tabular-nums" style={{ color: "var(--text-primary)" }}>฿700.00</span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ color: "var(--error)" }}>หัก WHT 3% (ของ ฿10,000)</span>
                              <span className="font-mono tabular-nums" style={{ color: "var(--error)" }}>-฿300.00</span>
                            </div>
                            <div
                              className="flex justify-between pt-1.5 mt-1"
                              style={{ borderTop: "1px dashed var(--border-default)" }}
                            >
                              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>ยอดโอนจริง</span>
                              <span className="font-mono tabular-nums font-bold" style={{ color: "var(--accent)" }}>฿10,400.00</span>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </span>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    เฉพาะนิติบุคคล — หักจากค่าบริการก่อน VAT ต้องแนบใบ 50 ทวิ
                  </p>
                </div>
              </label>

              {hasWht && (
                <div
                  className="mt-4 p-4 rounded-lg"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between text-[13px]">
                      <span style={{ color: "var(--text-muted)" }}>
                        ค่าบริการ
                      </span>
                      <span
                        className="font-mono tabular-nums"
                        style={{ color: "var(--text-primary)" }}
                      >
                        ฿{formatBaht(breakdown.net)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span style={{ color: "var(--text-muted)" }}>
                        VAT 7%
                      </span>
                      <span
                        className="font-mono tabular-nums"
                        style={{ color: "var(--text-primary)" }}
                      >
                        ฿{formatBaht(breakdown.vat)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span style={{ color: "var(--text-muted)" }}>รวม</span>
                      <span
                        className="font-mono tabular-nums"
                        style={{ color: "var(--text-primary)" }}
                      >
                        ฿{formatBaht(breakdown.total)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span style={{ color: "var(--error)" }}>
                        หัก WHT 3% (ของ ฿{formatBaht(breakdown.net)})
                      </span>
                      <span
                        className="font-mono tabular-nums"
                        style={{ color: "var(--error)" }}
                      >
                        -฿{formatBaht(breakdown.wht)}
                      </span>
                    </div>
                    <div
                      className="flex justify-between pt-2 mt-1"
                      style={{
                        borderTop: "1px dashed var(--border-default)",
                      }}
                    >
                      <span
                        className="text-sm font-bold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        ยอดชำระจริง
                      </span>
                      <span
                        className="text-sm font-bold font-mono tabular-nums"
                        style={{ color: "var(--accent)" }}
                      >
                        ฿{formatBaht(breakdown.netPay)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <AlertTriangle size={12} style={{ color: "var(--warning)" }} />
                    <p className="text-xs" style={{ color: "var(--warning)" }}>
                      ต้องอัพโหลดใบหัก ณ ที่จ่าย (50 ทวิ) ทุกครั้ง
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Save for next */}
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={saveTaxProfile}
              onCheckedChange={(v) => setSaveTaxProfile(!!v)}
            />
            <span
              className="text-[13px] flex items-center gap-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              <Save size={14} />
              บันทึกข้อมูลสำหรับครั้งถัดไป
            </span>
          </label>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard/billing/packages")}
            >
              <ArrowLeft size={14} />
              ย้อนกลับ
            </Button>
            <Button
              onClick={handleCreateOrder}
              disabled={!isFormValid || submitting}
              className="h-11 px-6"
              style={
                isFormValid
                  ? {
                      background: "var(--accent)",
                      color: "var(--bg-base)",
                      borderColor: "var(--accent)",
                    }
                  : undefined
              }
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  กำลังสร้าง...
                </>
              ) : (
                "สร้างคำสั่งซื้อ →"
              )}
            </Button>
          </div>
        </div>

        {/* Right Panel (40%) — Price Summary (Desktop only) */}
        <div className="lg:col-span-2 hidden lg:block">
          <PriceSummaryCard
            tier={tier}
            net={breakdown.net}
            vat={breakdown.vat}
            total={breakdown.total}
            hasWht={hasWht}
            wht={breakdown.wht}
            payAmount={breakdown.netPay}
            customerType={customerType}
          />
        </div>

        {/* Mobile: Sticky bottom bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4 safe-area-bottom" style={{ background: "var(--bg-surface)", borderTop: "1px solid var(--border-default)" }}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>ยอดโอน</p>
              <p className="text-lg font-bold font-mono tabular-nums" style={{ color: "var(--accent)" }}>
                ฿{formatBaht(breakdown.netPay)}
              </p>
            </div>
            <Button
              onClick={handleCreateOrder}
              disabled={submitting}
              className="h-11 px-6 shrink-0"
              style={isFormValid ? { background: "var(--accent)", color: "var(--bg-base)" } : undefined}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  สร้าง...
                </span>
              ) : "สร้างคำสั่งซื้อ →"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
