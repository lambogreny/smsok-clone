"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const packages = [
  { name: "A", price: 500, bonus: 0, total: 500, sms: 2273, cost: "0.220", senders: 5, duration: "6 เดือน", best: false },
  { name: "B", price: 1000, bonus: 10, total: 1100, sms: 5000, cost: "0.200", senders: 10, duration: "12 เดือน", best: false },
  { name: "C", price: 10000, bonus: 15, total: 11500, sms: 52273, cost: "0.191", senders: 15, duration: "24 เดือน", best: true },
  { name: "D", price: 50000, bonus: 20, total: 60000, sms: 272727, cost: "0.183", senders: 20, duration: "24 เดือน", best: false },
  { name: "E", price: 100000, bonus: 25, total: 125000, sms: 568182, cost: "0.176", senders: -1, duration: "36 เดือน", best: false },
  { name: "F", price: 300000, bonus: 30, total: 390000, sms: 1772727, cost: "0.169", senders: -1, duration: "36 เดือน", best: false },
  { name: "G", price: 500000, bonus: 40, total: 700000, sms: 3181818, cost: "0.157", senders: -1, duration: "36 เดือน", best: false },
  { name: "H", price: 1000000, bonus: 50, total: 1500000, sms: 6818182, cost: "0.147", senders: -1, duration: "36 เดือน", best: false },
];

const benefits = [
  {
    title: "ราคาถูกที่สุด",
    desc: "เริ่มต้นเพียง ฿0.147/SMS",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><text x="12" y="16" textAnchor="middle" fill="currentColor" stroke="none" fontSize="12" fontWeight="bold">฿</text>
      </svg>
    ),
  },
  {
    title: "ส่งเร็วทันใจ",
    desc: "ส่งถึงปลายทางภายใน 3 วินาที",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    title: "ทดลองฟรี",
    desc: "สมัครวันนี้รับฟรี 500 เครดิต",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" />
        <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
      </svg>
    ),
  },
  {
    title: "ซัพพอร์ต 24/7",
    desc: "ทีมงานพร้อมช่วยเหลือตลอด",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: "SMS API",
    desc: "เชื่อมต่อง่ายด้วย RESTful API",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
];

