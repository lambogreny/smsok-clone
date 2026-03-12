"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  Upload,
  ImageIcon,
  X,
  Loader2,
  Hourglass,
  Building2,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// ─── Types ────────────────────────────────────────────────────────────────────

interface SmsPackage {
  id: string
  sms: number
  price: number
  perSms: number
  badge?: string
}

interface BankAccount {
  bank: string
  accountNumber: string
  accountName: string
  accountType: string
  branch: string
}

// ─── Fallback data (used if API fails) ─────────────────────────────────────

const FALLBACK_PACKAGES: SmsPackage[] = [
  { id: "pkg-500", sms: 500, price: 350, perSms: 0.7 },
  { id: "pkg-1000", sms: 1_000, price: 650, perSms: 0.65, badge: "BEST" },
  { id: "pkg-2000", sms: 2_000, price: 1_200, perSms: 0.6 },
  { id: "pkg-5000", sms: 5_000, price: 2_500, perSms: 0.5 },
]

const FALLBACK_BANK: BankAccount = {
  bank: "ธนาคารกสิกรไทย (KBank)",
  accountNumber: "123-4-56789-0",
  accountName: "บริษัท เอสเอ็มเอสโอเค จำกัด",
  accountType: "ออมทรัพย์",
  branch: "สำนักงานใหญ่",
}

const VAT_RATE = 0.07
const CUSTOM_PER_SMS = 0.7
const CUSTOM_MIN = 100

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  return n.toLocaleString("th-TH")
}

