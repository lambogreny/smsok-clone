"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CustomSelect from "@/components/ui/CustomSelect";

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
  GET: "bg-[rgba(0,255,167,0.1)] text-[#00FFA7] border-[rgba(0,255,167,0.15)]",
  POST: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  PUT: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  DELETE: "bg-red-500/15 text-red-400 border-red-500/20",
};

const SOURCE_BADGE: Record<string, string> = {
  WEB: "bg-[rgba(0,255,167,0.1)] text-[#00FFA7] border-[rgba(0,255,167,0.15)]",
  API: "bg-[rgba(50,152,218,0.1)] text-[#4779FF] border-[rgba(50,152,218,0.15)]",
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

const API_KEY_OPTIONS = [
  { value: "all", label: "ทุก API Key" },
  { value: "sk_live_a1b2", label: "Production ****a1b2" },
  { value: "sk_test_c3d4", label: "Staging ****c3d4" },
  { value: "sk_test_e5f6", label: "Test ****e5f6" },
];

function statusBadgeCls(code: number) {
  if (code < 300) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
  if (code < 400) return "bg-amber-500/15 text-amber-400 border-amber-500/20";
  return "bg-red-500/15 text-red-400 border-red-500/20";
}

function latencyCls(ms: number) {
  if (ms < 100) return "text-emerald-400";
  if (ms <= 500) return "text-amber-400";
  return "text-red-400";
}

function statusGroup(code: number) {
  if (code < 300) return "2xx";
  if (code < 400) return "3xx";
  if (code < 500) return "4xx";
  return "5xx";
}

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function formatTimestampFull(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
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
  const header = "Timestamp,Method,Endpoint,Status,Latency (ms),IP,Source,API Key,Phone,Message ID,Error\n";
  const rows = logs.map((log) =>
    [
      log.timestamp, log.method, log.url, log.statusCode, log.latencyMs,
      log.ip, log.source, log.apiKeyName || "", log.phone || "",
      log.messageId || "", log.errorMessage || "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = header + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `api-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Mock Data ────────────────────────────────────────────────────────────

function generateMockLogs(count: number): LogEntry[] {
  const methods: LogEntry["method"][] = ["GET", "POST", "POST", "DELETE"];
  const endpoints = [
    "/api/v1/sms/send", "/api/v1/sms/batch", "/api/v1/otp/generate",
    "/api/v1/otp/verify", "/api/v1/contacts", "/api/v1/balance",
    "/api/v1/templates", "/api/v1/sms/status", "/api/v1/auth/login",
  ];
  const statuses = [200, 200, 200, 200, 201, 400, 401, 429, 500];
  const keys = [
    { name: "Production Key", id: "sk_live_a1b2" },
    { name: "Staging Key", id: "sk_test_c3d4" },
    { name: "Test Key", id: "sk_test_e5f6" },
  ];

  return Array.from({ length: count }, (_, i) => {
    const method = methods[i % methods.length];
    const url = endpoints[i % endpoints.length];
    const statusCode = statuses[i % statuses.length];
    const latencyMs = Math.floor(Math.random() * 800) + 20;
    const ts = new Date(Date.now() - i * 45000).toISOString();
    const isError = statusCode >= 400;
    const phone = `089${String(1000000 + i).slice(0, 7)}`;
    const messageId = `msg_${Date.now()}_${i}`;

    return {
      id: `log_${Date.now()}_${i}`,
      timestamp: ts,
      method,
      url,
      statusCode,
      latencyMs,
      requestHeaders: {
        Authorization: "Bearer sk_live_abc123def456ghi789jkl",
        "Content-Type": "application/json",
      },
      requestBody: method === "POST" ? {
        sender: "EasySlip",
        to: phone,
        message: "สวัสดีครับ ข้อความทดสอบ #" + (i + 1),
      } : null,
      responseBody: isError
        ? { error: { code: String(statusCode), message: statusCode === 401 ? "Invalid API Key" : statusCode === 429 ? "Rate limit exceeded" : "Bad request" } }
        : { id: messageId, status: "pending", credits_used: 1, credits_remaining: 1500 - i },
      errorCode: isError ? String(statusCode) : undefined,
      errorMessage: isError
        ? (statusCode === 401 ? "Invalid API Key" : statusCode === 429 ? "Rate limit exceeded (10/min)" : statusCode === 500 ? "Internal server error" : "Validation failed")
        : undefined,
      apiKeyName: keys[i % keys.length].name,
      apiKeyId: keys[i % keys.length].id,
      ip: `203.154.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      phone,
      messageId: isError ? undefined : messageId,
      source: i % 3 === 0 ? "WEB" as const : "API" as const,
    };
  });
}

const ALL_LOGS = generateMockLogs(87);
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
        className="absolute top-2 right-2 z-10 w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
        title="Copy"
      >
        {copied ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400"><polyline points="20 6 9 17 4 12" /></svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
        )}
      </button>
      <pre className="p-3 pr-9 text-[11px] font-mono text-[#00FFA7]/80 overflow-x-auto max-h-[250px] overflow-y-auto leading-relaxed">
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
      <div className="px-5 pr-12 py-4 border-b border-[var(--border-subtle)] shrink-0">
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
        <p className="text-sm text-white font-mono break-all">{log.url}</p>
        <p className="text-[11px] text-[var(--text-muted)] mt-1">{formatTimestampFull(log.timestamp)}</p>
      </div>

      {/* Meta chips */}
      <div className="px-5 py-3 border-b border-[var(--border-subtle)] flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] shrink-0">
        {log.apiKeyName && (
          <span className="text-[var(--text-muted)]">Key: <span className="text-[var(--text-secondary)]">{log.apiKeyName}</span></span>
        )}
        <span className="text-[var(--text-muted)]">IP: <span className="text-[var(--text-secondary)] font-mono">{log.ip}</span></span>
        {log.phone && (
          <span className="text-[var(--text-muted)]">Phone: <span className="text-[var(--text-secondary)] font-mono">{log.phone}</span></span>
        )}
        {log.messageId && (
          <span className="text-[var(--text-muted)]">Msg: <span className="text-[var(--text-secondary)] font-mono">{log.messageId}</span></span>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-5 py-3 border-b border-[var(--border-subtle)] flex items-center gap-2 shrink-0">
        <button
          onClick={() => onReplay(log)}
          disabled={isReplaying}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[rgba(0,255,167,0.1)] border border-[rgba(0,255,167,0.15)] text-[#00FFA7] hover:bg-[rgba(0,255,167,0.2)] transition-all cursor-pointer disabled:opacity-50"
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/[0.03] border border-white/[0.06] text-[var(--text-muted)] hover:text-white hover:border-[rgba(0,255,167,0.15)] transition-all cursor-pointer"
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
                ? "bg-white/[0.04] text-white border-b-2 border-[#00FFA7]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/[0.02]"
            }`}
          >
            {t.id === "error" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5" />}
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
              <div className="p-4 rounded-xl bg-red-500/[0.06] border border-red-500/15">
                <div className="flex items-center gap-3 mb-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400 shrink-0">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span className="text-sm font-semibold text-red-400">Error {log.errorCode}</span>
                </div>
                <p className="text-sm text-red-400/80">{log.errorMessage}</p>
                <p className="text-[10px] text-red-400/60 mt-2 italic">Stack trace hidden for security</p>
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
  const [logs, setLogs] = useState<LogEntry[]>(ALL_LOGS);
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
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayResult, setReplayResult] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-refresh polling
  const refreshLogs = useCallback(() => {
    setLogs(generateMockLogs(87));
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(refreshLogs, 5000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, refreshLogs]);

  // Replay request
  const handleReplay = useCallback(async (log: LogEntry) => {
    setIsReplaying(true);
    setReplayResult(null);
    try {
      // In production: actually replay the API call
      // For now: simulate with delay
      await new Promise((r) => setTimeout(r, 1500));
      setReplayResult({ type: "success", text: `Replayed ${log.method} ${log.url} — 200 OK` });
    } catch {
      setReplayResult({ type: "error", text: "Replay failed" });
    } finally {
      setIsReplaying(false);
    }
  }, []);

  // Filter
  const filtered = logs.filter((log) => {
    const q = search.toLowerCase().trim();
    const matchSearch = !q ||
      log.url.toLowerCase().includes(q) ||
      (log.phone && log.phone.includes(q)) ||
      (log.messageId && log.messageId.toLowerCase().includes(q)) ||
      log.ip.includes(q);
    const matchStatus = statusFilter === "all" || statusGroup(log.statusCode) === statusFilter;
    const matchMethod = methodFilter === "all" || log.method === methodFilter;
    const matchEndpoint = endpointFilter === "all" || log.url === endpointFilter;
    const matchSource = sourceFilter === "all" || log.source === sourceFilter;
    const matchApiKey = apiKeyFilter === "all" || log.apiKeyId === apiKeyFilter;
    const ipQ = ipSearch.trim();
    const matchIp = !ipQ || log.ip.includes(ipQ);
    const logDate = new Date(log.timestamp);
    const matchFrom = !dateFrom || logDate >= new Date(dateFrom);
    const matchTo = !dateTo || logDate <= new Date(dateTo + "T23:59:59");
    return matchSearch && matchStatus && matchMethod && matchEndpoint && matchSource && matchApiKey && matchIp && matchFrom && matchTo;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const showingFrom = Math.min((page - 1) * PAGE_SIZE + 1, filtered.length);
  const showingTo = Math.min(page * PAGE_SIZE, filtered.length);

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
            <span className="gradient-text-mixed">API Request Logs</span>
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">ประวัติการเรียก API ทั้งหมด</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => exportCsv(filtered)}
            className="btn-glass px-3 py-1.5 rounded-lg text-[11px] font-medium inline-flex items-center gap-1.5 cursor-pointer"
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
            onClick={refreshLogs}
            className="btn-glass px-3 py-1.5 rounded-lg text-[11px] font-medium inline-flex items-center gap-1.5 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass p-3 mb-4 shrink-0">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                className="input-glass pl-8 text-xs py-1.5"
                placeholder="เบอร์โทร, Message ID, IP, endpoint..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <CustomSelect value={endpointFilter} onChange={(v) => { setEndpointFilter(v); setPage(1); }} options={ENDPOINT_OPTIONS} className="min-w-[140px]" />
            <CustomSelect
              value={methodFilter}
              onChange={(v) => { setMethodFilter(v); setPage(1); }}
              options={[
                { value: "all", label: "Method" },
                { value: "GET", label: "GET" },
                { value: "POST", label: "POST" },
                { value: "PUT", label: "PUT" },
                { value: "DELETE", label: "DELETE" },
              ]}
              className="min-w-[100px]"
            />
            <CustomSelect
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
              options={[
                { value: "all", label: "Status" },
                { value: "2xx", label: "2xx" },
                { value: "4xx", label: "4xx" },
                { value: "5xx", label: "5xx" },
              ]}
              className="min-w-[90px]"
            />
            <CustomSelect
              value={sourceFilter}
              onChange={(v) => { setSourceFilter(v); setPage(1); }}
              options={[
                { value: "all", label: "Source" },
                { value: "WEB", label: "WEB" },
                { value: "API", label: "API" },
              ]}
              className="min-w-[90px]"
            />
            <CustomSelect value={apiKeyFilter} onChange={(v) => { setApiKeyFilter(v); setPage(1); }} options={API_KEY_OPTIONS} className="min-w-[170px]" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <rect x="2" y="2" width="20" height="20" rx="4" /><path d="M8 12h8M12 8v8" />
              </svg>
              <input
                type="text"
                className="input-glass pl-8 text-xs py-1.5"
                placeholder="IP Address..."
                value={ipSearch}
                onChange={(e) => { setIpSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">จาก</label>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="input-glass text-xs py-1 px-2 w-[130px]" />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">ถึง</label>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="input-glass text-xs py-1 px-2 w-[130px]" />
            </div>
            {hasFilters && (
              <button onClick={clearFilters} className="text-[10px] text-[var(--text-muted)] hover:text-[#00FFA7] transition-colors cursor-pointer">ล้าง</button>
            )}
            <span className="text-[10px] text-[var(--text-muted)] ml-auto">{filtered.length} รายการ</span>
          </div>
        </div>
      </div>

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
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            {replayResult.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Split Pane: Left=List, Right=Detail */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Pane — Request List */}
        <div className={`glass flex flex-col overflow-hidden transition-all duration-300 ${selectedLog ? "w-[45%]" : "w-full"}`}>
          {/* List header */}
          <div className="hidden md:grid grid-cols-[1fr_60px_60px_60px] gap-x-2 px-4 py-2 border-b border-[var(--border-subtle)] text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider shrink-0">
            <span>Request</span>
            <span className="text-center">Status</span>
            <span className="text-right">Time</span>
            <span className="text-center">Src</span>
          </div>

          {/* Scrollable rows */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {paginated.length > 0 ? (
                <motion.div key="rows" variants={stagger} initial="hidden" animate="show">
                  {paginated.map((log) => {
                    const isSelected = selectedLog?.id === log.id;
                    return (
                      <motion.button
                        key={log.id}
                        variants={rowVariant}
                        onClick={() => { setSelectedLog(log); setReplayResult(null); }}
                        className={`w-full grid grid-cols-1 md:grid-cols-[1fr_60px_60px_60px] gap-x-2 px-4 py-2.5 items-center text-left border-b border-[var(--border-subtle)] hover:bg-white/[0.03] transition-colors cursor-pointer ${
                          isSelected ? "bg-[rgba(0,255,167,0.06)] border-l-2 border-l-[#00FFA7]" : ""
                        }`}
                      >
                        {/* Method + URL + timestamp */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${METHOD_BADGE[log.method]}`}>
                              {log.method}
                            </span>
                            <span className="text-xs text-white font-mono truncate">{log.url}</span>
                          </div>
                          <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{formatTimestamp(log.timestamp)}</p>
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
                    <button onClick={clearFilters} className="text-[10px] text-[#00FFA7] hover:text-[#4779FF] cursor-pointer">ล้างตัวกรอง</button>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="border-t border-[var(--border-subtle)] px-4 py-2 flex items-center justify-between text-[10px] text-[var(--text-muted)] shrink-0">
              <span>{showingFrom}–{showingTo} / {filtered.length}</span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--bg-surface)] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
                  </button>
                  <span className="px-1">{page}/{totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--bg-surface)] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
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
              className="glass relative flex flex-col overflow-hidden w-[55%]"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "55%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {/* Close button — fixed top-right of the pane */}
              <button
                onClick={() => setSelectedLog(null)}
                className="absolute top-3 right-3 z-20 w-7 h-7 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:bg-white/10 flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
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
          <div className="hidden lg:flex glass w-[55%] items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--text-muted)]">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <p className="text-xs text-[var(--text-muted)]">เลือก request จากรายการด้านซ้าย</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
