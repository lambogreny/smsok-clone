"use client";

import { useState, useCallback } from "react";
import { useCampaignWizardStore } from "@/providers/campaign-wizard-store-provider";
import type { CampaignWizardStep } from "@/stores/campaign-wizard-store";
const inputCls = "h-11 bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(var(--accent-rgb),0.12)]";
import CustomSelect from "@/components/ui/CustomSelect";
import SenderDropdown from "@/components/ui/SenderDropdown";
import SendingHoursWarning from "@/components/blocks/SendingHoursWarning";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Users,
  MessageSquare,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Send,
  Smartphone,
  X,
} from "lucide-react";
import { createCampaign } from "@/lib/actions/campaigns";
import { useToast } from "@/app/components/ui/Toast";
import { safeErrorMessage } from "@/lib/error-messages";

type ContactGroup = { id: string; name: string; count: number };
type Template = { id: string; name: string; body: string };

interface CampaignWizardProps {
  groups: ContactGroup[];
  templates: Template[];
  senderNames: string[];
  onClose: () => void;
  onCreated: () => void;
}

const STEPS: { key: CampaignWizardStep; label: string; icon: React.ReactNode }[] = [
  { key: "details", label: "รายละเอียด", icon: <FileText size={16} /> },
  { key: "audience", label: "ผู้รับ", icon: <Users size={16} /> },
  { key: "message", label: "ข้อความ", icon: <MessageSquare size={16} /> },
  { key: "schedule", label: "ตั้งเวลา", icon: <Calendar size={16} /> },
  { key: "review", label: "ตรวจสอบ", icon: <CheckCircle2 size={16} /> },
];

// SMS segment calculation
function calcSegments(text: string): { chars: number; segments: number; limit: number } {
  const chars = text.length;
  if (chars <= 160) return { chars, segments: 1, limit: 160 };
  if (chars <= 306) return { chars, segments: 2, limit: 306 };
  return { chars, segments: Math.ceil(chars / 153), limit: Math.ceil(chars / 153) * 153 };
}

// Template variable tokens
const VARIABLES = [
  { token: "{ชื่อ}", label: "ชื่อผู้รับ" },
  { token: "{นามสกุล}", label: "นามสกุล" },
  { token: "{รหัส}", label: "รหัส OTP" },
  { token: "{เบอร์}", label: "เบอร์โทร" },
];

