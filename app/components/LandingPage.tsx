"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
  useInView,
  useScroll,
  type Variants,
} from "framer-motion";
import LanguageSwitcher from "@/components/language-switcher";

/* ─── Shared variants ─── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
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

/* ─── Data ─── */
const packages = [
  { name: "A", price: 500,    bonus: 0,  total: 500,     sms: 2273,    cost: "0.220", senders: 5,  duration: "6 เดือน",  best: false },
  { name: "B", price: 1000,   bonus: 10, total: 1100,    sms: 5000,    cost: "0.200", senders: 10, duration: "12 เดือน", best: false },
  { name: "C", price: 10000,  bonus: 15, total: 11500,   sms: 52273,   cost: "0.191", senders: 15, duration: "24 เดือน", best: true  },
  { name: "D", price: 50000,  bonus: 20, total: 60000,   sms: 272727,  cost: "0.183", senders: 20, duration: "24 เดือน", best: false },
  { name: "E", price: 100000, bonus: 25, total: 125000,  sms: 568182,  cost: "0.176", senders: -1, duration: "36 เดือน", best: false },
  { name: "F", price: 300000, bonus: 30, total: 390000,  sms: 1772727, cost: "0.169", senders: -1, duration: "36 เดือน", best: false },
  { name: "G", price: 500000, bonus: 40, total: 700000,  sms: 3181818, cost: "0.157", senders: -1, duration: "36 เดือน", best: false },
  { name: "H", price: 1000000,bonus: 50, total: 1500000, sms: 6818182, cost: "0.147", senders: -1, duration: "36 เดือน", best: false },
];

const benefits = [
  { title: "ราคาถูกที่สุด", desc: "เริ่มต้นเพียง ฿0.147/SMS", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><text x="12" y="16" textAnchor="middle" fill="currentColor" stroke="none" fontSize="12" fontWeight="bold">฿</text></svg> },
  { title: "ส่งเร็วทันใจ", desc: "ส่งถึงปลายทางภายใน 3 วินาที", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg> },
  { title: "ทดลองฟรี", desc: "สมัครวันนี้รับฟรี 15 SMS ฟรี", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" /></svg> },
  { title: "ซัพพอร์ต 24/7", desc: "ทีมงานพร้อมช่วยเหลือตลอด", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> },
  { title: "SMS API", desc: "เชื่อมต่อง่ายด้วย RESTful API", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg> },
];

const features = [
  { title: "ส่ง SMS ผ่านเว็บ", desc: "พิมพ์ข้อความ เลือกเบอร์ กดส่ง — ง่ายแค่นั้น", icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg> },
  { title: "SMS API", desc: "RESTful API พร้อม SDK สำหรับ Node.js, Python, PHP", icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg> },
  { title: "สมุดโทรศัพท์", desc: "จัดการรายชื่อ กลุ่ม นำเข้า CSV ได้", icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg> },
  { title: "รายงาน Realtime", desc: "ติดตามสถานะ SMS แบบเรียลไทม์ Export CSV ได้", icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg> },
];

const faqs = [
  { q: "ทดลองใช้ได้ไหม?", a: "สมัครฟรีวันนี้ ได้ 15 SMS ฟรีทดลองส่ง SMS ทันที ไม่ต้องซื้อแพ็กเกจ" },
  { q: "Sender name ใช้เวลาอนุมัตินานไหม?", a: "1-2 วันทำการ ระหว่างรออนุมัติสามารถใช้ชื่อ default ส่ง SMS ได้เลย" },
  { q: "ชำระเงินยังไง?", a: "รองรับโอนเงินผ่านธนาคาร, PromptPay QR Code — ยืนยันสลิปอัตโนมัติ" },
  { q: "เบอร์ถูก block ทำยังไง?", a: "ติดต่อทีม support เพื่อทำ whitelist ให้ฟรี" },
  { q: "API รองรับภาษาอะไร?", a: "RESTful API รองรับทุกภาษาโปรแกรม มี SDK สำหรับ Node.js, Python, PHP" },
];

const numericStats = [
  { num: 10, prefix: "", suffix: "M+", label: "SMS ส่งสำเร็จ" },
  { num: 500, prefix: "", suffix: "+", label: "ธุรกิจไว้วางใจ" },
  { num: 99.9, prefix: "", suffix: "%", label: "Uptime", decimals: 1 },
  { num: 3, prefix: "<", suffix: "s", label: "ส่งถึงปลายทาง" },
];

function fmt(n: number) { return n.toLocaleString("th-TH"); }

/* ─── Animated counter ─── */
function StatCounter({ num, prefix = "", suffix = "", decimals = 0 }: { num: number; prefix?: string; suffix?: string; decimals?: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) =>
    decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString()
  );
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      animate(count, num, { duration: 2, ease: "easeOut" });
    }
  }, [inView, count, num]);

  return (
    <span ref={ref} className="text-2xl sm:text-3xl font-bold gradient-text-mixed mb-1 block">
      {prefix}<motion.span>{rounded}</motion.span>{suffix}
    </span>
  );
}

