"use client";

import * as React from "react";
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  subDays,
  subMonths,
  subQuarters,
  isBefore,
  isAfter,
  isSameDay,
  isSameMonth,
  getDaysInMonth,
} from "date-fns";
import { th } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import {
  CalendarDays,
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/* ─── Types ─── */

type PresetKey =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "last_quarter"
  | "this_year"
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "custom";

interface DateRangePreset {
  key: PresetKey;
  label: string;
  getRange: () => DateRange;
}

export interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  showTime?: boolean;
  monthPicker?: boolean;
  placeholder?: string;
  align?: "start" | "center" | "end";
  disableFuture?: boolean;
  minDate?: Date;
  maxDate?: Date;
  compact?: boolean;
  presets?: DateRangePreset[];
  className?: string;
}

/* ─── Thai month abbreviations ─── */

const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

/* ─── Default Presets ─── */

const DEFAULT_PRESETS: DateRangePreset[] = [
  {
    key: "today",
    label: "วันนี้",
    getRange: () => ({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    key: "yesterday",
    label: "เมื่อวาน",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 1)),
      to: endOfDay(subDays(new Date(), 1)),
    }),
  },
  {
    key: "this_week",
    label: "สัปดาห์นี้",
    getRange: () => ({
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: endOfWeek(new Date(), { weekStartsOn: 1 }),
    }),
  },
  {
    key: "last_week",
    label: "สัปดาห์ที่แล้ว",
    getRange: () => {
      const prev = subDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 7);
      return {
        from: startOfWeek(prev, { weekStartsOn: 1 }),
        to: endOfWeek(prev, { weekStartsOn: 1 }),
      };
    },
  },
  {
    key: "this_month",
    label: "เดือนนี้",
    getRange: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    key: "last_month",
    label: "เดือนที่แล้ว",
    getRange: () => ({
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
  {
    key: "this_quarter",
    label: "ไตรมาสนี้",
    getRange: () => ({
      from: startOfQuarter(new Date()),
      to: endOfQuarter(new Date()),
    }),
  },
  {
    key: "last_quarter",
    label: "ไตรมาสที่แล้ว",
    getRange: () => ({
      from: startOfQuarter(subQuarters(new Date(), 1)),
      to: endOfQuarter(subQuarters(new Date(), 1)),
    }),
  },
  {
    key: "this_year",
    label: "ปีนี้",
    getRange: () => ({
      from: startOfYear(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    key: "last_7_days",
    label: "7 วัน",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    key: "last_30_days",
    label: "30 วัน",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date()),
    }),
  },
  {
    key: "last_90_days",
    label: "90 วัน",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 89)),
      to: endOfDay(new Date()),
    }),
  },
];

const COMPACT_PRESETS: DateRangePreset[] = [
  DEFAULT_PRESETS[0],
  DEFAULT_PRESETS[9],
  DEFAULT_PRESETS[10],
  DEFAULT_PRESETS[4],
];

const PRESET_GROUPS = [
  [0, 1],
  [2, 3],
  [4, 5],
  [6, 7],
  [8, 9, 10, 11],
] as const;

/* ─── Helpers ─── */

function formatThaiDate(date: Date, includeTime?: boolean): string {
  const day = date.getDate();
  const month = THAI_MONTHS_SHORT[date.getMonth()];
  const year = date.getFullYear();
  let text = `${day} ${month} ${year}`;
  if (includeTime) {
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    text += ` ${h}:${m}`;
  }
  return text;
}

function formatRangeDisplay(
  range: DateRange | undefined,
  showTime?: boolean
): string {
  if (!range?.from) return "";
  if (!range.to || isSameDay(range.from, range.to)) {
    return formatThaiDate(range.from, showTime);
  }
  if (isSameMonth(range.from, range.to)) {
    const startDay = range.from.getDate();
    const endText = formatThaiDate(range.to, showTime);
    if (showTime) {
      return `${formatThaiDate(range.from, true)} — ${endText}`;
    }
    return `${startDay} - ${endText}`;
  }
  return `${formatThaiDate(range.from, showTime)} - ${formatThaiDate(range.to, showTime)}`;
}

