"use client";

import { useState } from "react";
import {
  Download,
  Trash2,
  Package,
  Shield,
  ClipboardList,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CustomSelect from "@/components/ui/CustomSelect";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PageLayout, {
  PageHeader,
  StatsRow,
  StatCard,
  FilterBar,
  TableWrapper,
  PaginationBar,
  EmptyState,
} from "@/components/blocks/PageLayout";

/* ─── Types ─── */

type RequestType = "access" | "delete" | "portability" | "object";
type RequestStatus = "pending" | "in_progress" | "completed" | "near_deadline";

type DataRequest = {
  id: string;
  code: string;
  requester: string;
  type: RequestType;
  requestDate: string;
  deadline: string;
  status: RequestStatus;
  daysLeft: number;
};

/* ─── Config ─── */

const TYPE_CONFIG: Record<
  RequestType,
  { label: string; icon: typeof Download; color: string }
> = {
  access: { label: "เข้าถึง", icon: Download, color: "var(--info)" },
  delete: { label: "ลบข้อมูล", icon: Trash2, color: "var(--error)" },
  portability: { label: "ส่งออก", icon: Package, color: "var(--warning)" },
  object: { label: "คัดค้าน", icon: Shield, color: "var(--accent)" },
};

const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; color: string; bg: string }
> = {
  pending: {
    label: "⏳ รอ",
    color: "var(--warning)",
    bg: "rgba(var(--warning-rgb),0.08)",
  },
  in_progress: {
    label: "🔄 กำลังดำเนินการ",
    color: "var(--accent)",
    bg: "rgba(var(--accent-rgb),0.08)",
  },
  completed: {
    label: "✅ เสร็จ",
    color: "var(--success)",
    bg: "rgba(var(--success-rgb),0.08)",
  },
  near_deadline: {
    label: "⚠ ใกล้หมด",
    color: "var(--error)",
    bg: "rgba(var(--error-rgb),0.08)",
  },
};

const TYPE_OPTIONS = [
  { value: "", label: "ทุกประเภท" },
  { value: "access", label: "เข้าถึง" },
  { value: "delete", label: "ลบข้อมูล" },
  { value: "portability", label: "ส่งออก" },
  { value: "object", label: "คัดค้าน" },
];

const STATUS_OPTIONS = [
  { value: "", label: "ทุกสถานะ" },
  { value: "pending", label: "รอดำเนินการ" },
  { value: "in_progress", label: "กำลังดำเนินการ" },
  { value: "completed", label: "เสร็จ" },
  { value: "near_deadline", label: "ใกล้หมดเวลา" },
];

/* ─── Mock Data ─── */

const MOCK_REQUESTS: DataRequest[] = [
  {
    id: "1",
    code: "DSR-001",
    requester: "081-xxx-xxxx",
    type: "delete",
    requestDate: "1 มี.ค.",
    deadline: "31 มี.ค.",
    status: "pending",
    daysLeft: 20,
  },
  {
    id: "2",
    code: "DSR-002",
    requester: "089-xxx-xxxx",
    type: "access",
    requestDate: "5 มี.ค.",
    deadline: "4 เม.ย.",
    status: "completed",
    daysLeft: 24,
  },
  {
    id: "3",
    code: "DSR-003",
    requester: "092-xxx-xxxx",
    type: "portability",
    requestDate: "8 มี.ค.",
    deadline: "7 เม.ย.",
    status: "near_deadline",
    daysLeft: 5,
  },
  {
    id: "4",
    code: "DSR-004",
    requester: "095-xxx-xxxx",
    type: "object",
    requestDate: "10 มี.ค.",
    deadline: "9 เม.ย.",
    status: "in_progress",
    daysLeft: 29,
  },
];

const PAGE_SIZE = 10;

/* ─── Main Component ─── */

