"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronDown, Mail, MessageCircle, HelpCircle, CreditCard, Send, Key, Shield, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type FaqCategory = "all" | "account" | "sms" | "billing" | "api" | "pdpa";

interface FaqItem {
  q: string;
  a: string;
  category: FaqCategory;
}

const CATEGORIES: { value: FaqCategory; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "ทั้งหมด", icon: HelpCircle },
  { value: "account", label: "บัญชี", icon: Shield },
  { value: "sms", label: "การส่ง SMS", icon: Send },
  { value: "billing", label: "การเงิน", icon: CreditCard },
  { value: "api", label: "API", icon: Key },
  { value: "pdpa", label: "PDPA", icon: Shield },
];

const FAQ_ITEMS: FaqItem[] = [
  { q: "สมัครใช้งานอย่างไร?", a: "คลิก \"สมัครฟรี\" กรอกอีเมล เบอร์โทร ตั้งรหัสผ่าน ยืนยัน OTP เสร็จแล้วได้รับ 500 SMS ทดลองใช้ทันที", category: "account" },
  { q: "ลืมรหัสผ่านทำอย่างไร?", a: "ไปที่หน้า Login คลิก \"ลืมรหัสผ่าน\" กรอกอีเมลหรือเบอร์โทร ระบบจะส่งลิงก์รีเซ็ตให้", category: "account" },
  { q: "เปลี่ยนอีเมลได้ไหม?", a: "ได้ ไปที่ ตั้งค่า > โปรไฟล์ แก้ไขอีเมลแล้วยืนยันอีเมลใหม่ผ่านลิงก์ที่ส่งไป", category: "account" },
  { q: "SMS ส่งไม่ถึงทำอย่างไร?", a: "ตรวจสอบ: 1) เบอร์ถูกต้องไหม 2) มี SMS เหลือไหม 3) Sender Name อนุมัติแล้วหรือยัง 4) เนื้อหาไม่มีคำต้องห้าม ถ้ายังส่งไม่ได้ ติดต่อ support", category: "sms" },
  { q: "Sender Name คืออะไร?", a: "คือชื่อผู้ส่งที่แสดงแทนเบอร์โทร เช่น \"MyBrand\" ต้องยื่นขออนุมัติก่อนใช้งาน ใช้เวลา 1-2 วันทำการ", category: "sms" },
  { q: "ส่ง SMS ได้สูงสุดกี่ข้อความต่อวัน?", a: "ไม่จำกัดจำนวนต่อวัน ขึ้นอยู่กับ SMS ที่มีในบัญชี ระบบรองรับการส่ง 1,000+ ข้อความต่อวินาที", category: "sms" },
  { q: "ราคา SMS เริ่มต้นเท่าไหร่?", a: "เริ่มต้นที่ 0.25 บาท/ข้อความ (Package A) ยิ่งซื้อเยอะยิ่งถูก ถูกสุด 0.15 บาท/ข้อความ (Package H)", category: "billing" },
  { q: "ชำระเงินได้อย่างไร?", a: "โอนเงินผ่านธนาคาร (SCB, KBank, BBL, BAY) แล้วอัปโหลดสลิป ระบบ EasySlip ตรวจสอบอัตโนมัติ", category: "billing" },
  { q: "SMS หมดอายุเมื่อไหร่?", a: "SMS มีอายุ 1 ปีนับจากวันซื้อ ใช้ระบบ FIFO (ซื้อก่อนใช้ก่อน) ดูวันหมดอายุได้ที่หน้า Credit", category: "billing" },
  { q: "ขอใบกำกับภาษีได้ไหม?", a: "ได้ กรอกข้อมูลภาษี (Tax ID, ชื่อบริษัท, ที่อยู่) ตอน Checkout ระบบจะออกใบกำกับภาษีอัตโนมัติ", category: "billing" },
  { q: "API ใช้งานอย่างไร?", a: "ไปที่ คีย์ API สร้าง API Key แล้วเรียกใช้ REST API ตามเอกสาร ดูตัวอย่าง code ได้ที่หน้าเอกสาร API", category: "api" },
  { q: "Rate limit ของ API เท่าไหร่?", a: "ค่าเริ่มต้น 100 requests/วินาที ถ้าต้องการเพิ่ม ติดต่อทีมขาย", category: "api" },
  { q: "รองรับ Webhook ไหม?", a: "รองรับ สามารถตั้ง Webhook URL ที่หน้า ตั้งค่า > Webhooks เพื่อรับ delivery status แบบ real-time", category: "api" },
  { q: "SMSOK เก็บข้อมูลอะไรบ้าง?", a: "เราเก็บเฉพาะข้อมูลที่จำเป็น: ชื่อ, อีเมล, เบอร์โทร, ประวัติการส่ง SMS ข้อมูลถูกเข้ารหัสและจัดเก็บตาม PDPA", category: "pdpa" },
  { q: "ขอลบข้อมูลได้อย่างไร?", a: "ไปที่ ตั้งค่า > ความเป็นส่วนตัว คลิก \"ขอลบข้อมูล\" ทีมงานจะดำเนินการภายใน 30 วัน ตาม PDPA", category: "pdpa" },
  { q: "ขอ Export ข้อมูลได้ไหม?", a: "ได้ ไปที่ ตั้งค่า > ความเป็นส่วนตัว คลิก \"ส่งออกข้อมูล\" ระบบจะส่งไฟล์ให้ทางอีเมลภายใน 7 วัน", category: "pdpa" },
];

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<FaqCategory>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered = FAQ_ITEMS.filter((item) => {
    const matchCategory = category === "all" || item.category === category;
    const matchSearch = !search || item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Header */}
      <header className="border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <Link href="/" className="text-sm text-[var(--accent)] hover:underline mb-4 inline-block">&larr; กลับหน้าหลัก</Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">ศูนย์ช่วยเหลือ</h1>
          <p className="text-sm text-[var(--text-muted)]">ค้นหาคำตอบสำหรับคำถามที่พบบ่อย</p>

          {/* Search */}
          <div className="relative mt-6 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="search"
              placeholder="ค้นหาคำถาม..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[rgba(var(--accent-rgb),0.4)] focus:outline-none"
            />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer",
                  category === cat.value
                    ? "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] border border-[rgba(var(--accent-rgb),0.2)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-transparent"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* FAQ Accordion */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <HelpCircle className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
            <p className="text-sm text-[var(--text-secondary)] mb-1">ไม่พบคำถามที่ค้นหา</p>
            <p className="text-xs text-[var(--text-muted)]">ลองค้นหาด้วยคำอื่น หรือติดต่อทีม Support</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item, i) => (
              <div
                key={item.q}
                className={cn(
                  "rounded-lg border transition-all",
                  openIndex === i
                    ? "bg-[var(--bg-elevated)] border-[rgba(var(--accent-rgb),0.2)]"
                    : "bg-[var(--bg-surface)] border-[var(--border-default)]"
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  aria-expanded={openIndex === i}
                  className="w-full flex items-center justify-between p-4 text-left cursor-pointer"
                >
                  <span className={cn(
                    "text-sm font-medium pr-4",
                    openIndex === i ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
                  )}>
                    {item.q}
                  </span>
                  <ChevronDown className={cn(
                    "w-4 h-4 shrink-0 transition-transform",
                    openIndex === i ? "rotate-180 text-[var(--accent)]" : "text-[var(--text-muted)]"
                  )} />
                </button>
                {openIndex === i && (
                  <div className="px-4 pb-4 text-sm text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-default)] pt-3 mx-4 mb-1">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Contact Support */}
        <div className="mt-12 p-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">ยังหาคำตอบไม่เจอ?</h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">ทีม Support พร้อมช่วยเหลือคุณ</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="mailto:support@smsok.com"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-medium bg-[rgba(var(--accent-rgb),0.08)] text-[var(--accent)] border border-[rgba(var(--accent-rgb),0.15)] hover:border-[rgba(var(--accent-rgb),0.3)] transition-colors min-h-[44px]"
            >
              <Mail className="w-4 h-4" />
              support@smsok.com
            </a>
            <a
              href="https://line.me/ti/p/@smsok"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-medium bg-[#00B900]/10 text-[#00B900] border border-[#00B900]/15 hover:border-[#00B900]/30 transition-colors min-h-[44px]"
            >
              <MessageCircle className="w-4 h-4" />
              LINE @smsok
            </a>
            <Link
              href="/dashboard/support/new"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-medium bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:border-[rgba(var(--accent-rgb),0.2)] transition-colors min-h-[44px]"
            >
              สร้างตั๋ว Support
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
