"use client";

import { useState, useTransition, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createGroup, updateGroup, deleteGroup, getGroupContacts, addContactToGroup, removeContactFromGroup } from "@/lib/actions/groups";
import { safeErrorMessage } from "@/lib/error-messages";

type Group = {
  id: string;
  name: string;
  createdAt: Date;
  _count: { members: number };
};

type ContactStub = {
  id: string;
  name: string;
  phone: string;
};

type Member = {
  id: string;
  groupId: string;
  contactId: string;
  contact: ContactStub;
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const cardVariant = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } } };

export default function GroupsPageClient({
  userId,
  initialGroups,
  allContacts,
}: {
  userId: string;
  initialGroups: Group[];
  allContacts: ContactStub[];
}) {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Members modal
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [addSearch, setAddSearch] = useState("");
  const [memberError, setMemberError] = useState("");

  function openCreate() { setName(""); setEditId(null); setError(""); setShowForm(true); }
  function openEdit(g: Group) { setName(g.name); setEditId(g.id); setError(""); setShowForm(true); }

  function handleSave() {
    if (!name.trim()) { setError("กรุณากรอกชื่อกลุ่ม"); return; }
    setError("");
    startTransition(async () => {
      try {
        if (editId) {
          const updated = await updateGroup(userId, editId, { name: name.trim() });
          setGroups(prev => prev.map(g => g.id === editId ? { ...g, name: updated.name } : g));
        } else {
          const created = await createGroup(userId, { name: name.trim() });
          setGroups(prev => [{ ...created, _count: { members: 0 } }, ...prev]);
        }
        setShowForm(false);
      } catch (e) {
        setError(safeErrorMessage(e));
      }
    });
  }

  function handleDelete(groupId: string) {
    startTransition(async () => {
      try {
        await deleteGroup(userId, groupId);
        setGroups(prev => prev.filter(g => g.id !== groupId));
        setDeleteConfirm(null);
        if (activeGroup?.id === groupId) setActiveGroup(null);
      } catch (e) {
        setDeleteConfirm(null);
        setError(safeErrorMessage(e));
      }
    });
  }

  async function openMembers(g: Group) {
    setActiveGroup(g);
    setMemberSearch("");
    setAddSearch("");
    setMemberError("");
    setMembersLoading(true);
    try {
      const data = await getGroupContacts(userId, g.id);
      setMembers(data as Member[]);
    } catch {
      setMemberError("โหลดสมาชิกไม่สำเร็จ");
    } finally {
      setMembersLoading(false);
    }
  }

  function handleAddContact(contact: ContactStub) {
    if (!activeGroup) return;
    // Optimistic
    const tempMember: Member = { id: `temp-${contact.id}`, groupId: activeGroup.id, contactId: contact.id, contact };
    setMembers(prev => [...prev, tempMember]);
    setGroups(prev => prev.map(g => g.id === activeGroup.id ? { ...g, _count: { members: g._count.members + 1 } } : g));
    setActiveGroup(prev => prev ? { ...prev, _count: { members: prev._count.members + 1 } } : prev);

    startTransition(async () => {
      try {
        const real = await addContactToGroup(userId, activeGroup.id, contact.id);
        setMembers(prev => prev.map(m => m.id === tempMember.id ? (real as Member) : m));
      } catch (e) {
        // Rollback
        setMembers(prev => prev.filter(m => m.id !== tempMember.id));
        setGroups(prev => prev.map(g => g.id === activeGroup.id ? { ...g, _count: { members: g._count.members - 1 } } : g));
        setActiveGroup(prev => prev ? { ...prev, _count: { members: prev._count.members - 1 } } : prev);
        setMemberError(safeErrorMessage(e));
      }
    });
  }

  function handleRemoveContact(member: Member) {
    if (!activeGroup) return;
    // Optimistic
    setMembers(prev => prev.filter(m => m.id !== member.id));
    setGroups(prev => prev.map(g => g.id === activeGroup.id ? { ...g, _count: { members: Math.max(0, g._count.members - 1) } } : g));
    setActiveGroup(prev => prev ? { ...prev, _count: { members: Math.max(0, prev._count.members - 1) } } : prev);

    startTransition(async () => {
      try {
        await removeContactFromGroup(userId, activeGroup.id, member.contactId);
      } catch (e) {
        // Rollback
        setMembers(prev => [...prev, member]);
        setGroups(prev => prev.map(g => g.id === activeGroup.id ? { ...g, _count: { members: g._count.members + 1 } } : g));
        setActiveGroup(prev => prev ? { ...prev, _count: { members: prev._count.members + 1 } } : prev);
        setMemberError(safeErrorMessage(e));
      }
    });
  }

  const memberIds = useMemo(() => new Set(members.map(m => m.contactId)), [members]);

  const filteredMembers = useMemo(() =>
    members.filter(m =>
      !memberSearch ||
      m.contact.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.contact.phone.includes(memberSearch)
    ), [members, memberSearch]);

  const contactsToAdd = useMemo(() =>
    allContacts.filter(c =>
      !memberIds.has(c.id) && (
        !addSearch ||
        c.name.toLowerCase().includes(addSearch.toLowerCase()) ||
        c.phone.includes(addSearch)
      )
    ), [allContacts, memberIds, addSearch]);

  return (
    <motion.div className="p-6 md:p-8 max-w-5xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight gradient-text-mixed">กลุ่ม</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">{groups.length} กลุ่มทั้งหมด</p>
        </div>
        <motion.button
          onClick={openCreate}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="btn-primary px-5 py-2.5 text-sm rounded-xl inline-flex items-center gap-2 cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          สร้างกลุ่ม
        </motion.button>
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
            <motion.div className="relative glass p-6 w-full max-w-sm z-10" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}>
              <h3 className="text-lg font-bold text-white mb-5">{editId ? "แก้ไขกลุ่ม" : "สร้างกลุ่มใหม่"}</h3>
              {error && <div className="mb-4 p-3 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400 text-sm">{error}</div>}
              <div>
                <label className="block text-xs text-white font-medium uppercase tracking-wider mb-2">ชื่อกลุ่ม</label>
                <input
                  type="text" maxLength={100} autoFocus
                  value={name} onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSave()}
                  className="input-glass w-full" placeholder="ชื่อกลุ่ม..."
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 btn-glass py-2.5 rounded-xl text-sm cursor-pointer">ยกเลิก</button>
                <button onClick={handleSave} disabled={isPending} className="flex-1 btn-primary py-2.5 rounded-xl text-sm disabled:opacity-50 cursor-pointer">
                  {isPending ? "กำลังบันทึก..." : editId ? "บันทึก" : "สร้าง"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
            <motion.div className="relative glass p-6 w-full max-w-sm z-10 text-center" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} transition={{ duration: 0.2 }}>
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">ลบกลุ่ม</h3>
              <p className="text-sm text-[var(--text-muted)] mb-6">รายชื่อสมาชิกในกลุ่มนี้จะถูกถอดออกทั้งหมด</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 btn-glass py-2.5 rounded-xl text-sm cursor-pointer">ยกเลิก</button>
                <button onClick={() => handleDelete(deleteConfirm)} disabled={isPending} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15 transition-colors disabled:opacity-50 cursor-pointer">ลบ</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Members Modal */}
      <AnimatePresence>
        {activeGroup && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveGroup(null)} />
            <motion.div
              className="relative glass w-full max-w-2xl z-10 flex flex-col max-h-[85vh]"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-subtle)]">
                <div>
                  <h3 className="text-lg font-bold text-white">{activeGroup.name}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{activeGroup._count.members} สมาชิก</p>
                </div>
                <button onClick={() => setActiveGroup(null)} className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>

              {memberError && (
                <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400 text-xs">{memberError}</div>
              )}

              <div className="flex flex-col md:flex-row gap-0 flex-1 min-h-0 overflow-hidden">
                {/* Left: current members */}
                <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-[var(--border-subtle)] min-h-0">
                  <div className="px-4 pt-4 pb-3">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium mb-2">สมาชิกในกลุ่ม</p>
                    <input
                      type="text"
                      className="input-glass w-full text-sm py-2"
                      placeholder="ค้นหาสมาชิก..."
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
                    {membersLoading ? (
                      <div className="text-center py-8 text-xs text-[var(--text-muted)]">กำลังโหลด...</div>
                    ) : filteredMembers.length === 0 ? (
                      <div className="text-center py-8 text-xs text-[var(--text-muted)]">
                        {members.length === 0 ? "ยังไม่มีสมาชิก" : "ไม่พบที่ค้นหา"}
                      </div>
                    ) : filteredMembers.map(m => (
                      <div key={m.id} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl hover:bg-white/4 group transition-colors">
                        <div className="min-w-0">
                          <div className="text-sm text-white truncate">{m.contact.name}</div>
                          <div className="text-xs text-[var(--text-muted)] font-mono">{m.contact.phone}</div>
                        </div>
                        <button
                          onClick={() => handleRemoveContact(m)}
                          disabled={isPending}
                          className="flex-shrink-0 w-7 h-7 rounded-lg bg-red-500/0 hover:bg-red-500/10 flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-30 cursor-pointer"
                          title="ลบออกจากกลุ่ม"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: add contacts */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="px-4 pt-4 pb-3">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium mb-2">เพิ่มรายชื่อ</p>
                    <input
                      type="text"
                      className="input-glass w-full text-sm py-2"
                      placeholder="ค้นหาเพื่อเพิ่ม..."
                      value={addSearch}
                      onChange={e => setAddSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
                    {contactsToAdd.length === 0 ? (
                      <div className="text-center py-8 text-xs text-[var(--text-muted)]">
                        {allContacts.length === members.length ? "รายชื่อทั้งหมดอยู่ในกลุ่มแล้ว" : "ไม่พบที่ค้นหา"}
                      </div>
                    ) : contactsToAdd.map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleAddContact(c)}
                        disabled={isPending}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl hover:bg-violet-500/8 border border-transparent hover:border-violet-500/15 text-left transition-all disabled:opacity-50 cursor-pointer group"
                      >
                        <div className="min-w-0">
                          <div className="text-sm text-white truncate">{c.name}</div>
                          <div className="text-xs text-[var(--text-muted)] font-mono">{c.phone}</div>
                        </div>
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/10 group-hover:bg-violet-500/20 flex items-center justify-center text-violet-400 transition-colors">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Groups Grid */}
      {groups.length > 0 ? (
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(g => (
            <motion.div key={g.id} variants={cardVariant} className="glass card-glow p-5 group flex items-start justify-between">
              <button
                className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                onClick={() => openMembers(g)}
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/[0.08] border border-violet-500/10 flex items-center justify-center text-violet-400 flex-shrink-0 group-hover:bg-violet-500/[0.12] group-hover:border-violet-500/20 transition-all">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{g.name}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">{g._count.members} สมาชิก</div>
                </div>
              </button>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
                <button onClick={() => openEdit(g)} className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-[var(--text-muted)] hover:text-slate-200 transition-colors cursor-pointer">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                </button>
                <button onClick={() => setDeleteConfirm(g.id)} className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 transition-colors cursor-pointer">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div className="glass p-16 text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--text-muted)]"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-1">ยังไม่มีกลุ่ม</p>
          <p className="text-xs text-[var(--text-muted)] mb-6">สร้างกลุ่มเพื่อจัดส่ง SMS เป็นหมวดหมู่</p>
          <button onClick={openCreate} className="btn-primary px-6 py-2.5 rounded-xl text-sm inline-flex items-center gap-2 cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            สร้างกลุ่มแรก
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
