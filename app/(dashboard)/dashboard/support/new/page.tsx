"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Loader2,
  ExternalLink,
  Eye,
  ThumbsUp,
  ChevronRight,
  Check,
  FileText,
  ClipboardList,
  SendHorizonal,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CustomSelect from "@/components/ui/CustomSelect";
import { toast } from "sonner";

/* ─── Constants ─── */

const CATEGORIES = [
  { value: "BILLING", label: "การเงิน / ชำระเงิน" },
  { value: "TECHNICAL", label: "ปัญหาทางเทคนิค" },
  { value: "SENDER_NAME", label: "ชื่อผู้ส่ง (Sender Name)" },
  { value: "DELIVERY", label: "การส่ง / ปัญหาจัดส่ง" },
  { value: "ACCOUNT", label: "บัญชีผู้ใช้" },
  { value: "GENERAL", label: "ทั่วไป" },
];

const PRIORITIES = [
  { value: "LOW", label: "ต่ำ" },
  { value: "MEDIUM", label: "ปกติ" },
  { value: "HIGH", label: "สูง" },
  { value: "URGENT", label: "เร่งด่วน" },
];

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "var(--text-muted)",
  MEDIUM: "var(--info)",
  HIGH: "var(--warning)",
  URGENT: "var(--error)",
};

const STEPS = [
  { num: 1, label: "ค้นหาคำตอบ", icon: Search },
  { num: 2, label: "รายละเอียดตั๋ว", icon: ClipboardList },
  { num: 3, label: "ยืนยัน & ส่ง", icon: SendHorizonal },
];

/* ─── Types ─── */

type KBArticle = {
  id: string;
  title: string;
  slug: string;
  category: string;
  viewCount: number;
  helpfulCount: number;
  publishedAt: string;
};

type FormData = {
  subject: string;
  category: string;
  priority: string;
  description: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

/* ─── Stepper Component ─── */

function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const isActive = currentStep === step.num;
        const isDone = currentStep > step.num;
        const Icon = step.icon;

        return (
          <div key={step.num} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                  transition-all duration-300 border-2
                  ${isDone
                    ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--bg-base)]"
                    : isActive
                      ? "border-[var(--accent)] bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)]"
                      : "border-[var(--border-default)] bg-transparent text-[var(--text-muted)]"
                  }
                `}
              >
                {isDone ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-[11px] font-medium transition-colors duration-300 whitespace-nowrap ${
                  isActive || isDone
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className={`
                  w-16 sm:w-24 h-0.5 mx-2 mt-[-18px] rounded-full transition-colors duration-300
                  ${currentStep > step.num
                    ? "bg-[var(--accent)]"
                    : "bg-[var(--border-default)]"
                  }
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Step 1: FAQ Deflection ─── */

