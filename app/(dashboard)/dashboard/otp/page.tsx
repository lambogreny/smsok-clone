"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { generateOtpForSession, verifyOtpForSession } from "@/lib/actions/otp";
import { blockNonNumeric } from "@/lib/form-utils";
import { safeErrorMessage } from "@/lib/error-messages";
import { toCsvCell } from "@/lib/csv";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CustomSelect from "@/components/ui/CustomSelect";

import {
  Lock,
  Send,
  CheckCircle2,
  Clock,
  Timer,
  BookOpen,
  Loader2,
  Copy,
  Check,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/* ══════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════ */

interface OtpChartPoint {
  day: string;
  sent: number;
  verified: number;
  expired: number;
}

interface OtpRecentItem {
  id: number;
  phone: string;
  ref: string;
  status: string;
  time: string;
}

interface OtpHistoryItem {
  id: number;
  phone: string;
  ref: string;
  otp: string;
  status: string;
  verifyTime: string;
  time: string;
}

interface OtpStats {
  sentToday: number;
  verifiedToday: number;
  expiredToday: number;
  avgVerifyTime: number;
  sentDelta: string;
  verifyRate: string;
  expireRate: string;
  timeDelta: string;
}

interface OtpStatsResponse {
  stats: OtpStats;
  chart: OtpChartPoint[];
  recentOtps: OtpRecentItem[];
  history: OtpHistoryItem[];
}

/* ══════════════════════════════════════════════════
   FALLBACK DEFAULTS
   ══════════════════════════════════════════════════ */

const DEFAULT_STATS: OtpStats = {
  sentToday: 0,
  verifiedToday: 0,
  expiredToday: 0,
  avgVerifyTime: 0,
  sentDelta: "0%",
  verifyRate: "0%",
  expireRate: "0%",
  timeDelta: "—",
};

/* ══════════════════════════════════════════════════
   NORMALIZE API RESPONSE (flat or nested)
   ══════════════════════════════════════════════════ */

function normalizeResponse(data: Record<string, unknown>): OtpStatsResponse {
  /* Handle nested: { data: { stats, chart, ... } } */
  const root = (data.data && typeof data.data === "object" ? data.data : data) as Record<string, unknown>;

  const stats: OtpStats = {
    sentToday: Number((root.stats as Record<string, unknown>)?.sentToday ?? root.sentToday ?? 0),
    verifiedToday: Number((root.stats as Record<string, unknown>)?.verifiedToday ?? root.verifiedToday ?? 0),
    expiredToday: Number((root.stats as Record<string, unknown>)?.expiredToday ?? root.expiredToday ?? 0),
    avgVerifyTime: Number((root.stats as Record<string, unknown>)?.avgVerifyTime ?? root.avgVerifyTime ?? 0),
    sentDelta: String((root.stats as Record<string, unknown>)?.sentDelta ?? root.sentDelta ?? "0%"),
    verifyRate: String((root.stats as Record<string, unknown>)?.verifyRate ?? root.verifyRate ?? "0%"),
    expireRate: String((root.stats as Record<string, unknown>)?.expireRate ?? root.expireRate ?? "0%"),
    timeDelta: String((root.stats as Record<string, unknown>)?.timeDelta ?? root.timeDelta ?? "—"),
  };

  const chart = (Array.isArray(root.chart) ? root.chart : []) as OtpChartPoint[];
  const recentOtps = (Array.isArray(root.recentOtps) ? root.recentOtps : Array.isArray(root.recent) ? root.recent : []) as OtpRecentItem[];
  const history = (Array.isArray(root.history) ? root.history : []) as OtpHistoryItem[];

  return { stats, chart, recentOtps, history };
}

/* ══════════════════════════════════════════════════
   STATUS BADGE
   ══════════════════════════════════════════════════ */

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  verified: { label: "ยืนยันแล้ว", color: "var(--success)", bg: "var(--success-bg)" },
  pending: { label: "รอยืนยัน", color: "var(--info)", bg: "var(--info-bg)" },
  expired: { label: "หมดอายุ", color: "var(--warning)", bg: "var(--warning-bg)" },
  wrong_otp: { label: "รหัสผิด", color: "var(--error)", bg: "var(--danger-bg)" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.pending;
  return (
    <Badge
      className="rounded-full text-[11px] font-medium border-0"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      {s.label}
    </Badge>
  );
}

/* ══════════════════════════════════════════════════
   CUSTOM TOOLTIP FOR CHART
   ══════════════════════════════════════════════════ */

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs border border-[var(--border-default)]"
      style={{ backgroundColor: "var(--table-header)" }}
    >
      <p className="text-[var(--text-muted)] mb-1 font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-[var(--text-muted)]">{p.name}:</span>
          <span className="text-[var(--text-primary)] font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   QUICK TEST PANEL
   ══════════════════════════════════════════════════ */

function QuickTestPanel() {
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [refCode, setRefCode] = useState("");
  const [verifyInput, setVerifyInput] = useState("");
  const [step, setStep] = useState<"idle" | "sent" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [smsRemaining, setSmsRemaining] = useState<number | null>(null);

  // Fetch SMS quota — graceful fallback chain
  useEffect(() => {
    async function fetchBalance() {
      try {
        const res = await fetch("/api/v1/credits/balance");
        if (res.ok) {
          const data = await res.json();
          const remaining = data.smsRemaining ?? data.remaining ?? data.balance;
          if (typeof remaining === "number") { setSmsRemaining(remaining); return; }
        }
      } catch { /* endpoint may not exist yet */ }
    }
    fetchBalance();
  }, []);

  const hasNoCredits = smsRemaining !== null && smsRemaining <= 0;
  const isPhoneValid = /^0[689]\d{8}$/.test(phone);

  function handlePhoneChange(value: string) {
    // Auto-convert +66 prefix to 0
    let cleaned = value.replace(/\D/g, "");
    if (value.startsWith("+66")) {
      cleaned = "0" + value.slice(3).replace(/\D/g, "");
    } else if (cleaned.startsWith("66") && cleaned.length > 2) {
      cleaned = "0" + cleaned.slice(2);
    }
    if (cleaned.length > 10) cleaned = cleaned.slice(0, 10);
    setPhone(cleaned);
    if (cleaned.length === 10 && !/^0[689]\d{8}$/.test(cleaned)) {
      setPhoneError("เบอร์ไม่ถูกต้อง (ต้องขึ้นต้น 06/08/09)");
    } else {
      setPhoneError(null);
    }
  }

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => Math.max(c - 1, 0)), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const copyText = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  }, []);

  const handleSend = async () => {
    if (!phone || countdown > 0) return;
    setLoading(true);
    setFeedback(null);
    startTransition(async () => {
      try {
        const data = await generateOtpForSession({ phone, purpose: "verify" });

        // Check for structured insufficient credits error (returned, not thrown)
        if (data && typeof data === "object" && "error" in data && (data as { error: string }).error === "INSUFFICIENT_CREDITS") {
          const err = data as { creditsRemaining: number; creditsRequired: number };
          const detail = `SMS ไม่พอ — เหลือ ${err.creditsRemaining} ต้องการ ${err.creditsRequired}`;
          setFeedback({ ok: false, msg: detail });
          setSmsRemaining(err.creditsRemaining);
          return;
        }

        const otpData = data as { ref?: string; debugCode?: string };
        setRefCode(otpData.ref || "");
        setOtpCode(otpData.debugCode || "");
        setStep("sent");
        setCountdown(30);
      } catch (error) {
        setFeedback({ ok: false, msg: safeErrorMessage(error) });
      } finally {
        setLoading(false);
      }
    });
  };

  const handleVerify = async () => {
    if (!verifyInput) return;
    setVerifyLoading(true);
    setFeedback(null);
    startTransition(async () => {
      try {
        const data = await verifyOtpForSession({ ref: refCode, code: verifyInput });
        if (data.verified) {
          setStep("success");
          setFeedback({ ok: true, msg: "OTP ถูกต้อง! ยืนยันสำเร็จ" });
        } else {
          setStep("error");
          setFeedback({ ok: false, msg: "OTP ไม่ถูกต้อง กรุณาลองใหม่" });
        }
      } catch (error) {
        setStep("error");
        setFeedback({ ok: false, msg: safeErrorMessage(error) });
      } finally {
        setVerifyLoading(false);
      }
    });
  };

  const handleReset = () => {
    setStep("idle");
    setPhone("");
    setPhoneError(null);
    setOtpCode("");
    setRefCode("");
    setVerifyInput("");
    setCountdown(0);
    setFeedback(null);
  };

  const secs = countdown % 60;
  const mins = Math.floor(countdown / 60);

  return (
    <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">ทดสอบ OTP</h3>

        {/* No SMS Quota State */}
        {hasNoCredits && (
          <div
            className="rounded-lg p-5 text-center mb-3"
            style={{
              background: "rgba(var(--error-rgb), 0.04)",
              border: "1px solid rgba(var(--error-rgb), 0.15)",
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{
                background: "rgba(var(--error-rgb), 0.1)",
                border: "1px solid rgba(var(--error-rgb), 0.2)",
              }}
            >
              <AlertTriangle size={18} style={{ color: "var(--error)" }} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--error)" }}>
              โควต้าข้อความหมด
            </p>
            <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
              ไม่สามารถส่ง OTP ได้ กรุณาซื้อแพ็กเกจเพิ่ม
            </p>
            <Link
              href="/dashboard/billing/packages"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90"
              style={{ background: "var(--accent)", color: "var(--bg-base)" }}
            >
              ซื้อแพ็กเกจ →
            </Link>
          </div>
        )}

        {/* Phone input + send */}
        <div className="space-y-3">
          <div>
            <Input
              type="tel"
              inputMode="numeric"
              maxLength={13}
              onKeyDown={blockNonNumeric}
              placeholder="0891234567"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              disabled={step === "sent"}
              className={`h-9 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] rounded-lg ${phoneError ? "border-[var(--error)]" : ""}`}
            />
            {phoneError && (
              <p className="text-[11px] mt-1" style={{ color: "var(--error)" }}>{phoneError}</p>
            )}
          </div>
          <Button
            onClick={handleSend}
            disabled={loading || isPending || !isPhoneValid || countdown > 0 || hasNoCredits}
            className="h-9 w-full bg-[var(--accent)] hover:opacity-90 text-[var(--bg-base)] rounded-lg font-semibold text-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : countdown > 0 ? (
              `รอ ${mins}:${String(secs).padStart(2, "0")}`
            ) : (
              <>
                <Send className="w-3.5 h-3.5 mr-1.5" />
                ส่ง OTP ทดสอบ
              </>
            )}
          </Button>
        </div>

        {/* OTP + Ref display */}
        {step !== "idle" && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)] px-3 py-2">
              <div>
                <span className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider">OTP</span>
                <p className="text-lg font-semibold text-[var(--text-primary)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {otpCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyText(otpCode, "otp")}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                {copiedField === "otp" ? (
                  <Check className="w-3.5 h-3.5 text-[var(--success)]" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)] px-3 py-2">
              <div>
                <span className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider">Ref</span>
                <p className="text-sm text-[var(--text-primary)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {refCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyText(refCode, "ref")}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                {copiedField === "ref" ? (
                  <Check className="w-3.5 h-3.5 text-[var(--success)]" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                )}
              </button>
            </div>

            {countdown > 0 && (
              <p className="text-xs text-[var(--text-muted)] text-center">
                หมดอายุใน {mins}:{String(secs).padStart(2, "0")}
              </p>
            )}

            {/* Verify section */}
            <div className="pt-2 space-y-2">
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="กรอก OTP"
                value={verifyInput}
                onChange={(e) => setVerifyInput(e.target.value.replace(/\D/g, ""))}
                className="h-9 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] rounded-lg text-center tracking-[0.3em]"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              />
              <Button
                onClick={handleVerify}
                disabled={verifyLoading || isPending || verifyInput.length < 4}
                className="h-9 w-full bg-[var(--success)] hover:opacity-90 text-[var(--text-primary)] rounded-lg font-semibold text-sm"
              >
                {verifyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "ยืนยัน OTP"}
              </Button>
            </div>

            {/* Feedback */}
            {feedback && (
              <div
                className={`mt-2 px-3 py-2 rounded-lg text-xs font-medium border ${
                  feedback.ok
                    ? "bg-[var(--success-bg)] border-[var(--success-bg)] text-[var(--success)]"
                    : "bg-[var(--danger-bg)] border-[var(--danger-bg)] text-[var(--error)]"
                }`}
              >
                {feedback.msg}
              </div>
            )}

            {(step === "success" || step === "error") && (
              <Button
                variant="outline"
                onClick={handleReset}
                className="h-9 w-full mt-1 border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg text-sm"
              >
                ทดสอบใหม่
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ══════════════════════════════════════════════════
   TAB: ภาพรวม (Overview)
   ══════════════════════════════════════════════════ */

function OverviewTab({
  onViewAll,
  stats,
  chartData,
  recentOtps,
}: {
  onViewAll: () => void;
  stats: OtpStats;
  chartData: OtpChartPoint[];
  recentOtps: OtpRecentItem[];
}) {

  const statCards = [
    {
      label: "OTP ส่งวันนี้",
      value: stats.sentToday,
      delta: `↑ ${stats.sentDelta.replace("+", "")}`,
      icon: Send,
      color: "var(--accent)",
      bg: "rgba(var(--accent-rgb),0.08)",
    },
    {
      label: "ยืนยันแล้ว",
      value: stats.verifiedToday,
      delta: stats.verifyRate,
      icon: CheckCircle2,
      color: "var(--success)",
      bg: "var(--success-bg)",
    },
    {
      label: "หมดอายุ",
      value: stats.expiredToday,
      delta: stats.expireRate,
      icon: Clock,
      color: "var(--warning)",
      bg: "var(--warning-bg)",
    },
    {
      label: "เวลาเฉลี่ยยืนยัน",
      value: stats.avgVerifyTime > 0 ? `${stats.avgVerifyTime} วิ` : "—",
      delta: stats.timeDelta,
      icon: Timer,
      color: "var(--info)",
      bg: "var(--info-bg)",
    },
  ];

  return (
    <div className="space-y-4 p-4">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card
              key={s.label}
              className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: s.bg }}
                  >
                    <Icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)]">{s.label}</span>
                </div>
                <p className="text-xl font-semibold text-[var(--text-primary)]">{s.value}</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{s.delta}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart + Quick Test */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-3">
        {/* Chart */}
        <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
              OTP 7 วันล่าสุด
            </h3>
            <div style={{ width: "100%", height: 200 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} barGap={2}>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                    width={30}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="sent" name="ส่ง" fill="var(--accent)" radius={[3, 3, 0, 0]} stackId="a" />
                  <Bar dataKey="expired" name="หมดอายุ" fill="var(--warning)" radius={[3, 3, 0, 0]} stackId="b" />
                  <Legend
                    formatter={(value: string) => (
                      <span className="text-[11px] text-[var(--text-muted)]">{value}</span>
                    )}
                    iconType="circle"
                    iconSize={8}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Test */}
        <QuickTestPanel />
      </div>

      {/* Recent OTPs Table */}
      <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-5 py-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">OTP ล่าสุด</h3>
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs text-[var(--accent)] hover:underline"
            >
              ดูทั้งหมด →
            </button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-[var(--table-header)] border-b border-[var(--border-default)] hover:bg-transparent">
                <TableHead className="text-[12px] uppercase text-[var(--text-secondary)] font-semibold tracking-[0.05em]">
                  เบอร์โทร
                </TableHead>
                <TableHead className="text-[12px] uppercase text-[var(--text-secondary)] font-semibold tracking-[0.05em]">
                  Ref
                </TableHead>
                <TableHead className="text-[12px] uppercase text-[var(--text-secondary)] font-semibold tracking-[0.05em]">
                  สถานะ
                </TableHead>
                <TableHead className="text-[12px] uppercase text-[var(--text-secondary)] font-semibold tracking-[0.05em] text-right">
                  เวลา
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOtps.map((row) => (
                <TableRow
                  key={row.id}
                  className={`border-b border-[var(--border-default)] hover:bg-[var(--bg-elevated)] ${row.id % 2 === 0 ? "bg-[var(--table-alt-row)]" : ""}`}
                >
                  <TableCell
                    className="text-xs text-[var(--text-primary)]"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {row.phone}
                  </TableCell>
                  <TableCell
                    className="text-xs text-[var(--text-muted)]"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {row.ref}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="text-xs text-[var(--text-muted)] text-right">
                    {row.time}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   TAB: ประวัติ (History)
   ══════════════════════════════════════════════════ */

function HistoryTab({ historyData }: { historyData: OtpHistoryItem[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  const statusOptions = [
    { value: "all", label: "ทั้งหมด" },
    { value: "verified", label: "ยืนยันแล้ว" },
    { value: "pending", label: "รอยืนยัน" },
    { value: "expired", label: "หมดอายุ" },
    { value: "wrong_otp", label: "รหัสผิด" },
  ];

  const filtered = historyData.filter((row) => {
    const matchStatus = statusFilter === "all" || row.status === statusFilter;
    const matchSearch =
      !searchQuery ||
      row.phone.includes(searchQuery) ||
      row.ref.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const handleExport = (format: "csv" | "json") => {
    const data = format === "json" ? JSON.stringify(filtered, null, 2) : [
      ["phone","ref","otp","status","verifyTime","time"].map(toCsvCell).join(","),
      ...filtered.map((r) => [r.phone, r.ref, r.otp, r.status, r.verifyTime, r.time].map(toCsvCell).join(",")),
    ].join("\n");
    const blob = new Blob([data], { type: format === "json" ? "application/json" : "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `otp-history.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 p-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative" style={{ width: 260 }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
          <Input
            placeholder="ค้นหาเบอร์โทร, Ref..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 pl-9 bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] rounded-lg text-sm"
          />
        </div>
        <div style={{ width: 160 }}>
          <CustomSelect
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setCurrentPage(1);
            }}
            options={statusOptions}
            placeholder="สถานะ"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport("csv")}
            className="h-9 border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport("json")}
            className="h-9 border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> JSON
          </Button>
        </div>
      </div>

      {/* History Table */}
      <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--table-header)] border-b border-[var(--border-default)] hover:bg-transparent">
              <TableHead className="text-[12px] uppercase text-[var(--text-secondary)] font-semibold tracking-[0.05em]">เบอร์โทร</TableHead>
              <TableHead className="text-[12px] uppercase text-[var(--text-secondary)] font-semibold tracking-[0.05em]">Ref</TableHead>
              <TableHead className="text-[12px] uppercase text-[var(--text-secondary)] font-semibold tracking-[0.05em]">OTP</TableHead>
              <TableHead className="text-[12px] uppercase text-[var(--text-secondary)] font-semibold tracking-[0.05em]">สถานะ</TableHead>
              <TableHead className="text-[12px] uppercase text-[var(--text-secondary)] font-semibold tracking-[0.05em]">เวลายืนยัน</TableHead>
              <TableHead className="text-[12px] uppercase text-[var(--text-secondary)] font-semibold tracking-[0.05em] text-right">เวลา</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((row) => (
              <TableRow
                key={row.id}
                className={`border-b border-[var(--border-default)] hover:bg-[var(--bg-elevated)] ${row.id % 2 === 0 ? "bg-[var(--table-alt-row)]" : ""}`}
              >
                <TableCell
                  className="text-xs text-[var(--text-primary)]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {row.phone}
                </TableCell>
                <TableCell
                  className="text-xs text-[var(--text-muted)]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {row.ref}
                </TableCell>
                <TableCell
                  className="text-xs text-[var(--text-muted)]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {row.otp}
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell className="text-xs text-[var(--text-muted)]">{row.verifyTime}</TableCell>
                <TableCell className="text-xs text-[var(--text-muted)] text-right">{row.time}</TableCell>
              </TableRow>
            ))}
            {paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-xs text-[var(--text-muted)] py-8">
                  ไม่พบข้อมูล
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-default)]">
            <p className="text-xs text-[var(--text-muted)]">
              แสดง {(currentPage - 1) * perPage + 1}-{Math.min(currentPage * perPage, filtered.length)} จาก {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 w-7 p-0 border-[var(--border-default)] text-[var(--text-muted)] rounded-lg"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  onClick={() => setCurrentPage(page)}
                  className={`h-7 w-7 p-0 rounded-lg text-xs ${
                    page === currentPage
                      ? "bg-[var(--accent)] text-[var(--bg-base)]"
                      : "border-[var(--border-default)] text-[var(--text-muted)]"
                  }`}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-7 w-7 p-0 border-[var(--border-default)] text-[var(--text-muted)] rounded-lg"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   TAB: ตั้งค่า (Settings)
   ══════════════════════════════════════════════════ */

function SettingsTab() {
  const [otpLength, setOtpLength] = useState("6");
  const [expiry, setExpiry] = useState("300");
  const [rateLimit, setRateLimit] = useState("5");
  const [template, setTemplate] = useState(
    "รหัส OTP ของคุณคือ {{otp}} (Ref: {{ref}}) หมดอายุใน {{expiry_minutes}} นาที"
  );
  const [blockDuplicate, setBlockDuplicate] = useState(true);
  const [alertRateLimit, setAlertRateLimit] = useState(true);
  const [forceVerify, setForceVerify] = useState(false);
  const [saving, setSaving] = useState(false);
  const templateRef = useRef<HTMLTextAreaElement>(null);

  const otpLengthOptions = [
    { value: "4", label: "4 หลัก" },
    { value: "6", label: "6 หลัก" },
    { value: "8", label: "8 หลัก" },
  ];

  const expiryMinutes = Math.floor(Number(expiry) / 60);

  const variables = [
    { key: "{{otp}}", label: "OTP" },
    { key: "{{ref}}", label: "Ref" },
    { key: "{{expiry_minutes}}", label: "นาที" },
    { key: "{{phone}}", label: "เบอร์โทร" },
  ];

  const insertVariable = (varKey: string) => {
    if (!templateRef.current) return;
    const el = templateRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newVal = template.slice(0, start) + varKey + template.slice(end);
    setTemplate(newVal);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + varKey.length, start + varKey.length);
    }, 0);
  };

  const previewText = template
    .replace("{{otp}}", "482916")
    .replace("{{ref}}", "AB1234")
    .replace("{{expiry_minutes}}", String(expiryMinutes))
    .replace("{{phone}}", "089xxx5678");

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1000);
  };

  return (
    <div className="space-y-4 p-4">
      {/* General Settings */}
      <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
        <CardContent className="p-5 space-y-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">ตั้งค่าทั่วไป</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* OTP Length */}
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1.5">ความยาว OTP</label>
              <CustomSelect
                value={otpLength}
                onChange={setOtpLength}
                options={otpLengthOptions}
                placeholder="เลือก..."
              />
            </div>

            {/* Expiry */}
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1.5">
                อายุ OTP (วินาที)
              </label>
              <Input
                type="number"
                min={60}
                max={600}
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="h-9 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] rounded-lg"
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">= {expiryMinutes} นาที</p>
            </div>

            {/* Rate Limit */}
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1.5">Rate Limit</label>
              <div className="relative">
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={rateLimit}
                  onChange={(e) => setRateLimit(e.target.value)}
                  className="h-9 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] rounded-lg pr-24"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[var(--text-muted)] pointer-events-none">
                  ครั้งต่อชั่วโมง
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message Template */}
      <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">ข้อความ SMS</h3>

          <Textarea
            ref={templateRef}
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={3}
            className="bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] rounded-lg text-sm resize-none"
          />

          {/* Variable chips */}
          <div className="flex flex-wrap gap-2">
            {variables.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => insertVariable(v.key)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--bg-base)] border border-[var(--border-default)] text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
              >
                <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{v.key}</span>
                <span className="text-[var(--text-muted)]">{v.label}</span>
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)] p-4">
            <p className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider mb-2 font-medium">
              ตัวอย่างข้อความ
            </p>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">{previewText}</p>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">ความปลอดภัย</h3>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={blockDuplicate}
                onCheckedChange={(v) => setBlockDuplicate(!!v)}
              />
              <div>
                <p className="text-sm text-[var(--text-primary)]">บล็อก OTP ซ้ำ</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  ป้องกันการส่ง OTP ซ้ำไปยังเบอร์เดิมก่อนหมดอายุ
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={alertRateLimit}
                onCheckedChange={(v) => setAlertRateLimit(!!v)}
              />
              <div>
                <p className="text-sm text-[var(--text-primary)]">แจ้งเตือนเมื่อ rate limit เกิน</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  ส่ง notification เมื่อมีการเรียกใช้เกินจำนวนที่กำหนด
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={forceVerify}
                onCheckedChange={(v) => setForceVerify(!!v)}
              />
              <div>
                <p className="text-sm text-[var(--text-primary)]">บังคับ verify ก่อนส่งใหม่</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  ต้อง verify OTP ก่อนจึงจะส่งรหัสใหม่ได้
                </p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Footer buttons */}
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          className="h-9 border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg"
        >
          ยกเลิก
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-9 bg-[var(--accent)] hover:opacity-90 text-[var(--bg-base)] rounded-lg font-semibold"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
          บันทึกการตั้งค่า
        </Button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════ */

