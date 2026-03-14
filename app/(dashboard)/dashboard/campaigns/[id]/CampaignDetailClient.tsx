"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toCsvCell } from "@/lib/csv";
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  TrendingUp,
  Download,
  BarChart3,
  Loader2,
} from "lucide-react";

type CampaignDetail = {
  id: string;
  name: string;
  status: string;
  senderName: string;
  messageBody: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  contactGroup: { id: string; name: string } | null;
  template: { id: string; name: string } | null;
};

type AnalyticsData = {
  delivery: { total: number; sent: number; delivered: number; failed: number; pending: number };
  deliveryRate: number;
  cost: { totalSmsSegments: number; totalRecipients: number; creditUsed: number };
};

type DailyPoint = { date: string; count: number };

// ── Stat Card ──

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div
      className="relative rounded-lg p-5 overflow-hidden"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.5 }}
      />
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}14` }}>
          {icon}
        </div>
      </div>
      <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  );
}

// ── Progress Bar ──

function DeliveryBar({ delivered, failed, pending, total }: { delivered: number; failed: number; pending: number; total: number }) {
  if (total === 0) return null;
  const dPct = (delivered / total) * 100;
  const fPct = (failed / total) * 100;
  const pPct = (pending / total) * 100;

  return (
    <div>
      <div className="h-3 rounded-full overflow-hidden flex" style={{ background: "rgba(var(--border-default-rgb,40,45,55),0.3)" }}>
        <div className="h-full" style={{ width: `${dPct}%`, background: "var(--success)", transition: "width 0.8s ease" }} />
        <div className="h-full" style={{ width: `${fPct}%`, background: "var(--error)", transition: "width 0.8s ease" }} />
        <div className="h-full" style={{ width: `${pPct}%`, background: "var(--warning)", transition: "width 0.8s ease" }} />
      </div>
      <div className="flex items-center gap-4 mt-2">
        {[
          { label: "สำเร็จ", value: delivered, color: "var(--success)" },
          { label: "ล้มเหลว", value: failed, color: "var(--error)" },
          { label: "รอส่ง", value: pending, color: "var(--warning)" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {s.label}: {s.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Mini Line Chart ──

function MiniChart({ data }: { data: DailyPoint[] }) {
  if (data.length === 0) return null;
  const w = 500;
  const h = 120;
  const px = 30;
  const py = 10;
  const chartW = w - px * 2;
  const chartH = h - py * 2;
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const stepX = data.length > 1 ? chartW / (data.length - 1) : chartW;

  const path = data
    .map((d, i) => {
      const x = px + i * stepX;
      const y = py + chartH - (d.count / maxVal) * chartH;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  const areaPath = `${path} L${px + (data.length - 1) * stepX},${h - py} L${px},${h - py} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full h-auto">
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#chartFill)" />
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
      {data.map((d, i) => (
        <circle key={i} cx={px + i * stepX} cy={py + chartH - (d.count / maxVal) * chartH} r="3" fill="var(--accent)" />
      ))}
      {data.map((d, i) => (
        <text key={`l-${i}`} x={px + i * stepX} y={h + 14} textAnchor="middle" fill="var(--text-muted)" fontSize="9">
          {new Date(d.date).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
        </text>
      ))}
    </svg>
  );
}

// ── Status Badge ──

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "ฉบับร่าง", color: "var(--text-muted)", bg: "rgba(148,159,168,0.08)" },
  scheduled: { label: "ตั้งเวลา", color: "var(--info)", bg: "rgba(var(--info-rgb),0.08)" },
  sending: { label: "กำลังส่ง", color: "var(--accent)", bg: "rgba(var(--accent-rgb),0.08)" },
  running: { label: "กำลังส่ง", color: "var(--accent)", bg: "rgba(var(--accent-rgb),0.08)" },
  completed: { label: "สำเร็จ", color: "var(--success)", bg: "rgba(var(--success-rgb),0.08)" },
  failed: { label: "ล้มเหลว", color: "var(--error)", bg: "rgba(var(--error-rgb),0.08)" },
  cancelled: { label: "ยกเลิก", color: "var(--error)", bg: "rgba(var(--error-rgb),0.08)" },
};

