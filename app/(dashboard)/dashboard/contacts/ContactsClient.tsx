"use client";

import { useState, useEffect, useTransition, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { safeErrorMessage } from "@/lib/error-messages";
import { formatThaiDateOnly } from "@/lib/format-thai-date";
import { displayPhone } from "@/lib/validations";
import {
  createContact,
  updateContact,
  deleteContact,
  importContacts,
  exportContacts,
  bulkDeleteContacts,
  bulkUpdateTags,
  addContactsToGroup,
} from "@/lib/actions/contacts";
import { useToast } from "@/app/components/ui/Toast";
import ImportWizard from "./ImportWizard";
import EmptyState from "@/components/EmptyState";
import CustomSelect from "@/components/ui/CustomSelect";
import { TAG_PRESETS, TAG_COLORS, MAX_VISIBLE_TAGS, getTagColor } from "@/lib/tag-utils";
import type { ContactItem, ContactTag, ContactGroupItem, PaginationMeta } from "@/lib/types/api-responses";
import type { ContactStats } from "@/lib/actions/contacts";
import { toCsvCell } from "@/lib/csv";

// shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Search,
  Plus,
  Upload,
  Download,
  FileText,
  FileSpreadsheet,
  Pencil,
  Trash2,
  X,
  Check,
  Tag,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FolderPlus,
  UserPlus,
  Minus,
  ShieldOff,
  Folder,
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

// ==========================================
// Types — shared from api-responses.ts
// ==========================================

type Contact = ContactItem;

/** Extract tag names from ContactTag[] (new API format) */
function getTagNames(tags: ContactTag[] | string | null): string[] {
  if (!tags) return [];
  if (typeof tags === "string") return tags.split(",").map(t => t.trim()).filter(Boolean);
  return tags.map(t => t.name);
}

// ==========================================
// Zod schemas for contact form
// ==========================================

const contactFormSchema = z.object({
  name: z
    .string()
    .min(1, "กรุณากรอกชื่อ")
    .max(100, "ชื่อต้องไม่เกิน 100 ตัวอักษร"),
  phone: z
    .string()
    .regex(/^0[0-9]\d{8}$/, "เบอร์โทรไม่ถูกต้อง (เช่น 0891234567)"),
  email: z
    .string()
    .email("อีเมลไม่ถูกต้อง")
    .or(z.literal(""))
    .optional(),
  tags: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const THAI_PHONE_REGEX = /^(0[689]\d{8}|\+66[689]\d{8})$/;

const quickAddSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ"),
  phones: z
    .string()
    .min(1, "กรุณากรอกเบอร์โทร")
    .refine(
      (val) => {
        const list = val
          .split(/[,\n\r]+/)
          .map((p) => p.trim())
          .filter(Boolean);
        return list.length > 0 && list.every((p) => THAI_PHONE_REGEX.test(p));
      },
      "เบอร์โทรไม่ถูกต้อง — ใช้รูปแบบ 0XXXXXXXXX (เช่น 0891234567)",
    ),
});

type QuickAddValues = z.infer<typeof quickAddSchema>;

// ==========================================
// Tag Chip sub-component
// ==========================================

function TagChip({
  tag,
  onRemove,
  size = "sm",
  dbColor,
}: {
  tag: string;
  onRemove?: () => void;
  size?: "xs" | "sm";
  dbColor?: string | null;
}) {
  const color = getTagColor(tag, dbColor);
  const sizeClasses =
    size === "xs" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold uppercase tracking-wider rounded-md ${sizeClasses} ${color.bg} ${color.text}`}
    >
      {tag}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`ลบแท็ก ${tag}`}
          className="ml-0.5 hover:opacity-70 transition-opacity"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
}

// ==========================================
// Tag Input sub-component (for form)
// ==========================================

function TagInput({
  tags,
  onChange,
  allTags,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  allTags: string[];
}) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    const query = inputValue.toLowerCase().trim();
    if (!query) return [];
    const combined = [...new Set([...allTags, ...TAG_PRESETS])];
    return combined
      .filter((t) => t.toLowerCase().includes(query) && !tags.includes(t))
      .slice(0, 6);
  }, [inputValue, allTags, tags]);

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (trimmed && !tags.includes(trimmed)) {
        onChange([...tags, trimmed]);
      }
      setInputValue("");
      inputRef.current?.focus();
    },
    [tags, onChange],
  );

  const removeTag = useCallback(
    (tag: string) => {
      onChange(tags.filter((t) => t !== tag));
    },
    [tags, onChange],
  );

  return (
    <div className="relative">
      <div
        className="flex flex-wrap gap-1.5 min-h-[42px] items-center py-1.5 px-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)] cursor-text focus-within:border-[rgba(var(--accent-rgb),0.6)]"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <TagChip key={tag} tag={tag} onRemove={() => removeTag(tag)} size="xs" />
        ))}
        <input
          ref={inputRef}
          type="text"
          className="bg-transparent outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] flex-1 min-w-[80px]"
          placeholder={tags.length === 0 ? "พิมพ์แล้วกด Enter..." : ""}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (inputValue.trim()) addTag(inputValue);
            } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
              removeTag(tags[tags.length - 1]);
            }
          }}
        />
      </div>

      {/* Presets — show unselected presets always */}
      {!inputValue && TAG_PRESETS.filter((p) => !tags.includes(p)).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {TAG_PRESETS.filter((p) => !tags.includes(p)).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => addTag(preset)}
              className="text-[10px] px-2 py-0.5 rounded-md bg-[rgba(var(--accent-rgb),0.06)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors border border-[var(--border-default)]"
            >
              + {preset}
            </button>
          ))}
        </div>
      )}

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xl overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="w-full text-left px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[rgba(var(--accent-rgb),0.04)] transition-colors flex items-center gap-2"
            >
              <TagChip tag={s} size="xs" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// Main Component
// ==========================================

export default function ContactsClient({
  initialContacts,
  totalContacts,
  initialPage = 1,
  initialLimit = 20,
  totalPages = 1,
  groups = [],
  stats,
  initialStatus = "all",
  availableTags = [],
}: {
  initialContacts: Contact[];
  totalContacts: number;
  initialPage?: number;
  initialLimit?: number;
  totalPages?: number;
  groups?: ContactGroupItem[];
  stats?: ContactStats;
  initialStatus?: string;
  availableTags?: { name: string; color: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [showBulkDeleteAlert, setShowBulkDeleteAlert] = useState(false);
  const [showAddToGroup, setShowAddToGroup] = useState(false);
  const [addToGroupId, setAddToGroupId] = useState("");

  // Tab state (ทั้งหมด | กลุ่ม)
  const [activeTab, setActiveTab] = useState<"contacts" | "groups">("contacts");

  // Filter / search state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [activeGroupFilter, setActiveGroupFilter] = useState<string | null>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>(initialStatus);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Batch tag state
  const [showBatchTagInput, setShowBatchTagInput] = useState(false);
  const [batchTagValue, setBatchTagValue] = useState("");
  const [batchAction, setBatchAction] = useState<"add" | "remove">("add");
  const [batchTagColor, setBatchTagColor] = useState<string | null>(null);

  // Import ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // Forms (RHF + Zod)
  // ==========================================

  const contactForm = useForm<ContactFormValues>({
    mode: "onChange",
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: "", phone: "", email: "", tags: "" },
  });

  const quickAddForm = useForm<QuickAddValues>({
    mode: "onChange",
    resolver: zodResolver(quickAddSchema),
    defaultValues: { name: "Quick Import", phones: "" },
  });

  // Tag state for form (managed separately because TagInput is custom)
  const [formTags, setFormTags] = useState<string[]>([]);

  // Available tags — initialized from server prop, re-fetched when dialog opens
  const [localAvailableTags, setLocalAvailableTags] = useState<{ name: string; color: string }[]>(availableTags);

  const refreshTags = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/tags", { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        const fetched = (json.data?.tags ?? json.tags ?? []) as { name: string; color?: string }[];
        setLocalAvailableTags(fetched.map((t) => ({ name: t.name, color: t.color ?? "" })));
      }
    } catch {
      // ignore — keep current list
    }
  }, []);

  // Load fresh tags on mount
  useEffect(() => {
    refreshTags();
  }, [refreshTags]);

  // Optimistic tag overrides — instant UI update before server responds
  const [tagOverrides, setTagOverrides] = useState<Map<string, string[]>>(new Map());

  // Merge initialContacts with optimistic tag overrides
  const contacts = useMemo(() => {
    if (tagOverrides.size === 0) return initialContacts;
    return initialContacts.map((c) => {
      const override = tagOverrides.get(c.id);
      if (!override) return c;
      return { ...c, tags: override.map((name) => ({ id: name, name, color: "" })) };
    });
  }, [initialContacts, tagOverrides]);

  // Clear overrides when server data refreshes (initialContacts changes)
  useEffect(() => {
    setTagOverrides(new Map());
  }, [initialContacts]);

  // ==========================================
  // Derived data
  // ==========================================

  const allTags = useMemo(() => {
    const tagMap = new Map<string, number>();
    contacts.forEach((c) => {
      getTagNames(c.tags).forEach((tag) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });
    return tagMap;
  }, [contacts]);

  // Build color map from DB tags + contact tags
  const tagColorMap = useMemo(() => {
    const map = new Map<string, string>();
    localAvailableTags.forEach((t) => map.set(t.name, t.color));
    contacts.forEach((c) => {
      const tags = c.tags;
      if (Array.isArray(tags)) {
        tags.forEach((t: { name: string; color?: string }) => {
          if (t.color && !map.has(t.name)) map.set(t.name, t.color);
        });
      }
    });
    return map;
  }, [localAvailableTags, contacts]);

  const allTagNames = useMemo(
    () => [...new Set([...Array.from(allTags.keys()), ...localAvailableTags.map((t) => t.name)])],
    [allTags, localAvailableTags],
  );

  const filteredContacts = useMemo(() => {
    let result = contacts;

    if (activeStatusFilter === "active") {
      result = result.filter((c) => c.smsConsent);
    } else if (activeStatusFilter === "opted-out") {
      result = result.filter((c) => !c.smsConsent);
    }

    if (activeTagFilter) {
      result = result.filter((c) => getTagNames(c.tags).includes(activeTagFilter));
    }

    if (activeGroupFilter) {
      result = result.filter((c) => c.groups.some((g) => g.id === activeGroupFilter));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          displayPhone(c.phone).includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          getTagNames(c.tags).some((t) => t.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [contacts, activeStatusFilter, activeTagFilter, activeGroupFilter, searchQuery]);

  const hasSelection = selectedIds.size > 0;
  const allSelected =
    filteredContacts.length > 0 &&
    filteredContacts.every((c) => selectedIds.has(c.id));

  // ==========================================
  // Navigation
  // ==========================================

  function navigatePage(page: number, limit?: number) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit ?? initialLimit));
    startTransition(() => {
      router.push(`/dashboard/contacts?${params.toString()}`);
    });
  }

  // ==========================================
  // Handlers
  // ==========================================

  function openAddDialog() {
    setEditingContact(null);
    contactForm.reset({ name: "", phone: "", email: "", tags: "" });
    setFormTags([]);
    refreshTags();
    setShowContactDialog(true);
  }

  function openEditDialog(contact: Contact) {
    setEditingContact(contact);
    contactForm.reset({
      name: contact.name,
      phone: displayPhone(contact.phone),
      email: contact.email || "",
      tags: getTagNames(contact.tags).join(", "),
    });
    setFormTags(getTagNames(contact.tags));
    refreshTags();
    setShowContactDialog(true);
  }

  function handleContactSubmit(data: ContactFormValues) {
    const tagsStr = formTags.length > 0 ? formTags.join(", ") : undefined;

    startTransition(async () => {
      try {
        if (editingContact) {
          await updateContact(editingContact.id, {
            name: data.name.trim(),
            phone: data.phone.trim(),
            email: data.email?.trim() || undefined,
            tags: tagsStr,
          });
          toast("success", "อัปเดตรายชื่อสำเร็จ!");
        } else {
          await createContact({
            name: data.name.trim(),
            phone: data.phone.trim(),
            email: data.email?.trim() || undefined,
            tags: tagsStr,
          });
          toast("success", "เพิ่มรายชื่อสำเร็จ!");
        }
        setShowContactDialog(false);
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("เบอร์โทรนี้มีอยู่แล้ว")) {
          contactForm.setError("phone", { message: "เบอร์โทรนี้มีอยู่ในระบบแล้ว" });
        } else {
          toast("error", safeErrorMessage(e));
        }
      }
    });
  }

  function handleDeleteConfirm() {
    if (!deletingContact) return;
    const contactId = deletingContact.id;

    startTransition(async () => {
      try {
        await deleteContact(contactId);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(contactId);
          return next;
        });
        toast("success", "ลบรายชื่อสำเร็จ");
        router.refresh();
      } catch (e) {
        toast("error", safeErrorMessage(e));
      } finally {
        setShowDeleteAlert(false);
        setDeletingContact(null);
      }
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContacts.map((c) => c.id)));
    }
  }

  function handleBatchTag(tagOverride?: string, colorOverride?: string) {
    const tag = (tagOverride ?? batchTagValue).trim();
    if (!tag) return;
    const color = colorOverride ?? batchTagColor ?? undefined;

    startTransition(async () => {
      try {
        await bulkUpdateTags(Array.from(selectedIds), tag, batchAction, undefined, color);
        toast(
          "success",
          `${batchAction === "add" ? "เพิ่ม" : "ลบ"}แท็ก "${tag}" สำเร็จ ${selectedIds.size} รายชื่อ`,
        );
        setBatchTagValue("");
        setBatchTagColor(null);
        setShowBatchTagInput(false);
        setSelectedIds(new Set());
        router.refresh();
      } catch (e) {
        toast("error", safeErrorMessage(e));
      }
    });
  }

  function handleBulkDeleteConfirm() {
    if (selectedIds.size === 0) return;
    startTransition(async () => {
      try {
        const result = await bulkDeleteContacts(Array.from(selectedIds));
        toast("success", `ลบ ${result.deleted} รายชื่อสำเร็จ`);
        setSelectedIds(new Set());
        setShowBulkDeleteAlert(false);
        router.refresh();
      } catch (e) {
        toast("error", safeErrorMessage(e));
      }
    });
  }

  function handleBulkAddToGroup() {
    if (!addToGroupId || selectedIds.size === 0) return;
    startTransition(async () => {
      try {
        await addContactsToGroup(addToGroupId, Array.from(selectedIds));
        toast("success", `เพิ่ม ${selectedIds.size} รายชื่อเข้ากลุ่มสำเร็จ`);
        setSelectedIds(new Set());
        setShowAddToGroup(false);
        setAddToGroupId("");
        router.refresh();
      } catch (e) {
        toast("error", safeErrorMessage(e));
      }
    });
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      let text = evt.target?.result as string;
      if (!text) return;
      // Strip UTF-8 BOM (common in Thai Excel/CSV exports) and normalize line endings
      text = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");

      const lines = text.split("\n").filter(Boolean);
      if (lines.length < 2) {
        toast("error", "ไฟล์ CSV ต้องมีหัวข้อและข้อมูลอย่างน้อย 1 แถว");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const nameIdx = headers.findIndex((h) => h === "name" || h === "ชื่อ");
      const phoneIdx = headers.findIndex(
        (h) => h === "phone" || h === "เบอร์โทร" || h === "tel",
      );

      if (nameIdx === -1 || phoneIdx === -1) {
        toast("error", "ไฟล์ CSV ต้องมีคอลัมน์ name และ phone");
        return;
      }

      const contacts = lines
        .slice(1)
        .map((line) => {
          const cols = line.split(",").map((c) => c.trim());
          return { name: cols[nameIdx] || "", phone: cols[phoneIdx] || "" };
        })
        .filter((c) => c.name && c.phone);

      if (contacts.length === 0) {
        toast("error", "ไม่พบข้อมูลที่ถูกต้องในไฟล์");
        return;
      }

      startTransition(async () => {
        try {
          const result = await importContacts(contacts);
          toast(
            "success",
            `นำเข้าสำเร็จ ${result.imported} รายชื่อ${result.skipped > 0 ? ` (ข้าม ${result.skipped})` : ""}`,
          );
          router.refresh();
        } catch (err) {
          toast("error", err instanceof Error ? err.message : "นำเข้าไม่สำเร็จ");
        }
      });
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleExport() {
    startTransition(async () => {
      try {
        const data = await exportContacts();
        if (data.length === 0) {
          toast("warning", "ไม่มีรายชื่อให้ส่งออก");
          return;
        }
        const headers = ["name", "phone", "email", "tags", "groups"];
        const csv = [
          headers.join(","),
          ...data.map((row: Record<string, string>) =>
            headers
              .map((h) => toCsvCell(row[h] || ""))
              .join(","),
          ),
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csv], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast("success", `ส่งออก ${data.length} รายชื่อสำเร็จ`);
      } catch (e) {
        toast("error", safeErrorMessage(e));
      }
    });
  }

  function handleQuickAddSubmit(data: QuickAddValues) {
    const phones = data.phones
      .split(/[,\n\r]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (phones.length === 0) return;

    const contacts = phones.map((phone) => ({
      name: data.name.trim() || "Quick Import",
      phone,
    }));

    startTransition(async () => {
      try {
        const result = await importContacts(contacts);
        toast(
          "success",
          `เพิ่มสำเร็จ ${result.imported} เบอร์${result.skipped > 0 ? ` (ซ้ำ ${result.skipped})` : ""}`,
        );
        setShowQuickAdd(false);
        quickAddForm.reset();
        router.refresh();
      } catch (e) {
        toast("error", safeErrorMessage(e));
      }
    });
  }

  function handleDownloadTemplate() {
    const csv =
      "name,phone,email\nตัวอย่าง ชื่อ,0891234567,example@email.com\n";
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleQuickTagToggle(contactId: string, tag: string) {
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;
    const currentTags = getTagNames(contact.tags);
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];

    // Optimistic update — UI updates instantly
    setTagOverrides((prev) => new Map(prev).set(contactId, newTags));

    // Save to server in background
    startTransition(async () => {
      try {
        await updateContact(contactId, { tags: newTags.join(", ") });
        router.refresh();
      } catch {
        // Revert on error
        setTagOverrides((prev) => {
          const next = new Map(prev);
          next.delete(contactId);
          return next;
        });
        toast("error", "เกิดข้อผิดพลาด");
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
            รายชื่อผู้ติดต่อ
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            จัดการรายชื่อผู้ติดต่อ ({totalContacts} รายชื่อ)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Download Template */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            className="border-[var(--border-default)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(var(--accent-rgb),0.04)] hover:border-[rgba(var(--accent-rgb),0.3)]"
          >
            <FileText className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">ดาวน์โหลดตัวอย่าง Template</span>
          </Button>
          {/* Import CSV */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImport}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="border-[var(--border-default)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(var(--accent-rgb),0.04)] hover:border-[rgba(var(--accent-rgb),0.3)]"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">นำเข้า</span>
          </Button>
          {/* Import Excel */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImportWizard(true)}
            className="border-[var(--border-default)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(var(--accent-rgb),0.04)] hover:border-[rgba(var(--accent-rgb),0.3)]"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Excel</span>
          </Button>
          {/* Export */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isPending}
            className="border-[var(--border-default)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(var(--accent-rgb),0.04)] hover:border-[rgba(var(--accent-rgb),0.3)]"
          >
            <Download className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">ส่งออก</span>
          </Button>
          {/* Quick Add */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQuickAdd(true)}
            className="border-[var(--border-default)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(var(--accent-rgb),0.04)] hover:border-[rgba(var(--accent-rgb),0.3)]"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Quick Add</span>
          </Button>
          {/* Add Contact */}
          <Button
            size="sm"
            onClick={openAddDialog}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            เพิ่มรายชื่อ
          </Button>
        </div>
      </div>

      {/* ═══ Stat Cards ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Users, label: "ทั้งหมด", value: stats?.total ?? totalContacts, color: "var(--text-muted)" },
          { icon: CheckCircle2, label: "Active", value: stats?.active ?? totalContacts, color: "var(--success)" },
          { icon: ShieldOff, label: "Opted-out", value: stats?.optedOut ?? 0, color: "var(--warning)" },
          { icon: Folder, label: "กลุ่ม", value: stats?.groups ?? groups.length, color: "var(--accent)" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-4"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${stat.color} 10%, transparent)` }}>
                <stat.icon className="size-[18px]" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ Tab Navigation ═══ */}
      <div className="flex items-center gap-1 mb-6 border-b border-[var(--border-default)]">
        <button
          type="button"
          onClick={() => setActiveTab("contacts")}
          className={`relative px-4 py-3 text-sm font-medium transition-colors min-h-[44px] ${
            activeTab === "contacts"
              ? "text-[var(--accent)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          ทั้งหมด ({totalContacts.toLocaleString()})
          {activeTab === "contacts" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)] rounded-full" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("groups")}
          className={`relative px-4 py-3 text-sm font-medium transition-colors min-h-[44px] ${
            activeTab === "groups"
              ? "text-[var(--accent)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          กลุ่ม ({groups.length})
          {activeTab === "groups" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)] rounded-full" />
          )}
        </button>
      </div>

      {/* ═══ Groups Tab ═══ */}
      {activeTab === "groups" && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="w-14 h-14 mx-auto mb-3 rounded-lg flex items-center justify-center" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
                  <Folder className="size-6 text-[var(--text-muted)]" />
                </div>
                <p className="text-sm text-[var(--text-primary)] mb-1">ยังไม่มีกลุ่ม</p>
                <p className="text-xs text-[var(--text-muted)]">สร้างกลุ่มเพื่อจัดระเบียบรายชื่อผู้ติดต่อ</p>
              </div>
            ) : (
              groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => router.push(`/dashboard/contacts/groups/${group.id}`)}
                  className="rounded-xl p-5 text-left transition-all hover:translate-y-[-1px] cursor-pointer"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-default)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(var(--accent-rgb),0.3)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-default)")}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Folder className="size-5 text-[var(--text-muted)]" />
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">{group.name}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {(group.memberCount ?? 0).toLocaleString()} contacts
                  </p>
                  <div className="mt-3 pt-3 border-t border-[var(--border-default)]">
                    <span className="text-xs text-[var(--accent)] font-medium">ดูสมาชิก →</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═══ Contacts Tab Content ═══ */}
      {activeTab === "contacts" && (<>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <Input
            type="text"
            className="pl-10 h-11 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(var(--accent-rgb),0.12)]"
            placeholder="ค้นหาชื่อ, เบอร์โทร, อีเมล..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <CustomSelect
          value={activeStatusFilter}
          onChange={(v) => setActiveStatusFilter(v)}
          options={[
            { value: "all", label: "ทุกสถานะ" },
            { value: "active", label: "● Active" },
            { value: "opted-out", label: "○ Opted-out" },
          ]}
          placeholder="สถานะ"
        />
      </div>

      {/* Group Filter Chips */}
      {groups.length > 0 && (
        <div className="flex items-center gap-3 mb-4 overflow-x-auto pb-1">
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium shrink-0">
            กลุ่ม:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveGroupFilter(null)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all border min-h-[32px] ${
                activeGroupFilter === null
                  ? "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] border-[rgba(var(--accent-rgb),0.2)]"
                  : "bg-transparent text-[var(--text-muted)] border-[var(--border-default)] hover:text-[var(--text-primary)] hover:border-[rgba(var(--accent-rgb),0.2)]"
              }`}
            >
              ทั้งหมด
            </button>
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() =>
                  setActiveGroupFilter(activeGroupFilter === g.id ? null : g.id)
                }
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all border inline-flex items-center gap-1.5 min-h-[32px] ${
                  activeGroupFilter === g.id
                    ? "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] border-[rgba(var(--accent-rgb),0.2)]"
                    : "bg-transparent text-[var(--text-muted)] border-[var(--border-default)] hover:text-[var(--text-primary)] hover:border-[rgba(var(--accent-rgb),0.2)]"
                }`}
              >
                <Users className="w-3 h-3" />
                {g.name}
                <span className="text-[10px] bg-[rgba(var(--accent-rgb),0.06)] px-1.5 rounded-full">
                  {g.memberCount}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tag Filter Chips */}
      {allTags.size > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setActiveTagFilter(null)}
            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-all border min-h-[32px] ${
              activeTagFilter === null
                ? "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] border-[rgba(var(--accent-rgb),0.2)]"
                : "bg-transparent text-[var(--text-muted)] border-[var(--border-default)] hover:text-[var(--text-primary)] hover:border-[rgba(var(--accent-rgb),0.2)]"
            }`}
          >
            ทั้งหมด
            <span className="text-[10px] bg-[rgba(var(--accent-rgb),0.06)] px-1.5 rounded-full">
              {totalContacts}
            </span>
          </button>
          {Array.from(allTags.entries()).map(([tag, count]) => {
            const color = getTagColor(tag, tagColorMap.get(tag));
            const isActive = activeTagFilter === tag;
            return (
              <button
                key={tag}
                onClick={() => setActiveTagFilter(isActive ? null : tag)}
                className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold uppercase tracking-wider transition-all border min-h-[32px] ${
                  isActive
                    ? `${color.activeBg} ${color.text} ${color.border}`
                    : `bg-transparent text-[var(--text-muted)] border-[var(--border-default)] hover:text-[var(--text-primary)] hover:border-[rgba(var(--accent-rgb),0.2)]`
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                {tag}
                <span className="text-[10px] bg-[rgba(var(--accent-rgb),0.06)] px-1.5 rounded-full">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Floating Action Bar */}
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
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-[var(--text-primary)] font-medium whitespace-nowrap">
              เลือก {selectedIds.size} รายการ
            </span>
            <div className="h-4 w-px bg-[var(--border-default)]" />
            {/* Desktop buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBatchAction("add");
                  setShowBatchTagInput(!showBatchTagInput || batchAction !== "add");
                }}
                className="border-[var(--border-default)] bg-transparent text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[rgba(var(--accent-rgb),0.3)]"
              >
                <Tag className="w-3 h-3 mr-1" />
                ติดแท็ก
              </Button>
              {groups.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddToGroup(true)}
                  className="border-[var(--border-default)] bg-transparent text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[rgba(var(--accent-rgb),0.3)]"
                >
                  <FolderPlus className="w-3 h-3 mr-1" />
                  ย้ายกลุ่ม
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="border-[var(--border-default)] bg-transparent text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[rgba(var(--accent-rgb),0.3)]"
              >
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkDeleteAlert(true)}
                disabled={isPending}
                className="border-[rgba(var(--error-rgb,239,68,68),0.2)] bg-[rgba(var(--error-rgb,239,68,68),0.1)] text-[var(--error)] hover:bg-[rgba(var(--error-rgb,239,68,68),0.15)] hover:border-[rgba(var(--error-rgb,239,68,68),0.3)]"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                ลบ
              </Button>
            </div>
            {/* Mobile icon-only buttons */}
            <div className="flex sm:hidden items-center gap-1">
              {groups.length > 0 && (
                <button
                  onClick={() => setShowAddToGroup(true)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowBulkDeleteAlert(true)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => {
                setSelectedIds(new Set());
                setShowBatchTagInput(false);
              }}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="ยกเลิกการเลือก"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {showBatchTagInput && (() => {
            const query = batchTagValue.toLowerCase().trim();
            const allOptions = [...new Set([...allTagNames, ...TAG_PRESETS])];
            const filtered = query
              ? allOptions.filter((t) => t.toLowerCase().includes(query))
              : allOptions;
            const hasExact = allOptions.some((t) => t.toLowerCase() === query);

            // Count how many selected contacts already have each tag
            const selectedContacts = contacts.filter((c) => selectedIds.has(c.id));
            const tagCountMap = new Map<string, number>();
            selectedContacts.forEach((c) => {
              getTagNames(c.tags).forEach((t) => {
                tagCountMap.set(t, (tagCountMap.get(t) ?? 0) + 1);
              });
            });
            const total = selectedIds.size;

            return (
              <div className="mt-3 pt-3 border-t border-[var(--border-default)]">
                <div className="flex items-center gap-2 mb-2">
                  <Input
                    type="text"
                    className="h-8 flex-1 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:border-[rgba(var(--accent-rgb),0.6)]"
                    placeholder={batchAction === "add" ? "ค้นหาหรือพิมพ์ชื่อแท็ก..." : "ค้นหาแท็กที่จะลบ..."}
                    value={batchTagValue}
                    onChange={(e) => setBatchTagValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && batchTagValue.trim()) handleBatchTag(); }}
                    autoFocus
                  />
                </div>
                <div className="max-h-36 overflow-y-auto rounded-md border border-[var(--border-default)] bg-[var(--bg-base)]">
                  {filtered.map((tag) => {
                    const color = getTagColor(tag, tagColorMap.get(tag));
                    const count = tagCountMap.get(tag) ?? 0;
                    const allHave = count === total;
                    const someHave = count > 0 && count < total;
                    return (
                      <button
                        key={tag}
                        type="button"
                        disabled={isPending}
                        onClick={() => handleBatchTag(tag)}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-[rgba(var(--accent-rgb),0.06)] transition-colors disabled:opacity-50 ${allHave ? color.text : "text-[var(--text-secondary)]"}`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${color.dot}`} />
                          <span className="truncate">{tag}</span>
                        </span>
                        {allHave && <Check className="w-3 h-3 flex-shrink-0" />}
                        {someHave && (
                          <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0">
                            {count}/{total}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {query && !hasExact && (
                    <div className="border-t border-[var(--border-default)]">
                      {batchAction === "add" && (
                        <div className="px-3 pt-2 pb-1 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-[var(--text-muted)]">สี:</span>
                          {TAG_COLORS.map((c) => (
                            <button
                              key={c.name}
                              type="button"
                              onClick={() => setBatchTagColor(batchTagColor === c.hex ? null : c.hex)}
                              className={`w-4 h-4 rounded-full transition-all ${batchTagColor === c.hex ? "ring-2 ring-offset-1 ring-[var(--border-default)] scale-110" : "opacity-70 hover:opacity-100"}`}
                              style={{ backgroundColor: c.hex }}
                              title={c.name}
                            />
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleBatchTag(batchTagValue.trim(), batchTagColor ?? undefined)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[rgba(var(--accent-rgb),0.06)] transition-colors text-[var(--accent)] disabled:opacity-50"
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: batchTagColor ?? getTagColor(batchTagValue.trim()).hex }}
                        />
                        {batchAction === "add" ? `สร้างแท็กใหม่ "${batchTagValue.trim()}"` : `ลบแท็ก "${batchTagValue.trim()}"`}
                      </button>
                    </div>
                  )}
                  {filtered.length === 0 && !query && (
                    <p className="px-3 py-3 text-xs text-[var(--text-muted)] text-center">ยังไม่มีแท็ก</p>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Contact Table */}
      {filteredContacts.length > 0 ? (
        <>
          {/* Desktop Table */}
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
                  <TableHead className="bg-[var(--bg-secondary)] text-[var(--text-muted)] text-xs uppercase tracking-wider font-medium h-11 w-[160px]">
                    เบอร์โทร
                  </TableHead>
                  <TableHead className="bg-[var(--bg-secondary)] text-[var(--text-muted)] text-xs uppercase tracking-wider font-medium h-11">
                    ชื่อ
                  </TableHead>
                  <TableHead className="bg-[var(--bg-secondary)] text-[var(--text-muted)] text-xs uppercase tracking-wider font-medium h-11 w-[160px]">
                    แท็ก
                  </TableHead>
                  <TableHead className="bg-[var(--bg-secondary)] text-[var(--text-muted)] text-xs uppercase tracking-wider font-medium h-11 w-[100px]">
                    สถานะ
                  </TableHead>
                  <TableHead className="bg-[var(--bg-secondary)] text-[var(--text-muted)] text-xs uppercase tracking-wider font-medium h-11 hidden lg:table-cell">
                    วันที่เพิ่ม
                  </TableHead>
                  <TableHead className="bg-[var(--bg-secondary)] text-[var(--text-muted)] text-xs uppercase tracking-wider font-medium h-11 text-right w-12">
                    <span className="sr-only">จัดการ</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact, idx) => {
                  const contactTags = getTagNames(contact.tags);
                  const visibleTags = contactTags.slice(0, MAX_VISIBLE_TAGS);
                  const overflowCount = contactTags.length - MAX_VISIBLE_TAGS;

                  return (
                    <TableRow
                      key={contact.id}
                      className={`border-b border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)] transition-colors ${
                        idx % 2 === 1 ? "bg-[var(--bg-muted)]" : "bg-transparent"
                      } ${selectedIds.has(contact.id) ? "bg-[rgba(var(--accent-rgb),0.04)]" : ""}`}
                    >
                      <TableCell className="py-3.5">
                        <Checkbox
                          checked={selectedIds.has(contact.id)}
                          onCheckedChange={() => toggleSelect(contact.id)}
                          className="border-[rgba(var(--accent-rgb),0.4)] data-[state=checked]:bg-[var(--accent)] data-[state=checked]:border-[var(--accent)] data-[state=checked]:text-[var(--bg-base)]"
                        />
                      </TableCell>
                      <TableCell className="py-3.5 text-[var(--text-primary)] font-mono text-[13px] font-medium">
                        {displayPhone(contact.phone)}
                      </TableCell>
                      <TableCell className="py-3.5 text-[13px] text-[var(--text-secondary)]">
                        <a href={`/dashboard/contacts/${contact.id}`} className="hover:text-[var(--accent)] hover:underline transition-colors">
                          {contact.name}
                        </a>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex gap-1 flex-wrap items-center">
                          {visibleTags.map((tag) => (
                            <TagChip key={tag} tag={tag} size="xs" dbColor={tagColorMap.get(tag)} />
                          ))}
                          {overflowCount > 0 && (
                            <span className="text-[10px] text-[var(--text-muted)] ml-0.5">
                              +{overflowCount}
                            </span>
                          )}
                          <Popover>
                            <PopoverTrigger
                              className="w-5 h-5 rounded-md bg-[rgba(var(--accent-rgb),0.04)] hover:bg-[rgba(var(--accent-rgb),0.1)] border border-[var(--border-default)] hover:border-[rgba(var(--accent-rgb),0.3)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] transition-all cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-52 p-0 bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg shadow-xl"
                              align="start"
                            >
                              <div className="px-3 py-2.5 border-b border-[var(--border-default)]">
                                <span className="text-[10px] text-[var(--accent)] uppercase tracking-wider font-semibold">
                                  เพิ่ม/ลบแท็ก
                                </span>
                              </div>
                              <div className="max-h-40 overflow-y-auto py-1">
                                {[
                                  ...new Set([...allTagNames, ...TAG_PRESETS]),
                                ].map((tag) => {
                                  const active = contactTags.includes(tag);
                                  const color = getTagColor(tag, tagColorMap.get(tag));
                                  return (
                                    <button
                                      key={tag}
                                      type="button"
                                      onClick={() =>
                                        handleQuickTagToggle(contact.id, tag)
                                      }
                                      className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-[rgba(var(--accent-rgb),0.04)] transition-colors ${
                                        active ? color.text : "text-[var(--text-muted)]"
                                      }`}
                                    >
                                      <span className="flex items-center gap-2">
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full ${color.dot}`}
                                        />
                                        {tag}
                                      </span>
                                      {active && (
                                        <Check className="w-3 h-3" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        {contact.smsConsent ? (
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
                      <TableCell className="py-3.5 text-xs text-[var(--text-muted)] hidden lg:table-cell">
                        {formatThaiDateOnly(contact.createdAt)}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-8 w-8 p-0 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(var(--accent-rgb),0.04)] transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                            <span className="sr-only">เมนู</span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 bg-[var(--bg-surface)] border-[var(--border-default)]"
                          >
                            <DropdownMenuItem
                              onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
                              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:bg-[rgba(var(--accent-rgb),0.04)] cursor-pointer"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              ดูรายละเอียด
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openEditDialog(contact)}
                              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:bg-[rgba(var(--accent-rgb),0.04)] cursor-pointer"
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              แก้ไข
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setBatchAction("add");
                                setSelectedIds(new Set([contact.id]));
                                setShowBatchTagInput(true);
                              }}
                              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:bg-[rgba(var(--accent-rgb),0.04)] cursor-pointer"
                            >
                              <Tag className="w-4 h-4 mr-2" />
                              ติดแท็ก
                            </DropdownMenuItem>
                            {groups.length > 0 && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedIds(new Set([contact.id]));
                                  setShowAddToGroup(true);
                                }}
                                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:bg-[rgba(var(--accent-rgb),0.04)] cursor-pointer"
                              >
                                <FolderPlus className="w-4 h-4 mr-2" />
                                ย้ายกลุ่ม
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="bg-[var(--border-default)]" />
                            <DropdownMenuItem
                              onClick={() => {
                                setDeletingContact(contact);
                                setShowDeleteAlert(true);
                              }}
                              className="text-[var(--error)] focus:text-[var(--error)] focus:bg-[rgba(var(--error-rgb,239,68,68),0.05)] cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              ลบ
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>

            {/* Filter info */}
            {(activeTagFilter || searchQuery || activeStatusFilter !== "all") && (
              <div className="px-5 py-3 border-t border-[var(--border-default)] text-xs text-[var(--text-muted)]">
                แสดง {filteredContacts.length} จาก {contacts.length}{" "}
                รายชื่อ
                {activeStatusFilter !== "all" && (
                  <span>
                    {" "}| สถานะ:{" "}
                    <span className="text-[var(--accent)]">{activeStatusFilter === "active" ? "Active" : "Opted-out"}</span>
                  </span>
                )}
                {activeTagFilter && (
                  <span>
                    {" "}
                    | แท็ก:{" "}
                    <span className="text-[var(--accent)]">{activeTagFilter}</span>
                  </span>
                )}
                {searchQuery && (
                  <span>
                    {" "}
                    | ค้นหา:{" "}
                    <span className="text-[var(--accent-secondary)]">{searchQuery}</span>
                  </span>
                )}
              </div>
            )}

            {/* Pagination */}
            {!activeTagFilter && !searchQuery && totalContacts > initialLimit && (
              <div className="px-5 py-4 border-t border-[var(--border-default)] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span>
                    แสดง{" "}
                    <span className="text-[var(--text-primary)] font-medium">
                      {(initialPage - 1) * initialLimit + 1}–
                      {Math.min(initialPage * initialLimit, totalContacts)}
                    </span>{" "}
                    จาก{" "}
                    <span className="text-[var(--text-primary)] font-medium">
                      {totalContacts}
                    </span>{" "}
                    รายชื่อ
                  </span>
                  <CustomSelect
                    value={String(initialLimit)}
                    onChange={(v) => navigatePage(1, Number(v))}
                    options={[
                      { value: "20", label: "20 / หน้า" },
                      { value: "50", label: "50 / หน้า" },
                      { value: "100", label: "100 / หน้า" },
                    ]}
                    placeholder="ต่อหน้า"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigatePage(initialPage - 1)}
                    disabled={isPending || initialPage <= 1}
                    className="h-9 border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[rgba(var(--accent-rgb),0.3)] disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {(() => {
                    const pages: (number | "...")[] = [];
                    const total = totalPages;
                    const cur = initialPage;
                    if (total <= 5) {
                      for (let i = 1; i <= total; i++) pages.push(i);
                    } else {
                      pages.push(1);
                      if (cur > 3) pages.push("...");
                      const start = Math.max(2, cur - 1);
                      const end = Math.min(total - 1, cur + 1);
                      for (let i = start; i <= end; i++) pages.push(i);
                      if (cur < total - 2) pages.push("...");
                      pages.push(total);
                    }
                    return pages.map((p, idx) =>
                      p === "..." ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-2 py-1.5 text-xs text-[var(--text-muted)]"
                        >
                          …
                        </span>
                      ) : (
                        <Button
                          key={p}
                          variant="outline"
                          size="sm"
                          onClick={() => navigatePage(p as number)}
                          disabled={isPending || p === cur}
                          className={`h-9 w-9 p-0 ${
                            p === cur
                              ? "border-[rgba(var(--accent-rgb),0.4)] bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] font-medium"
                              : "border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[rgba(var(--accent-rgb),0.3)] disabled:opacity-50"
                          }`}
                        >
                          {p}
                        </Button>
                      ),
                    );
                  })()}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigatePage(initialPage + 1)}
                    disabled={isPending || initialPage >= totalPages}
                    className="h-9 border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[rgba(var(--accent-rgb),0.3)] disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {/* Select All */}
            <div className="flex items-center gap-3 px-1">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleSelectAll}
                className="border-[rgba(var(--accent-rgb),0.4)] data-[state=checked]:bg-[var(--accent)] data-[state=checked]:border-[var(--accent)] data-[state=checked]:text-[var(--bg-base)]"
              />
              <span className="text-xs text-[var(--text-muted)]">
                เลือกทั้งหมด ({filteredContacts.length})
              </span>
            </div>

            {filteredContacts.map((contact) => {
              const contactTags = getTagNames(contact.tags);
              return (
                <Card
                  key={contact.id}
                  className={`bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg p-4 ${
                    selectedIds.has(contact.id)
                      ? "border-[rgba(var(--accent-rgb),0.3)] bg-[rgba(var(--accent-rgb),0.02)]"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedIds.has(contact.id)}
                      onCheckedChange={() => toggleSelect(contact.id)}
                      className="mt-1 border-[rgba(var(--accent-rgb),0.4)] data-[state=checked]:bg-[var(--accent)] data-[state=checked]:border-[var(--accent)] data-[state=checked]:text-[var(--bg-base)]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <a href={`/dashboard/contacts/${contact.id}`} className="text-sm font-medium text-[var(--text-primary)] truncate hover:text-[var(--accent)] hover:underline transition-colors">
                          {contact.name}
                        </a>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0 ml-2">
                            <MoreHorizontal className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 bg-[var(--bg-surface)] border-[var(--border-default)]"
                          >
                            <DropdownMenuItem
                              onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
                              className="text-[var(--text-secondary)] focus:bg-[rgba(var(--accent-rgb),0.04)] cursor-pointer"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              ดูรายละเอียด
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openEditDialog(contact)}
                              className="text-[var(--text-secondary)] focus:bg-[rgba(var(--accent-rgb),0.04)] cursor-pointer"
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              แก้ไข
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[var(--border-default)]" />
                            <DropdownMenuItem
                              onClick={() => {
                                setDeletingContact(contact);
                                setShowDeleteAlert(true);
                              }}
                              className="text-[var(--error)] focus:text-[var(--error)] focus:bg-[rgba(var(--error-rgb,239,68,68),0.05)] cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              ลบ
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-[13px] text-[var(--accent)] font-mono mt-0.5">
                        {displayPhone(contact.phone)}
                      </p>
                      {contact.email && (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                          {contact.email}
                        </p>
                      )}
                      {/* Groups */}
                      {contact.groups.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-2">
                          {contact.groups.slice(0, 2).map((g) => (
                            <Badge
                              key={g.id}
                              variant="outline"
                              className="text-[10px] px-2 py-0.5 bg-[rgba(var(--accent-rgb),0.06)] text-[var(--accent)] border-[rgba(var(--accent-rgb),0.15)] font-medium"
                            >
                              <Users className="w-2.5 h-2.5 mr-1" />
                              {g.name}
                            </Badge>
                          ))}
                          {contact.groups.length > 2 && (
                            <span className="text-[10px] text-[var(--text-muted)]">
                              +{contact.groups.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                      {/* Tags */}
                      {contactTags.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-2">
                          {contactTags.slice(0, MAX_VISIBLE_TAGS).map((tag) => (
                            <TagChip key={tag} tag={tag} size="xs" dbColor={tagColorMap.get(tag)} />
                          ))}
                          {contactTags.length > MAX_VISIBLE_TAGS && (
                            <span className="text-[10px] text-[var(--text-muted)]">
                              +{contactTags.length - MAX_VISIBLE_TAGS}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-[var(--text-muted)]">
                        {contact.smsConsent ? (
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
                        <span>·</span>
                        <span>{formatThaiDateOnly(contact.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Mobile Pagination */}
            {!activeTagFilter &&
              !searchQuery &&
              totalContacts > initialLimit && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-[var(--text-muted)]">
                    หน้า {initialPage}/{totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigatePage(initialPage - 1)}
                      disabled={isPending || initialPage <= 1}
                      className="min-w-[44px] min-h-[44px] border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigatePage(initialPage + 1)}
                      disabled={isPending || initialPage >= totalPages}
                      className="min-w-[44px] min-h-[44px] border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
          </div>
        </>
      ) : contacts.length > 0 ? (
        /* No results after filtering */
        <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg p-8 text-center">
          <Search className="mx-auto mb-3 text-[var(--text-muted)] w-8 h-8" />
          <p className="text-sm text-[var(--text-muted)]">
            ไม่พบรายชื่อที่ตรงกับการค้นหา
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setActiveTagFilter(null);
              setActiveGroupFilter(null);
              setActiveStatusFilter("all");
            }}
            className="text-xs text-[var(--accent)] hover:underline mt-2 transition-colors"
          >
            ล้างตัวกรอง
          </button>
        </Card>
      ) : (
        /* Empty state */
        <EmptyState
          icon={Users}
          iconColor="var(--accent-blue)"
          iconBg="rgba(var(--accent-blue-rgb),0.08)"
          iconBorder="rgba(var(--accent-blue-rgb),0.15)"
          title="ยังไม่มีรายชื่อ"
          description="เพิ่มรายชื่อผู้รับ SMS เพื่อเริ่มส่งข้อความ"
          ctaLabel="เพิ่มรายชื่อ"
          ctaAction={openAddDialog}
          ctaSecondaryLabel="นำเข้าจากไฟล์ CSV"
          ctaSecondaryAction={() => setShowImportWizard(true)}
        />
      )}

      {/* ==========================================
          DIALOGS
          ========================================== */}

      {/* Add/Edit Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)] text-lg">
              {editingContact ? "แก้ไขรายชื่อ" : "เพิ่มรายชื่อใหม่"}
            </DialogTitle>
            <DialogDescription className="text-[var(--text-muted)]">
              {editingContact
                ? "แก้ไขข้อมูลรายชื่อผู้ติดต่อ"
                : "กรอกข้อมูลเพื่อเพิ่มรายชื่อใหม่"}
            </DialogDescription>
          </DialogHeader>

          <Form {...contactForm}>
            <form
              onSubmit={contactForm.handleSubmit(handleContactSubmit)}
              className="space-y-4"
            >
              <FormField
                control={contactForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
                      ชื่อ *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ชื่อ-นามสกุล"
                        className="h-11 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(var(--accent-rgb),0.12)]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={contactForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
                      เบอร์โทร *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="0891234567"
                        className="h-11 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg font-mono focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(var(--accent-rgb),0.12)]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={contactForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
                      อีเมล
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        className="h-11 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(var(--accent-rgb),0.12)]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)] block mb-2">
                  แท็ก
                </label>
                <TagInput
                  tags={formTags}
                  onChange={setFormTags}
                  allTags={allTagNames}
                />
              </div>

              <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowContactDialog(false)}
                  className="border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={contactForm.handleSubmit(handleContactSubmit)}
                  className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold"
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      กำลังบันทึก...
                    </span>
                  ) : editingContact ? (
                    "อัปเดต"
                  ) : (
                    "บันทึก"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Quick Add Dialog */}
      <Dialog open={showQuickAdd} onOpenChange={setShowQuickAdd}>
        <DialogContent className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)] text-lg">Quick Add</DialogTitle>
            <DialogDescription className="text-[var(--text-muted)]">
              พิมพ์หลายเบอร์ คั่นด้วย , หรือ Enter
            </DialogDescription>
          </DialogHeader>

          <Form {...quickAddForm}>
            <form
              onSubmit={quickAddForm.handleSubmit(handleQuickAddSubmit)}
              className="space-y-4"
            >
              <FormField
                control={quickAddForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
                      ชื่อ (ใช้ร่วม)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="เช่น Import 10 มี.ค."
                        className="h-11 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(var(--accent-rgb),0.12)]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={quickAddForm.control}
                name="phones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
                      เบอร์โทร
                    </FormLabel>
                    <FormControl>
                      <textarea
                        className="flex w-full rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-mono text-sm min-h-[120px] px-3 py-2 focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(var(--accent-rgb),0.12)] focus:outline-none"
                        placeholder={"0891234567\n0812345678\n0823456789"}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                      {
                        field.value
                          .split(/[,\n\r]+/)
                          .filter((p) => p.trim()).length
                      }{" "}
                      เบอร์
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowQuickAdd(false)}
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
                      กำลังเพิ่ม...
                    </span>
                  ) : (
                    "เพิ่มทั้งหมด"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Single Contact AlertDialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[var(--text-primary)]">
              ลบรายชื่อ &ldquo;{deletingContact?.name}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--text-muted)]">
              รายชื่อนี้จะถูกลบออกจากระบบถาวร ไม่สามารถกู้คืนได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent">
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="bg-[rgba(var(--error-rgb,239,68,68),0.06)]0 hover:bg-[var(--error)] text-[var(--text-primary)]"
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

      {/* Bulk Delete AlertDialog */}
      <AlertDialog
        open={showBulkDeleteAlert}
        onOpenChange={setShowBulkDeleteAlert}
      >
        <AlertDialogContent className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[var(--text-primary)]">
              ลบ {selectedIds.size} รายชื่อ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--text-muted)]">
              รายชื่อที่เลือกจะถูกลบออกจากระบบถาวร ไม่สามารถกู้คืนได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent">
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              disabled={isPending}
              className="bg-[rgba(var(--error-rgb,239,68,68),0.06)]0 hover:bg-[var(--error)] text-[var(--text-primary)]"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังลบ...
                </span>
              ) : (
                `ลบ ${selectedIds.size} รายชื่อ`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add to Group Dialog */}
      <Dialog open={showAddToGroup} onOpenChange={setShowAddToGroup}>
        <DialogContent className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)] text-lg">
              เพิ่มเข้ากลุ่ม
            </DialogTitle>
            <DialogDescription className="text-[var(--text-muted)]">
              เลือกกลุ่มสำหรับ {selectedIds.size} รายชื่อที่เลือก
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setAddToGroupId(g.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left ${
                  addToGroupId === g.id
                    ? "bg-[rgba(var(--accent-rgb),0.06)] border-[rgba(var(--accent-rgb),0.3)] text-[var(--text-primary)]"
                    : "bg-transparent border-[var(--border-default)] text-[var(--text-muted)] hover:bg-[rgba(var(--accent-rgb),0.02)] hover:border-[rgba(var(--accent-rgb),0.15)]"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    addToGroupId === g.id
                      ? "bg-[rgba(var(--accent-rgb),0.15)] text-[var(--accent)]"
                      : "bg-[rgba(var(--accent-rgb),0.04)] text-[var(--text-muted)]"
                  }`}
                >
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{g.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {g.memberCount} สมาชิก
                  </div>
                </div>
                {addToGroupId === g.id && (
                  <Check className="w-4 h-4 text-[var(--accent)] shrink-0" />
                )}
              </button>
            ))}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddToGroup(false);
                setAddToGroupId("");
              }}
              className="border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleBulkAddToGroup}
              disabled={isPending || !addToGroupId}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold disabled:opacity-50"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังเพิ่ม...
                </span>
              ) : (
                "เพิ่มเข้ากลุ่ม"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Wizard */}
      <ImportWizard
        open={showImportWizard}
        onOpenChange={setShowImportWizard}
        onComplete={() => router.refresh()}
      />
    </>)}
    </div>
  );
}
