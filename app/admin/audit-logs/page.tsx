"use client";

import { useState, useMemo, useEffect } from "react";
import {
  LogIn,
  MessageSquare,
  Megaphone,
  Settings,
  CreditCard,
  Trash2,
  Key,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Download,
  FileJson,
  FileText,
  ScrollText,
  Search,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageLayout, {
  PageHeader,
  FilterBar,
  TableWrapper,
  PaginationBar,
  EmptyState,
} from "@/components/blocks/PageLayout";
import CustomSelect from "@/components/ui/CustomSelect";

/* ─── Types ─── */

type ActionType =
  | "login"
  | "sms_send"
  | "campaign"
  | "settings"
  | "billing"
  | "delete"
  | "api_access";

type AuditEntry = {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: ActionType;
  target: string;
  ip: string;
  result: "success" | "failed";
  userAgent: string;
  method: string;
  path: string;
  body: string;
  responseStatus: number;
};

/* ─── Config ─── */

const PAGE_SIZE = 10;

const ACTION_CONFIG: Record<
  ActionType,
  {
    label: string;
    icon: React.ReactNode;
    bg: string;
    color: string;
  }
> = {
  login: {
    label: "Login",
    icon: <LogIn size={12} />,
    bg: "rgba(var(--info-rgb),0.12)",
    color: "var(--info)",
  },
  sms_send: {
    label: "SMS",
    icon: <MessageSquare size={12} />,
    bg: "rgba(var(--info-rgb),0.12)",
    color: "var(--info)",
  },
  campaign: {
    label: "Campaign",
    icon: <Megaphone size={12} />,
    bg: "rgba(var(--success-rgb),0.12)",
    color: "var(--success)",
  },
  settings: {
    label: "Settings",
    icon: <Settings size={12} />,
    bg: "rgba(var(--warning-rgb),0.12)",
    color: "var(--warning)",
  },
  billing: {
    label: "Billing",
    icon: <CreditCard size={12} />,
    bg: "rgba(var(--info-rgb),0.12)",
    color: "var(--info)",
  },
  delete: {
    label: "Delete",
    icon: <Trash2 size={12} />,
    bg: "rgba(var(--error-rgb),0.12)",
    color: "var(--error)",
  },
  api_access: {
    label: "API",
    icon: <Key size={12} />,
    bg: "rgba(var(--text-muted-rgb),0.12)",
    color: "var(--text-muted)",
  },
};

/* ─── No mock data — fetched from API ─── */

/* ─── Filter Options ─── */

const DATE_OPTIONS = [
  { value: "today", label: "วันนี้" },
  { value: "7d", label: "7 วัน" },
  { value: "30d", label: "30 วัน" },
  { value: "90d", label: "90 วัน" },
];

const USER_OPTIONS = [
  { value: "all", label: "ทุกคน" },
  { value: "somchai", label: "สมชาย Admin" },
  { value: "somsri", label: "สมศรี Member" },
  { value: "system", label: "ระบบอัตโนมัติ" },
  { value: "api", label: "API Key sk_live_xxx" },
];

const ACTION_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "login", label: "Login" },
  { value: "sms_send", label: "SMS" },
  { value: "campaign", label: "Campaign" },
  { value: "settings", label: "Settings" },
  { value: "billing", label: "Billing" },
  { value: "delete", label: "Delete" },
  { value: "api_access", label: "API" },
];

/* ─── Sub-components ─── */

