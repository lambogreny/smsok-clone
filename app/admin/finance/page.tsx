"use client";

import { useState } from "react";
import {
  Banknote,
  FileText,
  RotateCcw,
  CheckCircle,
  Flame,
  Download,
  BarChart3,
  FileSpreadsheet,
  Users,
  RefreshCw,
  CreditCard,
  QrCode,
  Building2,
  Search,
} from "lucide-react";
import {
  BarChart,
  Bar,
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
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PageLayout, {
  PageHeader,
  FilterBar,
  TableWrapper,
  PaginationBar,
  EmptyState,
} from "@/components/blocks/PageLayout";

/* ─── Helpers ─── */

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
    <div className="bg-[var(--table-header)] border border-[var(--border-default)] rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-xs font-medium" style={{ color: p.color }}>
          {p.name}: ฿{typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

/* ─── Config ─── */

const DATE_RANGES = [
  { value: "today", label: "วันนี้" },
  { value: "7d", label: "7 วัน" },
  { value: "30d", label: "30 วัน" },
  { value: "month", label: "เดือนนี้" },
  { value: "year", label: "ปีนี้" },
];

const TABS = [
  { value: "transactions", label: "Transactions" },
  { value: "invoices", label: "Invoices" },
  { value: "refunds", label: "Refunds" },
  { value: "failed", label: "Failed" },
  { value: "tax", label: "Tax" },
];

/* ─── Mock Data ─── */

// Waterfall
const WATERFALL_DATA = [
  { name: "Starting", value: 98000, color: "var(--text-muted)" },
  { name: "+New", value: 32400, color: "var(--success)" },
  { name: "+Expansion", value: 5000, color: "var(--accent)" },
  { name: "-Churn", value: -10000, color: "var(--error)" },
  { name: "= Ending", value: 125400, color: "var(--text-primary)" },
];

// Payment method donut
const PAYMENT_PIE = [
  { name: "PromptPay", value: 55, color: "var(--accent)" },
  { name: "Credit Card", value: 30, color: "var(--info)" },
  { name: "Banking", value: 15, color: "var(--warning)" },
];

// Daily revenue
const DAILY_REVENUE = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  revenue: 2000 + Math.floor(Math.random() * 5000),
}));

// Refund trend
const REFUND_TREND = [
  { week: "W1", amount: 800 },
  { week: "W2", amount: 1200 },
  { week: "W3", amount: 600 },
  { week: "W4", amount: 900 },
];

// Aging
const AGING_DATA = [
  { bucket: "0-30d", amount: 8500, color: "var(--accent)" },
  { bucket: "30-60d", amount: 3200, color: "var(--warning)" },
  { bucket: "60-90d", amount: 1100, color: "var(--error)" },
  { bucket: "90d+", amount: 0, color: "var(--error)" },
];

// Tab: Transactions
const TRANSACTIONS = [
  {
    id: "1",
    date: "11 มี.ค.",
    customer: "SMSOK Corp",
    amount: 374.5,
    method: "PromptPay",
    methodIcon: "qr",
    status: "success",
    ref: "ch_abc123",
  },
  {
    id: "2",
    date: "11 มี.ค.",
    customer: "MyShop",
    amount: 1605,
    method: "Visa ****42",
    methodIcon: "card",
    status: "success",
    ref: "ch_def456",
  },
  {
    id: "3",
    date: "10 มี.ค.",
    customer: "TestOrg",
    amount: 374.5,
    method: "Kbank",
    methodIcon: "bank",
    status: "failed",
    ref: "ch_ghi789",
  },
];

// Tab: Invoices
const INVOICES = [
  {
    id: "1",
    number: "INV-2026-024",
    customer: "SMSOK Corp",
    amount: 374.5,
    dueDate: "15 มี.ค.",
    aging: "4 วัน",
    agingDays: 4,
  },
  {
    id: "2",
    number: "INV-2026-023",
    customer: "MyShop",
    amount: 1605,
    dueDate: "20 มี.ค.",
    aging: "ยังไม่ถึง",
    agingDays: 0,
  },
];

