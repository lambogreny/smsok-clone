"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createTag, updateTag, deleteTag } from "@/lib/actions/tags";
import { safeErrorMessage } from "@/lib/error-messages";
import { useToast } from "@/app/components/ui/Toast";
import { TAG_COLORS } from "@/lib/tag-utils";
import type { TagItem } from "@/lib/types/api-responses";

// PageLayout
import PageLayout, {
  PageHeader,
  StatsRow,
  StatCard,
  FilterBar,
  TableWrapper,
  EmptyState,
} from "@/components/blocks/PageLayout";

// shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Pencil, Trash2, Tag, Users, Star, Loader2, Search } from "lucide-react";

// ==========================================
// Color config
// ==========================================

const COLOR_OPTIONS = TAG_COLORS.map((c) => ({
  hex: c.hex,
  name: c.name,
  dotClass: c.dot,
}));

function getColorDotClass(hex: string) {
  const found = COLOR_OPTIONS.find((c) => c.hex === hex);
  return found ? found.dotClass : "bg-[var(--text-muted)]";
}

// ==========================================
// Zod schema
// ==========================================

const tagFormSchema = z.object({
  name: z
    .string()
    .min(1, "กรุณากรอกชื่อแท็ก")
    .max(50, "ชื่อแท็กต้องไม่เกิน 50 ตัวอักษร"),
  color: z.string().min(1),
});

type TagFormValues = z.infer<typeof tagFormSchema>;

// ==========================================
// Date formatter
// ==========================================

