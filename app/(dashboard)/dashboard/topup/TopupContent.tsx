"use client";

import { useState, useRef } from "react";
import { Coins, Upload, CreditCard, Building2, QrCode, ChevronRight, Copy, Check, Loader2, ArrowRight, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { safeErrorMessage } from "@/lib/error-messages";

type Package = {
  id?: string;
  name: string;
  price: number;
  bonusPercent: number;
  totalCredits: number;
  maxSenders?: number;
  durationDays: number;
  isBestSeller?: boolean;
};

type User = {
  id: string;
  name: string;
  email: string;
  credits: number;
  role: string;
};

const QUICK_AMOUNTS = [500, 1000, 3000, 5000, 10000];

const PRICING_TIERS = [
  { name: "Starter", range: "1 - 10,000", price: "฿0.50", perSms: 0.5 },
  { name: "Growth", range: "10,001 - 50,000", price: "฿0.40", perSms: 0.4 },
  { name: "Pro", range: "50,001 - 200,000", price: "฿0.30", perSms: 0.3 },
  { name: "Enterprise", range: "200,001+", price: "ติดต่อ", perSms: 0.25 },
];

function formatPrice(satang: number): string {
  return (satang / 100).toLocaleString("th-TH");
}

function formatDuration(days: number): string {
  if (days >= 365) return `${Math.floor(days / 365)} ปี`;
  if (days >= 30) return `${Math.floor(days / 30)} เดือน`;
  return `${days} วัน`;
}

/* ── Slip Upload Section ── */
function SlipUploadSection({ userId }: { userId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File | null) {
    if (!f) return;
    setFile(f);
    setMessage(null);
    setStatus("idle");
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }

  async function handleSubmit() {
    if (!file) return;
    setStatus("loading");
    setMessage(null);
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = (e) => res((e.target?.result as string).split(",")[1] ?? "");
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const resp = await fetch("/api/topup/verify-slip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: base64 }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? "ไม่สามารถยืนยันได้");
      setStatus("success");
      setMessage("ยืนยันสำเร็จ! เครดิตถูกเพิ่มแล้ว");
      setCredits(data.creditsAdded ?? null);
    } catch (e) {
      setStatus("error");
      setMessage(safeErrorMessage(e));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="w-4 h-4 text-[var(--accent)]" />
          โอนเงิน (Bank Transfer)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bank Details */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">บัญชีรับโอน</p>
            <div className="rounded-lg bg-[var(--bg-base)] border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">ธนาคาร</span>
                <span className="text-sm font-semibold">ไทยพาณิชย์ (SCB)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">เลขบัญชี</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText("4078240476")}
                  className="text-sm font-mono font-semibold text-[var(--accent)] hover:opacity-80 transition-opacity"
                >
                  407-8-24047-6
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">ชื่อบัญชี</span>
                <span className="text-sm text-muted-foreground">นายภูมิชนะ อุดแก้ว</span>
              </div>
            </div>
          </div>

          {/* Slip Upload */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">อัพโหลดสลิป</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-lg border-2 border-dashed border-border hover:border-[var(--accent)]/30 bg-[var(--bg-base)] hover:bg-[var(--accent)]/5 transition-all cursor-pointer"
              style={{ minHeight: "120px" }}
            >
              {preview ? (
                <div className="relative">
                  {/* biome-ignore lint/a11y/useAltText: slip preview */}
                  <img src={preview} alt="slip" className="w-full h-32 object-cover rounded-lg" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 gap-2">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">คลิกหรือลากไฟล์มาวาง</span>
                  <span className="text-[10px] text-muted-foreground">PNG, JPG, WEBP — สูงสุด 10MB</span>
                </div>
              )}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />

            <Button
              onClick={handleSubmit}
              disabled={!file || status === "loading" || status === "success"}
              className="w-full"
            >
              {status === "loading" ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> กำลังตรวจสอบ...</>
              ) : status === "success" ? (
                <><Check className="w-4 h-4" /> ยืนยันแล้ว</>
              ) : (
                <>ยืนยันการโอน <ArrowRight className="w-4 h-4" /></>
              )}
            </Button>

            {message && (
              <div className={`rounded-lg px-4 py-3 text-sm border ${
                status === "success"
                  ? "bg-[var(--success)]/10 border-[var(--success)]/20 text-[var(--success)]"
                  : "bg-[var(--error)]/10 border-[var(--error)]/20 text-[var(--error)]"
              }`}>
                {status === "success" && credits !== null && (
                  <span className="block text-xs mb-0.5">เครดิตใหม่: {credits.toLocaleString()}</span>
                )}
                {message}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TopupContent({ user, packages }: { user: User; packages: Package[] }) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [autoTopup, setAutoTopup] = useState(false);

  const currentRate = 0.5; // ฿ per SMS (starter tier)
  const estimatedSms = Math.floor(user.credits / currentRate);

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/15 flex items-center justify-center">
            <Coins className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold">เติมเครดิต</h1>
            <p className="text-sm text-muted-foreground">จัดการยอดเงินและเติมเครดิตสำหรับส่ง SMS</p>
          </div>
        </div>
      </div>

      {/* Balance Card (Hero) */}
      <Card className="border-[var(--accent)]/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/15 flex items-center justify-center">
                <Coins className="w-7 h-7 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">เครดิตคงเหลือ</p>
                <p className="text-3xl font-bold text-[var(--accent)]">฿{user.credits.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xs text-muted-foreground">ประมาณ</p>
              <p className="text-lg font-semibold">{estimatedSms.toLocaleString()} SMS</p>
              <p className="text-[10px] text-muted-foreground">ที่อัตรา ฿{currentRate}/SMS</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Top-up */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="w-4 h-4 text-[var(--accent)]" />
            เติมเงินด่วน
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {QUICK_AMOUNTS.map((amount) => (
              <Button
                key={amount}
                variant={selectedAmount === amount ? "default" : "outline"}
                className="h-12"
                onClick={() => { setSelectedAmount(amount); setCustomAmount(""); }}
              >
                ฿{amount.toLocaleString()}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="จำนวนเงินอื่น (ขั้นต่ำ ฿100)"
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                min={100}
              />
            </div>
            <Button disabled={!selectedAmount && !customAmount}>
              ดำเนินการ <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-[var(--accent)]/30 transition-colors">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
              <QrCode className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-sm font-semibold">PromptPay QR</p>
              <p className="text-xs text-muted-foreground">สแกนจ่ายทันที</p>
            </div>
            <Badge className="ml-auto">แนะนำ</Badge>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-[var(--accent)]/30 transition-colors">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent-secondary)]/10 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-[var(--accent-secondary)]" />
            </div>
            <div>
              <p className="text-sm font-semibold">บัตรเครดิต/เดบิต</p>
              <p className="text-xs text-muted-foreground">Visa, Mastercard</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-[var(--accent)]/30 transition-colors">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent-warm)]/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-[var(--accent-warm)]" />
            </div>
            <div>
              <p className="text-sm font-semibold">โอนเงิน</p>
              <p className="text-xs text-muted-foreground">แนบสลิปยืนยัน</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank Transfer / Slip Upload */}
      <SlipUploadSection userId={user.id} />

      {/* Pricing Tiers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">อัตราค่าบริการ</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ระดับ</TableHead>
                <TableHead>จำนวน SMS</TableHead>
                <TableHead>ราคาต่อ SMS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PRICING_TIERS.map((tier) => (
                <TableRow key={tier.name}>
                  <TableCell className="font-semibold">{tier.name}</TableCell>
                  <TableCell className="text-muted-foreground">{tier.range}</TableCell>
                  <TableCell>
                    <Badge variant={tier.name === "Pro" ? "default" : "secondary"}>
                      {tier.price}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground mt-3">ราคารวม VAT 7%</p>
        </CardContent>
      </Card>

      {/* Auto Top-up */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="w-4 h-4 text-[var(--accent)]" />
              เติมเงินอัตโนมัติ
            </CardTitle>
            <Switch checked={autoTopup} onCheckedChange={setAutoTopup} />
          </div>
        </CardHeader>
        {autoTopup && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">
                  เติมเมื่อเหลือต่ำกว่า (฿)
                </label>
                <Input type="number" placeholder="500" min={100} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">
                  เติมครั้งละ (฿)
                </label>
                <Input type="number" placeholder="1000" min={100} />
              </div>
            </div>
            <Button variant="outline" className="w-full sm:w-auto">
              บันทึกการตั้งค่า
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Credit Packages */}
      {packages.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-4">แพ็กเกจเครดิต</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {packages.map((pkg, i) => (
              <Card
                key={pkg.id ?? i}
                className={pkg.isBestSeller ? "border-[var(--accent)]/30" : ""}
              >
                <CardContent className="p-5 flex flex-col h-full">
                  {pkg.isBestSeller && (
                    <Badge className="w-fit mb-3">BEST SELLER</Badge>
                  )}
                  <h3 className="text-lg font-bold mb-1">{pkg.name}</h3>
                  <p className="text-2xl font-bold text-[var(--accent)] mb-4">฿{formatPrice(pkg.price)}</p>
                  <div className="space-y-2 mb-4 flex-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">เครดิต</span>
                      <span className="font-semibold">{pkg.totalCredits.toLocaleString()}</span>
                    </div>
                    {pkg.bonusPercent > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">โบนัส</span>
                        <span className="text-[var(--success)] font-semibold">+{pkg.bonusPercent}%</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ระยะเวลา</span>
                      <span>{formatDuration(pkg.durationDays)}</span>
                    </div>
                  </div>
                  <Button variant={pkg.isBestSeller ? "default" : "outline"} className="w-full">
                    ซื้อแพ็กเกจ <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Credit Rate Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">การคิดเครดิต</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">ส่ง SMS</p>
              <div className="flex justify-between"><span className="text-muted-foreground">EN ≤160 ตัวอักษร</span><span className="text-[var(--accent-warm)]">1 เครดิต</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">EN 161-320 ตัวอักษร</span><span className="text-[var(--accent-warm)]">2 เครดิต</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">ไทย ≤70 ตัวอักษร</span><span className="text-[var(--accent-warm)]">1 เครดิต</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">ไทย 71-140 ตัวอักษร</span><span className="text-[var(--accent-warm)]">2 เครดิต</span></div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">บริการอื่น</p>
              <div className="flex justify-between"><span className="text-muted-foreground">OTP SMS</span><span className="text-[var(--accent-warm)]">1 เครดิต</span></div>
              <div className="flex justify-between mt-2"><span className="text-muted-foreground">เครดิตไม่หมดอายุ</span><Badge variant="secondary">✓</Badge></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
