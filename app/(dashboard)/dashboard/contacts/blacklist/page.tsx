"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { safeErrorMessage } from "@/lib/error-messages";
import EmptyState from "@/components/EmptyState";

// shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Icons
import {
  Search,
  Plus,
  Trash2,
  ShieldBan,
  Loader2,
  Ban,
  Phone,
  X,
} from "lucide-react";

// ==========================================
// Types
// ==========================================

interface BlacklistEntry {
  id: string;
  phone: string;
  reason: string | null;
  addedAt: string;
}

// ==========================================
// Constants
// ==========================================

const THAI_PHONE_REGEX = /^0\d{9}$/;

function formatPhone(phone: string): string {
  if (phone.length === 10) {
    return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
  }
  return phone;
}

function formatThaiDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ==========================================
// Main Component
// ==========================================

export default function BlacklistPage() {
  // Data state
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [phoneInput, setPhoneInput] = useState("");
  const [reasonInput, setReasonInput] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Search & filter
  const [searchQuery, setSearchQuery] = useState("");

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<BlacklistEntry | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ==========================================
  // Fetch blacklist
  // ==========================================

  const fetchBlacklist = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/v1/contacts/blacklist");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setEntries(data.entries ?? data ?? []);
    } catch (err) {
      toast.error(safeErrorMessage(err) || "โหลดบัญชีดำไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlacklist();
  }, [fetchBlacklist]);

  // ==========================================
  // Filtered entries
  // ==========================================

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.trim().toLowerCase();
    return entries.filter(
      (e) =>
        e.phone.includes(q) ||
        formatPhone(e.phone).includes(q) ||
        (e.reason && e.reason.toLowerCase().includes(q)),
    );
  }, [entries, searchQuery]);

  // ==========================================
  // Selection helpers
  // ==========================================

  const allVisibleSelected =
    filteredEntries.length > 0 &&
    filteredEntries.every((e) => selectedIds.has(e.id));

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEntries.map((e) => e.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ==========================================
  // Add to blacklist
  // ==========================================

  function validatePhone(value: string): boolean {
    const cleaned = value.replace(/[-\s]/g, "");
    if (!cleaned) {
      setPhoneError("กรุณากรอกเบอร์โทร");
      return false;
    }
    if (!THAI_PHONE_REGEX.test(cleaned)) {
      setPhoneError("เบอร์โทรไม่ถูกต้อง (เช่น 0891234567)");
      return false;
    }
    setPhoneError("");
    return true;
  }

  async function handleAdd() {
    const cleaned = phoneInput.replace(/[-\s]/g, "");
    if (!validatePhone(cleaned)) return;

    // Check duplicate
    if (entries.some((e) => e.phone === cleaned)) {
      setPhoneError("เบอร์นี้อยู่ในบัญชีดำแล้ว");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/v1/contacts/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleaned,
          reason: reasonInput.trim() || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(`เพิ่ม ${formatPhone(cleaned)} ในบัญชีดำแล้ว`);
      setPhoneInput("");
      setReasonInput("");
      setPhoneError("");
      await fetchBlacklist();
    } catch (err) {
      toast.error(safeErrorMessage(err) || "เพิ่มบัญชีดำไม่สำเร็จ");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ==========================================
  // Remove from blacklist
  // ==========================================

  async function handleRemove(entry: BlacklistEntry) {
    try {
      setIsDeleting(true);
      const res = await fetch("/api/v1/contacts/blacklist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: entry.phone }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(`นำ ${formatPhone(entry.phone)} ออกจากบัญชีดำแล้ว`);
      setDeleteTarget(null);
      await fetchBlacklist();
    } catch (err) {
      toast.error(safeErrorMessage(err) || "ลบบัญชีดำไม่สำเร็จ");
    } finally {
      setIsDeleting(false);
    }
  }

  // ==========================================
  // Bulk remove
  // ==========================================

  async function handleBulkRemove() {
    const toRemove = entries.filter((e) => selectedIds.has(e.id));
    if (toRemove.length === 0) return;

    try {
      setIsDeleting(true);
      const results = await Promise.allSettled(
        toRemove.map((entry) =>
          fetch("/api/v1/contacts/blacklist", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: entry.phone }),
          }),
        ),
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        toast.warning(`ลบสำเร็จ ${toRemove.length - failed} รายการ, ล้มเหลว ${failed} รายการ`);
      } else {
        toast.success(`ลบ ${toRemove.length} รายการออกจากบัญชีดำแล้ว`);
      }
      setSelectedIds(new Set());
      setShowBulkDeleteDialog(false);
      await fetchBlacklist();
    } catch (err) {
      toast.error(safeErrorMessage(err) || "ลบบัญชีดำไม่สำเร็จ");
    } finally {
      setIsDeleting(false);
    }
  }

  // ==========================================
  // Render
  // ==========================================

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          บัญชีดำ (Blacklist)
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          เบอร์โทรที่ถูกบล็อกจะไม่ได้รับ SMS
        </p>
      </div>

      {/* ── Stats Bar ── */}
      <div className="flex items-center gap-3">
        <Card className="bg-[var(--bg-surface)] border-[var(--border-default)]">
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-lg"
              style={{ backgroundColor: "rgba(242,54,69,0.12)" }}
            >
              <Ban size={18} className="text-[var(--error)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">เบอร์ที่ถูกบล็อก</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {isLoading ? "—" : entries.length.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Add to Blacklist Form ── */}
      <Card className="bg-[var(--bg-surface)] border-[var(--border-default)]">
        <CardContent className="p-4 md:p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <Plus size={16} className="text-[var(--accent)]" />
            เพิ่มเบอร์ในบัญชีดำ
          </h2>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <Input
                placeholder="เบอร์โทร เช่น 0891234567"
                value={phoneInput}
                onChange={(e) => {
                  setPhoneInput(e.target.value);
                  if (phoneError) setPhoneError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                }}
                className={`bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] ${
                  phoneError ? "border-[var(--error)] focus-visible:ring-[var(--error)]" : ""
                }`}
              />
              {phoneError && (
                <p className="text-xs text-[var(--error)]">{phoneError}</p>
              )}
            </div>
            <div className="flex-1">
              <Textarea
                placeholder="เหตุผล (ไม่บังคับ)"
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                rows={1}
                className="bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] min-h-[40px] resize-none"
              />
            </div>
            <Button
              onClick={handleAdd}
              disabled={isSubmitting}
              className="h-10 px-5 bg-[var(--error)] text-white hover:bg-[var(--error)]/90 font-semibold shrink-0"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                <ShieldBan size={16} className="mr-2" />
              )}
              เพิ่มบัญชีดำ
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Search + Bulk Actions ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <Input
            placeholder="ค้นหาเบอร์โทร..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {selectedIds.size > 0 && (
          <Button
            variant="outline"
            onClick={() => setShowBulkDeleteDialog(true)}
            className="border-[var(--error)] text-[var(--error)] hover:bg-[var(--error)]/10 shrink-0"
          >
            <Trash2 size={14} className="mr-2" />
            ลบที่เลือก ({selectedIds.size})
          </Button>
        )}
      </div>

      {/* ── Table / Content ── */}
      {isLoading ? (
        /* Loading skeleton */
        <Card className="bg-[var(--bg-surface)] border-[var(--border-default)]">
          <CardContent className="p-0">
            <div className="divide-y divide-[var(--border-default)]">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-4 h-4 rounded bg-[var(--bg-elevated)] animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-[var(--bg-elevated)] rounded animate-pulse" />
                    <div className="h-3 w-48 bg-[var(--bg-elevated)] rounded animate-pulse" />
                  </div>
                  <div className="h-3 w-24 bg-[var(--bg-elevated)] rounded animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredEntries.length === 0 && entries.length === 0 ? (
        /* Empty state — no entries at all */
        <EmptyState
          icon={ShieldBan}
          iconColor="var(--text-muted)"
          iconBg="rgba(138,149,160,0.1)"
          title="ยังไม่มีเบอร์ในบัญชีดำ"
          description="เบอร์ที่ถูกเพิ่มในบัญชีดำจะไม่ได้รับ SMS จากระบบ&#10;เพิ่มเบอร์ด้านบนเพื่อเริ่มต้น"
        />
      ) : filteredEntries.length === 0 ? (
        /* Empty search results */
        <EmptyState
          icon={Search}
          iconColor="var(--text-muted)"
          iconBg="rgba(138,149,160,0.1)"
          title="ไม่พบผลลัพธ์"
          description={`ไม่พบเบอร์ที่ตรงกับ "${searchQuery}"`}
          ctaLabel="ล้างการค้นหา"
          ctaAction={() => setSearchQuery("")}
        />
      ) : (
        <>
          {/* ── Desktop Table ── */}
          <div className="hidden md:block">
            <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-[var(--border-default)] hover:bg-transparent">
                    <TableHead className="w-[40px] text-[var(--text-muted)]">
                      <Checkbox
                        checked={allVisibleSelected}
                        onCheckedChange={toggleSelectAll}
                        className="border-[var(--border-default)] data-[state=checked]:bg-[var(--accent)] data-[state=checked]:border-[var(--accent)]"
                      />
                    </TableHead>
                    <TableHead className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider">
                      เบอร์โทร
                    </TableHead>
                    <TableHead className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider">
                      เหตุผล
                    </TableHead>
                    <TableHead className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider">
                      วันที่เพิ่ม
                    </TableHead>
                    <TableHead className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider w-[80px]">
                      จัดการ
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className="border-[var(--border-default)] hover:bg-[var(--bg-elevated)]/50 transition-colors"
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(entry.id)}
                          onCheckedChange={() => toggleSelect(entry.id)}
                          className="border-[var(--border-default)] data-[state=checked]:bg-[var(--accent)] data-[state=checked]:border-[var(--accent)]"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-[var(--text-muted)]" />
                          <span className="text-sm font-medium text-[var(--text-primary)] font-mono">
                            {formatPhone(entry.phone)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-[var(--text-secondary)]">
                          {entry.reason || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-[var(--text-muted)]">
                          {formatThaiDate(entry.addedAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(entry)}
                          className="text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 h-8 w-8 p-0"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* ── Mobile Cards ── */}
          <div className="md:hidden space-y-2">
            {/* Select all on mobile */}
            <div className="flex items-center gap-2 px-1">
              <Checkbox
                checked={allVisibleSelected}
                onCheckedChange={toggleSelectAll}
                className="border-[var(--border-default)] data-[state=checked]:bg-[var(--accent)] data-[state=checked]:border-[var(--accent)]"
              />
              <span className="text-xs text-[var(--text-muted)]">
                เลือกทั้งหมด ({filteredEntries.length})
              </span>
            </div>

            {filteredEntries.map((entry) => (
              <Card
                key={entry.id}
                className="bg-[var(--bg-surface)] border-[var(--border-default)]"
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedIds.has(entry.id)}
                      onCheckedChange={() => toggleSelect(entry.id)}
                      className="mt-1 border-[var(--border-default)] data-[state=checked]:bg-[var(--accent)] data-[state=checked]:border-[var(--accent)]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-[var(--text-muted)]" />
                          <span className="text-sm font-medium text-[var(--text-primary)] font-mono">
                            {formatPhone(entry.phone)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(entry)}
                          className="text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 h-7 w-7 p-0"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      {entry.reason && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">
                          {entry.reason}
                        </p>
                      )}
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {formatThaiDate(entry.addedAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ── Single Delete Confirmation ── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="bg-[var(--bg-elevated)] border-[var(--border-default)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[var(--text-primary)]">
              นำออกจากบัญชีดำ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--text-muted)]">
              เบอร์{" "}
              <span className="font-mono font-medium text-[var(--text-secondary)]">
                {deleteTarget ? formatPhone(deleteTarget.phone) : ""}
              </span>{" "}
              จะสามารถรับ SMS จากระบบได้อีกครั้ง
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]">
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleRemove(deleteTarget)}
              disabled={isDeleting}
              className="bg-[var(--error)] text-white hover:bg-[var(--error)]/90"
            >
              {isDeleting && <Loader2 size={14} className="animate-spin mr-2" />}
              นำออก
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Bulk Delete Confirmation ── */}
      <AlertDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
      >
        <AlertDialogContent className="bg-[var(--bg-elevated)] border-[var(--border-default)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[var(--text-primary)]">
              นำออกจากบัญชีดำ {selectedIds.size} รายการ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--text-muted)]">
              เบอร์ที่เลือกทั้งหมดจะสามารถรับ SMS จากระบบได้อีกครั้ง
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]">
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkRemove}
              disabled={isDeleting}
              className="bg-[var(--error)] text-white hover:bg-[var(--error)]/90"
            >
              {isDeleting && <Loader2 size={14} className="animate-spin mr-2" />}
              นำออกทั้งหมด
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
