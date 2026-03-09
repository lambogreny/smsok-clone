"use client";

import { useState, useTransition, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/lib/actions/templates";
import { useRouter } from "next/navigation";
import EmptyState from "@/app/components/ui/EmptyState";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Template = {
  id: string;
  userId: string;
  name: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
};

type CategoryKey = "all" | "general" | "otp" | "marketing" | "notification";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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
    bg: "bg-slate-500/10",
    text: "text-slate-300",
    dot: "bg-slate-300",
  },
  otp: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
  marketing: {
    bg: "bg-violet-500/10",
    text: "text-violet-400",
    dot: "bg-violet-400",
  },
  notification: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    dot: "bg-cyan-400",
  },
};

const VARIABLES = [
  { label: "ชื่อ", value: "{{name}}" },
  { label: "รหัส", value: "{{code}}" },
  { label: "วันที่", value: "{{date}}" },
  { label: "จำนวนเงิน", value: "{{amount}}" },
];

// ---------------------------------------------------------------------------
// Animations
// ---------------------------------------------------------------------------

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const modalOverlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalContent = {
  hidden: { opacity: 0, scale: 0.92, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 24,
    transition: { duration: 0.2 },
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
          className="inline-block px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 text-[11px] font-mono font-semibold mx-0.5"
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

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function TemplatesClient({
  userId,
  initialTemplates,
}: {
  userId: string;
  initialTemplates: Template[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Filter
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Form
  const [formName, setFormName] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState("general");

  // Feedback
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Filtered templates
  // ---------------------------------------------------------------------------

  const filtered = useMemo(() => {
    if (activeCategory === "all") return initialTemplates;
    return initialTemplates.filter((t) => t.category === activeCategory);
  }, [initialTemplates, activeCategory]);

  // ---------------------------------------------------------------------------
  // Counts per category
  // ---------------------------------------------------------------------------

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: initialTemplates.length };
    for (const t of initialTemplates) {
      counts[t.category] = (counts[t.category] || 0) + 1;
    }
    return counts;
  }, [initialTemplates]);

  // ---------------------------------------------------------------------------
  // Modal helpers
  // ---------------------------------------------------------------------------

  function openCreate() {
    setEditingTemplate(null);
    setFormName("");
    setFormContent("");
    setFormCategory("general");
    setFeedback(null);
    setShowModal(true);
  }

  function openEdit(template: Template) {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormContent(template.content);
    setFormCategory(template.category);
    setFeedback(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingTemplate(null);
  }

  function insertVariable(variable: string) {
    setFormContent((prev) => prev + variable);
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  function handleSave() {
    if (!formName.trim() || !formContent.trim()) return;
    setFeedback(null);

    startTransition(async () => {
      try {
        if (editingTemplate) {
          await updateTemplate(userId, editingTemplate.id, {
            name: formName.trim(),
            content: formContent,
            category: formCategory,
          });
          setFeedback({ type: "success", text: "อัปเดตเทมเพลตสำเร็จ!" });
        } else {
          await createTemplate(userId, {
            name: formName.trim(),
            content: formContent,
            category: formCategory,
          });
          setFeedback({ type: "success", text: "สร้างเทมเพลตสำเร็จ!" });
        }
        closeModal();
        router.refresh();
      } catch (e) {
        setFeedback({
          type: "error",
          text: e instanceof Error ? e.message : "เกิดข้อผิดพลาด",
        });
      }
    });
  }

  function handleDelete(templateId: string) {
    setDeletingId(templateId);
    setFeedback(null);

    startTransition(async () => {
      try {
        await deleteTemplate(userId, templateId);
        setFeedback({ type: "success", text: "ลบเทมเพลตสำเร็จ" });
        setConfirmDeleteId(null);
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
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <motion.div
      className="p-6 md:p-8 max-w-6xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight gradient-text-mixed">
            เทมเพลตข้อความ
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            จัดการเทมเพลตข้อความสำเร็จรูป ({initialTemplates.length} รายการ)
          </p>
        </div>
        <motion.button
          onClick={openCreate}
          className="btn-primary px-4 py-2.5 text-sm rounded-xl inline-flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          สร้างใหม่
        </motion.button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Feedback                                                            */}
      {/* ------------------------------------------------------------------ */}

      <AnimatePresence>
        {feedback && !showModal && (
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

      {/* ------------------------------------------------------------------ */}
      {/* Category Filter Tabs                                                */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map(({ key, label }) => {
          const isActive = activeCategory === key;
          const count = categoryCounts[key] || 0;
          return (
            <motion.button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                isActive
                  ? "bg-white/[0.08] text-white border border-white/[0.08] shadow-lg shadow-white/[0.02]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/[0.03]"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {key !== "all" && (
                <span
                  className={`w-2 h-2 rounded-full ${getCategoryStyle(key).dot}`}
                />
              )}
              {label}
              <span
                className={`text-xs ${
                  isActive ? "text-slate-300" : "text-[var(--text-muted)]"
                }`}
              >
                {count}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Template Cards Grid                                                 */}
      {/* ------------------------------------------------------------------ */}

      {filtered.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          variants={stagger}
          initial="hidden"
          animate="show"
          key={activeCategory}
        >
          {filtered.map((template) => {
            const style = getCategoryStyle(template.category);
            const vars = extractVariables(template.content);
            const isConfirmingDelete = confirmDeleteId === template.id;

            return (
              <motion.div
                key={template.id}
                variants={cardVariant}
                className="glass p-5 card-hover group relative"
                layout
              >
                {/* Top row: name + category badge */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] leading-snug pr-4 line-clamp-1">
                    {template.name}
                  </h3>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${style.bg} ${style.text}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${style.dot}`}
                    />
                    {getCategoryLabel(template.category)}
                  </span>
                </div>

                {/* Content preview */}
                <div className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3 line-clamp-3 min-h-[3.6em]">
                  {highlightVariables(template.content)}
                </div>

                {/* Variables used */}
                {vars.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                      ตัวแปร:
                    </span>
                    {vars.map((v) => (
                      <span
                        key={v}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 font-mono"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer: timestamp + actions */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-muted)]">
                    อัปเดต {formatDate(template.updatedAt)}
                  </span>

                  <div className="flex items-center gap-2">
                    {isConfirmingDelete ? (
                      <>
                        <motion.button
                          onClick={() => handleDelete(template.id)}
                          disabled={deletingId === template.id}
                          className="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors disabled:opacity-40"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {deletingId === template.id ? (
                            <Spinner />
                          ) : (
                            "ยืนยันลบ"
                          )}
                        </motion.button>
                        <motion.button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1.5 text-[11px] font-medium rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          ยกเลิก
                        </motion.button>
                      </>
                    ) : (
                      <>
                        <motion.button
                          onClick={() => openEdit(template)}
                          className="px-3 py-1.5 text-[11px] font-medium rounded-lg text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.06] transition-all"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="flex items-center gap-1.5">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            แก้ไข
                          </span>
                        </motion.button>
                        <motion.button
                          onClick={() => setConfirmDeleteId(template.id)}
                          className="px-3 py-1.5 text-[11px] font-medium rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="flex items-center gap-1.5">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                            ลบ
                          </span>
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
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
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          }
          title={
            activeCategory === "all"
              ? "ยังไม่มีเทมเพลต"
              : `ไม่มีเทมเพลตในหมวด "${getCategoryLabel(activeCategory)}"`
          }
          description="สร้างเทมเพลตข้อความสำเร็จรูปเพื่อส่งข้อความได้รวดเร็วขึ้น"
          action={{ label: "+ สร้างเทมเพลต", onClick: openCreate }}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Create / Edit Modal                                                 */}
      {/* ------------------------------------------------------------------ */}

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            variants={modalOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeModal}
            />

            {/* Modal Content */}
            <motion.div
              className="relative w-full max-w-lg glass p-6 border border-[var(--border-subtle)] shadow-2xl max-h-[90vh] overflow-y-auto"
              variants={modalContent}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/[0.12] to-cyan-500/[0.08] border border-violet-500/10 flex items-center justify-center">
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
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <span className="gradient-text-mixed">
                    {editingTemplate ? "แก้ไขเทมเพลต" : "สร้างเทมเพลตใหม่"}
                  </span>
                </h3>
                <motion.button
                  onClick={closeModal}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-white/[0.06] transition-all"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </motion.button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    ชื่อเทมเพลต *
                  </label>
                  <input
                    type="text"
                    className="input-glass"
                    placeholder="เช่น ยืนยัน OTP, โปรโมชั่นประจำเดือน"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    maxLength={100}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    หมวดหมู่
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {CATEGORIES.filter((c) => c.key !== "all").map(
                      ({ key, label }) => {
                        const catStyle = getCategoryStyle(key);
                        const isSelected = formCategory === key;
                        return (
                          <motion.button
                            key={key}
                            type="button"
                            onClick={() => setFormCategory(key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? `${catStyle.bg} ${catStyle.text} ring-1 ring-current/20`
                                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] bg-white/[0.02] hover:bg-white/[0.04]"
                            }`}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected
                                  ? catStyle.dot
                                  : "bg-current opacity-40"
                              }`}
                            />
                            {label}
                          </motion.button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">
                      ข้อความ *
                    </label>
                    <span
                      className={`text-[10px] font-mono ${
                        formContent.length > 900
                          ? "text-red-400"
                          : formContent.length > 700
                            ? "text-amber-400"
                            : "text-[var(--text-muted)]"
                      }`}
                    >
                      {formContent.length}/1,000
                    </span>
                  </div>
                  <textarea
                    className="input-glass min-h-[120px] resize-y"
                    placeholder={'พิมพ์ข้อความ... ใช้ {{name}} สำหรับตัวแปร'}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    maxLength={1000}
                    rows={5}
                  />
                </div>

                {/* Variable helper buttons */}
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-2">
                    แทรกตัวแปร
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {VARIABLES.map(({ label, value }) => (
                      <motion.button
                        key={value}
                        type="button"
                        onClick={() => insertVariable(value)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-mono bg-cyan-500/[0.06] text-cyan-400 hover:bg-cyan-500/15 border border-cyan-500/10 transition-all flex items-center gap-1.5"
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        {label}{" "}
                        <span className="opacity-60">{value}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {formContent.trim() && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2"
                  >
                    <label className="block text-xs text-[var(--text-muted)] mb-2">
                      ตัวอย่าง
                    </label>
                    <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                      {highlightVariables(formContent)}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Modal feedback */}
              <AnimatePresence>
                {feedback && showModal && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={`mt-4 p-3 rounded-xl border text-xs font-medium ${
                      feedback.type === "success"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-red-500/10 border-red-500/20 text-red-400"
                    }`}
                  >
                    {feedback.text}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[var(--border-subtle)]">
                <motion.button
                  onClick={closeModal}
                  className="btn-glass px-5 py-2.5 text-sm font-medium rounded-xl"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  ยกเลิก
                </motion.button>
                <motion.button
                  onClick={handleSave}
                  disabled={
                    isPending || !formName.trim() || !formContent.trim()
                  }
                  className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-40"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <Spinner />
                      กำลังบันทึก...
                    </span>
                  ) : editingTemplate ? (
                    "อัปเดต"
                  ) : (
                    "สร้างเทมเพลต"
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
