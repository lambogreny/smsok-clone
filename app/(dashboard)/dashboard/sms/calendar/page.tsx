"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Send,
  Ban,
  XCircle,
  X,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatThaiDate } from "@/lib/format-thai-date";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PageLayout, { PageHeader } from "@/components/blocks/PageLayout";

/* ─── Types ─── */

type ScheduledStatus = "pending" | "sent" | "cancelled" | "failed";

type ScheduledSms = {
  id: string;
  senderName: string;
  recipient: string;
  content: string;
  scheduledAt: string;
  status: ScheduledStatus;
  creditCost: number;
  createdAt: string;
};

type ViewMode = "month" | "week";

/* ─── Status Config ─── */

const STATUS_CONFIG: Record<
  ScheduledStatus,
  { label: string; color: string; rgb: string; icon: typeof Clock; bg: string }
> = {
  pending: {
    label: "รอส่ง",
    color: "var(--accent-blue)",
    rgb: "var(--accent-blue-rgb)",
    icon: Clock,
    bg: "rgba(var(--accent-blue-rgb),0.08)",
  },
  sent: {
    label: "ส่งแล้ว",
    color: "var(--success)",
    rgb: "var(--success-rgb, 34,197,94)",
    icon: Send,
    bg: "rgba(var(--success-rgb, 34,197,94),0.08)",
  },
  cancelled: {
    label: "ยกเลิก",
    color: "var(--text-muted)",
    rgb: "155,161,165",
    icon: Ban,
    bg: "rgba(155,161,165,0.08)",
  },
  failed: {
    label: "ล้มเหลว",
    color: "var(--error)",
    rgb: "var(--error-rgb, 239,68,68)",
    icon: XCircle,
    bg: "rgba(var(--error-rgb, 239,68,68),0.08)",
  },
};

/* ─── Helpers ─── */

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const THAI_DAYS_SHORT = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const days: { date: number; month: number; year: number; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    days.push({ date: d, month: m, year: y, isCurrentMonth: false });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: d, month, year, isCurrentMonth: true });
  }

  // Next month leading days
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    days.push({ date: d, month: m, year: y, isCurrentMonth: false });
  }

  return days;
}

function getWeekDays(baseDate: Date) {
  const startOfWeek = new Date(baseDate);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const days: { date: number; month: number; year: number; isCurrentMonth: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    days.push({
      date: d.getDate(),
      month: d.getMonth(),
      year: d.getFullYear(),
      isCurrentMonth: d.getMonth() === baseDate.getMonth(),
    });
  }
  return days;
}

function isSameDay(d1: Date, d2: { date: number; month: number; year: number }) {
  return d1.getDate() === d2.date && d1.getMonth() === d2.month && d1.getFullYear() === d2.year;
}

function isToday(day: { date: number; month: number; year: number }) {
  const now = new Date();
  return day.date === now.getDate() && day.month === now.getMonth() && day.year === now.getFullYear();
}

