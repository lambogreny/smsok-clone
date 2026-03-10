"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createTag, updateTag, deleteTag } from "@/lib/actions/tags";
import { safeErrorMessage } from "@/lib/error-messages";

type Tag = {
  id: string;
  name: string;
  color: string;
  _count: { contactTags: number };
};

const COLORS = [
  { hex: "#10B981", tw: "bg-emerald-500", label: "Emerald" },
  { hex: "#8B5CF6", tw: "bg-violet-500",  label: "Violet"  },
  { hex: "#06B6D4", tw: "bg-cyan-500",    label: "Cyan"    },
  { hex: "#F59E0B", tw: "bg-amber-500",   label: "Amber"   },
  { hex: "#EF4444", tw: "bg-red-500",     label: "Red"     },
  { hex: "#EC4899", tw: "bg-pink-500",    label: "Pink"    },
  { hex: "#3B82F6", tw: "bg-blue-500",    label: "Blue"    },
  { hex: "#94A3B8", tw: "bg-slate-400",   label: "Slate"   },
] as const;

function getColorClass(hex: string) {
  return COLORS.find((c) => c.hex === hex)?.tw ?? "bg-slate-400";
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const cardVariant = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } } };

export default function TagsPageClient({ userId, initialTags }: { userId: string; initialTags: Tag[] }) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", color: "#8B5CF6" });
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  function openCreate() {
    setForm({ name: "", color: "#8B5CF6" });
    setEditId(null);
    setError("");
    setShowCreate(true);
  }

  function openEdit(tag: Tag) {
    setForm({ name: tag.name, color: tag.color });
    setEditId(tag.id);
    setError("");
    setShowCreate(true);
  }

  function handleSave() {
    if (!form.name.trim()) { setError("กรุณากรอกชื่อแท็ก"); return; }
    setError("");
    startTransition(async () => {
      try {
        if (editId) {
          const updated = await updateTag(userId, editId, { name: form.name.trim(), color: form.color });
          setTags(prev => prev.map(t => t.id === editId ? { ...t, ...updated } : t));
        } else {
          const created = await createTag(userId, { name: form.name.trim(), color: form.color });
          setTags(prev => [{ ...created, _count: { contactTags: 0 } }, ...prev]);
        }
        setShowCreate(false);
      } catch (e) {
        setError(safeErrorMessage(e));
      }
    });
  }

  function handleDelete(tagId: string) {
    startTransition(async () => {
      await deleteTag(userId, tagId);
      setTags(prev => prev.filter(t => t.id !== tagId));
      setDeleteConfirm(null);
    });
  }

  return (
    <motion.div className="p-6 md:p-8 max-w-5xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight gradient-text-mixed">แท็ก</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">{tags.length} แท็กทั้งหมด</p>
        </div>
        <motion.button
          onClick={openCreate}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="btn-primary px-5 py-2.5 text-sm rounded-xl inline-flex items-center gap-2 cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          สร้างแท็ก
        </motion.button>
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
            <motion.div
              className="relative glass p-6 w-full max-w-md z-10"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-lg font-bold text-white mb-5">{editId ? "แก้ไขแท็ก" : "สร้างแท็กใหม่"}</h3>
              {error && <div className="mb-4 p-3 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400 text-sm">{error}</div>}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-white font-medium uppercase tracking-wider mb-2">ชื่อแท็ก</label>
                  <input
                    type="text" maxLength={50} autoFocus
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && handleSave()}
                    className="input-glass w-full" placeholder="ชื่อแท็ก..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-white font-medium uppercase tracking-wider mb-2">สี</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map(c => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, color: c.hex }))}
                        className={`w-8 h-8 rounded-lg ${c.tw} transition-all cursor-pointer ${form.color === c.hex ? "ring-2 ring-white/60 scale-110" : "hover:scale-105"}`}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowCreate(false)} className="flex-1 btn-glass py-2.5 rounded-xl text-sm cursor-pointer">ยกเลิก</button>
                <button onClick={handleSave} disabled={isPending} className="flex-1 btn-primary py-2.5 rounded-xl text-sm disabled:opacity-50 cursor-pointer">
                  {isPending ? "กำลังบันทึก..." : editId ? "บันทึก" : "สร้าง"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
            <motion.div className="relative glass p-6 w-full max-w-sm z-10 text-center" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} transition={{ duration: 0.2 }}>
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">ลบแท็ก</h3>
              <p className="text-sm text-[var(--text-muted)] mb-6">แท็กที่ลบแล้วจะถูกถอดออกจากรายชื่อทั้งหมด</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 btn-glass py-2.5 rounded-xl text-sm cursor-pointer">ยกเลิก</button>
                <button onClick={() => handleDelete(deleteConfirm)} disabled={isPending} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15 transition-colors disabled:opacity-50 cursor-pointer">ลบ</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tags Grid */}
      {tags.length > 0 ? (
        <motion.div
          variants={stagger} initial="hidden" animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {tags.map(tag => (
            <motion.div key={tag.id} variants={cardVariant} className="glass card-glow p-5 group flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-4 h-4 rounded-full flex-shrink-0 ${getColorClass(tag.color)}`} style={{ boxShadow: `0 0 8px ${tag.color}66` }} />
                <div>
                  <div className="text-sm font-semibold text-white">{tag.name}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">{tag._count.contactTags} รายชื่อ</div>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(tag)} className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-[var(--text-muted)] hover:text-slate-200 transition-colors cursor-pointer">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                </button>
                <button onClick={() => setDeleteConfirm(tag.id)} className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 transition-colors cursor-pointer">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div className="glass p-16 text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--text-muted)]"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="2" /></svg>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-1">ยังไม่มีแท็ก</p>
          <p className="text-xs text-[var(--text-muted)] mb-6">สร้างแท็กเพื่อจัดกลุ่มรายชื่อของคุณ</p>
          <button onClick={openCreate} className="btn-primary px-6 py-2.5 rounded-xl text-sm inline-flex items-center gap-2 cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            สร้างแท็กแรก
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
