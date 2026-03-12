"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/EmptyState";
import CustomSelect from "@/components/ui/CustomSelect";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  MessageSquare,
  Clock,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  BookOpen,
  CreditCard,
  Shield,
  Send,
  AlertTriangle,
  User,
  Tag,
  LifeBuoy,
  FileText,
  Zap,
  ExternalLink,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

type TicketStatus = "OPEN" | "IN_PROGRESS" | "AWAITING_RESPONSE" | "RESOLVED" | "CLOSED";
type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type TicketCategory = "BILLING" | "TECHNICAL" | "SENDER_NAME" | "DELIVERY" | "ACCOUNT" | "GENERAL";

interface Ticket {
  id: string;
  subject: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  _count: { replies: number };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Constants ────────────────────────────────────────────────────────────

const STATUS_TABS: { value: TicketStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "OPEN", label: "เปิดอยู่" },
  { value: "IN_PROGRESS", label: "กำลังดำเนินการ" },
  { value: "AWAITING_RESPONSE", label: "รอตอบกลับ" },
  { value: "RESOLVED", label: "แก้ไขแล้ว" },
  { value: "CLOSED", label: "ปิดแล้ว" },
];

const CATEGORY_OPTIONS: { value: TicketCategory | "ALL"; label: string }[] = [
  { value: "ALL", label: "ทุกหมวดหมู่" },
  { value: "BILLING", label: "การเงิน/บิล" },
  { value: "TECHNICAL", label: "เทคนิค" },
  { value: "SENDER_NAME", label: "ชื่อผู้ส่ง" },
  { value: "DELIVERY", label: "การจัดส่ง SMS" },
  { value: "ACCOUNT", label: "บัญชีผู้ใช้" },
  { value: "GENERAL", label: "ทั่วไป" },
];

const STATUS_CONFIG: Record<TicketStatus, { label: string; cls: string; dot: string }> = {
  OPEN: {
    label: "เปิดอยู่",
    cls: "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] border-[rgba(var(--accent-rgb),0.15)]",
    dot: "bg-[var(--accent)]",
  },
  IN_PROGRESS: {
    label: "กำลังดำเนินการ",
    cls: "bg-[rgba(var(--info-rgb),0.1)] text-[var(--info)] border-[rgba(var(--info-rgb),0.15)]",
    dot: "bg-[var(--info)]",
  },
  AWAITING_RESPONSE: {
    label: "รอตอบกลับ",
    cls: "bg-[rgba(var(--warning-rgb),0.1)] text-[var(--warning)] border-[rgba(var(--warning-rgb),0.15)]",
    dot: "bg-[var(--warning)]",
  },
  RESOLVED: {
    label: "แก้ไขแล้ว",
    cls: "bg-[rgba(var(--success-rgb),0.1)] text-[var(--success)] border-[rgba(var(--success-rgb),0.15)]",
    dot: "bg-[var(--success)]",
  },
  CLOSED: {
    label: "ปิดแล้ว",
    cls: "bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border-subtle)]",
    dot: "bg-[var(--text-muted)]",
  },
};

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; cls: string }> = {
  LOW: {
    label: "ต่ำ",
    cls: "bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border-subtle)]",
  },
  MEDIUM: {
    label: "ปานกลาง",
    cls: "bg-[rgba(var(--info-rgb),0.1)] text-[var(--info)] border-[rgba(var(--info-rgb),0.15)]",
  },
  HIGH: {
    label: "สูง",
    cls: "bg-[rgba(var(--warning-rgb),0.1)] text-[var(--warning)] border-[rgba(var(--warning-rgb),0.15)]",
  },
  URGENT: {
    label: "เร่งด่วน",
    cls: "bg-[rgba(var(--error-rgb),0.1)] text-[var(--error)] border-[rgba(var(--error-rgb),0.15)]",
  },
};

const CATEGORY_CONFIG: Record<TicketCategory, { label: string; cls: string; icon: typeof CreditCard }> = {
  BILLING: {
    label: "การเงิน/บิล",
    cls: "bg-purple-500/10 text-purple-400 border-purple-500/15",
    icon: CreditCard,
  },
  TECHNICAL: {
    label: "เทคนิค",
    cls: "bg-[rgba(var(--info-rgb),0.1)] text-[var(--info)] border-[rgba(var(--info-rgb),0.15)]",
    icon: Zap,
  },
  SENDER_NAME: {
    label: "ชื่อผู้ส่ง",
    cls: "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] border-[rgba(var(--accent-rgb),0.15)]",
    icon: Tag,
  },
  DELIVERY: {
    label: "การจัดส่ง SMS",
    cls: "bg-[rgba(var(--warning-rgb),0.1)] text-[var(--warning)] border-[rgba(var(--warning-rgb),0.15)]",
    icon: Send,
  },
  ACCOUNT: {
    label: "บัญชีผู้ใช้",
    cls: "bg-[rgba(var(--error-rgb),0.1)] text-[var(--error)] border-[rgba(var(--error-rgb),0.15)]",
    icon: User,
  },
  GENERAL: {
    label: "ทั่วไป",
    cls: "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)]",
    icon: HelpCircle,
  },
};

