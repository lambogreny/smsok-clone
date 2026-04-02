"use client";

import { useState, useEffect, useCallback } from "react";
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
  TrendingUp,
  Loader2,
  RefreshCw,
  Users,
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
  FilterBar,
  PaginationBar,
} from "@/components/blocks/PageLayout";
import { cn } from "@/lib/utils";
import { formatPhone } from "@/lib/format-thai-date";

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

function ConsentBadge({ status }: { status: ConsentStatus }) {
  switch (status) {
    case "consented":
      return (
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-[rgba(var(--success-rgb),0.12)] flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-[var(--success)]" />
          </div>
        </div>
      );
    case "opted-out":
      return (
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-[rgba(var(--error-rgb),0.12)] flex items-center justify-center">
            <X className="w-3.5 h-3.5 text-[var(--error)]" />
          </div>
        </div>
      );
    default:
      return (
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-[var(--bg-muted)] flex items-center justify-center">
            <Minus className="w-3.5 h-3.5 text-[var(--text-subdued)]" />
          </div>
        </div>
      );
  }
}

const PAGE_SIZE = 10;

/* ─── Stat Card (inline — enhanced) ─── */

function ConsentStatCard({
  icon,
  iconColor,
  iconRgb,
  value,
  label,
  index,
}: {
  icon: React.ReactNode;
  iconColor: string;
  iconRgb: string;
  value: string | number;
  label: string;
  index: number;
}) {
  return (
    <div
      className="relative bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4 snap-start shrink-0 min-w-[160px] sm:min-w-0 overflow-hidden group hover:border-[rgba(var(--accent-rgb),0.12)] transition-all duration-300"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      {/* Subtle top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] opacity-40"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(${iconRgb},0.6), transparent)`,
        }}
      />

      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center"
          style={{ background: `rgba(${iconRgb},0.1)` }}
        >
          {icon}
        </div>
        <span className="text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-[0.04em]">
          {label}
        </span>
      </div>

      <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
    </div>
  );
}

/* ─── Main Component ─── */

export default function ConsentPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [purposeFilter, setPurposeFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/consent/status");
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : data.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const consentedCount = contacts.filter(
    (c) => c.marketing === "consented" || c.transactional === "consented"
  ).length;
  const optedOutCount = contacts.filter(
    (c) => c.marketing === "opted-out"
  ).length;
  const pendingCount = contacts.filter((c) => c.marketing === "none").length;
  const rate =
    contacts.length > 0
      ? ((consentedCount / contacts.length) * 100).toFixed(1)
      : "0";

  const filtered = contacts.filter((c) => {
    if (
      searchQuery &&
      !c.name.includes(searchQuery) &&
      !c.phone.includes(searchQuery)
    )
      return false;
    if (statusFilter) {
      if (purposeFilter) {
        const field = purposeFilter as keyof Pick<
          Contact,
          "marketing" | "transactional" | "updates"
        >;
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
            className="border-[var(--border-default)] text-[var(--text-secondary)] gap-2 hover:border-[rgba(var(--accent-rgb),0.2)] hover:text-[var(--accent)] transition-all"
          >
            <Download className="w-4 h-4" /> ส่งออก CSV
          </Button>
        }
      />

      {/* ─── Stats ─── */}
      <div className="stagger-children">
        {/* Mobile: horizontal scroll */}
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:hidden no-scrollbar mb-4">
          <ConsentStatCard
            icon={<CheckCircle className="w-4 h-4" style={{ color: "var(--success)" }} />}
            iconColor="var(--success)"
            iconRgb="var(--success-rgb)"
            value={consentedCount}
            label="ยินยอม"
            index={0}
          />
          <ConsentStatCard
            icon={<XCircle className="w-4 h-4" style={{ color: "var(--error)" }} />}
            iconColor="var(--error)"
            iconRgb="var(--error-rgb)"
            value={optedOutCount}
            label="ยกเลิก"
            index={1}
          />
          <ConsentStatCard
            icon={<Clock className="w-4 h-4" style={{ color: "var(--warning)" }} />}
            iconColor="var(--warning)"
            iconRgb="var(--warning-rgb)"
            value={pendingCount}
            label="รอยินยอม"
            index={2}
          />
          <ConsentStatCard
            icon={<TrendingUp className="w-4 h-4" style={{ color: "var(--accent)" }} />}
            iconColor="var(--accent)"
            iconRgb="var(--accent-rgb)"
            value={`${rate}%`}
            label="อัตรา"
            index={3}
          />
        </div>
        {/* Desktop: grid */}
        <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <ConsentStatCard
            icon={<CheckCircle className="w-4 h-4" style={{ color: "var(--success)" }} />}
            iconColor="var(--success)"
            iconRgb="var(--success-rgb)"
            value={consentedCount}
            label="ยินยอม"
            index={0}
          />
          <ConsentStatCard
            icon={<XCircle className="w-4 h-4" style={{ color: "var(--error)" }} />}
            iconColor="var(--error)"
            iconRgb="var(--error-rgb)"
            value={optedOutCount}
            label="ยกเลิก"
            index={1}
          />
          <ConsentStatCard
            icon={<Clock className="w-4 h-4" style={{ color: "var(--warning)" }} />}
            iconColor="var(--warning)"
            iconRgb="var(--warning-rgb)"
            value={pendingCount}
            label="รอยินยอม"
            index={2}
          />
          <ConsentStatCard
            icon={<TrendingUp className="w-4 h-4" style={{ color: "var(--accent)" }} />}
            iconColor="var(--accent)"
            iconRgb="var(--accent-rgb)"
            value={`${rate}%`}
            label="อัตรา"
            index={3}
          />
        </div>
      </div>

      {/* ─── Filters ─── */}
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
            className="pl-9 bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] focus:border-[var(--accent)]"
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

      {/* ─── Table ─── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
          <span className="text-[13px] text-[var(--text-muted)]">
            กำลังโหลดข้อมูล...
          </span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-14 h-14 rounded-lg bg-[rgba(var(--error-rgb),0.1)] flex items-center justify-center">
            <XCircle className="w-7 h-7 text-[var(--error)]" />
          </div>
          <p className="text-sm text-[var(--text-secondary)]">{error}</p>
          <Button
            variant="outline"
            onClick={fetchContacts}
            className="gap-2 border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[rgba(var(--accent-rgb),0.2)]"
          >
            <RefreshCw className="w-4 h-4" /> ลองใหม่
          </Button>
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 rounded-lg bg-[var(--bg-muted)] flex items-center justify-center">
            <Users className="w-7 h-7 text-[var(--text-muted)]" />
          </div>
          <p className="text-[15px] font-medium text-[var(--text-primary)]">
            ยังไม่มีข้อมูลความยินยอม
          </p>
          <p className="text-[13px] text-[var(--text-muted)]">
            เพิ่มผู้ติดต่อและบันทึก consent เพื่อเริ่มต้นใช้งาน
          </p>
        </div>
      ) : (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden">
          {/* Table */}
          <table className="nansen-table nansen-table-dense w-full">
            <thead>
              <tr>
                <th className="text-left">ผู้ติดต่อ</th>
                <th className="text-left">เบอร์</th>
                <th className="text-center">Marketing</th>
                <th className="text-center">Trans.</th>
                <th className="text-center">Updates</th>
                <th className="text-left">วันที่ยินยอม</th>
                <th className="w-[50px]" />
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="!text-center !py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-6 h-6 text-[var(--text-muted)]" />
                      <span className="text-[13px] text-[var(--text-muted)]">
                        ไม่พบข้อมูลที่ตรงกับตัวกรอง
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((contact) => (
                  <tr key={contact.id} className="group">
                    <td>
                      <span className="text-[14px] font-medium text-[var(--text-primary)]">
                        {contact.name}
                      </span>
                    </td>
                    <td>
                      <span className="text-[13px] text-[var(--text-secondary)] font-mono tracking-wide">
                        {formatPhone(contact.phone)}
                      </span>
                    </td>
                    <td>
                      <ConsentBadge status={contact.marketing} />
                    </td>
                    <td>
                      <ConsentBadge status={contact.transactional} />
                    </td>
                    <td>
                      <ConsentBadge status={contact.updates} />
                    </td>
                    <td>
                      <span className="text-[13px] text-[var(--text-secondary)]">
                        {contact.consentDate}
                      </span>
                    </td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all opacity-0 group-hover:opacity-100 cursor-pointer">
                          <MoreHorizontal className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2 cursor-pointer">
                            <Eye className="w-3.5 h-3.5" /> ดูประวัติ consent
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 cursor-pointer">
                            <Send className="w-3.5 h-3.5" /> ส่งขอ consent ใหม่
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 cursor-pointer text-[var(--error)]">
                            <Ban className="w-3.5 h-3.5" /> บันทึก opt-out
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

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
      )}
    </PageLayout>
  );
}