const features = [
  {
    title: "ส่ง SMS ผ่านเว็บ",
    desc: "พิมพ์ข้อความ เลือกเบอร์ กดส่ง — ง่ายแค่นั้น",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
  },
  {
    title: "SMS API",
    desc: "RESTful API พร้อม SDK สำหรับ Node.js, Python, PHP",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    title: "สมุดโทรศัพท์",
    desc: "จัดการรายชื่อ กลุ่ม นำเข้า CSV ได้",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  },
  {
    title: "รายงาน Realtime",
    desc: "ติดตามสถานะ SMS แบบเรียลไทม์ Export CSV ได้",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

const faqs = [
  { q: "ทดลองใช้ได้ไหม?", a: "สมัครฟรีวันนี้ ได้ 500 เครดิตทดลองส่ง SMS ทันที ไม่ต้องเติมเงิน" },
  { q: "Sender name ใช้เวลาอนุมัตินานไหม?", a: "1-2 วันทำการ ระหว่างรออนุมัติสามารถใช้ชื่อ default ส่ง SMS ได้เลย" },
  { q: "ชำระเงินยังไง?", a: "รองรับโอนเงินผ่านธนาคาร, PromptPay QR Code — ยืนยันสลิปอัตโนมัติ" },
  { q: "เบอร์ถูก block ทำยังไง?", a: "ติดต่อทีม support เพื่อทำ whitelist ให้ฟรี" },
  { q: "API รองรับภาษาอะไร?", a: "RESTful API รองรับทุกภาษาโปรแกรม มี SDK สำหรับ Node.js, Python, PHP" },
];

const stats = [
  { value: "10M+", label: "SMS ส่งสำเร็จ" },
  { value: "500+", label: "ธุรกิจไว้วางใจ" },
  { value: "99.9%", label: "Uptime" },
  { value: "<3s", label: "ส่งถึงปลายทาง" },
];

function fmt(n: number) {
  return n.toLocaleString("th-TH");
}

/* Animated counter hook */
function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return { count, start: () => setStarted(true) };
}

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="min-h-screen relative scroll-smooth overflow-x-hidden">
      {/* === BACKGROUND LAYERS === */}
      {/* Grid */}
      <div className="fixed inset-0 grid-bg pointer-events-none" />

      {/* Ambient orbs */}
      <div className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[1000px] h-[800px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(14,165,233,0.15) 0%, rgba(139,92,246,0.05) 40%, transparent 70%)" }} />
      <div className="fixed top-[30%] right-[-200px] w-[600px] h-[600px] rounded-full pointer-events-none animate-float"
        style={{ background: "radial-gradient(circle, rgba(129,140,248,0.1) 0%, transparent 70%)" }} />
      <div className="fixed bottom-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)", animationDelay: "3s" }} />

      {/* === NAV === */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-2xl border-b border-white/[0.06] bg-[#040810]/80 shadow-[0_4px_30px_rgba(0,0,0,0.3)]"
          : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-violet-400 transition-all group-hover:drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.3" />
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="absolute inset-0 bg-violet-400/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-bold gradient-text-mixed tracking-tight">SMSOK</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-white/40">
            {[
              { href: "#why", label: "ทำไมต้องเรา" },
              { href: "#features", label: "ฟีเจอร์" },
              { href: "#pricing", label: "ราคา" },
              { href: "#faq", label: "FAQ" },
            ].map((item) => (
              <a key={item.href} href={item.href} className="relative hover:text-white transition-colors duration-300 py-1 group">
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-px bg-violet-400 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="btn-glass px-5 py-2 text-sm inline-block">เข้าสู่ระบบ</Link>
            <Link href="/register" className="btn-primary px-5 py-2 text-sm inline-block">สมัครฟรี</Link>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-white/60 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
            aria-label={mobileOpen ? "ปิดเมนู" : "เปิดเมนู"}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#040810]/95 backdrop-blur-2xl px-4 py-4 flex flex-col gap-1 animate-fade-in">
            <a href="#why" onClick={() => setMobileOpen(false)} className="text-white/60 hover:text-white py-3 px-3 transition-colors rounded-lg hover:bg-white/5 min-h-[44px] flex items-center">ทำไมต้องเรา</a>
            <a href="#features" onClick={() => setMobileOpen(false)} className="text-white/60 hover:text-white py-3 px-3 transition-colors rounded-lg hover:bg-white/5 min-h-[44px] flex items-center">ฟีเจอร์</a>
            <a href="#pricing" onClick={() => setMobileOpen(false)} className="text-white/60 hover:text-white py-3 px-3 transition-colors rounded-lg hover:bg-white/5 min-h-[44px] flex items-center">ราคา</a>
            <a href="#faq" onClick={() => setMobileOpen(false)} className="text-white/60 hover:text-white py-3 px-3 transition-colors rounded-lg hover:bg-white/5 min-h-[44px] flex items-center">FAQ</a>
            <div className="flex gap-3 pt-3 mt-2 border-t border-white/5">
              <Link href="/login" className="btn-glass px-4 py-3 text-sm flex-1 text-center min-h-[44px] flex items-center justify-center">เข้าสู่ระบบ</Link>
              <Link href="/register" className="btn-primary px-4 py-3 text-sm flex-1 text-center min-h-[44px] flex items-center justify-center">สมัครฟรี</Link>
            </div>
          </div>
        )}
      </nav>

      {/* === HERO === */}
      <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="animate-fade-in inline-flex items-center gap-2 mb-6 sm:mb-8 px-4 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/[0.06]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-glow-pulse" />
            <span className="text-cyan-300 text-xs sm:text-sm font-medium tracking-wide">ส่ง SMS ง่าย รวดเร็ว ราคาถูก</span>
          </div>

          {/* Heading */}
          <h1 className="animate-fade-in text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-6 sm:mb-8" style={{ animationDelay: "0.1s" }}>
            <span className="text-white">แพลตฟอร์มส่ง</span>
            <br className="sm:hidden" />
            <span className="gradient-text-mixed"> SMS</span>
            <br />
            <span className="bg-gradient-to-r from-white/90 via-white/70 to-white/50 bg-clip-text text-transparent">ที่ธุรกิจไว้วางใจ</span>
          </h1>

          {/* Subheading */}
          <p className="animate-fade-in text-base sm:text-lg md:text-xl text-white/40 max-w-2xl mx-auto mb-10 sm:mb-12 leading-relaxed px-2" style={{ animationDelay: "0.2s" }}>
            ส่ง SMS ผ่านเว็บหรือ API ได้ทันที ราคาเริ่มต้น ฿0.147/ข้อความ
            <br className="hidden sm:block" />
            <span className="sm:hidden"> — </span>
            สมัครวันนี้รับฟรี 500 เครดิต
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-2 mb-12 sm:mb-16" style={{ animationDelay: "0.3s" }}>
            <Link href="/register" className="btn-primary px-8 py-3.5 text-base rounded-xl w-full sm:w-auto text-center min-h-[48px] flex items-center justify-center gap-2 font-semibold">
              สมัครฟรี — รับ 500 เครดิต
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <a href="#pricing" className="btn-glass px-8 py-3.5 text-base rounded-xl w-full sm:w-auto text-center min-h-[48px] flex items-center justify-center font-medium">ดูราคา</a>
          </div>

          {/* Trust badges */}
          <div className="animate-fade-in flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-white/25" style={{ animationDelay: "0.4s" }}>
            {["ไม่มีค่าแรกเข้า", "เริ่มใช้ได้ทันที", "ซัพพอร์ต 24/7"].map((t) => (
              <span key={t} className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400/60">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {t}
              </span>
            ))}
          </div>

          {/* === STATS BAR === */}
          <div className="animate-fade-in mt-16 sm:mt-20 glass p-1" style={{ animationDelay: "0.5s" }}>
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.04]">
              {stats.map((s) => (
                <div key={s.label} className="px-4 py-5 sm:py-6 text-center group">
                  <div className="text-2xl sm:text-3xl font-bold gradient-text-mixed mb-1 group-hover:scale-110 transition-transform">{s.value}</div>
                  <div className="text-[11px] sm:text-xs text-white/30 uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* === WHY US === */}
      <section id="why" className="py-20 sm:py-28 px-4 sm:px-6 scroll-mt-20 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block text-xs font-semibold text-violet-400/60 uppercase tracking-[0.2em] mb-3">Why Choose Us</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              ทำไมต้อง <span className="gradient-text-mixed">SMSOK</span>?
            </h2>
            <p className="text-white/35 max-w-xl mx-auto text-sm sm:text-base">บริการส่ง SMS ที่ครบทุกฟีเจอร์ ในราคาที่ถูกที่สุด</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
            {benefits.map((b, i) => (
              <div
                key={b.title}
                className="glass card-glow p-5 sm:p-6 text-center group animate-fade-in"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-violet-500/[0.08] border border-violet-500/10 flex items-center justify-center text-violet-400/70 group-hover:text-cyan-300 group-hover:bg-violet-500/[0.12] group-hover:border-violet-500/20 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] transition-all duration-500">
                  {b.icon}
                </div>
                <h3 className="font-semibold text-white mb-1.5 text-xs sm:text-sm md:text-base">{b.title}</h3>
                <p className="text-[10px] sm:text-xs md:text-sm text-white/30 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === FEATURES === */}
      <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 scroll-mt-20 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block text-xs font-semibold text-cyan-400/60 uppercase tracking-[0.2em] mb-3">Features</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              ฟีเจอร์<span className="neon-violet">ครบ</span>ทุกความต้องการ
            </h2>
            <p className="text-white/35 max-w-xl mx-auto text-sm sm:text-base">ไม่ว่าจะส่งผ่านเว็บหรือ API เรามีทุกอย่างที่คุณต้องการ</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="glass card-glow p-6 sm:p-8 flex gap-5 group animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-cyan-500/[0.08] border border-cyan-500/10 flex items-center justify-center text-cyan-400/60 group-hover:text-indigo-300 group-hover:bg-cyan-500/[0.12] group-hover:border-cyan-500/20 group-hover:shadow-[0_0_20px_rgba(129,140,248,0.15)] transition-all duration-500">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base sm:text-lg mb-2">{f.title}</h3>
                  <p className="text-white/35 leading-relaxed text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === CODE PREVIEW === */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="glass overflow-hidden">
            {/* Terminal header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04] bg-white/[0.02]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-white/20 ml-2 font-mono">send-sms.js</span>
            </div>
            {/* Code */}
            <div className="p-5 sm:p-6 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto">
              <div><span className="text-cyan-400">const</span> <span className="text-cyan-300">response</span> <span className="text-white/50">=</span> <span className="text-cyan-400">await</span> <span className="text-emerald-400">fetch</span><span className="text-white/40">(</span></div>
              <div className="pl-4"><span className="text-amber-300">{`"https://api.smsok.com/v1/send"`}</span><span className="text-white/40">,</span></div>
              <div className="pl-4"><span className="text-white/40">{"{"}</span></div>
              <div className="pl-8"><span className="text-cyan-300">method</span><span className="text-white/40">:</span> <span className="text-amber-300">{`"POST"`}</span><span className="text-white/40">,</span></div>
              <div className="pl-8"><span className="text-cyan-300">headers</span><span className="text-white/40">:</span> <span className="text-white/40">{"{"}</span></div>
              <div className="pl-12"><span className="text-amber-300">{`"Authorization"`}</span><span className="text-white/40">:</span> <span className="text-amber-300">{`"Bearer \${API_KEY}"`}</span></div>
              <div className="pl-8"><span className="text-white/40">{"}"}</span><span className="text-white/40">,</span></div>
              <div className="pl-8"><span className="text-cyan-300">body</span><span className="text-white/40">:</span> <span className="text-emerald-400">JSON</span><span className="text-white/40">.</span><span className="text-emerald-400">stringify</span><span className="text-white/40">({"{"}</span></div>
              <div className="pl-12"><span className="text-cyan-300">to</span><span className="text-white/40">:</span> <span className="text-amber-300">{`"0891234567"`}</span><span className="text-white/40">,</span></div>
              <div className="pl-12"><span className="text-cyan-300">message</span><span className="text-white/40">:</span> <span className="text-amber-300">{`"Your OTP is 1234"`}</span></div>
              <div className="pl-8"><span className="text-white/40">{"})"}</span></div>
              <div className="pl-4"><span className="text-white/40">{"}"}</span></div>
              <div><span className="text-white/40">)</span><span className="text-white/40">;</span></div>
              <div className="mt-2 text-white/20">{"// "}Response: {"{ status: 'sent', id: 'msg_abc123' }"}</div>
            </div>
          </div>
          <p className="text-center text-white/20 text-xs mt-4">ส่ง SMS ด้วยโค้ดแค่ไม่กี่บรรทัด</p>
        </div>
      </section>

      {/* === PRICING === */}
      <section id="pricing" className="py-20 sm:py-28 px-4 sm:px-6 scroll-mt-20 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block text-xs font-semibold text-violet-400/60 uppercase tracking-[0.2em] mb-3">Pricing</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              เลือก<span className="gradient-text-mixed">แพ็กเกจ</span>ที่เหมาะกับคุณ
            </h2>
            <p className="text-white/35 max-w-xl mx-auto text-sm sm:text-base">ยิ่งซื้อมาก ยิ่งถูก — โบนัสสูงสุด 50%</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {packages.map((pkg, i) => (
              <div
                key={pkg.name}
                className={`glass card-glow p-5 sm:p-6 flex flex-col group relative animate-fade-in ${
                  pkg.best
                    ? "border-sky-400/30 shadow-[0_0_60px_rgba(139,92,246,0.12)] scale-[1.02] z-10"
                    : ""
                }`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                {/* Best seller glow */}
                {pkg.best && (
                  <div className="absolute -inset-px rounded-[16px] bg-gradient-to-b from-sky-400/20 via-transparent to-cyan-400/10 pointer-events-none" />
                )}

                {pkg.best && (
                  <div className="relative inline-flex items-center gap-1.5 text-xs font-bold text-violet-400 uppercase tracking-wider mb-3">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-violet-400">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    Best Seller
                  </div>
                )}

                <div className="relative">
                  <div className="text-sm text-white/30 mb-1">SMSOK {pkg.name}</div>
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1 group-hover:text-cyan-200 transition-colors duration-300">
                    ฿{fmt(pkg.price)}
                  </div>
                  {pkg.bonus > 0 ? (
                    <div className="text-sm text-emerald-400 mb-4 flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      +{pkg.bonus}% โบนัส
                    </div>
                  ) : (
                    <div className="mb-4" />
                  )}

                  <div className="space-y-2.5 text-sm text-white/40 flex-1">
                    <div className="flex justify-between">
                      <span>SMS</span>
                      <span className="text-white/80 font-medium">{fmt(pkg.sms)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ราคา/SMS</span>
                      <span className="text-white/80 font-medium">฿{pkg.cost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sender Names</span>
                      <span className="text-white/80 font-medium">{pkg.senders === -1 ? "ไม่จำกัด" : pkg.senders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ระยะเวลา</span>
                      <span className="text-white/80 font-medium">{pkg.duration}</span>
                    </div>
                  </div>

                  <Link
                    href="/register"
                    className={`mt-6 w-full py-3 rounded-xl font-semibold text-sm transition-all text-center min-h-[44px] flex items-center justify-center gap-2 ${
                      pkg.best ? "btn-primary" : "btn-glass"
                    }`}
                  >
                    เลือกแพ็กเกจ
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === CTA === */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto glass p-10 sm:p-14 text-center relative animate-breathe">
          {/* Background glow */}
          <div className="absolute inset-0 rounded-[16px] bg-gradient-to-br from-violet-500/[0.05] to-cyan-500/[0.03] pointer-events-none" />

          <div className="relative">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">ต้องการแพ็กเกจพิเศษ?</h2>
            <p className="text-white/35 mb-8 text-sm sm:text-base max-w-lg mx-auto">
              สำหรับธุรกิจที่ส่ง SMS มากกว่า 1 ล้านข้อความ/เดือน ติดต่อเราเพื่อรับราคาพิเศษ
            </p>
            <button className="btn-primary px-8 py-3.5 text-base rounded-xl cursor-pointer min-h-[48px] inline-flex items-center gap-2 font-semibold">
              ติดต่อฝ่ายขาย
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* === FAQ === */}
      <section id="faq" className="py-20 sm:py-28 px-4 sm:px-6 scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block text-xs font-semibold text-cyan-400/60 uppercase tracking-[0.2em] mb-3">FAQ</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              คำถาม<span className="neon-violet">ที่พบบ่อย</span>
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={faq.q}
                className={`glass transition-all duration-400 ${
                  openFaq === i ? "border-violet-500/25 shadow-[0_0_30px_rgba(139,92,246,0.06)]" : ""
                }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-5 sm:p-6 cursor-pointer font-semibold text-white flex items-center justify-between text-left gap-4 min-h-[56px]"
                  aria-expanded={openFaq === i}
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  <span className={`w-6 h-6 flex-shrink-0 rounded-full border border-white/10 flex items-center justify-center text-violet-400/50 text-sm transition-all duration-300 ${
                    openFaq === i ? "rotate-45 border-violet-500/30 bg-violet-500/10" : ""
                  }`}>+</span>
                </button>
                <div
                  className="overflow-hidden transition-all duration-400 ease-in-out"
                  style={{ maxHeight: openFaq === i ? "200px" : "0px", opacity: openFaq === i ? 1 : 0 }}
                >
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-white/40 leading-relaxed text-sm sm:text-base">{faq.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="border-t border-white/[0.04] py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 sm:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-violet-400">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.3" />
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-lg font-bold gradient-text-mixed">SMSOK</span>
              </Link>
              <p className="text-xs sm:text-sm text-white/25 leading-relaxed">แพลตฟอร์มส่ง SMS ที่ธุรกิจไว้วางใจ ราคาถูก ส่งเร็ว ซัพพอร์ต 24/7</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-white/25">
                <li><a href="#features" className="hover:text-white/70 transition-colors">ฟีเจอร์</a></li>
                <li><a href="#pricing" className="hover:text-white/70 transition-colors">ราคา</a></li>
                <li><Link href="/register" className="hover:text-white/70 transition-colors">สมัครฟรี</Link></li>
                <li><a href="#" className="hover:text-white/70 transition-colors">API Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-white/25">
                <li><a href="#" className="hover:text-white/70 transition-colors">เกี่ยวกับเรา</a></li>
                <li><a href="#" className="hover:text-white/70 transition-colors">บล็อก</a></li>
                <li><a href="#" className="hover:text-white/70 transition-colors">ติดต่อเรา</a></li>
                <li><a href="#" className="hover:text-white/70 transition-colors">ร่วมงานกับเรา</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-white/25">
                <li><a href="#" className="hover:text-white/70 transition-colors">เงื่อนไขการใช้งาน</a></li>
                <li><a href="#" className="hover:text-white/70 transition-colors">นโยบายความเป็นส่วนตัว</a></li>
                <li><a href="#" className="hover:text-white/70 transition-colors">SLA</a></li>
                <li><a href="#" className="hover:text-white/70 transition-colors">PDPA</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/[0.04] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs sm:text-sm text-white/15">&copy; 2026 SMSOK — SMS Sending Platform</div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-white/15 hover:text-violet-400 transition-colors p-1" aria-label="LINE">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 5.81 2 10.41c0 4.15 3.68 7.63 8.65 8.28.34.07.8.22.91.51.1.26.07.67.03.93l-.15.87c-.04.25-.2.98.87.53s5.8-3.41 7.9-5.84C22.15 13.59 22 12.03 22 10.41 22 5.81 17.52 2 12 2z" />
                </svg>
              </a>
              <a href="#" className="text-white/15 hover:text-violet-400 transition-colors p-1" aria-label="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href="#" className="text-white/15 hover:text-violet-400 transition-colors p-1" aria-label="X">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
