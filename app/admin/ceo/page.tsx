"use client";

import { useState } from "react";
import {
  TrendingUp,
  BarChart3,
  DollarSign,
  RefreshCw,
  Users,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import PageLayout, {
  PageHeader,
  TableWrapper,
} from "@/components/blocks/PageLayout";

/* ─── Chart Tooltip ─── */

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
    <div
      className="border rounded-lg px-3 py-2 shadow-lg"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border-default)",
      }}
    >
      <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
        {label}
      </p>
      {payload.map((p) => (
        <p
          key={p.name}
          className="text-xs font-medium"
          style={{ color: p.color }}
        >
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

/* ─── Mock Data ─── */

const MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

const REVENUE_TREND = MONTHS.map((month, i) => ({
  month,
  revenue: 1_400_000 + i * 90_000 + Math.floor(Math.random() * 80_000),
}));

const USER_GROWTH = MONTHS.map((month, i) => ({
  month,
  total: 900 + i * 32 + Math.floor(Math.random() * 20),
  newSignups: 40 + Math.floor(Math.random() * 30),
}));

const CHURN_RATE = MONTHS.map((month) => ({
  month,
  churn: +(1.5 + Math.random() * 1.2).toFixed(2),
}));

const ARPU_DATA = MONTHS.map((month, i) => ({
  month,
  arpu: 1_700 + i * 40 + Math.floor(Math.random() * 100),
}));

const TOP_CUSTOMERS = [
  { rank: 1, company: "บริษัท สยามเทค จำกัด", mrr: 285_000, sms: 920_000, since: "ม.ค. 2024", growth: 18.4 },
  { rank: 2, company: "บริษัท ดิจิทัล มาร์เก็ต จำกัด", mrr: 241_000, sms: 780_000, since: "ก.พ. 2024", growth: 12.1 },
  { rank: 3, company: "บริษัท ไทยคอม โซลูชั่น จำกัด", mrr: 198_000, sms: 640_000, since: "มี.ค. 2023", growth: 8.7 },
  { rank: 4, company: "บริษัท กรุงเทพ ฟินเทค จำกัด", mrr: 175_000, sms: 560_000, since: "เม.ย. 2023", growth: -2.3 },
  { rank: 5, company: "บริษัท เอเชีย โลจิสติกส์ จำกัด", mrr: 154_000, sms: 500_000, since: "พ.ค. 2024", growth: 22.5 },
  { rank: 6, company: "บริษัท สมาร์ทรีเทล จำกัด", mrr: 132_000, sms: 430_000, since: "มิ.ย. 2023", growth: 5.2 },
  { rank: 7, company: "บริษัท ลีน คอมมิวนิเคชั่น จำกัด", mrr: 118_000, sms: 385_000, since: "ก.ค. 2024", growth: -4.8 },
  { rank: 8, company: "บริษัท แอดวานซ์ เมดิคัล จำกัด", mrr: 105_000, sms: 340_000, since: "ส.ค. 2023", growth: 11.0 },
  { rank: 9, company: "บริษัท ไซเบอร์ เน็ตเวิร์ค จำกัด", mrr: 94_000, sms: 305_000, since: "ก.ย. 2024", growth: 31.2 },
  { rank: 10, company: "บริษัท สตาร์ อีคอมเมิร์ซ จำกัด", mrr: 88_000, sms: 285_000, since: "ต.ค. 2023", growth: -1.5 },
];

const RECENT_SIGNUPS = [
  { company: "บริษัท อินโนเวท ดิจิทัล จำกัด", plan: "Business", date: "10 มี.ค.", mrr: 12_500 },
  { company: "บริษัท เทคโนทรานส์ จำกัด", plan: "Starter", date: "9 มี.ค.", mrr: 3_200 },
  { company: "บริษัท นิว มีเดีย กรุ๊ป จำกัด", plan: "Enterprise", date: "8 มี.ค.", mrr: 45_000 },
  { company: "บริษัท ฟิวเจอร์ เพย์ จำกัด", plan: "Business", date: "7 มี.ค.", mrr: 18_900 },
  { company: "บริษัท แอคทีฟ แบรนด์ จำกัด", plan: "Starter", date: "6 มี.ค.", mrr: 2_800 },
];

const CHURNED_CUSTOMERS = [
  { company: "บริษัท โอลด์ มีเดีย จำกัด", reason: "ย้ายไปคู่แข่ง", date: "9 มี.ค.", lostMrr: 22_000 },
  { company: "บริษัท ซิมเปิล เทค จำกัด", reason: "ต้นทุนสูงเกิน", date: "8 มี.ค.", lostMrr: 8_500 },
  { company: "บริษัท ไลท์ คอม จำกัด", reason: "ธุรกิจปิดตัว", date: "6 มี.ค.", lostMrr: 15_300 },
  { company: "บริษัท ควิก เซิร์ฟ จำกัด", reason: "ไม่พอใจบริการ", date: "4 มี.ค.", lostMrr: 6_700 },
  { company: "บริษัท โปรโมท ดิจิทัล จำกัด", reason: "งบประมาณลด", date: "2 มี.ค.", lostMrr: 11_200 },
];

const DATE_PILLS = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "ytd", label: "YTD" },
];

/* ─── Main Component ─── */

export default function CeoDashboardPage() {
  const [dateRange, setDateRange] = useState("30d");

  const nrrValue = 108;
  const nrrColor =
    nrrValue >= 100 ? "var(--success)" : nrrValue >= 90 ? "var(--warning)" : "var(--error)";

  return (
    <PageLayout>
      {/* Header */}
      <PageHeader
        title="CEO Dashboard"
        description="ภาพรวมธุรกิจ"
      />

      {/* Date Range Pills */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {DATE_PILLS.map((pill) => (
          <button
            key={pill.value}
            type="button"
            onClick={() => setDateRange(pill.value)}
            className={`px-4 py-1.5 max-md:py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
              dateRange === pill.value
                ? "bg-[rgba(var(--accent-rgb),0.08)] border-[rgba(var(--accent-rgb),0.3)] text-[var(--accent)]"
                : "border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* 5 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        {/* MRR */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center mb-3"
            style={{ background: "rgba(var(--accent-rgb),0.08)" }}
          >
            <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            ฿2.4M
          </div>
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-[0.04em] mt-0.5">
            MRR
          </div>
          <span className="inline-block text-[11px] mt-1.5 px-2 py-0.5 rounded-full bg-[rgba(16,185,129,0.08)] text-[var(--success)]">
            ↑ 12.5%
          </span>
        </div>

        {/* ARR */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center mb-3"
            style={{ background: "rgba(50,152,218,0.08)" }}
          >
            <BarChart3 className="w-4 h-4 text-[var(--info)]" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            ฿28.8M
          </div>
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-[0.04em] mt-0.5">
            ARR
          </div>
        </div>

        {/* Revenue MTD */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center mb-3"
            style={{ background: "rgba(20,184,166,0.08)" }}
          >
            <DollarSign className="w-4 h-4 text-[var(--success)]" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            ฿1.8M
          </div>
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-[0.04em] mt-0.5">
            Revenue MTD
          </div>
        </div>

        {/* NRR */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center mb-3"
            style={{ background: `${nrrColor}14` }}
          >
            <RefreshCw className="w-4 h-4" style={{ color: nrrColor }} />
          </div>
          <div
            className="text-2xl font-bold tabular-nums"
            style={{ color: nrrColor }}
          >
            {nrrValue}%
          </div>
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-[0.04em] mt-0.5">
            NRR
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center mb-3"
            style={{ background: "rgba(50,152,218,0.08)" }}
          >
            <Users className="w-4 h-4 text-[var(--info)]" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            1,247
          </div>
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-[0.04em] mt-0.5">
            Active Users
          </div>
          <span className="inline-block text-[11px] mt-1.5 px-2 py-0.5 rounded-full bg-[rgba(50,152,218,0.08)] text-[var(--info)]">
            ↑ 8.3%
          </span>
        </div>
      </div>

      {/* 2x2 Chart Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Revenue Trend — LineChart with area fill */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-white">Revenue Trend</h3>
          <p className="text-xs mt-0.5 mb-4" style={{ color: "var(--text-secondary)" }}>
            12 เดือนย้อนหลัง
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={REVENUE_TREND}>
              <defs>
                <linearGradient id="revTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={50}
                tickFormatter={(v) => `฿${(v / 1_000_000).toFixed(1)}M`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth — AreaChart */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-white">User Growth</h3>
          <p className="text-xs mt-0.5 mb-4" style={{ color: "var(--text-secondary)" }}>
            12 เดือนย้อนหลัง
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={USER_GROWTH}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--info)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="var(--info)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--success)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                name="Total"
                stroke="var(--info)"
                strokeWidth={2}
                fill="url(#totalGrad)"
              />
              <Area
                type="monotone"
                dataKey="newSignups"
                name="New Signups"
                stroke="var(--success)"
                strokeWidth={2}
                fill="url(#newGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Churn Rate — LineChart */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-white">Churn Rate</h3>
          <p className="text-xs mt-0.5 mb-4" style={{ color: "var(--text-secondary)" }}>
            12 เดือนย้อนหลัง (%)
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={CHURN_RATE}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={35}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="churn"
                name="Churn"
                stroke="var(--warning)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ARPU — BarChart */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-white">ARPU</h3>
          <p className="text-xs mt-0.5 mb-4" style={{ color: "var(--text-secondary)" }}>
            Average Revenue Per User (฿/month)
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ARPU_DATA}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={50}
                tickFormatter={(v) => `฿${v.toLocaleString()}`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="arpu"
                name="ARPU"
                fill="var(--info)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 10 Customers Table */}
      <PageHeader title="Top 10 Customers" />
      <TableWrapper>
        <div className="grid grid-cols-[48px_1fr_120px_120px_100px_80px] max-md:grid-cols-[32px_1fr_90px_70px] gap-x-4 max-md:gap-x-2 px-5 max-md:px-3 py-3 bg-[var(--table-header)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          <span>#</span>
          <span>บริษัท</span>
          <span className="text-right">MRR</span>
          <span className="text-right max-md:hidden">SMS/เดือน</span>
          <span className="max-md:hidden">เริ่มใช้</span>
          <span className="text-right">Growth</span>
        </div>
        {TOP_CUSTOMERS.map((cust, i) => (
          <div
            key={cust.rank}
            className={`grid grid-cols-[48px_1fr_120px_120px_100px_80px] max-md:grid-cols-[32px_1fr_90px_70px] gap-x-4 max-md:gap-x-2 items-center px-5 max-md:px-3 py-3.5 border-b border-[var(--table-border)] hover:bg-[rgba(255,255,255,0.015)] transition-colors ${
              i % 2 === 1 ? "bg-[var(--table-alt-row)]" : ""
            }`}
          >
            <span className="text-sm font-semibold text-[var(--text-muted)] tabular-nums">
              {cust.rank}
            </span>
            <span className="text-sm text-white font-medium truncate">
              {cust.company}
            </span>
            <span className="text-sm text-white text-right tabular-nums font-mono">
              ฿{cust.mrr.toLocaleString()}
            </span>
            <span className="text-sm text-[var(--text-secondary)] text-right tabular-nums max-md:hidden">
              {cust.sms.toLocaleString()}
            </span>
            <span className="text-xs text-[var(--text-secondary)] max-md:hidden">
              {cust.since}
            </span>
            <span
              className="text-sm font-semibold text-right tabular-nums"
              style={{ color: cust.growth >= 0 ? "var(--success)" : "var(--error)" }}
            >
              {cust.growth >= 0 ? "+" : ""}
              {cust.growth}%
            </span>
          </div>
        ))}
      </TableWrapper>

      {/* Recent Activity: 2-col grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Recent Signups */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border-default)]">
            <h3 className="text-sm font-semibold text-white">
              Recent Signups
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              ลูกค้าสมัครล่าสุด
            </p>
          </div>
          {RECENT_SIGNUPS.map((s, i) => (
            <div
              key={s.company}
              className={`flex items-center justify-between px-5 py-3.5 border-b border-[var(--table-border)] ${
                i % 2 === 1 ? "bg-[var(--table-alt-row)]" : ""
              }`}
            >
              <div className="min-w-0">
                <div className="text-sm text-white font-medium truncate">
                  {s.company}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {s.plan} · {s.date}
                </div>
              </div>
              <div className="text-sm font-semibold text-[var(--success)] tabular-nums ml-4 shrink-0">
                ฿{s.mrr.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Churned Customers */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border-default)]">
            <h3 className="text-sm font-semibold text-white">
              Churned Customers
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              ลูกค้าที่ยกเลิกบริการ
            </p>
          </div>
          {CHURNED_CUSTOMERS.map((c, i) => (
            <div
              key={c.company}
              className={`flex items-center justify-between px-5 py-3.5 border-b border-[var(--table-border)] ${
                i % 2 === 1 ? "bg-[var(--table-alt-row)]" : ""
              }`}
            >
              <div className="min-w-0">
                <div className="text-sm text-white font-medium truncate">
                  {c.company}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {c.reason} · {c.date}
                </div>
              </div>
              <div className="text-sm font-semibold text-[var(--error)] tabular-nums ml-4 shrink-0">
                -฿{c.lostMrr.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