function findActivePreset(
  range: DateRange | undefined,
  presets: DateRangePreset[]
): PresetKey | null {
  if (!range?.from || !range?.to) return null;
  for (const preset of presets) {
    const p = preset.getRange();
    if (
      p.from &&
      p.to &&
      isSameDay(range.from, p.from) &&
      isSameDay(range.to, p.to)
    ) {
      return preset.key;
    }
  }
  return "custom";
}

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

/* ─── Sub-components ─── */

function TimeInput({
  label,
  hours,
  minutes,
  onHoursChange,
  onMinutesChange,
}: {
  label: string;
  hours: number;
  minutes: number;
  onHoursChange: (h: number) => void;
  onMinutesChange: (m: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          max={23}
          value={String(hours).padStart(2, "0")}
          onChange={(e) => {
            const v = Math.min(23, Math.max(0, Number(e.target.value) || 0));
            onHoursChange(v);
          }}
          className="w-11 h-8 text-center text-[13px] font-mono font-medium bg-[var(--bg-base)] border border-[var(--border-default)] rounded-md text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
        />
        <span className="text-sm font-bold text-[var(--text-muted)]">:</span>
        <input
          type="number"
          min={0}
          max={59}
          value={String(minutes).padStart(2, "0")}
          onChange={(e) => {
            const v = Math.min(59, Math.max(0, Number(e.target.value) || 0));
            onMinutesChange(v);
          }}
          className="w-11 h-8 text-center text-[13px] font-mono font-medium bg-[var(--bg-base)] border border-[var(--border-default)] rounded-md text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
        />
      </div>
    </div>
  );
}

function MonthPickerGrid({
  year,
  onYearChange,
  selectedRange,
  onMonthSelect,
  disableFuture,
  onBack,
}: {
  year: number;
  onYearChange: (y: number) => void;
  selectedRange: DateRange | undefined;
  onMonthSelect: (monthIndex: number) => void;
  disableFuture?: boolean;
  onBack?: () => void;
}) {
  const now = new Date();

  return (
    <div className="p-4 flex-1">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => onYearChange(year - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-base font-bold text-[var(--text-primary)]">
          {year}
        </span>
        <button
          type="button"
          onClick={() => onYearChange(year + 1)}
          disabled={disableFuture && year >= now.getFullYear()}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {THAI_MONTHS_SHORT.map((label, idx) => {
          const isCurrentMonth =
            idx === now.getMonth() && year === now.getFullYear();
          const isFutureMonth =
            disableFuture &&
            (year > now.getFullYear() ||
              (year === now.getFullYear() && idx > now.getMonth()));

          const cellDate = new Date(year, idx, 1);
          const isSelected =
            selectedRange?.from &&
            isSameMonth(cellDate, selectedRange.from) &&
            selectedRange.from.getFullYear() === year;
          const isEndSelected =
            selectedRange?.to &&
            isSameMonth(cellDate, selectedRange.to) &&
            selectedRange.to.getFullYear() === year;
          const isInRange =
            selectedRange?.from &&
            selectedRange?.to &&
            isAfter(cellDate, startOfMonth(selectedRange.from)) &&
            isBefore(cellDate, startOfMonth(selectedRange.to));

          return (
            <button
              key={idx}
              type="button"
              disabled={isFutureMonth}
              onClick={() => onMonthSelect(idx)}
              className={cn(
                "h-12 flex items-center justify-center rounded-lg text-[13px] font-medium cursor-pointer transition-all border border-transparent",
                isSelected || isEndSelected
                  ? "bg-[var(--accent)] text-[var(--bg-inset)] font-semibold"
                  : isInRange
                    ? "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--text-primary)]"
                    : "text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.06)] hover:border-[var(--border-default)]",
                isCurrentMonth &&
                  !isSelected &&
                  !isEndSelected &&
                  "border-[rgba(var(--accent-rgb),0.3)]",
                isFutureMonth && "opacity-30 pointer-events-none"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-3 text-xs text-[var(--accent)] hover:underline cursor-pointer"
        >
          กลับปฏิทิน
        </button>
      )}
    </div>
  );
}

function PresetSidebar({
  presets,
  activeKey,
  onSelect,
}: {
  presets: DateRangePreset[];
  activeKey: PresetKey | null;
  onSelect: (preset: DateRangePreset) => void;
}) {
  return (
    <div className="w-40 flex-shrink-0 border-r border-[var(--border-default)] py-3 overflow-y-auto bg-[var(--bg-surface)]">
      {PRESET_GROUPS.map((group, gi) => (
        <React.Fragment key={gi}>
          {gi > 0 && (
            <div className="mx-3 my-2 h-px bg-[var(--border-default)]" />
          )}
          {group.map((idx) => {
            const preset = presets[idx];
            if (!preset) return null;
            const isActive = activeKey === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => onSelect(preset)}
                className={cn(
                  "block w-full px-4 py-2 text-left text-[13px] font-normal cursor-pointer transition-all",
                  isActive
                    ? "bg-[rgba(var(--accent-rgb),0.06)] text-[var(--accent)] font-medium border-l-2 border-[var(--accent)]"
                    : "text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--text-primary)] border-l-2 border-transparent"
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

function CompactPresetPills({
  presets,
  activeKey,
  onSelect,
}: {
  presets: DateRangePreset[];
  activeKey: PresetKey | null;
  onSelect: (preset: DateRangePreset) => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto px-4 pb-2">
      {presets.map((preset) => {
        const isActive = activeKey === preset.key;
        return (
          <button
            key={preset.key}
            type="button"
            onClick={() => onSelect(preset)}
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors flex-shrink-0",
              isActive
                ? "bg-[rgba(var(--accent-rgb),0.12)] text-[var(--accent)] border border-[rgba(var(--accent-rgb),0.3)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)] border border-[var(--border-default)]"
            )}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}

function PickerFooter({
  range,
  showTime,
  onClear,
  onApply,
}: {
  range: DateRange | undefined;
  showTime?: boolean;
  onClear: () => void;
  onApply: () => void;
}) {
  const hasRange = range?.from != null;
  return (
    <div className="border-t border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3">
      <div className="flex items-center gap-1.5 mb-3 text-[13px] font-mono">
        <CalendarDays size={14} className="text-[var(--accent)]" />
        {hasRange ? (
          <span className="text-[var(--text-primary)]">
            {formatRangeDisplay(range, showTime)}
          </span>
        ) : (
          <span className="text-[var(--text-muted)]">
            ยังไม่ได้เลือกช่วงเวลา
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onClear}
          disabled={!hasRange}
          className="px-3 py-1.5 rounded-md text-[13px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
        >
          ล้าง
        </button>
        <button
          type="button"
          onClick={onApply}
          disabled={!hasRange}
          className="px-5 py-1.5 rounded-md text-[13px] font-semibold bg-[var(--accent)] text-[var(--bg-inset)] hover:bg-[var(--accent-alt)] transition-colors cursor-pointer min-w-[80px] disabled:opacity-40 disabled:pointer-events-none"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   DateRangePicker — Main Component
   ═══════════════════════════════════════════ */

export function DateRangePicker({
  value,
  onChange,
  showTime = false,
  monthPicker = false,
  placeholder = "เลือกช่วงเวลา",
  align = "start",
  disableFuture = false,
  minDate,
  maxDate,
  compact = false,
  presets: customPresets,
  className,
}: DateRangePickerProps) {
  const isMobile = useIsMobile();
  const presets = customPresets ?? DEFAULT_PRESETS;

  const [open, setOpen] = React.useState(false);
  const [internalRange, setInternalRange] = React.useState<
    DateRange | undefined
  >(value);
  const [showMonthPicker, setShowMonthPicker] = React.useState(monthPicker);
  const [monthPickerYear, setMonthPickerYear] = React.useState(
    new Date().getFullYear()
  );
  const [monthPickerStartMonth, setMonthPickerStartMonth] = React.useState<
    number | null
  >(null);

  const [startHours, setStartHours] = React.useState(0);
  const [startMinutes, setStartMinutes] = React.useState(0);
  const [endHours, setEndHours] = React.useState(23);
  const [endMinutes, setEndMinutes] = React.useState(59);

  React.useEffect(() => {
    setInternalRange(value);
    if (value?.from) {
      setStartHours(value.from.getHours());
      setStartMinutes(value.from.getMinutes());
    }
    if (value?.to) {
      setEndHours(value.to.getHours());
      setEndMinutes(value.to.getMinutes());
    }
  }, [value]);

  React.useEffect(() => {
    if (open) {
      setInternalRange(value);
      setShowMonthPicker(monthPicker);
      if (value?.from) {
        setStartHours(value.from.getHours());
        setStartMinutes(value.from.getMinutes());
      } else {
        setStartHours(0);
        setStartMinutes(0);
      }
      if (value?.to) {
        setEndHours(value.to.getHours());
        setEndMinutes(value.to.getMinutes());
      } else {
        setEndHours(23);
        setEndMinutes(59);
      }
    }
  }, [open, value, monthPicker]);

  const activeKey = findActivePreset(internalRange, presets);

  const handlePresetSelect = React.useCallback((preset: DateRangePreset) => {
    const range = preset.getRange();
    setInternalRange(range);
    if (range.from) {
      setStartHours(range.from.getHours());
      setStartMinutes(range.from.getMinutes());
    }
    if (range.to) {
      setEndHours(range.to.getHours());
      setEndMinutes(range.to.getMinutes());
    }
  }, []);

  const handleCalendarSelect = React.useCallback(
    (range: DateRange | undefined) => {
      // If only from is selected (first click), keep to undefined so user picks end date next
      if (range?.from && range?.to && isSameDay(range.from, range.to) && !internalRange?.from) {
        setInternalRange({ from: range.from, to: undefined });
      } else if (range?.from && range?.to && isBefore(range.to, range.from)) {
        setInternalRange({ from: range.to, to: range.from });
      } else {
        setInternalRange(range);
      }
    },
    [internalRange?.from]
  );

  const handleMonthSelect = React.useCallback(
    (monthIndex: number) => {
      if (monthPickerStartMonth === null) {
        setMonthPickerStartMonth(monthIndex);
        const from = new Date(monthPickerYear, monthIndex, 1);
        const to = new Date(
          monthPickerYear,
          monthIndex,
          getDaysInMonth(from)
        );
        setInternalRange({ from: startOfDay(from), to: endOfDay(to) });
      } else {
        const startDate = new Date(monthPickerYear, monthPickerStartMonth, 1);
        const endDate = new Date(monthPickerYear, monthIndex, 1);
        const [from, to] = isBefore(startDate, endDate)
          ? [startDate, endDate]
          : [endDate, startDate];
        setInternalRange({
          from: startOfDay(from),
          to: endOfDay(
            new Date(to.getFullYear(), to.getMonth(), getDaysInMonth(to))
          ),
        });
        setMonthPickerStartMonth(null);
      }
    },
    [monthPickerYear, monthPickerStartMonth]
  );

  const handleClear = React.useCallback(() => {
    setInternalRange(undefined);
    setStartHours(0);
    setStartMinutes(0);
    setEndHours(23);
    setEndMinutes(59);
    setMonthPickerStartMonth(null);
  }, []);

  const handleApply = React.useCallback(() => {
    if (!internalRange?.from) return;
    let from = internalRange.from;
    let to = internalRange.to ?? internalRange.from;

    if (showTime) {
      from = new Date(from);
      from.setHours(startHours, startMinutes, 0, 0);
      to = new Date(to);
      to.setHours(endHours, endMinutes, 59, 999);
    }

    onChange({ from, to });
    setOpen(false);
  }, [
    internalRange,
    showTime,
    startHours,
    startMinutes,
    endHours,
    endMinutes,
    onChange,
  ]);

  const handleTriggerClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(undefined);
    },
    [onChange]
  );

  const displayText = value?.from
    ? formatRangeDisplay(value, showTime)
    : placeholder;

  /* ─── Picker Content ─── */

  const pickerContent = (
    <div className="flex flex-col">
      <div className={cn("flex", isMobile ? "flex-col" : "flex-row")}>
        {!compact && !isMobile && (
          <PresetSidebar
            presets={presets}
            activeKey={activeKey}
            onSelect={handlePresetSelect}
          />
        )}

        <div className="flex-1 flex flex-col">
          {(compact || isMobile) && (
            <div className="pt-3">
              <CompactPresetPills
                presets={compact ? COMPACT_PRESETS : presets}
                activeKey={activeKey}
                onSelect={handlePresetSelect}
              />
            </div>
          )}

          {showMonthPicker ? (
            <MonthPickerGrid
              year={monthPickerYear}
              onYearChange={setMonthPickerYear}
              selectedRange={internalRange}
              onMonthSelect={handleMonthSelect}
              disableFuture={disableFuture}
              onBack={monthPicker ? undefined : () => setShowMonthPicker(false)}
            />
          ) : (
            <div className="p-3">
              <Calendar
                mode="range"
                selected={internalRange}
                onSelect={handleCalendarSelect}
                numberOfMonths={isMobile ? 1 : 2}
                locale={th}
                defaultMonth={internalRange?.from ?? new Date()}
                disabled={disableFuture ? { after: new Date() } : undefined}
              />
            </div>
          )}

          {showTime && !showMonthPicker && (
            <div className="border-t border-[var(--border-default)] px-4 py-3 flex items-center gap-6">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
                <Clock size={14} />
                <span>เวลา</span>
              </div>
              <TimeInput
                label="เริ่ม:"
                hours={startHours}
                minutes={startMinutes}
                onHoursChange={setStartHours}
                onMinutesChange={setStartMinutes}
              />
              <TimeInput
                label="สิ้นสุด:"
                hours={endHours}
                minutes={endMinutes}
                onHoursChange={setEndHours}
                onMinutesChange={setEndMinutes}
              />
            </div>
          )}
        </div>
      </div>

      <PickerFooter
        range={internalRange}
        showTime={showTime}
        onClear={handleClear}
        onApply={handleApply}
      />
    </div>
  );

  /* ─── Trigger ─── */

  const triggerInner = (
    <>
      <CalendarDays
        size={16}
        className="text-[var(--text-muted)] flex-shrink-0"
      />
      <span
        className={cn(
          "text-[13px] font-mono truncate",
          value?.from
            ? "text-[var(--text-primary)]"
            : "text-[var(--text-muted)]"
        )}
      >
        {displayText}
      </span>
      {value?.from && (
        <span
          role="button"
          tabIndex={-1}
          onClick={handleTriggerClear}
          onKeyDown={(e) => {
            if (e.key === "Enter")
              handleTriggerClear(e as unknown as React.MouseEvent);
          }}
          className="ml-auto p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
        >
          <X size={14} />
        </span>
      )}
    </>
  );

  /* ─── Mobile: Sheet ─── */

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex items-center gap-2 h-10 px-3 min-w-[220px] max-w-[320px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] cursor-pointer transition-all",
            "hover:border-[rgba(var(--accent-rgb),0.5)] hover:bg-[rgba(255,255,255,0.02)]",
            className
          )}
        >
          {triggerInner}
        </button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="rounded-t-2xl bg-[var(--bg-elevated)] max-h-[85vh] overflow-y-auto p-0"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[var(--border-default)]" />
            </div>
            <SheetHeader className="px-4 pb-2">
              <SheetTitle>เลือกช่วงเวลา</SheetTitle>
            </SheetHeader>
            {pickerContent}
          </SheetContent>
        </Sheet>
      </>
    );
  }

  /* ─── Desktop: Popover ─── */

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "inline-flex items-center gap-2 h-10 px-3 min-w-[220px] max-w-[320px] justify-start font-normal",
              open && "border-[var(--accent)] ring-2 ring-[rgba(var(--accent-rgb),0.2)]",
              className
            )}
          />
        }
      >
        {triggerInner}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={cn(
          "p-0 rounded-xl bg-[var(--bg-elevated)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden",
          compact ? "w-[480px]" : "w-auto"
        )}
      >
        {pickerContent}
      </PopoverContent>
    </Popover>
  );
}
