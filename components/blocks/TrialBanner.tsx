"use client";

import Link from "next/link";
import { Gift, Clock, AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type TrialStatus = "active" | "expired" | "none";

type TrialBannerProps = {
  status: TrialStatus;
  creditsRemaining?: number;
  creditsTotal?: number;
  daysRemaining?: number;
};

export default function TrialBanner({
  status,
  creditsRemaining = 0,
  creditsTotal = 50,
  daysRemaining = 0,
}: TrialBannerProps) {
  if (status === "none") return null;

  if (status === "expired") {
    return (
      <div
        className="rounded-xl p-5 relative"
        style={{
          background: "linear-gradient(135deg, var(--bg-base), rgba(var(--error-rgb),0.06))",
          borderLeft: "4px solid var(--error)",
        }}
        role="alert"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[rgba(var(--error-rgb),0.1)] border border-[rgba(var(--error-rgb),0.2)] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-[var(--error)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              ทดลองใช้งานหมดอายุแล้ว
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">
              Free Trial ของคุณหมดอายุแล้ว — ซื้อแพ็กเกจเพื่อส่ง SMS ต่อ
            </p>
            <Link href="/dashboard/billing/packages">
              <Button
                size="sm"
                className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold gap-1.5"
              >
                ดูแพ็กเกจ
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active trial
  const pct = creditsTotal > 0 ? Math.round((creditsRemaining / creditsTotal) * 100) : 0;
  const isLow = creditsRemaining <= 10;

  return (
    <div
      className="rounded-xl p-5 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, var(--bg-base), rgba(var(--accent-purple-rgb),0.06))",
        borderLeft: "4px solid var(--accent-purple)",
      }}
      role="status"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[rgba(var(--accent-purple-rgb),0.1)] border border-[rgba(var(--accent-purple-rgb),0.2)] flex items-center justify-center shrink-0">
          <Gift className="w-5 h-5 text-[var(--accent-purple)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Free Trial
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[rgba(var(--accent-purple-rgb),0.1)] text-[var(--accent-purple)] border border-[rgba(var(--accent-purple-rgb),0.2)]">
              ทดลองใช้งาน
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] mb-3">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              เหลือ{" "}
              <span className={`font-bold ${isLow ? "text-[var(--warning)]" : "text-[var(--text-primary)]"}`}>
                {creditsRemaining}
              </span>
              /{creditsTotal} ข้อความ
            </span>
            {daysRemaining > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                เหลืออีก {daysRemaining} วัน
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div
              className="w-full h-2 rounded-full overflow-hidden"
              style={{ background: "rgba(var(--text-primary-rgb),0.08)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  background: isLow
                    ? "var(--warning)"
                    : "linear-gradient(90deg, var(--accent-purple), var(--accent))",
                }}
              />
            </div>
          </div>

          <Link href="/dashboard/billing/packages">
            <Button
              size="sm"
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold gap-1.5"
            >
              อัพเกรดตอนนี้
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Inline Trial Notice (for Send SMS / Senders pages) ─── */

type TrialNoticeProps = {
  variant: "send-limit" | "sender-limit";
};

export function TrialNotice({ variant }: TrialNoticeProps) {
  const config = {
    "send-limit": {
      icon: Clock,
      color: "var(--warning)",
      rgb: "var(--warning-rgb, 245,158,11)",
      text: "ทดลองใช้งาน: ส่งได้สูงสุด 10 SMS/วัน · ใช้ชื่อผู้ส่งระบบเท่านั้น",
      cta: "อัพเกรดเพื่อส่งไม่จำกัด",
    },
    "sender-limit": {
      icon: AlertTriangle,
      color: "var(--warning)",
      rgb: "var(--warning-rgb, 245,158,11)",
      text: "ชื่อผู้ส่งแบบกำหนดเองใช้ได้เฉพาะแพ็กเกจที่ซื้อ",
      cta: "ดูแพ็กเกจ",
    },
  };

  const c = config[variant];
  const Icon = c.icon;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg text-[13px]"
      style={{
        background: `rgba(${c.rgb}, 0.04)`,
        border: `1px solid rgba(${c.rgb}, 0.12)`,
      }}
    >
      <Icon className="w-4 h-4 shrink-0" style={{ color: c.color }} />
      <span className="flex-1 text-[var(--text-secondary)]">{c.text}</span>
      <Link
        href="/dashboard/billing/packages"
        className="shrink-0 text-[12px] font-medium hover:underline"
        style={{ color: "var(--accent)" }}
      >
        {c.cta} →
      </Link>
    </div>
  );
}

/* ─── Sidebar Upgrade CTA ─── */

export function SidebarUpgradeCta() {
  return (
    <div className="px-3 pb-2">
      <Link
        href="/dashboard/billing/packages"
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[12px] font-semibold transition-all duration-200 hover:-translate-y-[1px]"
        style={{
          background: "linear-gradient(135deg, rgba(var(--accent-rgb),0.08), rgba(var(--accent-purple-rgb),0.08))",
          border: "1px solid rgba(var(--accent-rgb),0.15)",
          color: "var(--accent)",
        }}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span className="flex-1">อัพเกรดแพ็กเกจ</span>
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
