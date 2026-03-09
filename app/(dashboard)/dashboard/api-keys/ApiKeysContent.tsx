"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createApiKey, toggleApiKey, deleteApiKey } from "@/lib/actions/api-keys";

type ApiKey = {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
  lastUsed: Date | null;
  createdAt: Date;
};

function maskKey(key: string): string {
  if (key.length <= 12) return key;
  return key.substring(0, 8) + "..." + key.substring(key.length - 4);
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const rowVariant = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export default function ApiKeysContent({ userId, apiKeys: initialKeys }: { userId: string; apiKeys: ApiKey[] }) {
  const [apiKeys, setApiKeys] = useState(initialKeys);
  const [showForm, setShowForm] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    setCreating(true);
    setError(null);

    try {
      const newKey = await createApiKey(userId, { name: keyName });
      setApiKeys((prev) => [{ ...newKey, isActive: true, lastUsed: null } as ApiKey, ...prev]);
      setNewlyCreatedKey(newKey.key);
      setKeyName("");
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (keyId: string) => {
    try {
      const updated = await toggleApiKey(userId, keyId);
      setApiKeys((prev) => prev.map((k) => (k.id === keyId ? { ...k, isActive: updated.isActive } : k)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
  };

  const handleDelete = async (keyId: string) => {
    if (!confirm("คุณต้องการลบ API Key นี้?")) return;
    try {
      await deleteApiKey(userId, keyId);
      setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-300 via-sky-300 to-cyan-300 bg-clip-text text-transparent">คีย์ API</h1>
          <p className="text-sm text-white/40 mt-1">จัดการ API Keys สำหรับเชื่อมต่อระบบ</p>
        </div>
        <motion.button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary px-5 py-2.5 text-sm rounded-xl inline-flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          สร้างคีย์ใหม่
        </motion.button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass p-4 mb-6 border-red-500/20"
          >
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Newly Created Key Warning */}
      <AnimatePresence>
        {newlyCreatedKey && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass p-6 mb-6 border-emerald-500/20"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-emerald-400 mb-1">API Key สร้างเรียบร้อยแล้ว</p>
                <p className="text-xs text-white/40 mb-3">กรุณาคัดลอกเก็บไว้ — คุณจะไม่สามารถเห็น Key เต็มได้อีก</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white/[0.03] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-sky-300 font-mono break-all">
                    {newlyCreatedKey}
                  </code>
                  <motion.button
                    onClick={() => handleCopy(newlyCreatedKey)}
                    className="btn-glass px-4 py-2.5 rounded-lg text-xs flex-shrink-0 flex items-center gap-1.5"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {copied ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400"><polyline points="20 6 9 17 4 12" /></svg>
                        คัดลอกแล้ว
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                        คัดลอก
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="glass p-6 mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-base font-semibold text-white mb-4">สร้าง API Key ใหม่</h2>
            <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs text-white/30 uppercase tracking-wider mb-2 font-medium">ชื่อ API Key</label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="เช่น Production, Staging, My App"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  maxLength={50}
                />
              </div>
              <div className="flex items-end gap-2">
                <motion.button
                  type="submit"
                  disabled={!keyName.trim() || creating}
                  className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-40 whitespace-nowrap"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {creating ? "กำลังสร้าง..." : "สร้าง Key"}
                </motion.button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setKeyName(""); }}
                  className="btn-glass px-4 py-3 rounded-xl text-sm"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* API Keys List */}
      <div className="glass overflow-hidden">
        {apiKeys.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">ชื่อ</th>
                  <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Key</th>
                  <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">สถานะ</th>
                  <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium hidden md:table-cell">สร้างเมื่อ</th>
                  <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium hidden md:table-cell">ใช้ล่าสุด</th>
                  <th className="text-right px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">จัดการ</th>
                </tr>
              </thead>
              <motion.tbody variants={stagger} initial="hidden" animate="show">
                {apiKeys.map((key) => (
                  <motion.tr key={key.id} variants={rowVariant} className="table-row">
                    <td className="px-5 py-3.5 text-white/70 font-semibold">{key.name}</td>
                    <td className="px-5 py-3.5">
                      <code className="text-xs text-sky-300/60 font-mono bg-white/[0.02] px-2 py-1 rounded">{maskKey(key.key)}</code>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md ${key.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                        {key.isActive ? "เปิดใช้" : "ปิดใช้"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-white/30 text-xs hidden md:table-cell">{new Date(key.createdAt).toLocaleDateString("th-TH")}</td>
                    <td className="px-5 py-3.5 text-white/30 text-xs hidden md:table-cell">{key.lastUsed ? new Date(key.lastUsed).toLocaleDateString("th-TH") : "ยังไม่เคยใช้"}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <motion.button
                          onClick={() => handleToggle(key.id)}
                          className="btn-glass px-3 py-1.5 rounded-lg text-xs"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {key.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                        </motion.button>
                        <motion.button
                          onClick={() => handleDelete(key.id)}
                          className="btn-danger px-3 py-1.5 rounded-lg text-xs"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          ลบ
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        ) : (
          <motion.div
            className="text-center py-14"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white/10">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>
            <p className="text-sm text-white/25 mb-1">ยังไม่มี API Key</p>
            <p className="text-xs text-white/15 mb-5">สร้าง API Key เพื่อเชื่อมต่อระบบของคุณ</p>
            <motion.button
              onClick={() => setShowForm(true)}
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              สร้าง API Key
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* API Documentation Hint */}
      <motion.div
        className="glass p-6 mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-sky-400">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          การใช้งาน API
        </h3>
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
          <code className="text-xs text-sky-300/60 font-mono block whitespace-pre">{`curl -X POST https://api.smsok.com/v1/sms/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "0812345678", "message": "Hello!"}'`}</code>
        </div>
      </motion.div>
    </motion.div>
  );
}
