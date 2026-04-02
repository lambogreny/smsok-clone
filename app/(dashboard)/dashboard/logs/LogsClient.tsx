"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollText, SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import CustomSelect from "@/components/ui/CustomSelect";
import PillTabs from "@/components/ui/PillTabs";
import { Input } from "@/components/ui/input";
import EmptyState from "@/components/EmptyState";
import { formatThaiTimestamp, formatThaiTimestampFull, formatPhone } from "@/lib/format-thai-date";
import { toCsvCell } from "@/lib/csv";

// ─── Types ────────────────────────────────────────────────────────────────

type LogEntry = {
  id: string;
  timestamp: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  url: string;
  statusCode: number;
  latencyMs: number;
  requestHeaders: Record<string, string>;
  requestBody: unknown;
  responseBody: unknown;
  errorCode?: string;
  errorMessage?: string;
  apiKeyName?: string;
  apiKeyId?: string;
  ip: string;
  phone?: string;
  messageId?: string;
  source: "WEB" | "API";
};

type DetailTab = "request" | "response" | "error";

// ─── Constants ────────────────────────────────────────────────────────────

const METHOD_BADGE: Record<string, string> = {
  GET: "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] border-[rgba(var(--accent-rgb),0.15)]",
  POST: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  PUT: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  DELETE: "bg-[rgba(var(--error-rgb,239,68,68),0.15)] text-[var(--error)] border-[rgba(var(--error-rgb,239,68,68),0.2)]",
};

const SOURCE_BADGE: Record<string, string> = {
  WEB: "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] border-[rgba(var(--accent-rgb),0.15)]",
  API: "bg-[rgba(50,152,218,0.1)] text-[var(--accent-secondary)] border-[rgba(50,152,218,0.15)]",
};

const ENDPOINT_OPTIONS = [
  { value: "all", label: "ทุก Endpoint" },
  { value: "/api/v1/sms/send", label: "/sms/send" },
  { value: "/api/v1/sms/batch", label: "/sms/batch" },
  { value: "/api/v1/sms/status", label: "/sms/status" },
  { value: "/api/v1/otp/generate", label: "/otp/generate" },
  { value: "/api/v1/otp/verify", label: "/otp/verify" },
  { value: "/api/v1/contacts", label: "/contacts" },
  { value: "/api/v1/balance", label: "/balance" },
  { value: "/api/v1/templates", label: "/templates" },
  { value: "/api/v1/auth/login", label: "/auth/login" },
];

// API key options fetched dynamically — see LogsClient component

function statusBadgeCls(code: number) {
  if (code < 300) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
  if (code < 400) return "bg-amber-500/15 text-amber-400 border-amber-500/20";
  return "bg-[rgba(var(--error-rgb,239,68,68),0.15)] text-[var(--error)] border-[rgba(var(--error-rgb,239,68,68),0.2)]";
}

function latencyCls(ms: number) {
  if (ms < 100) return "text-emerald-400";
  if (ms <= 500) return "text-amber-400";
  return "text-[var(--error)]";
}

function statusGroup(code: number) {
  if (code < 300) return "2xx";
  if (code < 400) return "3xx";
  if (code < 500) return "4xx";
  return "5xx";
}

function maskHeaders(headers: Record<string, string>): Record<string, string> {
  const masked = { ...headers };
  if (masked.Authorization) {
    masked.Authorization = masked.Authorization.slice(0, 15) + "..." + masked.Authorization.slice(-4);
  }
  return masked;
}

function buildCurl(log: LogEntry): string {
  const parts = [`curl -X ${log.method}`];
  parts.push(`'https://api.smsok.com${log.url}'`);
  for (const [key, value] of Object.entries(log.requestHeaders)) {
    parts.push(`-H '${key}: ${value}'`);
  }
  if (log.requestBody && log.method !== "GET") {
    parts.push(`-d '${JSON.stringify(log.requestBody)}'`);
  }
  return parts.join(" \\\n  ");
}

