"use client";

import { useState, useTransition, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/lib/actions/templates";
import EmptyState from "@/components/EmptyState";
import type { TemplateItem } from "@/lib/types/api-responses";
import { safeErrorMessage } from "@/lib/error-messages";
import { useToast } from "@/app/components/ui/Toast";
import { smsCounterText } from "@/lib/form-utils";
import { SmsCharCounter, UnicodeWarning } from "@/components/sms/SmsCharCounter";
import { PhonePreview } from "@/components/sms/PhonePreview";
import {
  VariableInsertButtons,
  useVariableAutocomplete,
  VariableSuggestionDropdown,
} from "@/components/sms/VariableInsert";

// shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
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
  FileText,
  Loader2,
} from "lucide-react";

// ==========================================
// Types
// ==========================================

type Template = TemplateItem;

type CategoryKey = "all" | "general" | "otp" | "marketing" | "notification";

// ==========================================
// Constants — Nansen-aligned
// ==========================================

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "general", label: "ทั่วไป" },
  { key: "otp", label: "OTP" },
  { key: "marketing", label: "การตลาด" },
  { key: "notification", label: "แจ้งเตือน" },
];

const CATEGORY_STYLES: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  general: {
    bg: "bg-[rgba(155,161,165,0.08)]",
    text: "text-[var(--text-muted)]",
    dot: "bg-[var(--text-muted)]",
  },
  otp: {
    bg: "bg-[rgba(var(--accent-rgb),0.08)]",
    text: "text-[var(--accent)]",
    dot: "bg-[var(--accent)]",
  },
  marketing: {
    bg: "bg-[rgba(var(--warning-rgb),0.08)]",
    text: "text-[var(--warning)]",
    dot: "bg-[var(--warning)]",
  },
  notification: {
    bg: "bg-[rgba(var(--accent-secondary-rgb,50,152,218),0.08)]",
    text: "text-[var(--accent-secondary)]",
    dot: "bg-[var(--accent-secondary)]",
  },
};

const VARIABLES = [
  { label: "ชื่อ", value: "{{name}}" },
  { label: "รหัส", value: "{{code}}" },
  { label: "วันที่", value: "{{date}}" },
  { label: "จำนวนเงิน", value: "{{amount}}" },
];

// ==========================================
// Zod schema
// ==========================================

