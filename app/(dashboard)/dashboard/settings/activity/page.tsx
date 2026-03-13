"use client";

import { useState, useEffect } from "react";
import {
  KeyRound,
  Send,
  Megaphone,
  Settings,
  CreditCard,
  Trash2,
  Search,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CustomSelect from "@/components/ui/CustomSelect";
import PageLayout, {
  PageHeader,
  FilterBar,
  TableWrapper,
  PaginationBar,
  EmptyState,
} from "@/components/blocks/PageLayout";

/* ─── Types ─── */

type ActivityType =
  | "login"
  | "sms"
  | "campaign"
  | "settings"
  | "billing"
  | "delete";

type Activity = {
  id: string;
  datetime: string;
  member: string;
  type: ActivityType;
  description: string;
  ip: string;
};

/* ─── Config ─── */

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof KeyRound; color: string }
> = {
  login: { label: "เข้าสู่ระบบ", icon: KeyRound, color: "var(--accent)" },
  sms: { label: "ส่ง SMS", icon: Send, color: "var(--info)" },
  campaign: { label: "Campaign", icon: Megaphone, color: "var(--warning)" },
  settings: { label: "ตั้งค่า", icon: Settings, color: "var(--text-muted)" },
  billing: { label: "Billing", icon: CreditCard, color: "var(--success)" },
  delete: { label: "ลบข้อมูล", icon: Trash2, color: "var(--error)" },
};

const DEFAULT_TYPE_CONFIG = { label: "อื่นๆ", icon: Settings, color: "var(--text-muted)" };

const MEMBER_OPTIONS = [
  { value: "", label: "ทุกคน" },
  { value: "สมชาย", label: "สมชาย" },
  { value: "สมศรี", label: "สมศรี" },
  { value: "วิชัย", label: "วิชัย" },
];

const TYPE_OPTIONS = [
  { value: "", label: "ทุกประเภท" },
  { value: "login", label: "เข้าสู่ระบบ" },
  { value: "sms", label: "ส่ง SMS" },
  { value: "campaign", label: "Campaign" },
  { value: "settings", label: "ตั้งค่า" },
  { value: "billing", label: "Billing" },
  { value: "delete", label: "ลบข้อมูล" },
];

/* ─── No mock data — fetched from API ─── */

const PAGE_SIZE = 10;

/* ─── Main Component ─── */

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [memberFilter, setMemberFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch("/api/v1/settings/activity");
        if (res.ok) {
          const data = await res.json();
          setActivities(Array.isArray(data) ? data : data.activities ?? []);
        }
      } catch {
        // API unavailable
      } finally {
        setApiLoading(false);
      }
    }
    fetchActivity();
  }, []);

  const filtered = activities.filter((a) => {
    if (memberFilter && a.member !== memberFilter) return false;
    if (typeFilter && a.type !== typeFilter) return false;
    if (
      searchQuery &&
      !a.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (apiLoading) {
    return (
      <PageLayout>
        <PageHeader title="ประวัติกิจกรรม" />
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="ประวัติกิจกรรม"
        actions={
          <Button
            variant="outline"
            className="border-[var(--border-default)] text-[var(--text-secondary)] gap-2"
          >
            <Download className="w-4 h-4" /> ส่งออก CSV
          </Button>
        }
      />

      <FilterBar>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <Input
            placeholder="ค้นหา..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)]"
          />
        </div>
        <CustomSelect
          value={memberFilter}
          onChange={(v) => {
            setMemberFilter(v);
            setPage(1);
          }}
          options={MEMBER_OPTIONS}
          placeholder="สมาชิก"
        />
        <CustomSelect
          value={typeFilter}
          onChange={(v) => {
            setTypeFilter(v);
            setPage(1);
          }}
          options={TYPE_OPTIONS}
          placeholder="ประเภท"
        />
      </FilterBar>

      <TableWrapper>
        {/* Header */}
        <div className="grid grid-cols-[80px_60px_90px_1fr] md:grid-cols-[140px_80px_140px_1fr_120px] gap-x-4 px-5 py-3 bg-[var(--table-header)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          <span>เวลา</span>
          <span>สมาชิก</span>
          <span>กิจกรรม</span>
          <span className="hidden md:block">รายละเอียด</span>
          <span className="hidden md:block">IP</span>
        </div>

        {/* Body */}
        {paged.length === 0 ? (
          <EmptyState
            icon={<KeyRound className="w-10 h-10" />}
            title="ไม่พบกิจกรรม"
            subtitle="ลองเปลี่ยนตัวกรอง"
          />
        ) : (
          paged.map((activity, i) => {
            const config = TYPE_CONFIG[activity.type] ?? DEFAULT_TYPE_CONFIG;
            const Icon = config.icon;
            return (
              <div
                key={activity.id}
                className={`grid grid-cols-[80px_60px_90px_1fr] md:grid-cols-[140px_80px_140px_1fr_120px] gap-x-4 items-center px-5 py-3.5 border-b border-[var(--table-border)] hover:bg-[rgba(255,255,255,0.015)] transition-colors ${
                  i % 2 === 1 ? "bg-[var(--table-alt-row)]" : ""
                }`}
              >
                <span className="text-xs text-[var(--text-secondary)]">
                  {activity.datetime}
                </span>
                <span className="text-sm text-[var(--text-primary)] font-medium">
                  {activity.member}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium">
                  <Icon
                    className="w-3.5 h-3.5"
                    style={{ color: config.color }}
                  />
                  <span style={{ color: config.color }}>{config.label}</span>
                </span>
                <span className="text-xs text-[var(--text-secondary)] truncate hidden md:block">
                  {activity.description}
                </span>
                <span className="text-xs text-[var(--text-muted)] font-mono hidden md:block">
                  {activity.ip}
                </span>
              </div>
            );
          })
        )}

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
      </TableWrapper>
    </PageLayout>
  );
}
