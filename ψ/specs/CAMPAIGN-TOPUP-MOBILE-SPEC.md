# Campaign Page + Topup Flow + Mobile Audit + Implementation Review

> UXUI Oracle | 2026-03-09

---

## 1. IMPLEMENTATION REVIEW — สิ่งที่ implement แล้ว vs ยังขาด

### ✅ ทำแล้ว
- `layout.tsx` สร้างแล้ว — ทุกหน้า wrap ด้วย DashboardShell อัตโนมัติ
- Sidebar labels ภาษาไทย (แต่ยังไม่ตรง spec — ดูด้านล่าง)
- `gradient-text-sky` CSS class
- `skeleton` shimmer class

### ⚠️ Sidebar ยังไม่ตรง Spec

| Spec ต้องการ | ปัจจุบัน | ต้องแก้ |
|-------------|---------|--------|
| `ภาพรวม` | `แดชบอร์ด` | ✏️ |
| `ประวัติการส่ง` | `ข้อความ` | ✏️ |
| `รายชื่อผู้ติดต่อ` | `สมุดโทรศัพท์` | ✏️ |
| `เติมเครดิต` | `เติมเงิน` | ✏️ |
| Section: `เมนูหลัก` | `หลัก` | ✏️ |

### ❌ CSS Classes ยังไม่ implement

```
ขาด: glass-sky, glass-indigo, glass-violet, glass-emerald
ขาด: badge-glow-success, badge-glow-info, badge-glow-warning, badge-glow-error
ขาด: stagger-children
ขาด: animate-fade-in-up
ขาด: gradient-text-violet, gradient-text-emerald, gradient-text-amber, gradient-text-rainbow
ขาด: card-hover, table-row-hover, sidebar-hover
ขาด: expand-content, toast-enter, toast-exit
ขาด: ambient-orb, ambient-orb-2
ขาด: Background depth tokens (--bg-raised, --bg-surface, --bg-elevated, --bg-hover)
```

**Action:** Copy CSS จาก `ψ/specs/MOTION-AND-COLOR-SPEC.md` ใส่ globals.css

---

## 2. CAMPAIGN PAGE — Real Design (ไม่ใช่ Coming Soon)

### User Flow

```
เข้าหน้า Campaigns
  ├─ (ไม่มี campaign) → Empty State + ปุ่ม "สร้างแคมเปญ"
  └─ (มี campaigns) → Campaign List + Stats

สร้างแคมเปญ (3 ขั้นตอน):
  Step 1: เขียนข้อความ
    ├─ เลือกชื่อผู้ส่ง
    ├─ เลือกประเภท (Thai/English)
    ├─ พิมพ์ข้อความ + character counter
    └─ ถัดไป →

  Step 2: เลือกผู้รับ
    ├─ เลือกจากรายชื่อผู้ติดต่อ (checkbox)
    ├─ เลือกตามแท็ก
    ├─ หรือใส่เบอร์ manual
    └─ ถัดไป →

  Step 3: ตรวจสอบและส่ง
    ├─ สรุป: ข้อความ, จำนวนผู้รับ, ค่าใช้จ่าย
    ├─ ตั้งเวลาส่ง (ทันที / กำหนดเวลา)
    └─ ยืนยันส่ง (ConfirmDialog)
```

### Campaign List Page

