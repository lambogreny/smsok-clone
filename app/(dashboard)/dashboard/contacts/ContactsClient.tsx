"use client";

import { useState, useTransition, useMemo, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createContact,
  updateContact,
  deleteContact,
  importContacts,
  exportContacts,
  createContactGroup,
  addContactsToGroup,
} from "@/lib/actions/contacts";
import { useRouter } from "next/navigation";
import EmptyState from "@/app/components/ui/EmptyState";
import { useToast } from "@/app/components/ui/Toast";

// ==========================================
// Types
// ==========================================

type Contact = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  tags: string | null;
  createdAt: string;
};

type ContactGroup = {
  id: string;
  name: string;
  memberCount: number;
};

// ==========================================
// Constants
// ==========================================

const TAG_COLORS = [
  { bg: "bg-violet-500/15", text: "text-violet-400", border: "border-violet-500/20" },
  { bg: "bg-cyan-500/15", text: "text-cyan-400", border: "border-cyan-500/20" },
  { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/20" },
  { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/20" },
  { bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/20" },
  { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/20" },
  { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/20" },
] as const;

const TAG_PRESETS = ["VIP", "ลูกค้าใหม่", "พนักงาน", "Supplier", "Partner"];

const MAX_VISIBLE_TAGS = 3;

// ==========================================
// Helpers
// ==========================================

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getTagColor(tag: string) {
  return TAG_COLORS[hashString(tag) % TAG_COLORS.length];
}

function parseTags(tagsStr: string | null): string[] {
  if (!tagsStr) return [];
  return tagsStr
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

// ==========================================
// Animation variants
// ==========================================

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const rowVariant = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

// ==========================================
// Sub-components
// ==========================================

function TagChip({
  tag,
  onRemove,
  size = "sm",
}: {
  tag: string;
  onRemove?: () => void;
  size?: "xs" | "sm";
}) {
  const color = getTagColor(tag);
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
          className="ml-0.5 hover:opacity-70 transition-opacity"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}

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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const query = inputValue.toLowerCase().trim();
    if (!query) return [];
    const combined = [...new Set([...allTags, ...TAG_PRESETS])];
    return combined
      .filter((t) => t.toLowerCase().includes(query) && !tags.includes(t))
      .slice(0, 6);
  }, [inputValue, allTags, tags]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (trimmed && !tags.includes(trimmed)) {
        onChange([...tags, trimmed]);
      }
      setInputValue("");
      setShowSuggestions(false);
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
    <div ref={containerRef} className="relative">
      <div
        className="input-glass flex flex-wrap gap-1.5 min-h-[42px] items-center !py-1.5 !px-3 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <TagChip
            key={tag}
            tag={tag}
            onRemove={() => removeTag(tag)}
            size="xs"
          />
        ))}
        <input
          ref={inputRef}
          type="text"
          className="bg-transparent outline-none text-sm text-white/80 placeholder:text-[var(--text-muted)] flex-1 min-w-[80px]"
          placeholder={tags.length === 0 ? "พิมพ์แล้วกด Enter..." : ""}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (inputValue.trim()) addTag(inputValue);
            } else if (
              e.key === "Backspace" &&
              !inputValue &&
              tags.length > 0
            ) {
              removeTag(tags[tags.length - 1]);
            }
          }}
        />
      </div>

      {/* Presets */}
      {tags.length === 0 && !inputValue && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {TAG_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => addTag(preset)}
              className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-[var(--text-muted)] hover:bg-white/10 hover:text-white/60 transition-colors border border-white/5"
            >
              + {preset}
            </button>
          ))}
        </div>
      )}

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] backdrop-blur-xl shadow-xl overflow-hidden"
          >
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addTag(s)}
                className="w-full text-left px-3 py-2 text-sm text-white/70 hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <TagChip tag={s} size="xs" />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// Main Component
// ==========================================

