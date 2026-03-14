"use client";

import { useState, useMemo } from "react";
import {
  Repeat,
  Plus,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Play,
  Pause,
  CalendarDays,
  CheckCircle2,
  X,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { formatThaiDate, formatThaiDateOnly } from "@/lib/format-thai-date";
import EmptyStateShared from "@/components/EmptyState";
import PageLayout, {
  PageHeader,
  StatsRow,
  StatCard,
  FilterBar,
  TableWrapper,
  PaginationBar,
  EmptyState,
} from "@/components/blocks/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import CustomSelect from "@/components/ui/CustomSelect";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Types ────────────────────────────────────────────────────────────────
type Frequency = "daily" | "weekly" | "monthly" | "custom";
type RecurringStatus = "active" | "paused" | "draft";

type RecurringCampaign = {
  id: string;
  name: string;
  message: string;
  senderName: string;
  contactGroupId: string;
  contactGroupName: string;
  recipientCount: number;
  frequency: Frequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  customCron?: string;
  status: RecurringStatus;
  totalRuns: number;
  totalSent: number;
  totalCreditsUsed: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
};

// ─── Constants ────────────────────────────────────────────────────────────
const FREQUENCY_OPTIONS = [
  { value: "daily", label: "ทุกวัน" },
  { value: "weekly", label: "ทุกสัปดาห์" },
  { value: "monthly", label: "ทุกเดือน" },
  { value: "custom", label: "กำหนดเอง" },
];

const DAY_OPTIONS = [
  { value: "0", label: "วันอาทิตย์" },
  { value: "1", label: "วันจันทร์" },
  { value: "2", label: "วันอังคาร" },
  { value: "3", label: "วันพุธ" },
  { value: "4", label: "วันพฤหัสบดี" },
  { value: "5", label: "วันศุกร์" },
  { value: "6", label: "วันเสาร์" },
];

const DAY_OF_MONTH_OPTIONS = Array.from({ length: 28 }, (_, i) => ({
  value: String(i + 1),
  label: `วันที่ ${i + 1}`,
}));

const STATUS_CONFIG: Record<RecurringStatus, { label: string; color: string; bg: string; dot?: boolean; pulse?: boolean }> = {
  active: { label: "ใช้งาน", color: "var(--success)", bg: "rgba(var(--success-rgb),0.08)", dot: true, pulse: true },
  paused: { label: "หยุดชั่วคราว", color: "var(--warning)", bg: "rgba(var(--warning-rgb,245,158,11),0.08)" },
  draft:  { label: "ฉบับร่าง", color: "var(--text-muted)", bg: "rgba(148,159,168,0.08)" },
};

const FILTER_PILLS: { key: RecurringStatus | "all"; label: string; color: string; rgb: string }[] = [
  { key: "all",    label: "ทั้งหมด",     color: "var(--text-muted)", rgb: "var(--text-muted-rgb)" },
  { key: "active", label: "ใช้งาน",     color: "var(--success)", rgb: "var(--success-rgb)" },
  { key: "paused", label: "หยุดชั่วคราว", color: "var(--warning)", rgb: "var(--warning-rgb,245,158,11)" },
  { key: "draft",  label: "ฉบับร่าง",    color: "var(--text-muted)", rgb: "var(--text-muted-rgb)" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: RecurringStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full text-[11px] font-medium"
      style={{ padding: "3px 10px", background: cfg.bg, color: cfg.color }}
    >
      {cfg.dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${cfg.pulse ? "animate-pulse" : ""}`}
          style={{ background: cfg.color }}
        />
      )}
      {cfg.label}
    </span>
  );
}

function FrequencyLabel({ frequency, dayOfWeek, dayOfMonth, time }: {
  frequency: Frequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
}) {
  let text = "";
  switch (frequency) {
    case "daily":
      text = `ทุกวัน ${time} น.`;
      break;
    case "weekly":
      text = `ทุก${DAY_OPTIONS[dayOfWeek || 0]?.label} ${time} น.`;
      break;
    case "monthly":
      text = `ทุกวันที่ ${dayOfMonth || 1} ${time} น.`;
      break;
    case "custom":
      text = `กำหนดเอง ${time} น.`;
      break;
  }
  return <span className="text-sm text-[var(--text-secondary)]">{text}</span>;
}

function getNextRunDates(frequency: Frequency, time: string, dayOfWeek?: number, dayOfMonth?: number, count = 5): Date[] {
  const dates: Date[] = [];
  const [hours, minutes] = time.split(":").map(Number);
  const now = new Date();
  const current = new Date(now);
  current.setHours(hours || 0, minutes || 0, 0, 0);

  if (current <= now) {
    current.setDate(current.getDate() + 1);
  }

  for (let i = 0; i < count * 60 && dates.length < count; i++) {
    const candidate = new Date(current);
    candidate.setDate(current.getDate() + i);

    switch (frequency) {
      case "daily":
        dates.push(candidate);
        break;
      case "weekly":
        if (candidate.getDay() === (dayOfWeek ?? 1)) dates.push(candidate);
        break;
      case "monthly":
        if (candidate.getDate() === (dayOfMonth ?? 1)) dates.push(candidate);
        break;
      case "custom":
        dates.push(candidate);
        break;
    }
  }

  return dates.slice(0, count);
}

// ─── Per-page constant ───────────────────────────────────────────────────
const PER_PAGE = 20;

// ─── Main Component ──────────────────────────────────────────────────────
export default function RecurringCampaignPage() {
  const [campaigns, setCampaigns] = useState<RecurringCampaign[]>([]);
  const [filterStatus, setFilterStatus] = useState<RecurringStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formFrequency, setFormFrequency] = useState<Frequency>("weekly");
  const [formDayOfWeek, setFormDayOfWeek] = useState("1");
  const [formDayOfMonth, setFormDayOfMonth] = useState("1");
  const [formTime, setFormTime] = useState("09:00");

  // ─── Handlers ───────────────────────────────────────────────────────
  const handleToggleStatus = (id: string, currentStatus: RecurringStatus) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)),
    );
    toast.success(newStatus === "active" ? "เปิดใช้งานแล้ว" : "หยุดชั่วคราวแล้ว");
  };

  const handleCreate = () => {
    if (!formName.trim()) {
      toast.error("กรุณากรอกชื่อแคมเปญ");
      return;
    }
    if (!formMessage.trim()) {
      toast.error("กรุณากรอกข้อความ");
      return;
    }

    const newCampaign: RecurringCampaign = {
      id: `rc_${Date.now()}`,
      name: formName,
      message: formMessage,
      senderName: "SMSOK",
      contactGroupId: "",
      contactGroupName: "ทั้งหมด",
      recipientCount: 0,
      frequency: formFrequency,
      dayOfWeek: formFrequency === "weekly" ? Number(formDayOfWeek) : undefined,
      dayOfMonth: formFrequency === "monthly" ? Number(formDayOfMonth) : undefined,
      time: formTime,
      status: "draft",
      totalRuns: 0,
      totalSent: 0,
      totalCreditsUsed: 0,
      lastRunAt: null,
      nextRunAt: null,
      createdAt: new Date().toISOString(),
    };

    setCampaigns((prev) => [newCampaign, ...prev]);
    setFormName("");
    setFormMessage("");
    setFormFrequency("weekly");
    setFormTime("09:00");
    setShowForm(false);
    toast.success("สร้างแคมเปญซ้ำสำเร็จ");
  };

  // Preview next 5 runs
  const nextRuns = useMemo(
    () => getNextRunDates(
      formFrequency,
      formTime,
      Number(formDayOfWeek),
      Number(formDayOfMonth),
    ),
    [formFrequency, formTime, formDayOfWeek, formDayOfMonth],
  );

  // ─── Derived data ───────────────────────────────────────────────────
  const filtered = campaigns
    .filter((c) => filterStatus === "all" || c.status === filterStatus)
    .filter(
      (c) =>
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const activeCount = campaigns.filter((c) => c.status === "active").length;
  const pausedCount = campaigns.filter((c) => c.status === "paused").length;
  const totalRuns = campaigns.reduce((sum, c) => sum + c.totalRuns, 0);

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <PageLayout>
      <PageHeader
        title="แคมเปญซ้ำ"
        count={campaigns.length}
        description="ตั้งเวลาส่ง SMS อัตโนมัติแบบซ้ำตามรอบที่กำหนด"
        actions={
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-[var(--accent)] text-[var(--text-on-accent)] hover:bg-[var(--accent)]/90 font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            สร้างแคมเปญซ้ำ
          </Button>
        }
      />

      {/* Stats */}
      <StatsRow columns={4}>
        <StatCard
          icon={<Repeat className="w-[18px] h-[18px] text-[var(--accent)]" />}
          iconColor="var(--accent-rgb)"
          value={campaigns.length}
          label="ทั้งหมด"
        />
        <StatCard
          icon={<Play className="w-[18px] h-[18px] text-emerald-500" />}
          iconColor="16,185,129"
          value={activeCount}
          label="ใช้งาน"
        />
        <StatCard
          icon={<Pause className="w-[18px] h-[18px] text-amber-500" />}
          iconColor="245,158,11"
          value={pausedCount}
          label="หยุดชั่วคราว"
        />
        <StatCard
          icon={<CheckCircle2 className="w-[18px] h-[18px] text-[var(--info)]" />}
          iconColor="var(--info-rgb)"
          value={totalRuns}
          label="ส่งแล้ว (ครั้ง)"
        />
      </StatsRow>

      {/* Create Form */}
      {showForm && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-6 mb-4 animate-fade-in-up">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[rgba(var(--accent-rgb),0.08)] border border-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center">
                <Repeat className="w-4 h-4 text-[var(--accent)]" />
              </div>
              สร้างแคมเปญซ้ำใหม่
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-base)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">ชื่อแคมเปญ *</label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="เช่น โปรโมชั่นรายสัปดาห์"
                  className="bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
              </div>

              <div>
                <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">ข้อความ *</label>
                <Textarea
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  placeholder="พิมพ์ข้อความ SMS..."
                  rows={4}
                  className="bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">ความถี่</label>
                  <CustomSelect
                    value={formFrequency}
                    onChange={(v) => setFormFrequency(v as Frequency)}
                    options={FREQUENCY_OPTIONS}
                    placeholder="เลือกความถี่"
                  />
                </div>

                {formFrequency === "weekly" && (
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">วัน</label>
                    <CustomSelect
                      value={formDayOfWeek}
                      onChange={setFormDayOfWeek}
                      options={DAY_OPTIONS}
                      placeholder="เลือกวัน"
                    />
                  </div>
                )}

                {formFrequency === "monthly" && (
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">วันที่</label>
                    <CustomSelect
                      value={formDayOfMonth}
                      onChange={setFormDayOfMonth}
                      options={DAY_OF_MONTH_OPTIONS}
                      placeholder="เลือกวันที่"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">เวลาส่ง</label>
                <Input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-primary)] w-full"
                />
              </div>
            </div>

            {/* Right: Preview next 5 runs */}
            <div>
              <div className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  ตัวอย่าง 5 รอบถัดไป
                </h4>
                <div className="space-y-2">
                  {nextRuns.map((date, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 py-2 px-3 rounded-lg border border-[var(--border-subtle)]"
                      style={{ background: i === 0 ? "rgba(var(--accent-rgb),0.04)" : "transparent" }}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{
                          background: i === 0 ? "rgba(var(--accent-rgb),0.12)" : "rgba(var(--text-muted-rgb),0.08)",
                          color: i === 0 ? "var(--accent)" : "var(--text-muted)",
                        }}
                      >
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm text-[var(--text-primary)]">
                          {formatThaiDateOnly(date)}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)]">{formTime} น.</p>
                      </div>
                      {i === 0 && (
                        <span
                          className="ml-auto text-[10px] font-medium rounded-full px-2 py-0.5"
                          style={{ background: "rgba(var(--accent-rgb),0.08)", color: "var(--accent)" }}
                        >
                          ถัดไป
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex items-center gap-3">
            <Button
              onClick={handleCreate}
              className="bg-[var(--accent)] text-[var(--text-on-accent)] hover:bg-[var(--accent)]/90 font-semibold cursor-pointer"
            >
              <Repeat className="w-4 h-4 mr-1.5" />
              สร้างแคมเปญซ้ำ
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              className="border-[var(--table-border)] text-[var(--text-primary)] hover:bg-[rgba(var(--accent-rgb),0.04)] cursor-pointer"
            >
              ยกเลิก
            </Button>
          </div>
        </div>
      )}

      {/* Filter Pills */}
      <FilterBar>
        {FILTER_PILLS.map((pill) => {
          const isActive = filterStatus === pill.key;
          const count = pill.key === "all" ? null : campaigns.filter((c) => c.status === pill.key).length;
          return (
            <button
              key={pill.key}
              type="button"
              onClick={() => { setFilterStatus(pill.key); setPage(1); }}
              className="rounded-full text-[13px] font-medium border transition-colors cursor-pointer"
              style={{
                padding: "6px 14px",
                background: isActive ? `rgba(${pill.rgb},0.08)` : "transparent",
                borderColor: isActive ? `rgba(${pill.rgb},0.3)` : "var(--border-default)",
                color: isActive ? pill.color : "var(--text-muted)",
              }}
            >
              {pill.label}
              {count !== null && count > 0 && (
                <span className="ml-1.5 opacity-60">{count}</span>
              )}
            </button>
          );
        })}
      </FilterBar>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <Input
          placeholder="ค้นหาชื่อแคมเปญ..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          className="pl-10 bg-[var(--bg-surface)] border-[var(--table-border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] h-10"
        />
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <TableWrapper>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--table-header)] border-b border-[var(--table-border)]">
                  <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em] px-4 py-2.5">ชื่อแคมเปญ</th>
                  <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em] px-4 py-2.5">ความถี่</th>
                  <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em] px-4 py-2.5">สถานะ</th>
                  <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em] px-4 py-2.5 hidden lg:table-cell">สถิติ</th>
                  <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em] px-4 py-2.5 hidden lg:table-cell">รอบถัดไป</th>
                  <th className="text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em] px-4 py-2.5 w-28">เปิด/ปิด</th>
                  <th className="text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em] px-4 py-2.5 w-20">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((campaign, idx) => (
                  <tr
                    key={campaign.id}
                    className={`border-b border-[var(--table-border)] hover:bg-[var(--bg-elevated)] transition-colors duration-150 ${
                      idx % 2 === 1 ? "bg-[var(--table-alt-row)]" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{campaign.name}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{campaign.contactGroupName} · {campaign.recipientCount.toLocaleString()} ราย</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <FrequencyLabel
                        frequency={campaign.frequency}
                        dayOfWeek={campaign.dayOfWeek}
                        dayOfMonth={campaign.dayOfMonth}
                        time={campaign.time}
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={campaign.status} />
                    </td>
                    <td className="px-4 py-2.5 hidden lg:table-cell">
                      <p className="text-sm text-[var(--text-primary)] tabular-nums">{campaign.totalRuns} ครั้ง</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{campaign.totalSent.toLocaleString()} SMS · {campaign.totalCreditsUsed.toLocaleString()} SMS ใช้</p>
                    </td>
                    <td className="px-4 py-2.5 hidden lg:table-cell">
                      {campaign.nextRunAt ? (
                        <span className="text-sm text-[var(--text-secondary)]">{formatThaiDate(campaign.nextRunAt)}</span>
                      ) : (
                        <span className="text-sm text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center">
                        <Switch
                          checked={campaign.status === "active"}
                          onCheckedChange={() => handleToggleStatus(campaign.id, campaign.status)}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)] transition-colors cursor-pointer">
                          <MoreHorizontal className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-[var(--table-header)] border-[var(--table-border)] rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
                        >
                          <DropdownMenuItem className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:text-[var(--text-primary)] focus:bg-[rgba(255,255,255,0.04)] cursor-pointer">
                            <Pencil className="w-4 h-4 mr-2" />
                            แก้ไข
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:text-[var(--text-primary)] focus:bg-[rgba(255,255,255,0.04)] cursor-pointer">
                            <Copy className="w-4 h-4 mr-2" />
                            ทำซ้ำ
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-[var(--table-border)]" />
                          <DropdownMenuItem className="text-[var(--error)] hover:text-[var(--error)] focus:text-[var(--error)] focus:bg-[rgba(239,68,68,0.08)] cursor-pointer">
                            <Trash2 className="w-4 h-4 mr-2" />
                            ลบ
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-[var(--table-border)]">
            {paginated.map((campaign) => (
              <div key={campaign.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{campaign.name}</p>
                    <FrequencyLabel
                      frequency={campaign.frequency}
                      dayOfWeek={campaign.dayOfWeek}
                      dayOfMonth={campaign.dayOfMonth}
                      time={campaign.time}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={campaign.status} />
                    <Switch
                      checked={campaign.status === "active"}
                      onCheckedChange={() => handleToggleStatus(campaign.id, campaign.status)}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>{campaign.totalRuns} ครั้ง · {campaign.totalSent.toLocaleString()} SMS</span>
                  {campaign.nextRunAt && <span>{formatThaiDate(campaign.nextRunAt)}</span>}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <PaginationBar
              from={(currentPage - 1) * PER_PAGE + 1}
              to={Math.min(currentPage * PER_PAGE, filtered.length)}
              total={filtered.length}
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </TableWrapper>
      ) : filterStatus === "all" && !searchQuery ? (
        <EmptyStateShared
          icon={Repeat}
          iconColor="var(--accent-purple)"
          iconBg="rgba(var(--accent-purple-rgb),0.06)"
          iconBorder="rgba(var(--accent-purple-rgb),0.1)"
          title="ยังไม่มีแคมเปญซ้ำ"
          description="สร้างแคมเปญที่ส่งอัตโนมัติตามรอบ เช่น ทุกสัปดาห์, ทุกเดือน"
          ctaLabel="+ สร้างแคมเปญซ้ำ"
          ctaAction={() => setShowForm(true)}
        />
      ) : (
        <TableWrapper>
          <EmptyState
            icon={<Repeat className="w-12 h-12" />}
            title="ไม่พบแคมเปญที่ตรงกับตัวกรอง"
            subtitle="ลองเปลี่ยนตัวกรองหรือค้นหาด้วยคำอื่น"
            action={
              <Button
                variant="outline"
                onClick={() => { setFilterStatus("all"); setSearchQuery(""); }}
                className="border-[var(--table-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                ล้างตัวกรอง
              </Button>
            }
          />
        </TableWrapper>
      )}
    </PageLayout>
  );
}
