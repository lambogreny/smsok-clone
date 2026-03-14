"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  CheckCircle2,
  XCircle,
  Repeat,
  Loader2,
  X,
} from "lucide-react";
import { formatThaiDate, formatThaiDateOnly, formatThaiTime } from "@/lib/format-thai-date";
import PageLayout, { PageHeader } from "@/components/blocks/PageLayout";
import { Button } from "@/components/ui/button";
import EmptyStateShared from "@/components/EmptyState";

// ─── Types ────────────────────────────────────────────────────────────────
type CampaignStatus = "draft" | "scheduled" | "sending" | "running" | "completed" | "failed" | "cancelled" | "paused";

type CalendarCampaign = {
  id: string;
  name: string;
  status: CampaignStatus;
  scheduledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  totalRecipients: number;
  sentCount: number;
  senderName: string;
  isRecurring?: boolean;
};

// ─── Color coding per spec ────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { dot: string; text: string; bg: string }> = {
  scheduled: { dot: "var(--info)", text: "var(--info)", bg: "rgba(var(--info-rgb),0.08)" },
  sending:   { dot: "var(--accent)", text: "var(--accent)", bg: "rgba(var(--accent-rgb),0.08)" },
  running:   { dot: "var(--accent)", text: "var(--accent)", bg: "rgba(var(--accent-rgb),0.08)" },
  completed: { dot: "var(--success)", text: "var(--success)", bg: "rgba(var(--success-rgb),0.08)" },
  sent:      { dot: "var(--success)", text: "var(--success)", bg: "rgba(var(--success-rgb),0.08)" },
  failed:    { dot: "var(--error)", text: "var(--error)", bg: "rgba(var(--error-rgb),0.08)" },
  cancelled: { dot: "var(--error)", text: "var(--error)", bg: "rgba(var(--error-rgb),0.08)" },
  recurring: { dot: "var(--accent-purple)", text: "var(--accent-purple)", bg: "rgba(var(--accent-purple-rgb),0.08)" },
  draft:     { dot: "var(--text-muted)", text: "var(--text-muted)", bg: "rgba(148,159,168,0.08)" },
  paused:    { dot: "var(--warning)", text: "var(--warning)", bg: "rgba(var(--warning-rgb,245,158,11),0.08)" },
};

const STATUS_LABELS: Record<string, string> = {
  draft: "ฉบับร่าง",
  scheduled: "ตั้งเวลา",
  sending: "กำลังส่ง",
  running: "กำลังส่ง",
  completed: "สำเร็จ",
  failed: "ล้มเหลว",
  cancelled: "ยกเลิก",
  paused: "หยุดชั่วคราว",
};

