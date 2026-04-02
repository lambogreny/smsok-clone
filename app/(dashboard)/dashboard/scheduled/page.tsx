"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Clock,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Copy,
  Trash2,
  Search,
  RefreshCw,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatThaiDate, formatThaiDateSplit, formatPhone } from "@/lib/format-thai-date";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Types ────────────────────────────────────────────────────────────────
type ScheduledSmsStatus = "pending" | "sent" | "failed" | "cancelled";

type ScheduledSmsItem = {
  id: string;
  senderName: string;
  recipient: string;
  content: string;
  scheduledAt: string;
  status: ScheduledSmsStatus;
  creditCost: number;
  errorCode: string | null;
  createdAt: string;
};

// ─── Status Config ────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  ScheduledSmsStatus,
  { label: string; color: string; bg: string; dot?: boolean; pulse?: boolean }
> = {
  pending:   { label: "รอส่ง",    color: "var(--info)", bg: "rgba(var(--info-rgb),0.08)", dot: true, pulse: true },
  sent:      { label: "ส่งแล้ว",   color: "var(--success)", bg: "rgba(var(--success-rgb),0.08)" },
  failed:    { label: "ล้มเหลว",  color: "var(--error)", bg: "rgba(var(--error-rgb),0.08)" },
  cancelled: { label: "ยกเลิก",   color: "var(--text-muted)", bg: "rgba(148,159,168,0.08)" },
};

// ─── Filter pill config ───────────────────────────────────────────────────
const FILTER_PILLS: { key: ScheduledSmsStatus | "all"; label: string; color: string; rgb: string }[] = [
  { key: "all",       label: "ทั้งหมด",  color: "var(--text-muted)", rgb: "var(--text-muted-rgb)" },
  { key: "pending",   label: "รอส่ง",    color: "var(--info)", rgb: "var(--info-rgb)" },
  { key: "sent",      label: "ส่งแล้ว",   color: "var(--success)", rgb: "var(--success-rgb)" },
  { key: "failed",    label: "ล้มเหลว",  color: "var(--error)", rgb: "var(--error-rgb)" },
  { key: "cancelled", label: "ยกเลิก",   color: "var(--text-muted)", rgb: "var(--text-muted-rgb)" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ScheduledSmsStatus }) {
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

function CountdownBadge({ scheduledAt }: { scheduledAt: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    function update() {
      const now = new Date().getTime();
      const target = new Date(scheduledAt).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setRemaining("กำลังส่ง...");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setRemaining(`ส่งใน ${days} วัน ${hours} ชม.`);
      } else if (hours > 0) {
        setRemaining(`ส่งใน ${hours} ชม. ${minutes} นาที`);
      } else {
        setRemaining(`ส่งใน ${minutes} นาที`);
      }
    }

    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [scheduledAt]);

  if (!remaining) return null;

  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-medium rounded-full"
      style={{
        padding: "2px 8px",
        background: "rgba(var(--info-rgb),0.06)",
        color: "var(--info)",
      }}
    >
      <Clock className="w-3 h-3" />
      {remaining}
    </span>
  );
}

// ─── Per-page constant ───────────────────────────────────────────────────
const PER_PAGE = 20;

