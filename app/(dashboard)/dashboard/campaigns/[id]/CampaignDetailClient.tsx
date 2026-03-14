"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Megaphone,
  Loader,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { getCampaignProgress } from "@/lib/actions/campaigns";
import { formatThaiDateShort } from "@/lib/format-thai-date";
import { Button } from "@/components/ui/button";

type CampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "paused";

const STATUS_CONFIG: Record<
  CampaignStatus,
  { label: string; color: string; bg: string }
> = {
  draft: { label: "ฉบับร่าง", color: "var(--text-muted)", bg: "rgba(148,159,168,0.08)" },
  scheduled: { label: "ตั้งเวลา", color: "var(--info)", bg: "rgba(var(--info-rgb),0.08)" },
  sending: { label: "กำลังส่ง", color: "var(--accent)", bg: "rgba(var(--accent-rgb),0.08)" },
  running: { label: "กำลังส่ง", color: "var(--accent)", bg: "rgba(var(--accent-rgb),0.08)" },
  completed: { label: "สำเร็จ", color: "var(--success)", bg: "rgba(var(--success-rgb),0.08)" },
  failed: { label: "ล้มเหลว", color: "var(--error)", bg: "rgba(var(--error-rgb),0.08)" },
  cancelled: { label: "ยกเลิก", color: "var(--error)", bg: "rgba(var(--error-rgb),0.08)" },
  paused: { label: "หยุดชั่วคราว", color: "var(--warning)", bg: "rgba(var(--warning-rgb,245,158,11),0.08)" },
};

type Campaign = {
  id: string;
  name: string;
  status: CampaignStatus;
  senderName: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  creditReserved: number;
  creditUsed: number;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  contactGroup: { id: string; name: string } | null;
  template: { id: string; name: string } | null;
};

export default function CampaignDetailClient({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/v1/campaigns/${campaignId}`);
        if (!res.ok) { setError("ไม่พบแคมเปญ"); return; }
        const data = await res.json();
        setCampaign(data.campaign);
      } catch { setError("ไม่สามารถโหลดข้อมูลได้"); }
      finally { setLoading(false); }
    }
    load();
  }, [campaignId]);

  useEffect(() => {
    if (!campaign || (campaign.status !== "sending" && campaign.status !== "running")) return;
    const interval = setInterval(async () => {
      try {
        const progress = await getCampaignProgress(campaignId);
        setCampaign((prev) => prev ? { ...prev, status: progress.status as CampaignStatus, sentCount: progress.sentCount, deliveredCount: progress.deliveredCount, failedCount: progress.failedCount, creditUsed: progress.creditUsed } : prev);
        if (progress.status === "completed" || progress.status === "failed" || progress.status === "cancelled") clearInterval(interval);
      } catch { clearInterval(interval); }
    }, 2000);
    return () => clearInterval(interval);
  }, [campaign?.status, campaignId]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader className="w-6 h-6 animate-spin text-[var(--accent)]" /></div>;

  if (error || !campaign) return (
    <div className="text-center py-20">
      <XCircle className="w-12 h-12 text-[var(--error)] mx-auto mb-3" />
      <p className="text-[var(--text-secondary)]">{error || "ไม่พบแคมเปญ"}</p>
      <Button variant="outline" className="mt-4 border-[var(--table-border)] text-[var(--text-secondary)] cursor-pointer" onClick={() => router.push("/dashboard/campaigns")}>
        <ArrowLeft className="w-4 h-4 mr-1.5" />กลับ
      </Button>
    </div>
  );

  const cfg = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
  const pct = campaign.totalRecipients > 0 ? Math.round((campaign.sentCount / campaign.totalRecipients) * 100) : 0;

  return (
    <div>
      <button type="button" onClick={() => router.push("/dashboard/campaigns")} className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-4 cursor-pointer">
        <ArrowLeft className="w-4 h-4" />กลับไปรายการแคมเปญ
      </button>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-6 mb-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[rgba(var(--accent-rgb),0.08)] border border-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[var(--text-primary)]">{campaign.name}</h1>
              <p className="text-xs text-[var(--text-muted)]">สร้างเมื่อ {formatThaiDateShort(campaign.createdAt)}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full text-[11px] font-medium" style={{ padding: "3px 10px", background: cfg.bg, color: cfg.color }}>
            {(campaign.status === "sending" || campaign.status === "running") && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.color }} />}
            {cfg.label}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {[
            { label: "ผู้รับทั้งหมด", value: campaign.totalRecipients, color: "var(--text-primary)" },
            { label: "ส่งแล้ว", value: campaign.sentCount, color: "var(--accent)" },
            { label: "สำเร็จ", value: campaign.deliveredCount, color: "var(--success)" },
            { label: "ล้มเหลว", value: campaign.failedCount, color: "var(--error)" },
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-lg bg-[var(--table-alt-row)] border border-[var(--table-border)]">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">{s.label}</p>
              <p className="text-lg font-bold tabular-nums" style={{ color: s.color }}>{s.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        <div className="w-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[var(--text-muted)]">{campaign.sentCount.toLocaleString()} / {campaign.totalRecipients.toLocaleString()}</span>
            <span className="text-[10px] font-semibold text-[var(--accent)]">{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
            <div className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[var(--table-border)] grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div><p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">กลุ่มผู้รับ</p><p className="text-[var(--text-secondary)]">{campaign.contactGroup?.name || "-"}</p></div>
          <div><p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">เทมเพลต</p><p className="text-[var(--text-secondary)]">{campaign.template?.name || "-"}</p></div>
          <div><p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">ผู้ส่ง</p><p className="text-[var(--text-secondary)] font-mono">{campaign.senderName}</p></div>
          <div><p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">{campaign.scheduledAt ? "กำหนดส่ง" : "สร้างเมื่อ"}</p><p className="text-[var(--text-secondary)]">{formatThaiDateShort(campaign.scheduledAt || campaign.createdAt)}</p></div>
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--table-border)] grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">เครดิตสำรอง</p><p className="text-[var(--text-secondary)] tabular-nums">{campaign.creditReserved.toLocaleString()} SMS</p></div>
          <div><p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">เครดิตใช้จริง</p><p className="text-[var(--text-secondary)] tabular-nums">{campaign.creditUsed.toLocaleString()} SMS</p></div>
        </div>
      </div>
    </div>
  );
}
