"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createTag, updateTag, deleteTag } from "@/lib/actions/tags";
import { useToast } from "@/app/components/ui/Toast";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Tag = {
  id: string;
  name: string;
  color: string;
  _count: { contactTags: number };
};

interface TagsPanelProps {
  userId: string;
  initialTags: Tag[];
}

// ─── Color Presets ────────────────────────────────────────────────────────────

const COLORS = [
  { hex: "#10B981", tw: "bg-emerald-500", ring: "ring-emerald-400", shadow: "shadow-emerald-500/40", label: "Emerald" },
  { hex: "#8B5CF6", tw: "bg-violet-500",  ring: "ring-violet-400",  shadow: "shadow-violet-500/40",  label: "Violet"  },
  { hex: "#06B6D4", tw: "bg-cyan-500",    ring: "ring-cyan-400",    shadow: "shadow-cyan-500/40",    label: "Cyan"    },
  { hex: "#F59E0B", tw: "bg-amber-500",   ring: "ring-amber-400",   shadow: "shadow-amber-500/40",   label: "Amber"   },
  { hex: "#EF4444", tw: "bg-red-500",     ring: "ring-red-400",     shadow: "shadow-red-500/40",     label: "Red"     },
  { hex: "#EC4899", tw: "bg-pink-500",    ring: "ring-pink-400",    shadow: "shadow-pink-500/40",    label: "Pink"    },
  { hex: "#3B82F6", tw: "bg-blue-500",    ring: "ring-blue-400",    shadow: "shadow-blue-500/40",    label: "Blue"    },
  { hex: "#94A3B8", tw: "bg-slate-400",   ring: "ring-slate-300",   shadow: "shadow-slate-400/40",   label: "Slate"   },
] as const;

type ColorPreset = typeof COLORS[number];

function getColor(hex: string): ColorPreset {
  return COLORS.find((c) => c.hex === hex) ?? COLORS[7];
}

// ─── Color Dot ────────────────────────────────────────────────────────────────

function Dot({ hex, size = 10 }: { hex: string; size?: number }) {
  const c = getColor(hex);
  return (
    <span
      className={`rounded-full flex-shrink-0 inline-block ${c.tw}`}
      style={{ width: size, height: size }}
    />
  );
}

// ─── Color Picker ─────────────────────────────────────────────────────────────

function ColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  return (
    <div className="flex gap-2.5 flex-wrap">
      {COLORS.map((c) => {
        const active = value === c.hex;
        return (
          <motion.button
            key={c.hex}
            type="button"
            title={c.label}
            onClick={() => onChange(c.hex)}
            animate={{ scale: active ? 1.18 : 1 }}
            whileHover={{ scale: active ? 1.22 : 1.1 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-shadow
              ${c.tw}
              ${active ? `ring-2 ring-offset-2 ring-offset-[#0D1526] ${c.ring} shadow-lg ${c.shadow}` : "opacity-60 hover:opacity-90"}`}
          >
            <AnimatePresence>
              {active && (
                <motion.svg
                  key="check"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  width="10" height="10" viewBox="0 0 24 24"
                  fill="none" stroke="white" strokeWidth="3.5"
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </motion.svg>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Tag Chip ─────────────────────────────────────────────────────────────────

function TagChip({
  tag,
  onDelete,
}: {
  tag: Tag;
  onDelete?: () => void;
}) {
  const c = getColor(tag.color);
  return (
    <motion.div
      layout
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.7, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className="group inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full
        border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07]
        transition-colors cursor-default select-none"
    >
      <Dot hex={tag.color} size={8} />
      <span className="text-xs font-medium text-[var(--text-secondary)] max-w-[120px] truncate">
        {tag.name}
      </span>
      <span className="text-[10px] text-[var(--text-muted)] bg-white/[0.06] px-1.5 py-0.5 rounded-full tabular-nums">
        {tag._count.contactTags}
      </span>
      {onDelete && (
        <motion.button
          type="button"
          onClick={onDelete}
          className="w-4 h-4 rounded-full flex items-center justify-center
            text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/15
            opacity-0 group-hover:opacity-100 transition-all ml-0.5"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85 }}
          title="ลบแท็ก"
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </motion.button>
      )}
    </motion.div>
  );
}

// ─── Tag Row (list view) ──────────────────────────────────────────────────────

function TagRow({
  tag, userId, onUpdate, onDelete,
}: {
  tag: Tag; userId: string;
  onUpdate: (t: Tag) => void;
  onDelete: (id: string) => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"view" | "edit" | "del">("view");
  const [editName, setEditName] = useState(tag.name);
  const [editColor, setEditColor] = useState(tag.color);

  function startEdit() { setEditName(tag.name); setEditColor(tag.color); setMode("edit"); }
  function cancelEdit() { setMode("view"); }

  function save() {
    const name = editName.trim();
    if (!name) return;
    if (name === tag.name && editColor === tag.color) { setMode("view"); return; }
    startTransition(async () => {
      try {
        const res = await updateTag(userId, tag.id, {
          ...(name !== tag.name && { name }),
          ...(editColor !== tag.color && { color: editColor }),
        });
        onUpdate({ ...tag, ...res, _count: tag._count });
        setMode("view");
        toast("success", "อัปเดตแท็กแล้ว");
      } catch (e) { toast("error", e instanceof Error ? e.message : "เกิดข้อผิดพลาด"); }
    });
  }

  function confirmDelete() {
    startTransition(async () => {
      try {
        await deleteTag(userId, tag.id);
        onDelete(tag.id);
        toast("success", `ลบแท็ก "${tag.name}" แล้ว`);
      } catch (e) { toast("error", e instanceof Error ? e.message : "เกิดข้อผิดพลาด"); }
    });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.18 } }}
      className="group border-b border-white/[0.04] last:border-b-0"
    >
      <AnimatePresence mode="wait" initial={false}>

        {/* ── VIEW ── */}
        {mode === "view" && (
          <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
          >
            <Dot hex={tag.color} size={10} />
            <span className="flex-1 text-sm text-[var(--text-secondary)] font-medium truncate">{tag.name}</span>
            <span className="text-[11px] text-[var(--text-muted)] bg-white/[0.05] px-2 py-0.5 rounded-full tabular-nums">
              {tag._count.contactTags} คน
            </span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <motion.button onClick={startEdit} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                title="แก้ไข">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </motion.button>
              <motion.button onClick={() => setMode("del")} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="ลบ">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                </svg>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── EDIT ── */}
        {mode === "edit" && (
          <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="px-4 py-3 space-y-3 bg-white/[0.02]"
          >
            <div className="flex items-center gap-2">
              <Dot hex={editColor} size={10} />
              <input
                type="text" value={editName} maxLength={50} autoFocus
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancelEdit(); }}
                className="input-glass flex-1 text-sm py-1.5 px-2.5"
              />
            </div>
            <ColorPicker value={editColor} onChange={setEditColor} />
            <div className="flex gap-2 pt-0.5">
              <motion.button onClick={save} disabled={isPending || !editName.trim()}
                className="btn-primary px-3.5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 flex items-center gap-1.5"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                {isPending
                  ? <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>}
                บันทึก
              </motion.button>
              <motion.button onClick={cancelEdit} disabled={isPending}
                className="btn-glass px-3.5 py-1.5 rounded-lg text-xs"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                ยกเลิก
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── DELETE CONFIRM ── */}
        {mode === "del" && (
          <motion.div key="del"
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 px-4 py-3 bg-red-500/[0.03]"
          >
            <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/15 flex items-center justify-center flex-shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-red-400" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <p className="flex-1 text-xs text-[var(--text-secondary)]">
              ลบ <span className="font-semibold text-white">"{tag.name}"</span>?
              {tag._count.contactTags > 0 && (
                <span className="text-red-400/70 ml-1">({tag._count.contactTags} contacts)</span>
              )}
            </p>
            <div className="flex gap-1.5 flex-shrink-0">
              <motion.button onClick={confirmDelete} disabled={isPending}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-colors disabled:opacity-40"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                {isPending ? "กำลังลบ..." : "ลบ"}
              </motion.button>
              <motion.button onClick={() => setMode("view")} disabled={isPending}
                className="btn-glass px-3 py-1.5 rounded-lg text-xs"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                ยกเลิก
              </motion.button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}

// ─── Inline Tag Picker (glassmorphism dropdown) ───────────────────────────────

export function InlineTagPicker({
  tags,
  selectedIds,
  onToggle,
}: {
  tags: Tag[];
  selectedIds: string[];
  onToggle: (tagId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  function computeRect() {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setRect({ top: r.bottom + 6, left: r.left, width: r.width });
    }
  }

  function toggle() {
    if (!open) computeRect();
    setOpen((v) => !v);
    setQuery("");
  }

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onScroll() { setOpen(false); }
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const filtered = tags.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase())
  );

  const selectedCount = selectedIds.length;

  const dropdown = rect && (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{ position: "fixed", top: rect.top, left: rect.left, width: rect.width, zIndex: 9999 }}
          className="rounded-2xl overflow-hidden
            border border-white/[0.08] bg-[#0D1526]/95 backdrop-blur-2xl
            shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
        >
            {/* Search */}
            <div className="px-3 pt-3 pb-2">
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] focus-within:border-violet-500/25 transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)] flex-shrink-0">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="ค้นหาแท็ก..." autoFocus
                  className="bg-transparent text-xs text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] outline-none w-full"
                />
              </div>
            </div>

            {/* Options */}
            <div className="max-h-52 overflow-y-auto pb-2">
              {filtered.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] text-center py-4">ไม่พบแท็ก</p>
              ) : (
                filtered.map((tag) => {
                  const selected = selectedIds.includes(tag.id);
                  return (
                    <motion.button
                      key={tag.id}
                      type="button"
                      onClick={() => onToggle(tag.id)}
                      whileHover={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors
                        ${selected ? "text-white" : "text-[var(--text-secondary)]"}`}
                    >
                      <Dot hex={tag.color} size={8} />
                      <span className="flex-1 text-left truncate">{tag.name}</span>
                      <span className="text-[10px] text-[var(--text-muted)] tabular-nums">{tag._count.contactTags}</span>
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all flex-shrink-0
                        ${selected
                          ? "bg-violet-500 border-violet-500"
                          : "border-white/20 bg-transparent"}`}>
                        {selected && (
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
        </motion.div>
        )}
      </AnimatePresence>
    )
  );

  return (
    <div className="relative">
      {/* Trigger */}
      <motion.button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm w-full
          bg-[var(--bg-surface)]/80 backdrop-blur-sm border transition-colors
          ${open ? "border-violet-500/40" : "border-[var(--border-subtle)] hover:border-violet-500/25"}
          text-[var(--text-secondary)]`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-muted)] flex-shrink-0" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
        <span className={`flex-1 text-left ${selectedCount === 0 ? "text-[var(--text-muted)]" : ""}`}>
          {selectedCount === 0 ? "เลือกแท็ก..." : `${selectedCount} แท็ก`}
        </span>
        {selectedCount > 0 && (
          <span className="text-[10px] bg-violet-500/15 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded-full tabular-nums">
            {selectedCount}
          </span>
        )}
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }}
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)] flex-shrink-0">
          <polyline points="6 9 12 15 18 9" />
        </motion.svg>
      </motion.button>

      {/* Portal dropdown — escapes overflow:hidden */}
      {typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
}