function dateKey(day: { date: number; month: number; year: number }) {
  return `${day.year}-${String(day.month + 1).padStart(2, "0")}-${String(day.date).padStart(2, "0")}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false });
}

/* ─── Detail Panel ─── */

function DayDetailPanel({
  day,
  items,
  onClose,
}: {
  day: { date: number; month: number; year: number };
  items: ScheduledSms[];
  onClose: () => void;
}) {
  const dateStr = `${day.date} ${THAI_MONTHS[day.month]} ${day.year + 543}`;

  return (
    <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] p-5 animate-fade-in-scale">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
          {dateStr}
        </h3>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)] transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-[13px] text-[var(--text-muted)] text-center py-6">
          ไม่มี SMS ตั้งเวลาในวันนี้
        </p>
      ) : (
        <div className="space-y-2.5">
          {items.map((sms) => {
            const cfg = STATUS_CONFIG[sms.status];
            const Icon = cfg.icon;
            return (
              <div
                key={sms.id}
                className="rounded-lg border border-[var(--border-default)] p-3 hover:border-[rgba(var(--accent-rgb),0.15)] transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-mono text-[var(--text-secondary)]">
                      {formatTime(sms.scheduledAt)}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)] font-mono">
                    {sms.creditCost} SMS
                  </span>
                </div>
                <p className="text-[13px] text-[var(--text-primary)] line-clamp-2 leading-relaxed mb-1.5">
                  {sms.content}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                  <span>{sms.senderName}</span>
                  <span className="text-[var(--border-default)]">|</span>
                  <span className="font-mono">{sms.recipient}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ─── Main ─── */

export default function ScheduledCalendarPage() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDay, setSelectedDay] = useState<{ date: number; month: number; year: number } | null>(null);
  const [items, setItems] = useState<ScheduledSms[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch scheduled SMS
  useEffect(() => {
    setLoading(true);
    fetch("/api/v1/sms/scheduled")
      .then((r) => (r.ok ? r.json() : { scheduled: [] }))
      .then((data) => {
        setItems(Array.isArray(data) ? data : data.scheduled ?? data.data?.scheduled ?? []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  // Group items by date
  const itemsByDate = useMemo(() => {
    const map: Record<string, ScheduledSms[]> = {};
    for (const item of items) {
      const d = new Date(item.scheduledAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }
    return map;
  }, [items]);

  // Navigation
  function navigate(direction: -1 | 1) {
    const next = new Date(currentDate);
    if (viewMode === "month") {
      next.setMonth(next.getMonth() + direction);
    } else {
      next.setDate(next.getDate() + direction * 7);
    }
    setCurrentDate(next);
    setSelectedDay(null);
  }

  function goToToday() {
    setCurrentDate(new Date());
    setSelectedDay(null);
  }

  const days =
    viewMode === "month"
      ? getMonthDays(currentDate.getFullYear(), currentDate.getMonth())
      : getWeekDays(currentDate);

  const selectedItems = selectedDay ? itemsByDate[dateKey(selectedDay)] ?? [] : [];

  // Summary counts
  const statusCounts = useMemo(() => {
    const counts: Record<ScheduledStatus, number> = { pending: 0, sent: 0, cancelled: 0, failed: 0 };
    for (const item of items) {
      if (item.status in counts) counts[item.status]++;
    }
    return counts;
  }, [items]);

  return (
    <PageLayout>
      <PageHeader
        title="ปฏิทิน SMS"
        description="ดู SMS ตั้งเวลาในรูปแบบปฏิทิน"
        actions={
          <Link
            href="/dashboard/sms/scheduled"
            className="flex items-center gap-1.5 text-[13px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปรายการ
          </Link>
        }
      />

      {/* Status Summary Bar */}
      <div className="flex items-center gap-4 mb-6 p-3.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-x-auto">
        {(Object.entries(STATUS_CONFIG) as [ScheduledStatus, typeof STATUS_CONFIG[ScheduledStatus]][]).map(
          ([status, cfg]) => {
            const Icon = cfg.icon;
            return (
              <div key={status} className="flex items-center gap-2 shrink-0">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center"
                  style={{ background: cfg.bg }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                </div>
                <div>
                  <div className="text-[15px] font-bold text-[var(--text-primary)] tabular-nums">
                    {statusCounts[status]}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)]">{cfg.label}</div>
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-lg border border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-[17px] font-semibold text-[var(--text-primary)] min-w-[180px] text-center">
            {THAI_MONTHS[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
          </h2>
          <button
            onClick={() => navigate(1)}
            className="w-8 h-8 rounded-lg border border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="ml-2 border-[var(--border-default)] text-[var(--text-secondary)] text-[12px] h-8"
          >
            วันนี้
          </Button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)]">
          {(["month", "week"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setViewMode(mode);
                setSelectedDay(null);
              }}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                viewMode === mode
                  ? "bg-[rgba(var(--accent-rgb),0.08)] text-[var(--accent)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {mode === "month" ? "เดือน" : "สัปดาห์"}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg overflow-hidden mb-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
          </div>
        ) : (
          <>
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-[var(--border-default)]">
              {THAI_DAYS_SHORT.map((d) => (
                <div
                  key={d}
                  className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-muted)]"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day Cells */}
            <div className={`grid grid-cols-7 ${viewMode === "month" ? "" : ""}`}>
              {days.map((day, i) => {
                const key = dateKey(day);
                const dayItems = itemsByDate[key] ?? [];
                const isSelected = selectedDay && dateKey(selectedDay) === key;
                const todayClass = isToday(day);

                // Count by status for dots
                const statusDots: ScheduledStatus[] = [];
                for (const item of dayItems) {
                  if (!statusDots.includes(item.status)) statusDots.push(item.status);
                }

                return (
                  <button
                    key={`${key}-${i}`}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={cn(
                      "relative flex flex-col items-center py-3 min-h-[72px] border-b border-r border-[var(--border-default)] transition-all text-left",
                      day.isCurrentMonth
                        ? "hover:bg-[rgba(var(--accent-rgb),0.03)]"
                        : "opacity-40",
                      isSelected && "bg-[rgba(var(--accent-rgb),0.06)]",
                      i % 7 === 6 && "border-r-0"
                    )}
                  >
                    {/* Date Number */}
                    <span
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-medium mb-1",
                        todayClass
                          ? "bg-[var(--accent)] text-[var(--bg-base)] font-bold"
                          : "text-[var(--text-primary)]"
                      )}
                    >
                      {day.date}
                    </span>

                    {/* Status Dots */}
                    {statusDots.length > 0 && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {statusDots.slice(0, 4).map((status) => (
                          <span
                            key={status}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: STATUS_CONFIG[status].color }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Item count badge */}
                    {dayItems.length > 0 && (
                      <span className="mt-0.5 text-[10px] font-medium text-[var(--accent)] tabular-nums">
                        {dayItems.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* Selected Day Detail */}
      {selectedDay && (
        <DayDetailPanel
          day={selectedDay}
          items={selectedItems}
          onClose={() => setSelectedDay(null)}
        />
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-[11px] text-[var(--text-muted)]">
        {(Object.entries(STATUS_CONFIG) as [ScheduledStatus, typeof STATUS_CONFIG[ScheduledStatus]][]).map(
          ([status, cfg]) => (
            <div key={status} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: cfg.color }}
              />
              {cfg.label}
            </div>
          )
        )}
      </div>
    </PageLayout>
  );
}
