"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Coins,
  Send,
  Calendar,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Gift,
  RotateCcw,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import EmptyState from "@/components/EmptyState";
import PageLayout, {
  PageHeader,
  PaginationBar,
} from "@/components/blocks/PageLayout";
import { formatThaiDateSplit, formatThaiDateOnly } from "@/lib/format-thai-date";

/* ─── Types ─── */

type CreditEventType = "topup" | "usage" | "expired" | "refund" | "bonus";

interface CreditEvent {
  id: string;
  date: string;
  description: string;
  type: CreditEventType;
  amount: number;
  balance: number;
  reference: string | null;
}

interface ActivePackage {
  id: string;
  tier: string;
  name: string;
  remaining: number;
  total: number;
  expiresAt: string;
  daysLeft: number;
  isFifo: boolean;
}

interface CreditSummary {
  remaining: number;
  total: number;
  usedThisMonth: number;
  earliestExpiry: string | null;
  earliestExpiryDays: number | null;
}

/* Mock data removed — NEVER show fake financial data */

/* ─── Helpers ─── */

function progressColor(pct: number) {
  if (pct > 50) return "var(--accent)";
  if (pct >= 20) return "var(--warning)";
  return "var(--error)";
}

const EVENT_TYPE_CONFIG: Record<CreditEventType, { icon: typeof ArrowUpRight; color: string; label: string }> = {
  topup: { icon: ArrowUpRight, color: "var(--accent)", label: "ซื้อ" },
  usage: { icon: ArrowDownRight, color: "var(--error)", label: "ใช้" },
  expired: { icon: Clock, color: "var(--text-muted)", label: "หมดอายุ" },
  refund: { icon: RotateCcw, color: "var(--info)", label: "คืน" },
  bonus: { icon: Gift, color: "var(--accent)", label: "โบนัส" },
};

const PAGE_SIZE = 20;

/* ─── Credit Balance Hero ─── */