/* ─── Main component ─── */
export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const { scrollY } = useScroll();
  const heroParallax = useTransform(scrollY, [0, 600], [0, -120]);

  return (
    <div className="min-h-screen relative scroll-smooth overflow-x-hidden">
      {/* Background grid */}
      <div className="fixed inset-0 grid-bg pointer-events-none" />

      {/* ─── NAV ─── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-white/[0.06] bg-[var(--bg-base)]/80 shadow-[0_4px_30px_rgba(0,0,0,0.3)]"
          : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[var(--accent)] transition-all group-hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.3" />
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="absolute inset-0 bg-[rgba(var(--accent-rgb),0.15)] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-bold gradient-text-mixed tracking-tight">SMSOK</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-[var(--text-secondary)]">
            {[{ href: "#why", label: "ทำไมต้องเรา" }, { href: "#features", label: "ฟีเจอร์" }, { href: "#pricing", label: "ราคา" }, { href: "#faq", label: "FAQ" }].map((item) => (
              <a key={item.href} href={item.href} className="relative hover:text-white transition-colors duration-300 py-1 group">
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-px bg-[var(--accent)] group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login" className="bg-transparent border border-[var(--border-default)] text-[var(--text-primary)] rounded-lg hover:border-[rgba(var(--accent-rgb),0.3)] hover:bg-[rgba(var(--accent-rgb),0.04)] cursor-pointer px-5 py-2 text-sm inline-block">เข้าสู่ระบบ</Link>
            <Link href="/register" className="btn-primary px-5 py-2 text-sm inline-block">สมัครฟรี</Link>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-[var(--text-secondary)] hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
            aria-label={mobileOpen ? "ปิดเมนู" : "เปิดเมนู"}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>}
            </svg>
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-white/5 bg-[var(--bg-base)]/95 px-4 py-4 flex flex-col gap-1 overflow-hidden"
            >
              {[{ href: "#why", label: "ทำไมต้องเรา" }, { href: "#features", label: "ฟีเจอร์" }, { href: "#pricing", label: "ราคา" }, { href: "#faq", label: "FAQ" }].map((item) => (
                <a key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="text-[var(--text-secondary)] hover:text-white py-3 px-3 transition-colors rounded-lg hover:bg-white/5 min-h-[44px] flex items-center">{item.label}</a>
              ))}
              <div className="flex gap-3 pt-3 mt-2 border-t border-white/5">
                <Link href="/login" className="bg-transparent border border-[var(--border-default)] text-[var(--text-primary)] rounded-lg hover:border-[rgba(var(--accent-rgb),0.3)] hover:bg-[rgba(var(--accent-rgb),0.04)] cursor-pointer px-4 py-3 text-sm flex-1 text-center min-h-[44px] flex items-center justify-center">เข้าสู่ระบบ</Link>
                <Link href="/register" className="btn-primary px-4 py-3 text-sm flex-1 text-center min-h-[44px] flex items-center justify-center">สมัครฟรี</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─── HERO ─── */}
      <section id="main-content" className="relative pt-32 sm:pt-40 pb-20 sm:pb-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">

          {/* Badge */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="inline-flex items-center gap-2 mb-6 sm:mb-8 px-4 py-1.5 rounded-full border border-[rgba(var(--accent-rgb),0.15)] bg-[rgba(var(--accent-rgb),0.06)]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
            <span className="text-[var(--accent)] text-xs sm:text-sm font-medium tracking-wide">ส่ง SMS ง่าย รวดเร็ว ราคาถูก</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-6 sm:mb-8"
          >
            <span className="text-white">แพลตฟอร์มส่ง</span>
            <br className="sm:hidden" />
            <span className="gradient-text-mixed"> SMS</span>
            <br />
            <span className="bg-gradient-to-r from-white/90 via-white/70 to-white/50 bg-clip-text text-transparent">ที่ธุรกิจไว้วางใจ</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 sm:mb-12 leading-relaxed px-2"
          >
            ส่ง SMS ผ่านเว็บหรือ API ได้ทันที ราคาเริ่มต้น ฿0.147/ข้อความ
            <br className="hidden sm:block" />
            <span className="sm:hidden"> — </span>
            สมัครวันนี้รับฟรี 15 SMS ฟรี
          </motion.p>

          {/* CTA */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-2 mb-12 sm:mb-16"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/register" className="btn-primary px-8 py-3.5 text-base rounded-lg w-full sm:w-auto text-center min-h-[48px] flex items-center justify-center gap-2 font-semibold">
                สมัครฟรี — รับ 15 SMS ฟรี
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <a href="#pricing" className="bg-transparent border border-[var(--border-default)] text-[var(--text-primary)] rounded-lg hover:border-[rgba(var(--accent-rgb),0.3)] hover:bg-[rgba(var(--accent-rgb),0.04)] cursor-pointer px-8 py-3.5 text-base rounded-lg w-full sm:w-auto text-center min-h-[48px] flex items-center justify-center font-medium">ดูราคา</a>
            </motion.div>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            transition={{ delayChildren: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-[var(--text-secondary)]"
          >
            {["ไม่มีค่าแรกเข้า", "เริ่มใช้ได้ทันที", "ซัพพอร์ต 24/7"].map((t) => (
              <motion.span key={t} variants={fadeUp} className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400"><polyline points="20 6 9 17 4 12" /></svg>
                {t}
              </motion.span>
            ))}
          </motion.div>

          {/* Stats bar */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.5 }}
            className="mt-16 sm:mt-20 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-1"
          >
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: false }}
              className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.04]"
            >
              {numericStats.map((s) => (
                <motion.div key={s.label} variants={scaleIn} className="px-4 py-5 sm:py-6 text-center">
                  <StatCounter num={s.num} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals} />
                  <div className="text-[11px] sm:text-xs text-[var(--text-secondary)] uppercase tracking-wider">{s.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Divider ─── */}
      <div className="relative h-px pointer-events-none mx-8 sm:mx-24">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(var(--accent-rgb),0.2)] to-transparent" />
      </div>

      {/* ─── WHY US ─── */}
      <motion.section
        id="why"
        variants={sectionVariants}
        initial="offscreen"
        whileInView="onscreen"
        viewport={{ once: false, amount: 0.15 }}
        className="py-20 sm:py-28 px-4 sm:px-6 scroll-mt-20 relative"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, margin: "-100px" }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-block text-xs font-semibold text-[var(--accent)] uppercase tracking-[0.2em] mb-3">Why Choose Us</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-[var(--text-primary)]">
              ทำไมต้อง <span className="gradient-text-mixed">SMSOK</span>?
            </h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto text-sm sm:text-base">บริการส่ง SMS ที่ครบทุกฟีเจอร์ ในราคาที่ถูกที่สุด</p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, margin: "-100px" }}
            className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 md:gap-5"
          >
            {benefits.map((b) => (
              <motion.div
                key={b.title}
                variants={fadeUp}
                whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(var(--accent-rgb),0.2)" }}
                className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg card-lift p-5 sm:p-6 text-center group"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-[rgba(var(--accent-rgb),0.08)] border border-[rgba(var(--accent-rgb),0.1)] flex items-center justify-center text-[var(--accent)] group-hover:text-[var(--accent-blue)] group-hover:bg-[rgba(var(--accent-rgb),0.12)] group-hover:border-[rgba(var(--accent-rgb),0.2)] group-hover:shadow-[0_0_20px_rgba(var(--accent-rgb),0.15)] transition-all duration-500">
                  {b.icon}
                </div>
                <h3 className="font-semibold text-white mb-1.5 text-xs sm:text-sm md:text-base">{b.title}</h3>
                <p className="text-[10px] sm:text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── Divider ─── */}
      <div className="relative h-px pointer-events-none mx-8 sm:mx-24">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(var(--accent-rgb),0.15)] to-transparent" />
      </div>

      {/* ─── FEATURES ─── */}
      <motion.section
        id="features"
        variants={sectionVariants}
        initial="offscreen"
        whileInView="onscreen"
        viewport={{ once: false, amount: 0.15 }}
        className="py-20 sm:py-28 px-4 sm:px-6 scroll-mt-20 relative"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, margin: "-100px" }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-block text-xs font-semibold text-[var(--accent)] uppercase tracking-[0.2em] mb-3">Features</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-[var(--text-primary)]">
              ฟีเจอร์<span className="neon-cyan">ครบ</span>ทุกความต้องการ
            </h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto text-sm sm:text-base">ไม่ว่าจะส่งผ่านเว็บหรือ API เรามีทุกอย่างที่คุณต้องการ</p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(var(--accent-rgb),0.15)" }}
                className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg card-lift p-6 sm:p-8 flex gap-5 group"
              >
                <div className="w-14 h-14 flex-shrink-0 rounded-lg bg-[rgba(var(--accent-rgb),0.08)] border border-[rgba(var(--accent-rgb),0.1)] flex items-center justify-center text-[var(--accent)] group-hover:text-[var(--accent-blue)] group-hover:bg-[rgba(var(--accent-rgb),0.12)] group-hover:border-[rgba(var(--accent-rgb),0.2)] group-hover:shadow-[0_0_20px_rgba(var(--accent-rgb),0.15)] transition-all duration-500">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base sm:text-lg mb-2">{f.title}</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed text-sm">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── Divider ─── */}
      <div className="relative h-px pointer-events-none mx-8 sm:mx-24">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(50,152,218,0.12)] to-transparent" />
      </div>

      {/* ─── CODE PREVIEW ─── */}
      <motion.section
        variants={sectionVariants}
        initial="offscreen"
        whileInView="onscreen"
        viewport={{ once: false, amount: 0.15 }}
        className="py-12 sm:py-16 px-4 sm:px-6"
      >
        <div className="max-w-3xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, margin: "-80px" }}
            className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04] bg-white/[0.02]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-[var(--text-secondary)] ml-2 font-mono">send-sms.js</span>
            </div>
            <div className="p-5 sm:p-6 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto">
              <div><span className="text-[var(--accent)]">const</span> <span className="text-[var(--accent)]">response</span> <span className="text-white/70">=</span> <span className="text-[var(--accent)]">await</span> <span className="text-emerald-400">fetch</span><span className="text-white/60">(</span></div>
              <div className="pl-4"><span className="text-amber-300">{`"https://api.smsok.com/v1/send"`}</span><span className="text-white/60">,</span></div>
              <div className="pl-4"><span className="text-white/60">{"{"}</span></div>
              <div className="pl-8"><span className="text-[var(--accent)]">method</span><span className="text-white/60">:</span> <span className="text-amber-300">{`"POST"`}</span><span className="text-white/60">,</span></div>
              <div className="pl-8"><span className="text-[var(--accent)]">headers</span><span className="text-white/60">:</span> <span className="text-white/60">{"{"}</span></div>
              <div className="pl-12"><span className="text-amber-300">{`"Authorization"`}</span><span className="text-white/60">:</span> <span className="text-amber-300">{`"Bearer \${API_KEY}"`}</span></div>
              <div className="pl-8"><span className="text-white/60">{"}"}</span><span className="text-white/60">,</span></div>
              <div className="pl-8"><span className="text-[var(--accent)]">body</span><span className="text-white/60">:</span> <span className="text-emerald-400">JSON</span><span className="text-white/60">.</span><span className="text-emerald-400">stringify</span><span className="text-white/60">({"{"}</span></div>
              <div className="pl-12"><span className="text-[var(--accent)]">to</span><span className="text-white/60">:</span> <span className="text-amber-300">{`"0891234567"`}</span><span className="text-white/60">,</span></div>
              <div className="pl-12"><span className="text-[var(--accent)]">message</span><span className="text-white/60">:</span> <span className="text-amber-300">{`"Your OTP is 1234"`}</span></div>
              <div className="pl-8"><span className="text-white/60">{"})"}</span></div>
              <div className="pl-4"><span className="text-white/60">{"}"}</span></div>
              <div><span className="text-white/60">)</span><span className="text-white/60">;</span></div>
              <div className="mt-2 text-[var(--text-secondary)]">{"// "}Response: {"{ status: 'sent', id: 'msg_abc123' }"}</div>
            </div>
          </motion.div>
          <p className="text-center text-[var(--text-secondary)] text-xs mt-4">ส่ง SMS ด้วยโค้ดแค่ไม่กี่บรรทัด</p>
        </div>
      </motion.section>

      {/* ─── Divider ─── */}
      <div className="relative h-px pointer-events-none mx-8 sm:mx-24">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(var(--accent-rgb),0.2)] to-transparent" />
      </div>

      {/* ─── PRICING ─── */}
      <motion.section
        id="pricing"
        variants={sectionVariants}
        initial="offscreen"
        whileInView="onscreen"
        viewport={{ once: false, amount: 0.1 }}
        className="py-20 sm:py-28 px-4 sm:px-6 scroll-mt-20 relative"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, margin: "-100px" }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-block text-xs font-semibold text-[var(--accent)] uppercase tracking-[0.2em] mb-3">Pricing</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-[var(--text-primary)]">
              เลือก<span className="gradient-text-mixed">แพ็กเกจ</span>ที่เหมาะกับคุณ
            </h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto text-sm sm:text-base">ยิ่งซื้อมาก ยิ่งถูก — โบนัสสูงสุด 50%</p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
          >
            {packages.map((pkg) => (
              <motion.div
                key={pkg.name}
                variants={scaleIn}
                whileHover={{ y: -6, boxShadow: pkg.best ? "0 20px 40px rgba(var(--accent-rgb),0.3)" : "0 20px 40px rgba(var(--accent-rgb),0.15)" }}
                className={`bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg card-lift p-5 sm:p-6 flex flex-col group relative ${
                  pkg.best ? "border-[rgba(var(--accent-rgb),0.3)] scale-[1.02] z-10" : ""
                }`}
              >
                {/* Best seller accent */}
                {pkg.best && (
                  <motion.div
                    className="absolute -inset-px rounded-lg pointer-events-none"
                    animate={{ boxShadow: ["0 0 20px rgba(var(--accent-rgb),0.3)", "0 0 40px rgba(var(--accent-rgb),0.6)", "0 0 20px rgba(var(--accent-rgb),0.3)"] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  />
                )}
                {pkg.best && (
                  <div className="absolute -inset-px rounded-lg bg-gradient-to-b from-[rgba(var(--accent-rgb),0.2)] via-transparent to-[rgba(var(--accent-rgb),0.1)] pointer-events-none" />
                )}

                {pkg.best && (
                  <div className="relative inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-3">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-[var(--accent)]">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    Best Seller
                  </div>
                )}

                <div className="relative">
                  <div className="text-sm text-[var(--text-secondary)] mb-1">SMSOK {pkg.name}</div>
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1 group-hover:text-[var(--accent)] transition-colors duration-300">
                    ฿{fmt(pkg.price)}
                  </div>
                  {pkg.bonus > 0 ? (
                    <div className="text-sm text-emerald-400 mb-4 flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      +{pkg.bonus}% โบนัส
                    </div>
                  ) : <div className="mb-4" />}

                  <div className="space-y-2.5 text-sm text-[var(--text-secondary)] flex-1">
                    <div className="flex justify-between"><span>SMS</span><span className="text-[var(--text-primary)] font-medium">{fmt(pkg.sms)}</span></div>
                    <div className="flex justify-between"><span>ราคา/SMS</span><span className="text-[var(--text-primary)] font-medium">฿{pkg.cost}</span></div>
                    <div className="flex justify-between"><span>Sender Names</span><span className="text-[var(--text-primary)] font-medium">{pkg.senders === -1 ? "ไม่จำกัด" : pkg.senders}</span></div>
                    <div className="flex justify-between"><span>ระยะเวลา</span><span className="text-[var(--text-primary)] font-medium">{pkg.duration}</span></div>
                  </div>

                  <Link
                    href="/register"
                    className={`mt-6 w-full py-3 rounded-lg font-semibold text-sm transition-all text-center min-h-[44px] flex items-center justify-center gap-2 ${pkg.best ? "btn-primary" : "bg-transparent border border-[var(--border-default)] text-[var(--text-primary)] rounded-lg hover:border-[rgba(var(--accent-rgb),0.3)] hover:bg-[rgba(var(--accent-rgb),0.04)] cursor-pointer"}`}
                  >
                    เลือกแพ็กเกจ
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── Divider ─── */}
      <div className="relative h-px pointer-events-none mx-8 sm:mx-24">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(50,152,218,0.15)] to-transparent" />
      </div>

      {/* ─── CTA ─── */}
      <motion.section
        variants={sectionVariants}
        initial="offscreen"
        whileInView="onscreen"
        viewport={{ once: false, amount: 0.2 }}
        className="py-16 sm:py-20 px-4 sm:px-6"
      >
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, margin: "-80px" }}
          className="max-w-4xl mx-auto bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-10 sm:p-14 text-center relative animate-breathe"
        >
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[rgba(var(--accent-rgb),0.05)] to-[rgba(50,152,218,0.03)] pointer-events-none" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-[var(--text-primary)]">ต้องการแพ็กเกจพิเศษ?</h2>
            <p className="text-[var(--text-secondary)] mb-8 text-sm sm:text-base max-w-lg mx-auto">
              สำหรับธุรกิจที่ส่ง SMS มากกว่า 1 ล้านข้อความ/เดือน ติดต่อเราเพื่อรับราคาพิเศษ
            </p>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(var(--accent-rgb),0.4)" }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary px-8 py-3.5 text-base rounded-lg cursor-pointer min-h-[48px] inline-flex items-center gap-2 font-semibold"
            >
              ติดต่อฝ่ายขาย
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </motion.button>
          </div>
        </motion.div>
      </motion.section>

      {/* ─── Divider ─── */}
      <div className="relative h-px pointer-events-none mx-8 sm:mx-24">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(var(--accent-rgb),0.15)] to-transparent" />
      </div>

      {/* ─── HOW IT WORKS ─── */}
      <motion.section
        variants={sectionVariants}
        initial="offscreen"
        whileInView="onscreen"
        viewport={{ once: false, amount: 0.15 }}
        className="py-20 sm:py-28 px-4 sm:px-6 relative"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, margin: "-100px" }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-block text-xs font-semibold text-[var(--accent)] uppercase tracking-[0.2em] mb-3">How it Works</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-[var(--text-primary)]">
              เริ่มต้นใช้งานใน <span className="gradient-text-mixed">3 ขั้นตอน</span>
            </h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto text-sm sm:text-base">สมัคร → ตั้งค่า → เริ่มส่ง</p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative"
          >
            {/* Dashed connector line (desktop only) */}
            <div className="hidden md:block absolute top-[72px] left-[16.67%] right-[16.67%] h-px border-t-2 border-dashed border-[rgba(var(--accent-rgb),0.2)] pointer-events-none" />

            {[
              {
                step: 1,
                title: "สมัครสมาชิก",
                desc: "สมัครฟรี ได้ 15 SMS ทดลองใช้ทันที",
                icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>,
              },
              {
                step: 2,
                title: "ตั้งค่า Sender Name",
                desc: "ขอชื่อผู้ส่ง อนุมัติภายใน 1-2 วัน",
                icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>,
              },
              {
                step: 3,
                title: "ส่ง SMS",
                desc: "ส่งผ่านเว็บหรือ API ได้ทันที",
                icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>,
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(var(--accent-rgb),0.15)" }}
                className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg card-lift p-6 sm:p-8 text-center group relative"
              >
                {/* Step number badge */}
                <div className="w-10 h-10 mx-auto mb-5 rounded-full bg-[rgba(var(--accent-rgb),0.12)] border border-[rgba(var(--accent-rgb),0.2)] flex items-center justify-center text-[var(--accent)] font-bold text-lg relative z-10">
                  {item.step}
                </div>
                <div className="w-14 h-14 mx-auto mb-4 rounded-lg bg-[rgba(var(--accent-rgb),0.08)] border border-[rgba(var(--accent-rgb),0.1)] flex items-center justify-center text-[var(--accent)] group-hover:text-[var(--accent-blue)] group-hover:bg-[rgba(var(--accent-rgb),0.12)] group-hover:border-[rgba(var(--accent-rgb),0.2)] group-hover:shadow-[0_0_20px_rgba(var(--accent-rgb),0.15)] transition-all duration-500">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-white text-base sm:text-lg mb-2">{item.title}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── Divider ─── */}
      <div className="relative h-px pointer-events-none mx-8 sm:mx-24">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(50,152,218,0.12)] to-transparent" />
      </div>

      {/* ─── USE CASES ─── */}
      <motion.section
        variants={sectionVariants}
        initial="offscreen"
        whileInView="onscreen"
        viewport={{ once: false, amount: 0.15 }}
        className="py-20 sm:py-28 px-4 sm:px-6 relative"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, margin: "-100px" }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-block text-xs font-semibold text-[var(--accent)] uppercase tracking-[0.2em] mb-3">Use Cases</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-[var(--text-primary)]">
              ใช้ได้กับ<span className="gradient-text-mixed">ทุกธุรกิจ</span>
            </h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto text-sm sm:text-base">ไม่ว่าจะ OTP, การตลาด หรือแจ้งเตือน</p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5"
          >
            {[
              {
                title: "OTP / ยืนยันตัวตน",
                desc: "ส่ง OTP ยืนยันตัวตนได้ภายใน 3 วินาที API พร้อมใช้",
                icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>,
              },
              {
                title: "แคมเปญการตลาด",
                desc: "ส่ง SMS โปรโมชั่นถึงลูกค้าหลักหมื่นในคลิกเดียว",
                icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /><path d="M3 11l2-2 2 2" /><path d="M17 11l2-2 2 2" /></svg>,
              },
              {
                title: "แจ้งเตือนอัตโนมัติ",
                desc: "แจ้งสถานะคำสั่งซื้อ นัดหมาย การชำระเงิน",
                icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>,
              },
              {
                title: "Transactional SMS",
                desc: "ส่งข้อมูลธุรกรรม ใบเสร็จ ยืนยันการจอง",
                icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(var(--accent-rgb),0.15)" }}
                className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg card-lift p-6 sm:p-8 flex gap-5 group"
              >
                <div className="w-14 h-14 flex-shrink-0 rounded-lg bg-[rgba(var(--accent-rgb),0.08)] border border-[rgba(var(--accent-rgb),0.1)] flex items-center justify-center text-[var(--accent)] group-hover:text-[var(--accent-blue)] group-hover:bg-[rgba(var(--accent-rgb),0.12)] group-hover:border-[rgba(var(--accent-rgb),0.2)] group-hover:shadow-[0_0_20px_rgba(var(--accent-rgb),0.15)] transition-all duration-500">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base sm:text-lg mb-2">{item.title}</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed text-sm">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── Divider ─── */}
      <div className="relative h-px pointer-events-none mx-8 sm:mx-24">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(var(--accent-rgb),0.2)] to-transparent" />
      </div>

      {/* ─── SOCIAL PROOF ─── */}
      <motion.section
        variants={sectionVariants}
        initial="offscreen"
        whileInView="onscreen"
        viewport={{ once: false, amount: 0.15 }}
        className="py-20 sm:py-28 px-4 sm:px-6 relative"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, margin: "-100px" }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-block text-xs font-semibold text-[var(--accent)] uppercase tracking-[0.2em] mb-3">Testimonials</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-[var(--text-primary)]">
              ลูกค้า<span className="gradient-text-mixed">พูดถึงเรา</span>
            </h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto text-sm sm:text-base">ธุรกิจกว่า 500+ รายไว้วางใจ SMSOK</p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5"
          >
            {[
              {
                name: "สมชาย ว.",
                company: "ABC Clinic",
                initials: "ส",
                quote: "ใช้ SMSOK ส่งนัดหมายผู้ป่วย ลดอัตราขาดนัดลง 40% ราคาถูกกว่าที่อื่นมาก",
              },
              {
                name: "ปวีณา ก.",
                company: "ShopThai Online",
                initials: "ป",
                quote: "API เชื่อมต่อง่ายมาก ทีม dev ใช้เวลาแค่ 2 ชั่วโมงก็ integrate เสร็จ",
              },
              {
                name: "วิชัย ส.",
                company: "FastPay Fintech",
                initials: "ว",
                quote: "OTP ส่งถึงภายใน 2-3 วินาที Uptime 99.9% ไม่เคยมีปัญหา",
              },
            ].map((t) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(var(--accent-rgb),0.15)" }}
                className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg card-lift p-6 sm:p-8 group backdrop-blur-sm"
              >
                {/* Quote icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-[rgba(var(--accent-rgb),0.2)] mb-4">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10H0z" />
                </svg>
                <p className="text-[var(--text-secondary)] leading-relaxed text-sm sm:text-base mb-6">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[rgba(var(--accent-rgb),0.12)] border border-[rgba(var(--accent-rgb),0.2)] flex items-center justify-center text-[var(--accent)] font-bold text-sm">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">{t.name}</div>
                    <div className="text-[var(--text-secondary)] text-xs">{t.company}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── Divider ─── */}
      <div className="relative h-px pointer-events-none mx-8 sm:mx-24">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(50,152,218,0.15)] to-transparent" />
      </div>

      {/* ─── FAQ ─── */}
      <motion.section
        id="faq"
        variants={sectionVariants}
        initial="offscreen"
        whileInView="onscreen"
        viewport={{ once: false, amount: 0.15 }}
        className="py-20 sm:py-28 px-4 sm:px-6 scroll-mt-20"
      >
        <div className="max-w-3xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, margin: "-100px" }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-block text-xs font-semibold text-[var(--accent)] uppercase tracking-[0.2em] mb-3">FAQ</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">คำถาม<span className="neon-cyan">ที่พบบ่อย</span></h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, margin: "-80px" }}
            className="space-y-3"
          >
            {faqs.map((faq, i) => (
              <motion.div
                key={faq.q}
                variants={fadeUp}
                className={`bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg transition-all duration-400 ${openFaq === i ? "border-[rgba(var(--accent-rgb),0.25)] shadow-[0_0_30px_rgba(var(--accent-rgb),0.06)]" : ""}`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-5 sm:p-6 cursor-pointer font-semibold text-white flex items-center justify-between text-left gap-4 min-h-[56px]"
                  aria-expanded={openFaq === i}
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  <motion.span
                    animate={{ rotate: openFaq === i ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={`w-6 h-6 flex-shrink-0 rounded-full border border-white/10 flex items-center justify-center text-[var(--accent)]/50 text-sm ${openFaq === i ? "border-[rgba(var(--accent-rgb),0.3)] bg-[rgba(var(--accent-rgb),0.1)]" : ""}`}
                  >
                    +
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-[var(--text-secondary)] leading-relaxed text-sm sm:text-base">{faq.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── Divider ─── */}
      <div className="relative h-px pointer-events-none mx-8 sm:mx-24">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(var(--accent-rgb),0.1)] to-transparent" />
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/[0.04] py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 sm:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[var(--accent)]">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.3" />
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-lg font-bold gradient-text-mixed">SMSOK</span>
              </Link>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">แพลตฟอร์มส่ง SMS ที่ธุรกิจไว้วางใจ ราคาถูก ส่งเร็ว ซัพพอร์ต 24/7</p>
            </div>
            {[
              { title: "Product", links: [{ href: "#features", label: "ฟีเจอร์" }, { href: "#pricing", label: "ราคา" }, { href: "/register", label: "สมัครฟรี" }, { href: "/docs", label: "API Docs" }] },
              { title: "Company", links: [{ href: "/about", label: "เกี่ยวกับเรา" }, { href: "/blog", label: "บล็อก" }, { href: "mailto:support@smsok.com", label: "ติดต่อเรา" }, { href: "/careers", label: "ร่วมงานกับเรา" }] },
              { title: "Legal", links: [{ href: "/terms", label: "เงื่อนไขการใช้งาน" }, { href: "/privacy", label: "นโยบายความเป็นส่วนตัว" }, { href: "/sla", label: "SLA" }, { href: "/privacy#pdpa", label: "PDPA" }] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">{col.title}</h4>
                <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
                  {col.links.map((l) => (
                    <li key={l.label}><a href={l.href} className="hover:text-white/70 transition-colors">{l.label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/[0.04] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs sm:text-sm text-[var(--text-secondary)]">&copy; 2026 SMSOK — SMS Sending Platform</div>
            <div className="flex items-center gap-4">
              {[
                { label: "LINE", href: "https://line.me/ti/p/@smsok", path: "M12 2C6.48 2 2 5.81 2 10.41c0 4.15 3.68 7.63 8.65 8.28.34.07.8.22.91.51.1.26.07.67.03.93l-.15.87c-.04.25-.2.98.87.53s5.8-3.41 7.9-5.84C22.15 13.59 22 12.03 22 10.41 22 5.81 17.52 2 12 2z" },
                { label: "Facebook", href: "https://facebook.com/smsok", path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
                { label: "X", href: "https://x.com/smsok", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
              ].map((s) => (
                <motion.a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.2, color: "var(--accent)" }} className="text-[var(--text-secondary)] transition-colors p-1" aria-label={s.label}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d={s.path} /></svg>
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
