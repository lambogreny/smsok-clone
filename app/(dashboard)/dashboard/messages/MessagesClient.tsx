"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import PillTabs from "@/components/ui/PillTabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Search, ArrowRight, Inbox, ChevronLeft, ChevronRight, MessageSquare, Download, SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import EmptyState from "@/components/EmptyState";
import { formatThaiDateTimeShort } from "@/lib/format-thai-date";
import type { MessageItem, PaginationMeta } from "@/lib/types/api-responses";
import { toCsvCell } from "@/lib/csv";

const statusConfig: Record<string, { badge: string; label: string }> = {
  delivered: { badge: "bg-[rgba(var(--success-rgb),0.08)] text-[var(--success)] border-[rgba(var(--success-rgb),0.2)]", label: "ส่งสำเร็จ" },
  sent:      { badge: "bg-[rgba(var(--accent-rgb),0.08)] text-[var(--accent)] border-[rgba(var(--accent-rgb),0.2)]", label: "ส่งแล้ว" },
  pending:   { badge: "bg-[rgba(var(--warning-rgb),0.08)] text-[var(--warning)] border-[rgba(var(--warning-rgb),0.2)]", label: "รอส่ง" },
  failed:    { badge: "bg-[rgba(var(--error-rgb),0.08)] text-[var(--error)] border-[rgba(var(--error-rgb),0.2)]", label: "ล้มเหลว" },
};

const typeConfig: Record<string, string> = {
  SMS: "bg-[rgba(var(--accent-blue-rgb),0.08)] text-[var(--accent-secondary)]",
  OTP: "bg-[rgba(var(--accent-rgb),0.08)] text-[var(--accent)]",
};

function detectType(content: string): "OTP" | "SMS" {
  return /^\d{4,8}$/.test(content.trim()) ? "OTP" : "SMS";
}

function formatDisplayPhone(phone: string): string {
  if (phone.startsWith("+66") && phone.length >= 11) {
    return "0" + phone.slice(3);
  }
  return phone;
}

