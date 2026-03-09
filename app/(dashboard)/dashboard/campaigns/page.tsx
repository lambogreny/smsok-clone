import Link from "next/link";

export default async function CampaignsPage() {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto animate-fade-in-up">
      <div className="glass p-12 md:p-16 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)" }} />

        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-sky-500/10 to-indigo-500/10 border border-sky-500/10 flex items-center justify-center animate-breathe relative">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold mb-3 tracking-tight relative">
          <span className="bg-gradient-to-r from-sky-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent">แคมเปญ SMS</span>
          <span className="ml-3 badge-glow-info">เร็วๆ นี้</span>
        </h2>

        <p className="text-sm text-white/50 mb-6 max-w-md mx-auto relative">
          ระบบส่ง SMS แบบแคมเปญกำลังพัฒนา จะเปิดให้ใช้งานเร็วๆ นี้
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 max-w-lg mx-auto relative stagger-children">
          {[
            { icon: "📊", label: "สร้างแคมเปญ" },
            { icon: "⏰", label: "ตั้งเวลาส่ง" },
            { icon: "🔀", label: "ทดสอบ A/B" },
            { icon: "📈", label: "รายงานผล" },
          ].map((feature) => (
            <div key={feature.label} className="glass p-3 rounded-xl text-center">
              <div className="text-lg mb-1">{feature.icon}</div>
              <p className="text-[11px] text-white/30">{feature.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative">
          <Link href="/dashboard" className="btn-glass inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            กลับแดชบอร์ด
          </Link>
          <Link href="/dashboard/send" className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold">
            ส่ง SMS ตอนนี้
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
