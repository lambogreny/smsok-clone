"use client";

import { useState } from "react";
import {
  Check,
  X,
  Minus,
  Search,
  Download,
  MoreHorizontal,
  Eye,
  Send,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
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

type ConsentStatus = "consented" | "opted-out" | "none";

type Contact = {
  id: string;
  name: string;
  phone: string;
  marketing: ConsentStatus;
  transactional: ConsentStatus;
  updates: ConsentStatus;
  consentDate: string;
};

/* ─── Config ─── */

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "ทุกสถานะ" },
  { value: "consented", label: "ยินยอม" },
  { value: "opted-out", label: "ยกเลิก" },
  { value: "none", label: "รอยินยอม" },
];

const PURPOSE_OPTIONS = [
  { value: "", label: "ทุกวัตถุประสงค์" },
  { value: "marketing", label: "Marketing" },
  { value: "transactional", label: "Transactional" },
  { value: "updates", label: "Updates" },
];

/* ─── Helpers ─── */

function ConsentIcon({ status }: { status: ConsentStatus }) {
  switch (status) {
    case "consented":
      return <Check className="w-4 h-4 text-[var(--success)] mx-auto" />;
    case "opted-out":
      return <X className="w-4 h-4 text-[var(--error)] mx-auto" />;
    default:
      return <Minus className="w-4 h-4 text-[var(--text-muted)] mx-auto" />;
  }
}

/* ─── Mock Data ─── */

const MOCK_CONTACTS: Contact[] = [
  {
    id: "1",
    name: "สมชาย",
    phone: "081-xxx-xxxx",
    marketing: "consented",
    transactional: "consented",
    updates: "consented",
    consentDate: "1 มี.ค.",
  },
  {
    id: "2",
    name: "สมศรี",
    phone: "089-xxx-xxxx",
    marketing: "consented",
    transactional: "consented",
    updates: "opted-out",
    consentDate: "5 มี.ค.",
  },
  {
    id: "3",
    name: "วิชัย",
    phone: "092-xxx-xxxx",
    marketing: "opted-out",
    transactional: "consented",
    updates: "opted-out",
    consentDate: "8 มี.ค.",
  },
  {
    id: "4",
    name: "มานี",
    phone: "095-xxx-xxxx",
    marketing: "none",
    transactional: "consented",
    updates: "none",
    consentDate: "—",
  },
];

const PAGE_SIZE = 10;

/* ─── Main Component ─── */

export default function ConsentPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [purposeFilter, setPurposeFilter] = useState("");
  const [page, setPage] = useState(1);

  const consentedCount = MOCK_CONTACTS.filter(
    (c) => c.marketing === "consented" || c.transactional === "consented"
  ).length;
  const optedOutCount = MOCK_CONTACTS.filter(
    (c) => c.marketing === "opted-out"
  ).length;
  const pendingCount = MOCK_CONTACTS.filter(
    (c) => c.marketing === "none"
  ).length;
  const rate =
    MOCK_CONTACTS.length > 0
      ? ((consentedCount / MOCK_CONTACTS.length) * 100).toFixed(1)
      : "0";

  const filtered = MOCK_CONTACTS.filter((c) => {
    if (
      searchQuery &&
      !c.name.includes(searchQuery) &&
      !c.phone.includes(searchQuery)
    )
      return false;
    if (statusFilter) {
      if (purposeFilter) {
        const field = purposeFilter as keyof Pick<Contact, "marketing" | "transactional" | "updates">;
        if (c[field] !== statusFilter) return false;
      } else {
        if (c.marketing !== statusFilter) return false;
      }
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <PageLayout>
      <PageHeader
        title="จัดการความยินยอม"
        actions={
          <Button
            variant="outline"
            className="border-[var(--border-default)] text-[var(--text-secondary)] gap-2"
          >
            <Download className="w-4 h-4" /> ส่งออก CSV
          </Button>
        }
      />

      <StatsRow columns={4}>
        <StatCard
          icon={
            <CheckCircle className="w-4 h-4" style={{ color: "var(--success)" }} />
          }
          iconColor="16,185,129"
          value={consentedCount}
          label="ยินยอม"
        />
        <StatCard
          icon={<XCircle className="w-4 h-4" style={{ color: "var(--error)" }} />}
          iconColor="239,68,68"
          value={optedOutCount}
          label="ยกเลิก"
        />
        <StatCard
          icon={<Clock className="w-4 h-4" style={{ color: "var(--warning)" }} />}
          iconColor="245,158,11"
          value={pendingCount}
          label="รอยินยอม"
        />
        <StatCard
          icon={
            <BarChart3 className="w-4 h-4" style={{ color: "var(--info)" }} />
          }
          iconColor="50,152,218"
          value={`${rate}%`}
          label="อัตรา"
        />
      </StatsRow>

      <FilterBar>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <Input
            placeholder="ค้นหาเบอร์/ชื่อ..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)]"
          />
        </div>
        <CustomSelect
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          options={STATUS_FILTER_OPTIONS}
          placeholder="สถานะ"
        />
        <CustomSelect
          value={purposeFilter}
          onChange={(v) => {
            setPurposeFilter(v);
            setPage(1);
          }}
          options={PURPOSE_OPTIONS}
          placeholder="วัตถุประสงค์"
        />
      </FilterBar>

      <TableWrapper>
        {/* Header */}
        <div className="grid grid-cols-[1fr_120px_80px_80px_80px_100px_50px] gap-x-4 px-5 py-3 bg-[var(--table-header)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          <span>ผู้ติดต่อ</span>
          <span>เบอร์</span>
          <span className="text-center">Marketing</span>
          <span className="text-center">Trans.</span>
          <span className="text-center">Updates</span>
          <span>วันที่ยินยอม</span>
          <span />
        </div>

        {/* Body */}
        {paged.length === 0 ? (
          <EmptyState
            icon={<CheckCircle className="w-10 h-10" />}
            title="ไม่พบข้อมูล"
            subtitle="ลองเปลี่ยนตัวกรอง"
          />
        ) : (
          paged.map((contact, i) => (
            <div
              key={contact.id}
              className={`grid grid-cols-[1fr_120px_80px_80px_80px_100px_50px] gap-x-4 items-center px-5 py-3.5 border-b border-[var(--table-border)] hover:bg-[rgba(255,255,255,0.015)] transition-colors ${
                i % 2 === 1 ? "bg-[var(--table-alt-row)]" : ""
              }`}
            >
              <span className="text-sm text-[var(--text-primary)] font-medium">
                {contact.name}
              </span>
              <span className="text-xs text-[var(--text-secondary)] font-mono">
                {contact.phone}
              </span>
              <ConsentIcon status={contact.marketing} />
              <ConsentIcon status={contact.transactional} />
              <ConsentIcon status={contact.updates} />
              <span className="text-xs text-[var(--text-secondary)]">
                {contact.consentDate}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
                  <MoreHorizontal className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <Eye className="w-3.5 h-3.5" /> ดูประวัติ consent
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <Send className="w-3.5 h-3.5" /> ส่งขอ consent ใหม่
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <Ban className="w-3.5 h-3.5" /> บันทึก opt-out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
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