const FAQ_LINKS = [
  {
    icon: CreditCard,
    title: "วิธีเติมเครดิตและชำระเงิน",
    description: "ขั้นตอนเติมเครดิต, วิธีชำระเงิน, ใบเสร็จ/ใบกำกับภาษี",
    href: "/dashboard/support/kb#billing",
  },
  {
    icon: Shield,
    title: "การลงทะเบียนชื่อผู้ส่ง (Sender Name)",
    description: "ขั้นตอนลงทะเบียน, เอกสารที่ต้องใช้, ระยะเวลาอนุมัติ",
    href: "/dashboard/support/kb#sender-name",
  },
  {
    icon: Send,
    title: "ปัญหา SMS ส่งไม่ถึง",
    description: "สาเหตุที่พบบ่อย, วิธีตรวจสอบ, แนวทางแก้ไข",
    href: "/dashboard/support/kb#delivery",
  },
  {
    icon: FileText,
    title: "การใช้งาน API เบื้องต้น",
    description: "เริ่มต้นใช้งาน API, Authentication, ตัวอย่างโค้ด",
    href: "/dashboard/support/kb#api",
  },
  {
    icon: AlertTriangle,
    title: "ข้อจำกัดและ Rate Limit",
    description: "จำนวน SMS ต่อวินาที, ขนาดข้อความ, ข้อจำกัดอื่น ๆ",
    href: "/dashboard/support/kb#limits",
  },
  {
    icon: BookOpen,
    title: "นโยบายเนื้อหา SMS",
    description: "เนื้อหาที่อนุญาต/ไม่อนุญาต, แนวทางป้องกัน spam",
    href: "/dashboard/support/kb#content-policy",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "เมื่อสักครู่";
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  if (diffHour < 24) return `${diffHour} ชั่วโมงที่แล้ว`;
  if (diffDay < 7) return `${diffDay} วันที่แล้ว`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} สัปดาห์ที่แล้ว`;
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────

function TicketCardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4 bg-[var(--bg-elevated)]" />
          <Skeleton className="h-4 w-1/2 bg-[var(--bg-elevated)]" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full bg-[var(--bg-elevated)]" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16 rounded-full bg-[var(--bg-elevated)]" />
        <Skeleton className="h-5 w-20 rounded-full bg-[var(--bg-elevated)]" />
        <Skeleton className="h-4 w-24 bg-[var(--bg-elevated)]" />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <TicketCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function SupportPage() {
  const router = useRouter();

  // State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<TicketStatus | "ALL">("ALL");
  const [activeCategory, setActiveCategory] = useState<TicketCategory | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeStatus !== "ALL") params.set("status", activeStatus);
      if (activeCategory !== "ALL") params.set("category", activeCategory);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      params.set("page", String(currentPage));
      params.set("limit", "20");

      const res = await fetch(`/api/v1/tickets?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch tickets");

      const data = await res.json();
      setTickets(data.tickets ?? []);
      setPagination(data.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 0 });
    } catch {
      setTickets([]);
      setPagination({ total: 0, page: 1, limit: 20, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  }, [activeStatus, activeCategory, debouncedSearch, currentPage]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeStatus, activeCategory]);

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            ศูนย์ช่วยเหลือ
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            ส่งตั๋วสอบถาม ติดตามสถานะ และค้นหาคำตอบจากคำถามที่พบบ่อย
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/support/new")}
          className="h-10 gap-2 rounded-xl bg-[var(--accent)] px-5 font-semibold text-[var(--text-on-accent)] hover:opacity-90 shrink-0"
        >
          <Plus size={18} />
          สร้างตั๋วใหม่
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveStatus(tab.value)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              activeStatus === tab.value
                ? "bg-[var(--accent)] text-[var(--text-on-accent)]"
                : "text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาตั๋วจากหัวข้อ..."
            className="h-10 rounded-xl border-[var(--border-default)] bg-[var(--bg-surface)] pl-9 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
        <div className="flex gap-2">
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                "hidden sm:inline-flex shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border",
                activeCategory === cat.value
                  ? "border-[var(--accent)] bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)]"
                  : "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-[var(--border-subtle)] hover:text-[var(--text-secondary)]"
              )}
            >
              {cat.label}
            </button>
          ))}
          {/* Mobile category dropdown */}
          <div className="sm:hidden w-full">
            <CustomSelect
              value={activeCategory}
              onChange={(v) => setActiveCategory(v as TicketCategory | "ALL")}
              options={CATEGORY_OPTIONS.map((cat) => ({ value: cat.value, label: cat.label }))}
              placeholder="เลือกหมวดหมู่"
            />
          </div>
        </div>
      </div>

      {/* Ticket Count */}
      {!loading && (
        <p className="text-xs text-[var(--text-muted)]">
          {pagination.total > 0
            ? `แสดง ${(currentPage - 1) * pagination.limit + 1}-${Math.min(currentPage * pagination.limit, pagination.total)} จาก ${pagination.total} ตั๋ว`
            : "ไม่พบตั๋ว"}
        </p>
      )}

      {/* Ticket List */}
      {loading ? (
        <LoadingSkeleton />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          iconColor="var(--accent)"
          iconBg="rgba(var(--accent-rgb), 0.1)"
          iconBorder="rgba(var(--accent-rgb), 0.15)"
          title="ยังไม่มีตั๋วสนับสนุน"
          description={
            debouncedSearch || activeStatus !== "ALL" || activeCategory !== "ALL"
              ? "ไม่พบตั๋วที่ตรงกับเงื่อนไขที่เลือก\nลองเปลี่ยนตัวกรองหรือคำค้นหา"
              : "คุณยังไม่เคยส่งตั๋วสอบถาม\nหากมีปัญหาหรือข้อสงสัย สร้างตั๋วใหม่ได้เลย"
          }
          ctaLabel="สร้างตั๋วใหม่"
          ctaAction={() => router.push("/dashboard/support/new")}
          helpLabel="ดูคำถามที่พบบ่อย"
          helpAction={() => router.push("/dashboard/support/kb")}
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const status = STATUS_CONFIG[ticket.status];
            const priority = PRIORITY_CONFIG[ticket.priority];
            const category = CATEGORY_CONFIG[ticket.category];
            const CategoryIcon = category.icon;

            return (
              <button
                key={ticket.id}
                type="button"
                onClick={() => router.push(`/dashboard/support/${ticket.id}`)}
                className="group w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:p-5 text-left transition-all hover:border-[rgba(var(--accent-rgb),0.3)] hover:bg-[var(--bg-elevated)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1 focus:ring-offset-[var(--bg-base)]"
              >
                {/* Top row: subject + status badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate">
                      {ticket.subject}
                    </h3>
                    <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-1">
                      {ticket.description}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      status.cls
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                    {status.label}
                  </span>
                </div>

                {/* Bottom row: category + priority + meta */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Category badge */}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                      category.cls
                    )}
                  >
                    <CategoryIcon size={12} />
                    {category.label}
                  </span>

                  {/* Priority badge */}
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                      priority.cls
                    )}
                  >
                    {priority.label}
                  </span>

                  {/* Spacer */}
                  <span className="flex-1" />

                  {/* Reply count */}
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <MessageSquare size={12} />
                    {ticket._count.replies}
                  </span>

                  {/* Time ago */}
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <Clock size={12} />
                    {timeAgo(ticket.updatedAt)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--border-default)] pt-4">
          <p className="text-xs text-[var(--text-muted)]">
            หน้า {currentPage} จาก {pagination.totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="หน้าก่อนหน้า"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page numbers */}
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((page) => {
                if (pagination.totalPages <= 7) return true;
                if (page === 1 || page === pagination.totalPages) return true;
                if (Math.abs(page - currentPage) <= 1) return true;
                return false;
              })
              .reduce<(number | "ellipsis")[]>((acc, page, idx, arr) => {
                if (idx > 0) {
                  const prev = arr[idx - 1];
                  if (page - prev > 1) acc.push("ellipsis");
                }
                acc.push(page);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "ellipsis" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="flex h-8 w-8 items-center justify-center text-xs text-[var(--text-muted)]"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCurrentPage(item)}
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors",
                      currentPage === item
                        ? "bg-[var(--accent)] text-[var(--text-on-accent)]"
                        : "border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    {item}
                  </button>
                )
              )}

            <button
              type="button"
              disabled={currentPage >= pagination.totalPages}
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="หน้าถัดไป"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* FAQ Quick Links */}
      <section className="mt-4">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen size={18} className="text-[var(--accent)]" />
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            คำถามที่พบบ่อย
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FAQ_LINKS.map((faq) => {
            const FaqIcon = faq.icon;
            return (
              <button
                key={faq.href}
                type="button"
                onClick={() => router.push(faq.href)}
                className="group/faq flex items-start gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 text-left transition-all hover:border-[rgba(var(--accent-rgb),0.3)] hover:bg-[var(--bg-elevated)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1 focus:ring-offset-[var(--bg-base)]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(var(--accent-rgb),0.1)] border border-[rgba(var(--accent-rgb),0.15)]">
                  <FaqIcon size={18} className="text-[var(--accent)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-[var(--text-primary)] group-hover/faq:text-[var(--accent)] transition-colors flex items-center gap-1">
                    {faq.title}
                    <ExternalLink
                      size={12}
                      className="opacity-0 group-hover/faq:opacity-100 transition-opacity text-[var(--accent)]"
                    />
                  </h3>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)] line-clamp-2">
                    {faq.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