// ─── Main Component ──────────────────────────────────────────────────────
export default function ScheduledPage() {
  const router = useRouter();
  const [items, setItems] = useState<ScheduledSmsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<ScheduledSmsStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [cancelling, setCancelling] = useState<Set<string>>(new Set());

  // ─── Fetch data ─────────────────────────────────────────────────────
  const fetchScheduled = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/sms/scheduled", { credentials: "include" });
      if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้");
      const data = await res.json();
      setItems(data.scheduled || []);
    } catch {
      toast.error("โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduled();
  }, [fetchScheduled]);

  // ─── Cancel handler ─────────────────────────────────────────────────
  const handleCancel = async (id: string) => {
    setCancelling((prev) => new Set(prev).add(id));
    try {
      const res = await fetch("/api/v1/sms/scheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "cancel", id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "ยกเลิกล้มเหลว" }));
        throw new Error(err.error || "ยกเลิกล้มเหลว");
      }
      const json = await res.json();
      const result = json.data ?? json;
      toast.success(`ยกเลิกสำเร็จ — คืน ${result.creditsRefunded || 0} SMS`);
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: "cancelled" as const } : i)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ยกเลิกล้มเหลว");
    } finally {
      setCancelling((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // ─── Derived data ───────────────────────────────────────────────────
  const filtered = items
    .filter((i) => filterStatus === "all" || i.status === filterStatus)
    .filter(
      (i) =>
        !searchQuery ||
        i.recipient.includes(searchQuery) ||
        i.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.senderName.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  // Stats
  const pendingCount = items.filter((i) => i.status === "pending").length;
  const sentCount = items.filter((i) => i.status === "sent").length;
  const failedCount = items.filter((i) => i.status === "failed").length;
  const totalCredits = items.filter((i) => i.status === "pending").reduce((sum, i) => sum + i.creditCost, 0);

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <PageLayout>
      <PageHeader
        title="ตั้งเวลาส่ง SMS"
        count={items.length}
        description="จัดการข้อความที่ตั้งเวลาส่งล่วงหน้า"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setLoading(true); fetchScheduled(); }}
              className="border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(var(--accent-rgb),0.04)] cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              รีเฟรช
            </Button>
            <Button
              onClick={() => router.push("/dashboard/send")}
              className="bg-[var(--accent)] text-[var(--text-on-accent)] hover:bg-[var(--accent)]/90 font-semibold cursor-pointer"
            >
              <Send className="w-4 h-4 mr-1.5" />
              ตั้งเวลาส่งใหม่
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <StatsRow columns={4}>
        <StatCard
          icon={<CalendarClock className="w-[18px] h-[18px] text-[var(--info)]" />}
          iconColor="var(--info-rgb)"
          value={pendingCount}
          label="รอส่ง"
          subtitle={totalCredits > 0 ? `${totalCredits.toLocaleString()} SMS reserved` : undefined}
        />
        <StatCard
          icon={<CheckCircle2 className="w-[18px] h-[18px] text-emerald-500" />}
          iconColor="16,185,129"
          value={sentCount}
          label="ส่งแล้ว"
        />
        <StatCard
          icon={<XCircle className="w-[18px] h-[18px] text-red-500" />}
          iconColor="239,68,68"
          value={failedCount}
          label="ล้มเหลว"
        />
        <StatCard
          icon={<Clock className="w-[18px] h-[18px] text-[var(--text-muted)]" />}
          iconColor="148,159,168"
          value={items.length}
          label="ทั้งหมด"
        />
      </StatsRow>

      {/* Filter Pills */}
      <FilterBar>
        {FILTER_PILLS.map((pill) => {
          const isActive = filterStatus === pill.key;
          const count = pill.key === "all" ? null : items.filter((i) => i.status === pill.key).length;
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
              {pill.key === "pending" && isActive && (
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse"
                  style={{ background: pill.color }}
                />
              )}
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
          placeholder="ค้นหาเบอร์, ข้อความ, ชื่อผู้ส่ง..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          className="pl-10 bg-[var(--bg-surface)] border-[var(--table-border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] h-10"
        />
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
          <span className="ml-2 text-sm text-[var(--text-muted)]">กำลังโหลด...</span>
        </div>
      ) : filtered.length > 0 ? (
        <TableWrapper>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--table-header)] border-b border-[var(--table-border)]">
                  <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em] px-4 py-2.5">ชื่อผู้ส่ง</th>
                  <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em] px-4 py-2.5">เบอร์ปลายทาง</th>
                  <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em] px-4 py-2.5">ข้อความ</th>
                  <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em] px-4 py-2.5">กำหนดส่ง</th>
                  <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em] px-4 py-2.5">สถานะ</th>
                  <th className="text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em] px-4 py-2.5 w-20">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item, idx) => {
                  const dt = formatThaiDateSplit(item.scheduledAt);
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-[var(--table-border)] hover:bg-[var(--bg-elevated)] transition-colors duration-150 ${
                        idx % 2 === 1 ? "bg-[var(--table-alt-row)]" : ""
                      }`}
                    >
                      <td className="px-4 py-2.5">
                        <span className="text-sm font-mono text-[var(--text-primary)]">{item.senderName}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-sm font-mono text-[var(--text-primary)]">{formatPhone(item.recipient)}</span>
                      </td>
                      <td className="px-4 py-2.5 max-w-[240px]">
                        <p className="text-sm text-[var(--text-secondary)] truncate">{item.content}</p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{item.creditCost} SMS</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <div>
                          <p className="text-sm text-[var(--text-primary)]">{dt.date}</p>
                          <p className="text-xs text-[var(--text-muted)]">{dt.time}</p>
                        </div>
                        {item.status === "pending" && (
                          <CountdownBadge scheduledAt={item.scheduledAt} />
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={item.status} />
                        {item.errorCode && (
                          <p className="text-[10px] text-[var(--error)] mt-0.5">{item.errorCode}</p>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)] transition-colors cursor-pointer"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-[var(--table-header)] border-[var(--table-border)] rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
                          >
                            <DropdownMenuItem
                              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:text-[var(--text-primary)] focus:bg-[rgba(255,255,255,0.04)] cursor-pointer"
                              onClick={() => {
                                navigator.clipboard.writeText(item.content);
                                toast.success("คัดลอกข้อความแล้ว");
                              }}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              คัดลอกข้อความ
                            </DropdownMenuItem>
                            {item.status === "pending" && (
                              <>
                                <DropdownMenuSeparator className="bg-[var(--table-border)]" />
                                <DropdownMenuItem
                                  className="text-[var(--error)] hover:text-[var(--error)] focus:text-[var(--error)] focus:bg-[rgba(239,68,68,0.08)] cursor-pointer"
                                  onClick={() => handleCancel(item.id)}
                                  disabled={cancelling.has(item.id)}
                                >
                                  {cancelling.has(item.id) ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4 mr-2" />
                                  )}
                                  ยกเลิกข้อความ
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-[var(--table-border)]">
            {paginated.map((item) => {
              const dt = formatThaiDateSplit(item.scheduledAt);
              return (
                <div key={item.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{formatPhone(item.recipient)}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">{item.senderName}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-2">{item.content}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-muted)]">{dt.date} {dt.time}</span>
                      {item.status === "pending" && <CountdownBadge scheduledAt={item.scheduledAt} />}
                    </div>
                    {item.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => handleCancel(item.id)}
                        disabled={cancelling.has(item.id)}
                        className="text-xs text-[var(--error)] hover:underline cursor-pointer disabled:opacity-50"
                      >
                        {cancelling.has(item.id) ? "กำลังยกเลิก..." : "ยกเลิก"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
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
          icon={CalendarClock}
          iconColor="var(--accent)"
          iconBg="rgba(var(--accent-rgb), 0.1)"
          iconBorder="rgba(var(--accent-rgb), 0.15)"
          title="ยังไม่มีข้อความตั้งเวลา"
          description="ตั้งเวลาส่ง SMS ล่วงหน้าเพื่อเข้าถึงลูกค้าในเวลาที่เหมาะสม"
          ctaLabel="ตั้งเวลาส่ง SMS"
          ctaAction={() => router.push("/dashboard/send")}
        />
      ) : (
        <TableWrapper>
          <EmptyState
            icon={<Search className="w-12 h-12" />}
            title="ไม่พบข้อความที่ตรงกับตัวกรอง"
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
