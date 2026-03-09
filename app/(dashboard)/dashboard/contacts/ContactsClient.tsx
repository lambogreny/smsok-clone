"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createContact, deleteContact } from "@/lib/actions/contacts";
import { useRouter } from "next/navigation";
import EmptyState from "@/app/components/ui/EmptyState";
import { useToast } from "@/app/components/ui/Toast";

type Contact = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  tags: string | null;
  createdAt: string;
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const rowVariant = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export default function ContactsClient({
  userId,
  initialContacts,
  totalContacts,
}: {
  userId: string;
  initialContacts: Contact[];
  totalContacts: number;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [tags, setTags] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!name.trim() || !phone.trim()) return;
    setFeedback(null);

    startTransition(async () => {
      try {
        await createContact(userId, {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          tags: tags.trim() || undefined,
        });
        setFeedback({ type: "success", text: "เพิ่มรายชื่อสำเร็จ!" });
        setName("");
        setPhone("");
        setEmail("");
        setTags("");
        setShowForm(false);
        router.refresh();
      } catch (e) {
        setFeedback({
          type: "error",
          text: e instanceof Error ? e.message : "เกิดข้อผิดพลาด",
        });
      }
    });
  };

  const handleDelete = (contactId: string) => {
    setDeletingId(contactId);
    startTransition(async () => {
      try {
        await deleteContact(userId, contactId);
        router.refresh();
      } catch (e) {
        setFeedback({
          type: "error",
          text: e instanceof Error ? e.message : "ลบไม่สำเร็จ",
        });
      } finally {
        setDeletingId(null);
      }
    });
  };

  return (
    <motion.div
      className="p-6 md:p-8 max-w-6xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-300 via-violet-300 to-indigo-400 bg-clip-text text-transparent">รายชื่อผู้ติดต่อ</h2>
          <p className="text-sm text-white/40 mt-1">
            จัดการรายชื่อผู้ติดต่อ ({totalContacts} รายชื่อ)
          </p>
        </div>
        <motion.button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary px-4 py-2.5 text-sm rounded-xl inline-flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {showForm ? "ยกเลิก" : "+ เพิ่มรายชื่อ"}
        </motion.button>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-6 p-4 rounded-xl border text-sm font-medium ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            {feedback.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Contact Form */}
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
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500/[0.12] to-violet-500/[0.08] border border-sky-500/10 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
                  <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </div>
              <span className="bg-gradient-to-r from-sky-300 to-violet-300 bg-clip-text text-transparent">เพิ่มรายชื่อใหม่</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">ชื่อ *</label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="ชื่อ-นามสกุล"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">เบอร์โทร *</label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="0891234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">อีเมล</label>
                <input
                  type="email"
                  className="input-glass"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">แท็ก</label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="vip, customer"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-5">
              <motion.button
                onClick={handleAdd}
                disabled={isPending || !name.trim() || !phone.trim()}
                className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-40"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    กำลังบันทึก...
                  </span>
                ) : (
                  "บันทึก"
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact List */}
      {initialContacts.length > 0 ? (
        <motion.div
          className="glass overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">ชื่อ</th>
                  <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">เบอร์โทร</th>
                  <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium hidden md:table-cell">อีเมล</th>
                  <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium hidden md:table-cell">แท็ก</th>
                  <th className="w-20 px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium text-right">จัดการ</th>
                </tr>
              </thead>
              <motion.tbody variants={stagger} initial="hidden" animate="show">
                {initialContacts.map((contact) => (
                  <motion.tr key={contact.id} variants={rowVariant} className="table-row">
                    <td className="px-5 py-3.5 text-white/70">{contact.name}</td>
                    <td className="px-5 py-3.5 text-white/50 font-mono text-xs">{contact.phone}</td>
                    <td className="px-5 py-3.5 text-white/40 text-xs hidden md:table-cell">{contact.email || "-"}</td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {contact.tags ? (
                        <div className="flex gap-1 flex-wrap">
                          {contact.tags.split(",").map((tag) => (
                            <span key={tag.trim()} className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-400">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-white/20">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <motion.button
                        onClick={() => handleDelete(contact.id)}
                        disabled={deletingId === contact.id}
                        className="btn-danger px-3 py-1.5 text-xs rounded-lg disabled:opacity-40"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {deletingId === contact.id ? "..." : "ลบ"}
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <EmptyState
          icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>}
          title="ยังไม่มีรายชื่อ"
          description="เพิ่มรายชื่อผู้ติดต่อเพื่อส่งข้อความได้ง่ายขึ้น"
          action={{ label: "+ เพิ่มรายชื่อ", onClick: () => setShowForm(true) }}
        />
      )}
    </motion.div>
  );
}
