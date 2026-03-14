"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  FileText,
  Download,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import PageLayout, { PageHeader } from "@/components/blocks/PageLayout";
import PillTabs from "@/components/ui/PillTabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ────────── types ────────── */

interface ConsentLog {
  id: string;
  userId: string;
  userName: string;
  email: string;
  action: "granted" | "revoked" | "updated";
  consentType: string;
  policyVersion: string;
  ip: string;
  createdAt: string;
}

interface DataRequest {
  id: string;
  userId: string;
  userName: string;
  email: string;
  type: "export" | "delete";
  status: "pending" | "processing" | "completed" | "rejected";
  createdAt: string;
  completedAt?: string;
}

interface PdpaStats {
  totalConsents: number;
  activeConsents: number;
  pendingRequests: number;
  completedRequests: number;
  currentPolicyVersion: string;
}

/* ────────── helpers ────────── */

function ActionBadge({ action }: { action: ConsentLog["action"] }) {
  const map = {
    granted: { label: "ยินยอม", cls: "bg-[rgba(var(--success-rgb,34,197,94),0.1)] text-[var(--success)]" },
    revoked: { label: "ถอนยินยอม", cls: "bg-[rgba(var(--error-rgb,239,68,68),0.1)] text-[var(--error)]" },
    updated: { label: "อัปเดต", cls: "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)]" },
  };
  const m = map[action];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${m.cls}`}>{m.label}</span>;
}

function RequestStatusBadge({ status }: { status: DataRequest["status"] }) {
  const map = {
    pending: { label: "รอดำเนินการ", icon: Clock, cls: "bg-[rgba(var(--warning-rgb,245,158,11),0.1)] text-[var(--warning)]" },
    processing: { label: "กำลังดำเนินการ", icon: Loader2, cls: "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)]" },
    completed: { label: "เสร็จสิ้น", icon: CheckCircle, cls: "bg-[rgba(var(--success-rgb,34,197,94),0.1)] text-[var(--success)]" },
    rejected: { label: "ปฏิเสธ", icon: XCircle, cls: "bg-[rgba(var(--error-rgb,239,68,68),0.1)] text-[var(--error)]" },
  };
  const m = map[status];
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${m.cls}`}>
      <Icon className={`w-3 h-3 ${status === "processing" ? "animate-spin" : ""}`} />
      {m.label}
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/* ────────── page ────────── */