export default function MessagesClient({
  messages,
  pagination,
  initialSearch,
}: {
  messages: MessageItem[];
  pagination: PaginationMeta;
  initialSearch?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch ?? "");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const filtered = messages.filter((msg) => {
    const matchSearch =
      !search ||
      msg.recipient.includes(search) ||
      formatDisplayPhone(msg.recipient).includes(search) ||
      msg.content.toLowerCase().includes(search.toLowerCase()) ||
      msg.senderName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || msg.status === statusFilter;
    const matchType = typeFilter === "all" || detectType(msg.content) === typeFilter;
    const msgDate = new Date(msg.createdAt);
    const matchDateFrom = !dateFrom || msgDate >= new Date(dateFrom);
    const matchDateTo = !dateTo || msgDate <= new Date(dateTo + "T23:59:59");
    return matchSearch && matchStatus && matchType && matchDateFrom && matchDateTo;
  });

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`?${params.toString()}`);
  }

  const { page, limit, total, totalPages } = pagination;
  const showingFrom = Math.min((page - 1) * limit + 1, total);
  const showingTo = Math.min(page * limit, total);

  const hasFilters = dateFrom || dateTo || search || statusFilter !== "all" || typeFilter !== "all";

  function handleExportCsv() {
    const rows = [
      ["วันที่", "ผู้รับ", "เนื้อหา", "ผู้ส่ง", "สถานะ", "ราคา (SMS)"].map(toCsvCell),
      ...filtered.map((msg) => [
        toCsvCell(new Date(msg.createdAt).toISOString()),
        toCsvCell(formatDisplayPhone(msg.recipient)),
        toCsvCell(msg.content),
        toCsvCell(msg.senderName),
        toCsvCell(msg.status),
        toCsvCell(msg.creditCost),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smsok-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">ประวัติการส่ง</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{total} รายการทั้งหมด</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            className="border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] rounded-lg gap-2"
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Link href="/dashboard/send">
            <Button className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--text-on-accent)] rounded-lg font-semibold gap-2">
              ส่ง SMS <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="relative flex-1 flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1">ค้นหา</span>
            <label className="relative flex items-center cursor-text">
              <Search className="absolute left-3 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
              <Input
                type="text"
                className="pl-10 h-9 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(var(--accent-rgb),0.12)]"
                placeholder="ค้นหาเบอร์, เนื้อหา, ผู้ส่ง..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
          {/* Mobile: Filter button → Sheet */}
          <button
            type="button"
            onClick={() => setFilterSheetOpen(true)}
            className="sm:hidden inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-lg border border-[var(--border-default)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
          >
            <SlidersHorizontal size={16} />
            ตัวกรอง
            {hasFilters && (
              <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            )}
          </button>
          {/* Desktop: inline filters */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1">ประเภท</span>
              <PillTabs
                value={typeFilter}
                onChange={setTypeFilter}
                label="กรองตามประเภทข้อความ"
                options={[
                  { value: "all", label: "ทั้งหมด" },
                  { value: "SMS", label: "SMS" },
                  { value: "OTP", label: "OTP" },
                ]}
              />
            </div>
            <div className="w-px h-8 bg-[var(--border-default)] self-end mb-1" />
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1">สถานะ</span>
              <PillTabs
                value={statusFilter}
                onChange={setStatusFilter}
                label="กรองตามสถานะ"
                options={[
                  { value: "all", label: "ทุกสถานะ" },
                  { value: "delivered", label: "สำเร็จ" },
                  { value: "sent", label: "ส่งแล้ว" },
                  { value: "pending", label: "รอส่ง" },
                  { value: "failed", label: "ล้มเหลว" },
                ]}
              />
            </div>
          </div>
        </div>
        {/* Desktop: date filters */}
        <div className="hidden sm:flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1">ตั้งแต่</span>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} onClick={(e) => { try { (e.currentTarget as HTMLInputElement).showPicker(); } catch {} }} className="h-9 text-sm w-[150px] bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] rounded-lg focus:border-[rgba(var(--accent-rgb),0.6)] [color-scheme:dark] cursor-pointer" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1">ถึง</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} onClick={(e) => { try { (e.currentTarget as HTMLInputElement).showPicker(); } catch {} }} className="h-9 text-sm w-[150px] bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] rounded-lg focus:border-[rgba(var(--accent-rgb),0.6)] [color-scheme:dark] cursor-pointer" />
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(""); setStatusFilter("all"); setTypeFilter("all"); setDateFrom(""); setDateTo(""); }}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              ล้างตัวกรอง
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>ตัวกรอง</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2 block">ประเภท</label>
              <PillTabs
                value={typeFilter}
                onChange={setTypeFilter}
                label="กรองตามประเภทข้อความ"
                options={[
                  { value: "all", label: "ทั้งหมด" },
                  { value: "SMS", label: "SMS" },
                  { value: "OTP", label: "OTP" },
                ]}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2 block">สถานะ</label>
              <PillTabs
                value={statusFilter}
                onChange={setStatusFilter}
                label="กรองตามสถานะ"
                options={[
                  { value: "all", label: "ทุกสถานะ" },
                  { value: "delivered", label: "สำเร็จ" },
                  { value: "sent", label: "ส่งแล้ว" },
                  { value: "pending", label: "รอส่ง" },
                  { value: "failed", label: "ล้มเหลว" },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2 block">ตั้งแต่</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} onClick={(e) => { try { (e.currentTarget as HTMLInputElement).showPicker(); } catch {} }} className="h-11 text-sm bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] rounded-lg [color-scheme:dark] cursor-pointer" />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2 block">ถึง</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} onClick={(e) => { try { (e.currentTarget as HTMLInputElement).showPicker(); } catch {} }} className="h-11 text-sm bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] rounded-lg [color-scheme:dark] cursor-pointer" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              {hasFilters && (
                <Button
                  variant="ghost"
                  className="flex-1 text-[var(--text-muted)]"
                  onClick={() => { setStatusFilter("all"); setTypeFilter("all"); setDateFrom(""); setDateTo(""); }}
                >
                  ล้างทั้งหมด
                </Button>
              )}
              <Button
                className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--text-on-accent)]"
                onClick={() => setFilterSheetOpen(false)}
              >
                ดูผลลัพธ์
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Data — Mobile Cards + Desktop Table */}
      {filtered.length > 0 ? (
        <>
        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {filtered.map((msg) => {
            const status = statusConfig[msg.status] ?? statusConfig.pending;
            const msgType = detectType(msg.content);
            return (
              <Card key={msg.id} className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[var(--text-primary)] font-mono">{formatDisplayPhone(msg.recipient)}</span>
                    <Badge variant="outline" className={`text-[11px] px-2.5 py-0.5 rounded-full border ${status.badge}`}>
                      {status.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mb-3 line-clamp-2">{msg.content}</p>
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${typeConfig[msgType]}`}>
                        {msgType}
                      </Badge>
                      <span>{msg.senderName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono">{msg.creditCost} SMS</span>
                      <span>
                        {formatThaiDateTimeShort(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Desktop Table */}
        <Card className="hidden md:block bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[var(--table-header)] border-none hover:bg-[var(--table-header)]">
                  <TableHead className="text-[12px] uppercase text-[var(--text-muted)] font-semibold tracking-[0.05em] whitespace-nowrap">เวลา</TableHead>
                  <TableHead className="text-[12px] uppercase text-[var(--text-muted)] font-semibold tracking-[0.05em]">ผู้รับ</TableHead>
                  <TableHead className="text-[12px] uppercase text-[var(--text-muted)] font-semibold tracking-[0.05em] hidden md:table-cell">เนื้อหา</TableHead>
                  <TableHead className="text-[12px] uppercase text-[var(--text-muted)] font-semibold tracking-[0.05em] text-center hidden md:table-cell">ประเภท</TableHead>
                  <TableHead className="text-[12px] uppercase text-[var(--text-muted)] font-semibold tracking-[0.05em] hidden lg:table-cell">ผู้ส่ง</TableHead>
                  <TableHead className="text-[12px] uppercase text-[var(--text-muted)] font-semibold tracking-[0.05em] text-right">ราคา</TableHead>
                  <TableHead className="text-[12px] uppercase text-[var(--text-muted)] font-semibold tracking-[0.05em] text-center">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((msg, i) => {
                  const status = statusConfig[msg.status] ?? statusConfig.pending;
                  const msgType = detectType(msg.content);
                  return (
                    <TableRow
                      key={msg.id}
                      className={`border-b border-[var(--border-default)] hover:bg-[var(--bg-elevated)] transition-colors duration-150 h-10 ${i % 2 === 1 ? "bg-[var(--table-alt-row)]" : "bg-transparent"}`}
                    >
                      <TableCell className="text-xs text-[var(--text-muted)] whitespace-nowrap py-2">
                        {formatThaiDateTimeShort(msg.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm text-[var(--text-primary)] font-mono py-2">{formatDisplayPhone(msg.recipient)}</TableCell>
                      <TableCell className="hidden md:table-cell py-2">
                        <span className="text-xs text-[var(--text-muted)] truncate block max-w-[150px] lg:max-w-[300px]" title={msg.content}>
                          {msg.content.length > 40 ? `${msg.content.slice(0, 40)}...` : msg.content}
                        </span>
                      </TableCell>
                      <TableCell className="text-center hidden md:table-cell py-2">
                        <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${typeConfig[msgType]}`}>
                          {msgType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-[var(--text-muted)] hidden lg:table-cell py-2">{msg.senderName}</TableCell>
                      <TableCell className="text-right py-2">
                        <span className="text-xs text-[var(--text-muted)] font-mono">{msg.creditCost} SMS</span>
                      </TableCell>
                      <TableCell className="text-center py-2">
                        <Badge variant="outline" className={`text-[11px] px-2.5 py-0.5 rounded-full border ${status.badge}`}>
                          {status.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="border-t border-[var(--border-default)] px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
            <span>
              {hasFilters
                ? `กรอง: พบ ${filtered.length} รายการ จากหน้านี้ (${showingFrom}–${showingTo} จาก ${total} ทั้งหมด)`
                : `แสดง ${showingFrom}–${showingTo} จาก ${total} รายการ`}
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="w-9 h-9 rounded-lg border border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p: number;
                    if (totalPages <= 5) p = i + 1;
                    else if (page <= 3) p = i + 1;
                    else if (page >= totalPages - 2) p = totalPages - 4 + i;
                    else p = page - 2 + i;
                    return (
                      <button
                        key={p}
                        onClick={() => goToPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          p === page
                            ? "bg-[rgba(var(--accent-rgb),0.08)] border border-[rgba(var(--accent-rgb),0.3)] text-[var(--accent)]"
                            : "border border-[var(--border-default)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <span className="sm:hidden text-[var(--text-muted)]">หน้า {page}/{totalPages}</span>

                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="w-9 h-9 rounded-lg border border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="md:hidden flex items-center justify-between px-1 py-3 text-xs text-[var(--text-muted)]">
            <span>หน้า {page}/{totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="min-w-[44px] min-h-[44px] rounded-lg border border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="min-w-[44px] min-h-[44px] rounded-lg border border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        </>
      ) : messages.length > 0 ? (
        /* No filter results */
        <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
          <CardContent className="p-12 text-center">
            <Search className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
            <p className="text-sm text-[var(--text-primary)] mb-1">ไม่พบผลลัพธ์</p>
            <p className="text-xs text-[var(--text-muted)]">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
          </CardContent>
        </Card>
      ) : (
        /* Empty state */
        <EmptyState
          icon={MessageSquare}
          iconColor="var(--accent)"
          iconBg="rgba(var(--accent-rgb),0.08)"
          iconBorder="rgba(var(--accent-rgb),0.15)"
          title="ยังไม่เคยส่ง SMS"
          description="ส่ง SMS ข้อความแรกของคุณเลย!"
          ctaLabel="ส่ง SMS แรก"
          ctaAction={() => router.push("/dashboard/send")}
          helpLabel="ดูวิธีใช้งาน"
          helpAction={() => router.push("/help")}
        />
      )}
    </div>
  );
}