function exportCsv(logs: LogEntry[]) {
  const header = [
    "Timestamp",
    "Method",
    "Endpoint",
    "Status",
    "Latency (ms)",
    "IP",
    "Source",
    "API Key",
    "Phone",
    "Message ID",
    "Error",
  ].map(toCsvCell).join(",");
  const rows = logs.map((log) =>
    [
      log.timestamp, log.method, log.url, log.statusCode, log.latencyMs,
      log.ip, log.source, log.apiKeyName || "", log.phone || "",
      log.messageId || "", log.errorMessage || "",
    ]
      .map(toCsvCell)
      .join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `api-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── API Fetch ────────────────────────────────────────────────────────────

type ApiLogEntry = {
  id: string;
  method: string;
  url: string;
  endpoint: string | null;
  resStatus: number;
  latencyMs: number;
  ipAddress: string | null;
  source: string | null;
  apiKeyId: string | null;
  errorCode: string | null;
  errorMsg: string | null;
  createdAt: string;
};

type ApiLogDetail = ApiLogEntry & {
  reqHeaders: Record<string, string> | null;
  reqBody: unknown;
  resBody: unknown;
};

type ApiKeyInfo = {
  id: string;
  name: string;
  prefix: string;
};

function mapApiLogToEntry(log: ApiLogEntry): LogEntry {
  return {
    id: log.id,
    timestamp: log.createdAt,
    method: (log.method || "GET") as LogEntry["method"],
    url: log.url || log.endpoint || "",
    statusCode: log.resStatus ?? 0,
    latencyMs: log.latencyMs ?? 0,
    requestHeaders: {},
    requestBody: null,
    responseBody: null,
    errorCode: log.errorCode ?? undefined,
    errorMessage: log.errorMsg ?? undefined,
    apiKeyId: log.apiKeyId ?? undefined,
    ip: log.ipAddress || "",
    source: (log.source === "API" ? "API" : "WEB") as LogEntry["source"],
  };
}

const PAGE_SIZE = 25;

// ─── JSON Viewer ──────────────────────────────────────────────────────────

function JsonViewer({ data }: { data: unknown }) {
  const [copied, setCopied] = useState(false);
  const text = JSON.stringify(data, null, 2);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (data == null) return <p className="text-xs text-[var(--text-muted)] italic py-3">ไม่มีข้อมูล</p>;

  return (
    <div className="relative rounded-lg bg-black/40 border border-white/[0.04] overflow-hidden">
      <button
        onClick={handleCopy}
        aria-label="คัดลอก JSON"
        className="absolute top-2 right-2 z-10 w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        title="Copy"
      >
        {copied ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400"><polyline points="20 6 9 17 4 12" /></svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
        )}
      </button>
      <pre className="p-3 pr-9 text-[11px] font-mono text-[var(--accent)]/80 overflow-x-auto max-h-[250px] overflow-y-auto leading-relaxed">
        {text}
      </pre>
    </div>
  );
}

// ─── Detail Panel (Right Pane) ────────────────────────────────────────────

function DetailPane({
  log,
  onReplay,
  isReplaying,
}: {
  log: LogEntry;
  onReplay: (log: LogEntry) => void;
  isReplaying: boolean;
}) {
  const [tab, setTab] = useState<DetailTab>("request");
  const [curlCopied, setCurlCopied] = useState(false);

  const tabs: { id: DetailTab; label: string; show: boolean }[] = [
    { id: "request", label: "Request", show: true },
    { id: "response", label: "Response", show: true },
    { id: "error", label: "Error", show: !!log.errorCode },
  ];

  function handleCopyCurl() {
    navigator.clipboard.writeText(buildCurl(log));
    setCurlCopied(true);
    setTimeout(() => setCurlCopied(false), 2000);
  }

  return (
    <motion.div
      key={log.id}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col"
    >
      {/* Detail Header — pr-10 prevents overlap with close button */}
      <div className="px-5 pr-12 py-4 border-b border-[var(--border-default)] shrink-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${METHOD_BADGE[log.method]}`}>
            {log.method}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusBadgeCls(log.statusCode)}`}>
            {log.statusCode}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${SOURCE_BADGE[log.source]}`}>
            {log.source}
          </span>
          <span className={`text-xs font-mono tabular-nums ml-auto ${latencyCls(log.latencyMs)}`}>
            {log.latencyMs}ms
          </span>
        </div>
        <p className="text-sm text-[var(--text-primary)] font-mono break-all">{log.url}</p>
        <p className="text-[11px] text-[var(--text-muted)] mt-1">{formatThaiTimestampFull(log.timestamp)}</p>
      </div>

      {/* Meta chips */}
      <div className="px-5 py-3 border-b border-[var(--border-default)] flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] shrink-0">
        {log.apiKeyName && (
          <span className="text-[var(--text-muted)]">Key: <span className="text-[var(--text-secondary)]">{log.apiKeyName}</span></span>
        )}
        <span className="text-[var(--text-muted)]">IP: <span className="text-[var(--text-secondary)] font-mono">{log.ip}</span></span>
        {log.phone && (
          <span className="text-[var(--text-muted)]">Phone: <span className="text-[var(--text-secondary)] font-mono">{formatPhone(log.phone)}</span></span>
        )}
        {log.messageId && (
          <span className="text-[var(--text-muted)]">Msg: <span className="text-[var(--text-secondary)] font-mono">{log.messageId}</span></span>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-5 py-3 border-b border-[var(--border-default)] flex items-center gap-2 shrink-0">
        <button
          onClick={() => onReplay(log)}
          disabled={isReplaying}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[rgba(var(--accent-rgb),0.1)] border border-[rgba(var(--accent-rgb),0.15)] text-[var(--accent)] hover:bg-[rgba(var(--accent-rgb),0.2)] transition-all cursor-pointer disabled:opacity-50"
        >
          {isReplaying ? (
            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          )}
          {isReplaying ? "Replaying..." : "Replay Request"}
        </button>
        <button
          onClick={handleCopyCurl}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/[0.03] border border-white/[0.06] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[rgba(var(--accent-rgb),0.15)] transition-all cursor-pointer"
        >
          {curlCopied ? (
            <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400"><polyline points="20 6 9 17 4 12" /></svg> Copied!</>
          ) : (
            <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg> Copy cURL</>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-3 flex items-center gap-1 border-b border-white/[0.04] shrink-0">
        {tabs.filter(t => t.show).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-[11px] font-medium rounded-t-lg transition-all cursor-pointer ${
              tab === t.id
                ? "bg-white/[0.04] text-[var(--text-primary)] border-b-2 border-[var(--accent)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/[0.02]"
            }`}
          >
            {t.id === "error" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--error)] mr-1.5" />}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content — scrollable */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <AnimatePresence mode="wait">
          {tab === "request" && (
            <motion.div key="req" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium mb-2">Headers</p>
              <JsonViewer data={maskHeaders(log.requestHeaders)} />
              {log.requestBody != null && (
                <>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium mt-4 mb-2">Body</p>
                  <JsonViewer data={log.requestBody} />
                </>
              )}
            </motion.div>
          )}
          {tab === "response" && (
            <motion.div key="res" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusBadgeCls(log.statusCode)}`}>
                  {log.statusCode}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {log.statusCode < 300 ? "OK" : log.statusCode < 400 ? "Redirect" : log.statusCode < 500 ? "Client Error" : "Server Error"}
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium mb-2">Body</p>
              <JsonViewer data={log.responseBody} />
            </motion.div>
          )}
          {tab === "error" && log.errorCode && (
            <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
              <div className="p-4 rounded-lg bg-[rgba(var(--error-rgb,239,68,68),0.06)] border border-[rgba(var(--error-rgb,239,68,68),0.15)]">
                <div className="flex items-center gap-3 mb-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--error)] shrink-0">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span className="text-sm font-semibold text-[var(--error)]">Error {log.errorCode}</span>
                </div>
                <p className="text-sm text-[var(--error)] opacity-80">{log.errorMessage}</p>
                <p className="text-[10px] text-[var(--error)] opacity-60 mt-2 italic">Stack trace hidden for security</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Stagger ──────────────────────────────────────────────────────────────

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.02 } } };
const rowVariant = { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeOut" as const } } };

// ─── Main Component — Stripe-style Split Pane ────────────────────────────

export default function LogsClient() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [endpointFilter, setEndpointFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [apiKeyFilter, setApiKeyFilter] = useState("all");
  const [ipSearch, setIpSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayResult, setReplayResult] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyOptions, setApiKeyOptions] = useState<{ value: string; label: string }[]>([{ value: "all", label: "ทุก API Key" }]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch logs from real API
  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      if (search) params.set("search", search);
      if (statusFilter !== "all") {
        const statusMap: Record<string, string> = { "2xx": "200", "4xx": "400", "5xx": "500" };
        if (statusMap[statusFilter]) params.set("status", statusMap[statusFilter]);
      }
      if (methodFilter !== "all") params.set("method", methodFilter);
      if (endpointFilter !== "all") params.set("endpoint", endpointFilter);
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      if (apiKeyFilter !== "all") params.set("apiKeyId", apiKeyFilter);
      if (ipSearch) params.set("ip", ipSearch);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const res = await fetch(`/api/v1/logs?${params.toString()}`);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const apiLogs: ApiLogEntry[] = data.data?.logs ?? data.logs ?? [];
      setLogs(apiLogs.map(mapApiLogToEntry));
      setTotalCount(data.data?.pagination?.total ?? data.pagination?.total ?? apiLogs.length);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, methodFilter, endpointFilter, sourceFilter, apiKeyFilter, ipSearch, dateFrom, dateTo]);

  // Fetch API keys for filter dropdown
  useEffect(() => {
    fetch("/api/v1/api-keys")
      .then((r) => r.json())
      .then((data) => {
        const keys: ApiKeyInfo[] = data.data?.apiKeys ?? data.apiKeys ?? [];
        setApiKeyOptions([
          { value: "all", label: "ทุก API Key" },
          ...keys.map((k) => ({ value: k.id, label: `${k.name} ****${k.prefix?.slice(-4) || ""}` })),
        ]);
      })
      .catch(() => {});
  }, []);

  // Initial fetch + refetch on filter change
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Auto-refresh polling
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchLogs, 5000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, fetchLogs]);

  // Fetch log detail when selecting a log
  const handleSelectLog = useCallback(async (log: LogEntry) => {
    setSelectedLog(log);
    setReplayResult(null);
    try {
      const res = await fetch(`/api/v1/logs/${log.id}`);
      if (res.ok) {
        const data = await res.json();
        const detail: ApiLogDetail = data.data ?? data;
        setSelectedLog((prev) =>
          prev?.id === log.id
            ? {
                ...prev,
                requestHeaders: detail.reqHeaders ?? {},
                requestBody: detail.reqBody ?? null,
                responseBody: detail.resBody ?? null,
              }
            : prev
        );
      }
    } catch {
      // Detail fetch failed — show basic info only
    }
  }, []);

  // Replay request
  const handleReplay = useCallback(async (log: LogEntry) => {
    setIsReplaying(true);
    setReplayResult(null);
    try {
      const replayRes = await fetch(log.url, {
        method: log.method,
        headers: log.requestHeaders,
        body: log.method !== "GET" && log.requestBody ? JSON.stringify(log.requestBody) : undefined,
      });
      setReplayResult({ type: replayRes.ok ? "success" : "error", text: `Replayed ${log.method} ${log.url} — ${replayRes.status}` });
    } catch {
      setReplayResult({ type: "error", text: "Replay failed — ไม่สามารถเรียก API ซ้ำได้" });
    } finally {
      setIsReplaying(false);
    }
  }, []);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const showingFrom = totalCount > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const showingTo = Math.min(page * PAGE_SIZE, totalCount);

  function clearFilters() {
    setSearch(""); setStatusFilter("all"); setMethodFilter("all"); setEndpointFilter("all"); setSourceFilter("all"); setApiKeyFilter("all"); setIpSearch(""); setDateFrom(""); setDateTo(""); setPage(1);
  }

  const hasFilters = search || statusFilter !== "all" || methodFilter !== "all" || endpointFilter !== "all" || sourceFilter !== "all" || apiKeyFilter !== "all" || ipSearch || dateFrom || dateTo;

  return (
    <motion.div
      className="p-4 md:p-6 h-[calc(100vh-64px)] flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-[var(--text-primary)]">API Request Logs</span>
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">ประวัติการเรียก API ทั้งหมด</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => exportCsv(logs)}
            className="bg-transparent border border-[var(--border-default)] text-[var(--text-primary)] rounded-lg hover:border-[rgba(var(--accent-rgb),0.3)] hover:bg-[rgba(var(--accent-rgb),0.04)] px-3 py-1.5 rounded-lg text-[11px] font-medium inline-flex items-center gap-1.5 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            CSV
          </motion.button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
              autoRefresh
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-white/[0.03] border-white/[0.06] text-[var(--text-muted)] hover:border-white/10"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
            {autoRefresh ? "Live" : "Auto"}
          </button>
          <motion.button
            onClick={() => fetchLogs()}
            className="bg-transparent border border-[var(--border-default)] text-[var(--text-primary)] rounded-lg hover:border-[rgba(var(--accent-rgb),0.3)] hover:bg-[rgba(var(--accent-rgb),0.04)] px-3 py-1.5 rounded-lg text-[11px] font-medium inline-flex items-center gap-1.5 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-[var(--accent)]" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-xs text-[var(--text-muted)]">กำลังโหลด...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-[var(--error)] mb-2">{error}</p>
            <button onClick={fetchLogs} className="text-xs text-[var(--accent)] hover:underline cursor-pointer">ลองอีกครั้ง</button>
          </div>
        </div>
      ) : logs.length === 0 && !hasFilters ? (
        <EmptyState
          icon={ScrollText}
          iconColor="var(--accent)"
          iconBg="rgba(var(--accent-rgb), 0.1)"
          title="ยังไม่มีบันทึก"
          description="บันทึกการเรียก API จะแสดงที่นี่เมื่อเริ่มใช้งาน"
        />
      ) : (
      <>

      {/* Filter Bar */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-3 mb-4 shrink-0">
        <div className="flex flex-col gap-2">
          {/* Row 1: Search + mobile filter button */}
          <div className="flex gap-2">
            <div className="relative flex-1 min-w-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] pl-8 text-xs py-1.5"
                placeholder="เบอร์โทร, Message ID, IP, endpoint..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            {/* Mobile: filter button */}
            <button
              type="button"
              onClick={() => setFilterSheetOpen(true)}
              className="sm:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer shrink-0"
            >
              <SlidersHorizontal size={14} />
              ตัวกรอง
              {hasFilters && <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />}
            </button>
          </div>
          {/* Desktop: inline filters */}
          <div className="hidden sm:flex flex-wrap gap-2">
            <CustomSelect value={endpointFilter} onChange={(v) => { setEndpointFilter(v); setPage(1); }} options={ENDPOINT_OPTIONS} className="min-w-[140px]" />
            <PillTabs
              value={methodFilter}
              onChange={(v) => { setMethodFilter(v); setPage(1); }}
              label="Filter by HTTP method"
              options={[
                { value: "all", label: "All" },
                { value: "GET", label: "GET" },
                { value: "POST", label: "POST" },
                { value: "PUT", label: "PUT" },
                { value: "DELETE", label: "DEL" },
              ]}
            />
            <PillTabs
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
              label="Filter by status code"
              options={[
                { value: "all", label: "All" },
                { value: "2xx", label: "2xx" },
                { value: "4xx", label: "4xx" },
                { value: "5xx", label: "5xx" },
              ]}
            />
            <PillTabs
              value={sourceFilter}
              onChange={(v) => { setSourceFilter(v); setPage(1); }}
              label="Filter by source"
              options={[
                { value: "all", label: "All" },
                { value: "WEB", label: "WEB" },
                { value: "API", label: "API" },
              ]}
            />
            <CustomSelect value={apiKeyFilter} onChange={(v) => { setApiKeyFilter(v); setPage(1); }} options={apiKeyOptions} className="min-w-[170px]" />
          </div>
          {/* Desktop: row 2 — IP + dates */}
          <div className="hidden sm:flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <rect x="2" y="2" width="20" height="20" rx="4" /><path d="M8 12h8M12 8v8" />
              </svg>
              <input
                type="text"
                className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] pl-8 text-xs py-1.5"
                placeholder="IP Address..."
                value={ipSearch}
                onChange={(e) => { setIpSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">จาก</label>
              <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="text-xs py-1 px-2 w-[130px] h-auto min-h-[40px]" />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">ถึง</label>
              <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="text-xs py-1 px-2 w-[130px] h-auto min-h-[40px]" />
            </div>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer">ล้าง</button>
            )}
            <span className="text-[10px] text-[var(--text-muted)] ml-auto">{totalCount} รายการ</span>
          </div>
          {/* Mobile: total count */}
          <div className="sm:hidden flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-muted)]">{totalCount} รายการ</span>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer">ล้างตัวกรอง</button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>ตัวกรอง API Logs</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Endpoint</label>
              <CustomSelect value={endpointFilter} onChange={(v) => { setEndpointFilter(v); setPage(1); }} options={ENDPOINT_OPTIONS} />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Method</label>
              <PillTabs
                value={methodFilter}
                onChange={(v) => { setMethodFilter(v); setPage(1); }}
                label="Filter by HTTP method"
                options={[
                  { value: "all", label: "All" },
                  { value: "GET", label: "GET" },
                  { value: "POST", label: "POST" },
                  { value: "PUT", label: "PUT" },
                  { value: "DELETE", label: "DEL" },
                ]}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Status</label>
              <PillTabs
                value={statusFilter}
                onChange={(v) => { setStatusFilter(v); setPage(1); }}
                label="Filter by status code"
                options={[
                  { value: "all", label: "All" },
                  { value: "2xx", label: "2xx" },
                  { value: "4xx", label: "4xx" },
                  { value: "5xx", label: "5xx" },
                ]}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Source</label>
              <PillTabs
                value={sourceFilter}
                onChange={(v) => { setSourceFilter(v); setPage(1); }}
                label="Filter by source"
                options={[
                  { value: "all", label: "All" },
                  { value: "WEB", label: "WEB" },
                  { value: "API", label: "API" },
                ]}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2 block">API Key</label>
              <CustomSelect value={apiKeyFilter} onChange={(v) => { setApiKeyFilter(v); setPage(1); }} options={apiKeyOptions} />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2 block">IP Address</label>
              <input
                type="text"
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] px-3 text-xs py-2"
                placeholder="IP Address..."
                value={ipSearch}
                onChange={(e) => { setIpSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2 block">จาก</label>
                <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="text-xs h-11" />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2 block">ถึง</label>
                <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="text-xs h-11" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => { clearFilters(); }}
                  className="flex-1 h-11 rounded-lg border border-[var(--border-default)] text-sm text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                >
                  ล้างทั้งหมด
                </button>
              )}
              <button
                type="button"
                onClick={() => setFilterSheetOpen(false)}
                className="flex-1 h-11 rounded-lg bg-[var(--accent)] text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
              >
                ดูผลลัพธ์
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Replay feedback */}
      <AnimatePresence>
        {replayResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`mb-3 p-2.5 rounded-lg border text-xs font-medium shrink-0 ${
              replayResult.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-[rgba(var(--error-rgb,239,68,68),0.1)] border-[rgba(var(--error-rgb,239,68,68),0.2)] text-[var(--error)]"
            }`}
          >
            {replayResult.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Split Pane: Left=List, Right=Detail */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Pane — Request List */}
        <div className={`bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg flex flex-col overflow-hidden transition-all duration-300 ${selectedLog ? "w-[45%]" : "w-full"}`}>
          {/* List header */}
          <div className="hidden md:grid grid-cols-[1fr_60px_60px_60px] gap-x-2 px-4 py-2 border-b border-[var(--border-default)] text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider shrink-0">
            <span>Request</span>
            <span className="text-center">Status</span>
            <span className="text-right">Time</span>
            <span className="text-center">Src</span>
          </div>

          {/* Scrollable rows */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {logs.length > 0 ? (
                <motion.div key="rows" variants={stagger} initial="hidden" animate="show">
                  {logs.map((log) => {
                    const isSelected = selectedLog?.id === log.id;
                    return (
                      <motion.button
                        key={log.id}
                        variants={rowVariant}
                        onClick={() => handleSelectLog(log)}
                        className={`w-full grid grid-cols-1 md:grid-cols-[1fr_60px_60px_60px] gap-x-2 px-4 py-2.5 items-center text-left border-b border-[var(--border-default)] hover:bg-white/[0.03] transition-colors cursor-pointer ${
                          isSelected ? "bg-[rgba(var(--accent-rgb),0.06)] border-l-2 border-l-[var(--accent)]" : ""
                        }`}
                      >
                        {/* Method + URL + timestamp */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${METHOD_BADGE[log.method]}`}>
                              {log.method}
                            </span>
                            <span className="text-xs text-[var(--text-primary)] font-mono truncate">{log.url}</span>
                          </div>
                          <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{formatThaiTimestamp(log.timestamp)}</p>
                        </div>

                        {/* Status */}
                        <span className="text-center">
                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusBadgeCls(log.statusCode)}`}>
                            {log.statusCode}
                          </span>
                        </span>

                        {/* Latency */}
                        <span className={`text-[10px] font-mono text-right tabular-nums ${latencyCls(log.latencyMs)}`}>
                          {log.latencyMs}ms
                        </span>

                        {/* Source */}
                        <span className="text-center">
                          <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded border ${SOURCE_BADGE[log.source]}`}>
                            {log.source}
                          </span>
                        </span>
                      </motion.button>
                    );
                  })}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--text-muted)]">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                  </svg>
                  <p className="text-xs text-[var(--text-secondary)]">ไม่พบ request logs</p>
                  {hasFilters && (
                    <button onClick={clearFilters} className="text-[10px] text-[var(--accent)] hover:text-[var(--accent-secondary)] cursor-pointer">ล้างตัวกรอง</button>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="border-t border-[var(--border-default)] px-4 py-2 flex items-center justify-between text-[10px] text-[var(--text-muted)] shrink-0">
              <span>{showingFrom}–{showingTo} / {totalCount}</span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="w-11 h-11 min-h-[44px] rounded flex items-center justify-center hover:bg-[var(--bg-surface)] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
                  </button>
                  <span className="px-1">{page}/{totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="w-11 h-11 min-h-[44px] rounded flex items-center justify-center hover:bg-[var(--bg-surface)] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Pane — Detail */}
        <AnimatePresence>
          {selectedLog && (
            <motion.div
              className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg relative flex flex-col overflow-hidden w-[55%]"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "55%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {/* Close button — fixed top-right of the pane */}
              <button
                onClick={() => setSelectedLog(null)}
                className="absolute top-3 right-3 z-20 w-7 h-7 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] hover:bg-white/10 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <DetailPane log={selectedLog} onReplay={handleReplay} isReplaying={isReplaying} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state for right pane */}
        {!selectedLog && (
          <div className="hidden lg:flex bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg w-[55%] items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--text-muted)]">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <p className="text-xs text-[var(--text-muted)]">เลือก request จากรายการด้านซ้าย</p>
            </div>
          </div>
        )}
      </div>
      </>
      )}
    </motion.div>
  );
}