// ── Main ──

export default function CampaignDetailClient({ campaignId }: { campaignId: string }) {
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [campRes, analyticsRes] = await Promise.all([
          fetch(`/api/v1/campaigns/${campaignId}`, { credentials: "include" }),
          fetch(`/api/v1/campaigns/${campaignId}/analytics`, { credentials: "include" }).catch(() => null),
        ]);

        if (!campRes.ok) throw new Error(`HTTP ${campRes.status}`);
        const campJson = await campRes.json();
        if (!cancelled) setCampaign(campJson.campaign ?? campJson);

        if (analyticsRes?.ok) {
          const analyticsJson = await analyticsRes.json();
          if (!cancelled) setAnalytics(analyticsJson);
        }
      } catch {
        if (!cancelled) setError("ไม่สามารถโหลดข้อมูลแคมเปญได้");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [campaignId]);

  const handleExportCsv = useCallback(() => {
    if (!campaign || !analytics) return;
    const rows = [
      ["แคมเปญ", "สถานะ", "ผู้รับทั้งหมด", "ส่งแล้ว", "สำเร็จ", "ล้มเหลว", "อัตราสำเร็จ %", "เครดิตใช้"],
      [
        campaign.name,
        campaign.status,
        String(campaign.totalRecipients),
        String(campaign.sentCount),
        String(campaign.deliveredCount),
        String(campaign.failedCount),
        String(analytics.deliveryRate),
        String(analytics.cost.creditUsed),
      ],
    ];
    const csv = rows.map((r) => r.map(toCsvCell).join(",")).join("\n");
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaign-${campaign.name}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [campaign, analytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="p-8 text-center">
        <XCircle size={40} style={{ color: "var(--error)" }} className="mx-auto mb-3" />
        <p className="text-[15px]" style={{ color: "var(--text-primary)" }}>{error || "ไม่พบแคมเปญ"}</p>
        <Link
          href="/dashboard/campaigns"
          className="inline-flex items-center gap-1.5 mt-4 text-[13px]"
          style={{ color: "var(--accent)" }}
        >
          <ArrowLeft size={14} />
          กลับไปรายการแคมเปญ
        </Link>
      </div>
    );
  }

  const st = STATUS_MAP[campaign.status] || STATUS_MAP.draft;
  const deliveryRate = campaign.totalRecipients > 0
    ? Math.round((campaign.deliveredCount / campaign.totalRecipients) * 100)
    : 0;
  const failRate = campaign.totalRecipients > 0
    ? Math.round((campaign.failedCount / campaign.totalRecipients) * 100)
    : 0;
  const pendingCount = campaign.totalRecipients - campaign.deliveredCount - campaign.failedCount;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto animate-fade-in-up">
      {/* Back + Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/campaigns"
          className="inline-flex items-center gap-1.5 text-[13px] mb-4 transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={14} />
          กลับไปรายการแคมเปญ
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {campaign.name}
              </h1>
              <span
                className="inline-flex items-center rounded-full text-[11px] font-medium px-2.5 py-0.5"
                style={{ background: st.bg, color: st.color }}
              >
                {st.label}
              </span>
            </div>
            <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
              {campaign.senderName} · สร้างเมื่อ {new Date(campaign.createdAt).toLocaleDateString("th-TH")}
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer"
            style={{ color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="ผู้รับทั้งหมด"
          value={campaign.totalRecipients}
          icon={<Users size={16} style={{ color: "var(--accent)" }} />}
          color="var(--accent)"
        />
        <StatCard
          label="อัตราสำเร็จ"
          value={`${deliveryRate}%`}
          icon={<CheckCircle2 size={16} style={{ color: "var(--success)" }} />}
          color="var(--success)"
        />
        <StatCard
          label="อัตราล้มเหลว"
          value={`${failRate}%`}
          icon={<XCircle size={16} style={{ color: "var(--error)" }} />}
          color="var(--error)"
        />
        <StatCard
          label="เครดิตใช้"
          value={analytics?.cost.creditUsed ?? campaign.sentCount}
          icon={<TrendingUp size={16} style={{ color: "var(--accent)" }} />}
          color="var(--accent)"
        />
      </div>

      {/* Delivery Progress */}
      <div
        className="relative rounded-lg p-6 overflow-hidden mb-6"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: "linear-gradient(90deg, transparent, var(--accent), transparent)", opacity: 0.3 }}
        />
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} style={{ color: "var(--accent)" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            ความคืบหน้าการส่ง
          </h3>
        </div>
        <DeliveryBar
          delivered={campaign.deliveredCount}
          failed={campaign.failedCount}
          pending={Math.max(0, pendingCount)}
          total={campaign.totalRecipients}
        />
      </div>

      {/* Campaign Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Details */}
        <div
          className="relative rounded-lg p-6 overflow-hidden"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: "linear-gradient(90deg, transparent, var(--accent-secondary, #a855f7), transparent)", opacity: 0.3 }}
          />
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            รายละเอียด
          </h3>
          <div className="space-y-3">
            {[
              { label: "ผู้ส่ง", value: campaign.senderName },
              { label: "กลุ่มผู้รับ", value: campaign.contactGroup?.name ?? "—" },
              { label: "เทมเพลต", value: campaign.template?.name ?? "—" },
              { label: "ตั้งเวลา", value: campaign.scheduledAt ? new Date(campaign.scheduledAt).toLocaleString("th-TH") : "ส่งทันที" },
              { label: "เริ่มส่ง", value: campaign.startedAt ? new Date(campaign.startedAt).toLocaleString("th-TH") : "—" },
              { label: "เสร็จสิ้น", value: campaign.completedAt ? new Date(campaign.completedAt).toLocaleString("th-TH") : "—" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between" style={{ borderBottom: "1px solid var(--border-default)", paddingBottom: 8 }}>
                <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>{row.label}</span>
                <span className="text-[13px]" style={{ color: "var(--text-primary)" }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Message Preview */}
        <div
          className="relative rounded-lg p-6 overflow-hidden"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: "linear-gradient(90deg, transparent, var(--accent), transparent)", opacity: 0.3 }}
          />
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            ข้อความ
          </h3>
          <div
            className="p-4 rounded-lg"
            style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
          >
            <p className="text-[13px] whitespace-pre-wrap break-words" style={{ color: "var(--text-primary)" }}>
              {campaign.messageBody || "—"}
            </p>
          </div>
          <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>
            {(campaign.messageBody || "").length} ตัวอักษร
          </p>
        </div>
      </div>

      {/* Recipients Summary */}
      <div
        className="relative rounded-lg overflow-hidden"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: "linear-gradient(90deg, transparent, var(--success), transparent)", opacity: 0.3 }}
        />
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-2">
            <Users size={16} style={{ color: "var(--success)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              สรุปผู้รับ
            </h3>
          </div>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {campaign.totalRecipients.toLocaleString()} คน
          </span>
        </div>
        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "ส่งแล้ว", value: campaign.sentCount, color: "var(--accent)" },
              { label: "สำเร็จ", value: campaign.deliveredCount, color: "var(--success)" },
              { label: "ล้มเหลว", value: campaign.failedCount, color: "var(--error)" },
              { label: "รอส่ง", value: Math.max(0, pendingCount), color: "var(--warning)" },
            ].map((s) => (
              <div
                key={s.label}
                className="p-3 rounded-lg text-center"
                style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
              >
                <p className="text-[11px] font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                  {s.label}
                </p>
                <p className="text-lg font-bold tabular-nums" style={{ color: s.color }}>
                  {s.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