export default function CampaignWizard({
  groups,
  templates,
  senderNames,
  onClose,
  onCreated,
}: CampaignWizardProps) {
  const currentStep = useCampaignWizardStore((s) => s.currentStep);
  const draft = useCampaignWizardStore((s) => s.draft);
  const completedSteps = useCampaignWizardStore((s) => s.completedSteps);
  const setStep = useCampaignWizardStore((s) => s.setStep);
  const nextStep = useCampaignWizardStore((s) => s.nextStep);
  const prevStep = useCampaignWizardStore((s) => s.prevStep);
  const updateDraft = useCampaignWizardStore((s) => s.updateDraft);
  const markStepComplete = useCampaignWizardStore((s) => s.markStepComplete);
  const resetWizard = useCampaignWizardStore((s) => s.resetWizard);

  const [submitting, setSubmitting] = useState(false);
  const [manualPhones, setManualPhones] = useState("");
  const [audienceMode, setAudienceMode] = useState<"group" | "manual">("group");
  const { toast } = useToast();

  const currentIdx = STEPS.findIndex((s) => s.key === currentStep);

  // Step validation
  function isStepValid(step: CampaignWizardStep): boolean {
    switch (step) {
      case "details":
        return draft.name.trim().length > 0 && draft.senderName.trim().length > 0;
      case "audience":
        return audienceMode === "group" ? !!draft.targetGroupId : manualPhones.trim().length > 0;
      case "message":
        return draft.message.trim().length > 0;
      case "schedule":
        return !draft.scheduled || (!!draft.scheduleDate && new Date(draft.scheduleDate) > new Date());
      case "review":
        return true;
      default:
        return false;
    }
  }

  function handleNext() {
    if (!isStepValid(currentStep)) return;
    markStepComplete(currentStep);
    nextStep();
  }

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const result = await createCampaign({
        name: draft.name.trim(),
        contactGroupId: draft.targetGroupId ?? undefined,
        templateId: draft.templateId ?? undefined,
        senderName: draft.senderName,
        messageBody: draft.message,
        scheduledAt: draft.scheduled && draft.scheduleDate ? new Date(draft.scheduleDate).toISOString() : undefined,
      });
      if (result && "error" in result) {
        toast("error", safeErrorMessage(result.error as string));
      } else {
        toast("success", draft.scheduled ? "ตั้งเวลาแคมเปญสำเร็จ!" : "สร้างแคมเปญสำเร็จ!");
        resetWizard();
        onCreated();
      }
    } catch (err) {
      toast("error", safeErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }, [draft, toast, resetWizard, onCreated, audienceMode, manualPhones]);

  function handleClose() {
    resetWizard();
    onClose();
  }

  const selectedGroup = groups.find((g) => g.id === draft.targetGroupId);
  const selectedTemplate = templates.find((t) => t.id === draft.templateId);
  const seg = calcSegments(draft.message);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div
        className="w-full max-w-[640px] max-h-[90vh] overflow-y-auto bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            สร้างแคมเปญใหม่
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            style={{ color: "var(--text-muted)" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-4 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-1">
            {STEPS.map((step, i) => {
              const isActive = i === currentIdx;
              const isCompleted = completedSteps.includes(step.key);
              return (
                <div key={step.key} className="flex items-center flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (isCompleted || i <= currentIdx) setStep(step.key);
                    }}
                    className="flex items-center gap-1.5 text-[12px] font-medium transition-colors cursor-pointer"
                    style={{
                      color: isActive
                        ? "var(--accent)"
                        : isCompleted
                          ? "var(--success)"
                          : "var(--text-muted)",
                    }}
                  >
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                      style={{
                        background: isActive
                          ? "rgba(var(--accent-rgb),0.12)"
                          : isCompleted
                            ? "rgba(var(--success-rgb),0.12)"
                            : "rgba(var(--border-default-rgb,40,45,55),0.3)",
                        color: isActive
                          ? "var(--accent)"
                          : isCompleted
                            ? "var(--success)"
                            : "var(--text-muted)",
                      }}
                    >
                      {isCompleted ? <CheckCircle2 size={12} /> : i + 1}
                    </span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div
                      className="flex-1 h-px mx-2"
                      style={{
                        background: isCompleted
                          ? "var(--success)"
                          : "var(--border-default)",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="px-6 py-6 min-h-[320px]">
          {/* Step 1: Details */}
          {currentStep === "details" && (
            <div className="space-y-5">
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                  ชื่อแคมเปญ *
                </label>
                <Input
                  value={draft.name}
                  onChange={(e) => updateDraft({ name: e.target.value })}
                  placeholder="เช่น โปรโมชันเดือนมีนา"
                  className={inputCls}
                  maxLength={100}
                />
                <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                  {draft.name.length}/100 ตัวอักษร
                </p>
              </div>
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                  ชื่อผู้ส่ง *
                </label>
                <SenderDropdown
                  senderNames={senderNames}
                  value={draft.senderName}
                  onChange={(v) => updateDraft({ senderName: v })}
                />
              </div>
            </div>
          )}

          {/* Step 2: Audience */}
          {currentStep === "audience" && (
            <div className="space-y-5">
              <div
                className="inline-flex rounded-lg p-0.5"
                style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
              >
                {([
                  { key: "group" as const, label: "เลือกกลุ่ม" },
                  { key: "manual" as const, label: "กรอกเบอร์" },
                ]).map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setAudienceMode(m.key)}
                    className="px-3 py-2 rounded-md text-[13px] font-medium transition-all cursor-pointer"
                    style={{
                      background: audienceMode === m.key ? "rgba(var(--accent-rgb),0.1)" : "transparent",
                      color: audienceMode === m.key ? "var(--accent)" : "var(--text-muted)",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {audienceMode === "group" ? (
                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                    กลุ่มผู้รับ *
                  </label>
                  <CustomSelect
                    value={draft.targetGroupId ?? ""}
                    onChange={(v) => updateDraft({ targetGroupId: v || null })}
                    options={groups.map((g) => ({ value: g.id, label: `${g.name} (${g.count} คน)` }))}
                    placeholder="เลือกกลุ่มผู้รับ..."
                  />
                  {selectedGroup && (
                    <p className="text-[12px] mt-2 flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                      <Users size={13} />
                      {selectedGroup.count.toLocaleString()} ผู้รับในกลุ่ม
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                    เบอร์โทรศัพท์ (คั่นด้วยจุลภาค หรือ ขึ้นบรรทัดใหม่)
                  </label>
                  <textarea
                    value={manualPhones}
                    onChange={(e) => setManualPhones(e.target.value)}
                    rows={5}
                    placeholder={"0812345678\n0898765432\n0651234567"}
                    className={`${inputCls} resize-none font-mono text-[13px]`}
                  />
                  <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>
                    {manualPhones.split(/[,\n]/).filter((p) => p.trim().length > 0).length} เบอร์
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Message */}
          {currentStep === "message" && (
            <div className="space-y-5">
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                  เทมเพลต (ไม่บังคับ)
                </label>
                <CustomSelect
                  value={draft.templateId ?? ""}
                  onChange={(v) => {
                    updateDraft({ templateId: v || null });
                    const tpl = templates.find((t) => t.id === v);
                    if (tpl) updateDraft({ message: tpl.body });
                  }}
                  options={[
                    { value: "", label: "— ไม่ใช้เทมเพลต —" },
                    ...templates.map((t) => ({ value: t.id, label: t.name })),
                  ]}
                  placeholder="เลือกเทมเพลต..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    ข้อความ *
                  </label>
                  {/* Variable insertion */}
                  <div className="flex items-center gap-1">
                    {VARIABLES.map((v) => (
                      <button
                        key={v.token}
                        type="button"
                        onClick={() => updateDraft({ message: draft.message + v.token })}
                        className="px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer"
                        style={{
                          color: "var(--accent)",
                          background: "rgba(var(--accent-rgb),0.08)",
                          border: "1px solid rgba(var(--accent-rgb),0.15)",
                        }}
                        title={v.label}
                      >
                        {v.token}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={draft.message}
                  onChange={(e) => updateDraft({ message: e.target.value })}
                  rows={5}
                  placeholder="พิมพ์ข้อความ SMS ที่นี่..."
                  className={`${inputCls} resize-none`}
                />
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-[11px]" style={{ color: seg.chars > 160 ? "var(--warning)" : "var(--text-muted)" }}>
                    {seg.chars} ตัวอักษร · {seg.segments} segment{seg.segments > 1 ? "s" : ""}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    limit: {seg.limit}
                  </p>
                </div>
              </div>

              {/* SMS Preview */}
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                  ตัวอย่าง SMS
                </label>
                <div
                  className="relative mx-auto w-[260px] rounded-[24px] p-3 pt-8"
                  style={{
                    background: "var(--bg-base)",
                    border: "2px solid var(--border-default)",
                  }}
                >
                  {/* Phone notch */}
                  <div
                    className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full"
                    style={{ background: "var(--border-default)" }}
                  />
                  {/* Sender */}
                  <p className="text-[11px] font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                    {draft.senderName || "SMSOK"}
                  </p>
                  {/* Message bubble */}
                  <div
                    className="rounded-lg p-3"
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-default)",
                    }}
                  >
                    <p className="text-[13px] whitespace-pre-wrap break-words" style={{ color: "var(--text-primary)" }}>
                      {draft.message || "ข้อความจะแสดงที่นี่..."}
                    </p>
                  </div>
                  {/* Footer */}
                  <p className="text-[10px] text-center mt-2" style={{ color: "var(--text-muted)" }}>
                    <Smartphone size={10} className="inline mr-1" />
                    SMS Preview
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Schedule */}
          {currentStep === "schedule" && (
            <div className="space-y-5">
              <div
                className="inline-flex rounded-lg p-0.5"
                style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
              >
                {([
                  { key: false, label: "ส่งทันที" },
                  { key: true, label: "ตั้งเวลา" },
                ] as const).map((m) => (
                  <button
                    key={String(m.key)}
                    onClick={() => updateDraft({ scheduled: m.key })}
                    className="px-4 py-2 rounded-md text-[13px] font-medium transition-all cursor-pointer"
                    style={{
                      background: draft.scheduled === m.key ? "rgba(var(--accent-rgb),0.1)" : "transparent",
                      color: draft.scheduled === m.key ? "var(--accent)" : "var(--text-muted)",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {draft.scheduled && (
                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                    วันและเวลาส่ง *
                  </label>
                  <Input
                    type="datetime-local"
                    value={draft.scheduleDate ?? ""}
                    onChange={(e) => updateDraft({ scheduleDate: e.target.value })}
                    className={inputCls}
                    min={new Date().toISOString().slice(0, 16)}
                    style={{ colorScheme: "dark" }}
                  />
                  <SendingHoursWarning />
                </div>
              )}

              {!draft.scheduled && (
                <div
                  className="p-4 rounded-lg"
                  style={{
                    background: "rgba(var(--accent-rgb),0.04)",
                    border: "1px solid rgba(var(--accent-rgb),0.12)",
                  }}
                >
                  <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                    <Send size={14} className="inline mr-1.5" style={{ color: "var(--accent)" }} />
                    แคมเปญจะถูกส่งทันทีหลังจากยืนยัน
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === "review" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                ตรวจสอบก่อนส่ง
              </h3>

              {[
                { label: "ชื่อแคมเปญ", value: draft.name },
                { label: "ผู้ส่ง", value: draft.senderName },
                {
                  label: "ผู้รับ",
                  value: audienceMode === "group"
                    ? selectedGroup
                      ? `${selectedGroup.name} (${selectedGroup.count} คน)`
                      : "ไม่ได้เลือก"
                    : `${manualPhones.split(/[,\n]/).filter((p) => p.trim()).length} เบอร์`,
                },
                { label: "เทมเพลต", value: selectedTemplate?.name ?? "ไม่ใช้เทมเพลต" },
                { label: "ข้อความ", value: `${seg.chars} ตัวอักษร · ${seg.segments} segment(s)` },
                { label: "การส่ง", value: draft.scheduled ? `ตั้งเวลา: ${draft.scheduleDate}` : "ส่งทันที" },
                {
                  label: "ค่าใช้จ่ายโดยประมาณ",
                  value: `${seg.segments * (audienceMode === "group" ? (selectedGroup?.count ?? 0) : manualPhones.split(/[,\n]/).filter((p) => p.trim()).length)} SMS`,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start justify-between py-2.5"
                  style={{ borderBottom: "1px solid var(--border-default)" }}
                >
                  <span className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
                    {item.label}
                  </span>
                  <span className="text-[13px] text-right max-w-[300px]" style={{ color: "var(--text-primary)" }}>
                    {item.value}
                  </span>
                </div>
              ))}

              {/* Message preview */}
              <div
                className="p-3 rounded-lg"
                style={{
                  background: "var(--bg-base)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <p className="text-[11px] font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                  ข้อความ:
                </p>
                <p className="text-[13px] whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
                  {draft.message}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-default)]">
          <div>
            {currentIdx > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={prevStep}
                className="text-[13px] cursor-pointer"
                style={{ color: "var(--text-secondary)" }}
              >
                <ArrowLeft size={14} className="mr-1" />
                ย้อนกลับ
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="text-[13px] cursor-pointer"
              style={{ color: "var(--text-muted)" }}
            >
              ยกเลิก
            </Button>
            {currentStep === "review" ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="text-[13px] font-semibold cursor-pointer"
                style={{
                  background: "var(--accent)",
                  color: "var(--bg-base)",
                }}
              >
                {submitting ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={14} className="animate-spin" />
                    กำลังสร้าง...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Send size={14} />
                    {draft.scheduled ? "ตั้งเวลาส่ง" : "ส่งทันที"}
                  </span>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!isStepValid(currentStep)}
                className="text-[13px] font-semibold cursor-pointer"
                style={{
                  background: isStepValid(currentStep) ? "var(--accent)" : undefined,
                  color: isStepValid(currentStep) ? "var(--bg-base)" : undefined,
                }}
              >
                ถัดไป
                <ArrowRight size={14} className="ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
