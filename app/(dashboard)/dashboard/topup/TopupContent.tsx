"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Gift,
  ArrowRight,
  Star,
  X,
  Settings,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import CustomSelect from "@/components/ui/CustomSelect";
import PageLayout, { PageHeader } from "@/components/blocks/PageLayout";

/* ─── Types ─── */

type Package = {
  id?: string;
  name: string;
  credits: number;
  price: number;
  perSms: number;
  discount?: string;
  featured?: boolean;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

/* ─── Config ─── */

const PACKAGES: Package[] = [
  { name: "500", credits: 500, price: 175, perSms: 0.35 },
  {
    name: "1,000",
    credits: 1000,
    price: 350,
    perSms: 0.35,
    featured: true,
  },
  {
    name: "5,000",
    credits: 5000,
    price: 1500,
    perSms: 0.3,
    discount: "ประหยัด15%",
  },
  {
    name: "10,000",
    credits: 10000,
    price: 2800,
    perSms: 0.28,
    discount: "ประหยัด20%",
  },
];

const AUTO_TOPUP_PACKAGES = [
  { value: "500", label: "500 SMS (฿175)" },
  { value: "1000", label: "1,000 SMS (฿350)" },
  { value: "5000", label: "5,000 SMS (฿1,500)" },
  { value: "10000", label: "10,000 SMS (฿2,800)" },
];

/* ─── Main Component ─── */

export default function TopupContent({
  user,
  smsRemaining = 0,
}: {
  user: User;
  packages: Array<{
    id?: string;
    name: string;
    price: number;
    bonusPercent: number;
    totalCredits: number;
    maxSenders?: number;
    durationDays: number;
    isBestSeller?: boolean;
  }>;
  smsRemaining?: number;
}) {
  const router = useRouter();
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showFreeTrial, setShowFreeTrial] = useState(true);
  const [autoTopupOpen, setAutoTopupOpen] = useState(false);
  const [autoTopupEnabled, setAutoTopupEnabled] = useState(false);
  const [autoTopupThreshold, setAutoTopupThreshold] = useState("100");
  const [autoTopupPkg, setAutoTopupPkg] = useState("1000");
  const [autoTopupNotify, setAutoTopupNotify] = useState(true);
  const [autoTopupCap, setAutoTopupCap] = useState("5000");

  const customCredits = customAmount ? Math.floor(Number(customAmount)) : 0;
  const customPrice = customCredits * 0.35;

  const orderPkg = selectedPkg;
  const orderCredits = orderPkg
    ? orderPkg.credits
    : customCredits > 0
      ? customCredits
      : 0;
  const orderPrice = orderPkg
    ? orderPkg.price
    : customCredits > 0
      ? customPrice
      : 0;
  const orderVat = orderPrice * 0.07;
  const orderTotal = orderPrice + orderVat;

  return (
    <PageLayout>
      <PageHeader title="ซื้อแพ็กเกจ SMS" />

      {/* Free Trial Banner */}
      {showFreeTrial && (
        <div
          className="relative rounded-lg border border-[rgba(var(--accent-rgb),0.15)] p-5 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{
            background:
              "linear-gradient(90deg, rgba(var(--accent-rgb),0.06), rgba(var(--info-rgb),0.06))",
          }}
        >
          <div className="flex items-center gap-3">
            <Gift className="w-6 h-6 text-[var(--accent)] flex-shrink-0" />
            <div>
              <p className="text-base font-semibold text-[var(--text-primary)]">
                ทดลองใช้ฟรี!
              </p>
              <p className="text-[13px] text-[var(--text-secondary)]">
                คุณได้รับ 50 SMS ฟรีสำหรับเริ่มต้น
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button className="bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--text-on-accent)] font-semibold gap-2">
              รับ SMS ฟรี <ArrowRight className="w-4 h-4" />
            </Button>
            <button
              type="button"
              onClick={() => setShowFreeTrial(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Current Balance */}
      <p className="text-sm text-[var(--text-secondary)] mb-5">
        SMS คงเหลือ:{" "}
        <span className="text-[var(--text-primary)] font-semibold">
          {smsRemaining.toLocaleString()} SMS
        </span>
      </p>

      {/* Package Cards */}
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">เลือกแพ็คเกจ</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {PACKAGES.map((pkg) => {
          const isSelected = selectedPkg?.credits === pkg.credits;
          return (
            <button
              key={pkg.credits}
              type="button"
              onClick={() => {
                setSelectedPkg(pkg);
                setCustomAmount("");
              }}
              className={`relative rounded-lg p-5 text-center transition-all cursor-pointer ${
                isSelected
                  ? "border-2 border-[var(--accent)] bg-[rgba(var(--accent-rgb),0.02)]"
                  : "border border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[rgba(var(--accent-rgb),0.15)] hover:-translate-y-0.5"
              }`}
            >
              {/* Featured gradient border overlay */}
              {pkg.featured && !isSelected && (
                <div
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  style={{
                    padding: "1px",
                    background:
                      "linear-gradient(90deg, var(--accent), var(--info))",
                    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    maskComposite: "exclude",
                    WebkitMaskComposite: "xor",
                  }}
                />
              )}

              {/* Featured badge */}
              {pkg.featured && (
                <span className="absolute -top-2.5 right-3 text-[10px] font-semibold bg-[var(--accent)] text-[var(--text-on-accent)] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" /> ยอดนิยม
                </span>
              )}

              <div className="text-[30px] font-bold text-[var(--text-primary)] mb-0.5">
                {pkg.name}
              </div>
              <p className="text-base text-[var(--text-muted)] mb-3">SMS</p>
              <div className="text-xl font-semibold text-[var(--accent)] mb-1">
                ฿{pkg.price.toLocaleString()}
              </div>
              <p className="text-[13px] text-[var(--text-secondary)]">
                {pkg.perSms}฿/SMS
              </p>

              {pkg.discount && (
                <p className="text-xs text-[var(--warning)] font-medium mt-2">
                  {pkg.discount}
                </p>
              )}

              <Button
                className={`w-full mt-4 rounded-lg font-semibold text-sm ${
                  pkg.featured || isSelected
                    ? "bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--text-on-accent)]"
                    : "bg-transparent border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.03)]"
                }`}
              >
                {isSelected ? "เลือกแล้ว" : "เลือก"}
                {(pkg.featured || isSelected) && (
                  <ArrowRight className="w-4 h-4 ml-1" />
                )}
              </Button>
            </button>
          );
        })}
      </div>

      {/* Custom Amount */}
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">กรอกจำนวนเอง</h3>
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-[300px]">
          <Input
            type="number"
            placeholder="จำนวน SMS"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setSelectedPkg(null);
            }}
            min={1}
            className="bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)]"
          />
        </div>
        {customCredits > 0 && (
          <span className="text-sm text-[var(--text-secondary)]">
            = ฿{customPrice.toFixed(2)} (0.35฿/SMS)
          </span>
        )}
      </div>

      {/* Order Summary */}
      {orderCredits > 0 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-6 mb-5">
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
            สรุปคำสั่งซื้อ
          </h3>

          <div className="space-y-0">
            <div className="flex justify-between py-2 border-b border-[var(--border-default)]">
              <span className="text-sm text-[var(--text-secondary)]">
                {orderPkg
                  ? `แพ็ค ${orderPkg.name} SMS`
                  : `${orderCredits.toLocaleString()} SMS`}
              </span>
              <span className="text-sm text-[var(--text-primary)] tabular-nums">
                ฿{orderPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border-default)]">
              <span className="text-sm text-[var(--text-secondary)]">VAT 7%</span>
              <span className="text-sm text-[var(--text-primary)] tabular-nums">
                ฿{orderVat.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-lg font-bold text-[var(--text-primary)]">รวมทั้งสิ้น</span>
              <span className="text-lg font-bold text-[var(--accent)] tabular-nums">
                ฿{orderTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <Button
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--text-on-accent)] font-semibold text-base rounded-lg mt-4 gap-2" size="lg"
            onClick={() =>
              router.push("/dashboard/packages")
            }
          >
            ดำเนินการชำระเงิน <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Auto Top-up Dialog */}
      <Dialog open={autoTopupOpen} onOpenChange={setAutoTopupOpen}>
        <DialogContent className="sm:max-w-[480px] bg-[var(--bg-surface)] border-[var(--border-default)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)]">
              ตั้งค่าซื้อแพ็กเกจอัตโนมัติ
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-primary)]">เปิดใช้งาน</span>
              <Switch
                checked={autoTopupEnabled}
                onCheckedChange={setAutoTopupEnabled}
              />
            </div>

            <div>
              <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">
                เติมเมื่อ SMS เหลือต่ำกว่า
              </label>
              <Input
                type="number"
                placeholder="100"
                value={autoTopupThreshold}
                onChange={(e) => setAutoTopupThreshold(e.target.value)}
                className="bg-[var(--bg-surface)] border-[var(--border-default)]"
              />
            </div>

            <div>
              <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">
                จำนวนที่จะเติมอัตโนมัติ
              </label>
              <CustomSelect
                value={autoTopupPkg}
                onChange={setAutoTopupPkg}
                options={AUTO_TOPUP_PACKAGES}
                placeholder="เลือกแพ็คเกจ"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-primary)]">
                แจ้งเตือนเมื่อเติมอัตโนมัติ
              </span>
              <Switch
                checked={autoTopupNotify}
                onCheckedChange={setAutoTopupNotify}
              />
            </div>

            <div>
              <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">
                วงเงินสูงสุดต่อเดือน
              </label>
              <Input
                type="number"
                placeholder="5,000"
                value={autoTopupCap}
                onChange={(e) => setAutoTopupCap(e.target.value)}
                className="bg-[var(--bg-surface)] border-[var(--border-default)]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAutoTopupOpen(false)}
              className="border-[var(--border-default)] text-[var(--text-secondary)]"
            >
              ยกเลิก
            </Button>
            <Button className="bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--text-on-accent)] font-semibold">
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