// ─── Create Tag Modal ─────────────────────────────────────────────────────────

function CreateModal({
  userId, onCreated, onClose,
}: {
  userId: string;
  onCreated: (t: Tag) => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(COLORS[0].hex);

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      try {
        const created = await createTag(userId, { name: trimmed, color });
        onCreated({ ...created, _count: { contactTags: 0 } });
        toast("success", `สร้างแท็ก "${trimmed}" แล้ว`);
        onClose();
      } catch (e) {
        toast("error", e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      }
    });
  }

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative z-10 w-full max-w-sm rounded-2xl overflow-hidden
          border border-white/[0.1] bg-[#0D1526]/96 backdrop-blur-2xl
          shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
        initial={{ scale: 0.92, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 20, opacity: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
      >
        {/* Top gradient bar */}
        <div className="h-[2px] bg-gradient-to-r from-violet-500 via-cyan-500 to-violet-500" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-white leading-tight">สร้างแท็กใหม่</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">ตั้งชื่อและเลือกสีสำหรับแท็ก</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Name input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium">ชื่อแท็ก</label>
                <span className="text-[10px] text-[var(--text-muted)]/60 tabular-nums">{name.trim().length}/50</span>
              </div>
              <input
                type="text" value={name} maxLength={50} autoFocus
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) submit(); if (e.key === "Escape") onClose(); }}
                className="input-glass w-full text-sm"
                placeholder="เช่น VIP, ลูกค้าใหม่, Partner"
              />
            </div>

            {/* Color picker */}
            <div>
              <label className="block text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-3 font-medium">สี</label>
              <ColorPicker value={color} onChange={setColor} />
            </div>

            {/* Live preview */}
            <AnimatePresence>
              {name.trim() && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-[11px] text-[var(--text-muted)]">ตัวอย่าง</span>
                    <span className="w-px h-3 bg-white/10" />
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                      <Dot hex={color} size={8} />
                      {name.trim()}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CTA */}
          <div className="flex gap-2.5 mt-6">
            <motion.button
              onClick={submit}
              disabled={isPending || !name.trim()}
              className="btn-gradient flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            >
              {isPending ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  กำลังสร้าง...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  สร้างแท็ก
                </>
              )}
            </motion.button>
            <motion.button
              onClick={onClose} disabled={isPending}
              className="btn-glass px-5 py-3 rounded-xl text-sm disabled:opacity-40"
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            >
              ยกเลิก
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function TagsPanel({ userId, initialTags }: TagsPanelProps) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [showCreate, setShowCreate] = useState(false);

  function handleCreated(tag: Tag) {
    setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name, "th")));
  }
  function handleUpdated(tag: Tag) {
    setTags((prev) => prev.map((t) => (t.id === tag.id ? tag : t)).sort((a, b) => a.name.localeCompare(b.name, "th")));
  }
  function handleDeleted(id: string) {
    setTags((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <>
      {/* Panel */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[var(--bg-elevated)]/80 backdrop-blur-xl">
        {/* Ambient gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.03] to-cyan-500/[0.015] pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/10 flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">แท็กทั้งหมด</span>
            {tags.length > 0 && (
              <span className="text-[10px] font-medium text-[var(--text-muted)] bg-white/[0.06] px-2 py-0.5 rounded-full tabular-nums">
                {tags.length}
              </span>
            )}
          </div>

          {/* ── btn-gradient CTA ── */}
          <motion.button
            onClick={() => setShowCreate(true)}
            className="btn-gradient px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            สร้าง tag ใหม่
          </motion.button>
        </div>

        {/* Tag List */}
        <div className="relative z-10">
          <AnimatePresence mode="popLayout">
            {tags.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 px-6 gap-4"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-500/5 border border-white/[0.07] flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-[var(--text-muted)]" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                  </div>
                  {/* Glow */}
                  <div className="absolute inset-0 rounded-2xl bg-violet-500/10 blur-xl -z-10" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">ยังไม่มีแท็ก</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">สร้างแท็กเพื่อจัดหมวดหมู่ผู้ติดต่อของคุณ</p>
                </div>
                <motion.button
                  onClick={() => setShowCreate(true)}
                  className="btn-gradient px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  สร้าง tag แรก
                </motion.button>
              </motion.div>
            ) : (
              tags.map((tag) => (
                <TagRow
                  key={tag.id}
                  tag={tag}
                  userId={userId}
                  onUpdate={handleUpdated}
                  onDelete={handleDeleted}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Tag chips preview (compact, at bottom when has tags) */}
        {tags.length > 0 && (
          <div className="relative z-10 px-4 pb-3.5 pt-2 border-t border-white/[0.04] flex flex-wrap gap-1.5">
            <AnimatePresence>
              {tags.map((tag) => (
                <TagChip key={tag.id} tag={tag} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateModal
            userId={userId}
            onCreated={handleCreated}
            onClose={() => setShowCreate(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