export default function DataRequestsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const totalCount = MOCK_REQUESTS.length;
  const pendingCount = MOCK_REQUESTS.filter(
    (r) => r.status === "pending"
  ).length;
  const completedCount = MOCK_REQUESTS.filter(
    (r) => r.status === "completed"
  ).length;
  const nearDeadlineCount = MOCK_REQUESTS.filter(
    (r) => r.status === "near_deadline"
  ).length;

  const filtered = MOCK_REQUESTS.filter((r) => {
    if (typeFilter && r.type !== typeFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    if (searchQuery && !r.code.includes(searchQuery) && !r.requester.includes(searchQuery))
      return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <PageLayout>
      <PageHeader
        title="คำขอสิทธิ์ข้อมูล"
        count={totalCount}
        description="จัดการคำขอตาม PDPA ภายใน 30 วัน"
      />

      <StatsRow columns={4}>
        <StatCard
          icon={
            <ClipboardList className="w-4 h-4" style={{ color: "var(--info)" }} />
          }
          iconColor="50,152,218"
          value={totalCount}
          label="ทั้งหมด"
        />
        <StatCard
          icon={<Clock className="w-4 h-4" style={{ color: "var(--warning)" }} />}
          iconColor="245,158,11"
          value={pendingCount}
          label="รอดำเนินการ"
        />
        <StatCard
          icon={
            <CheckCircle className="w-4 h-4" style={{ color: "var(--success)" }} />
          }
          iconColor="16,185,129"
          value={completedCount}
          label="เสร็จ"
        />
        <StatCard
          icon={
            <AlertTriangle className="w-4 h-4" style={{ color: "var(--error)" }} />
          }
          iconColor="239,68,68"
          value={nearDeadlineCount}
          label="ใกล้หมดเวลา"
        />
      </StatsRow>

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
          value={typeFilter}
          onChange={(v) => {
            setTypeFilter(v);
            setPage(1);
          }}
          options={TYPE_OPTIONS}
          placeholder="ประเภท"
        />
        <CustomSelect
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          placeholder="สถานะ"
        />
      </FilterBar>

      <TableWrapper>
        {/* Header */}
        <div className="grid grid-cols-[80px_100px_120px_100px_100px_120px_50px] gap-x-4 px-5 py-3 bg-[var(--table-header)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          <span>ID</span>
          <span>ผู้ขอ</span>
          <span>ประเภท</span>
          <span>วันที่ขอ</span>
          <span>กำหนด</span>
          <span>สถานะ</span>
          <span />
        </div>

        {/* Body */}
        {paged.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="w-10 h-10" />}
            title="ไม่พบคำขอ"
            subtitle="ลองเปลี่ยนตัวกรอง"
          />
        ) : (
          paged.map((req, i) => {
            const typeConfig = TYPE_CONFIG[req.type];
            const statusConfig = STATUS_CONFIG[req.status];
            const Icon = typeConfig.icon;
            const isNearDeadline = req.daysLeft < 7;

            return (
              <div
                key={req.id}
                className={`grid grid-cols-[80px_100px_120px_100px_100px_120px_50px] gap-x-4 items-center px-5 py-3.5 border-b border-[var(--table-border)] hover:bg-[rgba(255,255,255,0.015)] transition-colors ${
                  i % 2 === 1 ? "bg-[var(--table-alt-row)]" : ""
                }`}
              >
                <span className="text-sm text-[var(--text-primary)] font-mono font-medium">
                  {req.code}
                </span>
                <span className="text-xs text-[var(--text-secondary)] font-mono">
                  {req.requester}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium">
                  <Icon
                    className="w-3.5 h-3.5"
                    style={{ color: typeConfig.color }}
                  />
                  <span style={{ color: typeConfig.color }}>
                    {typeConfig.label}
                  </span>
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  {req.requestDate}
                </span>
                <span
                  className={`text-xs tabular-nums ${
                    isNearDeadline
                      ? "text-[var(--error)] font-semibold"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  {req.deadline}
                </span>
                <span
                  className="inline-flex text-[11px] font-medium px-2.5 py-1 rounded-full w-fit"
                  style={{
                    background: statusConfig.bg,
                    color: statusConfig.color,
                  }}
                >
                  {statusConfig.label}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
                    <MoreHorizontal className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="cursor-pointer">
                      ดูรายละเอียด
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      เปลี่ยนสถานะ
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