// Tab: Refunds
const REFUNDS = [
  {
    id: "1",
    date: "11 มี.ค.",
    customer: "TestOrg",
    amount: 350,
    reason: "SMS ไม่ถูกส่ง",
    status: "pending",
  },
  {
    id: "2",
    date: "8 มี.ค.",
    customer: "MyShop",
    amount: 175,
    reason: "เติมผิดจำนวน",
    status: "completed",
  },
];

// Tab: Failed Payments
const FAILED_PAYMENTS = [
  {
    id: "1",
    date: "10 มี.ค.",
    customer: "TestOrg",
    amount: 374.5,
    method: "Visa",
    error: "Insufficient Funds",
  },
  {
    id: "2",
    date: "9 มี.ค.",
    customer: "FooBar",
    amount: 1605,
    method: "PromptPay",
    error: "Timeout",
  },
];

// Tab: Tax
const TAX_SUMMARY = [
  {
    id: "1",
    month: "มี.ค. 2026",
    revenue: 125400,
    vat: 8778,
    wht: 3762,
    net: 112860,
    status: "pending",
  },
  {
    id: "2",
    month: "ก.พ. 2026",
    revenue: 112000,
    vat: 7840,
    wht: 3360,
    net: 100800,
    status: "filed",
  },
  {
    id: "3",
    month: "ม.ค. 2026",
    revenue: 98000,
    vat: 6860,
    wht: 2940,
    net: 88200,
    status: "filed",
  },
];

const TAX_STATUS: Record<string, { label: string; color: string; bg: string }> =
  {
    filed: {
      label: "✓ ยื่นแล้ว",
      color: "var(--success)",
      bg: "rgba(16,185,129,0.08)",
    },
    pending: {
      label: "○ รอยื่น",
      color: "var(--warning)",
      bg: "rgba(245,158,11,0.08)",
    },
    overdue: {
      label: "✕ เลยกำหนด",
      color: "var(--error)",
      bg: "rgba(239,68,68,0.08)",
    },
  };

/* ─── Main Component ─── */

