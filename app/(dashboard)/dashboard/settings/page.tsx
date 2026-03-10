import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import PasswordChangeForm from "./PasswordChangeForm";
import ForceChangeModal from "./ForceChangeModal";
import ProfileEditForm from "./ProfileEditForm";
import Link from "next/link";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ forceChange?: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { forceChange } = await searchParams;

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      credits: true,
      role: true,
      createdAt: true,
    },
  });

  if (!fullUser) redirect("/login");

  const initials = fullUser.name.slice(0, 2).toUpperCase();
  const memberSince = new Date(fullUser.createdAt).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {forceChange === "true" && <ForceChangeModal userId={fullUser.id} />}
    <div className="p-6 md:p-8 max-w-4xl animate-fade-in-up">
      <h1 className="text-2xl font-bold tracking-tight mb-1"><span className="gradient-text-cyan">ตั้งค่า</span></h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">จัดการบัญชีและข้อมูลส่วนตัว</p>


      <div className="space-y-6 stagger-children">
        {/* Profile Card */}
        <div className="glass p-6 md:p-8 relative overflow-hidden">
          {/* Subtle gradient bg */}
          <div className="absolute top-0 right-0 w-[200px] h-[200px] rounded-full bg-violet-500/5 blur-[60px]" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-6">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/30 to-cyan-500/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold gradient-text-mixed">{initials}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">{fullUser.name}</h2>
              <p className="text-sm text-[var(--text-muted)]">{fullUser.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  {fullUser.role}
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">สมาชิกตั้งแต่ {memberSince}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-medium">อีเมล</label>
              <input
                readOnly
                value={fullUser.email}
                className="input-glass bg-[var(--bg-surface)] cursor-default text-[var(--text-secondary)] w-full"
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">อีเมลไม่สามารถเปลี่ยนแปลงได้</p>
            </div>
            <div>
              <label className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-medium flex items-center gap-1.5">
                เบอร์โทรศัพท์
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400/70">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </label>
              <input
                readOnly
                value={fullUser.phone || "ไม่ได้ระบุ"}
                className="input-glass bg-[var(--bg-surface)] cursor-not-allowed text-[var(--text-secondary)] font-mono select-none w-full"
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">
                เบอร์โทรไม่สามารถเปลี่ยนได้หลังสมัคร{" "}
                <span className="text-cyan-400">ติดต่อ support หากจำเป็น</span>
              </p>
            </div>
          </div>
          <ProfileEditForm
            userId={fullUser.id}
            initialName={fullUser.name}
          />
        </div>

        {/* Account Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-cyan p-5 card-hover">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--text-muted)]">เครดิตคงเหลือ</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400">
                <circle cx="12" cy="12" r="10" /><text x="12" y="16" textAnchor="middle" fill="currentColor" stroke="none" fontSize="12" fontWeight="bold">฿</text>
              </svg>
            </div>
            <p className="text-2xl font-bold gradient-text-cyan">{fullUser.credits.toLocaleString()}</p>
            <Link href="/dashboard/topup" className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors mt-1 inline-block">
              เติมเครดิต →
            </Link>
          </div>
          <div className="glass-violet p-5 card-hover">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--text-muted)]">บทบาท</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-violet-400 capitalize">{fullUser.role}</p>
          </div>
          <div className="glass p-5 card-hover">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--text-muted)]">API Keys</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-400">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>
            <Link href="/dashboard/api-keys" className="text-2xl font-bold text-amber-400 hover:text-amber-300 transition-colors">
              จัดการ →
            </Link>
          </div>
        </div>

        {/* Password Change */}
        <div className="glass p-6 md:p-8">
          <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/[0.08] border border-violet-500/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            เปลี่ยนรหัสผ่าน
          </h2>
          <PasswordChangeForm />
        </div>

        {/* Danger Zone */}
        <div className="glass p-6 md:p-8 border-red-500/10">
          <h2 className="text-base font-semibold text-red-400 mb-2 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/[0.08] border border-red-500/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            Danger Zone
          </h2>
          <p className="text-xs text-[var(--text-muted)] mb-4">การลบบัญชีจะลบข้อมูลทั้งหมดอย่างถาวร</p>
          <button
            type="button"
            disabled
            className="px-4 py-2 rounded-xl text-xs font-medium bg-red-500/10 text-red-400/70 border border-red-500/10 cursor-not-allowed"
          >
            ลบบัญชี (ติดต่อแอดมิน)
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
