"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertOctagon, AlertTriangle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreditBalanceResponse {
  totalCredits: number
  usedCredits: number
  remainingCredits: number
  percentage: number
  threshold: "50%" | "20%" | "5%" | null
  packages: unknown[]
}

const alertConfig = {
  "50%": {
    bg: "rgba(var(--info-rgb), 0.06)",
    border: "rgba(var(--info-rgb), 0.15)",
    borderSolid: "rgba(var(--info-rgb), 1)",
    icon: Info,
    color: "var(--info)",
    text: (remaining: number, total: number) =>
      `SMS เหลือ 50% — คงเหลือ ${remaining.toLocaleString()} จาก ${total.toLocaleString()} ข้อความ`,
    subtitle: "แนะนำซื้อแพ็กเกจล่วงหน้า",
    pulse: false,
  },
  "20%": {
    bg: "rgba(var(--warning-rgb), 0.06)",
    border: "rgba(var(--warning-rgb), 0.15)",
    borderSolid: "rgba(var(--warning-rgb), 1)",
    icon: AlertTriangle,
    color: "var(--warning)",
    text: (remaining: number, total: number) =>
      `SMS เหลือน้อย — คงเหลือ ${remaining.toLocaleString()} จาก ${total.toLocaleString()} ข้อความ`,
    subtitle: "ซื้อแพ็กเกจเพิ่มเพื่อไม่ให้บริการหยุดชะงัก",
    pulse: false,
  },
  "5%": {
    bg: "rgba(var(--error-rgb), 0.06)",
    border: "rgba(var(--error-rgb), 0.15)",
    borderSolid: "rgba(var(--error-rgb), 1)",
    icon: AlertOctagon,
    color: "var(--error)",
    text: (remaining: number, total: number) =>
      `SMS ใกล้หมด! — คงเหลือ ${remaining.toLocaleString()} จาก ${total.toLocaleString()} ข้อความ`,
    subtitle: "ซื้อแพ็กเกจทันทีเพื่อไม่ให้ส่ง SMS ไม่ได้",
    pulse: true,
  },
} as const

export default function CreditAlertBanner() {
  const [data, setData] = useState<CreditBalanceResponse | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    async function fetchBalance() {
      try {
        const res = await fetch("/api/credit-balance")
        if (!res.ok) return
        const json = await res.json()
        setData(json)
      } catch {
        // Silently fail — banner is non-critical
      }
    }
    fetchBalance()
  }, [])

  if (!data || !data.threshold || dismissed) return null

  const config = alertConfig[data.threshold]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg p-3 px-4 sm:flex-row",
        config.pulse && "animate-[credit-pulse-border_2s_ease-in-out_infinite]"
      )}
      style={{
        backgroundColor: config.bg,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: config.border,
      }}
    >
      {/* Icon — desktop only (mobile icon is inline with text) */}
      <div className="hidden shrink-0 sm:block">
        <Icon className="size-5" style={{ color: config.color }} />
      </div>

      {/* Text content */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-center sm:text-left">
        <div className="flex items-center justify-center gap-2 sm:justify-start">
          <Icon
            className="size-4 shrink-0 sm:hidden"
            style={{ color: config.color }}
          />
          <span className="text-sm font-medium" style={{ color: config.color }}>
            {config.text(data.remainingCredits, data.totalCredits)}
          </span>
        </div>
        <span className="text-xs text-[var(--text-muted)]">
          {config.subtitle}
        </span>
      </div>

      {/* CTA + Dismiss */}
      <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
        <Link
          href="/dashboard/billing/packages"
          className={cn(
            "inline-flex w-full items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-80 sm:w-auto"
          )}
          style={{ color: config.color }}
        >
          ซื้อแพ็กเกจ &rarr;
        </Link>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-md p-1 transition-opacity hover:opacity-80"
          style={{ color: config.color, opacity: 0.5 }}
          aria-label="Dismiss alert"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
