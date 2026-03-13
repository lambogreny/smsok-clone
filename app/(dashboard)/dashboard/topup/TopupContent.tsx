"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  Upload,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import PageLayout, {
  PageHeader,
  StatsRow,
  StatCard,
  TableWrapper,
  PaginationBar,
} from "@/components/blocks/PageLayout";
import { formatThaiDate } from "@/lib/format-thai-date";

/* ─── Types ─── */

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type TopupHistory = {
  id: string;
  date: string;
  amount: number;
  method: "bank_transfer";
  status: "success" | "pending" | "failed";
  reference: string;
};

/* ─── Types for API data ─── */

type PricingTier = { name: string; range: string; rate: number; contact?: boolean };
type BankAccount = { bank: string; number: string; name: string };
type PackageItem = { id: string; name: string; smsCredits: number; pricePerSms: number; price?: number };

/* ─── Real Data Types ─── */

type BalanceData = {
  balance: number;
  usedThisMonth: number;
  rate: number;
};

// TopupHistory items fetched from /api/v1/credits

const STATUS_CONFIG = {
  success: { label: "สำเร็จ", icon: CheckCircle2, className: "bg-[rgba(var(--success-rgb),0.08)] text-[var(--success)] border-[rgba(var(--success-rgb),0.15)]" },
  pending: { label: "รอตรวจสอบ", icon: Clock, className: "bg-[rgba(var(--warning-rgb),0.08)] text-[var(--warning)] border-[rgba(var(--warning-rgb),0.15)]" },
  failed: { label: "ล้มเหลว", icon: XCircle, className: "bg-[rgba(var(--error-rgb),0.08)] text-[var(--error)] border-[rgba(var(--error-rgb),0.15)]" },
};

/* ─── Main Component ─── */

