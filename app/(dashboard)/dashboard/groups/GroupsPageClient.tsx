"use client";

import { useState, useTransition, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { safeErrorMessage } from "@/lib/error-messages";
import type { GroupItem, GroupContactStub, GroupMember } from "@/lib/types/api-responses";

// ── API helpers (canonical /api/v1/groups) ──

async function apiCreateGroup(name: string): Promise<GroupItem> {
  const res = await fetch("/api/v1/groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "สร้างกลุ่มไม่สำเร็จ");
  }
  const raw = await res.json();
  return { id: raw.id, name: raw.name, createdAt: raw.createdAt, memberCount: 0 };
}

async function apiUpdateGroup(id: string, name: string) {
  const res = await fetch(`/api/v1/groups/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "อัปเดตกลุ่มไม่สำเร็จ");
  }
  return res.json();
}

async function apiDeleteGroup(id: string) {
  const res = await fetch(`/api/v1/groups/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "ลบกลุ่มไม่สำเร็จ");
  }
}

async function apiGetMembers(groupId: string, search?: string): Promise<GroupMember[]> {
  const params = new URLSearchParams({ limit: "200" });
  if (search) params.set("search", search);
  const res = await fetch(`/api/v1/groups/${groupId}/members?${params}`);
  if (!res.ok) throw new Error("โหลดสมาชิกไม่สำเร็จ");
  const data = await res.json();
  // API returns { members: Contact[] } — transform to GroupMember shape
  return (data.members || []).map((c: GroupContactStub & { email?: string }) => ({
    id: c.id,
    groupId,
    contactId: c.id,
    contact: { id: c.id, name: c.name, phone: c.phone },
  }));
}