const templateFormSchema = z.object({
  name: z
    .string()
    .min(1, "กรุณาตั้งชื่อเทมเพลต")
    .max(100, "ชื่อต้องไม่เกิน 100 ตัวอักษร"),
  category: z.enum(["general", "otp", "marketing", "notification"]),
  content: z
    .string()
    .min(1, "กรุณากรอกข้อความ")
    .max(1000, "ข้อความต้องไม่เกิน 1,000 ตัวอักษร"),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

// ==========================================
// Helpers
// ==========================================

function getCategoryStyle(category: string) {
  return CATEGORY_STYLES[category] || CATEGORY_STYLES.general;
}

function getCategoryLabel(category: string) {
  const found = CATEGORIES.find((c) => c.key === category);
  return found ? found.label : category;
}

function highlightVariables(text: string) {
  const parts = text.split(/(\{\{[^}]+\}\})/g);
  return parts.map((part, i) => {
    if (/^\{\{.+\}\}$/.test(part)) {
      return (
        <span
          key={i}
          className="inline-block px-1.5 py-0.5 rounded bg-[rgba(var(--accent-rgb),0.06)] text-[var(--accent)] text-[11px] font-mono font-semibold mx-0.5 border border-[rgba(var(--accent-rgb),0.1)]"
        >
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{([^}]+)\}\}/g);
  return matches ? [...new Set(matches)] : [];
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ==========================================
// Main Component
// ==========================================

export default function TemplatesClient({
  initialTemplates,
}: {
  initialTemplates: Template[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Filter
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all");

  // Dialog states
  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null);

  // Textarea ref for cursor insertion
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Form
  const form = useForm<TemplateFormValues>({
    mode: "onChange",
    resolver: zodResolver(templateFormSchema),
    defaultValues: { name: "", category: "general", content: "" },
  });

  const contentValue = form.watch("content");

  // ==========================================
  // Derived data
  // ==========================================

  const filtered = useMemo(() => {
    if (activeCategory === "all") return initialTemplates;
    return initialTemplates.filter((t) => t.category === activeCategory);
  }, [initialTemplates, activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: initialTemplates.length };
    for (const t of initialTemplates) {
      counts[t.category] = (counts[t.category] || 0) + 1;
    }
    return counts;
  }, [initialTemplates]);

  // ==========================================
  // Handlers
  // ==========================================

  function openCreate() {
    setEditingTemplate(null);
    form.reset({ name: "", category: "general", content: "" });
    setShowDialog(true);
  }

  function openEdit(template: Template) {
    setEditingTemplate(template);
    form.reset({
      name: template.name,
      category: template.category as TemplateFormValues["category"],
      content: template.content,
    });
    setShowDialog(true);
  }

  function insertVariable(variable: string) {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const current = form.getValues("content");
      const newContent =
        current.substring(0, start) + variable + current.substring(end);
      form.setValue("content", newContent, { shouldValidate: true });
      // Restore cursor
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd =
          start + variable.length;
        textarea.focus();
      }, 0);
    } else {
      form.setValue("content", form.getValues("content") + variable, {
        shouldValidate: true,
      });
    }
  }

  function handleSubmit(data: TemplateFormValues) {
    startTransition(async () => {
      try {
        if (editingTemplate) {
          await updateTemplate(editingTemplate.id, {
            name: data.name.trim(),
            content: data.content,
            category: data.category,
          });
          toast("success", "อัปเดตเทมเพลตสำเร็จ!");
        } else {
          await createTemplate({
            name: data.name.trim(),
            content: data.content,
            category: data.category,
          });
          toast("success", "สร้างเทมเพลตสำเร็จ!");
        }
        setShowDialog(false);
        router.refresh();
      } catch (e) {
        toast("error", safeErrorMessage(e));
      }
    });
  }

  function handleDeleteConfirm() {
    if (!deletingTemplate) return;
    startTransition(async () => {
      try {
        await deleteTemplate(deletingTemplate.id);
        toast("success", "ลบเทมเพลตสำเร็จ");
        setShowDeleteAlert(false);
        setDeletingTemplate(null);
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
    <div className="p-4 md:p-8 max-w-6xl pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            เทมเพลตข้อความ
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            จัดการเทมเพลตข้อความสำเร็จรูป ({initialTemplates.length} รายการ)
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          สร้างใหม่
        </Button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {CATEGORIES.map(({ key, label }) => {
          const isActive = activeCategory === key;
          const count = categoryCounts[key] || 0;
          return (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all flex items-center gap-2 border min-h-[36px] ${
                isActive
                  ? "bg-[rgba(var(--accent-rgb),0.08)] border-[rgba(var(--accent-rgb),0.3)] text-[var(--accent)]"
                  : "bg-transparent border-[var(--border-default)] text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.03)] hover:text-[var(--text-primary)]"
              }`}
            >
              {key !== "all" && (
                <span
                  className={`w-2 h-2 rounded-full ${getCategoryStyle(key).dot}`}
                />
              )}
              {label}
              <span className="text-[11px] opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Template Cards Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((template) => {
            const style = getCategoryStyle(template.category);
            const vars = extractVariables(template.content);

            return (
              <Card
                key={template.id}
                className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg p-4 hover:border-[rgba(var(--accent-rgb),0.15)] hover:-translate-y-0.5 transition-all group"
              >
                {/* Top row: name + category badge */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-[15px] font-semibold text-[var(--text-primary)] leading-snug pr-4 line-clamp-1">
                    {template.name}
                  </h3>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${style.bg} ${style.text}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${style.dot}`}
                    />
                    {getCategoryLabel(template.category)}
                  </span>
                </div>

                {/* Content preview */}
                <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-3 line-clamp-3 min-h-[3.6em]">
                  {highlightVariables(template.content)}
                </div>

                {/* Variables used */}
                {vars.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    {vars.map((v) => (
                      <span
                        key={v}
                        className="text-[11px] px-1.5 py-0.5 rounded bg-[rgba(var(--accent-rgb),0.06)] text-[var(--accent)] font-mono border border-[rgba(var(--accent-rgb),0.1)]"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer: timestamp + actions */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--border-default)]">
                  <span className="text-[12px] text-[var(--text-muted)]">
                    อัปเดต {formatDate(template.updatedAt)}
                  </span>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(template)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)] transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingTemplate(template);
                        setShowDeleteAlert(true);
                      }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[rgba(var(--error-rgb,239,68,68),0.06)] transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        activeCategory === "all" ? (
        <EmptyState
          icon={FileText}
          iconColor="var(--accent-secondary)"
          iconBg="rgba(71,121,255,0.06)"
          iconBorder="rgba(71,121,255,0.1)"
          title="ยังไม่มี Template"
          description="สร้างเทมเพลตข้อความเพื่อใช้ซ้ำได้สะดวก"
          ctaLabel="+ สร้าง Template"
          ctaAction={openCreate}
        />
        ) : (
        <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(var(--accent-rgb),0.08)] border border-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-[var(--accent)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            {`ไม่มีเทมเพลตในหมวด "${getCategoryLabel(activeCategory)}"`}
          </h3>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            สร้างเทมเพลตข้อความสำเร็จรูปเพื่อส่งข้อความได้รวดเร็วขึ้น
          </p>
          <Button
            onClick={openCreate}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            สร้างเทมเพลต
          </Button>
        </Card>
        )
      )}

      {/* Mobile action buttons — visible on cards (touch targets) */}
      <div className="md:hidden mt-4">
        {filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((template) => {
              const style = getCategoryStyle(template.category);
              return (
                <div
                  key={`mobile-actions-${template.id}`}
                  className="flex items-center justify-end gap-2 px-1"
                >
                  <span className="flex-1 text-xs text-[var(--text-muted)] truncate">
                    {template.name}
                  </span>
                  <button
                    onClick={() => openEdit(template)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setDeletingTemplate(template);
                      setShowDeleteAlert(true);
                    }}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==========================================
          DIALOGS
          ========================================== */}

      {/* Create / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)] text-lg">
              {editingTemplate ? "แก้ไขเทมเพลต" : "สร้างเทมเพลตใหม่"}
            </DialogTitle>
            <DialogDescription className="text-[var(--text-muted)]">
              {editingTemplate
                ? "แก้ไขข้อมูลเทมเพลตข้อความ"
                : "สร้างเทมเพลตข้อความสำเร็จรูปสำหรับส่ง SMS"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
                      ชื่อเทมเพลต *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="เช่น ยืนยัน OTP, โปรโมชั่นประจำเดือน"
                        maxLength={100}
                        className="h-11 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(0,255,167,0.12)]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category — RadioGroup style inline cards */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
                      หมวดหมู่
                    </FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {CATEGORIES.filter((c) => c.key !== "all").map(
                        ({ key, label }) => {
                          const catStyle = getCategoryStyle(key);
                          const isSelected = field.value === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => field.onChange(key)}
                              className={`px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all flex items-center gap-2 border ${
                                isSelected
                                  ? "border-[rgba(var(--accent-rgb),0.5)] bg-[rgba(var(--accent-rgb),0.04)] text-[var(--text-primary)]"
                                  : "border-[var(--border-default)] bg-transparent text-[var(--text-muted)] hover:border-[rgba(var(--accent-rgb),0.2)] hover:text-[var(--text-primary)]"
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${catStyle.dot}`}
                              />
                              {label}
                            </button>
                          );
                        },
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Content */}
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
                        ข้อความ *
                      </FormLabel>
                      <span
                        className={`text-[10px] font-mono ${
                          field.value.length > 900
                            ? "text-[var(--error)]"
                            : field.value.length > 700
                              ? "text-[var(--warning)]"
                              : "text-[var(--text-muted)]"
                        }`}
                      >
                        {field.value.length}/1,000
                      </span>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="พิมพ์ข้อความ... ใช้ {{name}} สำหรับตัวแปร"
                        maxLength={1000}
                        rows={5}
                        className="bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg resize-y min-h-[120px] focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(0,255,167,0.12)]"
                        {...field}
                        ref={(el) => {
                          field.ref(el);
                          (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
                        }}
                      />
                    </FormControl>
                    {field.value && (
                      <div className="mt-1.5">
                        <SmsCharCounter message={field.value} />
                      </div>
                    )}
                    <UnicodeWarning message={field.value} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Variable helper buttons */}
              <VariableInsertButtons onInsert={insertVariable} />

              {/* Phone Preview */}
              {contentValue.trim() && (
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-2">
                    ตัวอย่าง (Phone Preview)
                  </label>
                  <PhonePreview message={contentValue} senderName="EasySlip" />
                </div>
              )}

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
                  ) : editingTemplate ? (
                    "อัปเดต"
                  ) : (
                    "สร้างเทมเพลต"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[var(--text-primary)]">
              ลบเทมเพลต?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--text-muted)]">
              การลบเทมเพลต &ldquo;{deletingTemplate?.name}&rdquo;
              จะไม่สามารถกู้คืนได้
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
    </div>
  );
}
