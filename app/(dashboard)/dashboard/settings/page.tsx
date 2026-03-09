import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import PasswordChangeForm from "./PasswordChangeForm";

export default async function SettingsPage() {
  const user = await getSession();

  // Get full user data including phone and createdAt
  const fullUser = await prisma.user.findUnique({
    where: { id: user!.id },
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

  return (
    <div className="p-6 md:p-8 max-w-4xl animate-fade-in-up">
      <h1 className="text-2xl font-bold tracking-tight mb-1"><span className="gradient-text-sky">ตั้งค่า</span></h1>
      <p className="text-sm text-white/40 mb-8">จัดการบัญชีและข้อมูลส่วนตัว</p>

      <div className="space-y-6 stagger-children">
      {/* Profile Section */}
      <div className="glass p-6 md:p-8 mb-6">
        <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/[0.08] border border-sky-500/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          ข้อมูลส่วนตัว
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs text-white/30 uppercase tracking-wider mb-2 font-medium">ชื่อ</label>
            <div className="input-glass bg-white/[0.01] cursor-default text-white/50">{fullUser.name}</div>
          </div>
          <div>
            <label className="block text-xs text-white/30 uppercase tracking-wider mb-2 font-medium">อีเมล</label>
            <div className="input-glass bg-white/[0.01] cursor-default text-white/50">{fullUser.email}</div>
          </div>
          <div>
            <label className="block text-xs text-white/30 uppercase tracking-wider mb-2 font-medium">เบอร์โทรศัพท์</label>
            <div className="input-glass bg-white/[0.01] cursor-default text-white/50">{fullUser.phone || "ไม่ได้ระบุ"}</div>
          </div>
        </div>
      </div>

      {/* Password Change */}
      <div className="glass p-6 md:p-8 mb-6">
        <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/[0.08] border border-sky-500/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          เปลี่ยนรหัสผ่าน
        </h2>
        <PasswordChangeForm />
      </div>

      {/* Account Info */}
      <div className="glass p-6 md:p-8">
        <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/[0.08] border border-sky-500/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          ข้อมูลบัญชี
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
            <p className="text-xs text-white/30 uppercase tracking-wider mb-1">บทบาท</p>
            <p className="text-lg font-semibold text-white capitalize">{fullUser.role}</p>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
            <p className="text-xs text-white/30 uppercase tracking-wider mb-1">เครดิตคงเหลือ</p>
            <p className="text-lg font-semibold gradient-text-sky">{fullUser.credits.toLocaleString()}</p>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
            <p className="text-xs text-white/30 uppercase tracking-wider mb-1">สมาชิกตั้งแต่</p>
            <p className="text-lg font-semibold text-white">
              {new Date(fullUser.createdAt).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
