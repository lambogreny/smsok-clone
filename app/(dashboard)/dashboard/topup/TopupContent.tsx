"use client";

type Package = {
  id?: string;
  name: string;
  price: number;
  bonusPercent: number;
  totalCredits: number;
  maxSenders?: number;
  durationDays: number;
  isBestSeller?: boolean;
};

type User = {
  id: string;
  name: string;
  email: string;
  credits: number;
  role: string;
};

function formatPrice(satang: number): string {
  return (satang / 100).toLocaleString("th-TH");
}

function formatDuration(days: number): string {
  if (days >= 365) return `${Math.floor(days / 365)} ปี`;
  if (days >= 30) return `${Math.floor(days / 30)} เดือน`;
  return `${days} วัน`;
}

export default function TopupContent({ user, packages }: { user: User; packages: Package[] }) {
  return (
    <div className="p-6 md:p-8 max-w-6xl animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">เติมเงิน</h1>
      <p className="text-sm text-white/40 mb-8">เลือกแพ็กเกจเพื่อเติมเครดิต SMS</p>

      {/* Current Credits */}
      <div className="glass p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/[0.08] border border-sky-500/10 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
                <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-white/30 uppercase tracking-wider font-medium">เครดิตคงเหลือ</p>
              <p className="text-3xl font-bold neon-blue">{user.credits.toLocaleString()}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/30">ประมาณ</p>
            <p className="text-sm text-white/50">{user.credits.toLocaleString()} SMS</p>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {packages.map((pkg, i) => (
          <div
            key={pkg.id ?? i}
            className={`glass card-glow p-6 flex flex-col animate-fade-in ${
              pkg.isBestSeller ? "border-sky-500/30 shadow-[0_0_30px_rgba(56,189,248,0.08)]" : ""
            }`}
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            {/* Best Seller Badge */}
            {pkg.isBestSeller && (
              <div className="mb-3">
                <span className="badge badge-info">BEST SELLER</span>
              </div>
            )}

            {/* Package Name */}
            <h3 className="text-lg font-bold text-white mb-1">{pkg.name}</h3>

            {/* Price */}
            <div className="mb-4">
              <span className="text-2xl font-bold neon-blue">{formatPrice(pkg.price)}</span>
              <span className="text-sm text-white/30 ml-1">บาท</span>
            </div>

            {/* Details */}
            <div className="space-y-2.5 mb-6 flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">เครดิต</span>
                <span className="text-white font-semibold">{pkg.totalCredits.toLocaleString()}</span>
              </div>
              {pkg.bonusPercent > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">โบนัส</span>
                  <span className="text-emerald-400 font-semibold">+{pkg.bonusPercent}%</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">ระยะเวลา</span>
                <span className="text-white/70">{formatDuration(pkg.durationDays)}</span>
              </div>
              {pkg.maxSenders !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Sender Names</span>
                  <span className="text-white/70">{pkg.maxSenders === -1 ? "ไม่จำกัด" : pkg.maxSenders}</span>
                </div>
              )}
            </div>

            {/* Buy Button */}
            <button className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 ${
              pkg.isBestSeller ? "btn-primary" : "btn-glass"
            }`}>
              ซื้อแพ็กเกจ
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