async function apiSearchAvailableContacts(groupId: string, search: string): Promise<GroupContactStub[]> {
  const params = new URLSearchParams({ limit: "50" });
  if (search) params.set("search", search);
  const res = await fetch(`/api/v1/groups/${groupId}/available-contacts?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.contacts || []).map((c: GroupContactStub) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
  }));
}

async function apiAddMember(groupId: string, contactId: string): Promise<GroupMember> {
  // Note: POST /api/v1/groups/:id/members not yet available — using server action fallback
  const { addContactToGroup } = await import("@/lib/actions/groups");
  const result = await addContactToGroup(groupId, contactId);
  return result as GroupMember;
}

async function apiRemoveMember(groupId: string, contactId: string) {
  // Use bulk-remove endpoint with single ID
  const res = await fetch(`/api/v1/groups/${groupId}/members/bulk-remove`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contactIds: [contactId] }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "ลบสมาชิกไม่สำเร็จ");
  }
}
import { useToast } from "@/app/components/ui/Toast";
import { formatThaiDateShort, formatPhone } from "@/lib/format-thai-date";

// shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Icons
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  FolderOpen,
  Search,
  X,
  Loader2,
} from "lucide-react";

import EmptyState from "@/components/EmptyState";

// ==========================================
// Types
// ==========================================

type Group = GroupItem;
type ContactStub = GroupContactStub;
type Member = GroupMember;

// ==========================================
// Zod schema
// ==========================================

const groupFormSchema = z.object({
  name: z
    .string()
    .min(1, "กรุณากรอกชื่อกลุ่ม")
    .max(100, "ชื่อกลุ่มต้องไม่เกิน 100 ตัวอักษร"),
});

type GroupFormValues = z.infer<typeof groupFormSchema>;

// ==========================================
// Main Component
// ==========================================

export default function GroupsPageClient({
  initialGroups,
}: {
  initialGroups: Group[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Local state for optimistic updates
  const [groups, setGroups] = useState<Group[]>(initialGroups);

  // Dialog states
  const [showDialog, setShowDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);

  // Members dialog
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [addSearch, setAddSearch] = useState("");

  // Server-side contact search (replaces loading all contacts upfront)
  const [searchedContacts, setSearchedContacts] = useState<ContactStub[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  // Form
  const form = useForm<GroupFormValues>({
    mode: "onChange",
    resolver: zodResolver(groupFormSchema),
    defaultValues: { name: "" },
  });

  // ==========================================
  // Server-side contact search (debounced)
  // ==========================================

  useEffect(() => {
    if (!activeGroup) {
      setSearchedContacts([]);
      return;
    }

    setContactsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await apiSearchAvailableContacts(activeGroup.id, addSearch);
        setSearchedContacts(results);
      } catch {
        // ignore search errors
      } finally {
        setContactsLoading(false);
      }
    }, addSearch ? 300 : 0);

    return () => clearTimeout(timer);
  }, [activeGroup, addSearch]);

  // ==========================================
  // Derived data for members dialog
  // ==========================================

  const memberIds = useMemo(
    () => new Set(members.map((m) => m.contactId)),
    [members],
  );

  const filteredMembers = useMemo(
    () =>
      members.filter(
        (m) =>
          !memberSearch ||
          m.contact.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
          m.contact.phone.includes(memberSearch),
      ),
    [members, memberSearch],
  );

  const contactsToAdd = useMemo(
    () => searchedContacts.filter((c) => !memberIds.has(c.id)),
    [searchedContacts, memberIds],
  );

  // ==========================================
  // Handlers
  // ==========================================

  function openCreate() {
    setEditingGroup(null);
    form.reset({ name: "" });
    setShowDialog(true);
  }

  function openEdit(g: Group) {
    setEditingGroup(g);
    form.reset({ name: g.name });
    setShowDialog(true);
  }

  function handleSubmit(data: GroupFormValues) {
    startTransition(async () => {
      try {
        if (editingGroup) {
          await apiUpdateGroup(editingGroup.id, data.name.trim());
          setGroups((prev) =>
            prev.map((g) =>
              g.id === editingGroup.id ? { ...g, name: data.name.trim() } : g,
            ),
          );
          toast("success", "อัปเดตกลุ่มสำเร็จ!");
        } else {
          const created = await apiCreateGroup(data.name.trim());
          setGroups((prev) => [created, ...prev]);
          toast("success", "สร้างกลุ่มสำเร็จ!");
        }
        setShowDialog(false);
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("มีกลุ่มชื่อนี้อยู่แล้ว")) {
          form.setError("name", { message: "ชื่อกลุ่มนี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น" });
        } else {
          toast("error", safeErrorMessage(e));
        }
      }
    });
  }

  function handleDeleteConfirm() {
    if (!deletingGroup) return;
    startTransition(async () => {
      try {
        await apiDeleteGroup(deletingGroup.id);
        setGroups((prev) => prev.filter((g) => g.id !== deletingGroup.id));
        if (activeGroup?.id === deletingGroup.id) setActiveGroup(null);
        toast("success", "ลบกลุ่มสำเร็จ");
        setShowDeleteAlert(false);
        setDeletingGroup(null);
        router.refresh();
      } catch (e) {
        toast("error", safeErrorMessage(e));
      }
    });
  }

  async function openMembers(g: Group) {
    setActiveGroup(g);
    setMemberSearch("");
    setAddSearch("");
    setMembersLoading(true);
    try {
      const data = await apiGetMembers(g.id);
      setMembers(data);
    } catch {
      toast("error", "โหลดสมาชิกไม่สำเร็จ");
    } finally {
      setMembersLoading(false);
    }
  }

  function handleAddContact(contact: ContactStub) {
    if (!activeGroup) return;
    const tempMember: Member = {
      id: `temp-${contact.id}`,
      groupId: activeGroup.id,
      contactId: contact.id,
      contact,
    };
    setMembers((prev) => [...prev, tempMember]);
    setGroups((prev) =>
      prev.map((g) =>
        g.id === activeGroup.id
          ? { ...g, memberCount: g.memberCount + 1 }
          : g,
      ),
    );
    setActiveGroup((prev) =>
      prev
        ? { ...prev, memberCount: prev.memberCount + 1 }
        : prev,
    );

    startTransition(async () => {
      try {
        const real = await apiAddMember(activeGroup.id, contact.id);
        setMembers((prev) =>
          prev.map((m) => (m.id === tempMember.id ? (real as Member) : m)),
        );
      } catch (e) {
        setMembers((prev) => prev.filter((m) => m.id !== tempMember.id));
        setGroups((prev) =>
          prev.map((g) =>
            g.id === activeGroup.id
              ? { ...g, memberCount: g.memberCount - 1 }
              : g,
          ),
        );
        setActiveGroup((prev) =>
          prev
            ? { ...prev, memberCount: prev.memberCount - 1 }
            : prev,
        );
        toast("error", safeErrorMessage(e));
      }
    });
  }

  function handleRemoveContact(member: Member) {
    if (!activeGroup) return;
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    setGroups((prev) =>
      prev.map((g) =>
        g.id === activeGroup.id
          ? { ...g, memberCount: Math.max(0, g.memberCount - 1) }
          : g,
      ),
    );
    setActiveGroup((prev) =>
      prev
        ? { ...prev, memberCount: Math.max(0, prev.memberCount - 1) }
        : prev,
    );

    startTransition(async () => {
      try {
        await apiRemoveMember(activeGroup.id, member.contactId);
      } catch (e) {
        setMembers((prev) => [...prev, member]);
        setGroups((prev) =>
          prev.map((g) =>
            g.id === activeGroup.id
              ? { ...g, memberCount: g.memberCount + 1 }
              : g,
          ),
        );
        setActiveGroup((prev) =>
          prev
            ? { ...prev, memberCount: prev.memberCount + 1 }
            : prev,
        );
        toast("error", safeErrorMessage(e));
      }
    });
  }

  // ==========================================
  // Render
  // ==========================================

  return (
    <div className="p-4 md:p-8 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            กลุ่ม
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {groups.length} กลุ่มทั้งหมด
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          สร้างกลุ่ม
        </Button>
      </div>

      {/* Groups Table — Desktop */}
      {groups.length > 0 ? (
        <>
          <Card className="hidden md:block bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-0 hover:bg-transparent">
                  <TableHead className="bg-[var(--bg-secondary)] text-[var(--text-muted)] text-xs uppercase tracking-wider font-medium h-11">
                    ชื่อกลุ่ม
                  </TableHead>
                  <TableHead className="bg-[var(--bg-secondary)] text-[var(--text-muted)] text-xs uppercase tracking-wider font-medium h-11 w-[100px]">
                    สมาชิก
                  </TableHead>
                  <TableHead className="bg-[var(--bg-secondary)] text-[var(--text-muted)] text-xs uppercase tracking-wider font-medium h-11 w-[120px] hidden lg:table-cell">
                    วันที่สร้าง
                  </TableHead>
                  <TableHead className="bg-[var(--bg-secondary)] text-[var(--text-muted)] text-xs uppercase tracking-wider font-medium h-11 w-[160px] text-right">
                    จัดการ
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((g, idx) => (
                  <TableRow
                    key={g.id}
                    className={`border-b border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)] transition-colors ${
                      idx % 2 === 1 ? "bg-[var(--bg-muted)]" : "bg-transparent"
                    }`}
                  >
                    <TableCell className="py-3.5">
                      <Link
                        href={`/dashboard/groups/${g.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[rgba(var(--accent-rgb),0.08)] border border-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center text-[var(--accent)] flex-shrink-0 group-hover:bg-[rgba(var(--accent-rgb),0.12)] transition-all">
                          <FolderOpen className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] group-hover:underline transition-colors truncate">
                          {g.name}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <Badge
                        variant="outline"
                        className="text-[12px] px-2 py-0.5 bg-[rgba(var(--accent-rgb),0.06)] text-[var(--accent)] border-[rgba(var(--accent-rgb),0.15)] font-medium rounded-full"
                      >
                        {g.memberCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3.5 text-xs text-[var(--text-muted)] hidden lg:table-cell">
                      {formatThaiDateShort(g.createdAt)}
                    </TableCell>
                    <TableCell className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openMembers(g)}
                          className="h-8 border-[var(--border-default)] bg-transparent text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[rgba(var(--accent-rgb),0.3)]"
                        >
                          <Users className="w-3.5 h-3.5 mr-1" />
                          จัดการสมาชิก
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(g)}
                          className="h-8 px-2.5 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[rgba(var(--accent-rgb),0.04)]"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeletingGroup(g);
                            setShowDeleteAlert(true);
                          }}
                          className="h-8 px-2.5 text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[rgba(var(--error-rgb,239,68,68),0.05)]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </Card>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {groups.map((g) => (
              <Card
                key={g.id}
                className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[rgba(var(--accent-rgb),0.08)] border border-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center text-[var(--accent)] flex-shrink-0">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/dashboard/groups/${g.id}`}
                      className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors truncate block"
                    >
                      {g.name}
                    </Link>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {g.memberCount} สมาชิก
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openMembers(g)}
                    className="flex-1 min-h-[44px] border-[var(--border-default)] bg-transparent text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[rgba(var(--accent-rgb),0.3)]"
                  >
                    <Users className="w-4 h-4 mr-1" />
                    สมาชิก
                  </Button>
                  <button
                    onClick={() => openEdit(g)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setDeletingGroup(g);
                      setShowDeleteAlert(true);
                    }}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        /* Empty state */
        <EmptyState
          icon={FolderOpen}
          iconColor="var(--warning)"
          iconBg="rgba(250,205,99,0.08)"
          title="ยังไม่มีกลุ่ม"
          description="สร้างกลุ่มเพื่อจัดระเบียบรายชื่อและส่ง SMS ได้ง่ายขึ้น"
          ctaLabel="สร้างกลุ่ม"
          ctaAction={openCreate}
        />
      )}

      {/* ==========================================
          DIALOGS
          ========================================== */}

      {/* Create / Edit Group Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)] text-lg">
              {editingGroup ? "แก้ไขกลุ่ม" : "สร้างกลุ่มใหม่"}
            </DialogTitle>
            <DialogDescription className="text-[var(--text-muted)]">
              {editingGroup
                ? "แก้ไขชื่อกลุ่ม"
                : "ตั้งชื่อสำหรับกลุ่มใหม่"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
                      ชื่อกลุ่ม
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ชื่อกลุ่ม"
                        maxLength={100}
                        autoFocus
                        className="h-11 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(var(--accent-rgb),0.12)]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold"
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      กำลังบันทึก...
                    </span>
                  ) : (
                    "บันทึก"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Group AlertDialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[var(--text-primary)]">
              ลบกลุ่ม &ldquo;{deletingGroup?.name}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--text-muted)]">
              สมาชิกในกลุ่มนี้จะถูกถอดออกทั้งหมด รายชื่อจะไม่ถูกลบ
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent">
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="bg-[var(--error)] hover:bg-[var(--error)] text-[var(--text-primary)]"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังลบ...
                </span>
              ) : (
                "ลบ"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Members Manager Dialog */}
      <Dialog
        open={!!activeGroup}
        onOpenChange={(open) => {
          if (!open) setActiveGroup(null);
        }}
      >
        <DialogContent className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg sm:max-w-[720px] max-h-[85vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="text-[var(--text-primary)] text-lg">
              จัดการสมาชิก — กลุ่ม &ldquo;{activeGroup?.name}&rdquo; (
              {activeGroup?.memberCount || 0} คน)
            </DialogTitle>
            <DialogDescription className="text-[var(--text-muted)]">
              เพิ่มหรือลบสมาชิกจากกลุ่ม
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col md:flex-row gap-0 flex-1 min-h-0 overflow-hidden">
            {/* Left: current members */}
            <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-[var(--border-default)] min-h-0">
              <div className="px-4 pt-4 pb-3">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium mb-2">
                  สมาชิกปัจจุบัน ({members.length})
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <Input
                    type="text"
                    className="pl-9 h-9 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] rounded-lg focus:border-[rgba(var(--accent-rgb),0.6)]"
                    placeholder="ค้นหา..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 max-h-[400px]">
                {membersLoading ? (
                  <div className="text-center py-8 text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    กำลังโหลด...
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[var(--text-muted)]">
                    {members.length === 0
                      ? "ยังไม่มีสมาชิก"
                      : "ไม่พบที่ค้นหา"}
                  </div>
                ) : (
                  filteredMembers.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-[rgba(239,68,68,0.04)] group transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-[13px] text-[var(--text-primary)] truncate">
                          {m.contact.name}
                        </div>
                        <div className="text-[12px] text-[var(--text-muted)] font-mono">
                          {formatPhone(m.contact.phone)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveContact(m)}
                        disabled={isPending}
                        className="flex-shrink-0 w-7 h-7 rounded-lg hover:bg-[rgba(var(--error-rgb,239,68,68),0.1)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--error)] opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: add contacts */}
            <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-surface)]">
              <div className="px-4 pt-4 pb-3">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium mb-2">
                  เพิ่มรายชื่อ
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <Input
                    type="text"
                    className="pl-9 h-9 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] rounded-lg focus:border-[rgba(var(--accent-rgb),0.6)]"
                    placeholder="ค้นหาเพื่อเพิ่ม..."
                    value={addSearch}
                    onChange={(e) => setAddSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 max-h-[400px]">
                {contactsToAdd.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[var(--text-muted)]">
                    {contactsLoading
                      ? "กำลังค้นหา..."
                      : addSearch
                        ? "ไม่พบที่ค้นหา"
                        : "รายชื่อทั้งหมดอยู่ในกลุ่มแล้ว"}
                  </div>
                ) : (
                  contactsToAdd.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleAddContact(c)}
                      disabled={isPending}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-[rgba(var(--accent-rgb),0.04)] text-left transition-all disabled:opacity-50 cursor-pointer group"
                    >
                      <div className="min-w-0">
                        <div className="text-[13px] text-[var(--text-primary)] truncate">
                          {c.name}
                        </div>
                        <div className="text-[12px] text-[var(--text-muted)] font-mono">
                          {formatPhone(c.phone)}
                        </div>
                      </div>
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[rgba(var(--accent-rgb),0.06)] group-hover:bg-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">
                        <Plus className="w-3 h-3" />
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 pb-6 pt-4 border-t border-[var(--border-default)]">
            <Button
              variant="outline"
              onClick={() => setActiveGroup(null)}
              className="border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent"
            >
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
