"use client";

import { useState } from "react";
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
  { title: "ราคาถูกที่สุด", desc: "เริ่มต้นเพียง 0.147 บาท/SMS", icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>) },
  { title: "ส่งเร็วทันใจ", desc: "ส่งถึงปลายทางภายใน 3 วินาที", icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>) },
  { title: "ทดลองฟรี", desc: "สมัครวันนี้รับฟรี 500 เครดิต", icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" /></svg>) },
  { title: "ซัพพอร์ต 24/7", desc: "ทีมงานพร้อมช่วยเหลือตลอด", icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>) },
  { title: "SMS API", desc: "เชื่อมต่อง่ายด้วย RESTful API", icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
];

const features = [
  { title: "ส่ง SMS ผ่านเว็บ", desc: "พิมพ์ข้อความ เลือกเบอร์ กดส่ง — ง่ายแค่นั้น", icon: (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>) },
  { title: "SMS API", desc: "RESTful API พร้อม SDK สำหรับ Node.js, Python, PHP", icon: (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
  { title: "สมุดโทรศัพท์", desc: "จัดการรายชื่อ กลุ่ม นำเข้า CSV ได้", icon: (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>) },
  { title: "รายงาน Realtime", desc: "ติดตามสถานะ SMS แบบเรียลไทม์ Export CSV ได้", icon: (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>) },
];

const faqs = [
  { q: "ทดลองใช้ได้ไหม?", a: "สมัครฟรีวันนี้ ได้ 500 เครดิตทดลองส่ง SMS ทันที ไม่ต้องเติมเงิน" },
  { q: "Sender name ใช้เวลาอนุมัตินานไหม?", a: "1-2 วันทำการ ระหว่างรออนุมัติสามารถใช้ชื่อ default ส่ง SMS ได้เลย" },
  { q: "ชำระเงินยังไง?", a: "รองรับโอนเงินผ่านธนาคาร, PromptPay QR Code — ยืนยันสลิปอัตโนมัติ" },
  { q: "เบอร์ถูก block ทำยังไง?", a: "ติดต่อทีม support เพื่อทำ whitelist ให้ฟรี" },
  { q: "API รองรับภาษาอะไร?", a: "RESTful API รองรับทุกภาษาโปรแกรม มี SDK สำหรับ Node.js, Python, PHP" },
];

function fmt(n: number) { return n.toLocaleString("th-TH"); }

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen grid-bg relative scroll-smooth">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)" }} />
      <div className="fixed bottom-0 right-0 w-[500px] h-[400px] rounded-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)" }} />

      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-white/5 bg-[#06060C]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-purple-400"><path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.3" /><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span className="text-xl font-bold neon-purple">SMSOK</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
            <a href="#why" className="hover:text-white transition-colors">ทำไมต้องเรา</a>
            <a href="#features" className="hover:text-white transition-colors">ฟีเจอร์</a>
            <a href="#pricing" className="hover:text-white transition-colors">ราคา</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="btn-glass px-5 py-2.5 text-sm inline-block">เข้าสู่ระบบ</Link>
            <Link href="/register" className="btn-primary px-5 py-2.5 text-sm inline-block">สมัครฟรี</Link>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-white/60 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer" aria-label={mobileOpen ? "ปิดเมนู" : "เปิดเมนู"}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>}
            </svg>
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#06060C]/95 backdrop-blur-xl px-4 py-4 flex flex-col gap-1">
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

      {/* HERO */}
      <section className="pt-28 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 text-center relative">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <div className="inline-block mb-5 sm:mb-6 px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-400 text-xs sm:text-sm font-medium">ส่ง SMS ง่าย รวดเร็ว ราคาถูก</div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight mb-5 sm:mb-6">
            <span className="text-white">แพลตฟอร์มส่ง</span>{" "}<span className="neon-purple">SMS</span><br /><span className="text-white/80">ที่ธุรกิจไว้วางใจ</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">ส่ง SMS ผ่านเว็บหรือ API ได้ทันที ราคาเริ่มต้น 0.147 บาท/ข้อความ<br className="hidden sm:block" /><span className="sm:hidden"> — </span>สมัครวันนี้รับฟรี 500 เครดิต</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-2">
            <Link href="/register" className="btn-primary px-8 py-3.5 text-base rounded-xl w-full sm:w-auto text-center min-h-[48px] flex items-center justify-center gap-2">
              สมัครฟรี — รับ 500 เครดิต
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <a href="#pricing" className="btn-glass px-8 py-3.5 text-base rounded-xl w-full sm:w-auto text-center min-h-[48px] flex items-center justify-center">ดูราคา</a>
          </div>
          <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-white/30">
            {["ไม่มีค่าแรกเข้า", "เริ่มใช้ได้ทันที", "ซัพพอร์ต 24/7"].map((t) => (
              <span key={t} className="flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400/60"><polyline points="20 6 9 17 4 12" /></svg>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section id="why" className="py-16 sm:py-20 px-4 sm:px-6 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-3 sm:mb-4">ทำไมต้อง <span className="neon-purple">SMSOK</span>?</h2>
          <p className="text-center text-white/40 mb-10 sm:mb-14 max-w-xl mx-auto text-sm sm:text-base">บริการส่ง SMS ที่ครบทุกฟีเจอร์ ในราคาที่ถูกที่สุด</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="glass p-4 sm:p-6 text-center group hover:border-purple-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] hover:-translate-y-1">
                <div className="text-purple-400/70 mb-3 sm:mb-4 flex justify-center group-hover:text-purple-400 group-hover:drop-shadow-[0_0_8px_rgba(139,92,246,0.5)] transition-all">{b.icon}</div>
                <h3 className="font-semibold text-white mb-1 sm:mb-2 text-xs sm:text-sm md:text-base">{b.title}</h3>
                <p className="text-[10px] sm:text-xs md:text-sm text-white/40 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-3 sm:mb-4">ฟีเจอร์<span className="neon-violet">ครบ</span>ทุกความต้องการ</h2>
          <p className="text-center text-white/40 mb-10 sm:mb-14 max-w-xl mx-auto text-sm sm:text-base">ไม่ว่าจะส่งผ่านเว็บหรือ API เรามีทุกอย่างที่คุณต้องการ</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {features.map((f) => (
              <div key={f.title} className="glass p-6 sm:p-8 flex gap-4 sm:gap-5 group hover:border-violet-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] hover:-translate-y-1">
                <div className="text-violet-400/60 flex-shrink-0 group-hover:text-violet-400 group-hover:drop-shadow-[0_0_8px_rgba(139,92,246,0.5)] transition-all">{f.icon}</div>
                <div>
                  <h3 className="font-semibold text-white text-base sm:text-lg mb-1.5 sm:mb-2">{f.title}</h3>
                  <p className="text-white/40 leading-relaxed text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-16 sm:py-20 px-4 sm:px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-3 sm:mb-4">เลือก<span className="neon-purple">แพ็กเกจ</span>ที่เหมาะกับคุณ</h2>
          <p className="text-center text-white/40 mb-10 sm:mb-14 max-w-xl mx-auto text-sm sm:text-base">ยิ่งซื้อมาก ยิ่งถูก — โบนัสสูงสุด 50%</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {packages.map((pkg) => (
              <div key={pkg.name} className={`glass p-5 sm:p-6 flex flex-col transition-all duration-300 group relative ${pkg.best ? "border-purple-500/40 shadow-[0_0_40px_rgba(139,92,246,0.15)] scale-[1.02] z-10" : "hover:scale-[1.02] hover:-translate-y-1"}`}>
                <div className="absolute inset-0 rounded-[16px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: "inset 0 1px 0 rgba(139,92,246,0.2), 0 0 40px rgba(139,92,246,0.12)" }} />
                {pkg.best && (<div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase tracking-wider mb-3"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-purple-400"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>Best Seller</div>)}
                <div className="text-sm text-white/40 mb-1">SMSOK {pkg.name}</div>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1 group-hover:text-purple-200 transition-colors">฿{fmt(pkg.price)}</div>
                {pkg.bonus > 0 ? (<div className="text-sm text-emerald-400 mb-4 flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>+{pkg.bonus}% โบนัส</div>) : <div className="mb-4" />}
                <div className="space-y-2.5 text-sm text-white/50 flex-1">
                  <div className="flex justify-between"><span>SMS</span><span className="text-white font-medium">{fmt(pkg.sms)}</span></div>
                  <div className="flex justify-between"><span>ราคา/SMS</span><span className="text-white font-medium">฿{pkg.cost}</span></div>
                  <div className="flex justify-between"><span>Sender Names</span><span className="text-white font-medium">{pkg.senders === -1 ? "ไม่จำกัด" : pkg.senders}</span></div>
                  <div className="flex justify-between"><span>ระยะเวลา</span><span className="text-white font-medium">{pkg.duration}</span></div>
                </div>
                <Link href="/register" className={`mt-5 sm:mt-6 w-full py-3 rounded-xl font-semibold text-sm transition-all text-center min-h-[44px] flex items-center justify-center gap-2 ${pkg.best ? "btn-primary" : "btn-glass"}`}>
                  เลือกแพ็กเกจ
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto glass p-8 sm:p-12 text-center relative overflow-hidden" style={{ animation: "pulse-glow 4s ease-in-out infinite" }}>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">ต้องการแพ็กเกจพิเศษ?</h2>
          <p className="text-white/40 mb-6 sm:mb-8 text-sm sm:text-base">สำหรับธุรกิจที่ส่ง SMS มากกว่า 1 ล้านข้อความ/เดือน ติดต่อเราเพื่อรับราคาพิเศษ</p>
          <button className="btn-primary px-8 py-3.5 text-base rounded-xl cursor-pointer min-h-[48px] inline-flex items-center gap-2">ติดต่อฝ่ายขาย<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg></button>
        </div>
      </section>

      {/* FAQ — smooth accordion */}
      <section id="faq" className="py-16 sm:py-20 px-4 sm:px-6 scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 sm:mb-14">คำถาม<span className="neon-violet">ที่พบบ่อย</span></h2>
          <div className="space-y-3 sm:space-y-4">
            {faqs.map((faq, i) => (
              <div key={faq.q} className={`glass transition-all duration-300 ${openFaq === i ? "border-purple-500/30 shadow-[0_0_20px_rgba(139,92,246,0.08)]" : ""}`}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full p-5 sm:p-6 cursor-pointer font-semibold text-white flex items-center justify-between text-left gap-4 min-h-[56px]" aria-expanded={openFaq === i}>
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  <span className={`text-purple-400/50 text-xl flex-shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-45" : ""}`}>+</span>
                </button>
                <div className="overflow-hidden transition-all duration-300 ease-in-out" style={{ maxHeight: openFaq === i ? "200px" : "0px", opacity: openFaq === i ? 1 : 0 }}>
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-white/50 leading-relaxed text-sm sm:text-base">{faq.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-10 sm:py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10 sm:mb-12">
            <div className="col-span-2 sm:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-purple-400"><path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.3" /><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span className="text-lg font-bold neon-purple">SMSOK</span>
              </Link>
              <p className="text-xs sm:text-sm text-white/30 leading-relaxed">แพลตฟอร์มส่ง SMS ที่ธุรกิจไว้วางใจ ราคาถูก ส่งเร็ว ซัพพอร์ต 24/7</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3 sm:mb-4">Product</h4>
              <ul className="space-y-2 sm:space-y-3 text-sm text-white/30">
                <li><a href="#features" className="hover:text-white transition-colors">ฟีเจอร์</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">ราคา</a></li>
                <li><Link href="/register" className="hover:text-white transition-colors">สมัครฟรี</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3 sm:mb-4">Company</h4>
              <ul className="space-y-2 sm:space-y-3 text-sm text-white/30">
                <li><a href="#" className="hover:text-white transition-colors">เกี่ยวกับเรา</a></li>
                <li><a href="#" className="hover:text-white transition-colors">บล็อก</a></li>
                <li><a href="#" className="hover:text-white transition-colors">ติดต่อเรา</a></li>
                <li><a href="#" className="hover:text-white transition-colors">ร่วมงานกับเรา</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3 sm:mb-4">Legal</h4>
              <ul className="space-y-2 sm:space-y-3 text-sm text-white/30">
                <li><a href="#" className="hover:text-white transition-colors">เงื่อนไขการใช้งาน</a></li>
                <li><a href="#" className="hover:text-white transition-colors">นโยบายความเป็นส่วนตัว</a></li>
                <li><a href="#" className="hover:text-white transition-colors">SLA</a></li>
                <li><a href="#" className="hover:text-white transition-colors">PDPA</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs sm:text-sm text-white/20">&copy; 2026 SMSOK Clone — designed by uxui</div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-white/20 hover:text-purple-400 transition-colors p-1" aria-label="LINE"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 5.81 2 10.41c0 4.15 3.68 7.63 8.65 8.28.34.07.8.22.91.51.1.26.07.67.03.93l-.15.87c-.04.25-.2.98.87.53s5.8-3.41 7.9-5.84C22.15 13.59 22 12.03 22 10.41 22 5.81 17.52 2 12 2z"/></svg></a>
              <a href="#" className="text-white/20 hover:text-purple-400 transition-colors p-1" aria-label="Facebook"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
              <a href="#" className="text-white/20 hover:text-purple-400 transition-colors p-1" aria-label="X"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
