"use client";

import { useState, useTransition, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { removeContactFromGroup, bulkRemoveFromGroup, getContactsNotInGroup } from "@/lib/actions/groups";
import { importContacts, addContactsToGroup } from "@/lib/actions/contacts";
import { safeErrorMessage } from "@/lib/error-messages";
import { useToast } from "@/app/components/ui/Toast";
import { formatThaiDateOnly, formatPhone } from "@/lib/format-thai-date";
import { getTagColor, parseTags } from "@/lib/tag-utils";
import type { GroupDetailMember, GroupDetailContactStub } from "@/lib/types/api-responses";

// shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Icons
import {
  ArrowLeft,
  Search,
  Upload,
  Plus,
  X,
  Trash2,
  Users,
  Loader2,
  UserPlus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ==========================================
// Types
// ==========================================

type Member = GroupDetailMember;
type ContactStub = GroupDetailContactStub;

// ==========================================
// Constants
// ==========================================

const PAGE_SIZE = 20;

// ==========================================
// Main Component
// ==========================================

export default function GroupDetailClient({
  groupId,
  groupName,
  memberCount,
  createdAt,
  initialMembers,
  availableContacts,
}: {
  groupId: string;
  groupName: string;
  memberCount: number;
  createdAt: string;
  initialMembers: Member[];
  availableContacts: ContactStub[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Add to Group dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [addSelectedIds, setAddSelectedIds] = useState<Set<string>>(new Set());
  const [addTagFilters, setAddTagFilters] = useState<Set<string>>(new Set());

  // Server-side contact search (replaces loading all contacts upfront)
  const [searchedAvailable, setSearchedAvailable] = useState<ContactStub[]>(availableContacts);
  const [contactsLoading, setContactsLoading] = useState(false);

  // Import CSV
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<
    { name: string; phone: string; valid: boolean }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // Server-side contact search (debounced)
  // ==========================================

  useEffect(() => {
    if (!showAddDialog) return;

    // Only fetch from server when user is actively searching
    if (!addSearch.trim()) {
      setSearchedAvailable(availableContacts);
      return;
    }

    setContactsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await getContactsNotInGroup(groupId, addSearch);
        setSearchedAvailable(results as ContactStub[]);
      } catch {
        // fallback to initial data on error
      } finally {
        setContactsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [showAddDialog, addSearch, groupId, availableContacts]);

  // ==========================================
  // Derived — Members
  // ==========================================

  const memberContactIds = useMemo(
    () => new Set(members.map((m) => m.contactId)),
    [members],
  );

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase().trim();
    return members.filter(
      (m) => m.name.toLowerCase().includes(q) || m.phone.includes(q),
    );
  }, [members, search]);

  const totalPages = Math.ceil(filteredMembers.length / PAGE_SIZE);
  const paginatedMembers = filteredMembers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const allSelected =
    paginatedMembers.length > 0 &&
    paginatedMembers.every((m) => selectedIds.has(m.contactId));

  // ==========================================
  // Derived — Add Dialog (tags + filter)
  // ==========================================

  const allAvailableTags = useMemo(() => {
    const tagMap = new Map<string, number>();
    searchedAvailable.forEach((c) => {
      parseTags(c.tags).forEach((tag) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });
    return tagMap;
  }, [searchedAvailable]);

  const filteredAvailable = useMemo(() => {
    return searchedAvailable.filter((c) => {
      if (memberContactIds.has(c.id)) return false;

      if (addTagFilters.size > 0) {
        const contactTags = parseTags(c.tags);
        for (const tag of addTagFilters) {
          if (!contactTags.includes(tag)) return false;
        }
      }

      return true;
    });
  }, [searchedAvailable, memberContactIds, addTagFilters]);

  const allAddSelected =
    filteredAvailable.length > 0 &&
    filteredAvailable.every((c) => addSelectedIds.has(c.id));

  // ==========================================
  // Handlers — Members
  // ==========================================

  function toggleSelect(contactId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(contactId)) next.delete(contactId);
      else next.add(contactId);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedMembers.map((m) => m.contactId)));
  }

  function handleBulkRemove() {
    if (selectedIds.size === 0) return;
    startTransition(async () => {
      try {
        await bulkRemoveFromGroup(groupId, Array.from(selectedIds));
        setMembers((prev) =>
          prev.filter((m) => !selectedIds.has(m.contactId)),
        );
        toast(
          "success",
          `ลบ ${selectedIds.size} รายชื่อออกจากกลุ่มสำเร็จ`,
        );
        setSelectedIds(new Set());
      } catch (e) {
        toast("error", safeErrorMessage(e));
      }
    });
  }

  function handleRemoveSingle(member: Member) {
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    startTransition(async () => {
      try {
        await removeContactFromGroup(groupId, member.contactId);
      } catch (e) {
        setMembers((prev) => [...prev, member]);
        toast("error", safeErrorMessage(e));
      }
    });
  }

  // ==========================================
  // Handlers — Add Dialog
  // ==========================================

  function openAddDialog() {
    setShowAddDialog(true);
    setAddSearch("");
    setAddSelectedIds(new Set());
    setAddTagFilters(new Set());
    setShowImportPreview(false);
    setImportPreviewData([]);
  }

  function toggleAddSelect(id: string) {
    setAddSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAddSelectAll() {
    if (allAddSelected) setAddSelectedIds(new Set());
    else setAddSelectedIds(new Set(filteredAvailable.map((c) => c.id)));
  }

  function toggleTagFilter(tag: string) {
    setAddTagFilters((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  function handleAddToGroup() {
    if (addSelectedIds.size === 0) return;
    startTransition(async () => {
      try {
        await addContactsToGroup(groupId, Array.from(addSelectedIds));
        toast(
          "success",
          `เพิ่ม ${addSelectedIds.size} รายชื่อเข้ากลุ่มสำเร็จ`,
        );
        setShowAddDialog(false);
        setAddSelectedIds(new Set());
        setAddSearch("");
        setAddTagFilters(new Set());
        router.refresh();
      } catch (e) {
        toast("error", safeErrorMessage(e));
      }
    });
  }

  // ==========================================
  // Handlers — CSV Import
  // ==========================================

  function parseCSV(
    text: string,
  ): { name: string; phone: string; valid: boolean }[] {
    const lines = text.split("\n").filter(Boolean);
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const nameIdx = headers.findIndex(
      (h) => h === "name" || h === "ชื่อ",
    );
    const phoneIdx = headers.findIndex(
      (h) => h === "phone" || h === "เบอร์โทร" || h === "tel",
    );
    if (nameIdx === -1 || phoneIdx === -1) return [];

    return lines
      .slice(1)
      .map((line) => {
        const cols = line.split(",").map((c) => c.trim());
        const name = cols[nameIdx] || "";
        const phone = cols[phoneIdx] || "";
        const valid = !!name && /^0[0-9]{9}$/.test(phone);
        return { name, phone, valid };
      })
      .filter((c) => c.name || c.phone);
  }

  function handleCSVFile(
    e: React.ChangeEvent<HTMLInputElement>,
    inModal: boolean,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      let text = evt.target?.result as string;
      if (!text) return;
      // Strip UTF-8 BOM (common in Thai Excel/CSV exports) and normalize line endings
      text = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");

      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast(
          "error",
          "ไฟล์ CSV ต้องมีหัวข้อ name, phone และข้อมูลอย่างน้อย 1 แถว",
        );
        return;
      }

      if (inModal) {
        setImportPreviewData(parsed);
        setShowImportPreview(true);
      } else {
        const contacts = parsed
          .filter((c) => c.valid)
          .map((c) => ({ name: c.name, phone: c.phone }));
        if (contacts.length === 0) {
          toast("error", "ไม่พบข้อมูลที่ถูกต้อง");
          return;
        }
        startTransition(async () => {
          try {
            const result = await importContacts(contacts);
            toast(
              "success",
              `นำเข้า ${result.imported} รายชื่อ${result.skipped > 0 ? ` (ซ้ำ ${result.skipped})` : ""}`,
            );
            router.refresh();
          } catch (err) {
            toast(
              "error",
              err instanceof Error ? err.message : "นำเข้าไม่สำเร็จ",
            );
          }
        });
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = "";
  }

  function handleConfirmImportPreview() {
    const contacts = importPreviewData
      .filter((c) => c.valid)
      .map((c) => ({ name: c.name, phone: c.phone }));
    if (contacts.length === 0) {
      toast("error", "ไม่มีรายชื่อที่ถูกต้อง");
      return;
    }
    startTransition(async () => {
      try {
        const result = await importContacts(contacts);
        if (result.imported > 0) {
          toast(
            "success",
            `นำเข้า ${result.imported} รายชื่อเข้ากลุ่มสำเร็จ${result.skipped > 0 ? ` (ซ้ำ ${result.skipped})` : ""}`,
          );
        }
        setShowImportPreview(false);
        setImportPreviewData([]);
        setShowAddDialog(false);
        router.refresh();
      } catch (err) {
        toast(
          "error",
          err instanceof Error ? err.message : "นำเข้าไม่สำเร็จ",
        );
      }
    });
  }

  // ==========================================
  // Render
  // ==========================================

  return (
    <div className="p-4 md:p-8 pb-20 md:pb-8">
      {/* Back Link */}
      <Link
        href="/dashboard/groups"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-4"
      >
        <ArrowLeft className="w-3 h-3" />
        กลับไปหน้ากลุ่ม
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[rgba(var(--accent-rgb),0.08)] border border-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center text-[var(--accent)]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {groupName}
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              {members.length} สมาชิก &middot; สร้างเมื่อ{" "}
              {formatThaiDateOnly(createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => handleCSVFile(e, false)}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="border-[var(--border-default)] bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[rgba(var(--accent-rgb),0.3)]"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            นำเข้า CSV
          </Button>
          <Button
            onClick={openAddDialog}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            เพิ่มรายชื่อ
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <Input
          type="text"
          placeholder="ค้นหาชื่อ หรือ เบอร์โทร..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-10 h-11 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(var(--accent-rgb),0.12)]"
        />
      </div>

      {/* Batch Actions Bar */}
      {selectedIds.size > 0 && (
        <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg p-4 mb-4 flex items-center gap-3 flex-wrap">
          <span className="text-sm text-[var(--text-primary)] font-medium">
            เลือก {selectedIds.size} รายชื่อ
          </span>
          <div className="h-4 w-px bg-[var(--border-subtle)]" />
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkRemove}
            disabled={isPending}
            className="border-[rgba(var(--error-rgb,239,68,68),0.2)] bg-[rgba(var(--error-rgb,239,68,68),0.1)] text-[var(--error)] hover:bg-[rgba(var(--error-rgb,239,68,68),0.15)] hover:text-[var(--error)]"
          >
            {isPending ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3 mr-1" />
            )}
            ลบออกจากกลุ่ม
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            ยกเลิก
          </Button>
        </Card>
      )}

      {/* Members Table — Desktop */}
      {paginatedMembers.length > 0 ? (
        <>
          <Card className="hidden md:block bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[var(--border-default)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]">
                  <TableHead className="w-10 px-3">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="text-xs text-[var(--text-secondary)] uppercase tracking-[0.05em] font-semibold">
                    ชื่อ
                  </TableHead>
                  <TableHead className="text-xs text-[var(--text-secondary)] uppercase tracking-[0.05em] font-semibold">
                    เบอร์โทร
                  </TableHead>
                  <TableHead className="text-xs text-[var(--text-secondary)] uppercase tracking-[0.05em] font-semibold">
                    อีเมล
                  </TableHead>
                  <TableHead className="w-20 text-xs text-[var(--text-secondary)] uppercase tracking-[0.05em] font-semibold text-right">
                    จัดการ
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMembers.map((m, i) => (
                  <TableRow
                    key={m.id}
                    className={`border-b border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)] transition-colors group ${
                      i % 2 === 1 ? "bg-[var(--bg-muted)]" : "bg-[var(--bg-surface)]"
                    } ${selectedIds.has(m.contactId) ? "bg-[rgba(var(--accent-rgb),0.04)]" : ""}`}
                  >
                    <TableCell className="px-3">
                      <Checkbox
                        checked={selectedIds.has(m.contactId)}
                        onCheckedChange={() => toggleSelect(m.contactId)}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-[var(--text-primary)] font-medium">
                      {m.name}
                    </TableCell>
                    <TableCell className="text-sm text-[var(--text-muted)] font-mono">
                      {formatPhone(m.phone)}
                    </TableCell>
                    <TableCell className="text-sm text-[var(--text-muted)]">
                      {m.email || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => handleRemoveSingle(m)}
                        disabled={isPending}
                        className="w-7 h-7 rounded-lg hover:bg-[rgba(var(--error-rgb,239,68,68),0.06)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--error)] transition-colors opacity-0 group-hover:opacity-100 ml-auto disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {filteredMembers.length > PAGE_SIZE && (
              <div className="px-5 py-4 border-t border-[var(--border-default)] flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">
                  แสดง {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, filteredMembers.length)} จาก{" "}
                  {filteredMembers.length}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="border-[var(--border-default)] bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50"
                  >
                    <ChevronLeft className="w-3 h-3 mr-1" />
                    ก่อนหน้า
                  </Button>
                  <span className="px-3 py-1.5 text-xs text-[var(--text-muted)]">
                    {page}/{totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page >= totalPages}
                    className="border-[var(--border-default)] bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50"
                  >
                    ถัดไป
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Members Cards — Mobile */}
          <div className="md:hidden space-y-3">
            {paginatedMembers.map((m) => (
              <Card
                key={m.id}
                className={`bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg p-4 ${
                  selectedIds.has(m.contactId)
                    ? "border-[rgba(var(--accent-rgb),0.3)]"
                    : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIds.has(m.contactId)}
                    onCheckedChange={() => toggleSelect(m.contactId)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[var(--text-primary)]">
                      {m.name}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                      {formatPhone(m.phone)}
                    </div>
                    {m.email && (
                      <div className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                        {m.email}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveSingle(m)}
                    disabled={isPending}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}

            {/* Mobile pagination */}
            {filteredMembers.length > PAGE_SIZE && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[var(--text-muted)]">
                  {page}/{totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="border-[var(--border-default)] bg-transparent text-[var(--text-muted)] disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page >= totalPages}
                    className="border-[var(--border-default)] bg-transparent text-[var(--text-muted)] disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : members.length > 0 ? (
        /* Search no results */
        <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg p-8 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            ไม่พบรายชื่อที่ตรงกับการค้นหา
          </p>
          <button
            onClick={() => setSearch("")}
            className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] mt-2 transition-colors"
          >
            ล้างตัวกรอง
          </button>
        </Card>
      ) : (
        /* Empty state */
        <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(var(--accent-rgb),0.08)] border border-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-[var(--accent)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            ยังไม่มีสมาชิก
          </h3>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            เพิ่มรายชื่อเข้ากลุ่มเพื่อส่ง SMS เป็นหมวดหมู่
          </p>
          <Button
            onClick={openAddDialog}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            เพิ่มรายชื่อ
          </Button>
        </Card>
      )}

      {/* ==========================================
          ADD TO GROUP DIALOG
          ========================================== */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg sm:max-w-[560px] flex flex-col max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)] text-lg">
              เพิ่มรายชื่อเข้ากลุ่ม
            </DialogTitle>
            <DialogDescription className="text-[var(--text-muted)]">
              เลือกรายชื่อที่ยังไม่อยู่ใน &ldquo;{groupName}&rdquo;
            </DialogDescription>
          </DialogHeader>

          {/* Import Preview Overlay */}
          {showImportPreview ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="pb-3">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                  ตรวจสอบข้อมูล CSV
                </h4>
                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    ถูกต้อง {importPreviewData.filter((c) => c.valid).length}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[var(--error)]" />
                    ไม่ถูกต้อง{" "}
                    {importPreviewData.filter((c) => !c.valid).length}
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[300px] space-y-1">
                {importPreviewData.map((row, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                      row.valid
                        ? "bg-[rgba(255,255,255,0.02)]"
                        : "bg-[rgba(var(--error-rgb,239,68,68),0.05)] border border-[rgba(var(--error-rgb,239,68,68),0.1)]"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${row.valid ? "bg-emerald-400" : "bg-[var(--error)]"}`}
                    />
                    <span className="text-[var(--text-primary)] truncate flex-1">
                      {row.name || "—"}
                    </span>
                    <span className="text-[var(--text-muted)] font-mono text-xs">
                      {row.phone || "—"}
                    </span>
                    {!row.valid && (
                      <span className="text-[10px] text-[var(--error)] shrink-0">
                        ไม่ถูกต้อง
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <DialogFooter className="gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImportPreview(false);
                    setImportPreviewData([]);
                  }}
                  className="border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent"
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleConfirmImportPreview}
                  disabled={
                    isPending ||
                    importPreviewData.filter((c) => c.valid).length === 0
                  }
                  className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold"
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      กำลังนำเข้า...
                    </span>
                  ) : (
                    `นำเข้า ${importPreviewData.filter((c) => c.valid).length} รายชื่อ`
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              {/* Search + CSV button */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <Input
                    type="text"
                    placeholder="ค้นหาชื่อ หรือ เบอร์..."
                    value={addSearch}
                    onChange={(e) => setAddSearch(e.target.value)}
                    autoFocus
                    className="pl-10 h-10 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg text-sm focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(var(--accent-rgb),0.12)]"
                  />
                </div>
                <input
                  ref={modalFileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleCSVFile(e, true)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => modalFileInputRef.current?.click()}
                  className="border-[var(--border-default)] bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0"
                >
                  <Upload className="w-3 h-3 mr-1" />
                  CSV
                </Button>
              </div>

              {/* Tag Filter Chips */}
              {allAvailableTags.size > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(allAvailableTags.entries()).map(
                    ([tag, count]) => {
                      const color = getTagColor(tag);
                      const isActive = addTagFilters.has(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleTagFilter(tag)}
                          className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider transition-all border ${
                            isActive
                              ? `${color.activeBg} ${color.text} ${color.border}`
                              : "bg-[rgba(255,255,255,0.04)] text-[var(--text-muted)] border-transparent hover:bg-[rgba(255,255,255,0.08)]"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isActive ? color.dot : "bg-[rgba(255,255,255,0.2)]"}`}
                          />
                          {tag}
                          <span className="text-[9px] opacity-60">
                            {count}
                          </span>
                        </button>
                      );
                    },
                  )}
                  {addTagFilters.size > 0 && (
                    <button
                      onClick={() => setAddTagFilters(new Set())}
                      className="text-[10px] px-2 py-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      ล้างทั้งหมด
                    </button>
                  )}
                </div>
              )}

              {/* Select All + Count */}
              {filteredAvailable.length > 0 && (
                <div className="flex items-center justify-between pt-1 border-t border-[var(--border-default)]">
                  <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)] transition-colors">
                    <Checkbox
                      checked={allAddSelected}
                      onCheckedChange={toggleAddSelectAll}
                    />
                    เลือกทั้งหมด ({filteredAvailable.length})
                  </label>
                  {addSelectedIds.size > 0 && (
                    <span className="text-xs font-medium text-[var(--accent)]">
                      เลือกแล้ว {addSelectedIds.size} คน
                    </span>
                  )}
                </div>
              )}

              {/* Contact List */}
              <div className="flex-1 overflow-y-auto max-h-[300px] space-y-1 min-h-0">
                {filteredAvailable.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-6 h-6 mx-auto mb-3 text-[var(--text-muted)]" />
                    <p className="text-xs text-[var(--text-muted)]">
                      {availableContacts.length === 0
                        ? "ไม่มีรายชื่อที่สามารถเพิ่มได้"
                        : addTagFilters.size > 0
                          ? "ไม่พบรายชื่อที่ตรง tag ที่เลือก"
                          : "ไม่พบที่ค้นหา"}
                    </p>
                  </div>
                ) : (
                  filteredAvailable.map((c) => {
                    const contactTags = parseTags(c.tags);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleAddSelect(c.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left ${
                          addSelectedIds.has(c.id)
                            ? "bg-[rgba(var(--accent-rgb),0.06)] border-[rgba(var(--accent-rgb),0.2)]"
                            : "bg-transparent border-transparent hover:bg-[rgba(var(--accent-rgb),0.04)] hover:border-[var(--border-default)]"
                        }`}
                      >
                        <Checkbox
                          checked={addSelectedIds.has(c.id)}
                          onCheckedChange={() => toggleAddSelect(c.id)}
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          className="shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-[var(--text-primary)] truncate">
                              {c.name}
                            </span>
                            {contactTags.slice(0, 3).map((tag) => {
                              const color = getTagColor(tag);
                              return (
                                <span
                                  key={tag}
                                  className={`inline-flex items-center text-[9px] px-1.5 py-0.5 rounded-md font-semibold uppercase tracking-wider ${color.bg} ${color.text}`}
                                >
                                  {tag}
                                </span>
                              );
                            })}
                            {contactTags.length > 3 && (
                              <span className="text-[9px] text-[var(--text-muted)]">
                                +{contactTags.length - 3}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                            {formatPhone(c.phone)}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  className="border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent"
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleAddToGroup}
                  disabled={isPending || addSelectedIds.size === 0}
                  className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold"
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      กำลังเพิ่ม...
                    </span>
                  ) : addSelectedIds.size > 0 ? (
                    `เพิ่มทั้งหมด (${addSelectedIds.size})`
                  ) : (
                    "เลือกรายชื่อก่อน"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