function ActionBadge({ action }: { action: ActionType }) {
  const cfg = ACTION_CONFIG[action];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function ResultBadge({ result }: { result: "success" | "failed" }) {
  if (result === "success") {
    return (
      <span className="inline-flex items-center gap-1 text-[var(--success)] text-xs font-medium">
        <CheckCircle2 size={14} />
        สำเร็จ
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[var(--error)] text-xs font-medium">
      <XCircle size={14} />
      ล้มเหลว
    </span>
  );
}

function DetailRow({ entry }: { entry: AuditEntry }) {
  return (
    <tr>
      <td colSpan={8} className="p-0">
        <div
          className="mx-4 my-2 rounded-xl border p-4"
          style={{
            background: "rgba(0,0,0,0.25)",
            borderColor: "var(--border-default)",
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left column */}
            <div className="space-y-3">
              <DetailItem label="User Agent" value={entry.userAgent} mono />
              <DetailItem label="Request Method" value={entry.method} mono />
              <DetailItem label="Request Path" value={entry.path} mono />
              <DetailItem
                label="Response Status"
                value={String(entry.responseStatus)}
                mono
                valueColor={entry.responseStatus < 300 ? "var(--success)" : "var(--error)"}
              />
            </div>
            {/* Right column — body */}
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
                Request Body
              </p>
              <pre
                className="text-[12px] rounded-lg p-3 overflow-x-auto leading-relaxed"
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid var(--table-border)",
                  color: "var(--text-secondary)",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
              >
                {entry.body}
              </pre>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

function DetailItem({
  label,
  value,
  mono = false,
  valueColor,
}: {
  label: string;
  value: string;
  mono?: boolean;
  valueColor?: string;
}) {
  return (
    <div>
      <p
        className="text-[11px] font-medium uppercase tracking-widest mb-0.5"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>
      <p
        className="text-[13px] break-all"
        style={{
          color: valueColor ?? "var(--text-secondary)",
          fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined,
        }}
      >
        {value}
      </p>
    </div>
  );
}

/* ─── Export Dropdown ─── */

function ExportDropdown() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="gap-2 cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <Download size={14} />
        Export
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>
      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden border shadow-xl min-w-[140px]"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border-default)",
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors hover:bg-white/5 cursor-pointer"
              style={{ color: "var(--text-secondary)" }}
            >
              <FileText size={14} />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors hover:bg-white/5 cursor-pointer"
              style={{ color: "var(--text-secondary)" }}
            >
              <FileJson size={14} />
              Export JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Main Page ─── */

export default function AuditLogsPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");
  const [userFilter, setUserFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const params = new URLSearchParams({ range: dateRange });
        const res = await fetch(`/api/v1/audit-logs?${params}`);
        if (res.ok) {
          const data = await res.json();
          setEntries(Array.isArray(data) ? data : data.entries ?? []);
        }
      } catch {
        // API unavailable
      } finally {
        setApiLoading(false);
      }
    }
    fetchLogs();
  }, [dateRange]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (userFilter !== "all" && !e.user.toLowerCase().includes(userFilter.toLowerCase())) return false;
      if (actionFilter !== "all" && e.action !== actionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !e.user.toLowerCase().includes(q) &&
          !e.target.toLowerCase().includes(q) &&
          !e.ip.includes(q) &&
          !e.path.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [entries, userFilter, actionFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = Math.min(safePage * PAGE_SIZE, filtered.length);

  function handleFilterChange(setter: (v: string) => void) {
    return (v: string) => {
      setter(v);
      setPage(1);
      setExpandedId(null);
    };
  }

  if (apiLoading) {
    return (
      <PageLayout>
        <PageHeader title="Audit Logs" description="ประวัติกิจกรรมระบบ" />
        <div className="flex items-center justify-center h-40">
          <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Audit Logs"
        description="ประวัติกิจกรรมระบบ"
        actions={<ExportDropdown />}
      />

      <FilterBar>
        <CustomSelect
          value={dateRange}
          onChange={handleFilterChange(setDateRange)}
          options={DATE_OPTIONS}
          placeholder="ช่วงเวลา"
          className="w-36"
        />
        <CustomSelect
          value={userFilter}
          onChange={handleFilterChange(setUserFilter)}
          options={USER_OPTIONS}
          placeholder="ผู้ใช้"
          className="w-44"
        />
        <CustomSelect
          value={actionFilter}
          onChange={handleFilterChange(setActionFilter)}
          options={ACTION_OPTIONS}
          placeholder="ประเภท"
          className="w-36"
        />
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-muted)" }}
          />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="ค้นหา..."
            className="pl-8 h-9 text-sm"
          />
        </div>
      </FilterBar>

      <TableWrapper>
        {paginated.length === 0 ? (
          <EmptyState
            icon={<ScrollText size={40} />}
            title="ไม่พบรายการ"
            subtitle="ลองปรับตัวกรองหรือคำค้นหา"
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--table-border)" }}>
                {["Timestamp", "User", "Role", "Action", "Target", "IP Address", "Result", ""].map(
                  (col, i) => (
                    <th
                      key={col || `col-${i}`}
                      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap"
                      style={{
                        background: "var(--table-header)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {paginated.map((entry, idx) => {
                const isExpanded = expandedId === entry.id;
                const isAlt = idx % 2 === 1;
                return (
                  <>
                    <tr
                      key={entry.id}
                      style={{
                        background: isAlt ? "var(--table-alt-row)" : "transparent",
                        borderBottom: isExpanded
                          ? "none"
                          : "1px solid var(--table-border)",
                      }}
                    >
                      {/* Timestamp */}
                      <td
                        className="px-4 py-3 whitespace-nowrap tabular-nums text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {entry.timestamp}
                      </td>

                      {/* User */}
                      <td
                        className="px-4 py-3 font-medium whitespace-nowrap"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {entry.user}
                      </td>

                      {/* Role */}
                      <td
                        className="px-4 py-3 text-xs whitespace-nowrap"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {entry.role}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <ActionBadge action={entry.action} />
                      </td>

                      {/* Target */}
                      <td
                        className="px-4 py-3 max-w-[200px] truncate"
                        style={{ color: "var(--text-secondary)" }}
                        title={entry.target}
                      >
                        {entry.target}
                      </td>

                      {/* IP */}
                      <td
                        className="px-4 py-3 whitespace-nowrap tabular-nums text-xs"
                        style={{ color: "var(--text-muted)", fontFamily: "ui-monospace, monospace" }}
                      >
                        {entry.ip}
                      </td>

                      {/* Result */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <ResultBadge result={entry.result} />
                      </td>

                      {/* Expand */}
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : entry.id)
                          }
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg transition-colors cursor-pointer hover:bg-white/5"
                          style={{ color: "var(--text-muted)" }}
                          aria-label={isExpanded ? "Collapse" : "Expand"}
                        >
                          {isExpanded ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <DetailRow key={`${entry.id}-detail`} entry={entry} />
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}

        <PaginationBar
          from={from}
          to={to}
          total={filtered.length}
          page={safePage}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </TableWrapper>
    </PageLayout>
  );
}
