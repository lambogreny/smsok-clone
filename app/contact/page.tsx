"use client";

import Link from "next/link";
import { useState, useRef, useEffect, type FormEvent } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Clock,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Send,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Subject Types ─── */

const SUBJECT_OPTIONS = [
  { value: "general", label: "สอบถามทั่วไป" },
  { value: "quote", label: "ขอใบเสนอราคา" },
  { value: "report", label: "รายงานปัญหา" },
  { value: "complaint", label: "ร้องเรียน" },
  { value: "pdpa", label: "ขอลบข้อมูล (PDPA)" },
  { value: "partner", label: "พาร์ทเนอร์/ตัวแทน" },
  { value: "other", label: "อื่นๆ" },
] as const;

type SubjectValue = (typeof SUBJECT_OPTIONS)[number]["value"];

/* ─── Support Channels ─── */

const SUPPORT_CHANNELS = [
  {
    icon: Mail,
    label: "อีเมล",
    value: "support@smsok.com",
    href: "mailto:support@smsok.com",
    description: "ตอบกลับภายใน 24 ชม.",
  },
  {
    icon: MessageCircle,
    label: "LINE Official",
    value: "@smsok",
    href: "https://line.me/R/ti/p/@smsok",
    description: "แชทสดกับทีมซัพพอร์ต",
  },
  {
    icon: Phone,
    label: "โทรศัพท์",
    value: "02-xxx-xxxx",
    href: "tel:02xxxxxxx",
    description: "จ-ศ 9:00-18:00 น.",
  },
  {
    icon: Clock,
    label: "เวลาทำการ",
    value: "จ-ศ 9:00-18:00",
    href: null,
    description: "ไม่รวมวันหยุดนักขัตฤกษ์",
  },
] as const;

/* ─── Animation Variants ─── */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

/* ─── Custom Dropdown ─── */