export default function AdminPdpaPage() {
  const [stats, setStats] = useState<PdpaStats>({ totalConsents: 0, activeConsents: 0, pendingRequests: 0, completedRequests: 0, currentPolicyVersion: "-" });
  const [consentLogs, setConsentLogs] = useState<ConsentLog[]>([]);
  const [dataRequests, setDataRequests] = useState<DataRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("consents");
  const [search, setSearch] = useState("");
  const [requestFilter, setRequestFilter] = useState("ALL");
  const [consentPage, setConsentPage] = useState(1);
  const [requestPage, setRequestPage] = useState(1);
  const [consentTotalPages, setConsentTotalPages] = useState(1);
  const [requestTotalPages, setRequestTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, consentsRes, requestsRes] = await Promise.all([
        fetch("/api/admin/pdpa/stats", { credentials: "include" }),
        fetch(`/api/admin/pdpa/consents?page=${consentPage}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}`, { credentials: "include" }),
        fetch(`/api/admin/pdpa/requests?page=${requestPage}&limit=20${requestFilter !== "ALL" ? `&status=${requestFilter}` : ""}`, { credentials: "include" }),
      ]);

      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s);
      }
      if (consentsRes.ok) {
        const c = await consentsRes.json();
        setConsentLogs(c.items ?? []);
        setConsentTotalPages(c.totalPages ?? 1);
      }
      if (requestsRes.ok) {
        const r = await requestsRes.json();
        setDataRequests(r.items ?? []);
        setRequestTotalPages(r.totalPages ?? 1);
      }
    } catch {
      /* API not ready */
    } finally {
      setLoading(false);
    }
  }, [consentPage, requestPage, search, requestFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const STAT_CARDS = [
    { label: "Consent ทั้งหมด", value: stats.totalConsents, icon: Users, color: "var(--accent)" },
    { label: "Active Consent", value: stats.activeConsents, icon: CheckCircle, color: "var(--success)" },
    { label: "คำขอรอดำเนินการ", value: stats.pendingRequests, icon: Clock, color: "var(--warning)" },
    { label: "คำขอเสร็จสิ้น", value: stats.completedRequests, icon: FileText, color: "var(--success)" },
  ];

  const TABS = [
    { value: "consents", label: "Consent Logs" },
    { value: "requests", label: "Data Requests" },
    { value: "policy", label: "Policy Versions" },
  ];

  const REQUEST_TABS = [
    { value: "ALL", label: "ทั้งหมด" },
    { value: "pending", label: "รอดำเนินการ" },
    { value: "processing", label: "กำลังดำเนินการ" },
    { value: "completed", label: "เสร็จสิ้น" },
  ];

  return (
    <PageLayout>
      <PageHeader title="PDPA Management" description="จัดการ consent, คำขอข้อมูล, นโยบายความเป็นส่วนตัว" />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {STAT_CARDS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--text-muted)]">{s.label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${s.color} 12%, transparent)` }}>
                  <Icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{s.value.toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      {/* Current Policy Version */}
      <div className="flex items-center gap-2 mb-6 px-4 py-3 rounded-lg bg-[rgba(var(--accent-rgb),0.06)] border border-[rgba(var(--accent-rgb),0.12)]">
        <Shield className="w-4 h-4 text-[var(--accent)]" />
        <span className="text-sm text-[var(--text-secondary)]">นโยบายปัจจุบัน:</span>
        <span className="text-sm font-semibold text-[var(--accent)]">v{stats.currentPolicyVersion}</span>
      </div>

      {/* Tab Navigation */}
      <PillTabs
        options={TABS}
        value={tab}
        onChange={setTab}
      />

      <div className="mt-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
          </div>
        ) : tab === "consents" ? (
          <>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="search"
                placeholder="ค้นหาชื่อ, อีเมล..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setConsentPage(1); }}
                className="w-full max-w-sm pl-10 pr-4 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[rgba(var(--accent-rgb),0.4)] focus:outline-none"
              />
            </div>

            {consentLogs.length === 0 ? (
              <div className="text-center py-16">
                <Shield className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
                <p className="text-sm text-[var(--text-secondary)]">ยังไม่มี consent logs</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">เมื่อผู้ใช้ให้/ถอน consent จะแสดงที่นี่</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">ผู้ใช้</TableHead>
                        <TableHead className="text-xs">การดำเนินการ</TableHead>
                        <TableHead className="text-xs">ประเภท Consent</TableHead>
                        <TableHead className="text-xs">เวอร์ชัน</TableHead>
                        <TableHead className="text-xs">IP</TableHead>
                        <TableHead className="text-xs">วันที่</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consentLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium text-[var(--text-primary)]">{log.userName}</p>
                              <p className="text-xs text-[var(--text-muted)]">{log.email}</p>
                            </div>
                          </TableCell>
                          <TableCell><ActionBadge action={log.action} /></TableCell>
                          <TableCell className="text-xs text-[var(--text-secondary)]">{log.consentType}</TableCell>
                          <TableCell className="text-xs text-[var(--text-muted)] font-mono">v{log.policyVersion}</TableCell>
                          <TableCell className="text-xs text-[var(--text-muted)] font-mono">{log.ip}</TableCell>
                          <TableCell className="text-xs text-[var(--text-muted)]">{formatDate(log.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-default)]">
                  <p className="text-xs text-[var(--text-muted)]">หน้า {consentPage} / {consentTotalPages}</p>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setConsentPage((p) => Math.max(1, p - 1))} disabled={consentPage <= 1} className="p-2 rounded-lg border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setConsentPage((p) => Math.min(consentTotalPages, p + 1))} disabled={consentPage >= consentTotalPages} className="p-2 rounded-lg border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        ) : tab === "requests" ? (
          <>
            {/* Request Filter */}
            <div className="mb-4">
              <PillTabs options={REQUEST_TABS} value={requestFilter} onChange={(v: string) => { setRequestFilter(v); setRequestPage(1); }} />
            </div>

            {dataRequests.length === 0 ? (
              <div className="text-center py-16">
                <Download className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
                <p className="text-sm text-[var(--text-secondary)]">ยังไม่มีคำขอข้อมูล</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">คำขอ export/delete ข้อมูลจะแสดงที่นี่</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">ผู้ใช้</TableHead>
                        <TableHead className="text-xs">ประเภท</TableHead>
                        <TableHead className="text-xs">สถานะ</TableHead>
                        <TableHead className="text-xs">วันที่ขอ</TableHead>
                        <TableHead className="text-xs">วันที่เสร็จ</TableHead>
                        <TableHead className="text-xs text-right">ดำเนินการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dataRequests.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium text-[var(--text-primary)]">{req.userName}</p>
                              <p className="text-xs text-[var(--text-muted)]">{req.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${req.type === "export" ? "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)]" : "bg-[rgba(var(--error-rgb,239,68,68),0.1)] text-[var(--error)]"}`}>
                              {req.type === "export" ? <Download className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {req.type === "export" ? "ส่งออกข้อมูล" : "ลบข้อมูล"}
                            </span>
                          </TableCell>
                          <TableCell><RequestStatusBadge status={req.status} /></TableCell>
                          <TableCell className="text-xs text-[var(--text-muted)]">{formatDate(req.createdAt)}</TableCell>
                          <TableCell className="text-xs text-[var(--text-muted)]">{req.completedAt ? formatDate(req.completedAt) : "—"}</TableCell>
                          <TableCell className="text-right">
                            <button type="button" className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                              <Eye className="w-4 h-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-default)]">
                  <p className="text-xs text-[var(--text-muted)]">หน้า {requestPage} / {requestTotalPages}</p>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setRequestPage((p) => Math.max(1, p - 1))} disabled={requestPage <= 1} className="p-2 rounded-lg border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setRequestPage((p) => Math.min(requestTotalPages, p + 1))} disabled={requestPage >= requestTotalPages} className="p-2 rounded-lg border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          /* Policy Versions Tab */
          <div className="space-y-3">
            {[
              { version: "2.0", date: "14 มี.ค. 2026", changes: "เพิ่มหมวด Cookie Policy, ปรับปรุงสิทธิการลบข้อมูล", active: true },
              { version: "1.1", date: "1 ก.พ. 2026", changes: "แก้ไขเงื่อนไขการเก็บ SMS logs", active: false },
              { version: "1.0", date: "15 ม.ค. 2026", changes: "เวอร์ชันแรก — Privacy Policy + Terms of Service", active: false },
            ].map((p) => (
              <div key={p.version} className={`p-4 rounded-lg border ${p.active ? "bg-[rgba(var(--accent-rgb),0.04)] border-[rgba(var(--accent-rgb),0.15)]" : "bg-[var(--bg-surface)] border-[var(--border-default)]"}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--text-primary)]">v{p.version}</span>
                    {p.active && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[rgba(var(--success-rgb,34,197,94),0.1)] text-[var(--success)]">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">{p.date}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{p.changes}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