```
┌─────────────────────────────────────────────────────┐
│  แคมเปญ                           [ + สร้างแคมเปญ ] │
│  จัดการแคมเปญส่งข้อความของคุณ                        │
├─────────────────────────────────────────────────────┤
│  Stats (3 cards)                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ ทั้งหมด   │ │ กำลังส่ง  │ │ เสร็จสิ้น │             │
│  │   12     │ │    2     │ │   10     │             │
│  └──────────┘ └──────────┘ └──────────┘             │
├─────────────────────────────────────────────────────┤
│  Campaign Cards (list)                               │
│  ┌─────────────────────────────────────────────────┐│
│  │ 📢 โปรโมชันปีใหม่                    ● เสร็จสิ้น ││
│  │ ส่งถึง 1,234 หมายเลข | 1,180 สำเร็จ | 54 ไม่สำเร็จ││
│  │ 9 มี.ค. 2569 14:00              271.48 เครดิต  ││
│  │ ─────── progress bar 95.6% ───────             ││
│  └─────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │ 📢 แจ้งเตือน OTP                     ● กำลังส่ง  ││
│  │ ส่งถึง 500 หมายเลข | 320 สำเร็จ | 0 ไม่สำเร็จ    ││
│  │ 9 มี.ค. 2569 15:30              110.00 เครดิต  ││
│  │ ═══════ progress bar 64% ═══════               ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### Campaign Card Component

```tsx
function CampaignCard({ campaign }: { campaign: Campaign }) {
  const progress = campaign.totalSent > 0
    ? ((campaign.delivered / campaign.totalRecipients) * 100).toFixed(1)
    : 0;

  return (
    <div className="glass card-hover p-5 mb-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">{campaign.name}</h3>
        <StatusBadge status={campaign.status} />
      </div>

      <p className="text-xs text-white/40 mb-3 line-clamp-1">{campaign.message}</p>

      <div className="flex items-center gap-4 text-xs text-white/30 mb-3">
        <span>{campaign.totalRecipients.toLocaleString()} หมายเลข</span>
        <span className="text-emerald-400">{campaign.delivered.toLocaleString()} สำเร็จ</span>
        {campaign.failed > 0 && (
          <span className="text-red-400">{campaign.failed} ไม่สำเร็จ</span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-2 text-[11px] text-white/20">
        <span>{formatDate(campaign.createdAt)}</span>
        <span>{campaign.creditCost.toLocaleString()} เครดิต</span>
      </div>
    </div>
  );
}
```

### Campaign Status

| Status | Label | Badge | Color |
|--------|-------|-------|-------|
| draft | ฉบับร่าง | badge-glow-info | sky |
| scheduled | ตั้งเวลาแล้ว | badge-glow-warning | amber |
| sending | กำลังส่ง | badge-glow-info | sky + pulse animation |
| completed | เสร็จสิ้น | badge-glow-success | emerald |
| failed | ส่งไม่สำเร็จ | badge-glow-error | red |

### Step Wizard UI

```
┌───────────────────────────────────────────────┐
│  Step Indicator                                │
│  ① เขียนข้อความ ─── ② เลือกผู้รับ ─── ③ ตรวจสอบ │
│  (active: sky)     (pending: white/20)        │
├───────────────────────────────────────────────┤
│  Step Content (glass card)                     │
│  ...                                          │
├───────────────────────────────────────────────┤
│            [ ← ก่อนหน้า ]  [ ถัดไป → ]        │
└───────────────────────────────────────────────┘
```

```tsx
function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps = [
    { num: 1, label: "เขียนข้อความ" },
    { num: 2, label: "เลือกผู้รับ" },
    { num: 3, label: "ตรวจสอบและส่ง" },
  ];

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, i) => (
        <Fragment key={step.num}>
          <div className="flex items-center gap-2">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
              step.num === currentStep
                ? "bg-sky-500/20 border-sky-500/30 text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.2)]"
                : step.num < currentStep
                  ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                  : "bg-white/[0.03] border-white/[0.06] text-white/20"
            }`}>
              {step.num < currentStep ? "✓" : step.num}
            </span>
            <span className={`text-xs font-medium hidden sm:block ${
              step.num === currentStep ? "text-white" : "text-white/25"
            }`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-8 sm:w-16 h-px ${
              step.num < currentStep ? "bg-emerald-400/30" : "bg-white/[0.06]"
            }`} />
          )}
        </Fragment>
      ))}
    </div>
  );
}
```

---

## 3. TOPUP FLOW + PAYMENT CONFIRMATION UX

### User Flow

```
เข้าหน้าเติมเครดิต
  ├─ ดูเครดิตคงเหลือ
  ├─ เลือกแพ็กเกจ (คลิกการ์ด)
  └─ เปิด Payment Modal

Payment Modal (3 tabs):
  Tab 1: PromptPay QR
    ├─ แสดง QR Code + จำนวนเงิน
    ├─ Timer countdown 15 นาที
    └─ รอยืนยัน / อัปโหลดสลิป

  Tab 2: โอนธนาคาร
    ├─ แสดงเลขบัญชี + ชื่อบัญชี
    ├─ ปุ่มคัดลอกเลขบัญชี
    └─ อัปโหลดสลิป

  Tab 3: บัตรเครดิต (อนาคต)
    └─ "เร็ว ๆ นี้"

Upload Slip:
  ├─ Drag & drop / เลือกไฟล์
  ├─ Preview รูปสลิป
  └─ ส่งยืนยัน → รอตรวจสอบ

Payment Status:
  ├─ รอตรวจสอบ (amber) → แสดงขณะรอ admin approve
  ├─ สำเร็จ (emerald) → เครดิตเพิ่ม + toast success
  └─ ไม่สำเร็จ (red) → แจ้งเหตุผล + ติดต่อทีมงาน
