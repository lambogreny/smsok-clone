"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatThaiDateOnly, formatPhone } from "@/lib/format-thai-date";
import { displayPhone } from "@/lib/validations";
import { removeContactFromGroup, bulkRemoveFromGroup, deleteGroup, getContactsNotInGroup, addContactToGroup } from "@/lib/actions/groups";
import { safeErrorMessage } from "@/lib/error-messages";
import { useToast } from "@/app/components/ui/Toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Search, Plus, Trash2, Folder, X, Check, Loader2, UserPlus, Download,
} from "lucide-react";

type Member = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  smsConsent: boolean;
  createdAt: string;
};

type AvailableContact = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
};

export default function GroupDetailClient({
  groupId,
  groupName,
  memberCount,
  createdAt,
  members,
}: {
  groupId: string;
  groupName: string;
  memberCount: number;
  createdAt: string;
  members: Member[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Optimistic member list — updated instantly on add/remove
  const [localMembers, setLocalMembers] = useState<Member[]>(members);
  const [localCount, setLocalCount] = useState(memberCount);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Add Members dialog
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [availableContacts, setAvailableContacts] = useState<AvailableContact[]>([]);
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Delete group
  const [showDeleteGroup, setShowDeleteGroup] = useState(false);

  // Bulk remove
  const [showBulkRemove, setShowBulkRemove] = useState(false);

  const filteredMembers = searchQuery.trim()
    ? localMembers.filter((m) => {
        const q = searchQuery.toLowerCase().trim();
        return m.name.toLowerCase().includes(q) || m.phone.includes(q) || displayPhone(m.phone).includes(q) || (m.email && m.email.toLowerCase().includes(q));
      })
    : localMembers;

  const hasSelection = selectedIds.size > 0;
  const allSelected = filteredMembers.length > 0 && filteredMembers.every((m) => selectedIds.has(m.id));

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredMembers.map((m) => m.id)));
  }

  function handleRemoveMember(contactId: string) {
    // Optimistic remove
    setLocalMembers((prev) => prev.filter((m) => m.id !== contactId));
    setLocalCount((prev) => prev - 1);
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(contactId); return n; });

    startTransition(async () => {
      try {
        await removeContactFromGroup(groupId, contactId);
        toast("success", "ลบออกจากกลุ่มสำเร็จ");
        router.refresh();
      } catch (e) {
        // Revert on error
        setLocalMembers(members);
        setLocalCount(memberCount);
        toast("error", safeErrorMessage(e));
      }
    });
  }

  function handleBulkRemove() {
    if (selectedIds.size === 0) return;
    const toRemove = Array.from(selectedIds);
    const removeCount = toRemove.length;

    // Optimistic remove
    setLocalMembers((prev) => prev.filter((m) => !selectedIds.has(m.id)));
    setLocalCount((prev) => prev - removeCount);
    setSelectedIds(new Set());
    setShowBulkRemove(false);

    startTransition(async () => {
      try {
        await bulkRemoveFromGroup(groupId, toRemove);
        toast("success", `ลบ ${removeCount} รายชื่อออกจากกลุ่มสำเร็จ`);
        router.refresh();
      } catch (e) {
        setLocalMembers(members);
        setLocalCount(memberCount);
        toast("error", safeErrorMessage(e));
      }
    });
  }

  function handleDeleteGroup() {
    startTransition(async () => {
      try {
        await deleteGroup(groupId);
        toast("success", `ลบกลุ่ม "${groupName}" สำเร็จ`);
        router.push("/dashboard/contacts");
      } catch (e) {
        toast("error", safeErrorMessage(e));
      }
    });
  }

  // Search available contacts for add dialog
  const searchAvailableContacts = useCallback(
    async (query: string) => {
      setLoadingContacts(true);
      try {
        const contacts = await getContactsNotInGroup(groupId, query || undefined);
        setAvailableContacts(
          contacts.map((c: (typeof contacts)[number]) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            email: c.email,
          }))
        );
      } catch {
        setAvailableContacts([]);
      } finally {
        setLoadingContacts(false);
      }
    },
    [groupId],
  );

  function openAddMembers() {
    setShowAddMembers(true);
    setAddSearch("");
    setSelectedToAdd(new Set());
    searchAvailableContacts("");
  }

  function toggleSelectToAdd(id: string) {
    setSelectedToAdd((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAddMembers() {
    if (selectedToAdd.size === 0) return;
    const ids = Array.from(selectedToAdd);

    // Optimistic add — build member objects from availableContacts
    const newMembers: Member[] = ids.flatMap((id) => {
      const c = availableContacts.find((ac) => ac.id === id);
      if (!c) return [];
      return [{
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        smsConsent: true,
        createdAt: new Date().toISOString(),
      }];
    });
    setLocalMembers((prev) => [...prev, ...newMembers]);
    setLocalCount((prev) => prev + newMembers.length);
    setShowAddMembers(false);
    setSelectedToAdd(new Set());

    startTransition(async () => {
      try {
        for (const contactId of ids) {
          await addContactToGroup(groupId, contactId);
        }
        toast("success", `เพิ่ม ${ids.length} คนเข้ากลุ่มสำเร็จ`);
        router.refresh();
      } catch (e) {
        // Revert on error
        setLocalMembers(members);
        setLocalCount(memberCount);
        setShowAddMembers(true);
        toast("error", safeErrorMessage(e));
      }
    });
  }

  return (
    <div className="p-4 md:p-8 pb-20 md:pb-8">
      {/* Back + Header */}
      <Link
        href="/dashboard/contacts"
        className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-4 min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับ
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(var(--accent-rgb),0.08)", border: "1px solid rgba(var(--accent-rgb),0.15)" }}>
            <Folder className="size-5 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{groupName}</h2>
            <p className="text-xs text-[var(--text-muted)]">
              {localCount.toLocaleString()} contacts · สร้างเมื่อ {formatThaiDateOnly(createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={openAddMembers}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            เพิ่มสมาชิก
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteGroup(true)}
            className="border-[rgba(var(--error-rgb,239,68,68),0.2)] text-[var(--error)] hover:bg-[rgba(var(--error-rgb,239,68,68),0.1)]"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">ลบกลุ่ม</span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <Input
          type="text"
          className="pl-10 h-11 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(var(--accent-rgb),0.12)]"
          placeholder="ค้นหาสมาชิก..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Member Table */}
      {filteredMembers.length > 0 ? (
        <>
          {/* Desktop */}
          <Card className="hidden md:block bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-0 hover:bg-transparent">
                    <TableHead className="w-10 bg-[var(--bg-secondary)] text-[var(--text-muted)] text-xs uppercase tracking-wider font-medium h-11">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleSelectAll}
                        className="border-[rgba(var(--accent-rgb),0.4)] data-[state=checked]:bg-[var(--accent)] data-[state=checked]:border-[var(--accent)] data-[state=checked]:text-[var(--bg-base)]"
                      />
                    </TableHead>
                    <TableHead className="bg-[var(--bg-secondary)] text-[var(--text-muted)] text-xs uppercase tracking-wider font-medium h-11 w-[160px]">เบอร์โทร</TableHead>
                    <TableHead className="bg-[var(--bg-secondary)] text-[var(--text-muted)] text-xs uppercase tracking-wider font-medium h-11">ชื่อ</TableHead>
                    <TableHead className="bg-[var(--bg-secondary)] text-[var(--text-muted)] text-xs uppercase tracking-wider font-medium h-11 w-[100px]">สถานะ</TableHead>
                    <TableHead className="bg-[var(--bg-secondary)] text-[var(--text-muted)] text-xs uppercase tracking-wider font-medium h-11 text-right w-28">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member, idx) => (
                    <TableRow
                      key={member.id}
                      className={`border-b border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)] transition-colors ${
                        idx % 2 === 1 ? "bg-[var(--bg-muted)]" : "bg-transparent"
                      } ${selectedIds.has(member.id) ? "bg-[rgba(var(--accent-rgb),0.04)]" : ""}`}
                    >
                      <TableCell className="py-3.5">
                        <Checkbox
                          checked={selectedIds.has(member.id)}
                          onCheckedChange={() => toggleSelect(member.id)}
                          className="border-[rgba(var(--accent-rgb),0.4)] data-[state=checked]:bg-[var(--accent)] data-[state=checked]:border-[var(--accent)] data-[state=checked]:text-[var(--bg-base)]"
                        />
                      </TableCell>
                      <TableCell className="py-3.5 text-[var(--text-primary)] font-mono text-[13px] font-medium">{displayPhone(member.phone)}</TableCell>
                      <TableCell className="py-3.5 text-[13px] text-[var(--text-secondary)]">
                        <Link href={`/dashboard/contacts/${member.id}`} className="hover:text-[var(--accent)] hover:underline transition-colors">
                          {member.name}
                        </Link>
                      </TableCell>
                      <TableCell className="py-3.5">
                        {member.smsConsent ? (
                          <span className="inline-flex items-center gap-1.5 text-xs" aria-label="สถานะ: Active">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                            <span className="text-[var(--success)]">Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs" aria-label="สถานะ: Opted-out">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)]" />
                            <span className="text-[var(--warning)]">Unsub</span>
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={isPending}
                          className="h-8 px-2.5 text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[rgba(var(--error-rgb,239,68,68),0.05)]"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          <span className="text-xs">ลบออก</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="px-5 py-3 border-t border-[var(--border-default)] text-xs text-[var(--text-muted)]">
              แสดง {filteredMembers.length} จาก {localMembers.length} สมาชิก
            </div>
          </Card>

          {/* Mobile */}
          <div className="md:hidden space-y-2">
            <div className="flex items-center gap-3 px-1">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleSelectAll}
                className="border-[rgba(var(--accent-rgb),0.4)] data-[state=checked]:bg-[var(--accent)] data-[state=checked]:border-[var(--accent)] data-[state=checked]:text-[var(--bg-base)]"
              />
              <span className="text-xs text-[var(--text-muted)]">เลือกทั้งหมด ({filteredMembers.length})</span>
            </div>
            {filteredMembers.map((member) => (
              <Card
                key={member.id}
                className={`bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg p-4 ${
                  selectedIds.has(member.id) ? "border-[rgba(var(--accent-rgb),0.3)]" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIds.has(member.id)}
                    onCheckedChange={() => toggleSelect(member.id)}
                    className="mt-1 border-[rgba(var(--accent-rgb),0.4)] data-[state=checked]:bg-[var(--accent)] data-[state=checked]:border-[var(--accent)] data-[state=checked]:text-[var(--bg-base)]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <Link href={`/dashboard/contacts/${member.id}`} className="text-sm font-medium text-[var(--text-primary)] truncate hover:text-[var(--accent)]">
                        {member.name}
                      </Link>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--error)] shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[13px] text-[var(--accent)] font-mono">{displayPhone(member.phone)}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                      {member.smsConsent ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)]" />
                          Unsub
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : members.length > 0 ? (
        <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg p-8 text-center">
          <Search className="mx-auto mb-3 text-[var(--text-muted)] w-8 h-8" />
          <p className="text-sm text-[var(--text-muted)]">ไม่พบสมาชิกที่ตรงกับการค้นหา</p>
        </Card>
      ) : (
        <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-lg flex items-center justify-center" style={{ background: "rgba(var(--accent-rgb),0.06)", border: "1px solid rgba(var(--accent-rgb),0.12)" }}>
            <UserPlus className="size-6 text-[var(--text-muted)]" />
          </div>
          <p className="text-sm text-[var(--text-primary)] mb-1">กลุ่มนี้ยังไม่มีสมาชิก</p>
          <p className="text-xs text-[var(--text-muted)] mb-4">เพิ่มรายชื่อผู้ติดต่อเข้ากลุ่ม</p>
          <Button
            size="sm"
            onClick={openAddMembers}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            เพิ่มสมาชิก
          </Button>
        </Card>
      )}

      {/* Floating Action Bar — Bulk Remove */}
      {hasSelection && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 animate-in slide-in-from-bottom-4 duration-250"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            borderRadius: 12,
            padding: "12px 20px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-primary)] font-medium whitespace-nowrap">
              เลือก {selectedIds.size} รายการ
            </span>
            <div className="h-4 w-px bg-[var(--border-default)]" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkRemove(true)}
              disabled={isPending}
              className="border-[rgba(var(--error-rgb,239,68,68),0.2)] bg-[rgba(var(--error-rgb,239,68,68),0.1)] text-[var(--error)] hover:bg-[rgba(var(--error-rgb,239,68,68),0.15)]"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              ลบออกจากกลุ่ม
            </Button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              aria-label="ยกเลิก"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══ DIALOGS ═══ */}

      {/* Add Members Dialog */}
      <Dialog open={showAddMembers} onOpenChange={setShowAddMembers}>
        <DialogContent className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)] text-lg">เพิ่มสมาชิก</DialogTitle>
            <DialogDescription className="text-[var(--text-muted)]">
              ค้นหาและเลือกรายชื่อเพื่อเพิ่มเข้ากลุ่ม &ldquo;{groupName}&rdquo;
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <Input
              type="text"
              className="pl-10 h-11 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:border-[rgba(var(--accent-rgb),0.6)]"
              placeholder="ค้นหาด้วยชื่อหรือเบอร์..."
              value={addSearch}
              onChange={(e) => {
                setAddSearch(e.target.value);
                searchAvailableContacts(e.target.value);
              }}
              autoFocus
            />
          </div>

          {/* Selected chips */}
          {selectedToAdd.size > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {Array.from(selectedToAdd).map((id) => {
                const c = availableContacts.find((ac) => ac.id === id);
                if (!c) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-[rgba(var(--accent-rgb),0.08)] text-[var(--accent)] border border-[rgba(var(--accent-rgb),0.2)]"
                  >
                    {c.name}
                    <button onClick={() => toggleSelectToAdd(id)} className="hover:opacity-70">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Contact list */}
          <div className="max-h-60 overflow-y-auto space-y-1 -mx-1 px-1">
            {loadingContacts ? (
              <div className="py-8 text-center">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)] mx-auto" />
              </div>
            ) : availableContacts.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--text-muted)]">
                {addSearch ? "ไม่พบรายชื่อที่ตรงกัน" : "ทุกรายชื่อเป็นสมาชิกกลุ่มนี้แล้ว"}
              </div>
            ) : (
              availableContacts.map((contact) => {
                const isSelected = selectedToAdd.has(contact.id);
                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => toggleSelectToAdd(contact.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                      isSelected
                        ? "bg-[rgba(var(--accent-rgb),0.06)] border border-[rgba(var(--accent-rgb),0.2)]"
                        : "bg-transparent border border-transparent hover:bg-[rgba(var(--accent-rgb),0.03)]"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "rgba(var(--accent-rgb),0.08)", color: "var(--accent)" }}>
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-primary)] truncate">{contact.name}</p>
                      <p className="text-xs text-[var(--text-muted)] font-mono">{formatPhone(contact.phone)}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[var(--accent)] shrink-0" />}
                  </button>
                );
              })
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddMembers(false)}
              className="border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleAddMembers}
              disabled={isPending || selectedToAdd.size === 0}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold disabled:opacity-50"
            >
              {isPending ? (
                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />กำลังเพิ่ม...</span>
              ) : (
                `เพิ่ม ${selectedToAdd.size} คน`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group AlertDialog */}
      <AlertDialog open={showDeleteGroup} onOpenChange={setShowDeleteGroup}>
        <AlertDialogContent className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[var(--text-primary)]">
              ลบกลุ่ม &ldquo;{groupName}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--text-muted)]">
              กลุ่มจะถูกลบถาวร สมาชิกไม่ถูกลบ — เฉพาะกลุ่มเท่านั้น
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent">
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              disabled={isPending}
              className="bg-[var(--error)] hover:bg-[var(--error)]/90 text-[var(--text-primary)]"
            >
              {isPending ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />กำลังลบ...</span> : "ลบกลุ่ม"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Remove AlertDialog */}
      <AlertDialog open={showBulkRemove} onOpenChange={setShowBulkRemove}>
        <AlertDialogContent className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[var(--text-primary)]">
              ลบ {selectedIds.size} รายชื่อออกจากกลุ่ม?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--text-muted)]">
              รายชื่อจะถูกลบออกจากกลุ่มนี้ แต่จะยังคงอยู่ในระบบ
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent">
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkRemove}
              disabled={isPending}
              className="bg-[var(--error)] hover:bg-[var(--error)]/90 text-[var(--text-primary)]"
            >
              {isPending ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />กำลังลบ...</span> : `ลบ ${selectedIds.size} รายชื่อ`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
