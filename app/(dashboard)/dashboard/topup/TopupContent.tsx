"use client";

import { motion } from "framer-motion";
import EmptyState from "@/app/components/ui/EmptyState";

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
    <motion.div className="p-6 md:p-8 max-w-6xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
      <h1 className="text-2xl font-bold tracking-tight mb-1">
        <span className="gradient-text-cyan">เติมเงิน</span>
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">เลือกแพ็กเกจเพื่อเติมเครดิต SMS</p>

      {/* Current Credits */}
      <div className="glass-cyan p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/[0.08] border border-cyan-500/10 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
                <circle cx="12" cy="12" r="10" /><text x="12" y="16" textAnchor="middle" fill="currentColor" stroke="none" fontSize="12" fontWeight="bold">฿</text>
              </svg>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">เครดิตคงเหลือ</p>
              <p className="text-3xl font-bold gradient-text-cyan">{user.credits.toLocaleString()}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--text-muted)]">ประมาณ</p>
            <p className="text-sm text-[var(--text-secondary)]">{user.credits.toLocaleString()} SMS</p>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
        {packages.map((pkg, i) => (
          <motion.div
            key={pkg.id ?? i}
            className={`glass card-hover p-6 flex flex-col ${pkg.isBestSeller ? "glass-cyan border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.08)]" : ""}`}
            whileHover={{ y: -6, transition: { duration: 0.3 } }}
          >
            {/* Best Seller Badge */}
            {pkg.isBestSeller && (
              <div className="mb-3">
                <span className="badge-glow-info text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md">BEST SELLER</span>
              </div>
            )}

            {/* Package Name */}
            <h3 className="text-lg font-bold text-white mb-1">{pkg.name}</h3>

            {/* Price */}
            <div className="mb-4">
              <span className="text-2xl font-bold gradient-text-cyan">฿{formatPrice(pkg.price)}</span>
            </div>

            {/* Details */}
            <div className="space-y-2.5 mb-6 flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">เครดิต</span>
                <span className="text-white font-semibold">{pkg.totalCredits.toLocaleString()}</span>
              </div>
              {pkg.bonusPercent > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">โบนัส</span>
                  <span className="text-emerald-400 font-semibold">+{pkg.bonusPercent}%</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">ระยะเวลา</span>
                <span className="text-[var(--text-secondary)]">{formatDuration(pkg.durationDays)}</span>
              </div>
              {pkg.maxSenders !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">ชื่อผู้ส่ง</span>
                  <span className="text-[var(--text-secondary)]">{pkg.maxSenders === -1 ? "ไม่จำกัด" : pkg.maxSenders}</span>
                </div>
              )}
            </div>

            {/* Buy Button */}
            <motion.button
              className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 ${
                pkg.isBestSeller ? "btn-primary" : "btn-glass"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              ซื้อแพ็กเกจ
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </motion.button>
          </motion.div>
        ))}
      </div>

      {packages.length === 0 && (
        <EmptyState
          icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="12" r="10" /><text x="12" y="16" textAnchor="middle" fill="currentColor" stroke="none" fontSize="12" fontWeight="bold">฿</text></svg>}
          title="ยังไม่มีแพ็กเกจ"
          description="แพ็กเกจจะแสดงที่นี่เมื่อพร้อมใช้งาน"
        />
      )}
    </motion.div>
  );
}