export default function ContactsClient({
  userId,
  initialContacts,
  totalContacts,
  initialGroups = [],
}: {
  userId: string;
  initialContacts: Contact[];
  totalContacts: number;
  initialGroups?: ContactGroup[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTags, setFormTags] = useState<string[]>([]);

  // Filter / search state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Group state
  const [showGroups, setShowGroups] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showGroupForm, setShowGroupForm] = useState(false);

  // Batch tag state
  const [showBatchTagInput, setShowBatchTagInput] = useState(false);
  const [batchTagValue, setBatchTagValue] = useState("");
  const [batchAction, setBatchAction] = useState<"add" | "remove">("add");

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // Derived data
  // ==========================================

  const allTags = useMemo(() => {
    const tagMap = new Map<string, number>();
    initialContacts.forEach((c) => {
      parseTags(c.tags).forEach((tag) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });
    return tagMap;
  }, [initialContacts]);

  const allTagNames = useMemo(() => Array.from(allTags.keys()), [allTags]);

  const filteredContacts = useMemo(() => {
    let result = initialContacts;

    if (activeTagFilter) {
      result = result.filter((c) =>
        parseTags(c.tags).includes(activeTagFilter),
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          parseTags(c.tags).some((t) => t.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [initialContacts, activeTagFilter, searchQuery]);

  const hasSelection = selectedIds.size > 0;
  const allSelected =
    filteredContacts.length > 0 &&
    filteredContacts.every((c) => selectedIds.has(c.id));

  // ==========================================
  // Handlers
  // ==========================================

  const resetForm = () => {
    setFormName("");
    setFormPhone("");
    setFormEmail("");
    setFormTags([]);
    setEditingContact(null);
    setShowForm(false);
  };

  const openEditForm = (contact: Contact) => {
    setEditingContact(contact);
    setFormName(contact.name);
    setFormPhone(contact.phone);
    setFormEmail(contact.email || "");
    setFormTags(parseTags(contact.tags));
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formPhone.trim()) return;

    startTransition(async () => {
      try {
        const tagsStr =
          formTags.length > 0 ? formTags.join(", ") : undefined;

        if (editingContact) {
          await updateContact(userId, editingContact.id, {
            name: formName.trim(),
            phone: formPhone.trim(),
            email: formEmail.trim() || undefined,
            tags: tagsStr,
          });
          toast("success", "อัปเดตรายชื่อสำเร็จ!");
        } else {
          await createContact(userId, {
            name: formName.trim(),
            phone: formPhone.trim(),
            email: formEmail.trim() || undefined,
            tags: tagsStr,
          });
          toast("success", "เพิ่มรายชื่อสำเร็จ!");
        }
        resetForm();
        router.refresh();
      } catch (e) {
        toast(
          "error",
          e instanceof Error ? e.message : "เกิดข้อผิดพลาด",
        );
      }
    });
  };

  const handleDelete = (contactId: string) => {
    setDeletingId(contactId);
    startTransition(async () => {
      try {
        await deleteContact(userId, contactId);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(contactId);
          return next;
        });
        router.refresh();
      } catch (e) {
        toast(
          "error",
          e instanceof Error ? e.message : "ลบไม่สำเร็จ",
        );
      } finally {
        setDeletingId(null);
      }
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContacts.map((c) => c.id)));
    }
  };

  const handleBatchTag = () => {
    if (!batchTagValue.trim()) return;
    const tag = batchTagValue.trim();

    startTransition(async () => {
      try {
        const promises = Array.from(selectedIds).map((id) => {
          const contact = initialContacts.find((c) => c.id === id);
          if (!contact) return Promise.resolve();
          const currentTags = parseTags(contact.tags);

          let newTags: string[];
          if (batchAction === "add") {
            if (currentTags.includes(tag)) return Promise.resolve();
            newTags = [...currentTags, tag];
          } else {
            newTags = currentTags.filter((t) => t !== tag);
          }

          return updateContact(userId, id, {
            tags: newTags.length > 0 ? newTags.join(", ") : "",
          });
        });

        await Promise.all(promises);
        toast(
          "success",
          `${batchAction === "add" ? "เพิ่ม" : "ลบ"}แท็ก "${tag}" สำเร็จ ${selectedIds.size} รายชื่อ`,
        );
        setBatchTagValue("");
        setShowBatchTagInput(false);
        setSelectedIds(new Set());
        router.refresh();
      } catch (e) {
        toast(
          "error",
          e instanceof Error ? e.message : "เกิดข้อผิดพลาด",
        );
      }
    });
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    startTransition(async () => {
      try {
        await createContactGroup(userId, newGroupName.trim());
        toast("success", `สร้างกลุ่ม "${newGroupName.trim()}" สำเร็จ`);
        setNewGroupName("");
        setShowGroupForm(false);
        router.refresh();
      } catch (e) {
        toast(
          "error",
          e instanceof Error ? e.message : "เกิดข้อผิดพลาด",
        );
      }
    });
  };

  const handleAddToGroup = (groupId: string) => {
    if (selectedIds.size === 0) return;
    startTransition(async () => {
      try {
        await addContactsToGroup(
          userId,
          groupId,
          Array.from(selectedIds),
        );
        toast(
          "success",
          `เพิ่ม ${selectedIds.size} รายชื่อเข้ากลุ่มสำเร็จ`,
        );
        setSelectedIds(new Set());
        router.refresh();
      } catch (e) {
        toast(
          "error",
          e instanceof Error ? e.message : "เกิดข้อผิดพลาด",
        );
      }
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split("\n").filter(Boolean);
      if (lines.length < 2) {
        toast(
          "error",
          "ไฟล์ CSV ต้องมีหัวข้อและข้อมูลอย่างน้อย 1 แถว",
        );
        return;
      }

      const headers = lines[0]
        .split(",")
        .map((h) => h.trim().toLowerCase());
      const nameIdx = headers.findIndex(
        (h) => h === "name" || h === "ชื่อ",
      );
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
          return {
            name: cols[nameIdx] || "",
            phone: cols[phoneIdx] || "",
          };
        })
        .filter((c) => c.name && c.phone);

      if (contacts.length === 0) {
        toast("error", "ไม่พบข้อมูลที่ถูกต้องในไฟล์");
        return;
      }

      startTransition(async () => {
        try {
          const result = await importContacts(userId, contacts);
          toast(
            "success",
            `นำเข้าสำเร็จ ${result.imported} รายชื่อ${result.skipped > 0 ? ` (ข้าม ${result.skipped})` : ""}`,
          );
          router.refresh();
        } catch (err) {
          toast(
            "error",
            err instanceof Error ? err.message : "นำเข้าไม่สำเร็จ",
          );
        }
      });
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExport = () => {
    startTransition(async () => {
      try {
        const data = await exportContacts(userId);
        if (data.length === 0) {
          toast("warning", "ไม่มีรายชื่อให้ส่งออก");
          return;
        }
        const headers = ["name", "phone", "email", "tags", "groups"];
        const csv = [
          headers.join(","),
          ...data.map((row: Record<string, string>) =>
            headers
              .map(
                (h) =>
                  `"${(row[h] || "").replace(/"/g, '""')}"`,
              )
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
        toast(
          "error",
          e instanceof Error ? e.message : "ส่งออกไม่สำเร็จ",
        );
      }
    });
  };

  // ==========================================
  // Render
  // ==========================================

  return (
    <motion.div
      className="p-6 md:p-8 max-w-6xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight gradient-text-mixed">
            รายชื่อผู้ติดต่อ
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            จัดการรายชื่อผู้ติดต่อ ({totalContacts} รายชื่อ
            {initialGroups.length > 0
              ? `, ${initialGroups.length} กลุ่ม`
              : ""}
            )
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImport}
          />
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            className="btn-glass px-3 py-2.5 text-sm rounded-xl inline-flex items-center gap-1.5"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            นำเข้า
          </motion.button>
          {/* Export */}
          <motion.button
            onClick={handleExport}
            disabled={isPending}
            className="btn-glass px-3 py-2.5 text-sm rounded-xl inline-flex items-center gap-1.5"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            ส่งออก
          </motion.button>
          {/* Add Contact */}
          <motion.button
            onClick={() => {
              if (showForm && !editingContact) {
                resetForm();
              } else {
                resetForm();
                setShowForm(true);
              }
            }}
            className="btn-primary px-4 py-2.5 text-sm rounded-xl inline-flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {showForm && !editingContact ? "ยกเลิก" : "+ เพิ่มรายชื่อ"}
          </motion.button>
        </div>
      </div>

      {/* Search Box */}
      <div className="mb-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            className="input-glass !pl-10 w-full"
            placeholder="ค้นหาชื่อ, เบอร์โทร, อีเมล หรือแท็ก..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white/60 transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tag Filter Bar */}
      {allTags.size > 0 && (
        <motion.div
          className="glass p-4 mb-4"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[var(--text-muted)]"
            >
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">
              กรองตามแท็ก
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTagFilter(null)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTagFilter === null
                  ? "bg-white/10 text-white border border-white/20"
                  : "bg-white/5 text-[var(--text-muted)] border border-transparent hover:bg-white/8 hover:text-white/60"
              }`}
            >
              ทั้งหมด ({totalContacts})
            </button>
            {Array.from(allTags.entries()).map(([tag, count]) => {
              const color = getTagColor(tag);
              const isActive = activeTagFilter === tag;
              return (
                <button
                  key={tag}
                  onClick={() =>
                    setActiveTagFilter(isActive ? null : tag)
                  }
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider transition-all border ${
                    isActive
                      ? `${color.bg} ${color.text} ${color.border}`
                      : `bg-white/5 text-[var(--text-muted)] border-transparent hover:bg-white/8`
                  }`}
                >
                  {tag} ({count})
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Contact Groups Section */}
      <motion.div
        className="glass mb-4 overflow-hidden"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <button
          onClick={() => setShowGroups(!showGroups)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[var(--text-muted)]"
            >
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">
              กลุ่มผู้ติดต่อ ({initialGroups.length})
            </span>
          </div>
          <motion.svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-[var(--text-muted)]"
            animate={{ rotate: showGroups ? 180 : 0 }}
          >
            <polyline points="6 9 12 15 18 9" />
          </motion.svg>
        </button>

        <AnimatePresence>
          {showGroups && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t border-[var(--border-subtle)] pt-3">
                {initialGroups.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {initialGroups.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => {
                          if (hasSelection) {
                            handleAddToGroup(group.id);
                          }
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all border ${
                          hasSelection
                            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20 cursor-pointer"
                            : "bg-white/5 text-[var(--text-secondary)] border-transparent"
                        }`}
                      >
                        {group.name} ({group.memberCount})
                        {hasSelection && (
                          <span className="ml-1 text-[10px] opacity-60">
                            + เพิ่ม
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {initialGroups.length === 0 && !showGroupForm && (
                  <p className="text-xs text-[var(--text-muted)] mb-3">
                    ยังไม่มีกลุ่ม
                  </p>
                )}

                <AnimatePresence>
                  {showGroupForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex gap-2 mb-3"
                    >
                      <input
                        type="text"
                        className="input-glass flex-1 !py-1.5 text-sm"
                        placeholder="ชื่อกลุ่มใหม่..."
                        value={newGroupName}
                        onChange={(e) =>
                          setNewGroupName(e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateGroup();
                        }}
                      />
                      <motion.button
                        onClick={handleCreateGroup}
                        disabled={isPending || !newGroupName.trim()}
                        className="btn-primary px-3 py-1.5 text-xs rounded-lg disabled:opacity-40"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        บันทึก
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          setShowGroupForm(false);
                          setNewGroupName("");
                        }}
                        className="btn-glass px-3 py-1.5 text-xs rounded-lg"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        ยกเลิก
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!showGroupForm && (
                  <button
                    onClick={() => setShowGroupForm(true)}
                    className="text-xs text-[var(--text-muted)] hover:text-white/60 transition-colors flex items-center gap-1"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    สร้างกลุ่มใหม่
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Batch Actions Toolbar */}
      <AnimatePresence>
        {hasSelection && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass p-4 mb-4 flex items-center gap-3 flex-wrap"
          >
            <span className="text-sm text-white/80 font-medium">
              เลือก {selectedIds.size} รายชื่อ
            </span>
            <div className="h-4 w-px bg-white/10" />
            <motion.button
              onClick={() => {
                setBatchAction("add");
                setShowBatchTagInput(!showBatchTagInput || batchAction !== "add");
              }}
              className="btn-glass px-3 py-1.5 text-xs rounded-lg inline-flex items-center gap-1.5"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              เพิ่มแท็ก
            </motion.button>
            <motion.button
              onClick={() => {
                setBatchAction("remove");
                setShowBatchTagInput(!showBatchTagInput || batchAction !== "remove");
              }}
              className="btn-glass px-3 py-1.5 text-xs rounded-lg inline-flex items-center gap-1.5"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              ลบแท็ก
            </motion.button>
            <motion.button
              onClick={() => {
                setSelectedIds(new Set());
                setShowBatchTagInput(false);
              }}
              className="btn-glass px-3 py-1.5 text-xs rounded-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              ยกเลิกการเลือก
            </motion.button>

            <AnimatePresence>
              {showBatchTagInput && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-center gap-2 overflow-hidden"
                >
                  <input
                    type="text"
                    className="input-glass !py-1.5 !px-3 text-xs w-36"
                    placeholder={
                      batchAction === "add"
                        ? "แท็กที่จะเพิ่ม..."
                        : "แท็กที่จะลบ..."
                    }
                    value={batchTagValue}
                    onChange={(e) => setBatchTagValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleBatchTag();
                    }}
                    autoFocus
                  />
                  <motion.button
                    onClick={handleBatchTag}
                    disabled={isPending || !batchTagValue.trim()}
                    className="btn-primary px-3 py-1.5 text-xs rounded-lg disabled:opacity-40"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isPending ? "..." : "ยืนยัน"}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Contact Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="glass p-6 mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/[0.12] to-violet-500/[0.08] border border-violet-500/10 flex items-center justify-center">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-violet-400"
                >
                  <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </div>
              <span className="gradient-text-mixed">
                {editingContact ? "แก้ไขรายชื่อ" : "เพิ่มรายชื่อใหม่"}
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  ชื่อ *
                </label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="ชื่อ-นามสกุล"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  เบอร์โทร *
                </label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="0891234567"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  อีเมล
                </label>
                <input
                  type="email"
                  className="input-glass"
                  placeholder="email@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  แท็ก
                </label>
                <TagInput
                  tags={formTags}
                  onChange={setFormTags}
                  allTags={allTagNames}
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <motion.button
                onClick={handleSave}
                disabled={
                  isPending || !formName.trim() || !formPhone.trim()
                }
                className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-40"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    กำลังบันทึก...
                  </span>
                ) : editingContact ? (
                  "อัปเดต"
                ) : (
                  "บันทึก"
                )}
              </motion.button>
              {editingContact && (
                <motion.button
                  onClick={resetForm}
                  className="btn-glass px-4 py-2.5 rounded-xl text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  ยกเลิก
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact List */}
      {filteredContacts.length > 0 ? (
        <motion.div
          className="glass overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded accent-violet-500 cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">
                    ชื่อ
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">
                    เบอร์โทร
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium hidden md:table-cell">
                    อีเมล
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium hidden md:table-cell">
                    แท็ก
                  </th>
                  <th className="w-28 px-5 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium text-right">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <motion.tbody
                variants={stagger}
                initial="hidden"
                animate="show"
              >
                {filteredContacts.map((contact) => {
                  const contactTags = parseTags(contact.tags);
                  const visibleTags = contactTags.slice(
                    0,
                    MAX_VISIBLE_TAGS,
                  );
                  const overflowCount =
                    contactTags.length - MAX_VISIBLE_TAGS;

                  return (
                    <motion.tr
                      key={contact.id}
                      variants={rowVariant}
                      className={`table-row ${selectedIds.has(contact.id) ? "bg-white/[0.03]" : ""}`}
                    >
                      <td className="px-3 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(contact.id)}
                          onChange={() => toggleSelect(contact.id)}
                          className="w-3.5 h-3.5 rounded accent-violet-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-5 py-3.5 text-white/70">
                        {contact.name}
                      </td>
                      <td className="px-5 py-3.5 text-[var(--text-secondary)] font-mono text-xs">
                        {contact.phone}
                      </td>
                      <td className="px-5 py-3.5 text-[var(--text-muted)] text-xs hidden md:table-cell">
                        {contact.email || "-"}
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        {contactTags.length > 0 ? (
                          <div className="flex gap-1 flex-wrap items-center">
                            {visibleTags.map((tag) => (
                              <TagChip
                                key={tag}
                                tag={tag}
                                size="xs"
                              />
                            ))}
                            {overflowCount > 0 && (
                              <span className="text-[10px] text-[var(--text-muted)] ml-0.5">
                                +{overflowCount}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[var(--text-muted)]">
                            -
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <motion.button
                            onClick={() => openEditForm(contact)}
                            className="btn-glass px-2.5 py-1.5 text-xs rounded-lg"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            แก้ไข
                          </motion.button>
                          <motion.button
                            onClick={() =>
                              handleDelete(contact.id)
                            }
                            disabled={
                              deletingId === contact.id
                            }
                            className="btn-danger px-2.5 py-1.5 text-xs rounded-lg disabled:opacity-40"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {deletingId === contact.id
                              ? "..."
                              : "ลบ"}
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </motion.tbody>
            </table>
          </div>

          {/* Filtered results info */}
          {(activeTagFilter || searchQuery) && (
            <div className="px-5 py-3 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
              แสดง {filteredContacts.length} จาก{" "}
              {initialContacts.length} รายชื่อ
              {activeTagFilter && (
                <span>
                  {" "}
                  | แท็ก:{" "}
                  <span className="text-violet-400">
                    {activeTagFilter}
                  </span>
                </span>
              )}
              {searchQuery && (
                <span>
                  {" "}
                  | ค้นหา:{" "}
                  <span className="text-cyan-400">
                    {searchQuery}
                  </span>
                </span>
              )}
            </div>
          )}
        </motion.div>
      ) : initialContacts.length > 0 ? (
        <motion.div
          className="glass p-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <svg
            className="mx-auto mb-3 text-[var(--text-muted)]"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <p className="text-sm text-[var(--text-muted)]">
            ไม่พบรายชื่อที่ตรงกับการค้นหา
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setActiveTagFilter(null);
            }}
            className="text-xs text-violet-400 hover:text-violet-300 mt-2 transition-colors"
          >
            ล้างตัวกรอง
          </button>
        </motion.div>
      ) : (
        <EmptyState
          icon={
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
          }
          title="ยังไม่มีรายชื่อ"
          description="เพิ่มรายชื่อผู้ติดต่อเพื่อส่งข้อความได้ง่ายขึ้น"
          action={{
            label: "+ เพิ่มรายชื่อ",
            onClick: () => setShowForm(true),
          }}
        />
      )}
    </motion.div>
  );
}