function formatThaiDate(dateStr: string | Date) {
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

// ==========================================
// Main Component
// ==========================================

export default function TagsPageClient({
  initialTags,
}: {
  initialTags: TagItem[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [showDialog, setShowDialog] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deletingTag, setDeletingTag] = useState<TagItem | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const filteredTags = initialTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalContacts = initialTags.reduce((sum, t) => sum + t._count.contactTags, 0);
  const mostUsed = initialTags.length > 0
    ? initialTags.reduce((max, t) => (t._count.contactTags > max._count.contactTags ? t : max), initialTags[0])
    : null;

  // Form
  const form = useForm<TagFormValues>({
    mode: "onChange",
    resolver: zodResolver(tagFormSchema),
    defaultValues: { name: "", color: "var(--accent)" },
  });

  // ==========================================
  // Handlers
  // ==========================================

  function openCreate() {
    setEditingTag(null);
    form.reset({ name: "", color: "var(--accent)" });
    setShowDialog(true);
  }

  function openEdit(tag: TagItem) {
    setEditingTag(tag);
    form.reset({ name: tag.name, color: tag.color });
    setShowDialog(true);
  }

  function handleSubmit(data: TagFormValues) {
    startTransition(async () => {
      try {
        if (editingTag) {
          await updateTag(editingTag.id, {
            name: data.name.trim(),
            color: data.color,
          });
          toast("success", "อัปเดตแท็กสำเร็จ!");
        } else {
          await createTag({
            name: data.name.trim(),
            color: data.color,
          });
          toast("success", "สร้างแท็กสำเร็จ!");
        }
        setShowDialog(false);
        router.refresh();
      } catch (e) {
        toast("error", safeErrorMessage(e));
      }
    });
  }

  function handleDeleteConfirm() {
    if (!deletingTag) return;
    startTransition(async () => {
      try {
        await deleteTag(deletingTag.id);
        toast("success", `ลบแท็ก "${deletingTag.name}" สำเร็จ`);
        setShowDeleteAlert(false);
        setDeletingTag(null);
        router.refresh();
      } catch (e) {
        toast("error", safeErrorMessage(e));
      }
    });
  }

  // ==========================================
  // Render
  // ==========================================

  return (
    <PageLayout>
      {/* Header */}
      <PageHeader
        title="แท็ก"
        count={initialTags.length}
        actions={
          <Button
            onClick={openCreate}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            สร้างแท็ก
          </Button>
        }
      />

      {/* Stats — 3 cards per spec */}
      <StatsRow columns={3}>
        <StatCard
          icon={<Tag className="w-[18px] h-[18px]" style={{ color: "var(--accent)" }} />}
          iconColor="var(--accent-rgb)"
          value={initialTags.length}
          label="แท็กทั้งหมด"
        />
        <StatCard
          icon={<Users className="w-[18px] h-[18px]" style={{ color: "var(--info)" }} />}
          iconColor="71,121,255"
          value={totalContacts.toLocaleString()}
          label="ผู้ติดต่อที่มีแท็ก"
        />
        <StatCard
          icon={<Star className="w-[18px] h-[18px]" style={{ color: "var(--warning)" }} />}
          iconColor="245,158,11"
          value={mostUsed?.name ?? "—"}
          label="แท็กที่ใช้บ่อยสุด"
          subtitle={mostUsed ? `${mostUsed._count.contactTags} คน` : undefined}
        />
      </StatsRow>

      {/* Search */}
      <FilterBar>
        <div className="relative flex-1 max-w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <Input
            placeholder="ค้นหาชื่อแท็ก..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
          />
        </div>
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            ล้างตัวกรอง
          </Button>
        )}
      </FilterBar>

      {/* Table or Empty */}
      {filteredTags.length > 0 ? (
        <TableWrapper>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="nansen-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>สี</th>
                  <th>ชื่อแท็ก</th>
                  <th style={{ width: 120 }} className="text-right">ผู้ติดต่อ</th>
                  <th style={{ width: 120 }} className="hidden lg:table-cell">สร้างเมื่อ</th>
                  <th style={{ width: 100 }} className="text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredTags.map((tag) => (
                  <tr key={tag.id} className="group">
                    {/* Color dot */}
                    <td>
                      <span
                        className="inline-block w-[10px] h-[10px] rounded-full"
                        style={{ background: tag.color }}
                      />
                    </td>
                    {/* Tag name — click navigates to contacts */}
                    <td>
                      <Link
                        href={`/dashboard/contacts?tag=${encodeURIComponent(tag.name)}`}
                        className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                      >
                        {tag.name}
                      </Link>
                    </td>
                    {/* Contact count */}
                    <td className="text-right tabular-nums text-sm text-[var(--text-muted)]">
                      {tag._count.contactTags.toLocaleString()} คน
                    </td>
                    {/* Created date */}
                    <td className="hidden lg:table-cell text-sm text-[var(--text-secondary)]">
                      {formatThaiDate(tag.createdAt)}
                    </td>
                    {/* Actions */}
                    <td className="text-center">
                      <div className="flex items-center gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => openEdit(tag)}
                          className="w-8 h-8 rounded-md hover:bg-[rgba(255,255,255,0.04)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setDeletingTag(tag); setShowDeleteAlert(true); }}
                          className="w-8 h-8 rounded-md hover:bg-[rgba(239,68,68,0.06)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--error)] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-[var(--border-default)]">
            {filteredTags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-[10px] h-[10px] rounded-full shrink-0"
                    style={{ background: tag.color }}
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/contacts?tag=${encodeURIComponent(tag.name)}`}
                      className="text-sm font-semibold text-[var(--text-primary)] block truncate"
                    >
                      {tag.name}
                    </Link>
                    <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {tag._count.contactTags} คน
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(tag)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDeletingTag(tag); setShowDeleteAlert(true); }}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--error)] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination info */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-default)]">
            <span className="text-[13px] text-[var(--text-secondary)]">
              แสดง {filteredTags.length} จาก {initialTags.length} แท็ก
            </span>
          </div>
        </TableWrapper>
      ) : (
        <EmptyState
          icon={<Tag className="w-12 h-12" />}
          title={searchQuery ? "ไม่พบแท็ก" : "ยังไม่มีแท็ก"}
          subtitle={
            searchQuery
              ? `ไม่พบแท็กที่ตรงกับ "${searchQuery}"`
              : "สร้างแท็กเพื่อจัดกลุ่มผู้ติดต่อ"
          }
          action={
            !searchQuery ? (
              <Button
                onClick={openCreate}
                className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                สร้างแท็กแรก
              </Button>
            ) : undefined
          }
        />
      )}

      {/* ==========================================
          DIALOGS
          ========================================== */}

      {/* Create / Edit Tag Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)] text-lg">
              {editingTag ? "แก้ไขแท็ก" : "สร้างแท็กใหม่"}
            </DialogTitle>
            <DialogDescription className="text-[var(--text-muted)]">
              {editingTag
                ? "แก้ไขชื่อหรือสีของแท็ก"
                : "ตั้งชื่อและเลือกสีสำหรับแท็กใหม่"}
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
                    <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-muted)]">
                      ชื่อแท็ก
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ชื่อแท็ก"
                        maxLength={50}
                        autoFocus
                        className="h-11 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] rounded-lg focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(var(--accent-rgb),0.12)]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Color Picker */}
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-muted)]">
                      สี
                    </FormLabel>
                    <div className="flex gap-2 flex-wrap">
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => field.onChange(c.hex)}
                          className={`w-7 h-7 rounded-full transition-all cursor-pointer ${
                            field.value === c.hex
                              ? "ring-2 ring-offset-2 ring-offset-[var(--bg-surface)] scale-110"
                              : "hover:scale-105"
                          }`}
                          style={{
                            backgroundColor: c.hex,
                            ...(field.value === c.hex
                              ? { ringColor: c.hex }
                              : {}),
                          }}
                          title={c.name}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent"
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

      {/* Delete Tag AlertDialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[var(--text-primary)]">
              ลบแท็ก &ldquo;{deletingTag?.name}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--text-secondary)]">
              แท็กจะถูกลบจาก {deletingTag?._count.contactTags || 0}{" "}
              รายชื่อผู้ติดต่อ
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent">
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
    </PageLayout>
  );
}