export default function OtpPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OtpStats>(DEFAULT_STATS);
  const [chartData, setChartData] = useState<OtpChartPoint[]>([]);
  const [recentOtps, setRecentOtps] = useState<OtpRecentItem[]>([]);
  const [historyData, setHistoryData] = useState<OtpHistoryItem[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/otp/stats");
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const json = await res.json();
      const normalized = normalizeResponse(json);
      setStats(normalized.stats);
      setChartData(normalized.chart);
      setRecentOtps(normalized.recentOtps);
      setHistoryData(normalized.history);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูล OTP ได้";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-20 md:pb-8 max-w-6xl space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5" style={{ color: "var(--accent)" }} />
          <div>
            <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">บริการ OTP</h1>
            <p className="text-[13px] text-[var(--text-muted)]">
              จัดการ OTP สำหรับระบบยืนยันตัวตน
            </p>
          </div>
        </div>
        <Link href="/dashboard/docs">
          <Button
            variant="outline"
            className="h-9 border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg text-sm gap-1.5"
          >
            <BookOpen className="w-4 h-4" /> API Docs →
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div>
        <div className="border-b border-[var(--border-default)]">
          <div className="flex gap-6">
            {[
              { value: "overview", label: "ภาพรวม" },
              { value: "history", label: "ประวัติ" },
              { value: "settings", label: "ตั้งค่า" },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.value
                    ? "text-[var(--text-primary)] border-[var(--accent)]"
                    : "text-[var(--text-muted)] border-transparent hover:text-[var(--text-primary)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <OverviewTab
            onViewAll={() => setActiveTab("history")}
            stats={stats}
            chartData={chartData}
            recentOtps={recentOtps}
          />
        )}
        {activeTab === "history" && <HistoryTab historyData={historyData} />}
        {activeTab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
}
