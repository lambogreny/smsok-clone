"use client";

import { useState, useTransition, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { removeContactFromGroup, bulkRemoveFromGroup } from "@/lib/actions/groups";
import { importContacts, addContactsToGroup } from "@/lib/actions/contacts";
import { safeErrorMessage } from "@/lib/error-messages";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/ui/Toast";
import { TAG_COLORS, getTagColor, parseTags } from "@/lib/tag-utils";

// ==========================================
// Types
// ==========================================

type Member = {
  id: string;
  contactId: string;
  name: string;
  phone: string;
  email: string | null;
};

type ContactStub = {
  id: string;
  name: string;
  phone: string;
  tags: string | null;
};

// ==========================================
// Constants
// ==========================================

const PAGE_SIZE = 20;

// ==========================================
// Animation variants
// ==========================================

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const rowVariant = { hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" as const } } };

// ==========================================
// Main Component
// ==========================================

export default function GroupDetailClient({
  userId,
  groupId,
  groupName,
  memberCount,
  createdAt,
  initialMembers,
  availableContacts,
}: {
  userId: string;
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

  // Add to Group modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [addSelectedIds, setAddSelectedIds] = useState<Set<string>>(new Set());
  const [addTagFilters, setAddTagFilters] = useState<Set<string>>(new Set());

  // Import CSV in modal
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<{ name: string; phone: string; valid: boolean }[]>([]);

  // Import CSV (header level)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // Derived — Members
  // ==========================================

  const memberContactIds = useMemo(() => new Set(members.map((m) => m.contactId)), [members]);

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase().trim();
    return members.filter((m) => m.name.toLowerCase().includes(q) || m.phone.includes(q));
  }, [members, search]);

  const totalPages = Math.ceil(filteredMembers.length / PAGE_SIZE);
  const paginatedMembers = filteredMembers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allSelected = paginatedMembers.length > 0 && paginatedMembers.every((m) => selectedIds.has(m.contactId));

  // ==========================================
  // Derived — Add Modal (tags + filter)
  // ==========================================

  const allAvailableTags = useMemo(() => {
    const tagMap = new Map<string, number>();
    availableContacts.forEach((c) => {
      parseTags(c.tags).forEach((tag) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });
    return tagMap;
  }, [availableContacts]);

  const filteredAvailable = useMemo(() => {
    return availableContacts.filter((c) => {
      if (memberContactIds.has(c.id)) return false;

      // Tag filter (AND)
      if (addTagFilters.size > 0) {
        const contactTags = parseTags(c.tags);
        for (const tag of addTagFilters) {
          if (!contactTags.includes(tag)) return false;
        }
      }

      // Search
      if (addSearch.trim()) {
        const q = addSearch.toLowerCase().trim();
        if (!c.name.toLowerCase().includes(q) && !c.phone.includes(q)) return false;
      }

      return true;
    });
  }, [availableContacts, memberContactIds, addSearch, addTagFilters]);

  const allAddSelected = filteredAvailable.length > 0 && filteredAvailable.every((c) => addSelectedIds.has(c.id));

  // ==========================================
  // Handlers — Members
  // ==========================================

  const toggleSelect = (contactId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(contactId)) next.delete(contactId); else next.add(contactId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedMembers.map((m) => m.contactId)));
  };

  const handleBulkRemove = () => {
    if (selectedIds.size === 0) return;
    startTransition(async () => {
      try {
        await bulkRemoveFromGroup(userId, groupId, Array.from(selectedIds));
        setMembers((prev) => prev.filter((m) => !selectedIds.has(m.contactId)));
        toast("success", `ลบ ${selectedIds.size} รายชื่อออกจากกลุ่มสำเร็จ`);
        setSelectedIds(new Set());
      } catch (e) {
        toast("error", safeErrorMessage(e));
      }
    });
  };

  const handleRemoveSingle = (member: Member) => {
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    startTransition(async () => {
      try {
        await removeContactFromGroup(userId, groupId, member.contactId);
      } catch (e) {
        setMembers((prev) => [...prev, member]);
        toast("error", safeErrorMessage(e));
      }
    });
  };

  // ==========================================
  // Handlers — Add Modal
  // ==========================================

  const openAddModal = () => {
    setShowAddModal(true);
    setAddSearch("");
    setAddSelectedIds(new Set());
    setAddTagFilters(new Set());
    setShowImportPreview(false);
    setImportPreviewData([]);
  };

  const toggleAddSelect = (id: string) => {
    setAddSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAddSelectAll = () => {
    if (allAddSelected) setAddSelectedIds(new Set());
    else setAddSelectedIds(new Set(filteredAvailable.map((c) => c.id)));
  };

  const toggleTagFilter = (tag: string) => {
    setAddTagFilters((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag); else next.add(tag);
      return next;
    });
  };

  const handleAddToGroup = () => {
    if (addSelectedIds.size === 0) return;
    startTransition(async () => {
      try {
        await addContactsToGroup(userId, groupId, Array.from(addSelectedIds));
        toast("success", `เพิ่ม ${addSelectedIds.size} รายชื่อเข้ากลุ่มสำเร็จ`);
        setShowAddModal(false);
        setAddSelectedIds(new Set());
        setAddSearch("");
        setAddTagFilters(new Set());
        router.refresh();
      } catch (e) {
        toast("error", safeErrorMessage(e));
      }
    });
  };

  // ==========================================
  // Handlers — CSV Import (both header + modal)
  // ==========================================

  const parseCSV = (text: string): { name: string; phone: string; valid: boolean }[] => {
    const lines = text.split("\n").filter(Boolean);
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const nameIdx = headers.findIndex((h) => h === "name" || h === "ชื่อ");
    const phoneIdx = headers.findIndex((h) => h === "phone" || h === "เบอร์โทร" || h === "tel");
    if (nameIdx === -1 || phoneIdx === -1) return [];

    return lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.trim());
      const name = cols[nameIdx] || "";
      const phone = cols[phoneIdx] || "";
      const valid = !!name && /^0[0-9]{9}$/.test(phone);
      return { name, phone, valid };
    }).filter((c) => c.name || c.phone);
  };

  const handleCSVFile = (e: React.ChangeEvent<HTMLInputElement>, inModal: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast("error", "ไฟล์ CSV ต้องมีหัวข้อ name, phone และข้อมูลอย่างน้อย 1 แถว");
        return;
      }

      if (inModal) {
        setImportPreviewData(parsed);
        setShowImportPreview(true);
      } else {
        // Direct import (header button)
        const contacts = parsed.filter((c) => c.valid).map((c) => ({ name: c.name, phone: c.phone }));
        if (contacts.length === 0) {
          toast("error", "ไม่พบข้อมูลที่ถูกต้อง");
          return;
        }
        startTransition(async () => {
          try {
            const result = await importContacts(userId, contacts);
            toast("success", `นำเข้า ${result.imported} รายชื่อ${result.skipped > 0 ? ` (ซ้ำ ${result.skipped})` : ""}`);
            router.refresh();
          } catch (err) {
            toast("error", err instanceof Error ? err.message : "นำเข้าไม่สำเร็จ");
          }
        });
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = "";
  };

  const handleConfirmImportPreview = () => {
    const contacts = importPreviewData.filter((c) => c.valid).map((c) => ({ name: c.name, phone: c.phone }));
    if (contacts.length === 0) {
      toast("error", "ไม่มีรายชื่อที่ถูกต้อง");
      return;
    }
    startTransition(async () => {
      try {
        const result = await importContacts(userId, contacts);
        // Then add them to this group
        if (result.imported > 0) {
          toast("success", `นำเข้า ${result.imported} รายชื่อเข้ากลุ่มสำเร็จ${result.skipped > 0 ? ` (ซ้ำ ${result.skipped})` : ""}`);
        }
        setShowImportPreview(false);
        setImportPreviewData([]);
        setShowAddModal(false);
        router.refresh();
      } catch (err) {
        toast("error", err instanceof Error ? err.message : "นำเข้าไม่สำเร็จ");
      }
    });
  };

  // ==========================================
  // Render
  // ==========================================

  return (
    <motion.div
      className="p-6 md:p-8 max-w-5xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Back + Header */}
      <div className="mb-6">
        <a href="/dashboard/groups" className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-violet-400 transition-colors mb-4">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          กลับไปหน้ากลุ่ม
        </a>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/[0.08] border border-violet-500/10 flex items-center justify-center text-violet-400">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight gradient-text-mixed">{groupName}</h2>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                {members.length} สมาชิก &middot; สร้างเมื่อ {new Date(createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleCSVFile(e, false)} />
            <motion.button
              onClick={() => fileInputRef.current?.click()}
              className="btn-glass px-3 py-2.5 text-sm rounded-xl inline-flex items-center gap-1.5"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              นำเข้า CSV
            </motion.button>
            <motion.button
              onClick={openAddModal}
              className="btn-primary px-4 py-2.5 text-sm rounded-xl inline-flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              เพิ่มรายชื่อ
            </motion.button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          <input
            type="text"
            className="input-glass !pl-10 w-full"
            placeholder="ค้นหาชื่อ หรือ เบอร์โทร..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass p-4 mb-4 flex items-center gap-3 flex-wrap"
          >
            <span className="text-sm text-slate-200 font-medium">เลือก {selectedIds.size} รายชื่อ</span>
            <div className="h-4 w-px bg-white/10" />
            <motion.button
              onClick={handleBulkRemove}
              disabled={isPending}
              className="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15 transition-colors disabled:opacity-40 inline-flex items-center gap-1.5"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              ลบออกจากกลุ่ม
            </motion.button>
            <motion.button
              onClick={() => setSelectedIds(new Set())}
              className="btn-glass px-3 py-1.5 text-xs rounded-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              ยกเลิกการเลือก
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Members Table */}
      {paginatedMembers.length > 0 ? (
        <motion.div className="glass overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="w-10 px-3 py-3">
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="w-3.5 h-3.5 rounded accent-violet-500 cursor-pointer" />
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">ชื่อ</th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">เบอร์โทร</th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium hidden md:table-cell">อีเมล</th>
                  <th className="w-20 px-5 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium text-right">จัดการ</th>
                </tr>
              </thead>
              <motion.tbody variants={stagger} initial="hidden" animate="show">
                {paginatedMembers.map((m) => (
                  <motion.tr key={m.id} variants={rowVariant} className={`table-row group ${selectedIds.has(m.contactId) ? "bg-white/[0.03]" : ""}`}>
                    <td className="px-3 py-3.5">
                      <input type="checkbox" checked={selectedIds.has(m.contactId)} onChange={() => toggleSelect(m.contactId)} className="w-3.5 h-3.5 rounded accent-violet-500 cursor-pointer" />
                    </td>
                    <td className="px-5 py-3.5 text-slate-200">{m.name}</td>
                    <td className="px-5 py-3.5 text-[var(--text-secondary)] font-mono text-xs">{m.phone}</td>
                    <td className="px-5 py-3.5 text-[var(--text-muted)] text-xs hidden md:table-cell">{m.email || "—"}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleRemoveSingle(m)}
                        disabled={isPending}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15 transition-colors disabled:opacity-40 cursor-pointer opacity-0 group-hover:opacity-100"
                      >
                        ลบ
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredMembers.length > PAGE_SIZE && (
            <div className="px-5 py-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">
                แสดง {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredMembers.length)} จาก {filteredMembers.length}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white hover:border-violet-500 disabled:opacity-30 transition-colors">← ก่อนหน้า</button>
                <span className="px-3 py-1.5 text-xs text-[var(--text-secondary)]">{page}/{totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white hover:border-violet-500 disabled:opacity-30 transition-colors">ถัดไป →</button>
              </div>
            </div>
          )}
        </motion.div>
      ) : members.length > 0 ? (
        <motion.div className="glass p-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-sm text-[var(--text-muted)]">ไม่พบรายชื่อที่ตรงกับการค้นหา</p>
          <button onClick={() => setSearch("")} className="text-xs text-violet-400 hover:text-violet-300 mt-2 transition-colors">ล้างตัวกรอง</button>
        </motion.div>
      ) : (
        <motion.div className="glass p-16 text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--text-muted)]"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-1">ยังไม่มีสมาชิก</p>
          <p className="text-xs text-[var(--text-muted)] mb-6">เพิ่มรายชื่อเข้ากลุ่มเพื่อส่ง SMS เป็นหมวดหมู่</p>
          <button onClick={openAddModal} className="btn-primary px-6 py-2.5 rounded-xl text-sm inline-flex items-center gap-2 cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            เพิ่มรายชื่อ
          </button>
        </motion.div>
      )}

      {/* ==========================================
          Add to Group Modal — ENHANCED
          ========================================== */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
            <motion.div
              className="relative glass w-full max-w-xl z-10 flex flex-col max-h-[85vh]"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-subtle)] shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-white">เพิ่มรายชื่อเข้ากลุ่ม</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">เลือกรายชื่อที่ยังไม่อยู่ใน &ldquo;{groupName}&rdquo;</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Import CSV button inside modal */}
                  <input ref={modalFileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleCSVFile(e, true)} />
                  <button
                    onClick={() => modalFileInputRef.current?.click()}
                    className="btn-glass px-2.5 py-1.5 text-xs rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                    CSV
                  </button>
                  <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              {/* Import Preview Overlay */}
              {showImportPreview ? (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="px-6 pt-4 pb-3">
                    <h4 className="text-sm font-semibold text-white mb-1">ตรวจสอบข้อมูล CSV</h4>
                    <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        ถูกต้อง {importPreviewData.filter((c) => c.valid).length}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        ไม่ถูกต้อง {importPreviewData.filter((c) => !c.valid).length}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 pb-4">
                    <div className="space-y-1">
                      {importPreviewData.map((row, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                            row.valid ? "bg-white/[0.02]" : "bg-red-500/5 border border-red-500/10"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${row.valid ? "bg-emerald-400" : "bg-red-400"}`} />
                          <span className="text-white truncate flex-1">{row.name || "—"}</span>
                          <span className="text-[var(--text-muted)] font-mono text-xs">{row.phone || "—"}</span>
                          {!row.valid && <span className="text-[10px] text-red-400 shrink-0">ไม่ถูกต้อง</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-[var(--border-subtle)] flex gap-3 shrink-0">
                    <button onClick={() => { setShowImportPreview(false); setImportPreviewData([]); }} className="flex-1 btn-glass py-2.5 rounded-xl text-sm cursor-pointer">ยกเลิก</button>
                    <button
                      onClick={handleConfirmImportPreview}
                      disabled={isPending || importPreviewData.filter((c) => c.valid).length === 0}
                      className="flex-1 btn-primary py-2.5 rounded-xl text-sm disabled:opacity-40 cursor-pointer"
                    >
                      {isPending ? "กำลังนำเข้า..." : `นำเข้า ${importPreviewData.filter((c) => c.valid).length} รายชื่อ`}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Search + Tag Filters */}
                  <div className="px-6 pt-4 pb-3 shrink-0">
                    {/* Search */}
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                      <input
                        type="text"
                        className="input-glass !pl-9 w-full text-sm"
                        placeholder="ค้นหาชื่อ หรือ เบอร์..."
                        value={addSearch}
                        onChange={(e) => setAddSearch(e.target.value)}
                        autoFocus
                      />
                    </div>

                    {/* Tag Filter Chips */}
                    {allAvailableTags.size > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {Array.from(allAvailableTags.entries()).map(([tag, count]) => {
                          const color = getTagColor(tag);
                          const isActive = addTagFilters.has(tag);
                          return (
                            <button
                              key={tag}
                              onClick={() => toggleTagFilter(tag)}
                              className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider transition-all border ${
                                isActive
                                  ? `${color.activeBg} ${color.text} ${color.border}`
                                  : `bg-white/5 text-[var(--text-muted)] border-transparent hover:bg-white/[0.08] hover:${color.text}`
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? color.text.replace("text-", "bg-") : "bg-white/20"}`} />
                              {tag}
                              <span className="text-[9px] opacity-60">{count}</span>
                            </button>
                          );
                        })}
                        {addTagFilters.size > 0 && (
                          <button
                            onClick={() => setAddTagFilters(new Set())}
                            className="text-[10px] px-2 py-1 rounded-full text-[var(--text-muted)] hover:text-white transition-colors"
                          >
                            ล้างทั้งหมด
                          </button>
                        )}
                      </div>
                    )}

                    {/* Select All + Count */}
                    {filteredAvailable.length > 0 && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-subtle)]">
                        <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] cursor-pointer hover:text-slate-200 transition-colors">
                          <input type="checkbox" checked={allAddSelected} onChange={toggleAddSelectAll} className="w-3.5 h-3.5 rounded accent-violet-500 cursor-pointer" />
                          เลือกทั้งหมด ({filteredAvailable.length})
                        </label>
                        {addSelectedIds.size > 0 && (
                          <span className="text-xs font-medium text-violet-400">เลือกแล้ว {addSelectedIds.size} คน</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Contact List */}
                  <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-1 min-h-0">
                    {filteredAvailable.length === 0 ? (
                      <div className="text-center py-12">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-3 text-[var(--text-muted)]"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                        <p className="text-xs text-[var(--text-muted)]">
                          {availableContacts.length === 0 ? "ไม่มีรายชื่อที่สามารถเพิ่มได้" : addTagFilters.size > 0 ? "ไม่พบรายชื่อที่ตรง tag ที่เลือก" : "ไม่พบที่ค้นหา"}
                        </p>
                      </div>
                    ) : (
                      filteredAvailable.map((c) => {
                        const contactTags = parseTags(c.tags);
                        return (
                          <button
                            key={c.id}
                            onClick={() => toggleAddSelect(c.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${
                              addSelectedIds.has(c.id)
                                ? "bg-violet-500/8 border-violet-500/20"
                                : "bg-transparent border-transparent hover:bg-white/[0.03] hover:border-[var(--border-subtle)]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={addSelectedIds.has(c.id)}
                              onChange={() => toggleAddSelect(c.id)}
                              className="w-3.5 h-3.5 rounded accent-violet-500 cursor-pointer shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm text-white truncate">{c.name}</span>
                                {/* Tag chips */}
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
                                  <span className="text-[9px] text-[var(--text-muted)]">+{contactTags.length - 3}</span>
                                )}
                              </div>
                              <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">{c.phone}</div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-[var(--border-subtle)] flex gap-3 shrink-0">
                    <button onClick={() => setShowAddModal(false)} className="flex-1 btn-glass py-2.5 rounded-xl text-sm cursor-pointer">ยกเลิก</button>
                    <button
                      onClick={handleAddToGroup}
                      disabled={isPending || addSelectedIds.size === 0}
                      className="flex-1 btn-primary py-2.5 rounded-xl text-sm disabled:opacity-40 cursor-pointer"
                    >
                      {isPending ? "กำลังเพิ่ม..." : addSelectedIds.size > 0 ? `เพิ่มทั้งหมด (${addSelectedIds.size})` : "เลือกรายชื่อก่อน"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
