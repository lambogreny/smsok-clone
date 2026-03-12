"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Printer,
  Receipt,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

const VAT_RATE = 0.07

function formatPrice(n: number): string {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatNumber(n: number): string {
  return n.toLocaleString("th-TH")
}

function formatDate(): string {
  const now = new Date()
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
  const thaiYear = now.getFullYear() + 543
  return `${now.getDate()} ${months[now.getMonth()]} ${thaiYear}`
}

function generateInvoiceId(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")
  return `#INV-${y}${m}${d}-${seq}`
}

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const smsQty = Number(searchParams.get("sms") || searchParams.get("credits")) || 1000
  const total = Number(searchParams.get("total")) || 0

  // Defer date/random to client to avoid hydration mismatch
  const [txn, setTxn] = useState(searchParams.get("txn") || "")
  const [dateStr, setDateStr] = useState("")
  useEffect(() => {
    if (!txn) setTxn(generateInvoiceId())
    setDateStr(formatDate())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const subtotal = total > 0 ? Math.round((total / (1 + VAT_RATE)) * 100) / 100 : smsQty * 0.6
  const vat = total > 0 ? Math.round((total - subtotal) * 100) / 100 : Math.round(subtotal * VAT_RATE * 100) / 100
  const displayTotal = total > 0 ? total : subtotal + vat

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{ background: "var(--bg-surface)" }}
    >
      <div className="w-full max-w-lg flex flex-col items-center gap-8">
        {/* Success Animation Area */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 80,
              height: 80,
              background: "var(--accent)",
              color: "var(--text-on-accent)",
            }}
          >
            <CheckCircle2 size={44} strokeWidth={2} />
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            ชำระเงินสำเร็จ!
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            SMS ถูกเพิ่มเข้าบัญชีแล้ว
          </p>
        </div>

        {/* Receipt Card */}
        <div
          className="w-full rounded-lg p-6 flex flex-col gap-0"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          {/* Card Header */}
          <div
            className="flex items-center gap-2 pb-4"
            style={{ color: "var(--text-primary)" }}
          >
            <Receipt size={18} />
            <span className="font-semibold text-base">ใบเสร็จ</span>
          </div>

          <hr style={{ borderColor: "var(--border-default)" }} />

          {/* Row Items */}
          <div className="flex flex-col gap-3 py-4">
            <ReceiptRow label="หมายเลขคำสั่งซื้อ" value={txn} />
            <ReceiptRow label="วันที่" value={dateStr || "..."} />
            <ReceiptRow label="แพ็กเกจ" value={`${formatNumber(smsQty)} SMS`} />
            <ReceiptRow label="วิธีชำระ" value="โอนเงิน + ยืนยันสลิป" />
            <ReceiptRow label="ยอดก่อน VAT" value={`฿${formatPrice(subtotal)}`} />
            <ReceiptRow label="VAT 7%" value={`฿${formatPrice(vat)}`} />
          </div>

          <hr style={{ borderColor: "var(--border-default)" }} />

          {/* Total Row */}
          <div className="flex items-center justify-between py-4">
            <span
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              ยอดรวมทั้งหมด
            </span>
            <span
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              ฿{formatPrice(displayTotal)}
            </span>
          </div>

          <hr style={{ borderColor: "var(--border-default)" }} />

          {/* SMS Info */}
          <div className="flex flex-col gap-3 pt-4">
            <div className="flex items-center justify-between">
              <span style={{ color: "var(--text-secondary)" }} className="text-sm">
                SMS ที่เพิ่ม
              </span>
              <span
                className="text-base font-semibold"
                style={{ color: "var(--accent)" }}
              >
                +{formatNumber(smsQty)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => window.print()}
            >
              <Printer size={16} />
              พิมพ์ใบเสร็จ
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => {}}
            >
              <Download size={16} />
              ดาวน์โหลด PDF
            </Button>
          </div>
          <Button
            className="w-full gap-2"
            style={{
              background: "var(--accent)",
              color: "var(--text-on-accent)",
            }}
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft size={16} />
            กลับหน้า Dashboard
          </Button>
        </div>

        {/* Footer */}
        <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
          ใบเสร็จจะถูกส่งไปที่อีเมลของคุณด้วย
        </p>
      </div>
    </div>
  )
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      <span className="text-sm" style={{ color: "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  )
}