// ─── Helpers ──────────────────────────────────────────────────────────────
const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const THAI_DAYS_SHORT = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Main Component ──────────────────────────────────────────────────────
export default function CampaignCalendarPage() {
  const router = useRouter();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [campaigns, setCampaigns] = useState<CalendarCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);

  // Fetch campaigns
  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const res = await fetch("/api/v1/campaigns?limit=100", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setCampaigns(data.campaigns || data.data || []);
        }
      } catch {
        // API might not exist yet
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, []);

  // Group campaigns by date
  const campaignsByDate = useMemo(() => {
    const map = new Map<string, CalendarCampaign[]>();
    for (const campaign of campaigns) {
      const dateStr = campaign.scheduledAt || campaign.createdAt;
      if (!dateStr) continue;
      const d = new Date(dateStr);
      const key = dateKey(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(campaign);
    }
    return map;
  }, [campaigns]);

  // Calendar grid
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    // Pad start
    for (let i = 0; i < firstDay; i++) days.push(null);
    // Days of month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [year, month, daysInMonth, firstDay]);

  // Navigation
  const goToPrevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  };

  const goToNextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  };

  const goToToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  // Selected date campaigns
  const selectedDateCampaigns = selectedDate
    ? campaignsByDate.get(dateKey(selectedDate)) || []
    : [];

  // Legend items
  const legendItems = [
    { label: "ตั้งเวลา", color: STATUS_COLORS.scheduled.dot },
    { label: "สำเร็จ", color: STATUS_COLORS.completed.dot },
    { label: "ล้มเหลว", color: STATUS_COLORS.failed.dot },
    { label: "ซ้ำ", color: STATUS_COLORS.recurring.dot },
  ];

  return (
    <PageLayout>
      <PageHeader
        title="ปฏิทินแคมเปญ"
        description="ดูภาพรวมแคมเปญทั้งหมดในมุมมองปฏิทิน"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(var(--accent-rgb),0.04)] cursor-pointer"
            >
              วันนี้
            </Button>
            <Button
              onClick={() => router.push("/dashboard/campaigns")}
              className="bg-[var(--accent)] text-[var(--text-on-accent)] hover:bg-[var(--accent)]/90 font-semibold cursor-pointer"
            >
              <Megaphone className="w-4 h-4 mr-1.5" />
              จัดการแคมเปญ
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
          <span className="ml-2 text-sm text-[var(--text-muted)]">กำลังโหลด...</span>
        </div>
      ) : (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goToPrevMonth}
                className="w-8 h-8 rounded-lg border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] min-w-[200px] text-center">
                {THAI_MONTHS[month]} {year + 543}
              </h2>
              <button
                type="button"
                onClick={goToNextMonth}
                className="w-8 h-8 rounded-lg border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Legend */}
            <div className="hidden md:flex items-center gap-4">
              {legendItems.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-xs text-[var(--text-muted)]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-[var(--border-default)]">
            {THAI_DAYS_SHORT.map((day) => (
              <div key={day} className="py-2 text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((date, idx) => {
              if (!date) {
                return <div key={`empty-${idx}`} className="min-h-[100px] md:min-h-[120px] border-b border-r border-[var(--border-subtle)] bg-[var(--bg-base)]/30" />;
              }

              const key = dateKey(date);
              const dayCampaigns = campaignsByDate.get(key) || [];
              const isToday = isSameDay(date, today);
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const hasEvents = dayCampaigns.length > 0;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDate(isSelected ? null : date)}
                  className={`min-h-[100px] md:min-h-[120px] border-b border-r border-[var(--border-subtle)] p-1.5 md:p-2 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[rgba(var(--accent-rgb),0.06)]"
                      : "hover:bg-[var(--bg-elevated)]"
                  }`}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${
                        isToday
                          ? "bg-[var(--accent)] text-[var(--bg-base)]"
                          : "text-[var(--text-primary)]"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {dayCampaigns.length > 3 && (
                      <span className="text-[10px] text-[var(--text-muted)]">+{dayCampaigns.length - 3}</span>
                    )}
                  </div>

                  {/* Campaign dots / mini badges */}
                  <div className="space-y-0.5">
                    {dayCampaigns.slice(0, 3).map((campaign) => {
                      const statusKey = campaign.isRecurring ? "recurring" : campaign.status;
                      const colors = STATUS_COLORS[statusKey] || STATUS_COLORS.draft;
                      return (
                        <div
                          key={campaign.id}
                          className="flex items-center gap-1 rounded px-1 py-0.5 truncate"
                          style={{ background: colors.bg }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: colors.dot }}
                          />
                          <span
                            className="text-[10px] font-medium truncate hidden md:inline"
                            style={{ color: colors.text }}
                          >
                            {campaign.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mobile: just dots */}
                  {hasEvents && (
                    <div className="flex items-center gap-0.5 mt-1 md:hidden">
                      {dayCampaigns.slice(0, 4).map((campaign) => {
                        const statusKey = campaign.isRecurring ? "recurring" : campaign.status;
                        const colors = STATUS_COLORS[statusKey] || STATUS_COLORS.draft;
                        return (
                          <span
                            key={campaign.id}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: colors.dot }}
                          />
                        );
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile Legend */}
          <div className="md:hidden flex items-center gap-3 px-4 py-3 border-t border-[var(--border-default)]">
            {legendItems.map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                <span className="text-[10px] text-[var(--text-muted)]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Date Detail Panel */}
      {selectedDate && (
        <div className="mt-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden animate-fade-in-up">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-default)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {formatThaiDateOnly(selectedDate)}
              {selectedDateCampaigns.length > 0 && (
                <span className="text-[var(--text-muted)] ml-2">({selectedDateCampaigns.length} แคมเปญ)</span>
              )}
            </h3>
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-base)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedDateCampaigns.length > 0 ? (
            <div className="divide-y divide-[var(--border-subtle)]">
              {selectedDateCampaigns.map((campaign) => {
                const statusKey = campaign.isRecurring ? "recurring" : campaign.status;
                const colors = STATUS_COLORS[statusKey] || STATUS_COLORS.draft;
                const label = STATUS_LABELS[campaign.status] || campaign.status;

                return (
                  <button
                    key={campaign.id}
                    type="button"
                    onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
                    className="w-full flex items-center gap-4 px-5 py-3 hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer text-left"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: colors.bg }}
                    >
                      {campaign.isRecurring ? (
                        <Repeat className="w-5 h-5" style={{ color: colors.dot }} />
                      ) : campaign.status === "completed" ? (
                        <CheckCircle2 className="w-5 h-5" style={{ color: colors.dot }} />
                      ) : campaign.status === "failed" || campaign.status === "cancelled" ? (
                        <XCircle className="w-5 h-5" style={{ color: colors.dot }} />
                      ) : (
                        <Megaphone className="w-5 h-5" style={{ color: colors.dot }} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{campaign.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5"
                          style={{ background: colors.bg, color: colors.text }}
                        >
                          <span className="w-1 h-1 rounded-full" style={{ background: colors.dot }} />
                          {label}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {campaign.totalRecipients.toLocaleString()} ราย
                        </span>
                        {campaign.scheduledAt && (
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {formatThaiTime(campaign.scheduledAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <CalendarIcon className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
              <p className="text-sm text-[var(--text-muted)]">ไม่มีแคมเปญในวันนี้</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard/campaigns")}
                className="mt-3 border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                สร้างแคมเปญ
              </Button>
            </div>
          )}
        </div>
      )}
    </PageLayout>
  );
}
