"use client";

import { useState } from "react";
import {
  Ticket,
  Clock,
  Timer,
  Star,
  ShieldCheck,
  Search,
  MoreHorizontal,
  Eye,
  MessageSquare,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PageLayout, {
  PageHeader,
  FilterBar,
  TableWrapper,
  PaginationBar,
  EmptyState,
} from "@/components/blocks/PageLayout";
import CustomSelect from "@/components/ui/CustomSelect";

/* ─── Helpers ─── */

function slaCompliance(value: number): string {
  if (value >= 90) return "var(--success)";
  if (value >= 80) return "var(--warning)";
  return "var(--error)";
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-xs font-medium" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

/* ─── Mock Data ─── */

const TICKET_VOLUME_DATA = Array.from({ length: 14 }, (_, i) => ({
  day: `${i + 1}`,
  new: Math.floor(3 + Math.random() * 8),
  resolved: Math.floor(2 + Math.random() * 7),
}));

const CATEGORY_PIE_DATA = [
  { name: "Billing", value: 32, color: "var(--accent)" },
  { name: "Technical", value: 28, color: "var(--info)" },
  { name: "Account", value: 20, color: "var(--warning)" },
  { name: "Spam Report", value: 12, color: "var(--error)" },
  { name: "Other", value: 8, color: "var(--text-muted)" },
];

const RESOLUTION_TIME_DATA = Array.from({ length: 14 }, (_, i) => ({
  day: `${i + 1}`,
  hours: Math.floor(10 + Math.random() * 20),
}));

/* ─── Badge Configs ─── */

const PRIORITY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  critical: {
    label: "Critical",
    color: "var(--error)",
    bg: "rgba(239,68,68,0.08)",
  },
  high: {
    label: "High",
    color: "var(--warning)",
    bg: "rgba(245,158,11,0.08)",
  },
  medium: {
    label: "Medium",
    color: "var(--info)",
    bg: "rgba(50,152,218,0.08)",
  },
  low: {
    label: "Low",
    color: "var(--text-muted)",
    bg: "rgba(139,146,153,0.08)",
  },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  open: {
    label: "เปิด",
    color: "var(--warning)",
    bg: "rgba(245,158,11,0.08)",
  },
  in_progress: {
    label: "กำลังดำเนินการ",
    color: "var(--info)",
    bg: "rgba(50,152,218,0.08)",
  },
  waiting: {
    label: "รอลูกค้า",
    color: "var(--accent-blue)",
    bg: "rgba(var(--accent-blue-rgb),0.08)",
  },
  resolved: {
    label: "แก้ไขแล้ว",
    color: "var(--success)",
    bg: "rgba(16,185,129,0.08)",
  },
  closed: {
    label: "ปิด",
    color: "var(--text-muted)",
    bg: "rgba(139,146,153,0.08)",
  },
};

/* ─── Mock Tickets ─── */

type Ticket = {
  id: string;
  subject: string;
  customer: string;
  priority: "critical" | "high" | "medium" | "low";
  category: "billing" | "technical" | "account" | "spam-report" | "other";
  assignee: string;
  status: "open" | "in_progress" | "waiting" | "resolved" | "closed";
  sla: string;
  slaBreached: boolean;
};

const TICKETS: Ticket[] = [
  {
    id: "TK-1024",
    subject: "ซื้อแพ็กเกจไม่เข้า",
    customer: "บริษัท เดลต้า จำกัด",
    priority: "critical",
    category: "billing",
    assignee: "สมชาย ก.",
    status: "open",
    sla: "1h 20m",
    slaBreached: false,
  },
  {
    id: "TK-1023",
    subject: "SMS ส่งไม่ถึงปลายทาง",
    customer: "MyShop Thailand",
    priority: "high",
    category: "technical",
    assignee: "วิไล ส.",
    status: "in_progress",
    sla: "3h 45m",
    slaBreached: false,
  },
  {
    id: "TK-1022",
    subject: "ขอรับ Invoice ประจำเดือน",
    customer: "TechStart Co.",
    priority: "medium",
    category: "billing",
    assignee: "นภา ร.",
    status: "waiting",
    sla: "BREACHED",
    slaBreached: true,
  },
  {
    id: "TK-1021",
    subject: "ลืมรหัสผ่าน OTP ไม่ส่ง",
    customer: "คุณมานพ ใจดี",
    priority: "high",
    category: "account",
    assignee: "สมชาย ก.",
    status: "open",
    sla: "2h 10m",
    slaBreached: false,
  },
  {
    id: "TK-1020",
    subject: "แจ้ง Spam SMS จากระบบ",
    customer: "ร้านค้าออนไลน์ ABC",
    priority: "critical",
    category: "spam-report",
    assignee: "วิไล ส.",
    status: "in_progress",
    sla: "45m",
    slaBreached: false,
  },
  {
    id: "TK-1019",
    subject: "ต้องการเพิ่มผู้ใช้ในบัญชี",
    customer: "E-Commerce Hub",
    priority: "low",
    category: "account",
    assignee: "นภา ร.",
    status: "resolved",
    sla: "สำเร็จ",
    slaBreached: false,
  },
  {
    id: "TK-1018",
    subject: "ระบบ API ตอบสนองช้า",
    customer: "DevTeam Corp",
    priority: "high",
    category: "technical",
    assignee: "สมชาย ก.",
    status: "open",
    sla: "BREACHED",
    slaBreached: true,
  },
  {
    id: "TK-1017",
    subject: "ขอคืน SMS ไม่สำเร็จ",
    customer: "FlashSale Ltd.",
    priority: "medium",
    category: "billing",
    assignee: "วิไล ส.",
    status: "closed",
    sla: "สำเร็จ",
    slaBreached: false,
  },
];

/* ─── Filter Options ─── */

const PRIORITY_OPTIONS = [
  { value: "", label: "ทุก Priority" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const STATUS_OPTIONS = [
  { value: "", label: "ทุก Status" },
  { value: "open", label: "เปิด" },
  { value: "in_progress", label: "กำลังดำเนินการ" },
  { value: "waiting", label: "รอลูกค้า" },
  { value: "resolved", label: "แก้ไขแล้ว" },
  { value: "closed", label: "ปิด" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "ทุก Category" },
  { value: "billing", label: "Billing" },
  { value: "technical", label: "Technical" },
  { value: "account", label: "Account" },
  { value: "spam-report", label: "Spam Report" },
  { value: "other", label: "Other" },
];

const SLA_COMPLIANCE = 94.2;
const PAGE_SIZE = 5;

/* ─── Main Component ─── */

export default function SupportDashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);

  const filtered = TICKETS.filter((t) => {
    if (priorityFilter && t.priority !== priorityFilter) return false;
    if (statusFilter && t.status !== statusFilter) return false;
    if (categoryFilter && t.category !== categoryFilter) return false;
    if (
      searchQuery &&
      !t.subject.includes(searchQuery) &&
      !t.customer.includes(searchQuery) &&
      !t.id.includes(searchQuery)
    )
      return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, filtered.length);

  return (
    <PageLayout>
      <PageHeader
        title="Support Dashboard"
        description="ติดตามตั๋วและ SLA"
      />

      {/* 5 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        {/* Open Tickets */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center mb-3"
            style={{ background: "rgba(245,158,11,0.08)" }}
          >
            <Ticket className="w-4 h-4 text-[var(--warning)]" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">23</div>
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-[0.04em] mt-0.5">
            Open Tickets
          </div>
          <span className="inline-block text-[11px] mt-1.5 px-2 py-0.5 rounded-full bg-[rgba(245,158,11,0.08)] text-[var(--warning)]">
            2 Critical
          </span>
        </div>

        {/* Avg Response */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center mb-3"
            style={{ background: "rgba(50,152,218,0.08)" }}
          >
            <Clock className="w-4 h-4 text-[var(--info)]" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">4.2h</div>
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-[0.04em] mt-0.5">
            Avg Response
          </div>
          <span className="inline-block text-[11px] mt-1.5 px-2 py-0.5 rounded-full bg-[rgba(16,185,129,0.08)] text-[var(--success)]">
            ↓ 0.3h
          </span>
        </div>

        {/* Avg Resolution */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center mb-3"
            style={{ background: "rgba(var(--accent-rgb),0.08)" }}
          >
            <Timer className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">18h</div>
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-[0.04em] mt-0.5">
            Avg Resolution
          </div>
          <span className="inline-block text-[11px] mt-1.5 px-2 py-0.5 rounded-full bg-[rgba(16,185,129,0.08)] text-[var(--success)]">
            ↓ 2h vs เดือนก่อน
          </span>
        </div>

        {/* CSAT */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center mb-3"
            style={{ background: "rgba(16,185,129,0.08)" }}
          >
            <Star className="w-4 h-4 text-[var(--success)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--success)] tabular-nums">
            4.5
          </div>
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-[0.04em] mt-0.5">
            CSAT / 5.0
          </div>
          <span className="inline-block text-[11px] mt-1.5 px-2 py-0.5 rounded-full bg-[rgba(16,185,129,0.08)] text-[var(--success)]">
            ↑ 0.2
          </span>
        </div>

        {/* SLA Compliance */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center mb-3"
            style={{ background: `rgba(16,185,129,0.08)` }}
          >
            <ShieldCheck
              className="w-4 h-4"
              style={{ color: slaCompliance(SLA_COMPLIANCE) }}
            />
          </div>
          <div
            className="text-2xl font-bold tabular-nums"
            style={{ color: slaCompliance(SLA_COMPLIANCE) }}
          >
            {SLA_COMPLIANCE}%
          </div>
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-[0.04em] mt-0.5">
            SLA Compliance
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">Target: 95%</div>
        </div>
      </div>

      {/* Charts Grid: 2-col LineChart + PieChart, then full-width AreaChart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* LineChart: Ticket Volume Trend */}
        <div className="md:col-span-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Ticket Volume Trend (14 วัน)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={TICKET_VOLUME_DATA}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={2}
              />
              <YAxis
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-body)" }} />
              <Line
                type="monotone"
                dataKey="new"
                name="ตั๋วใหม่"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="resolved"
                name="แก้ไขแล้ว"
                stroke="var(--success)"
                strokeWidth={2}
                dot={false}
                strokeDasharray="4 2"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* PieChart: Category Breakdown */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Category Breakdown
          </h3>
          <div className="flex flex-col items-center gap-4">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={CATEGORY_PIE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={72}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {CATEGORY_PIE_DATA.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 w-full">
              {CATEGORY_PIE_DATA.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: entry.color }}
                  />
                  <span className="text-xs text-[var(--text-secondary)] flex-1">
                    {entry.name}
                  </span>
                  <span className="text-xs font-semibold text-white">
                    {entry.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AreaChart: Resolution Time Trend */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5 mb-4">
        <h3 className="text-sm font-semibold text-white mb-4">
          Resolution Time Trend (14 วัน)
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={RESOLUTION_TIME_DATA}>
            <defs>
              <linearGradient id="resolutionGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--warning)" stopOpacity={0.12} />
                <stop offset="100%" stopColor="var(--warning)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={40}
              tickFormatter={(v) => `${v}h`}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="hours"
              name="Resolution (h)"
              stroke="var(--warning)"
              strokeWidth={2}
              fill="url(#resolutionGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Ticket List Table */}
      <PageHeader title="Ticket List" count={filtered.length} />

      <FilterBar>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <Input
            placeholder="ค้นหา ID, หัวข้อ, ลูกค้า..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)]"
          />
        </div>
        <CustomSelect
          value={priorityFilter}
          onChange={(v) => {
            setPriorityFilter(v);
            setPage(1);
          }}
          options={PRIORITY_OPTIONS}
          placeholder="Priority"
        />
        <CustomSelect
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          placeholder="Status"
        />
        <CustomSelect
          value={categoryFilter}
          onChange={(v) => {
            setCategoryFilter(v);
            setPage(1);
          }}
          options={CATEGORY_OPTIONS}
          placeholder="Category"
        />
      </FilterBar>

      <TableWrapper>
        {/* Table Header */}
        <div className="grid grid-cols-[80px_1fr_140px_90px_110px_100px_110px_90px_48px] gap-x-3 px-5 py-3 bg-[var(--table-header)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          <span>ID</span>
          <span>หัวข้อ</span>
          <span>ลูกค้า</span>
          <span>Priority</span>
          <span>Category</span>
          <span>Assignee</span>
          <span>Status</span>
          <span>SLA</span>
          <span />
        </div>

        {/* Table Body */}
        {paged.length === 0 ? (
          <EmptyState
            icon={<Ticket className="w-10 h-10" />}
            title="ไม่พบตั๋ว"
            subtitle="ลองเปลี่ยน filter หรือคำค้นหา"
          />
        ) : (
          paged.map((ticket, i) => {
            const priority = PRIORITY_CONFIG[ticket.priority];
            const status = STATUS_CONFIG[ticket.status];
            const categoryLabel: Record<string, string> = {
              billing: "Billing",
              technical: "Technical",
              account: "Account",
              "spam-report": "Spam Report",
              other: "Other",
            };
            return (
              <div
                key={ticket.id}
                className={`grid grid-cols-[80px_1fr_140px_90px_110px_100px_110px_90px_48px] gap-x-3 items-center px-5 py-3.5 border-b border-[var(--table-border)] hover:bg-[rgba(255,255,255,0.015)] transition-colors ${
                  i % 2 === 1 ? "bg-[var(--table-alt-row)]" : ""
                }`}
              >
                {/* ID */}
                <span className="text-xs text-[var(--text-muted)] font-mono">
                  {ticket.id}
                </span>

                {/* Subject */}
                <span className="text-sm text-white font-medium truncate pr-2">
                  {ticket.subject}
                </span>

                {/* Customer */}
                <span className="text-xs text-[var(--text-secondary)] truncate">
                  {ticket.customer}
                </span>

                {/* Priority */}
                <span
                  className="inline-flex text-[11px] font-medium px-2.5 py-1 rounded-full w-fit"
                  style={{ background: priority.bg, color: priority.color }}
                >
                  {priority.label}
                </span>

                {/* Category */}
                <span className="text-xs text-[var(--text-secondary)]">
                  {categoryLabel[ticket.category] ?? ticket.category}
                </span>

                {/* Assignee */}
                <span className="text-xs text-[var(--text-secondary)] truncate">
                  {ticket.assignee}
                </span>

                {/* Status */}
                <span
                  className="inline-flex text-[11px] font-medium px-2.5 py-1 rounded-full w-fit"
                  style={{ background: status.bg, color: status.color }}
                >
                  {status.label}
                </span>

                {/* SLA */}
                <span
                  className={`text-xs font-medium tabular-nums ${
                    ticket.slaBreached ? "text-[var(--error)]" : "text-[var(--text-secondary)]"
                  }`}
                >
                  {ticket.slaBreached ? "⚠ " : ""}{ticket.sla}
                </span>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer">
                    <MoreHorizontal className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2 cursor-pointer">
                      <Eye className="w-3.5 h-3.5" /> ดูรายละเอียด
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 cursor-pointer">
                      <MessageSquare className="w-3.5 h-3.5" /> ตอบกลับ
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 cursor-pointer text-[var(--warning)]">
                      <AlertTriangle className="w-3.5 h-3.5" /> Escalate
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 cursor-pointer">
                      <CreditCard className="w-3.5 h-3.5" /> ปรับ SMS
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <PaginationBar
            from={from}
            to={to}
            total={filtered.length}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </TableWrapper>
    </PageLayout>
  );
}