export default function TopupContent({
  smsRemaining = 0,
}: {
  user: User;
  packages?: Array<unknown>;
  smsRemaining?: number;
}) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Real data state
  const [balanceData, setBalanceData] = useState<BalanceData>({ balance: 0, usedThisMonth: 0, rate: 0 });
  const [history, setHistory] = useState<TopupHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // API-fetched config (no hardcoded data)
  const [availablePackages, setAvailablePackages] = useState<PackageItem[]>([]);
  const [presetAmounts, setPresetAmounts] = useState<number[]>([]);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);

  // History pagination
  const [historyPage, setHistoryPage] = useState(1);
  const perPage = 20;
  const totalHistory = history.length;
  const totalPages = Math.max(1, Math.ceil(totalHistory / perPage));

  // Fetch real data from API
  const fetchData = useCallback(async () => {
    setFetchError(null);
    try {
      // Fetch credits, packages, and bank account in parallel
      const [creditsRes, packagesRes, bankRes] = await Promise.allSettled([
        fetch("/api/v1/credits"),
        fetch("/api/v1/packages"),
        fetch("/api/v1/payments/bank-account"),
      ]);

      // Credits
      if (creditsRes.status === "fulfilled" && creditsRes.value.ok) {
        const raw = await creditsRes.value.json();
        const data = raw.data ?? raw;
        const b = data.balance;
        if (b) {
          setBalanceData({
            balance: b.remainingCredits ?? 0,
            usedThisMonth: b.usedCredits ?? 0,
            rate: data.rate ?? 0,
          });
        }
        const hist = (data.history ?? [])
          .filter((h: { status: string }) => h.status === "ACTIVE" || h.status === "EXPIRED")
          .map((h: { id: string; purchasedAt: string; packageName: string; status: string; smsTotal: number; pricePaid?: number }) => ({
            id: h.id,
            date: formatThaiDate(h.purchasedAt),
            amount: h.pricePaid ?? h.smsTotal ?? 0,
            method: "bank_transfer" as const,
            status: "success" as const,
            reference: h.packageName,
          }));
        setHistory(hist);
      }

      // Packages → preset amounts + pricing tiers + full package data
      if (packagesRes.status === "fulfilled" && packagesRes.value.ok) {
        const pkgData = await packagesRes.value.json();
        const pkgs = pkgData.data ?? pkgData.packages ?? pkgData.tiers ?? [];
        if (Array.isArray(pkgs) && pkgs.length > 0) {
          setAvailablePackages(pkgs.map((p: { id: string; name: string; smsCredits: number; pricePerSms: number; price?: number }) => ({
            id: p.id,
            name: p.name,
            smsCredits: p.smsCredits,
            pricePerSms: p.pricePerSms,
            price: p.price,
          })));
          setPresetAmounts(pkgs.map((p: { smsCredits: number }) => p.smsCredits));
          setPricingTiers(pkgs.map((p: { name: string; smsCredits: number; pricePerSms: number }) => ({
            name: p.name,
            range: `${p.smsCredits.toLocaleString()} SMS`,
            rate: p.pricePerSms,
          })));
        }
      }

      // Bank account
      if (bankRes.status === "fulfilled" && bankRes.value.ok) {
        const bankData = await bankRes.value.json();
        const bank = bankData.data ?? bankData;
        if (bank?.bankName || bank?.bank) {
          setBankAccount({
            bank: bank.bankName ?? bank.bank,
            number: bank.accountNumber ?? bank.number,
            name: bank.accountName ?? bank.name,
          });
        }
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activeAmount = selectedAmount ?? (customAmount ? Number(customAmount) : 0);
  const lowSms = balanceData.balance < 500;

  function handlePreset(amount: number) {
    setSelectedAmount(amount);
    setCustomAmount("");
    // Find matching package for this amount
    const pkg = availablePackages.find((p) => p.smsCredits === amount);
    setSelectedPackageId(pkg?.id ?? null);
  }

  function handleCustomChange(value: string) {
    setCustomAmount(value);
    setSelectedAmount(null);
    setSelectedPackageId(null);
  }

  function handleCopyAccount() {
    if (!bankAccount) return;
    navigator.clipboard.writeText(bankAccount.number.replace(/-/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmitSlip() {
    if (!slipFile || !selectedPackageId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const formData = new FormData();
      formData.append("slip", slipFile);
      formData.append("packageId", selectedPackageId);
      formData.append("amount", String(activeAmount));
      const res = await fetch("/api/v1/payments/topup/verify-slip", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "ส่งสลิปไม่สำเร็จ กรุณาลองอีกครั้ง");
      }
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClosePayment() {
    setPaymentOpen(false);
    setSlipFile(null);
    setSubmitted(false);
    setSubmitting(false);
    setSubmitError(null);
  }

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader title="ซื้อแพ็กเกจ" description="เลือกแพ็กเกจ SMS สำหรับส่งข้อความ" />
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--text-muted)" }} />
        </div>
      </PageLayout>
    );
  }

  if (fetchError) {
    return (
      <PageLayout>
        <PageHeader title="ซื้อแพ็กเกจ" description="เลือกแพ็กเกจ SMS สำหรับส่งข้อความ" />
        <div className="flex flex-col items-center justify-center h-40 gap-2">
          <p className="text-sm text-[var(--error)]">{fetchError}</p>
          <button onClick={fetchData} className="text-xs text-[var(--accent)] hover:underline cursor-pointer">ลองอีกครั้ง</button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="ซื้อแพ็กเกจ"
        description="เลือกแพ็กเกจ SMS สำหรับส่งข้อความ"
      />

      {/* ─── SMS Quota Stats ─── */}
      <StatsRow columns={3}>
        <StatCard
          icon={<Package className="w-5 h-5 text-[var(--accent)]" />}
          iconColor="var(--accent-rgb)"
          value={`${balanceData.balance.toLocaleString()} SMS`}
          label="ข้อความคงเหลือ"
          delta={lowSms ? "เหลือน้อย" : undefined}
          deltaType={lowSms ? "negative" : "positive"}
        />
        <StatCard
          icon={<MessageSquare className="w-5 h-5 text-[var(--info)]" />}
          iconColor="var(--info-rgb)"
          value={`${smsRemaining.toLocaleString()}`}
          label="โควต้าทั้งหมด"
          subtitle="จากแพ็กเกจที่ใช้งานอยู่"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-[var(--warning)]" />}
          iconColor="var(--warning-rgb)"
          value={`${balanceData.usedThisMonth.toLocaleString()} SMS`}
          label="ใช้ไปเดือนนี้"
          subtitle={`คงเหลือ ${smsRemaining.toLocaleString()} ข้อความ`}
        />
      </StatsRow>

      {/* Low SMS Warning */}
      {lowSms && (
        <div className="flex items-center gap-3 rounded-lg border border-[rgba(var(--warning-rgb),0.2)] bg-[rgba(var(--warning-rgb),0.04)] p-4 mb-5">
          <AlertTriangle className="w-5 h-5 text-[var(--warning)] shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              ข้อความใกล้หมด
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              ซื้อแพ็กเกจเพิ่มเพื่อให้บริการส่ง SMS ไม่หยุดชะงัก
            </p>
          </div>
        </div>
      )}

      {/* ─── ซื้อแพ็กเกจ ─── */}
      <section className="mb-6">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
          เลือกแพ็กเกจ
        </h3>

        {/* Preset Packages */}
        <div className="flex flex-wrap gap-3 mb-4">
          {presetAmounts.length === 0 && (
            <p className="text-sm text-[var(--text-muted)]">กำลังโหลดแพ็กเกจ...</p>
          )}
          {presetAmounts.map((amount) => {
            const isActive = selectedAmount === amount;
            return (
              <button
                key={amount}
                type="button"
                onClick={() => handlePreset(amount)}
                className={`px-5 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] border-2 border-[var(--accent)]"
                    : "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[rgba(var(--accent-rgb),0.3)] hover:bg-[rgba(var(--accent-rgb),0.02)]"
                }`}
              >
                {amount.toLocaleString()} SMS
              </button>
            );
          })}
        </div>

        {/* Custom Amount */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-[280px]">
            <Input
              type="number"
              placeholder="กรอกจำนวน SMS เอง (ขั้นต่ำ 100)"
              value={customAmount}
              onChange={(e) => handleCustomChange(e.target.value)}
              min={100}
              className="bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)]"
            />
          </div>
          {customAmount && Number(customAmount) > 0 && (
            <span className="text-sm text-[var(--text-secondary)]">
              {Number(customAmount).toLocaleString()} ข้อความ
            </span>
          )}
        </div>

        {/* Proceed Button */}
        {activeAmount > 0 && (
          <div className="flex items-center gap-4">
            <Button
              className="bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--text-on-accent)] font-semibold gap-2"
              size="lg"
              onClick={() => setPaymentOpen(true)}
              disabled={!selectedPackageId}
            >
              ซื้อ {activeAmount.toLocaleString()} SMS <ArrowRight className="w-4 h-4" />
            </Button>
            {!selectedPackageId && activeAmount > 0 && (
              <span className="text-xs text-[var(--text-muted)]">กรุณาเลือกแพ็กเกจจากรายการด้านบน</span>
            )}
          </div>
        )}
      </section>

      {/* ─── Pricing Table ─── */}
      <section className="mb-6">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
          อัตราค่าบริการ
        </h3>
        <TableWrapper>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-default)]">
                <th className="text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider px-4 py-3">
                  แพ็กเกจ
                </th>
                <th className="text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider px-4 py-3">
                  จำนวน SMS
                </th>
                <th className="text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider px-4 py-3">
                  ราคา/SMS
                </th>
              </tr>
            </thead>
            <tbody>
              {pricingTiers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                    ยังไม่มีข้อมูลแพ็กเกจ — กรุณาติดต่อฝ่ายขาย
                  </td>
                </tr>
              )}
              {pricingTiers.map((tier) => (
                <tr
                  key={tier.name}
                  className="border-b border-[var(--border-default)] last:border-0"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {tier.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                    {tier.range}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {tier.contact ? (
                      <span className="text-sm text-[var(--accent)]">ติดต่อ</span>
                    ) : (
                      <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                        ฿{tier.rate.toFixed(2)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2.5 border-t border-[var(--border-default)]">
            <p className="text-xs text-[var(--text-muted)]">
              * ราคารวม VAT 7% แล้ว ยิ่งส่งมากยิ่งประหยัด
            </p>
          </div>
        </TableWrapper>
      </section>

      {/* ─── ประวัติการซื้อแพ็กเกจ ─── */}
      <section>
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
          ประวัติการซื้อแพ็กเกจ
        </h3>
        <TableWrapper>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-default)]">
                <th className="text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider px-4 py-3">
                  วันที่
                </th>
                <th className="text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider px-4 py-3">
                  จำนวน
                </th>
                <th className="text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider px-4 py-3">
                  วิธีชำระ
                </th>
                <th className="text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider px-4 py-3">
                  สถานะ
                </th>
                <th className="text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider px-4 py-3">
                  ใบเสร็จ
                </th>
              </tr>
            </thead>
            <tbody>
              {history.map((tx) => {
                const status = STATUS_CONFIG[tx.status as keyof typeof STATUS_CONFIG];
                const StatusIcon = status.icon;
                return (
                  <tr
                    key={tx.id}
                    className="border-b border-[var(--border-default)] last:border-0"
                  >
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
                      {tx.date}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-[var(--text-primary)] tabular-nums">
                      {tx.amount.toLocaleString()} SMS
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      โอนเงิน
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`gap-1 text-xs font-medium ${status.className}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {tx.status === "success" && (
                        <button
                          type="button"
                          className="text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <PaginationBar
            from={1}
            to={Math.min(perPage, totalHistory)}
            total={totalHistory}
            page={historyPage}
            totalPages={totalPages}
            onPageChange={setHistoryPage}
          />
        </TableWrapper>
      </section>

      {/* ─── Payment Dialog (Bank Transfer) ─── */}
      <Dialog open={paymentOpen} onOpenChange={handleClosePayment}>
        <DialogContent className="sm:max-w-[480px] bg-[var(--bg-surface)] border-[var(--border-default)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)]">
              ซื้อแพ็กเกจ — {activeAmount.toLocaleString()} SMS
            </DialogTitle>
          </DialogHeader>

          {submitted ? (
            /* ── Success State ── */
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-14 h-14 rounded-full bg-[rgba(var(--success-rgb),0.08)] flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-[var(--success)]" />
              </div>
              <p className="text-base font-semibold text-[var(--text-primary)]">
                ส่งสลิปเรียบร้อย
              </p>
              <p className="text-sm text-[var(--text-secondary)] text-center">
                ระบบจะตรวจสอบและเปิดใช้แพ็กเกจภายใน 15 นาที
              </p>
              <Button
                variant="outline"
                className="mt-2 border-[var(--border-default)] text-[var(--text-secondary)]"
                onClick={handleClosePayment}
              >
                ปิด
              </Button>
            </div>
          ) : (
            /* ── Bank Transfer Form ── */
            <div className="space-y-5 py-2">
              {/* Bank Info */}
              <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] p-4 space-y-2">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">
                  โอนเงินไปที่
                </p>
                {bankAccount ? (
                  <>
                    <p className="text-sm text-[var(--text-primary)] font-medium">
                      {bankAccount.bank}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-[var(--accent)] tabular-nums tracking-wider">
                        {bankAccount.number}
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyAccount}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[rgba(var(--accent-rgb),0.06)] transition-colors cursor-pointer"
                        title="คัดลอก"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-[var(--success)]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {bankAccount.name}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">กำลังโหลดข้อมูลบัญชี...</p>
                )}
              </div>

              {/* Amount Summary */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">จำนวนข้อความ</span>
                  <span className="text-[var(--text-primary)] font-medium tabular-nums">
                    {activeAmount.toLocaleString()} SMS
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {submitError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[rgba(var(--error-rgb),0.08)] border border-[rgba(var(--error-rgb),0.15)]">
                  <AlertTriangle className="w-4 h-4 text-[var(--error)] shrink-0" />
                  <p className="text-sm text-[var(--error)]">{submitError}</p>
                </div>
              )}

              {/* Slip Upload */}
              <div>
                <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">
                  อัปโหลดสลิปโอนเงิน
                </label>
                <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--border-default)] hover:border-[rgba(var(--accent-rgb),0.3)] bg-[var(--bg-base)] p-6 cursor-pointer transition-colors">
                  {slipFile ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-[var(--success)]" />
                      <span className="text-sm text-[var(--text-primary)] font-medium">
                        {slipFile.name}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        คลิกเพื่อเปลี่ยน
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-[var(--text-muted)]" />
                      <span className="text-sm text-[var(--text-secondary)]">
                        คลิกเพื่ออัปโหลดสลิป
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        PNG, JPG ไม่เกิน 5MB
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSlipFile(file);
                    }}
                  />
                </label>
              </div>
            </div>
          )}

          {!submitted && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClosePayment}
                className="border-[var(--border-default)] text-[var(--text-secondary)]"
              >
                ยกเลิก
              </Button>
              <Button
                className="bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--text-on-accent)] font-semibold gap-2"
                disabled={!slipFile || !selectedPackageId || submitting}
                onClick={handleSubmitSlip}
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    กำลังส่ง...
                  </>
                ) : (
                  "ยืนยันการชำระ"
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
