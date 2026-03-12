"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Check, X, Gift, Ticket, ChevronDown, ChevronUp, Users, Clock, RotateCcw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/* ─── Package Data ─── */

interface Package {
  tier: string
  name: string
  sms: number
  price: number
  bonusPercent: number
  senders: number | null // null = unlimited
  expiryMonths: number
  refund: boolean
  popular?: boolean
}

const PACKAGES: Package[] = [
  { tier: "A", name: "Starter",      sms: 500,       price: 500,       bonusPercent: 0,  senders: 5,    expiryMonths: 6,  refund: false },
  { tier: "B", name: "Basic",        sms: 1_100,     price: 1_000,     bonusPercent: 10, senders: 10,   expiryMonths: 12, refund: false, popular: true },
  { tier: "C", name: "Growth",       sms: 11_500,    price: 10_000,    bonusPercent: 15, senders: 15,   expiryMonths: 24, refund: false },
  { tier: "D", name: "Business",     sms: 60_000,    price: 50_000,    bonusPercent: 20, senders: 20,   expiryMonths: 24, refund: true },
  { tier: "E", name: "Professional", sms: 125_000,   price: 100_000,   bonusPercent: 25, senders: null, expiryMonths: 36, refund: true },
  { tier: "F", name: "Enterprise",   sms: 390_000,   price: 300_000,   bonusPercent: 30, senders: null, expiryMonths: 36, refund: true },
  { tier: "G", name: "Corporate",    sms: 700_000,   price: 500_000,   bonusPercent: 40, senders: null, expiryMonths: 36, refund: true },
  { tier: "H", name: "Unlimited",    sms: 1_500_000, price: 1_000_000, bonusPercent: 50, senders: null, expiryMonths: 36, refund: true },
]

const TOP_PACKAGES = PACKAGES.slice(0, 3)
const BOTTOM_PACKAGES = PACKAGES.slice(3)

/* ─── Helpers ─── */

function formatNumber(n: number): string {
  return n.toLocaleString("th-TH")
}

function formatCurrency(n: number): string {
  return `฿${n.toLocaleString("th-TH")}`
}

function perSms(pkg: Package): string {
  return (pkg.price / pkg.sms).toFixed(2)
}

/* ─── Card Component ─── */

function PackageCard({ pkg, compact = false }: { pkg: Package; compact?: boolean }) {
  const router = useRouter()

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-lg border p-7 transition-all duration-200 hover:-translate-y-0.5 bg-[var(--bg-surface)]",
        pkg.popular
          ? "border-[rgba(var(--accent-rgb),0.3)] shadow-[0_0_24px_rgba(var(--accent-rgb),0.06)] hover:border-[rgba(var(--accent-rgb),0.5)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_20px_rgba(var(--accent-rgb),0.05)]"
          : "border-[var(--border-default)] hover:border-[rgba(var(--accent-rgb),0.2)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_20px_rgba(var(--accent-rgb),0.05)]",
      )}
    >
      {/* Popular Badge */}
      {pkg.popular && (
        <div className="absolute -top-3 right-4 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider bg-[var(--accent)] text-[var(--text-on-accent)]">
          Popular
        </div>
      )}

      {/* Tier Label */}
      <span className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
        Package {pkg.tier}
      </span>

      {/* Name */}
      <h3 className={cn("font-bold text-[var(--text-primary)]", compact ? "text-lg" : "text-xl")}>
        {pkg.name}
      </h3>

      {/* SMS Count */}
      <div className="mt-3">
        <span className={cn("font-bold tabular-nums text-[var(--text-primary)]", compact ? "text-3xl" : "text-4xl")}>
          {formatNumber(pkg.sms)}
        </span>
        <span className="ml-1.5 text-sm font-medium text-[var(--text-muted)]">
          SMS
        </span>
      </div>

      {/* Bonus Badge */}
      {pkg.bonusPercent > 0 && (
        <div className="mt-2 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] border border-[rgba(var(--accent-rgb),0.2)]">
          <Sparkles className="size-3" />
          +{pkg.bonusPercent}% Bonus
        </div>
      )}

      {/* Price */}
      <div className="mt-4">
        <span className={cn("font-bold text-[var(--accent)]", compact ? "text-2xl" : "text-3xl")}>
          {formatCurrency(pkg.price)}
        </span>
      </div>

      {/* Per SMS */}
      <span className="mt-1 text-xs text-[var(--text-muted)]">
        ฿{perSms(pkg)} ต่อ SMS
      </span>

      {/* Divider */}
      <div className="my-4 h-px w-full bg-[var(--border-default)]" />

      {/* Features */}
      <ul className="flex flex-col gap-2.5 text-sm text-[var(--text-secondary)]">
        <li className="flex items-center gap-2">
          <Users className="size-3.5 shrink-0 text-[var(--text-muted)]" />
          <span>
            {pkg.senders === null ? (
              <span className="text-[var(--accent)]">Sender Names ไม่จำกัด</span>
            ) : (
              <>{pkg.senders} Sender Names</>
            )}
          </span>
        </li>
        <li className="flex items-center gap-2">
          <Clock className="size-3.5 shrink-0 text-[var(--text-muted)]" />
          <span>อายุ {pkg.expiryMonths} เดือน</span>
        </li>
        <li className="flex items-center gap-2">
          <RotateCcw className="size-3.5 shrink-0 text-[var(--text-muted)]" />
          <span>
            {pkg.refund ? (
              <span className="text-[var(--accent)]">
                <Check className="mr-1 inline size-3" />
                Delivery-Failure Refund
              </span>
            ) : (
              <span className="text-[var(--text-muted)] opacity-50">ไม่มี Refund</span>
            )}
          </span>
        </li>
      </ul>

      {/* CTA */}
      <Button
        className={cn(
          "mt-6 w-full cursor-pointer font-semibold",
          pkg.popular
            ? "bg-[var(--accent)] text-[var(--text-on-accent)] shadow-[0_0_16px_rgba(var(--accent-rgb),0.3)] hover:opacity-90"
            : "bg-transparent text-[var(--accent)] border border-[rgba(var(--accent-rgb),0.3)] hover:bg-[rgba(var(--accent-rgb),0.08)]",
        )}
        size="lg"
        onClick={() => router.push(`/dashboard/billing/checkout?packageId=${pkg.tier}`)}
      >
        เลือกแพ็กเกจนี้
      </Button>
    </div>
  )
}

