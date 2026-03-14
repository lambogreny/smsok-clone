"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Crown,
  MessageSquare,
  Rocket,
  Sparkles,
  Building2,
  Users,
  Headphones,
  Zap,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Tier Data ─── */

interface PricingTier {
  id: string;
  name: string;
  tagline: string;
  icon: React.ElementType;
  sms: number;
  price: number;
  perSms: number;
  popular?: boolean;
  features: string[];
  cta: string;
}

const TIERS: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "สำหรับธุรกิจเริ่มต้น",
    icon: Rocket,
    sms: 1_100,
    price: 1_000,
    perSms: 0.91,
    features: [
      "10 Sender Names",
      "อายุ 12 เดือน",
      "+10% Bonus SMS",
      "API Access",
      "รายงานส่ง SMS",
    ],
    cta: "เริ่มใช้งานฟรี",
  },
  {
    id: "business",
    name: "Business",
    tagline: "สำหรับธุรกิจที่เติบโต",
    icon: Crown,
    sms: 60_000,
    price: 50_000,
    perSms: 0.83,
    popular: true,
    features: [
      "20 Sender Names",
      "อายุ 24 เดือน",
      "+20% Bonus SMS",
      "API Access",
      "รายงานส่ง SMS",
      "Delivery-Failure Refund",
      "Priority Support",
    ],
    cta: "เริ่มใช้งานฟรี",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "สำหรับองค์กรขนาดใหญ่",
    icon: Building2,
    sms: 390_000,
    price: 300_000,
    perSms: 0.77,
    features: [
      "Sender Names ไม่จำกัด",
      "อายุ 36 เดือน",
      "+30% Bonus SMS",
      "API Access",
      "รายงานส่ง SMS",
      "Delivery-Failure Refund",
      "Dedicated Support",
      "Custom Integration",
    ],
    cta: "ติดต่อทีมขาย",
  },
];

/* ─── FAQ Data ─── */

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "โควต้าข้อความหมดอายุไหม?",
    answer:
      "โควต้าข้อความมีอายุการใช้งานตามแพ็กเกจที่เลือก ตั้งแต่ 6-36 เดือน นับจากวันที่ซื้อ คุณสามารถใช้งานได้จนครบจำนวนหรือจนกว่าจะหมดอายุ และสามารถซื้อแพ็กเกจเพิ่มได้ตลอดเวลา โดยโควต้าเดิมที่เหลือจะยังคงอยู่",
  },
  {
    question: "ชำระเงินยังไง?",
    answer:
      "รองรับการชำระเงินผ่านโอนเงินธนาคาร (Bank Transfer) พร้อมอัปโหลดสลิป ระบบจะตรวจสอบและเปิดใช้งานภายใน 15 นาที ในอนาคตจะรองรับบัตรเครดิต/เดบิต และ PromptPay QR",
  },
  {
    question: "อัปเกรดแพ็กเกจได้ไหม?",
    answer:
      "ได้ คุณสามารถซื้อแพ็กเกจเพิ่มได้ตลอดเวลา โควต้าข้อความจะถูกเพิ่มเข้าไปยังบัญชีของคุณ โดยระบบจะใช้โควต้าเก่าก่อนตามหลัก FIFO (First In, First Out) เพื่อให้แน่ใจว่าโควต้าไม่หมดอายุ",
  },
  {
    question: "มีค่าใช้จ่ายแอบแฝงไหม?",
    answer:
      "ไม่มี ราคาที่แสดงยังไม่รวม VAT 7% เท่านั้น ไม่มีค่าธรรมเนียมรายเดือน ไม่มีค่าแรกเข้า ไม่มี minimum spend จ่ายเฉพาะแพ็กเกจที่ซื้อ ใช้ได้จนหมดหรือหมดอายุ",
  },
  {
    question: "SMS ปกติกับ OTP ต่างกันอย่างไร?",
    answer:
      "SMS ปกติ ใช้สำหรับส่งข้อความทั่วไป แจ้งเตือน หรือ Marketing ส่งได้ทุกเวลาผ่านหน้าเว็บหรือ API ส่วน OTP ใช้สำหรับยืนยันตัวตน ระบบจะสร้างรหัส OTP 6 หลักให้อัตโนมัติ มีอายุ 5 นาที และตรวจสอบความถูกต้องให้ ทั้งสองใช้โควต้าข้อความเท่ากัน",
  },
];

