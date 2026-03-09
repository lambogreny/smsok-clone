import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardShell from "../DashboardShell";
import Link from "next/link";

export default async function CampaignsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <DashboardShell user={user} title="Campaigns">
      <div className="p-6 md:p-8 max-w-6xl animate-fade-in">
        <div className="glass p-12 md:p-16 text-center">
          {/* Campaign Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-sky-500/10 to-indigo-500/10 border border-sky-500/10 flex items-center justify-center animate-breathe">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
            Campaigns
            <span className="ml-3 badge badge-info">Coming Soon</span>
          </h2>

          <p className="text-sm text-white/40 mb-2 max-w-md mx-auto">
            ส่ง SMS แบบ Campaign จะเปิดให้ใช้เร็วๆ นี้
          </p>
          <p className="text-xs text-white/20 mb-8 max-w-md mx-auto">
            สร้าง Campaign, ตั้งเวลาส่ง, A/B Testing, และดูรายงานผลแบบละเอียด
          </p>

          <Link
            href="/dashboard"
            className="btn-glass inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
