"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Search, ArrowRight, Inbox, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import type { MessageItem, PaginationMeta } from "@/lib/types/api-responses";

const statusConfig: Record<string, { badge: string; label: string }> = {
  delivered: { badge: "bg-[rgba(16,185,129,0.08)] text-[#34D399] border-[rgba(16,185,129,0.2)]", label: "ส่งสำเร็จ" },
  sent:      { badge: "bg-[rgba(0,255,167,0.08)] text-[var(--accent)] border-[rgba(0,255,167,0.2)]", label: "ส่งแล้ว" },
  pending:   { badge: "bg-[rgba(245,158,11,0.08)] text-[#FBBF24] border-[rgba(245,158,11,0.2)]", label: "รอส่ง" },
  failed:    { badge: "bg-[rgba(239,68,68,0.08)] text-[#F87171] border-[rgba(239,68,68,0.2)]", label: "ล้มเหลว" },
};

const typeConfig: Record<string, string> = {
  SMS: "bg-[rgba(var(--accent-secondary-rgb,50,152,218),0.08)] text-[var(--accent-secondary)]",
  OTP: "bg-[rgba(0,255,167,0.08)] text-[var(--accent)]",
};

function detectType(content: string): "OTP" | "SMS" {
  return /^\d{4,8}$/.test(content.trim()) ? "OTP" : "SMS";
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

  const filtered = messages.filter((msg) => {
    const matchSearch =
      !search ||
      msg.recipient.includes(search) ||
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

  return (
    <div className="p-6 md:p-8 pb-20 md:pb-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">ประวัติการส่ง</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{total} รายการทั้งหมด</p>
        </div>
        <Link href="/dashboard/send">
          <Button className="bg-[var(--accent)] hover:bg-[#0AE99C] text-[var(--bg-base)] rounded-xl font-semibold gap-2">
            ส่ง SMS <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <Input
              type="text"
              className="pl-10 h-11 bg-[var(--bg-base)] border-[var(--border-subtle)] text-white placeholder:text-[var(--text-muted)] rounded-lg focus:border-[rgba(0,255,167,0.6)] focus:ring-[rgba(0,255,167,0.12)]"
              placeholder="ค้นหาเบอร์, เนื้อหา, ผู้ส่ง..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
            <SelectTrigger className="w-full sm:w-[140px] h-11 bg-[var(--bg-base)] border-[var(--border-subtle)] text-white rounded-lg">
              <SelectValue placeholder="ประเภท" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--bg-surface)] border-[var(--border-subtle)]">
              <SelectItem value="all">ทุกประเภท</SelectItem>
              <SelectItem value="SMS">SMS</SelectItem>
              <SelectItem value="OTP">OTP</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
            <SelectTrigger className="w-full sm:w-[160px] h-11 bg-[var(--bg-base)] border-[var(--border-subtle)] text-white rounded-lg">
              <SelectValue placeholder="สถานะ" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--bg-surface)] border-[var(--border-subtle)]">
              <SelectItem value="all">ทุกสถานะ</SelectItem>
              <SelectItem value="delivered">ส่งสำเร็จ</SelectItem>
              <SelectItem value="sent">ส่งแล้ว</SelectItem>
              <SelectItem value="pending">รอส่ง</SelectItem>
              <SelectItem value="failed">ล้มเหลว</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium">ตั้งแต่</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-sm w-full sm:w-[150px] bg-[var(--bg-base)] border-[var(--border-subtle)] text-white rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium">ถึง</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-sm w-full sm:w-[150px] bg-[var(--bg-base)] border-[var(--border-subtle)] text-white rounded-lg" />
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(""); setStatusFilter("all"); setTypeFilter("all"); setDateFrom(""); setDateTo(""); }}
              className="text-xs text-[var(--text-muted)] hover:text-white"
            >
              ล้างตัวกรอง
            </Button>
          )}
        </div>
      </div>

      {/* Data — Mobile Cards + Desktop Table */}
      {filtered.length > 0 ? (
        <>
        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {filtered.map((msg) => {
            const status = statusConfig[msg.status] ?? statusConfig.pending;
            const msgType = detectType(msg.content);
            return (
              <Card key={msg.id} className="bg-[var(--bg-surface)] border-[var(--border-subtle)] rounded-[16px]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white font-mono">{msg.recipient}</span>
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
                      <span className="font-mono">฿{msg.creditCost}</span>
                      <span>
                        {new Date(msg.createdAt).toLocaleString("th-TH", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Desktop Table */}
        <Card className="hidden md:block bg-[var(--bg-surface)] border-[var(--border-subtle)] rounded-[20px] overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[var(--bg-secondary)] border-none hover:bg-[var(--bg-secondary)]">
                  <TableHead className="text-xs uppercase text-[var(--text-secondary)] font-semibold tracking-[0.05em] whitespace-nowrap">เวลา</TableHead>
                  <TableHead className="text-xs uppercase text-[var(--text-secondary)] font-semibold tracking-[0.05em]">ผู้รับ</TableHead>
                  <TableHead className="text-xs uppercase text-[var(--text-secondary)] font-semibold tracking-[0.05em] hidden md:table-cell">เนื้อหา</TableHead>
                  <TableHead className="text-xs uppercase text-[var(--text-secondary)] font-semibold tracking-[0.05em] text-center hidden md:table-cell">ประเภท</TableHead>
                  <TableHead className="text-xs uppercase text-[var(--text-secondary)] font-semibold tracking-[0.05em] hidden lg:table-cell">ผู้ส่ง</TableHead>
                  <TableHead className="text-xs uppercase text-[var(--text-secondary)] font-semibold tracking-[0.05em] text-right">ราคา</TableHead>
                  <TableHead className="text-xs uppercase text-[var(--text-secondary)] font-semibold tracking-[0.05em] text-center">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((msg, i) => {
                  const status = statusConfig[msg.status] ?? statusConfig.pending;
                  const msgType = detectType(msg.content);
                  return (
                    <TableRow
                      key={msg.id}
                      className={`border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-colors duration-150 h-10 ${i % 2 === 1 ? "bg-[var(--bg-muted)]" : ""}`}
                    >
                      <TableCell className="text-xs text-[var(--text-muted)] whitespace-nowrap py-2">
                        {new Date(msg.createdAt).toLocaleString("th-TH", {
                          year: "2-digit", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-sm text-white font-mono py-2">{msg.recipient}</TableCell>
                      <TableCell className="hidden md:table-cell py-2">
                        <span className="text-xs text-[var(--text-muted)] truncate block max-w-[200px]" title={msg.content}>
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
                        <span className="text-xs text-[var(--text-muted)] font-mono">฿{msg.creditCost}</span>
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
          <div className="border-t border-[var(--border-subtle)] px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
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
                  className="w-9 h-9 rounded-lg border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
                            ? "bg-[rgba(0,255,167,0.08)] border border-[rgba(0,255,167,0.3)] text-[var(--accent)]"
                            : "border border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-white"
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
                  className="w-9 h-9 rounded-lg border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
                className="min-w-[44px] min-h-[44px] rounded-lg border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="min-w-[44px] min-h-[44px] rounded-lg border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        </>
      ) : messages.length > 0 ? (
        /* No filter results */
        <Card className="bg-[var(--bg-surface)] border-[var(--border-subtle)] rounded-[20px]">
          <CardContent className="p-12 text-center">
            <Search className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
            <p className="text-sm text-white mb-1">ไม่พบผลลัพธ์</p>
            <p className="text-xs text-[var(--text-muted)]">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
          </CardContent>
        </Card>
      ) : (
        /* Empty state */
        <Card className="bg-[var(--bg-surface)] border-[var(--border-subtle)] rounded-[20px]">
          <CardContent className="p-12 text-center">
            <Inbox className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
            <p className="text-lg font-semibold text-white mb-1">ยังไม่มีข้อความ</p>
            <p className="text-sm text-[var(--text-muted)] mb-5">ส่ง SMS ครั้งแรกเลย!</p>
            <Link href="/dashboard/send">
              <Button className="bg-[var(--accent)] hover:bg-[#0AE99C] text-[var(--bg-base)] rounded-xl font-semibold gap-2">
                ส่ง SMS <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
