"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Gift,
  ShieldCheck,
  Landmark,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  type PackageGroup,
  type PackageTier,
  formatBaht,
  COMPARISON_FEATURES,
} from "@/types/purchase";

// ── Helpers ──

function getRecommendedTier(
  volume: number,
  group: PackageGroup,
  allTiers: PackageTier[]
): PackageTier | null {
  const tiers = allTiers.filter((t) => t.group === group).sort(
    (a, b) => a.smsCredits - b.smsCredits
  );
  for (const tier of tiers) {
    if (tier.smsCredits >= volume) return tier;
  }
  return null;
}

function formatValidity(days: number): string {
  if (days >= 365) return "365 วัน";
  if (days >= 180) return "180 วัน";
  if (days >= 90) return "90 วัน";
  return `${days} วัน`;
}

// ── Pricing Card ──

function PricingCard({
  tier,
  isRecommended,
  onSelect,
}: {
  tier: PackageTier;
  isRecommended: boolean;
  onSelect: (tier: PackageTier) => void;
}) {
  const vat = tier.priceNet * 0.07;
  const total = tier.priceNet + vat;

  return (
    <div
      className="relative rounded-lg p-6 transition-all duration-200 group/card flex flex-col"
      style={{
        background: "var(--bg-surface)",
        border: tier.isBestValue
          ? "1px solid var(--accent)"
          : isRecommended
            ? "2px solid var(--accent)"
            : "1px solid var(--border-default)",
        boxShadow: tier.isBestValue
          ? "0 0 24px rgba(var(--accent-rgb), 0.08)"
          : isRecommended
            ? "0 0 20px rgba(var(--accent-rgb), 0.05)"
            : "none",
      }}
    >
      {/* Best Value Badge */}
      {tier.isBestValue && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-3 py-1 rounded-md uppercase tracking-wider"
          style={{
            background: "var(--accent)",
            color: "var(--bg-base)",
          }}
        >
          Best Value
        </span>
      )}

      {/* Recommended indicator */}
      {isRecommended && !tier.isBestValue && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-3 py-1 rounded-md uppercase tracking-wider flex items-center gap-1"
          style={{
            background: "var(--accent)",
            color: "var(--bg-base)",
          }}
        >
          <Sparkles size={12} />
          แนะนำ
        </span>
      )}

      {/* Tier letter */}
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-muted)" }}
      >
        Tier {tier.tier}
      </p>

      {/* Package name */}
      <h3
        className="text-lg font-bold mt-1"
        style={{ color: "var(--text-primary)" }}
      >
        {tier.name}
      </h3>

      {/* SMS count */}
      <div className="mt-4">
        <span
          className="text-[30px] font-extrabold tabular-nums"
          style={{ color: "var(--text-primary)" }}
        >
          {tier.smsCredits.toLocaleString()}
        </span>
        <span
          className="text-sm ml-1"
          style={{ color: "var(--text-muted)" }}
        >
          SMS
        </span>
      </div>

      {/* Bonus */}
      {tier.bonusCredits > 0 && (
        <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "var(--accent)" }}>
          <Gift size={12} />+ {tier.bonusCredits.toLocaleString()} bonus SMS
        </p>
      )}

      {/* Price */}
      <div className="mt-4">
        <span className="text-base" style={{ color: "var(--text-muted)" }}>
          ฿
        </span>
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color: "var(--text-primary)" }}
        >
          {formatBaht(tier.priceNet)}
        </span>
      </div>

      {/* Price per SMS */}
      <p className="text-[13px] mt-0.5" style={{ color: "var(--accent)" }}>
        ฿{tier.pricePerSms.toFixed(2)}/ข้อความ
      </p>

      {/* VAT line */}
      <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>
        VAT 7%: ฿{formatBaht(vat)} · รวม ฿{formatBaht(total)}
      </p>

      {/* Spacer to push button to bottom */}
      <div className="flex-1" />

      {/* CTA Button */}
      <Button
        className="w-full mt-5"
        size="lg"
        onClick={() => onSelect(tier)}
        style={
          tier.isBestValue
            ? {
                background: "var(--accent)",
                color: "var(--bg-base)",
                borderColor: "var(--accent)",
              }
            : undefined
        }
        variant={tier.isBestValue ? "default" : "outline"}
      >
        {tier.isBestValue ? "ซื้อเลย →" : "ซื้อ"}
      </Button>
    </div>
  );
}