function CreditBalanceHero({ summary }: { summary: CreditSummary }) {
  const pct = summary.total > 0 ? (summary.remaining / summary.total) * 100 : 0;
  const isNearExpiry = summary.earliestExpiryDays != null && summary.earliestExpiryDays < 30;

  return (
    <div
      className="rounded-lg p-8 max-md:p-5 mb-6"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
    >
      {/* Balance */}
      <p
        className="text-[13px] font-medium uppercase tracking-wide text-center mb-2"
        style={{ color: "var(--text-muted)", letterSpacing: "0.5px" }}
      >
        SMS คงเหลือ
      </p>
      <p
        className="text-center leading-none"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        <span
          className="text-2xl font-extrabold"
          style={{ color: "var(--text-primary)" }}
        >
          {summary.remaining.toLocaleString()}
        </span>
        <span className="text-sm ml-2" style={{ color: "var(--text-muted)" }}>
          ข้อความ
        </span>
      </p>

      {/* Progress bar */}
      <div className="max-w-md mx-auto mt-5 mb-1">
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: "var(--bg-elevated)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: progressColor(pct) }}
          />
        </div>
        <p className="text-right text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          {pct.toFixed(0)}% คงเหลือ
        </p>
      </div>

      {/* Sub-stats */}
      <div
        className="grid grid-cols-3 gap-4 mt-5 pt-5 max-sm:grid-cols-1 max-sm:gap-3"
        style={{ borderTop: "1px solid var(--border-default)" }}
      >
        <div className="text-center">
          <Package size={16} className="mx-auto mb-1.5" style={{ color: "var(--accent)" }} />
          <p className="text-xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
            {summary.total.toLocaleString()}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            โควต้าทั้งหมด
          </p>
        </div>
        <div className="text-center">
          <Send size={16} className="mx-auto mb-1.5" style={{ color: "var(--accent)" }} />
          <p className="text-xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
            {summary.usedThisMonth.toLocaleString()}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            ใช้เดือนนี้
          </p>
        </div>
        <div className="text-center">
          <Calendar size={16} className="mx-auto mb-1.5" style={{ color: isNearExpiry ? "var(--warning)" : "var(--accent)" }} />
          <p
            className="text-xl font-bold tabular-nums"
            style={{ color: isNearExpiry ? "var(--warning)" : "var(--text-primary)" }}
          >
            {summary.earliestExpiryDays ?? "—"} วัน
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {isNearExpiry ? "⚠️ หมดอายุเร็วๆ นี้" : "หมดอายุเร็วที่สุด"}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Active Packages List (FIFO) ─── */

function ActivePackagesList({ packages }: { packages: ActivePackage[] }) {
  if (packages.length === 0) return null;

  return (
    <div
      className="rounded-lg overflow-hidden mb-6"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
    >
      <p className="px-5 pt-4 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        แพ็กเกจที่ใช้งาน (FIFO)
      </p>

      {packages.map((pkg, i) => {
        const pct = pkg.total > 0 ? (pkg.remaining / pkg.total) * 100 : 0;
        const isNearExpiry = pkg.daysLeft < 30;
        const isLast = i === packages.length - 1;

        return (
          <div
            key={pkg.id}
            className="flex items-center gap-4 px-5 py-4 max-sm:flex-wrap max-sm:gap-2"
            style={{ borderBottom: isLast ? "none" : "1px solid var(--border-default)" }}
          >
            <Package size={16} style={{ color: "var(--accent)" }} className="shrink-0" />
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {pkg.name} ({pkg.tier})
            </span>
            <span className="text-[13px] tabular-nums" style={{ color: "var(--text-muted)" }}>
              {pkg.remaining.toLocaleString()} / {pkg.total.toLocaleString()} SMS
            </span>

            {/* Mini progress */}
            <div
              className="w-[100px] h-1 rounded-full overflow-hidden max-sm:w-full max-sm:order-last"
              style={{ background: "var(--bg-elevated)" }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: progressColor(pct) }}
              />
            </div>

            <span
              className="text-[13px] ml-auto max-sm:ml-0"
              style={{ color: isNearExpiry ? "var(--warning)" : "var(--text-muted)" }}
            >
              หมดอายุ {formatThaiDateOnly(pkg.expiresAt)}
            </span>

            {pkg.isFifo && (
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0"
                style={{ color: "var(--warning)", background: "rgba(var(--warning-rgb,245,158,11),0.08)" }}
              >
                ← ใช้ก่อน
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Credit History Table ─── */

function CreditHistoryTable({ events }: { events: CreditEvent[] }) {
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = events.filter((e) => {
    if (tab === "topup") return e.type === "topup" || e.type === "bonus";
    if (tab === "usage") return e.type === "usage" || e.type === "expired";
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
    >
      {/* Tabs */}
      <div className="px-5 pt-4">
        <Tabs
          value={tab}
          onValueChange={(v) => { setTab(v); setPage(1); }}
        >
          <TabsList
            className="h-9 p-0.5 rounded-lg w-fit"
            style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
          >
            <TabsTrigger
              value="all"
              className="px-4 h-8 rounded-md text-[13px] font-medium data-active:shadow-sm"
              style={{
                color: tab === "all" ? "var(--accent)" : "var(--text-muted)",
                background: tab === "all" ? "var(--bg-surface)" : "transparent",
              }}
            >
              ทั้งหมด
            </TabsTrigger>
            <TabsTrigger
              value="topup"
              className="px-4 h-8 rounded-md text-[13px] font-medium data-active:shadow-sm"
              style={{
                color: tab === "topup" ? "var(--accent)" : "var(--text-muted)",
                background: tab === "topup" ? "var(--bg-surface)" : "transparent",
              }}
            >
              การซื้อ
            </TabsTrigger>
            <TabsTrigger
              value="usage"
              className="px-4 h-8 rounded-md text-[13px] font-medium data-active:shadow-sm"
              style={{
                color: tab === "usage" ? "var(--accent)" : "var(--text-muted)",
                background: tab === "usage" ? "var(--bg-surface)" : "transparent",
              }}
            >
              หมดอายุ
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-0" />
        </Tabs>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-2">
        {/* Header */}
        <div
          className="grid grid-cols-[120px_1fr_100px_100px] max-md:grid-cols-[80px_1fr_70px_70px] gap-x-3 max-md:gap-x-2 px-5 max-md:px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border-default)" }}
        >
          <span>วันที่</span>
          <span>รายละเอียด</span>
          <span className="text-right">จำนวน</span>
          <span className="text-right">คงเหลือ</span>
        </div>

        {/* Rows */}
        {paged.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            ไม่มีรายการ
          </div>
        ) : (
          paged.map((event) => {
            const { date, time } = formatThaiDateSplit(event.date);
            const config = EVENT_TYPE_CONFIG[event.type] ?? EVENT_TYPE_CONFIG.usage;
            const Icon = config.icon;
            const isPositive = event.amount > 0;

            return (
              <div
                key={event.id}
                className="grid grid-cols-[120px_1fr_100px_100px] max-md:grid-cols-[80px_1fr_70px_70px] gap-x-3 max-md:gap-x-2 items-center px-5 max-md:px-3 py-3 hover:bg-[rgba(255,255,255,0.015)] transition-colors"
                style={{ borderBottom: "1px solid var(--border-default)" }}
              >
                {/* Date */}
                <div>
                  <p className="text-[13px]" style={{ color: "var(--text-primary)" }}>{date}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{time}</p>
                </div>

                {/* Description */}
                <div className="flex items-center gap-2 min-w-0">
                  <Icon size={14} style={{ color: config.color }} className="shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm truncate" style={{ color: "var(--text-primary)" }}>
                      {event.description}
                    </p>
                    {event.reference && (
                      <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                        {event.reference}
                      </p>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <p
                  className="text-sm font-semibold text-right tabular-nums"
                  style={{ color: isPositive ? "var(--accent)" : "var(--error)" }}
                >
                  {isPositive ? "+" : ""}{event.amount.toLocaleString()}
                </p>

                {/* Balance */}
                <p
                  className="text-[13px] text-right tabular-nums"
                  style={{ color: "var(--text-muted)" }}
                >
                  {event.balance.toLocaleString()}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <PaginationBar
          from={(page - 1) * PAGE_SIZE + 1}
          to={Math.min(page * PAGE_SIZE, filtered.length)}
          total={filtered.length}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

/* ─── Main Page ─── */

export default function CreditsPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<CreditSummary | null>(null);
  const [packages, setPackages] = useState<ActivePackage[]>([]);
  const [events, setEvents] = useState<CreditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/v1/credits");
      if (!res.ok) {
        throw new Error("ไม่สามารถโหลดข้อมูลได้");
      }

      const raw = await res.json();
      const data = raw.data ?? raw;

      if (!data.balance) {
        // No balance data — show empty state (legitimate zero credits)
        setSummary({ remaining: 0, total: 0, usedThisMonth: 0, earliestExpiry: null, earliestExpiryDays: null });
        setPackages([]);
        setEvents([]);
        return;
      }

      const b = data.balance;
      const now = new Date();

      // Map history → packages (active ones)
      const history = data.history ?? [];
      const activePkgs: ActivePackage[] = history
        .filter((h: { status: string }) => h.status === "ACTIVE")
        .map((h: { id: string; tierCode: string; packageName: string; smsRemaining: number; smsTotal: number; expiresAt: string }) => {
          const exp = new Date(h.expiresAt);
          const daysLeft = Math.max(0, Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          return {
            id: h.id,
            tier: h.tierCode ?? "",
            name: h.packageName ?? "",
            remaining: h.smsRemaining ?? 0,
            total: h.smsTotal ?? 0,
            expiresAt: formatThaiDateOnly(h.expiresAt),
            rawExpiresAt: h.expiresAt,
            daysLeft,
            isFifo: false,
          };
        })
        // CRITICAL 2 FIX: Sort by expiresAt ASC for correct FIFO ordering
        .sort((a: ActivePackage & { rawExpiresAt: string }, b: ActivePackage & { rawExpiresAt: string }) =>
          new Date(a.rawExpiresAt).getTime() - new Date(b.rawExpiresAt).getTime()
        )
        .map((pkg: ActivePackage, i: number) => ({ ...pkg, isFifo: i === 0 }));

      setPackages(activePkgs);

      // Set summary with earliest expiry from sorted packages
      const earliest = activePkgs.length > 0 ? activePkgs[0] : null;
      setSummary({
        remaining: b.remainingCredits ?? 0,
        total: b.totalCredits ?? 0,
        usedThisMonth: b.usedCredits ?? 0,
        earliestExpiry: earliest?.expiresAt ?? null,
        earliestExpiryDays: earliest?.daysLeft ?? null,
      });

      // CRITICAL 3 FIX: Map history to purchase/expiry events only
      // Backend only provides purchase history, not send/refund/bonus events
      const evts: CreditEvent[] = history.map((h: { id: string; purchasedAt: string; packageName: string; status: string; smsTotal: number; smsRemaining: number }) => ({
        id: h.id,
        date: h.purchasedAt,
        description: h.status === "ACTIVE" ? `ซื้อแพ็กเกจ ${h.packageName}` : `หมดอายุ ${h.packageName}`,
        type: (h.status === "ACTIVE" ? "topup" : "expired") as CreditEventType,
        amount: h.status === "ACTIVE" ? h.smsTotal : -(h.smsTotal - h.smsRemaining),
        balance: h.smsRemaining,
        reference: h.packageName,
      }));
      setEvents(evts);
    } catch {
      setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่");
      setSummary(null);
      setPackages([]);
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  if (loading) {
    return (
      <PageLayout>
        <PageHeader title="โควต้าข้อความ" />
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--text-muted)" }} />
        </div>
      </PageLayout>
    );
  }

  // Error state — API failed, never show fake data
  if (error) {
    return (
      <PageLayout>
        <PageHeader
          title="โควต้าข้อความ"
          description="จำนวนข้อความคงเหลือและประวัติการซื้อแพ็กเกจ"
        />
        <EmptyState
          icon={Coins}
          iconColor="var(--error)"
          iconBg="rgba(var(--error-rgb),0.06)"
          iconBorder="rgba(var(--error-rgb),0.1)"
          title="โหลดข้อมูลไม่สำเร็จ"
          description={error}
          ctaLabel="ลองใหม่"
          ctaAction={() => {
            setLoading(true);
            fetchData().finally(() => setLoading(false));
          }}
        />
      </PageLayout>
    );
  }

  // Empty state — no credits at all
  if (!summary || summary.total === 0) {
    return (
      <PageLayout>
        <PageHeader
          title="โควต้าข้อความ"
          description="จำนวนข้อความคงเหลือและประวัติการซื้อแพ็กเกจ"
        />
        <EmptyState
          icon={Coins}
          iconColor="var(--text-muted)"
          iconBg="rgba(var(--text-muted-rgb,148,159,168),0.06)"
          iconBorder="rgba(var(--text-muted-rgb,148,159,168),0.1)"
          title="ยังไม่มีข้อความ SMS"
          description="ซื้อแพ็กเกจเพื่อเริ่มส่งข้อความ"
          ctaLabel="ซื้อแพ็กเกจ →"
          ctaAction={() => router.push("/dashboard/billing/packages")}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="โควต้าข้อความ"
        description="จำนวนข้อความคงเหลือและประวัติการซื้อแพ็กเกจ"
        actions={
          <Button
            size="lg"
            onClick={() => router.push("/dashboard/billing/packages")}
            className="text-sm font-semibold gap-2"
            style={{
              background: "var(--accent)",
              color: "var(--bg-base)",
            }}
          >
            + ซื้อแพ็กเกจ
          </Button>
        }
      />

      {/* Credit Balance Hero */}
      <CreditBalanceHero summary={summary} />

      {/* Active Packages (FIFO) */}
      <ActivePackagesList packages={packages} />

      {/* Purchase History (backend only provides purchase/expiry events) */}
      {/* TODO: Add send/refund/bonus history when backend provides full event endpoint */}
      <CreditHistoryTable events={events} />
    </PageLayout>
  );
}