/* ─── Helpers ─── */

function formatNumber(n: number): string {
  return n.toLocaleString("th-TH");
}

function formatCurrency(n: number): string {
  return `฿${n.toLocaleString("th-TH")}`;
}

/* ─── FAQ Accordion ─── */

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className={cn(
              "rounded-xl border transition-all duration-200",
              isOpen
                ? "border-[rgba(var(--accent-rgb),0.2)] bg-[rgba(var(--accent-rgb),0.03)]"
                : "border-[var(--border-default)] bg-[var(--bg-surface)]"
            )}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left cursor-pointer"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-[var(--text-muted)] transition-transform duration-200",
                  isOpen && "rotate-180 text-[var(--accent)]"
                )}
              />
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <p className="px-6 pb-4 text-sm leading-relaxed text-[var(--text-secondary)]">
                {item.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Pricing Card ─── */

function PricingCard({ tier }: { tier: PricingTier }) {
  const Icon = tier.icon;

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border p-8 transition-all duration-300",
        tier.popular
          ? "border-[rgba(var(--accent-rgb),0.3)] bg-[linear-gradient(180deg,rgba(var(--accent-rgb),0.06)_0%,var(--bg-surface)_100%)] shadow-[0_0_40px_rgba(var(--accent-rgb),0.08)] hover:shadow-[0_0_60px_rgba(var(--accent-rgb),0.12)] scale-[1.02] lg:scale-105 z-10"
          : "border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[rgba(var(--accent-rgb),0.15)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.3)]"
      )}
    >
      {/* Best Value Badge */}
      {tier.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-[var(--accent)] text-[var(--text-on-accent)] shadow-[0_4px_16px_rgba(var(--accent-rgb),0.3)]">
          <Sparkles className="size-3" />
          Best Value
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div
          className={cn(
            "mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl",
            tier.popular
              ? "bg-[rgba(var(--accent-rgb),0.12)] text-[var(--accent)]"
              : "bg-[var(--bg-muted)] text-[var(--text-muted)]"
          )}
        >
          <Icon className="size-5" />
        </div>
        <h3 className="text-xl font-bold text-[var(--text-primary)]">{tier.name}</h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{tier.tagline}</p>
      </div>

      {/* Price */}
      <div className="mb-2">
        <span className="text-4xl font-bold tabular-nums text-[var(--text-primary)]">
          {formatCurrency(tier.price)}
        </span>
      </div>

      {/* SMS Count & Per SMS */}
      <div className="mb-6 space-y-1">
        <p className="text-sm text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--accent)] tabular-nums">
            {formatNumber(tier.sms)}
          </span>{" "}
          SMS
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          เฉลี่ย ฿{tier.perSms.toFixed(2)} ต่อข้อความ
        </p>
      </div>

      {/* Divider */}
      <div className="mb-6 h-px w-full bg-[var(--border-default)]" />

      {/* Features */}
      <ul className="mb-8 flex flex-1 flex-col gap-3 text-sm text-[var(--text-secondary)]">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <Check
              className={cn(
                "mt-0.5 size-4 shrink-0",
                tier.popular ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
              )}
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href="/register"
        className={cn(
          "flex w-full items-center justify-center gap-1.5 rounded-md px-6 font-semibold transition-all duration-200",
          tier.popular
            ? "h-12 bg-[var(--accent)] text-[var(--text-on-accent)] shadow-[0_0_20px_rgba(var(--accent-rgb),0.25)] hover:shadow-[0_0_28px_rgba(var(--accent-rgb),0.35)] hover:brightness-110"
            : "h-12 border border-[rgba(var(--accent-rgb),0.25)] bg-transparent text-[var(--accent)] hover:bg-[rgba(var(--accent-rgb),0.08)]"
        )}
      >
        {tier.cta}
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

/* ─── Trust Badges ─── */

function TrustBadges() {
  const badges = [
    { icon: Zap, label: "ส่งเร็ว 1-3 วินาที" },
    { icon: Shield, label: "ข้อมูลปลอดภัย" },
    { icon: Headphones, label: "Support ภาษาไทย" },
    { icon: MessageSquare, label: "ทดลองฟรี 500 SMS" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
      {badges.map((badge) => (
        <div key={badge.label} className="flex items-center gap-2 text-[var(--text-muted)]">
          <badge.icon className="size-4" />
          <span className="text-xs font-medium">{badge.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Page ─── */

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/"
          className="mb-12 inline-flex items-center gap-1.5 text-sm transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="size-4" />
          กลับหน้าหลัก
        </Link>

        {/* ═══ Hero Section ═══ */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">
            แพ็กเกจและราคา
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">
            เลือกแพ็กเกจที่เหมาะกับธุรกิจของคุณ ยิ่งซื้อเยอะ ยิ่งถูก
            <br className="hidden sm:inline" />
            ไม่มีค่าแรกเข้า ไม่มีค่ารายเดือน
          </p>

          {/* Trust Badges */}
          <div className="mt-8">
            <TrustBadges />
          </div>
        </div>

        {/* ═══ Pricing Cards ═══ */}
        <div className="mb-20 grid grid-cols-1 items-start gap-6 md:grid-cols-3 lg:gap-4">
          {TIERS.map((tier) => (
            <PricingCard key={tier.id} tier={tier} />
          ))}
        </div>

        {/* ═══ All Packages Link ═══ */}
        <div className="mb-20 text-center">
          <p className="mb-4 text-sm text-[var(--text-muted)]">
            ต้องการดูแพ็กเกจทั้งหมด 8 แพ็กเกจ?
          </p>
          <Link
            href="/packages"
            className="inline-flex items-center gap-2 rounded-md border border-[var(--border-default)] bg-transparent px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
          >
            <Users className="size-4" />
            ดูแพ็กเกจทั้งหมด
          </Link>
        </div>

        {/* ═══ FAQ Section ═══ */}
        <div className="mx-auto mb-16 max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-[var(--text-primary)]">
            คำถามที่พบบ่อย
          </h2>
          <FaqAccordion items={FAQ_ITEMS} />
        </div>

        {/* ═══ Bottom CTA ═══ */}
        <div className="mb-12 rounded-2xl border border-[rgba(var(--accent-rgb),0.15)] bg-[linear-gradient(135deg,rgba(var(--accent-rgb),0.05)_0%,rgba(var(--accent-purple-rgb),0.05)_100%)] p-10 text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            พร้อมเริ่มส่ง SMS แล้วหรือยัง?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-[var(--text-secondary)]">
            สมัครฟรีวันนี้ รับ 500 SMS ทดลองใช้งาน ไม่ต้องผูกบัตร
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex h-12 items-center gap-1.5 rounded-md px-8 bg-[var(--accent)] text-[var(--text-on-accent)] font-semibold shadow-[0_0_20px_rgba(var(--accent-rgb),0.25)] hover:shadow-[0_0_28px_rgba(var(--accent-rgb),0.35)] hover:brightness-110 transition-all duration-200"
          >
            เริ่มใช้งานฟรี
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* ═══ Footer Notes ═══ */}
        <div className="space-y-1 pb-8 text-center text-xs text-[var(--text-muted)] opacity-60">
          <p>* ราคายังไม่รวม VAT 7%</p>
          <p>* Delivery-Failure Refund สำหรับ Package Business ขึ้นไป</p>
          <p>
            * ดู{" "}
            <Link href="/terms" className="underline hover:text-[var(--text-secondary)]">
              ข้อกำหนดการใช้งาน
            </Link>{" "}
            และ{" "}
            <Link href="/privacy" className="underline hover:text-[var(--text-secondary)]">
              นโยบายความเป็นส่วนตัว
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
