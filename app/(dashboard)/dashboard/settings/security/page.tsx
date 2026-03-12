import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import TwoFactorSection from "../TwoFactorSection";
import SessionsSection from "../SessionsSection";

export default async function SecuritySettingsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <div className="p-6 md:p-8 max-w-4xl animate-fade-in-up">
      <h1 className="text-xl font-bold tracking-tight mb-1">
        <span className="text-[var(--accent)]">ความปลอดภัย</span>
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">
        จัดการการเข้าถึงบัญชีและการยืนยันตัวตน
      </p>

      <div className="space-y-6">
        {/* Section 1: 2FA */}
        <TwoFactorSection />

        {/* Section 2: Active Sessions */}
        <SessionsSection />
      </div>
    </div>
  );
}