/* ─── Comparison Table ─── */

function ComparisonTable() {
  const rows: { label: string; getValue: (pkg: Package) => string }[] = [
    { label: "SMS", getValue: (p) => formatNumber(p.sms) },
    { label: "ราคา", getValue: (p) => formatCurrency(p.price) },
    { label: "ต่อ/SMS", getValue: (p) => `฿${perSms(p)}` },
    { label: "Sender Names", getValue: (p) => (p.senders === null ? "ไม่จำกัด" : `${p.senders}`) },
    { label: "อายุ", getValue: (p) => `${p.expiryMonths} เดือน` },
    { label: "Bonus", getValue: (p) => (p.bonusPercent > 0 ? `+${p.bonusPercent}%` : "—") },
    { label: "Refund", getValue: (p) => (p.refund ? "✓" : "—") },
  ]

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border-default)]">
      <table className="w-full min-w-[700px] border-collapse text-sm">
        <thead>
          <tr className="bg-[var(--table-header)]">
            <th className="sticky left-0 z-10 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider bg-[var(--table-header)] text-[var(--text-body)]">
              เปรียบเทียบ
            </th>
            {PACKAGES.map((pkg) => (
              <th
                key={pkg.tier}
                className={cn(
                  "px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider bg-[var(--table-header)]",
                  pkg.popular ? "text-[var(--accent)]" : "text-[var(--text-body)]",
                )}
              >
                {pkg.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.label}
              className={cn(
                "border-b border-[var(--border-default)]",
                i % 2 === 0 ? "bg-[var(--table-alt-row)]" : "bg-[var(--bg-surface)]",
              )}
            >
              <td
                className={cn(
                  "sticky left-0 z-10 px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]",
                  i % 2 === 0 ? "bg-[var(--table-alt-row)]" : "bg-[var(--bg-surface)]",
                )}
              >
                {row.label}
              </td>
              {PACKAGES.map((pkg) => {
                const val = row.getValue(pkg)
                const isAccent = row.label === "Refund" && val === "✓"
                return (
                  <td
                    key={pkg.tier}
                    className={cn(
                      "px-3 py-3 text-center tabular-nums",
                      isAccent ? "text-[var(--accent)]" : "text-[var(--text-primary)]",
                      pkg.popular && "bg-[rgba(var(--accent-rgb),0.03)]",
                      pkg.popular && "border-x border-[rgba(var(--accent-rgb),0.15)]",
                    )}
                  >
                    {val}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─── Main Page ─── */

type CouponStatus = "idle" | "validating" | "valid" | "invalid"

export default function PackagesPage() {
  const [couponCode, setCouponCode] = useState("")
  const [couponStatus, setCouponStatus] = useState<CouponStatus>("idle")
  const [couponDiscount, setCouponDiscount] = useState("")
  const [showComparison, setShowComparison] = useState(false)

  function handleApplyCoupon() {
    if (!couponCode.trim()) return
    setCouponStatus("validating")
    // Simulate coupon validation
    setTimeout(() => {
      const code = couponCode.trim().toUpperCase()
      if (code === "SMSOK50" || code === "WELCOME10") {
        setCouponStatus("valid")
        setCouponDiscount(code === "SMSOK50" ? "50%" : "10%")
      } else {
        setCouponStatus("invalid")
        setCouponDiscount("")
      }
    }, 1200)
  }

  function handleRemoveCoupon() {
    setCouponCode("")
    setCouponStatus("idle")
    setCouponDiscount("")
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm transition-colors text-[var(--text-secondary)] hover:opacity-80"
        >
          <ArrowLeft className="size-4" />
          กลับหน้าหลัก
        </Link>

        {/* ═══ Header ═══ */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
            เลือกแพ็กเกจ SMS ที่เหมาะกับคุณ
          </h1>
          <p className="mt-2 text-base text-[var(--text-secondary)]">
            ส่ง SMS ได้ทันที หลังชำระเงิน
          </p>

          {/* Trial Badge */}
          <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium bg-[rgba(var(--accent-purple-rgb),0.12)] border border-[rgba(var(--accent-purple-rgb),0.25)] text-[var(--accent-purple)]">
            <Gift className="size-4 text-[var(--accent-purple)]" />
            สมัครฟรี! ทดลองส่ง 500 SMS ไม่เสียค่าใช้จ่าย
          </div>
        </div>

        {/* ═══ Top 3 Packages (A, B, C) ═══ */}
        <div className="stagger-children mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TOP_PACKAGES.map((pkg) => (
            <PackageCard key={pkg.tier} pkg={pkg} />
          ))}
        </div>

        {/* ═══ Bottom 5 Packages (D–H) ═══ */}
        <div className="stagger-children grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BOTTOM_PACKAGES.map((pkg) => (
            <PackageCard key={pkg.tier} pkg={pkg} compact />
          ))}
        </div>

        {/* ═══ Coupon Section ═══ */}
        <div className="mx-auto mt-12 max-w-md rounded-lg border p-6 bg-[var(--bg-surface)] border-[var(--border-default)]">
          <label className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
            <Ticket className="size-4 text-[var(--accent)]" />
            มีคูปอง?
          </label>

          {couponStatus === "valid" && couponDiscount ? (
            /* Applied state */
            <div className="flex items-center justify-between rounded-lg px-4 py-3 bg-[rgba(var(--accent-rgb),0.08)] border border-[rgba(var(--accent-rgb),0.2)]">
              <div className="flex items-center gap-2">
                <Check className="size-4 text-[var(--accent)]" />
                <span className="text-sm font-medium text-[var(--accent)]">
                  {couponCode.toUpperCase()} — ลด {couponDiscount}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="rounded-full p-1 transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                aria-label="ลบคูปอง"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            /* Input state */
            <div className="flex gap-2">
              <Input
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase())
                  if (couponStatus === "invalid") setCouponStatus("idle")
                }}
                placeholder="กรอกรหัสคูปอง"
                className={cn(
                  "h-10 flex-1 uppercase font-mono tracking-wider bg-transparent text-[var(--text-primary)]",
                  couponStatus === "invalid"
                    ? "border-[var(--error)]"
                    : "border-[var(--border-default)]",
                )}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleApplyCoupon()
                }}
                disabled={couponStatus === "validating"}
              />
              <Button
                className="h-10 cursor-pointer px-4 font-semibold bg-[var(--accent)] text-[var(--text-on-accent)] hover:opacity-90"
                onClick={handleApplyCoupon}
                disabled={couponStatus === "validating" || !couponCode.trim()}
              >
                {couponStatus === "validating" ? (
                  <span className="flex items-center gap-2">
                    <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ตรวจสอบ...
                  </span>
                ) : (
                  "ใช้คูปอง"
                )}
              </Button>
            </div>
          )}

          {/* Error message */}
          {couponStatus === "invalid" && (
            <p className="mt-2 text-xs text-[var(--error)]">
              คูปองไม่ถูกต้องหรือหมดอายุแล้ว
            </p>
          )}
        </div>

        {/* ═══ Comparison Toggle ═══ */}
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={() => setShowComparison(!showComparison)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-all cursor-pointer text-[var(--accent)] border border-[rgba(var(--accent-rgb),0.25)]",
              showComparison && "bg-[rgba(var(--accent-rgb),0.1)]",
            )}
          >
            {showComparison ? (
              <>
                <ChevronUp className="size-4" />
                รายเดือน
              </>
            ) : (
              <>
                <ChevronDown className="size-4" />
                เปรียบเทียบทั้งหมด
              </>
            )}
          </button>
        </div>

        {/* ═══ Comparison Table ═══ */}
        {showComparison && (
          <div className="animate-fade-in-up mt-6">
            <ComparisonTable />
          </div>
        )}

        {/* ═══ Footer Notes ═══ */}
        <div className="mt-12 space-y-1 pb-8 text-center text-xs text-[var(--text-muted)] opacity-60">
          <p>* ราคาไม่รวม VAT 7%</p>
          <p>* Delivery-Failure Refund สำหรับ Package D ขึ้นไป</p>
        </div>
      </div>
    </div>
  )
}