```

### Payment Modal Wireframe

```
┌─────────────────────────────────────────┐
│  เติมเครดิต — แพ็กเกจ B                  │  ✕
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────┐┌──────────┐┌──────────┐   │
│  │PromptPay ││โอนธนาคาร ││บัตรเครดิต│   │
│  │ (active) ││          ││(เร็วๆนี้)│   │
│  └──────────┘└──────────┘└──────────┘   │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │        [ QR CODE ]              │    │
│  │        PromptPay                │    │
│  │                                 │    │
│  │     ยอดชำระ: ฿1,000.00         │    │
│  │     ⏱ หมดเวลาใน 14:32          │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ── หรือ ──                              │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 📎 อัปโหลดสลิปการโอน           │    │
│  │    ลากไฟล์มาวาง หรือคลิก        │    │
│  └─────────────────────────────────┘    │
│                                         │
│           [ ส่งหลักฐานการชำระ ]          │
│                                         │
└─────────────────────────────────────────┘
```

### Payment Tab Component

```tsx
function PaymentTabs({ selectedPackage, onClose }: PaymentTabsProps) {
  const [tab, setTab] = useState<"promptpay" | "bank" | "card">("promptpay");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);

  const tabs = [
    { id: "promptpay", label: "PromptPay" },
    { id: "bank", label: "โอนธนาคาร" },
    { id: "card", label: "บัตรเครดิต", disabled: true },
  ];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-elevated p-6 sm:p-8 max-w-md w-full animate-fade-in-up max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-white">เติมเครดิต</h3>
            <p className="text-xs text-white/40 mt-0.5">แพ็กเกจ {selectedPackage.name}</p>
          </div>
          <button onClick={onClose} className="text-white/20 hover:text-white/50 p-1">✕</button>
        </div>

        {/* Amount */}
        <div className="glass p-4 mb-6 text-center">
          <p className="text-xs text-white/30 mb-1">ยอดชำระ</p>
          <p className="text-2xl font-bold gradient-text-sky">
            ฿{(selectedPackage.price / 100).toLocaleString()}
          </p>
          <p className="text-xs text-white/20 mt-1">
            ได้รับ {selectedPackage.totalCredits.toLocaleString()} เครดิต
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/[0.03]">
          {tabs.map(t => (
            <button key={t.id}
              disabled={t.disabled}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                tab === t.id
                  ? "bg-sky-500/20 text-sky-400 border border-sky-500/20"
                  : t.disabled
                    ? "text-white/15 cursor-not-allowed"
                    : "text-white/40 hover:text-white/60"
              }`}>
              {t.label}
              {t.disabled && <span className="block text-[10px] text-white/10">เร็ว ๆ นี้</span>}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {/* ... PromptPay QR / Bank Transfer / Credit Card */}

        {/* Slip Upload */}
        <div className="mt-6">
          <div className="border-t border-white/5 pt-6">
            <label className="block glass p-6 text-center cursor-pointer hover:border-sky-500/20 transition-colors">
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0])} />
              <svg className="mx-auto mb-2 text-white/15" width="32" height="32" .../>
              <p className="text-sm text-white/30">อัปโหลดสลิปการโอน</p>
              <p className="text-xs text-white/15 mt-1">ลากไฟล์มาวาง หรือคลิกเพื่อเลือก</p>
            </label>
          </div>

          {slipPreview && (
            <div className="mt-4 glass p-3">
              <img src={slipPreview} alt="slip" className="w-full rounded-lg max-h-48 object-contain" />
            </div>
          )}

          <button disabled={!slipFile}
            className="w-full btn-primary py-3 rounded-xl text-sm font-semibold mt-4 disabled:opacity-40">
            ส่งหลักฐานการชำระ
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Payment Status States

| สถานะ | UI | ข้อความ |
|-------|-----|---------|
| รอตรวจสอบ | amber badge + pulse | "กำลังตรวจสอบการชำระ กรุณารอสักครู่" |
| สำเร็จ | emerald toast + confetti effect | "เติมเครดิตสำเร็จ! ได้รับ X เครดิต" |
| ไม่สำเร็จ | red card | "ไม่สามารถยืนยันการชำระได้ กรุณาติดต่อทีมงาน" |

---

## 4. MOBILE-FIRST RESPONSIVE AUDIT

### ทุกหน้า — Checklist

#### Landing Page
| Item | 375px | 768px | 1024px |
|------|-------|-------|--------|
| Nav: hamburger menu | ✅ มีแล้ว | Desktop nav | Desktop nav |
| Hero: text size | text-4xl | text-5xl | text-6xl/7xl |
| Hero: CTA buttons | stack (flex-col) | row (flex-row) | row |
| Stats bar | grid-cols-2 | grid-cols-4 | grid-cols-4 |
| Benefits | grid-cols-2 | grid-cols-5 | grid-cols-5 |
| Features | grid-cols-1 | grid-cols-2 | grid-cols-2 |
| Pricing | grid-cols-1 | grid-cols-2 | grid-cols-4 |
| FAQ | full width | full width | max-w-3xl |

#### Dashboard (ภาพรวม)
| Item | 375px | 768px | 1024px |
|------|-------|-------|--------|
| Sidebar | ซ่อน → bottom nav | 240px fixed | 240px fixed |
| Stat cards | grid-cols-2 | grid-cols-4 | grid-cols-4 |
| Recent messages | card list | table | table |
| Quick send | ซ่อน → FAB button | ✅ | ✅ |

#### Send SMS
| Item | 375px | 768px | 1024px |
|------|-------|-------|--------|
| Layout | 1 col stack | 1 col | 2 col (3+2) |
| Preview | below compose | below compose | right sidebar |
| Cost summary | below preview | below preview | right sidebar |
| Type buttons | ล้น? ต้อง scroll | flex row | flex row |

**⚠️ ต้องแก้:** Type buttons (English/Thai/Unicode) อาจล้นบน 375px → ใช้ `flex-wrap` หรือย่อ text

#### Messages (ประวัติการส่ง)
| Item | 375px | 768px | 1024px |
|------|-------|-------|--------|
| Filter bar | stack (flex-col) | flex-row | flex-row |
| Stats | grid-cols-2 | grid-cols-4 | grid-cols-4 |
| Data | card list | table (ซ่อน 2 cols) | table (ทุก col) |
| Pagination | simple prev/next | full page numbers | full + per-page |

#### Contacts
| Item | 375px | 768px | 1024px |
|------|-------|-------|--------|
| Add form | 1 col | 2 col grid | 2 col grid |
| Data | card list | table | table |
| Actions | swipe? / long press | button in row | button in row |

#### Senders
| Item | 375px | 768px | 1024px |
|------|-------|-------|--------|
| Stats | grid-cols-3 | grid-cols-3 | grid-cols-3 |
| Process steps | stack vertical | flex row | flex row |
| Form | 1 col | 2 col | 2 col |
| Table | card list | table | table |

**⚠️ ต้องแก้:** Process steps (1→2→3) ล้นบน 375px → stack เป็น vertical บน mobile

#### Topup
| Item | 375px | 768px | 1024px |
|------|-------|-------|--------|
| Credit card | full width | full width | full width |
| Package grid | grid-cols-1 | grid-cols-2 | grid-cols-3/4 |
| Payment modal | full screen | centered 400px | centered 400px |

#### API Keys
| Item | 375px | 768px | 1024px |
|------|-------|-------|--------|
| Header + button | stack | flex row | flex row |
| Create form | 1 col | flex row | flex row |
| Table | card list | table | table |
| API code block | scroll-x | scroll-x | full |

**⚠️ ต้องแก้:** Header "คีย์ API" + "สร้างคีย์ใหม่" button stack บน 375px

#### Settings
| Item | 375px | 768px | 1024px |
|------|-------|-------|--------|
| Profile fields | 1 col | 2 col | 2 col |
| Password fields | 1 col | 2 col | 2 col |
| Account cards | grid-cols-1 | grid-cols-3 | grid-cols-3 |

**⚠️ ต้องแก้:** Account info cards (บทบาท/เครดิต/สมาชิกตั้งแต่) ใช้ grid-cols-3 ทุก breakpoint → ล้นบน 375px ต้องเป็น `grid-cols-1 sm:grid-cols-3`

### Mobile-Specific Fixes Required

```tsx
// 1. Settings: Account cards
// เดิม: grid-cols-3
// แก้:
<div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

// 2. Senders: Process steps
// เดิม: flex-wrap gap-x-6
// แก้: stack บน mobile
<div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-x-6">

// 3. Send: Type buttons
// เดิม: flex gap-2
// แก้: wrap
<div className="flex flex-wrap gap-2">

// 4. API Keys: Header
// เดิม: flex justify-between
// แก้: stack บน mobile
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">

// 5. Messages: Pagination
// บน mobile แสดงแค่ prev/next ไม่ต้องแสดง page numbers
<div className="hidden sm:flex">{pageNumbers}</div>
<div className="flex sm:hidden gap-2">
  <button>ก่อนหน้า</button>
  <span>{page}/{totalPages}</span>
  <button>ถัดไป</button>
</div>
```
