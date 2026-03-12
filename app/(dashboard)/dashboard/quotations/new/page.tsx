"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, Plus, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* ─── Types ─── */

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

/* ─── Helpers ─── */

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function createEmptyItem(): LineItem {
  return { id: generateId(), description: "", quantity: 1, unitPrice: 0 };
}

/* ─── Main Component ─── */

export default function NewQuotationPage() {
  const router = useRouter();

  // Customer info
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");

  // Line items
  const [items, setItems] = useState<LineItem[]>([createEmptyItem()]);

  // Summary
  const [vatRate, setVatRate] = useState(7);
  const [validDays, setValidDays] = useState(30);
  const [notes, setNotes] = useState("");

  // State
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;

  const updateItem = useCallback((id: string, field: keyof LineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  }, []);

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, createEmptyItem()]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((item) => item.id !== id)));
  }, []);

  const handleSave = useCallback(async (status: "DRAFT" | "SENT") => {
    if (!buyerName.trim()) {
      setError("กรุณากรอกชื่อลูกค้า");
      return;
    }

    const validItems = items.filter((item) => item.description.trim());
    if (validItems.length === 0) {
      setError("กรุณาเพิ่มรายการอย่างน้อย 1 รายการ");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName: buyerName.trim(),
          buyerEmail: buyerEmail.trim(),
          buyerAddress: buyerAddress.trim(),
          items: validItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
          })),
          vatRate,
          validDays,
          notes: notes.trim() || null,
          status,
        }),
      });

      if (!res.ok) throw new Error("บันทึกไม่สำเร็จ");
      router.push("/dashboard/quotations");
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }, [buyerName, buyerEmail, buyerAddress, items, vatRate, validDays, notes, router]);

  return (
    <div className="px-8 py-6 max-md:px-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/quotations">
          <button
            type="button"
            className="w-9 h-9 rounded-xl border border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">สร้างใบเสนอราคา</h1>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-[var(--danger-bg)] border border-[rgba(242,54,69,0.2)] text-sm text-[var(--error)]">
          {error}
        </div>
      )}

      {/* Customer Info Card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5 mb-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">ข้อมูลลูกค้า</h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              ชื่อลูกค้า <span className="text-[var(--error)]">*</span>
            </label>
            <Input
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="ชื่อบริษัทหรือบุคคล"
              className="bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              อีเมล
            </label>
            <Input
              type="email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              placeholder="email@example.com"
              className="bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              ที่อยู่
            </label>
            <textarea
              value={buyerAddress}
              onChange={(e) => setBuyerAddress(e.target.value)}
              placeholder="ที่อยู่สำหรับออกใบเสนอราคา"
              rows={3}
              className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-[var(--text-primary)] px-3 py-2 text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-none"
            />
          </div>
        </div>
      </div>

      {/* Line Items Card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5 mb-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">รายการ</h2>

        {/* Items Header */}
        <div className="grid grid-cols-[1fr_80px_100px_90px_36px] gap-3 mb-2 px-1">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">รายการ</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">จำนวน</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">ราคาต่อหน่วย</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">รวม</span>
          <span />
        </div>

        {/* Items Rows */}
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-[1fr_80px_100px_90px_36px] gap-3 mb-2 items-center">
            <Input
              value={item.description}
              onChange={(e) => updateItem(item.id, "description", e.target.value)}
              placeholder="รายละเอียด"
              className="bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]"
            />
            <Input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value) || 0)}
              className="bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] text-right"
            />
            <Input
              type="number"
              min={0}
              step={0.01}
              value={item.unitPrice}
              onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value) || 0)}
              className="bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] text-right"
            />
            <span className="text-sm text-[var(--text-primary)] text-right tabular-nums font-medium">
              ฿{(item.quantity * item.unitPrice).toFixed(2)}
            </span>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              disabled={items.length <= 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--error)] disabled:opacity-30 transition-colors cursor-pointer"
              title="ลบรายการ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addItem}
          className="mt-2 flex items-center gap-1.5 text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          เพิ่มรายการ
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">สรุป</h2>

        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-secondary)]">ยอดรวมก่อน VAT</span>
            <span className="text-sm text-[var(--text-primary)] tabular-nums">฿{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-secondary)]">VAT {vatRate}%</span>
            <span className="text-sm text-[var(--text-primary)] tabular-nums">฿{vatAmount.toFixed(2)}</span>
          </div>
          <div className="h-px bg-[var(--border-default)]" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--text-primary)]">ยอดรวมทั้งหมด</span>
            <span className="text-lg font-bold text-[var(--text-primary)] tabular-nums">฿{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                อัตรา VAT (%)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={vatRate}
                onChange={(e) => setVatRate(Number(e.target.value) || 0)}
                className="bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                ใช้ได้ภายใน (วัน)
              </label>
              <Input
                type="number"
                min={1}
                value={validDays}
                onChange={(e) => setValidDays(Number(e.target.value) || 30)}
                className="bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              หมายเหตุ
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
              rows={3}
              className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-[var(--text-primary)] px-3 py-2 text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-none"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Link href="/dashboard/quotations">
          <Button variant="outline" className="cursor-pointer">
            ยกเลิก
          </Button>
        </Link>
        <Button
          variant="secondary"
          onClick={() => handleSave("DRAFT")}
          disabled={saving}
          className="cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
          บันทึกร่าง
        </Button>
        <Button
          onClick={() => handleSave("SENT")}
          disabled={saving}
          className="cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
          ส่งใบเสนอราคา
        </Button>
      </div>
    </div>
  );
}
