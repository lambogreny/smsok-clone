"use client";

import { useState, useTransition } from "react";
import { createContact, deleteContact } from "@/lib/actions/contacts";
import { useRouter } from "next/navigation";

type Contact = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  tags: string | null;
  createdAt: string;
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
    <div className="p-6 md:p-8 max-w-6xl animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Contacts</h2>
          <p className="text-sm text-white/40 mt-1">
            จัดการรายชื่อผู้ติดต่อ ({totalContacts} รายชื่อ)
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary px-4 py-2.5 text-sm rounded-xl inline-flex items-center gap-2"
        >
          {showForm ? "Cancel" : "+ Add Contact"}
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`mb-6 p-4 rounded-xl border text-sm font-medium animate-fade-in ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Add Contact Form */}
      {showForm && (
        <div className="glass p-6 mb-6 animate-fade-in">
          <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            Add New Contact
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">Name *</label>
              <input
                type="text"
                className="input-glass"
                placeholder="ชื่อ-นามสกุล"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">Phone *</label>
              <input
                type="text"
                className="input-glass"
                placeholder="0891234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                className="input-glass"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">Tags</label>
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
            <button
              onClick={handleAdd}
              disabled={isPending || !name.trim() || !phone.trim()}
              className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-40"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save Contact"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Contact List */}
      {initialContacts.length > 0 ? (
        <div className="glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Name</th>
                  <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Phone</th>
                  <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Email</th>
                  <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Tags</th>
                  <th className="w-20 px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {initialContacts.map((contact) => (
                  <tr key={contact.id} className="table-row">
                    <td className="px-5 py-3.5 text-white/70">{contact.name}</td>
                    <td className="px-5 py-3.5 text-white/50 font-mono text-xs">{contact.phone}</td>
                    <td className="px-5 py-3.5 text-white/40 text-xs">{contact.email || "-"}</td>
                    <td className="px-5 py-3.5">
                      {contact.tags ? (
                        <div className="flex gap-1 flex-wrap">
                          {contact.tags.split(",").map((tag) => (
                            <span key={tag.trim()} className="badge badge-info">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-white/20">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(contact.id)}
                        disabled={deletingId === contact.id}
                        className="btn-danger px-3 py-1.5 text-xs rounded-lg disabled:opacity-40"
                      >
                        {deletingId === contact.id ? "..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="glass p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white/10">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
          </div>
          <p className="text-sm text-white/25 mb-1">No contacts yet</p>
          <p className="text-xs text-white/15 mb-5">เพิ่มรายชื่อผู้ติดต่อเพื่อส่ง SMS ได้ง่ายขึ้น</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
          >
            + Add Contact
          </button>
        </div>
      )}
    </div>
  );
}