function SubjectDropdown({
  value,
  onChange,
}: {
  value: SubjectValue | "";
  onChange: (v: SubjectValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = SUBJECT_OPTIONS.find((o) => o.value === value)?.label;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm transition-all duration-200 cursor-pointer",
          "bg-[var(--bg-base)] border-[var(--border-default)]",
          "hover:border-[rgba(var(--accent-rgb),0.3)]",
          "focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.4)] focus:border-transparent",
          open && "ring-2 ring-[rgba(var(--accent-rgb),0.4)] border-transparent",
          value ? "text-[var(--text-primary)]" : "text-[var(--text-placeholder)]"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selectedLabel ?? "เลือกหัวข้อ"}</span>
        <ChevronDown
          className={cn(
            "size-4 text-[var(--text-muted)] transition-transform duration-200",
            open && "rotate-180 text-[var(--accent)]"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      <div
        className={cn(
          "absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[0_16px_48px_rgba(0,0,0,0.4)]",
          "transition-all duration-200 origin-top",
          open
            ? "scale-y-100 opacity-100 pointer-events-auto"
            : "scale-y-95 opacity-0 pointer-events-none"
        )}
        role="listbox"
      >
        {SUBJECT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={value === option.value}
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center gap-3 px-4 py-3 text-sm text-left transition-colors duration-150 cursor-pointer",
              value === option.value
                ? "bg-[rgba(var(--accent-rgb),0.08)] text-[var(--accent)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
            )}
          >
            {value === option.value && (
              <CheckCircle2 className="size-4 shrink-0 text-[var(--accent)]" />
            )}
            <span className={cn(value !== option.value && "ml-7")}>
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Form Field Component ─── */

function FormField({
  label,
  required,
  children,
  error,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--text-secondary)]">
        {label}
        {required && <span className="ml-1 text-[var(--accent)]">*</span>}
        {!required && (
          <span className="ml-1.5 text-xs text-[var(--text-muted)]">(ไม่บังคับ)</span>
        )}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

/* ─── Input Styles ─── */

const inputClass = cn(
  "w-full rounded-lg border px-4 py-3 text-sm transition-all duration-200",
  "bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]",
  "placeholder:text-[var(--text-placeholder)]",
  "hover:border-[rgba(var(--accent-rgb),0.3)]",
  "focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.4)] focus:border-transparent"
);

/* ─── Main Page ─── */

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [subject, setSubject] = useState<SubjectValue | "">("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "กรุณากรอกชื่อ-นามสกุล";
    if (!email.trim()) {
      newErrors.email = "กรุณากรอกอีเมล";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }
    if (phone && !/^[0-9\-+\s()]{9,15}$/.test(phone)) {
      newErrors.phone = "รูปแบบเบอร์โทรไม่ถูกต้อง";
    }
    if (!subject) newErrors.subject = "กรุณาเลือกหัวข้อ";
    if (!message.trim()) newErrors.message = "กรุณากรอกข้อความ";
    if (!consent) newErrors.consent = "กรุณายินยอมนโยบายความเป็นส่วนตัว";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          company: company.trim() || undefined,
          subject,
          message: message.trim(),
          consent,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setSubmitted(true);
      toast.success("ส่งข้อความสำเร็จ", {
        description: "ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง",
      });
    } catch {
      toast.error("ไม่สามารถส่งข้อความได้", {
        description: "กรุณาลองใหม่อีกครั้ง หรือติดต่อผ่านช่องทางอื่น",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            href="/"
            className="mb-12 inline-flex items-center gap-1.5 text-sm transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="size-4" />
            กลับหน้าหลัก
          </Link>
        </motion.div>

        {/* Hero */}
        <motion.div
          className="mb-16 text-center"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.h1
            className="text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl"
            variants={fadeUp}
            custom={0}
          >
            ติดต่อเรา
          </motion.h1>
          <motion.p
            className="mx-auto mt-4 max-w-2xl text-lg text-[var(--text-secondary)]"
            variants={fadeUp}
            custom={1}
          >
            มีคำถาม ข้อเสนอแนะ หรือต้องการความช่วยเหลือ?
            <br className="hidden sm:inline" />
            ทีมงาน SMSOK พร้อมให้บริการ
          </motion.p>
        </motion.div>

        {/* Main Content: 2 columns */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-5 lg:gap-16">
          {/* ═══ Contact Form ═══ */}
          <motion.div
            className="lg:col-span-3"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {submitted ? (
              /* ── Success State ── */
              <motion.div
                className="flex flex-col items-center justify-center rounded-lg border border-[rgba(var(--accent-rgb),0.2)] bg-[var(--bg-surface)] px-8 py-16 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(var(--accent-rgb),0.1)]">
                  <CheckCircle2 className="size-8 text-[var(--accent)]" />
                </div>
                <h2 className="mb-3 text-2xl font-bold text-[var(--text-primary)]">
                  ส่งข้อความสำเร็จ
                </h2>
                <p className="mb-8 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
                  ขอบคุณที่ติดต่อเรา ทีมงานจะตรวจสอบข้อความของคุณ
                  และติดต่อกลับภายใน 24 ชั่วโมงทำการ
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/"
                    className="inline-flex h-11 items-center gap-1.5 rounded-md border border-[var(--border-default)] bg-transparent px-6 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
                  >
                    <ArrowLeft className="size-4" />
                    กลับหน้าหลัก
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setName("");
                      setEmail("");
                      setPhone("");
                      setCompany("");
                      setSubject("");
                      setMessage("");
                      setConsent(false);
                      setErrors({});
                    }}
                    className="inline-flex h-11 items-center gap-1.5 rounded-md bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--text-on-accent)] transition-all hover:brightness-110 cursor-pointer"
                  >
                    ส่งข้อความอีกครั้ง
                  </button>
                </div>
              </motion.div>
            ) : (
              /* ── Form ── */
              <form onSubmit={handleSubmit} noValidate>
                <motion.div
                  className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 sm:p-8"
                  variants={fadeUp}
                  custom={2}
                >
                  <h2 className="mb-1 text-xl font-bold text-[var(--text-primary)]">
                    ส่งข้อความถึงเรา
                  </h2>
                  <p className="mb-8 text-sm text-[var(--text-muted)]">
                    กรอกข้อมูลด้านล่าง แล้วเราจะติดต่อกลับโดยเร็วที่สุด
                  </p>

                  <div className="space-y-5">
                    {/* Row: Name + Email */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <FormField label="ชื่อ-นามสกุล" required error={errors.name}>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                          }}
                          placeholder="เช่น สมชาย ใจดี"
                          className={cn(inputClass, errors.name && "border-red-400/50 focus:ring-red-400/40")}
                          autoComplete="name"
                        />
                      </FormField>

                      <FormField label="อีเมล" required error={errors.email}>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                          }}
                          placeholder="email@company.com"
                          className={cn(inputClass, errors.email && "border-red-400/50 focus:ring-red-400/40")}
                          autoComplete="email"
                        />
                      </FormField>
                    </div>

                    {/* Row: Phone + Company */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <FormField label="เบอร์โทรศัพท์" error={errors.phone}>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
                          }}
                          placeholder="08x-xxx-xxxx"
                          className={cn(inputClass, errors.phone && "border-red-400/50 focus:ring-red-400/40")}
                          autoComplete="tel"
                        />
                      </FormField>

                      <FormField label="บริษัท / องค์กร">
                        <input
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="ชื่อบริษัท (ถ้ามี)"
                          className={inputClass}
                          autoComplete="organization"
                        />
                      </FormField>
                    </div>

                    {/* Subject Dropdown */}
                    <FormField label="หัวข้อ" required error={errors.subject}>
                      <SubjectDropdown
                        value={subject}
                        onChange={(v) => {
                          setSubject(v);
                          if (errors.subject) setErrors((prev) => ({ ...prev, subject: "" }));
                        }}
                      />
                    </FormField>

                    {/* Message */}
                    <FormField label="ข้อความ" required error={errors.message}>
                      <textarea
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value);
                          if (errors.message) setErrors((prev) => ({ ...prev, message: "" }));
                        }}
                        placeholder="อธิบายรายละเอียดที่ต้องการติดต่อ..."
                        rows={5}
                        maxLength={2000}
                        className={cn(
                          inputClass,
                          "resize-none",
                          errors.message && "border-red-400/50 focus:ring-red-400/40"
                        )}
                      />
                      <p className="text-xs text-[var(--text-muted)]">
                        {message.length}/2000 ตัวอักษร
                      </p>
                    </FormField>

                    {/* PDPA Consent */}
                    <div className="space-y-2">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative mt-0.5 shrink-0">
                          <input
                            type="checkbox"
                            checked={consent}
                            onChange={(e) => {
                              setConsent(e.target.checked);
                              if (errors.consent) setErrors((prev) => ({ ...prev, consent: "" }));
                            }}
                            className="peer sr-only"
                          />
                          <div
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded border transition-all duration-200",
                              consent
                                ? "border-[var(--accent)] bg-[var(--accent)]"
                                : "border-[var(--border-default)] bg-[var(--bg-base)] group-hover:border-[rgba(var(--accent-rgb),0.4)]",
                              errors.consent && "border-red-400/50"
                            )}
                          >
                            {consent && (
                              <svg
                                viewBox="0 0 12 12"
                                fill="none"
                                className="size-3 text-[var(--bg-base)]"
                              >
                                <path
                                  d="M2.5 6L5 8.5L9.5 3.5"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className="text-sm leading-relaxed text-[var(--text-secondary)]">
                          ข้าพเจ้ายินยอมให้ SMSOK เก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลของข้าพเจ้า
                          เพื่อวัตถุประสงค์ในการติดต่อกลับและให้บริการ ตาม{" "}
                          <Link
                            href="/privacy"
                            className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                            target="_blank"
                          >
                            นโยบายความเป็นส่วนตัว
                          </Link>
                        </span>
                      </label>
                      {errors.consent && (
                        <p className="text-xs text-red-400 ml-8">{errors.consent}</p>
                      )}
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-semibold transition-all duration-200 cursor-pointer",
                        "bg-[var(--accent)] text-[var(--text-on-accent)]",
                        "shadow-[0_0_20px_rgba(var(--accent-rgb),0.2)]",
                        "hover:shadow-[0_0_32px_rgba(var(--accent-rgb),0.3)] hover:brightness-110",
                        "focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.5)] focus:ring-offset-2 focus:ring-offset-[var(--bg-surface)]",
                        "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:brightness-100"
                      )}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          กำลังส่ง...
                        </>
                      ) : (
                        <>
                          <Send className="size-4" />
                          ส่งข้อความ
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </form>
            )}
          </motion.div>

          {/* ═══ Support Channels Sidebar ═══ */}
          <motion.div
            className="lg:col-span-2"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Channels */}
            <motion.div variants={fadeUp} custom={3}>
              <h2 className="mb-6 text-lg font-bold text-[var(--text-primary)]">
                ช่องทางติดต่อ
              </h2>
              <div className="space-y-4">
                {SUPPORT_CHANNELS.map((channel, i) => {
                  const Icon = channel.icon;
                  const inner = (
                    <div
                      className={cn(
                        "group flex items-start gap-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-all duration-200",
                        channel.href &&
                          "hover:border-[rgba(var(--accent-rgb),0.2)] hover:bg-[var(--bg-surface-hover)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.2)]"
                      )}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(var(--accent-rgb),0.08)] text-[var(--accent)] transition-colors group-hover:bg-[rgba(var(--accent-rgb),0.12)]">
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                          {channel.label}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">
                          {channel.value}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                          {channel.description}
                        </p>
                      </div>
                      {channel.href && (
                        <ArrowRight className="ml-auto mt-1 size-4 shrink-0 text-[var(--text-muted)] opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:text-[var(--accent)]" />
                      )}
                    </div>
                  );

                  return (
                    <motion.div key={channel.label} variants={fadeUp} custom={3 + i}>
                      {channel.href ? (
                        <a
                          href={channel.href}
                          target={channel.href.startsWith("http") ? "_blank" : undefined}
                          rel={channel.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        >
                          {inner}
                        </a>
                      ) : (
                        inner
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Response Time SLA */}
            <motion.div
              className="mt-8 rounded-lg border border-[rgba(var(--accent-rgb),0.1)] bg-[linear-gradient(135deg,rgba(var(--accent-rgb),0.04)_0%,transparent_100%)] p-6"
              variants={fadeUp}
              custom={8}
            >
              <div className="flex items-center gap-2 mb-3">
                <Shield className="size-4 text-[var(--accent)]" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  ระยะเวลาตอบกลับ
                </h3>
              </div>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li className="flex items-center justify-between">
                  <span>สอบถามทั่วไป</span>
                  <span className="text-xs font-medium text-[var(--text-muted)]">
                    ภายใน 24 ชม.
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span>รายงานปัญหา</span>
                  <span className="text-xs font-medium text-[var(--accent)]">
                    ภายใน 4 ชม.
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span>ขอลบข้อมูล (PDPA)</span>
                  <span className="text-xs font-medium text-[var(--text-muted)]">
                    ภายใน 30 วัน
                  </span>
                </li>
              </ul>
            </motion.div>
          </motion.div>
        </div>

        {/* ═══ Footer Notes ═══ */}
        <motion.div
          className="mt-16 space-y-1 pb-8 text-center text-xs text-[var(--text-muted)] opacity-60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p>
            * ข้อมูลส่วนบุคคลจะถูกเก็บรักษาตาม{" "}
            <Link href="/privacy" className="underline hover:text-[var(--text-secondary)]">
              นโยบายความเป็นส่วนตัว
            </Link>{" "}
            และ พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
          </p>
        </motion.div>
      </div>
    </div>
  );
}