// ── Mobile Accordion Card ──

function AccordionCard({
  tier,
  isExpanded,
  isRecommended,
  onToggle,
  onSelect,
}: {
  tier: PackageTier;
  isExpanded: boolean;
  isRecommended: boolean;
  onToggle: () => void;
  onSelect: (tier: PackageTier) => void;
}) {
  const vat = tier.priceNet * 0.07;
  const total = tier.priceNet + vat;

  return (
    <div
      className="rounded-lg overflow-hidden transition-all duration-200"
      style={{
        background: "var(--bg-surface)",
        border: tier.isBestValue
          ? "1px solid var(--accent)"
          : "1px solid var(--border-default)",
      }}
    >
      <button
        className="w-full px-4 py-3 min-h-[44px] flex items-center justify-between text-left"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            {tier.tier}
          </span>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {tier.name}
          </span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {tier.smsCredits.toLocaleString()} SMS
          </span>
          {tier.isBestValue && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: "var(--accent)", color: "var(--bg-base)" }}
            >
              Best
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
            ฿{formatBaht(tier.priceNet)}
          </span>
          <ChevronDown
            size={16}
            className="transition-transform duration-200"
            style={{
              color: "var(--text-muted)",
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div
            className="h-px w-full"
            style={{ background: "var(--border-default)" }}
          />

          <div>
            <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
              ฿{formatBaht(tier.priceNet)}
            </span>
            <span className="text-sm ml-1" style={{ color: "var(--accent)" }}>
              (฿{tier.pricePerSms.toFixed(2)}/SMS)
            </span>
          </div>

          {tier.bonusCredits > 0 && (
            <p className="text-xs flex items-center gap-1" style={{ color: "var(--accent)" }}>
              <Gift size={12} />+ {tier.bonusCredits.toLocaleString()} bonus SMS
            </p>
          )}

          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            VAT 7%: ฿{formatBaht(vat)} · รวม ฿{formatBaht(total)}
          </p>

          <ul className="space-y-1.5">
            {tier.features.map((f) => (
              <li key={f} className="text-xs flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                <span style={{ color: "var(--accent)" }}>✓</span> {f}
              </li>
            ))}
          </ul>

          <Button
            className="w-full"
            size="lg"
            onClick={() => onSelect(tier)}
            style={
              tier.isBestValue
                ? { background: "var(--accent)", color: "var(--bg-base)", borderColor: "var(--accent)" }
                : undefined
            }
            variant={tier.isBestValue ? "default" : "outline"}
          >
            {tier.isBestValue ? "ซื้อเลย →" : "ซื้อ"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Volume Slider Section ──

function VolumeSliderSection({
  group,
  allTiers,
  onSelectTier,
}: {
  group: PackageGroup;
  allTiers: PackageTier[];
  onSelectTier: (tier: PackageTier) => void;
}) {
  const [volume, setVolume] = useState(5000);
  const recommended = useMemo(
    () => getRecommendedTier(volume, group, allTiers),
    [volume, group, allTiers]
  );

  return (
    <div
      className="rounded-lg p-6"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          ต้องการส่ง SMS ประมาณกี่ข้อความ?
        </p>
        <span
          className="text-xl font-bold tabular-nums"
          style={{ color: "var(--text-primary)" }}
        >
          {volume.toLocaleString()}{" "}
          <span className="text-sm font-normal" style={{ color: "var(--text-muted)" }}>
            SMS
          </span>
        </span>
      </div>

      <Slider
        value={[volume]}
        onValueChange={(v) =>
          setVolume(Array.isArray(v) ? v[0] : v)
        }
        min={100}
        max={100000}
        step={100}
        className="my-2"
      />

      {/* Scale labels */}
      <div
        className="flex justify-between text-[11px] mt-2 mb-4"
        style={{ color: "var(--text-muted)" }}
      >
        <span>100</span>
        <span>1K</span>
        <span>5K</span>
        <span>10K</span>
        <span>50K</span>
        <span>100K</span>
      </div>

      {/* Recommendation */}
      <div className="text-[13px]" style={{ color: "var(--text-muted)" }}>
        {recommended ? (
          <p>
            แพ็กเกจแนะนำ:{" "}
            <button
              className="font-semibold hover:underline"
              style={{ color: "var(--accent)" }}
              onClick={() => onSelectTier(recommended)}
            >
              {recommended.name} ({recommended.tier})
            </button>
            {" — "}
            <span style={{ color: "var(--accent)" }}>
              ฿{recommended.pricePerSms.toFixed(2)}/ข้อความ ✅
            </span>
          </p>
        ) : (
          <p>ติดต่อฝ่ายขาย สำหรับแพ็กเกจ Enterprise</p>
        )}
      </div>
    </div>
  );
}

// ── Comparison Table ──

function ComparisonTable({ group, allTiers }: { group: PackageGroup; allTiers: PackageTier[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const tiers = allTiers.filter((t) => t.group === group);

  function getCellValue(tier: PackageTier, key: string): string {
    switch (key) {
      case "smsCredits":
        return tier.smsCredits.toLocaleString();
      case "bonusCredits":
        return tier.bonusCredits > 0
          ? `+${tier.bonusCredits.toLocaleString()}`
          : "—";
      case "senderNames":
        return tier.senderNames === -1
          ? "ไม่จำกัด"
          : String(tier.senderNames);
      case "validity":
        return formatValidity(tier.validity);
      case "pricePerSms":
        return `฿${tier.pricePerSms.toFixed(2)}`;
      case "prioritySupport":
        return tier.senderNames >= 3 ? "✅" : "❌";
      case "dedicatedSupport":
        return tier.senderNames >= 10 ? "✅" : "❌";
      case "sla":
        return tier.senderNames >= 50
          ? tier.senderNames >= 100
            ? "99.99%"
            : "99.9%"
          : "—";
      default:
        return "—";
    }
  }

  return (
    <div className="my-6">
      <button
        className="flex items-center gap-2 text-sm font-medium cursor-pointer transition-colors"
        style={{ color: "var(--accent)" }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <ChevronDown
          size={16}
          className="transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}
        />
        เปรียบเทียบฟีเจอร์ทุกแพ็กเกจ
      </button>

      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: isOpen ? "600px" : "0px" }}
      >
        <div
          className="mt-4 rounded-lg overflow-hidden"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: "var(--bg-base)" }}>
                <th
                  className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Feature
                </th>
                {tiers.map((t) => (
                  <th
                    key={t.tier}
                    className="text-center px-4 py-2.5 text-xs font-semibold uppercase tracking-wider"
                    style={{
                      color: t.isBestValue
                        ? "var(--accent)"
                        : "var(--text-muted)",
                      background: t.isBestValue
                        ? "rgba(var(--accent-rgb), 0.03)"
                        : undefined,
                    }}
                  >
                    {t.tier}{" "}
                    {t.isBestValue && "⭐"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_FEATURES.map((feature) => (
                <tr
                  key={feature.key}
                  style={{ borderBottom: "1px solid var(--border-default)" }}
                >
                  <td
                    className="px-4 py-3"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {feature.label}
                  </td>
                  {tiers.map((t) => {
                    const val = getCellValue(t, feature.key);
                    return (
                      <td
                        key={t.tier}
                        className="text-center px-4 py-3"
                        style={{
                          color:
                            val === "✅"
                              ? "var(--accent)"
                              : val === "❌"
                                ? "var(--text-muted)"
                                : "var(--text-primary)",
                          background: t.isBestValue
                            ? "rgba(var(--accent-rgb), 0.03)"
                            : undefined,
                        }}
                      >
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Trust Signals ──

function TrustSignals() {
  const banks = [
    { name: "SCB", label: "ไทยพาณิชย์" },
    { name: "KBank", label: "กสิกรไทย" },
    { name: "BBL", label: "กรุงเทพ" },
    { name: "BAY", label: "กรุงศรี" },
  ];

  return (
    <div className="mt-8 text-center">
      <div className="flex items-center justify-center gap-6 flex-wrap">
        {banks.map((bank) => (
          <div
            key={bank.name}
            className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity"
          >
            <Landmark size={18} style={{ color: "var(--text-muted)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {bank.label}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5" style={{ color: "var(--accent)" }}>
          <ShieldCheck size={16} />
          <span className="text-xs font-medium">EasySlip</span>
        </div>
      </div>
      <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
        ชำระผ่านโอนเงินธนาคาร · ตรวจสอบสลิปอัตโนมัติ
      </p>
    </div>
  );
}

// ── Floating CTA (Mobile) ──

function FloatingCTA({
  tier,
  onSelect,
}: {
  tier: PackageTier | null;
  onSelect: (tier: PackageTier) => void;
}) {
  if (!tier) return null;
  const total = tier.priceNet * 1.07;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 sm:hidden"
      style={{
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border-default)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {tier.name}
          </p>
          <p className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
            ฿{formatBaht(total)}
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => onSelect(tier)}
          style={{ background: "var(--accent)", color: "var(--bg-base)", borderColor: "var(--accent)" }}
        >
          ซื้อเลย →
        </Button>
      </div>
    </div>
  );
}

// ── Main Page ──

export default function PricingPage() {
  const router = useRouter();
  const [group, setGroup] = useState<PackageGroup>("sme");
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(
    null
  );
  const [selectedMobileTier, setSelectedMobileTier] =
    useState<PackageTier | null>(null);
  const [packageTiers, setPackageTiers] = useState<PackageTier[]>([]);
  const [tiersLoading, setTiersLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/packages")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        const raw = data.data ?? data.packages ?? data.tiers ?? [];
        if (!Array.isArray(raw) || raw.length === 0) {
          setPackageTiers([]);
          return;
        }
        const mapped: PackageTier[] = raw.map((t: Record<string, unknown>, i: number) => {
          const price = Number(t.price ?? 0);
          const smsQuota = Number(t.smsQuota ?? t.smsCredits ?? 0);
          const totalSms = Number(t.totalSms ?? smsQuota);
          const bonusCredits = totalSms - smsQuota;
          const senderLimit = t.senderNameLimit ?? t.senderNames ?? null;
          const expiryMonths = Number(t.expiryMonths ?? 12);
          return {
            id: (t.id as string) ?? `tier-${i}`,
            tier: (t.tierCode as string) ?? (t.tier as string) ?? String.fromCharCode(65 + i),
            name: (t.name as string) ?? `Tier ${String.fromCharCode(65 + i)}`,
            group: (t.group as PackageGroup) ?? (price >= 100000 ? "enterprise" : "sme"),
            smsCredits: smsQuota,
            bonusCredits,
            priceNet: price,
            pricePerSms: totalSms > 0 ? Math.round((price / totalSms) * 100) / 100 : 0,
            features: (t.features as string[]) ?? [],
            isBestValue: (t.isBestValue as boolean) ?? i === 2,
            senderNames: senderLimit === null ? -1 : Number(senderLimit),
            validity: expiryMonths * 30,
          };
        });
        setPackageTiers(mapped);
      })
      .catch(() => setPackageTiers([]))
      .finally(() => setTiersLoading(false));
  }, []);

  const tiers = useMemo(
    () => packageTiers.filter((t) => t.group === group),
    [group, packageTiers]
  );

  const handleSelect = useCallback(
    (tier: PackageTier) => {
      router.push(`/dashboard/billing/checkout?tier=${tier.tier}`);
    },
    [router]
  );

  const handleAccordionToggle = useCallback(
    (tierId: string) => {
      const newExpanded = expandedAccordion === tierId ? null : tierId;
      setExpandedAccordion(newExpanded);
      if (newExpanded) {
        const tier = packageTiers.find((t) => t.id === tierId) ?? null;
        setSelectedMobileTier(tier);
      } else {
        setSelectedMobileTier(null);
      }
    },
    [expandedAccordion, packageTiers]
  );

  if (tiersLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div
          className="w-6 h-6 border-2 rounded-full animate-spin mx-auto mb-3"
          style={{ borderColor: "var(--border-default)", borderTopColor: "var(--accent)" }}
        />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          กำลังโหลดแพ็กเกจ...
        </p>
      </div>
    );
  }

  if (packageTiers.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
          style={{
            background: "rgba(var(--accent-rgb),0.08)",
            border: "1px solid rgba(var(--accent-rgb),0.15)",
          }}
        >
          <Sparkles size={28} style={{ color: "var(--accent)" }} />
        </div>
        <h3
          className="text-lg font-semibold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          กำลังเตรียมแพ็กเกจ
        </h3>
        <p
          className="text-sm max-w-sm mx-auto mb-6"
          style={{ color: "var(--text-muted)" }}
        >
          ระบบกำลังเตรียมแพ็กเกจ SMS สำหรับคุณ กรุณารอสักครู่แล้วลองใหม่อีกครั้ง
        </p>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
          style={{ background: "var(--accent)", color: "var(--bg-base)" }}
          onClick={() => window.location.reload()}
        >
          โหลดใหม่
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 sm:pb-8">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          เลือกแพ็กเกจ SMS
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
          เลือกแพ็กเกจที่เหมาะกับธุรกิจของคุณ
        </p>
      </div>

      {/* Segment Toggle */}
      <div className="mb-8">
        <Tabs
          className="items-start"
          value={group}
          onValueChange={(v) => {
            if (v === "sme" || v === "enterprise") {
              setGroup(v);
              setExpandedAccordion(null);
              setSelectedMobileTier(null);
            }
          }}
        >
          <TabsList
            className="rounded-lg"
            style={{
              height: 40,
              padding: 4,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
            }}
          >
            <TabsTrigger
              value="sme"
              className="px-6 rounded-md text-[13px] font-medium transition-all"
              style={{
                height: 32,
                color:
                  group === "sme"
                    ? "var(--accent)"
                    : "var(--text-muted)",
                background:
                  group === "sme" ? "var(--bg-base)" : "transparent",
                borderColor: "transparent",
              }}
            >
              SME (A-D)
            </TabsTrigger>
            <TabsTrigger
              value="enterprise"
              className="px-6 rounded-md text-[13px] font-medium transition-all"
              style={{
                height: 32,
                color:
                  group === "enterprise"
                    ? "var(--accent)"
                    : "var(--text-muted)",
                background:
                  group === "enterprise"
                    ? "var(--bg-base)"
                    : "transparent",
                borderColor: "transparent",
              }}
            >
              Enterprise (E-H)
            </TabsTrigger>
          </TabsList>

          {/* Desktop Cards */}
          <TabsContent value={group}>
            {/* Desktop: 4-col grid */}
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {tiers.map((tier) => (
                <PricingCard
                  key={tier.id}
                  tier={tier}
                  isRecommended={false}
                  onSelect={handleSelect}
                />
              ))}
            </div>

            {/* Mobile: Accordion */}
            <div className="sm:hidden space-y-2 mt-6">
              {tiers.map((tier) => (
                <AccordionCard
                  key={tier.id}
                  tier={tier}
                  isExpanded={expandedAccordion === tier.id}
                  isRecommended={false}
                  onToggle={() => handleAccordionToggle(tier.id)}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Volume Slider */}
      <VolumeSliderSection group={group} allTiers={packageTiers} onSelectTier={handleSelect} />

      {/* Comparison Table */}
      <ComparisonTable group={group} allTiers={packageTiers} />

      {/* Trust Signals */}
      <TrustSignals />

      {/* Mobile Floating CTA */}
      <FloatingCTA tier={selectedMobileTier} onSelect={handleSelect} />
    </div>
  );
}