function formatPrice(n: number): string {
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function getCurrentDate(): string {
  const now = new Date()
  return now.toISOString().split("T")[0]
}

function getCurrentTime(): string {
  const now = new Date()
  const m = Math.round(now.getMinutes() / 5) * 5
  return `${String(now.getHours()).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
}

// ─── Step Indicator ─────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { num: 1, label: "เลือกแพ็กเกจ" },
    { num: 2, label: "โอนเงิน" },
    { num: 3, label: "แนบสลิป" },
  ]

  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((s, i) => {
        const isCompleted = s.num < current
        const isActive = s.num === current
        const isPending = s.num > current

        return (
          <div key={s.num} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="flex items-center justify-center rounded-full text-sm font-bold transition-all"
                style={{
                  width: 32,
                  height: 32,
                  background: isCompleted || isActive ? "var(--accent)" : "transparent",
                  color: isCompleted || isActive ? "var(--text-on-accent)" : "var(--text-muted)",
                  border: isPending ? "1px solid var(--border-default)" : "none",
                }}
              >
                {isCompleted ? <Check size={16} strokeWidth={3} /> : s.num}
              </div>
              <span
                className="text-[11px] font-medium whitespace-nowrap"
                style={{
                  color: isActive ? "var(--accent)" : isCompleted ? "var(--text-secondary)" : "var(--text-muted)",
                }}
              >
                {s.label}
              </span>
            </div>

            {/* Connector */}
            {i < steps.length - 1 && (
              <div
                className="mx-2 mb-5"
                style={{
                  width: 48,
                  height: 2,
                  background: s.num < current ? "var(--accent)" : "var(--border-default)",
                  borderRadius: 1,
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Package Card ──────────────────────────────────────────────────────────

function PackageCard({
  pkg,
  selected,
  onSelect,
}: {
  pkg: SmsPackage
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="relative flex flex-col items-center gap-1 rounded-xl p-6 text-center transition-all cursor-pointer"
      style={{
        background: selected ? "rgba(var(--accent-rgb),0.04)" : "var(--bg-surface)",
        border: selected ? "2px solid var(--accent)" : "1px solid var(--border-default)",
        boxShadow: selected ? "0 0 0 3px rgba(var(--accent-rgb),0.1)" : undefined,
      }}
    >
      {pkg.badge && (
        <span
          className="absolute -top-2 -right-2 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase"
          style={{ background: "var(--accent)", color: "var(--text-on-accent)" }}
        >
          {pkg.badge}
        </span>
      )}

      {selected && (
        <CheckCircle2
          size={16}
          className="absolute top-2.5 right-2.5"
          style={{ color: "var(--accent)" }}
        />
      )}

      <span className="text-[28px] font-bold leading-none" style={{ color: "var(--text-primary)" }}>
        {formatNumber(pkg.sms)}
      </span>
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>SMS</span>
      <span className="mt-3 text-lg font-semibold" style={{ color: "var(--accent)" }}>
        ฿{formatNumber(pkg.price)}
      </span>
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
        ฿{pkg.perSms.toFixed(2)}/SMS
      </span>
    </button>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function TopupWizardPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Data from API
  const [packages, setPackages] = useState<SmsPackage[]>(FALLBACK_PACKAGES)
  const [bankAccount, setBankAccount] = useState<BankAccount>(FALLBACK_BANK)

  // Step state
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Step 1: Package selection
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>("pkg-1000")
  const [customAmount, setCustomAmount] = useState("")

  // Step 2: Copy
  const [copied, setCopied] = useState(false)

  // Step 3: Slip upload
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const [slipPreview, setSlipPreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [transferAmount, setTransferAmount] = useState("")
  const [transferDate, setTransferDate] = useState("")
  const [transferTime, setTransferTime] = useState("")

  // Defer date/time to client to avoid hydration mismatch
  useEffect(() => {
    setTransferDate(getCurrentDate())
    setTransferTime(getCurrentTime())
  }, [])
  const [note, setNote] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [txnId, setTxnId] = useState("")

  // ─── Fetch packages + bank from API ──────────────────────────

  useEffect(() => {
    async function fetchData() {
      try {
        const [pkgRes, bankRes] = await Promise.all([
          fetch("/api/v1/payments/packages"),
          fetch("/api/v1/payments/bank-accounts"),
        ])
        if (pkgRes.ok) {
          const data = await pkgRes.json()
          if (Array.isArray(data.packages) && data.packages.length > 0) {
            setPackages(data.packages)
          }
        }
        if (bankRes.ok) {
          const data = await bankRes.json()
          if (data.account) {
            setBankAccount(data.account)
          }
        }
      } catch {
        // Use fallback data
      }
    }
    fetchData()
  }, [])

  // ─── Derived values ──────────────────────────────────────────

  const selectedPkg = packages.find((p) => p.id === selectedPkgId) ?? null
  const customSmsCount = parseInt(customAmount, 10)
  const isCustomActive =
    !selectedPkgId && !Number.isNaN(customSmsCount) && customSmsCount >= CUSTOM_MIN

  const smsQty = selectedPkg ? selectedPkg.sms : isCustomActive ? customSmsCount : 0
  const subtotal = selectedPkg
    ? selectedPkg.price
    : isCustomActive
      ? customSmsCount * CUSTOM_PER_SMS
      : 0
  const vat = Math.round(subtotal * VAT_RATE * 100) / 100
  const total = subtotal + vat

  // ─── Handlers ────────────────────────────────────────────────

  function handlePackageSelect(id: string) {
    setSelectedPkgId(id)
    setCustomAmount("")
  }

  function handleCustomChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCustomAmount(e.target.value)
    if (e.target.value !== "") setSelectedPkgId(null)
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text.replace(/-/g, ""))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setErrorMessage("รองรับเฉพาะ JPG, PNG, PDF เท่านั้น")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("ไฟล์ต้องมีขนาดไม่เกิน 10MB")
      return
    }
    setErrorMessage("")
    setSlipFile(file)
    if (file.type.startsWith("image/")) {
      setSlipPreview(URL.createObjectURL(file))
    } else {
      setSlipPreview(null)
    }
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function removeSlip() {
    setSlipFile(null)
    if (slipPreview) URL.revokeObjectURL(slipPreview)
    setSlipPreview(null)
    setErrorMessage("")
  }

  function goToStep2() {
    if (smsQty === 0) return
    setTransferAmount(formatPrice(total))
    setStep(2)
  }

  function goToStep3() {
    setStep(3)
  }

  async function handleSubmit() {
    if (!slipFile) {
      setErrorMessage("กรุณาอัปโหลดสลิปก่อน")
      return
    }
    if (!transferAmount || Number(transferAmount.replace(/,/g, "")) < 100) {
      setErrorMessage("กรุณากรอกจำนวนเงินที่โอน")
      return
    }
    if (!transferDate || !transferTime) {
      setErrorMessage("กรุณากรอกวันที่และเวลาที่โอน")
      return
    }

    setSubmitting(true)
    setErrorMessage("")

    try {
      // Upload slip
      const formData = new FormData()
      formData.append("slip", slipFile)
      formData.append("credits", String(smsQty))
      formData.append("amount", transferAmount.replace(/,/g, ""))
      formData.append("date", transferDate)
      formData.append("time", transferTime)
      if (note) formData.append("note", note)

      const uploadRes = await fetch("/api/v1/payments/topup/verify-slip", {
        method: "POST",
        body: formData,
      })

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}))
        throw new Error(err.message || "อัปโหลดสลิปไม่สำเร็จ")
      }

      const { slipId } = await uploadRes.json()

      // Purchase
      const purchaseRes = await fetch("/api/v1/payments/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slipId,
          credits: smsQty,
          amount: Number(transferAmount.replace(/,/g, "")),
        }),
      })

      if (!purchaseRes.ok) {
        const err = await purchaseRes.json().catch(() => ({}))
        throw new Error(err.message || "ส่งหลักฐานไม่สำเร็จ")
      }

      const result = await purchaseRes.json()
      setTxnId(result.transactionId || `TXN-${Date.now()}`)
      setSubmitted(true)
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่"
      )
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Submission Confirmation Screen ──────────────────────────

  if (submitted) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-16">
        <div className="flex flex-col items-center text-center gap-6">
          {/* Hourglass circle */}
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 80,
              height: 80,
              background: "var(--warning-bg)",
              border: "1px solid rgba(var(--warning-rgb),0.15)",
              animation: "scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <Hourglass size={36} style={{ color: "var(--warning)" }} />
          </div>

          <h1 className="text-[22px] font-bold" style={{ color: "var(--text-primary)" }}>
            ส่งหลักฐานสำเร็จ!
          </h1>

          <div
            className="inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 font-mono text-base font-semibold"
            style={{
              background: "rgba(var(--accent-rgb),0.06)",
              color: "var(--accent)",
            }}
          >
            {txnId}
          </div>

          <div className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            <p>กำลังตรวจสอบ...</p>
            <p>ปกติใช้เวลา 15-30 นาที</p>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
            <Button
              className="w-full font-semibold"
              style={{ background: "var(--accent)", color: "var(--text-on-accent)" }}
              onClick={() => router.push("/dashboard/billing")}
            >
              ดูสถานะ <ArrowRight size={16} />
            </Button>
            <button
              type="button"
              className="text-sm transition-colors cursor-pointer"
              style={{ color: "var(--text-muted)" }}
              onClick={() => router.push("/dashboard")}
            >
              กลับหน้า Dashboard
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes scale-in {
            from { transform: scale(0); }
            to { transform: scale(1); }
          }
        `}</style>
      </main>
    )
  }

  // ─── Wizard UI ────────────────────────────────────────────────

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard/packages"
          className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70 rounded-md"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={16} />
          <span>กลับ</span>
        </Link>
        <span style={{ color: "var(--border-default)" }}>/</span>
        <div className="flex items-center gap-2">
          <Zap size={20} style={{ color: "var(--accent)" }} />
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            ซื้อแพ็กเกจ SMS
          </h1>
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator current={step} />

      {/* ═══════════ STEP 1: เลือกแพ็กเกจ ═══════════ */}
      {step === 1 && (
        <div className="flex flex-col gap-6">
          {/* Package grid */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                selected={selectedPkgId === pkg.id}
                onSelect={() => handlePackageSelect(pkg.id)}
              />
            ))}
          </div>

          {/* Custom amount */}
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
          >
            <p className="text-[13px] mb-2" style={{ color: "var(--text-muted)" }}>
              หรือ กรอกจำนวนเอง:
            </p>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  ฿
                </span>
                <Input
                  type="number"
                  min={CUSTOM_MIN}
                  step={100}
                  placeholder="เช่น 1500"
                  value={customAmount}
                  onChange={handleCustomChange}
                  className="pl-7 h-11"
                />
              </div>
              {isCustomActive && (
                <span className="text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                  ≈ {formatNumber(customSmsCount)} SMS
                </span>
              )}
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
              ขั้นต่ำ ฿{formatNumber(CUSTOM_MIN)}
            </p>
          </div>

          {/* Summary bar + Next */}
          <div
            className="rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
          >
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {smsQty > 0 ? (
                <>
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {formatNumber(smsQty)} SMS
                  </span>
                  {" • "}฿{formatPrice(total)} (รวม VAT 7%)
                </>
              ) : (
                "เลือกแพ็กเกจหรือกรอกจำนวน SMS"
              )}
            </div>
            <Button
              disabled={smsQty === 0}
              onClick={goToStep2}
              className="font-semibold gap-2" size="lg"
              style={{
                background: smsQty > 0 ? "var(--accent)" : "var(--bg-surface)",
                color: smsQty > 0 ? "var(--text-on-accent)" : "var(--text-muted)",
              }}
            >
              ถัดไป — ดูข้อมูลบัญชี <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* ═══════════ STEP 2: ข้อมูลบัญชีธนาคาร ═══════════ */}
      {step === 2 && (
        <div className="flex flex-col gap-6">
          {/* Title */}
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              โอนเงินไปที่บัญชีด้านล่าง
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              จำนวน{" "}
              <span className="font-semibold" style={{ color: "var(--accent)" }}>
                ฿{formatPrice(total)}
              </span>
            </p>
          </div>

          {/* Bank Account Card */}
          <div
            className="rounded-lg p-7"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
          >
            {/* Bank name */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: "var(--text-primary)" }}
              >
                <Building2 size={20} style={{ color: "var(--bg-base)" }} />
              </div>
              <span className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                {bankAccount.bank}
              </span>
            </div>

            {/* Account name */}
            <div className="mb-4">
              <span
                className="text-xs uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                ชื่อบัญชี
              </span>
              <p className="text-[15px] font-semibold mt-1" style={{ color: "var(--text-primary)" }}>
                {bankAccount.accountName}
              </p>
            </div>

            {/* Account number with copy */}
            <div className="mb-3">
              <span
                className="text-xs uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                เลขที่บัญชี
              </span>
            </div>
            <div
              className="flex items-center justify-between rounded-md px-4 py-3.5"
              style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
            >
              <span
                className="font-mono text-[22px] font-bold tracking-wider tabular-nums"
                style={{ color: "var(--text-primary)" }}
              >
                {bankAccount.accountNumber}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(bankAccount.accountNumber)}
                className="p-2 rounded-lg transition-colors cursor-pointer"
                style={{ color: copied ? "var(--accent)" : "var(--text-muted)" }}
                aria-label="คัดลอกเลขบัญชี"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>

            {/* Account details */}
            <div className="mt-3 flex flex-col gap-1 text-[13px]">
              <div className="flex gap-2">
                <span style={{ color: "var(--text-muted)", minWidth: 80 }}>ประเภทบัญชี</span>
                <span style={{ color: "var(--text-secondary)" }}>{bankAccount.accountType}</span>
              </div>
              <div className="flex gap-2">
                <span style={{ color: "var(--text-muted)", minWidth: 80 }}>สาขา</span>
                <span style={{ color: "var(--text-secondary)" }}>{bankAccount.branch}</span>
              </div>
            </div>
          </div>

          {/* Warning box */}
          <div
            className="rounded-xl px-5 py-4 flex items-start gap-3"
            style={{
              background: "var(--warning-bg)",
              border: "1px solid rgba(var(--warning-rgb),0.2)",
              borderLeft: "3px solid var(--warning)",
            }}
          >
            <Clock size={16} className="mt-0.5 shrink-0" style={{ color: "var(--warning)" }} />
            <ul className="text-[13px] leading-[1.8] list-none" style={{ color: "var(--text-secondary)" }}>
              <li>
                โอนตรงจำนวน{" "}
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  ฿{formatPrice(total)}
                </span>{" "}
                (ห้ามโอนขาด)
              </li>
              <li>โอนภายใน 24 ชั่วโมง</li>
              <li>หลังโอนแล้ว กรุณาแนบสลิปในขั้นตอนถัดไป</li>
            </ul>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="gap-2"
            >
              <ArrowLeft size={16} /> ย้อนกลับ
            </Button>
            <Button
              onClick={goToStep3}
              className="flex-1 font-semibold gap-2" size="lg"
              style={{ background: "var(--accent)", color: "var(--text-on-accent)" }}
            >
              โอนเงินแล้ว — แนบสลิป <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* ═══════════ STEP 3: แนบสลิปโอนเงิน ═══════════ */}
      {step === 3 && (
        <div className="flex flex-col gap-6">
          {/* Title */}
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              แนบสลิปโอนเงิน
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              อัพโหลดหลักฐานการโอนเงิน{" "}
              <span className="font-semibold" style={{ color: "var(--accent)" }}>
                ฿{formatPrice(total)}
              </span>
            </p>
          </div>

          {/* Upload zone */}
          {!slipFile ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className="w-full rounded-lg p-12 flex flex-col items-center gap-3 transition-all cursor-pointer"
              style={{
                border: dragOver ? "2px dashed var(--accent)" : "2px dashed var(--border-default)",
                background: dragOver ? "rgba(var(--accent-rgb),0.04)" : "var(--bg-surface)",
              }}
            >
              <Upload size={40} style={{ color: "var(--text-muted)" }} />
              <p className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                อัพโหลดสลิป
              </p>
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                ลากไฟล์มาวาง หรือคลิกเพื่อเลือก
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                JPG, PNG, PDF (max 10MB)
              </p>
            </button>
          ) : (
            <div
              className="rounded-xl p-4 flex items-center gap-4"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
            >
              {slipPreview ? (
                <img
                  src={slipPreview}
                  alt="สลิป"
                  className="w-20 h-20 rounded-lg object-cover"
                  style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
                >
                  <ImageIcon size={24} style={{ color: "var(--text-muted)" }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {slipFile.name}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {(slipFile.size / 1024).toFixed(0)} KB
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--success)" }}>
                  ✅ อัพโหลดสำเร็จ
                </p>
              </div>
              <button
                type="button"
                onClick={removeSlip}
                className="p-2 rounded-lg transition-colors cursor-pointer"
                style={{ color: "var(--text-muted)" }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
            className="hidden"
          />

          {/* Form fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                จำนวนเงินที่โอน *
              </label>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  ฿
                </span>
                <Input
                  type="text"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="pl-7 h-11"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                วันที่โอน *
              </label>
              <Input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="h-11"
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                เวลาที่โอน *
              </label>
              <Input
                type="time"
                value={transferTime}
                onChange={(e) => setTransferTime(e.target.value)}
                className="h-11"
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                หมายเหตุ (ถ้ามี)
              </label>
              <Input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-11"
                placeholder="เช่น โอนจากบัญชี xxx, ref no. xxx"
              />
            </div>
          </div>

          {/* Error */}
          {errorMessage && (
            <p className="text-xs" style={{ color: "var(--error)" }}>
              {errorMessage}
            </p>
          )}

          {/* Navigation */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
              <ArrowLeft size={16} /> ย้อนกลับ
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !slipFile}
              className="flex-1 font-semibold gap-2" size="lg"
              style={{
                background: slipFile && !submitting ? "var(--accent)" : "var(--bg-surface)",
                color: slipFile && !submitting ? "var(--text-on-accent)" : "var(--text-muted)",
                border: slipFile && !submitting ? "none" : "1px solid var(--border-default)",
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> กำลังส่ง...
                </>
              ) : (
                <>
                  ส่งหลักฐานการโอน <ArrowRight size={16} />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}
