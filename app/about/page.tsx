"use client";

import Link from "next/link";
import {
  motion,
  useInView,
  type Variants,
} from "framer-motion";
import { useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe,
  Headphones,
  Heart,
  Lock,
  MessageSquare,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

/* ─── Animation Variants ─── */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const sectionVariants: Variants = {
  offscreen: { opacity: 0, y: 60, scale: 0.97 },
  onscreen: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* ─── Section Wrapper with scroll animation ─── */

function AnimatedSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.section
      ref={ref}
      variants={sectionVariants}
      initial="offscreen"
      animate={inView ? "onscreen" : "offscreen"}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ─── Data ─── */

const STATS = [
  { value: "500+", label: "ธุรกิจที่ไว้วางใจ", icon: Building2 },
  { value: "10M+", label: "SMS ส่งสำเร็จ", icon: MessageSquare },
  { value: "99.9%", label: "Uptime", icon: Zap },
  { value: "24/7", label: "Support", icon: Headphones },
];

const TRUST_BADGES = [
  {
    icon: ShieldCheck,
    title: "จดทะเบียน กสทช.",
    description: "ผู้ให้บริการ SMS ที่จดทะเบียนถูกต้องตามกฎหมายกับ กสทช. (NBTC)",
  },
  {
    icon: Lock,
    title: "PDPA Compliant",
    description: "ปฏิบัติตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล อย่างเคร่งครัด",
  },
  {
    icon: Shield,
    title: "ISO 27001 (Planned)",
    description: "อยู่ระหว่างดำเนินการรับรองมาตรฐานความปลอดภัยข้อมูลสากล",
  },
  {
    icon: Globe,
    title: "Enterprise-Grade Security",
    description: "เข้ารหัสข้อมูลทุกขั้นตอน ระบบรักษาความปลอดภัยระดับองค์กร",
  },
];

const TEAM_VALUES = [
  {
    icon: Trophy,
    title: "ความน่าเชื่อถือ",
    description: "ระบบเสถียร พร้อมใช้งานตลอดเวลา ส่ง SMS ถึงปลายทางทุกครั้ง",
  },
  {
    icon: Target,
    title: "ความโปร่งใส",
    description: "ราคาชัดเจน ไม่มีค่าใช้จ่ายแอบแฝง รายงานส่งแบบ real-time",
  },
  {
    icon: Scale,
    title: "ราคายุติธรรม",
    description: "ราคาเริ่มต้นเพียง ฿0.147/SMS ยิ่งซื้อเยอะยิ่งถูก ไม่มีค่ารายเดือน",
  },
  {
    icon: Heart,
    title: "บริการที่เป็นเลิศ",
    description: "ทีม support พร้อมช่วยเหลือ 24/7 ตอบเร็ว แก้ปัญหาจริง",
  },
];

const MILESTONES = [
  { year: "2023", title: "ก่อตั้ง SMSOK", description: "เริ่มต้นด้วยวิสัยทัศน์ทำให้ SMS เข้าถึงได้สำหรับทุกธุรกิจ" },
  { year: "2024", title: "เปิดบริการ", description: "เปิดให้บริการส่ง SMS ผ่านเว็บและ API พร้อมระบบ OTP" },
  { year: "2025", title: "500+ ธุรกิจ", description: "ได้รับความไว้วางใจจากธุรกิจกว่า 500 รายทั่วประเทศ" },
  { year: "2026", title: "ก้าวสู่อนาคต", description: "พัฒนาระบบ AI SMS และขยายบริการสู่ระดับภูมิภาค" },
];

/* ─── Main Page ─── */

export default function AboutPage() {
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
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mb-20 text-center"
        >
          <motion.div variants={fadeUp}>
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[rgba(var(--accent-rgb),0.2)] bg-[rgba(var(--accent-rgb),0.06)] px-4 py-1.5 text-xs font-medium text-[var(--accent)]">
              <Sparkles className="size-3" />
              เกี่ยวกับ SMSOK
            </span>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="mt-6 text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl"
          >
            ทำให้ SMS{" "}
            <span className="bg-gradient-to-r from-[var(--accent)] to-[#00B894] bg-clip-text text-transparent">
              เข้าถึงได้
            </span>
            <br />
            สำหรับทุกธุรกิจ
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)]"
          >
            ไม่ว่าธุรกิจของคุณจะเล็กหรือใหญ่ SMSOK พร้อมเป็นพาร์ทเนอร์
            ด้านการสื่อสารผ่าน SMS ที่คุณวางใจได้
          </motion.p>
        </motion.div>

        {/* ═══ Key Stats ═══ */}
        <AnimatedSection className="mb-24">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
          >
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  variants={scaleIn}
                  className="group relative overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 text-center transition-all duration-300 hover:border-[rgba(var(--accent-rgb),0.2)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.3)]"
                >
                  {/* Subtle glow on hover */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(var(--accent-rgb),0.06),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(var(--accent-rgb),0.1)]">
                      <Icon className="size-5 text-[var(--accent)]" />
                    </div>
                    <p className="text-3xl font-bold tabular-nums text-[var(--text-primary)] sm:text-4xl">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      {stat.label}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatedSection>

        {/* ═══ Company Story ═══ */}
        <AnimatedSection className="mb-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Text side */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              <motion.h2
                variants={fadeUp}
                className="text-3xl font-bold text-[var(--text-primary)] sm:text-4xl"
              >
                เรื่องราวของเรา
              </motion.h2>
              <motion.div variants={fadeUp} className="mt-2 h-1 w-16 rounded-full bg-[var(--accent)]" />
              <motion.p
                variants={fadeUp}
                className="mt-6 text-base leading-relaxed text-[var(--text-secondary)]"
              >
                SMSOK เกิดจากความเชื่อที่ว่า ธุรกิจทุกขนาดควรเข้าถึงบริการ SMS
                คุณภาพสูงในราคาที่เป็นธรรม เราเริ่มต้นจากการเห็นปัญหาที่ SME
                ไทยต้องจ่ายค่า SMS แพงเกินจริง
                และระบบที่มีอยู่ก็ซับซ้อนเกินไปสำหรับธุรกิจขนาดเล็ก
              </motion.p>
              <motion.p
                variants={fadeUp}
                className="mt-4 text-base leading-relaxed text-[var(--text-secondary)]"
              >
                เราจึงสร้าง SMSOK ให้เป็นแพลตฟอร์มที่ใช้งานง่าย ราคาโปร่งใส
                และมีทีม support คนไทยพร้อมช่วยเหลือตลอด 24 ชั่วโมง
                ไม่ว่าคุณจะส่ง SMS 100 หรือ 1,000,000 ข้อความ
                เราพร้อมดูแลคุณเหมือนกัน
              </motion.p>
              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)]">
                  <CheckCircle2 className="size-3.5 text-[var(--accent)]" />
                  ก่อตั้งในประเทศไทย
                </div>
                <div className="flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)]">
                  <CheckCircle2 className="size-3.5 text-[var(--accent)]" />
                  ทีมคนไทย 100%
                </div>
                <div className="flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)]">
                  <CheckCircle2 className="size-3.5 text-[var(--accent)]" />
                  เข้าใจธุรกิจไทย
                </div>
              </motion.div>
            </motion.div>

            {/* Timeline side */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="relative"
            >
              {/* Vertical line */}
              <div className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-[var(--accent)] via-[rgba(var(--accent-rgb),0.3)] to-transparent sm:left-6" />

              <div className="space-y-8">
                {MILESTONES.map((milestone) => (
                  <motion.div
                    key={milestone.year}
                    variants={fadeUp}
                    className="relative pl-12 sm:pl-16"
                  >
                    {/* Dot */}
                    <div className="absolute left-2.5 top-1 flex h-3 w-3 items-center justify-center sm:left-4.5">
                      <div className="h-3 w-3 rounded-full border-2 border-[var(--accent)] bg-[var(--bg-base)]" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
                      {milestone.year}
                    </span>
                    <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                      {milestone.title}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      {milestone.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </AnimatedSection>

        {/* ═══ Trust & Compliance ═══ */}
        <AnimatedSection className="mb-24">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
              ความปลอดภัยและการรับรอง
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-[var(--text-secondary)]">
              เราให้ความสำคัญกับความปลอดภัยข้อมูลของคุณเป็นอันดับหนึ่ง
            </p>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {TRUST_BADGES.map((badge) => {
              const Icon = badge.icon;
              return (
                <motion.div
                  key={badge.title}
                  variants={scaleIn}
                  className="group relative overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 transition-all duration-300 hover:border-[rgba(var(--accent-rgb),0.2)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.3)]"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(var(--accent-rgb),0.05),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[rgba(var(--accent-rgb),0.1)]">
                      <Icon className="size-5 text-[var(--accent)]" />
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      {badge.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
                      {badge.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatedSection>

        {/* ═══ Team Values ═══ */}
        <AnimatedSection className="mb-24">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
              คุณค่าที่เรายึดมั่น
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-[var(--text-secondary)]">
              ทุกสิ่งที่เราทำ ขับเคลื่อนด้วยหลักการเหล่านี้
            </p>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-12 grid gap-6 sm:grid-cols-2"
          >
            {TEAM_VALUES.map((value, i) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={value.title}
                  variants={fadeUp}
                  className="group relative overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 transition-all duration-300 hover:border-[rgba(var(--accent-rgb),0.2)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.3)]"
                >
                  {/* Corner accent */}
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[rgba(var(--accent-rgb),0.04)] transition-all duration-300 group-hover:bg-[rgba(var(--accent-rgb),0.08)]" />
                  <div className="relative flex gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[rgba(var(--accent-rgb),0.1)]">
                      <Icon className="size-6 text-[var(--accent)]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                        {value.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                        {value.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatedSection>

        {/* ═══ Why SMSOK ─ differentiators ═══ */}
        <AnimatedSection className="mb-24">
          <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 sm:p-12">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
                ทำไมต้อง SMSOK?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-[var(--text-secondary)]">
                สิ่งที่ทำให้เราแตกต่างจากผู้ให้บริการ SMS รายอื่น
              </p>
            </div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
            >
              {[
                {
                  icon: Users,
                  title: "สร้างมาเพื่อ SME ไทย",
                  description: "ออกแบบมาให้ใช้งานง่าย ไม่ต้องเป็น developer ก็ส่ง SMS ได้",
                },
                {
                  icon: Scale,
                  title: "ไม่มีค่าใช้จ่ายแอบแฝง",
                  description: "ไม่มีค่าแรกเข้า ไม่มีค่ารายเดือน จ่ายเฉพาะ SMS ที่ใช้",
                },
                {
                  icon: Zap,
                  title: "ส่งเร็วใน 1-3 วินาที",
                  description: "เชื่อมต่อกับ operator โดยตรง ส่งถึงทุกเครือข่ายอย่างรวดเร็ว",
                },
                {
                  icon: Headphones,
                  title: "Support คนไทย 24/7",
                  description: "ไม่ต้องรอ chatbot ตอบ ทีมงานคนไทยพร้อมช่วยทุกปัญหา",
                },
                {
                  icon: Shield,
                  title: "Delivery-Failure Refund",
                  description: "SMS ส่งไม่ถึง? เราคืนโควต้าให้ ไม่เสียเงินฟรี",
                },
                {
                  icon: Globe,
                  title: "API พร้อมใช้ทันที",
                  description: "RESTful API พร้อม SDK สำหรับ Node.js, Python, PHP เชื่อมต่อใน 5 นาที",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <motion.div key={item.title} variants={fadeUp} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(var(--accent-rgb),0.08)]">
                      <Icon className="size-5 text-[var(--accent)]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </AnimatedSection>

        {/* ═══ Bottom CTA ═══ */}
        <AnimatedSection className="mb-12">
          <div className="rounded-lg border border-[rgba(var(--accent-rgb),0.15)] bg-[linear-gradient(135deg,rgba(var(--accent-rgb),0.05)_0%,rgba(var(--accent-rgb),0.02)_100%)] p-10 text-center sm:p-14">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              <motion.h2
                variants={fadeUp}
                className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
              >
                พร้อมเริ่มต้นกับ SMSOK หรือยัง?
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[var(--text-secondary)]"
              >
                สมัครฟรีวันนี้ รับ 15 SMS ทดลองใช้งานทันที ไม่ต้องผูกบัตร
                <br className="hidden sm:inline" />
                หรือติดต่อทีมงานเพื่อปรึกษาแพ็กเกจที่เหมาะกับธุรกิจของคุณ
              </motion.p>
              <motion.div
                variants={fadeUp}
                className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
              >
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center gap-1.5 rounded-md bg-[var(--accent)] px-8 font-semibold text-[var(--text-on-accent)] shadow-[0_0_20px_rgba(var(--accent-rgb),0.25)] transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_28px_rgba(var(--accent-rgb),0.35)]"
                >
                  สมัครฟรี
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex h-12 items-center gap-1.5 rounded-md border border-[rgba(var(--accent-rgb),0.25)] bg-transparent px-8 font-semibold text-[var(--accent)] transition-all duration-200 hover:bg-[rgba(var(--accent-rgb),0.08)]"
                >
                  ติดต่อเรา
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </AnimatedSection>

        {/* ═══ Footer Links ═══ */}
        <div className="space-y-1 pb-8 text-center text-xs text-[var(--text-muted)] opacity-60">
          <p>
            <Link href="/pricing" className="underline hover:text-[var(--text-secondary)]">
              ดูแพ็กเกจและราคา
            </Link>
            {" | "}
            <Link href="/terms" className="underline hover:text-[var(--text-secondary)]">
              ข้อกำหนดการใช้งาน
            </Link>
            {" | "}
            <Link href="/privacy" className="underline hover:text-[var(--text-secondary)]">
              นโยบายความเป็นส่วนตัว
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
