"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  User,
  Building2,
  Check,
  Loader2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import type { CustomerType, BranchType } from "@/types/order";
import { formatBaht } from "@/types/purchase";

// ── Tax ID helpers ──

function formatTaxId(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 1) return digits;
  const parts: string[] = [];
  if (digits.length > 0) parts.push(digits.slice(0, 1));
  if (digits.length > 1) parts.push(digits.slice(1, 5));
  if (digits.length > 5) parts.push(digits.slice(5, 10));
  if (digits.length > 10) parts.push(digits.slice(10, 12));
  if (digits.length > 12) parts.push(digits.slice(12, 13));
  return parts.join("-");
}

function unformatTaxId(formatted: string): string {
  return formatted.replace(/\D/g, "");
}

function validateTaxIdChecksum(digits: string): boolean {
  if (digits.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(digits[i]) * (13 - i);
  }
  const check = (11 - (sum % 11)) % 10;
  return check === Number(digits[12]);
}

// ── Main Tax Profile Page ──

export default function TaxProfilePage() {
  const [customerType, setCustomerType] = useState<CustomerType>("INDIVIDUAL");

  // Individual fields
  const [fullName, setFullName] = useState("");
  const [idCard, setIdCard] = useState("");

  // Company fields
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [branchType, setBranchType] = useState<BranchType>("HEAD");
  const [branchNumber, setBranchNumber] = useState("");
  const [vatRegistered, setVatRegistered] = useState(false);
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Shared fields
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // WHT
  const [whtEnabled, setWhtEnabled] = useState(false);

  // UI state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Tax ID validation
  const currentTaxIdRaw =
    customerType === "COMPANY"
      ? unformatTaxId(taxId)
      : unformatTaxId(idCard);
  const taxIdValid =
    currentTaxIdRaw.length === 13 &&
    validateTaxIdChecksum(currentTaxIdRaw);
  const taxIdPartial =
    currentTaxIdRaw.length > 0 && currentTaxIdRaw.length < 13;

  // Load existing profile
  const loadProfile = useCallback(async () => {
    if (loaded) return;
    try {
      const res = await fetch("/api/v1/settings/tax-profile", {
        credentials: "include",
      });
      if (res.ok) {
        const json = await res.json();
        const tp = json?.data?.taxProfile ?? json?.taxProfile ?? json;
        if (tp && tp.companyName) {
          // Discriminate individual vs company by branch marker
          const isIndividual = tp.branch === "INDIVIDUAL";

          if (isIndividual) {
            setCustomerType("INDIVIDUAL");
            setFullName(tp.companyName || "");
            setIdCard(tp.taxId ? formatTaxId(tp.taxId) : "");
          } else {
            setCustomerType("COMPANY");
            setCompanyName(tp.companyName || "");
            setTaxId(tp.taxId ? formatTaxId(tp.taxId) : "");
            const isHq =
              !tp.branch ||
              tp.branch === "สำนักงานใหญ่" ||
              tp.branch === "00000";
            setBranchType(isHq ? "HEAD" : "BRANCH");
            if (!isHq) setBranchNumber(tp.branchCode || "");
            setVatRegistered(tp.vat_registered ?? false);
            setContactPerson(tp.contactPerson || "");
            setContactPhone(tp.phone || "");
            setContactEmail(tp.email || "");
            setWhtEnabled(tp.wht_enabled ?? false);
          }
          setAddress(tp.address || "");
          setPhone(tp.phone || "");
          setEmail(tp.email || "");
        }
      }
    } catch {
      // No existing profile
    }
    setLoaded(true);
  }, [loaded]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Handle save
  async function handleSave() {
    setError(null);
    setSaved(false);

    // Validate
    if (customerType === "INDIVIDUAL") {
      if (!fullName.trim()) {
        setError("กรุณากรอกชื่อ-นามสกุล");
        return;
      }
      if (unformatTaxId(idCard).length !== 13) {
        setError("กรุณากรอกเลขบัตรประชาชนให้ครบ 13 หลัก");
        return;
      }
    } else {
      if (!companyName.trim()) {
        setError("กรุณากรอกชื่อบริษัท");
        return;
      }
      if (unformatTaxId(taxId).length !== 13) {
        setError("กรุณากรอก Tax ID ให้ครบ 13 หลัก");
        return;
      }
    }
    if (!address.trim()) {
      setError("กรุณากรอกที่อยู่");
      return;
    }

    setSaving(true);
    try {
      // Backend schema: { companyName, taxId, branch, branchCode, address, contactPerson?, phone?, email? }
      // Individual uses branch="INDIVIDUAL" as discriminator for round-trip
      const isIndividual = customerType === "INDIVIDUAL";
      const payload: Record<string, unknown> = {
        companyName: isIndividual ? fullName.trim() : companyName.trim(),
        taxId: isIndividual ? unformatTaxId(idCard) : unformatTaxId(taxId),
        branch: isIndividual
          ? "INDIVIDUAL"
          : branchType === "BRANCH"
            ? `สาขา ${branchNumber.padStart(5, "0")}`
            : "สำนักงานใหญ่",
        branchCode: isIndividual
          ? "00000"
          : branchType === "BRANCH"
            ? branchNumber.padStart(5, "0")
            : "00000",
        address: address.trim(),
        contactPerson: isIndividual ? undefined : contactPerson.trim() || undefined,
        phone: (isIndividual ? phone.trim() : contactPhone.trim()) || undefined,
        email: (isIndividual ? email.trim() : contactEmail.trim()) || undefined,
      };

      const res = await fetch("/api/v1/settings/tax-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "บันทึกไม่สำเร็จ");
      }

      setSaved(true);
      toast.success("บันทึกข้อมูลภาษีสำเร็จ");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl animate-fade-in-up">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-1 text-xs mb-3 transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={14} />
          ตั้งค่า
        </Link>
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          ข้อมูลภาษี
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          ตั้งค่าข้อมูลผู้เสียภาษีสำหรับออกเอกสารทางบัญชี
        </p>
      </div>

      {/* Account Type Selector */}
      <div className="mb-6">
        <p
          className="text-sm font-medium mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          ประเภทบัญชี
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(
            [
              {
                type: "INDIVIDUAL" as CustomerType,
                icon: User,
                title: "บุคคลธรรมดา",
                subtitle: "Individual",
                feature: "ออกใบเสร็จรับเงิน",
              },
              {
                type: "COMPANY" as CustomerType,
                icon: Building2,
                title: "นิติบุคคล",
                subtitle: "Company / Corporation",
                feature: "ออกใบกำกับภาษี · WHT 3% deduction",
              },
            ] as const
          ).map((opt) => {
            const isSelected = customerType === opt.type;
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => setCustomerType(opt.type)}
                className="relative rounded-lg p-6 text-left transition-all"
                style={{
                  background: isSelected
                    ? "rgba(var(--accent-rgb), 0.02)"
                    : "var(--bg-surface)",
                  border: isSelected
                    ? "2px solid var(--accent)"
                    : "1px solid var(--border-default)",
                }}
              >
                {/* Radio dot */}
                <div
                  className="absolute top-4 right-4 w-[18px] h-[18px] rounded-full flex items-center justify-center"
                  style={{
                    border: isSelected
                      ? "2px solid var(--accent)"
                      : "2px solid var(--border-default)",
                  }}
                >
                  {isSelected && (
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: "var(--accent)" }}
                    />
                  )}
                </div>

                <opt.icon
                  size={24}
                  className="mb-3"
                  style={{
                    color: isSelected
                      ? "var(--accent)"
                      : "var(--text-muted)",
                  }}
                />
                <p
                  className="text-base font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {opt.title}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {opt.subtitle}
                </p>
                <p
                  className="text-xs mt-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  {opt.feature}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Section */}
      <div
        className="rounded-lg p-6 space-y-5 mb-6"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
        }}
      >
        <h3
          className="text-base font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {customerType === "COMPANY"
            ? "ข้อมูลนิติบุคคล"
            : "ข้อมูลบุคคลธรรมดา"}
        </h3>

        {customerType === "INDIVIDUAL" ? (
          <>
            {/* Individual Form */}
            <div>
              <Label className="text-xs" style={{ color: "var(--text-muted)" }}>
                ชื่อ-นามสกุล <span style={{ color: "var(--error)" }}>*</span>
              </Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="สมชาย กรุงเทพมหานคร"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs" style={{ color: "var(--text-muted)" }}>
                เลขบัตรประชาชน{" "}
                <span style={{ color: "var(--error)" }}>*</span>
              </Label>
              <Input
                value={idCard}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  if (digits.length <= 13) setIdCard(formatTaxId(e.target.value));
                }}
                placeholder="X-XXXX-XXXXX-XX-X"
                className="mt-1.5 font-mono tracking-wider"
              />
              {taxIdValid && (
                <p
                  className="text-xs mt-1 flex items-center gap-1"
                  style={{ color: "var(--success)" }}
                >
                  <Check size={12} /> เลขบัตรถูกต้อง
                </p>
              )}
              {taxIdPartial && (
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {currentTaxIdRaw.length}/13 หลัก
                </p>
              )}
              {currentTaxIdRaw.length === 13 && !taxIdValid && (
                <p className="text-xs mt-1" style={{ color: "var(--error)" }}>
                  เลขไม่ถูกต้อง
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Company Form */}
            <div>
              <Label className="text-xs" style={{ color: "var(--text-muted)" }}>
                ชื่อบริษัท <span style={{ color: "var(--error)" }}>*</span>
              </Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="บริษัท ABC จำกัด"
                className="mt-1.5"
              />
              <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                ต้องตรงกับข้อมูลจดทะเบียนกรมพัฒนาธุรกิจ (DBD)
              </p>
            </div>

            <div>
              <Label className="text-xs" style={{ color: "var(--text-muted)" }}>
                เลขประจำตัวผู้เสียภาษี (Tax ID){" "}
                <span style={{ color: "var(--error)" }}>*</span>
              </Label>
              <Input
                value={taxId}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  if (digits.length <= 13) setTaxId(formatTaxId(e.target.value));
                }}
                placeholder="X-XXXX-XXXXX-XX-X"
                className="mt-1.5 font-mono tracking-wider"
              />
              {taxIdValid && (
                <p
                  className="text-xs mt-1 flex items-center gap-1"
                  style={{ color: "var(--success)" }}
                >
                  <Check size={12} /> Tax ID ถูกต้อง
                </p>
              )}
              {taxIdPartial && (
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {currentTaxIdRaw.length}/13 หลัก
                </p>
              )}
              {currentTaxIdRaw.length === 13 && !taxIdValid && (
                <p className="text-xs mt-1" style={{ color: "var(--error)" }}>
                  เลขไม่ถูกต้อง
                </p>
              )}
            </div>

            {/* Branch */}
            <div>
              <Label className="text-xs mb-2 block" style={{ color: "var(--text-muted)" }}>
                สาขา <span style={{ color: "var(--error)" }}>*</span>
              </Label>
              <RadioGroup
                value={branchType}
                onValueChange={(v) => setBranchType(v as BranchType)}
                className="flex items-center gap-3"
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="HEAD" />
                  <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                    สำนักงานใหญ่ (00000)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="BRANCH" />
                  <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                    สาขาที่
                  </span>
                </label>
                {branchType === "BRANCH" && (
                  <Input
                    value={branchNumber}
                    onChange={(e) =>
                      setBranchNumber(
                        e.target.value.replace(/\D/g, "").slice(0, 5)
                      )
                    }
                    placeholder="00001"
                    className="w-24 h-8 font-mono text-center"
                  />
                )}
              </RadioGroup>
            </div>

            {/* VAT Registered */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                  จดทะเบียน VAT
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  บริษัทที่จด VAT จะได้รับใบกำกับภาษี
                </p>
              </div>
              <Switch
                checked={vatRegistered}
                onCheckedChange={setVatRegistered}
              />
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs" style={{ color: "var(--text-muted)" }}>
                  ชื่อผู้ติดต่อ <span style={{ color: "var(--error)" }}>*</span>
                </Label>
                <Input
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="สมศรี"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-xs" style={{ color: "var(--text-muted)" }}>
                  เบอร์โทร <span style={{ color: "var(--error)" }}>*</span>
                </Label>
                <Input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="081-234-5678"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-xs" style={{ color: "var(--text-muted)" }}>
                  อีเมล <span style={{ color: "var(--error)" }}>*</span>
                </Label>
                <Input
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="finance@abc.co.th"
                  className="mt-1.5"
                />
              </div>
            </div>
          </>
        )}

        {/* Shared: Address */}
        <div>
          <Label className="text-xs" style={{ color: "var(--text-muted)" }}>
            {customerType === "COMPANY" ? "ที่อยู่จดทะเบียน" : "ที่อยู่"}{" "}
            <span style={{ color: "var(--error)" }}>*</span>
          </Label>
          <Textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123/45 ถนนสีลม แขวงสุริยวงศ์ เขตบางรัก กรุงเทพฯ 10500"
            className="mt-1.5 min-h-[80px]"
          />
          {customerType === "COMPANY" && (
            <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
              ต้องตรงกับที่อยู่ที่จดทะเบียนกรมสรรพากร
            </p>
          )}
        </div>

        {/* Shared: Contact (Individual) */}
        {customerType === "INDIVIDUAL" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs" style={{ color: "var(--text-muted)" }}>
                เบอร์โทร <span style={{ color: "var(--error)" }}>*</span>
              </Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081-234-5678"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs" style={{ color: "var(--text-muted)" }}>
                อีเมล <span style={{ color: "var(--error)" }}>*</span>
              </Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="mt-1.5"
              />
            </div>
          </div>
        )}
      </div>

      {/* WHT Section (Company only) */}
      {customerType === "COMPANY" && (
        <div
          className="rounded-lg p-6 mb-6"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                หักภาษี ณ ที่จ่าย 3%
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                บริษัทของคุณหักภาษี ณ ที่จ่าย 3% เมื่อชำระเงิน
              </p>
            </div>
            <Switch checked={whtEnabled} onCheckedChange={setWhtEnabled} />
          </div>

          {whtEnabled && (
            <div
              className="rounded-lg p-5"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
              }}
            >
              <p
                className="text-sm font-semibold mb-3 flex items-center gap-2"
                style={{ color: "var(--text-primary)" }}
              >
                💡 ตัวอย่างการคำนวณ
              </p>
              <div className="space-y-1.5 text-[13px]">
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-muted)" }}>ค่าบริการ</span>
                  <span
                    className="font-mono tabular-nums"
                    style={{ color: "var(--text-primary)" }}
                  >
                    ฿10,000.00
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-muted)" }}>VAT 7%</span>
                  <span
                    className="font-mono tabular-nums"
                    style={{ color: "var(--text-primary)" }}
                  >
                    ฿700.00
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-muted)" }}>รวม</span>
                  <span
                    className="font-mono tabular-nums"
                    style={{ color: "var(--text-primary)" }}
                  >
                    ฿10,700.00
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--error)" }}>
                    หัก WHT 3% (ของ 10,000)
                  </span>
                  <span
                    className="font-mono tabular-nums"
                    style={{ color: "var(--error)" }}
                  >
                    -฿300.00
                  </span>
                </div>
                <div
                  className="flex justify-between pt-2 mt-1"
                  style={{ borderTop: "1px dashed var(--border-default)" }}
                >
                  <span
                    className="font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    ยอดชำระจริง
                  </span>
                  <span
                    className="font-semibold font-mono tabular-nums"
                    style={{ color: "var(--accent)" }}
                  >
                    ฿10,400.00
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <AlertTriangle size={12} style={{ color: "var(--warning)" }} />
                <p className="text-xs" style={{ color: "var(--warning)" }}>
                  ต้องอัพโหลดใบหัก ณ ที่จ่าย (50 ทวิ) ทุกครั้ง
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-2 text-sm rounded-lg px-3 py-2 mb-4"
          style={{
            color: "var(--error)",
            background: "var(--danger-bg)",
            border: "1px solid rgba(var(--error-rgb), 0.1)",
          }}
        >
          <XCircle size={14} />
          {error}
        </div>
      )}

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-11 px-8 gap-2"
          style={{
            background: "var(--accent)",
            color: "var(--text-on-accent)",
          }}
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              กำลังบันทึก...
            </>
          ) : saved ? (
            <>
              <Check size={14} />
              บันทึกแล้ว
            </>
          ) : (
            "บันทึก"
          )}
        </Button>
      </div>
    </div>
  );
}
