import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { CheckCircle2, FileSearch, ShieldAlert } from "lucide-react";
import { formatThaiDateOnly, formatThaiDateTimeShort } from "@/lib/format-thai-date";
import {
  checkPublicOrderDocumentVerificationRateLimit,
  formatPublicOrderDocumentVerificationRateLimitMessage,
  getPublicOrderDocumentVerification,
} from "@/lib/orders/verify";

type PageProps = {
  params: Promise<{ code: string }>;
};

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

function formatBaht(amount: number) {
  return amount.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function VerifyDocumentPage({ params }: PageProps) {
  const requestHeaders = await headers();
  const rateLimit = await checkPublicOrderDocumentVerificationRateLimit(requestHeaders);

  if (rateLimit.limited) {
    return (
      <main className="min-h-screen bg-[var(--bg-base)] px-4 py-10 text-[var(--text-primary)] sm:px-6">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Document Verification
            </p>
            <h1 className="mt-2 text-3xl font-bold">ลองใหม่ภายหลัง</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              ระบบจำกัดจำนวนการตรวจสอบเอกสารต่อ IP เพื่อป้องกันการไล่เดารหัสเอกสาร
            </p>
          </div>

          <section className="rounded-2xl border border-[rgba(var(--error-rgb),0.24)] bg-[var(--bg-surface)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
            <div className="flex items-start gap-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  background: "rgba(var(--error-rgb),0.12)",
                  color: "var(--error)",
                }}
              >
                <ShieldAlert className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Too Many Requests</h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {formatPublicOrderDocumentVerificationRateLimitMessage(rateLimit.retryAfter)}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex rounded-lg border border-[var(--border-default)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                กลับหน้าหลัก
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const { code } = await params;
  const verification = await getPublicOrderDocumentVerification(code);

  if (!verification) {
    notFound();
  }

  const isValid = verification.status === "valid";

  return (
    <main className="min-h-screen bg-[var(--bg-base)] px-4 py-10 text-[var(--text-primary)] sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Document Verification
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              ตรวจสอบเอกสาร
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              ยืนยันความถูกต้องของเอกสารบัญชีที่ออกโดยระบบ SMSOK
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-[var(--border-default)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            กลับหน้าหลัก
          </Link>
        </div>

        <section className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  background: isValid
                    ? "rgba(var(--success-rgb),0.12)"
                    : "rgba(var(--error-rgb),0.12)",
                  color: isValid ? "var(--success)" : "var(--error)",
                }}
              >
                {isValid ? <CheckCircle2 className="h-7 w-7" /> : <ShieldAlert className="h-7 w-7" />}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  สถานะ
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  {isValid ? "เอกสารถูกต้อง" : verification.status === "voided" ? "เอกสารถูกยกเลิก" : "เอกสารไม่ถูกต้อง"}
                </h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {isValid
                    ? "ข้อมูลตรงกับเอกสารที่ออกในระบบ และยังไม่ถูกยกเลิก"
                    : verification.status === "voided"
                      ? "เอกสารถูกยกเลิกหรือถูกแทนที่แล้ว กรุณาตรวจสอบฉบับล่าสุด"
                      : "เอกสารฉบับนี้ไม่อยู่ในสถานะใช้งาน"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Document No.
              </p>
              <p className="mt-1 font-mono text-lg font-semibold">
                {verification.code}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">ประเภทเอกสาร</p>
              <p className="mt-2 text-base font-semibold">{verification.label}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">วันที่ออกเอกสาร</p>
              <p className="mt-2 text-base font-semibold">{formatThaiDateOnly(verification.issued_at)}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">อ้างอิงคำสั่งซื้อ</p>
              <p className="mt-2 text-base font-semibold">{verification.order.order_number}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">ยอดรวม</p>
              <p className="mt-2 text-base font-semibold">฿{formatBaht(verification.order.total_amount)}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">ผู้ซื้อ</p>
              <p className="mt-2 text-base font-semibold">{verification.order.customer_name}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                แพ็กเกจ {verification.order.package_name} • สร้างคำสั่งซื้อเมื่อ {formatThaiDateTimeShort(verification.order.created_at)}
              </p>
            </div>
          </div>

          {verification.void_reason && (
            <div className="mt-6 rounded-xl border border-[rgba(var(--error-rgb),0.24)] bg-[rgba(var(--error-rgb),0.08)] p-4">
              <div className="flex items-start gap-3">
                <FileSearch className="mt-0.5 h-5 w-5 text-[var(--error)]" />
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">
                    เหตุผลที่เอกสารถูกยกเลิก
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {verification.void_reason}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