function StepFAQ({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchArticles = useCallback(async (q: string) => {
    if (!q.trim()) {
      setArticles([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/v1/kb/articles?search=${encodeURIComponent(q.trim())}&limit=6`
      );
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles ?? []);
      } else {
        setArticles([]);
      }
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchArticles(value), 400);
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[rgba(var(--accent-rgb),0.1)] mb-2">
          <FileText className="w-6 h-6 text-[var(--accent)]" />
        </div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          ก่อนสร้างตั๋ว ลองค้นหาคำตอบก่อน
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          ค้นหาจากฐานความรู้ของเรา อาจมีคำตอบที่คุณต้องการอยู่แล้ว
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <Input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="พิมพ์คำถามหรือคำค้นหา..."
          className="pl-10 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] h-11"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] animate-spin" />
        )}
      </div>

      {/* Results */}
      {searched && !loading && articles.length === 0 && (
        <div className="text-center py-8 space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)]">
            <Search className="w-5 h-5 text-[var(--text-muted)]" />
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            ไม่พบบทความที่เกี่ยวข้อง
          </p>
        </div>
      )}

      {articles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            บทความที่เกี่ยวข้อง ({articles.length})
          </p>
          <div className="grid gap-2">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/dashboard/support/kb?article=${article.slug}`}
                target="_blank"
                className="group flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[rgba(var(--accent-rgb),0.3)] transition-all duration-200"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                    {article.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)]">
                      {CATEGORIES.find((c) => c.value === article.category)?.label ?? article.category}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                      <Eye className="w-3 h-3" />
                      {article.viewCount}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                      <ThumbsUp className="w-3 h-3" />
                      {article.helpfulCount}
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors flex-shrink-0 mt-0.5" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {searched && (
          <Button
            onClick={onNext}
            className="w-full sm:w-auto cursor-pointer bg-[var(--accent)] text-[var(--bg-base)] hover:bg-[var(--accent)]/90 font-medium"
          >
            ไม่พบคำตอบ — สร้างตั๋วใหม่
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors underline underline-offset-4 cursor-pointer"
        >
          ข้ามไปสร้างตั๋ว
        </button>
      </div>
    </div>
  );
}

/* ─── Step 2: Ticket Details ─── */

function StepDetails({
  form,
  setForm,
  errors,
  onBack,
  onNext,
}: {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  errors: FormErrors;
  onBack: () => void;
  onNext: () => void;
}) {
  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-5">
      {/* Subject */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
          หัวข้อ <span className="text-[var(--error)]">*</span>
        </label>
        <Input
          value={form.subject}
          onChange={(e) => updateField("subject", e.target.value)}
          placeholder="สรุปปัญหาสั้น ๆ"
          maxLength={200}
          className={`bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] ${
            errors.subject ? "border-[var(--error)] focus:ring-[var(--error)]/30" : ""
          }`}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.subject ? (
            <p className="text-[11px] text-[var(--error)] flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.subject}
            </p>
          ) : (
            <span />
          )}
          <span className="text-[11px] text-[var(--text-muted)]">
            {form.subject.length}/200
          </span>
        </div>
      </div>

      {/* Category & Priority */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
            หมวดหมู่ <span className="text-[var(--error)]">*</span>
          </label>
          <CustomSelect
            value={form.category}
            onChange={(v) => updateField("category", v)}
            options={CATEGORIES}
            placeholder="เลือกหมวดหมู่..."
          />
          {errors.category && (
            <p className="text-[11px] text-[var(--error)] flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3" />
              {errors.category}
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
            ความเร่งด่วน
          </label>
          <CustomSelect
            value={form.priority}
            onChange={(v) => updateField("priority", v)}
            options={PRIORITIES}
            placeholder="เลือกระดับ..."
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
          รายละเอียด <span className="text-[var(--error)]">*</span>
        </label>
        <Textarea
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="อธิบายปัญหาของคุณให้ละเอียด (อย่างน้อย 20 ตัวอักษร)"
          maxLength={2000}
          rows={6}
          className={`bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none ${
            errors.description ? "border-[var(--error)] focus:ring-[var(--error)]/30" : ""
          }`}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.description ? (
            <p className="text-[11px] text-[var(--error)] flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.description}
            </p>
          ) : (
            <span />
          )}
          <span className="text-[11px] text-[var(--text-muted)]">
            {form.description.length}/2,000
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          onClick={onBack}
          className="cursor-pointer border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          ย้อนกลับ
        </Button>
        <Button
          onClick={onNext}
          className="cursor-pointer bg-[var(--accent)] text-[var(--bg-base)] hover:bg-[var(--accent)]/90 font-medium"
        >
          ถัดไป
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Step 3: Confirm & Submit ─── */

function StepConfirm({
  form,
  submitting,
  onBack,
  onSubmit,
}: {
  form: FormData;
  submitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const categoryLabel =
    CATEGORIES.find((c) => c.value === form.category)?.label ?? form.category;
  const priorityLabel =
    PRIORITIES.find((p) => p.value === form.priority)?.label ?? form.priority;
  const priorityColor = PRIORITY_COLORS[form.priority] ?? "var(--text-muted)";

  return (
    <div className="space-y-6">
      {/* Review header */}
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          ตรวจสอบข้อมูลตั๋ว
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          กรุณาตรวจสอบข้อมูลก่อนส่ง
        </p>
      </div>

      {/* Review card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 space-y-4">
        {/* Subject */}
        <div>
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
            หัวข้อ
          </p>
          <p className="text-sm text-[var(--text-primary)] font-medium">
            {form.subject}
          </p>
        </div>

        <div className="h-px bg-[var(--border-subtle)]" />

        {/* Category & Priority row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
              หมวดหมู่
            </p>
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)]">
              {categoryLabel}
            </span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
              ความเร่งด่วน
            </p>
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{
                backgroundColor: `color-mix(in srgb, ${priorityColor} 15%, transparent)`,
                color: priorityColor,
              }}
            >
              {priorityLabel}
            </span>
          </div>
        </div>

        <div className="h-px bg-[var(--border-subtle)]" />

        {/* Description */}
        <div>
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
            รายละเอียด
          </p>
          <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
            {form.description}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={submitting}
          className="cursor-pointer border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          แก้ไข
        </Button>
        <Button
          onClick={onSubmit}
          disabled={submitting}
          className="cursor-pointer bg-[var(--accent)] text-[var(--bg-base)] hover:bg-[var(--accent)]/90 font-medium min-w-[120px]"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              กำลังส่ง...
            </>
          ) : (
            <>
              <SendHorizonal className="w-4 h-4 mr-1.5" />
              ส่งตั๋ว
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function NewSupportTicketPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormData>({
    subject: "",
    category: "",
    priority: "MEDIUM",
    description: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  /* Validate step 2 */
  function validateForm(): boolean {
    const newErrors: FormErrors = {};

    if (!form.subject.trim()) {
      newErrors.subject = "กรุณากรอกหัวข้อ";
    } else if (form.subject.trim().length > 200) {
      newErrors.subject = "หัวข้อต้องไม่เกิน 200 ตัวอักษร";
    }

    if (!form.category) {
      newErrors.category = "กรุณาเลือกหมวดหมู่";
    }

    if (!form.description.trim()) {
      newErrors.description = "กรุณากรอกรายละเอียด";
    } else if (form.description.trim().length < 20) {
      newErrors.description = `กรุณากรอกอย่างน้อย 20 ตัวอักษร (ขณะนี้ ${form.description.trim().length} ตัวอักษร)`;
    } else if (form.description.trim().length > 2000) {
      newErrors.description = "รายละเอียดต้องไม่เกิน 2,000 ตัวอักษร";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function goToStep2() {
    setStep(2);
  }

  function goToStep3() {
    if (validateForm()) {
      setErrors({});
      setStep(3);
    }
  }

  /* Submit */
  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/v1/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: form.subject.trim(),
          description: form.description.trim(),
          category: form.category,
          priority: form.priority,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message ?? "ส่งตั๋วไม่สำเร็จ");
      }

      const data = await res.json();
      toast.success("สร้างตั๋วสำเร็จ", {
        description: `ตั๋ว #${data.id ?? ""} ถูกสร้างแล้ว`,
      });
      router.push(`/dashboard/support/${data.id ?? ""}`);
    } catch (err) {
      toast.error("เกิดข้อผิดพลาด", {
        description:
          err instanceof Error ? err.message : "ส่งตั๋วไม่สำเร็จ กรุณาลองใหม่",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-8 py-6 max-md:px-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/support">
          <button
            type="button"
            className="w-9 h-9 rounded-xl border border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            สร้างตั๋วใหม่
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            ทีมงานจะตอบกลับภายใน 24 ชั่วโมง
          </p>
        </div>
      </div>

      {/* Stepper */}
      <Stepper currentStep={step} />

      {/* Card wrapper */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-6 max-md:p-4">
        {step === 1 && (
          <StepFAQ onNext={goToStep2} onSkip={goToStep2} />
        )}
        {step === 2 && (
          <StepDetails
            form={form}
            setForm={setForm}
            errors={errors}
            onBack={() => setStep(1)}
            onNext={goToStep3}
          />
        )}
        {step === 3 && (
          <StepConfirm
            form={form}
            submitting={submitting}
            onBack={() => setStep(2)}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}