export default function FinancePage() {
  const [dateRange, setDateRange] = useState("30d");
  const [activeTab, setActiveTab] = useState("transactions");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <PageLayout>
      <PageHeader
        title="Finance Dashboard"
        description="ข้อมูล ณ วันที่ 11 มี.ค. 2026"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-[var(--border-default)] text-[var(--text-secondary)]"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-[var(--border-default)] rounded-lg text-[var(--text-secondary)] hover:text-white transition-colors cursor-pointer">
                <FileText className="w-3.5 h-3.5" /> Reports
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <BarChart3 className="w-3.5 h-3.5" /> Monthly Revenue Report
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Tax Report (ภ.พ.30)
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <Users className="w-3.5 h-3.5" /> Customer Billing Summary
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <RotateCcw className="w-3.5 h-3.5" /> Refund Report
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <RefreshCw className="w-3.5 h-3.5" /> Payment Reconciliation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {/* Date Range Pills */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {DATE_RANGES.map((range) => (
          <button
            key={range.value}
            type="button"
            onClick={() => setDateRange(range.value)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
              dateRange === range.value
                ? "bg-[rgba(0,226,181,0.08)] border-[rgba(0,226,181,0.3)] text-[var(--accent)]"
                : "border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* 5 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div className="w-9 h-9 rounded-md flex items-center justify-center mb-3" style={{ background: "rgba(16,185,129,0.08)" }}>
            <Banknote className="w-4 h-4 text-[var(--success)]" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">฿125,400</div>
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-[0.04em] mt-0.5">Revenue MTD</div>
          <span className="inline-block text-[11px] mt-1.5 px-2 py-0.5 rounded-full bg-[rgba(16,185,129,0.08)] text-[var(--success)]">↑ 12%</span>
          <div className="text-xs text-[var(--text-muted)] mt-1">YTD: ฿1,245,000</div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div className="w-9 h-9 rounded-md flex items-center justify-center mb-3" style={{ background: "rgba(245,158,11,0.08)" }}>
            <FileText className="w-4 h-4 text-[var(--warning)]" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">8</div>
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-[0.04em] mt-0.5">ใบแจ้งหนี้รอชำระ</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">฿12,800 รวม</div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div className="w-9 h-9 rounded-md flex items-center justify-center mb-3" style={{ background: "rgba(239,68,68,0.08)" }}>
            <RotateCcw className="w-4 h-4 text-[var(--error)]" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">฿2,100</div>
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-[0.04em] mt-0.5">คืนเงิน MTD</div>
          <span className="inline-block text-[11px] mt-1.5 px-2 py-0.5 rounded-full bg-[rgba(16,185,129,0.08)] text-[var(--success)]">↓ 15%</span>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div className="w-9 h-9 rounded-md flex items-center justify-center mb-3" style={{ background: "rgba(0,226,181,0.08)" }}>
            <CheckCircle className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--success)] tabular-nums">97.3%</div>
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-[0.04em] mt-0.5">ชำระสำเร็จ</div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div className="w-9 h-9 rounded-md flex items-center justify-center mb-3" style={{ background: "rgba(245,158,11,0.08)" }}>
            <Flame className="w-4 h-4 text-[var(--warning)]" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">฿45K/mo</div>
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-[0.04em] mt-0.5">Cash Burn</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">Runway: 18 months</div>
        </div>
      </div>

      {/* Revenue Waterfall */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5 mb-4">
        <h3 className="text-sm font-semibold text-white mb-4">
          Revenue Waterfall
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={WATERFALL_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}K`} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {WATERFALL_DATA.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                  stroke={entry.color === "var(--text-primary)" ? "var(--text-primary)" : undefined}
                  strokeWidth={entry.color === "var(--text-primary)" ? 2 : 0}
                  fillOpacity={entry.color === "var(--text-primary)" ? 0.1 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Payment Method Donut */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Payment Method
          </h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={PAYMENT_PIE}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {PAYMENT_PIE.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2.5">
              {PAYMENT_PIE.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
                  <span className="text-xs text-[var(--text-secondary)]">{entry.name}</span>
                  <span className="text-xs font-semibold text-white">{entry.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Revenue */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Revenue by Day
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={DAILY_REVENUE}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--success)" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} interval={6} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="var(--success)" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Refund Trend */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Refund Trend
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={REFUND_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="amount" fill="var(--error)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Aging Bar */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Outstanding Aging
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={AGING_DATA} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `฿${(v / 1000).toFixed(1)}K`} />
              <YAxis type="category" dataKey="bucket" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {AGING_DATA.map((entry) => (
                  <Cell key={entry.bucket} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-[var(--border-default)] mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === tab.value
                ? "text-[var(--accent)] border-[var(--accent)]"
                : "text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Transactions */}
      {activeTab === "transactions" && (
        <TableWrapper>
          <div className="grid grid-cols-[100px_1fr_100px_140px_100px_120px] gap-x-4 px-5 py-3 bg-[var(--table-header)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            <span>วันที่</span>
            <span>ลูกค้า</span>
            <span className="text-right">จำนวน</span>
            <span>วิธีชำระ</span>
            <span>สถานะ</span>
            <span>Ref</span>
          </div>
          {TRANSACTIONS.map((tx, i) => (
            <div
              key={tx.id}
              className={`grid grid-cols-[100px_1fr_100px_140px_100px_120px] gap-x-4 items-center px-5 py-3.5 border-b border-[var(--table-border)] ${
                i % 2 === 1 ? "bg-[var(--table-alt-row)]" : ""
              }`}
            >
              <span className="text-xs text-[var(--text-secondary)]">{tx.date}</span>
              <span className="text-sm text-white font-medium">{tx.customer}</span>
              <span className="text-sm text-white text-right tabular-nums">
                ฿{tx.amount.toFixed(2)}
              </span>
              <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                {tx.methodIcon === "qr" && <QrCode className="w-3.5 h-3.5 text-[var(--accent)]" />}
                {tx.methodIcon === "card" && <CreditCard className="w-3.5 h-3.5 text-[var(--info)]" />}
                {tx.methodIcon === "bank" && <Building2 className="w-3.5 h-3.5 text-[var(--warning)]" />}
                {tx.method}
              </span>
              <span
                className={`text-xs font-medium ${
                  tx.status === "success" ? "text-[var(--success)]" : "text-[var(--error)]"
                }`}
              >
                {tx.status === "success" ? "✓ สำเร็จ" : "✗ ล้มเหลว"}
              </span>
              <span className="text-xs text-[var(--text-muted)] font-mono">{tx.ref}</span>
            </div>
          ))}
        </TableWrapper>
      )}

      {/* Tab: Invoices */}
      {activeTab === "invoices" && (
        <TableWrapper>
          <div className="grid grid-cols-[140px_1fr_100px_100px_100px_120px] gap-x-4 px-5 py-3 bg-[var(--table-header)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            <span>เลขที่</span>
            <span>ลูกค้า</span>
            <span className="text-right">จำนวน</span>
            <span>ครบกำหนด</span>
            <span>อายุ</span>
            <span />
          </div>
          {INVOICES.map((inv, i) => {
            const agingColor =
              inv.agingDays > 30
                ? "var(--error)"
                : inv.agingDays > 7
                  ? "var(--warning)"
                  : "var(--text-body)";
            return (
              <div
                key={inv.id}
                className={`grid grid-cols-[140px_1fr_100px_100px_100px_120px] gap-x-4 items-center px-5 py-3.5 border-b border-[var(--table-border)] ${
                  i % 2 === 1 ? "bg-[var(--table-alt-row)]" : ""
                }`}
              >
                <span className="text-sm text-white font-mono">{inv.number}</span>
                <span className="text-sm text-white">{inv.customer}</span>
                <span className="text-sm text-white text-right tabular-nums">
                  ฿{inv.amount.toFixed(2)}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">{inv.dueDate}</span>
                <span className="text-xs" style={{ color: agingColor }}>
                  {inv.aging}
                </span>
                <div className="flex gap-1.5">
                  <Button size="xs" className="bg-[var(--accent)] text-[var(--text-on-accent)] text-[10px]">
                    ชำระ
                  </Button>
                  <Button size="xs" variant="outline" className="border-[var(--border-default)] text-[var(--text-secondary)] text-[10px]">
                    ส่ง
                  </Button>
                </div>
              </div>
            );
          })}
        </TableWrapper>
      )}

      {/* Tab: Refunds */}
      {activeTab === "refunds" && (
        <TableWrapper>
          <div className="grid grid-cols-[100px_1fr_100px_1fr_100px_120px] gap-x-4 px-5 py-3 bg-[var(--table-header)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            <span>วันที่</span>
            <span>ลูกค้า</span>
            <span className="text-right">จำนวน</span>
            <span>เหตุผล</span>
            <span>สถานะ</span>
            <span />
          </div>
          {REFUNDS.map((ref, i) => (
            <div
              key={ref.id}
              className={`grid grid-cols-[100px_1fr_100px_1fr_100px_120px] gap-x-4 items-center px-5 py-3.5 border-b border-[var(--table-border)] ${
                i % 2 === 1 ? "bg-[var(--table-alt-row)]" : ""
              }`}
            >
              <span className="text-xs text-[var(--text-secondary)]">{ref.date}</span>
              <span className="text-sm text-white">{ref.customer}</span>
              <span className="text-sm text-white text-right tabular-nums">
                ฿{ref.amount.toFixed(2)}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">{ref.reason}</span>
              <span
                className={`text-xs font-medium ${
                  ref.status === "completed" ? "text-[var(--success)]" : "text-[var(--warning)]"
                }`}
              >
                {ref.status === "completed" ? "✓ คืนแล้ว" : "⏳ รอ"}
              </span>
              {ref.status === "pending" ? (
                <div className="flex gap-1.5">
                  <Button size="xs" className="bg-[var(--accent)] text-[var(--bg-base)] text-[10px]">
                    อนุมัติ
                  </Button>
                  <Button size="xs" variant="destructive" className="text-[10px]">
                    ปฏิเสธ
                  </Button>
                </div>
              ) : (
                <span className="text-xs text-[var(--bg-muted)]">—</span>
              )}
            </div>
          ))}
        </TableWrapper>
      )}

      {/* Tab: Failed Payments */}
      {activeTab === "failed" && (
        <TableWrapper>
          <div className="grid grid-cols-[100px_1fr_100px_100px_1fr_80px] gap-x-4 px-5 py-3 bg-[var(--table-header)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            <span>วันที่</span>
            <span>ลูกค้า</span>
            <span className="text-right">จำนวน</span>
            <span>วิธีชำระ</span>
            <span>Error</span>
            <span>Retry</span>
          </div>
          {FAILED_PAYMENTS.map((fp, i) => (
            <div
              key={fp.id}
              className={`grid grid-cols-[100px_1fr_100px_100px_1fr_80px] gap-x-4 items-center px-5 py-3.5 border-b border-[var(--table-border)] ${
                i % 2 === 1 ? "bg-[var(--table-alt-row)]" : ""
              }`}
            >
              <span className="text-xs text-[var(--text-secondary)]">{fp.date}</span>
              <span className="text-sm text-white">{fp.customer}</span>
              <span className="text-sm text-white text-right tabular-nums">
                ฿{fp.amount.toFixed(2)}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">{fp.method}</span>
              <span className="text-xs text-[var(--error)]">{fp.error}</span>
              <button
                type="button"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--accent)] hover:bg-[rgba(0,226,181,0.08)] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </TableWrapper>
      )}

      {/* Tab: Tax */}
      {activeTab === "tax" && (
        <TableWrapper>
          <div className="grid grid-cols-[100px_100px_100px_100px_120px_100px] gap-x-4 px-5 py-3 bg-[var(--table-header)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            <span>เดือน</span>
            <span className="text-right">Revenue</span>
            <span className="text-right">VAT 7%</span>
            <span className="text-right">WHT 3%</span>
            <span className="text-right">Net</span>
            <span>สถานะ</span>
          </div>
          {TAX_SUMMARY.map((tax, i) => {
            const status = TAX_STATUS[tax.status] ?? TAX_STATUS.pending;
            return (
              <div
                key={tax.id}
                className={`grid grid-cols-[100px_100px_100px_100px_120px_100px] gap-x-4 items-center px-5 py-3.5 border-b border-[var(--table-border)] ${
                  i % 2 === 1 ? "bg-[var(--table-alt-row)]" : ""
                }`}
              >
                <span className="text-sm text-white">{tax.month}</span>
                <span className="text-sm text-white text-right tabular-nums">
                  ฿{tax.revenue.toLocaleString()}
                </span>
                <span className="text-sm text-[var(--text-secondary)] text-right tabular-nums">
                  ฿{tax.vat.toLocaleString()}
                </span>
                <span className="text-sm text-[var(--text-secondary)] text-right tabular-nums">
                  ฿{tax.wht.toLocaleString()}
                </span>
                <span className="text-sm text-white text-right tabular-nums font-semibold">
                  ฿{tax.net.toLocaleString()}
                </span>
                <span
                  className="inline-flex text-[11px] font-medium px-2.5 py-1 rounded-full w-fit"
                  style={{ background: status.bg, color: status.color }}
                >
                  {status.label}
                </span>
              </div>
            );
          })}
        </TableWrapper>
      )}
    </PageLayout>
  );
}
