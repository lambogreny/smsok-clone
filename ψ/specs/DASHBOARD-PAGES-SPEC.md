# SMSOK Dashboard — 8 Pages Design Spec
### UXUI Oracle | Web3 Dark + Blue Glassmorphism | v3

> **For: lead-dev + frontend**
> All pages share the same sidebar + topbar layout from DashboardContent.tsx
> Extract sidebar into a shared `DashboardLayout` wrapper component.

---

## Shared Layout Pattern

Every dashboard page follows this structure:

```
┌─────────────────────────────────────────────────────┐
│ Sidebar (240px)  │  Main Content                    │
│                  │  ┌─ Top Bar (h-14, sticky) ────┐ │
│  [Logo SMSOK]    │  │  Page Title     [Credits]   │ │
│                  │  └─────────────────────────────┘ │
│  Main            │  ┌─ Content Area (p-6 md:p-8) ─┐ │
│  · Dashboard     │  │                             │ │
│  · ส่ง SMS  ←    │  │  [Page-specific content]    │ │
│  · ข้อความ       │  │                             │ │
│  · Campaigns     │  │                             │ │
│                  │  │                             │ │
│  Management      │  └─────────────────────────────┘ │
│  · สมุดโทรศัพท์   │  ┌─ Footer ──────────────────┐  │
│  · Sender Names  │  │  v1.0  © SMSOK             │  │
│  · เติมเงิน      │  └───────────────────────────┘  │
│                  │                                  │
│  Settings        │                                  │
│  · API Keys      │                                  │
│  · ตั้งค่า        │                                  │
│                  │                                  │
│  [User avatar]   │  [Mobile Bottom Nav — md:hidden] │
│  [Logout]        │                                  │
└─────────────────────────────────────────────────────┘
```

### Implementation Note
Create `app/(dashboard)/dashboard/layout.tsx` that wraps all sub-pages with sidebar + topbar.
Each page only renders the inner content area.

### Shared Components Needed
- `DashboardShell` — sidebar + topbar wrapper (extract from DashboardContent.tsx)
- `PageHeader` — `{ title, description?, action? }` — glass icon box + title + optional button
- `DataTable` — glass table with `.table-row` hover, pagination
- `EmptyState` — icon in glass box + text + CTA button
- `StatCard` — reusable from dashboard (icon, label, value, delta, sparkline)

### Design Rules
- All cards use `.glass` class
- Interactive cards add `.card-glow` for hover lift + glow
- Section headers: icon in `w-8 h-8 rounded-lg bg-sky-500/[0.08] border border-sky-500/10`
- Labels: `text-xs text-white/30 uppercase tracking-wider font-medium`
- Page titles in topbar: `text-lg font-semibold text-white tracking-tight`
- Animations: `animate-fade-in` with staggered `animationDelay`
- Borders: `border-white/[0.04]` (NOT `border-white/5`)
- Status dots: colored + matching `shadow-[0_0_6px_...]` glow

---

## Page 1: ส่ง SMS (`/dashboard/send`)

**Purpose:** Compose and send SMS messages

```
┌─────────────────────────────────────────┐
│ ✈ ส่ง SMS                    [ประวัติ →] │
├─────────────────────────────────────────┤
│                                         │
│  ┌─ glass card ──────────────────────┐  │
│  │                                   │  │
│  │  Sender Name  [▼ dropdown]        │  │
│  │                                   │  │
│  │  ผู้รับ                            │  │
│  │  ┌──────────────────────────────┐ │  │
│  │  │ input-glass: 0891234567      │ │  │
│  │  │ (comma-separated or paste)   │ │  │
│  │  └──────────────────────────────┘ │  │
│  │  [+ นำเข้าจากสมุดโทรศัพท์]  btn-glass │  │
│  │                                   │  │
│  │  ข้อความ                          │  │
│  │  ┌──────────────────────────────┐ │  │
│  │  │ textarea-glass: 4 rows      │ │  │
│  │  │ "สวัสดีครับ {name}..."       │ │  │
│  │  │                              │ │  │
│  │  └──────────────────────────────┘ │  │
│  │  ตัวอักษร: 42/160  |  1 SMS      │  │
│  │                                   │  │
│  │  ┌─ Preview ────────────────────┐ │  │
│  │  │  ┌─────────────────┐        │ │  │
│  │  │  │ 📱 Phone mockup │        │ │  │
│  │  │  │ SMS bubble      │        │ │  │
│  │  │  │ showing message │        │ │  │
│  │  │  └─────────────────┘        │ │  │
│  │  └──────────────────────────────┘ │  │
│  │                                   │  │
│  │  ┌─ Summary ────────────────────┐ │  │
│  │  │ ผู้รับ: 1 เบอร์               │ │  │
│  │  │ เครดิต: 1.00                  │ │  │
│  │  │ คงเหลือ: 499.00              │ │  │
│  │  └──────────────────────────────┘ │  │
│  │                                   │  │
│  │  [btn-primary: ส่ง SMS →]         │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Interactions:**
- Sender dropdown: glass dropdown with `.glass-elevated` + neon border on open
- Character counter: live count, turns `text-warning` at 140+, `text-error` at 160+
- Phone preview: simple glass mockup showing SMS bubble — optional, nice-to-have
- Summary updates live as user types
- Submit: loading spinner, success → green toast, error → red toast
- Textarea: `input-glass` style but `min-h-[120px] resize-none`

---

## Page 2: ข้อความ (`/dashboard/messages`)

**Purpose:** View sent message history with status tracking

```
┌─────────────────────────────────────────┐
│ 💬 ข้อความ                  [ส่ง SMS →]  │
├─────────────────────────────────────────┤
│                                         │
│  ┌─ Filter bar (glass) ─────────────┐  │
│  │ [🔍 ค้นหาเบอร์...]  [Status ▼]   │  │
│  │ [วันที่ ▼]  [Sender ▼]  [Export]  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─ Stats row ───────────────────────┐  │
│  │ ส่งทั้งหมด  │ สำเร็จ  │ ล้มเหลว   │  │
│  │  1,234     │  1,210  │   24      │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─ Table (glass) ───────────────────┐  │
│  │ เบอร์        Sender  Status  เวลา │  │
│  ├───────────────────────────────────┤  │
│  │ 089-123-4567  SMSOK  ● sent  10:23│  │
│  │ 091-234-5678  MYAPP  ● delivered  │  │
│  │ 086-345-6789  SMSOK  ● failed     │  │
│  │ ...                               │  │
│  ├───────────────────────────────────┤  │
│  │ [← Prev]  หน้า 1/12  [Next →]    │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Key Details:**
- Status dots with glow: `●` delivered=emerald, sent=blue, failed=red, pending=yellow
- Filter inputs: `input-glass` in a horizontal row
- Table: glass card, `.table-row` hover effect
- Pagination: `btn-glass` prev/next
- Click row → slide-out detail panel (glass-elevated) showing full message + timestamps
- Empty state: message icon + "ยังไม่มีข้อความ" + CTA "ส่ง SMS แรก"
- Export button: `btn-glass` with download icon

---

## Page 3: Campaigns (`/dashboard/campaigns`)

**Purpose:** Manage bulk SMS campaigns

```
┌─────────────────────────────────────────┐
│ 📣 Campaigns              [+ สร้างใหม่]  │
├─────────────────────────────────────────┤
│                                         │
│  ┌─ Stats cards (3 cols) ────────────┐  │
│  │ แคมเปญทั้งหมด │ กำลังส่ง │ เสร็จแล้ว  │  │
│  │     12       │    2    │    10    │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─ Campaign card ───────────────────┐  │
│  │ glass card-glow                   │  │
│  │                                   │  │
│  │ "โปรโมชั่นปีใหม่ 2026"             │  │
│  │ badge-success: COMPLETED          │  │
│  │                                   │  │
│  │ ┌─ Progress bar ───────────────┐  │  │
│  │ │ ████████████████░░░  85%     │  │  │
│  │ └─────────────────────────────┘  │  │
│  │                                   │  │
│  │ ส่ง: 8,500/10,000  │  เครดิต: 850 │  │
│  │ สร้าง: 2026-03-01  │  Sender: MYAPP│  │
│  │                                   │  │
│  │ [ดูรายละเอียด →]                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─ Campaign card ───────────────────┐  │
│  │ ...                               │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Key Details:**
- Campaign cards: `.glass .card-glow` — grid 1 col mobile, 2 cols desktop
- Progress bar: `h-1.5 rounded-full bg-white/[0.04]` track, `bg-gradient-to-r from-sky-400 to-sky-500` fill
- Status badges: `badge-success`, `badge-warning` (sending), `badge-info` (draft)
- Create button: `btn-primary` top right → opens create flow (new page or modal)
- Empty state: campaign icon + "ยังไม่มีแคมเปญ" + "สร้างแคมเปญแรก"

**Create Campaign Flow (modal or page):**
1. ชื่อแคมเปญ (input-glass)
2. เลือก Sender Name (dropdown)
3. เลือกผู้รับ: จากสมุดโทรศัพท์ / อัพโหลด CSV / พิมพ์เอง
4. เขียนข้อความ (textarea)
5. ตั้งเวลาส่ง: ทันที / กำหนดเวลา (datetime picker)
6. สรุป + ยืนยัน

---

## Page 4: สมุดโทรศัพท์ (`/dashboard/contacts`)

**Purpose:** Manage contact lists and groups

```
┌─────────────────────────────────────────┐
│ 📖 สมุดโทรศัพท์         [+ เพิ่มรายชื่อ]  │
├─────────────────────────────────────────┤
│                                         │
│  ┌─ Tab bar ─────────────────────────┐  │
│  │ [รายชื่อทั้งหมด]  [กลุ่ม]  [นำเข้า] │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─ Search + Filter ─────────────────┐  │
│  │ [🔍 ค้นหาชื่อ/เบอร์...]  [กลุ่ม ▼] │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─ Contact list (glass table) ──────┐  │
│  │ ☐  ชื่อ           เบอร์       กลุ่ม │  │
│  ├───────────────────────────────────┤  │
│  │ ☐  สมชาย ใจดี  089-123-4567  VIP  │  │
│  │ ☐  สมหญิง ดี   091-234-5678  — │  │
│  │ ...                               │  │
│  ├───────────────────────────────────┤  │
│  │ เลือก 0 รายชื่อ  [ลบ] [ส่ง SMS]   │  │
│  │ [← Prev]  1/5  [Next →]          │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Tab: กลุ่ม**
```
┌─ Group cards (grid 2-3 cols) ────────┐
│  ┌─ glass card-glow ──────────────┐  │
│  │  VIP Customers                 │  │
│  │  125 รายชื่อ                    │  │
│  │  [แก้ไข]  [ส่ง SMS]            │  │
│  └────────────────────────────────┘  │
│  ┌─ glass card-glow ──────────────┐  │
│  │  + สร้างกลุ่มใหม่               │  │
│  │  (dashed border card)          │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

**Tab: นำเข้า**
```
┌─ Import area (glass) ────────────────┐
│                                      │
│  ┌─ Drop zone ────────────────────┐  │
│  │  (dashed border, sky-500/15)   │  │
│  │                                │  │
│  │  📄 ลากไฟล์ CSV มาวางที่นี่      │  │
│  │  หรือ [เลือกไฟล์]              │  │
│  │                                │  │
│  │  รองรับ: .csv, .xlsx           │  │
│  │  คอลัมน์: ชื่อ, เบอร์, กลุ่ม     │  │
│  └────────────────────────────────┘  │
│                                      │
│  [ดาวน์โหลดตัวอย่าง CSV]             │
└──────────────────────────────────────┘
```

**Key Details:**
- Tabs: underline style — active = `border-b-2 border-sky-400 text-white`, inactive = `text-white/40`
- Checkboxes: custom styled with sky-400 checked state
- Bulk actions bar: appears when items selected, slides up from bottom of table
- Add contact: modal (glass-elevated) with name + phone + group fields
- Empty state per tab

---

## Page 5: Sender Names (`/dashboard/senders`)

**Purpose:** Manage SMS sender name identities

```
┌─────────────────────────────────────────┐
│ 🏷 Sender Names           [+ ขอชื่อใหม่] │
├─────────────────────────────────────────┤
│                                         │
│  ┌─ Info banner (glass) ─────────────┐  │
│  │ ℹ Sender Name ต้องได้รับอนุมัติจาก  │  │
│  │   กสทช. ก่อนใช้งาน (1-2 วันทำการ)  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─ Sender card (glass card-glow) ───┐  │
│  │                                   │  │
│  │  SMSOK                            │  │
│  │  badge-success: APPROVED          │  │
│  │                                   │  │
│  │  ขอเมื่อ: 2026-02-15             │  │
│  │  อนุมัติ: 2026-02-16              │  │
│  │  ใช้งาน: 1,234 ข้อความ             │  │
│  │                                   │  │
│  │  [ตั้งเป็น Default]  [ลบ]         │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─ Sender card ─────────────────────┐  │
│  │  MYSHOP                           │  │
│  │  badge-warning: PENDING           │  │
│  │  ขอเมื่อ: 2026-03-08             │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─ Sender card ─────────────────────┐  │
│  │  OLDNAME                          │  │
│  │  badge-error: REJECTED            │  │
│  │  เหตุผล: ชื่อไม่ตรงกับธุรกิจ        │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Key Details:**
- Cards: grid 1 col mobile, 2-3 cols desktop
- Status: APPROVED=emerald, PENDING=yellow, REJECTED=red
- Default sender: sky border glow highlight
- Request new: modal with sender name input + business docs upload
- Empty state: tag icon + "ยังไม่มี Sender Name" + "ขอ Sender Name แรก"

---

## Page 6: เติมเงิน (`/dashboard/topup`)

**Purpose:** Purchase credits / billing

```
┌─────────────────────────────────────────┐
│ 💰 เติมเงิน                             │
├─────────────────────────────────────────┤
│                                         │
│  ┌─ Balance card (glass, sky glow) ──┐  │
│  │                                   │  │
│  │  ยอดเครดิตคงเหลือ                  │  │
│  │  neon-blue: 500.00                │  │
│  │  ≈ 2,273 SMS                      │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─ Package grid (2-4 cols) ─────────┐  │
│  │                                   │  │
│  │  ┌─ glass card-glow ──────────┐   │  │
│  │  │ SMSOK A                    │   │  │
│  │  │ ฿500                       │   │  │
│  │  │ 2,273 SMS | ฿0.220/SMS    │   │  │
│  │  │ [เลือก]                    │   │  │
│  │  └────────────────────────────┘   │  │
│  │                                   │  │
│  │  ┌─ glass card-glow (best) ───┐   │  │
│  │  │ ★ SMSOK C — Best Seller   │   │  │
│  │  │ ฿10,000 (+15% bonus)      │   │  │
│  │  │ 52,273 SMS | ฿0.191/SMS   │   │  │
│  │  │ [btn-primary: เลือก]       │   │  │
│  │  └────────────────────────────┘   │  │
│  │  ...                              │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─ Payment section (glass) ─────────┐  │
│  │                                   │  │
│  │  แพ็กเกจที่เลือก: SMSOK C ฿10,000 │  │
│  │                                   │  │
│  │  วิธีชำระเงิน:                     │  │
│  │  (○) โอนเงิน / PromptPay          │  │
│  │  (○) บัตรเครดิต                    │  │
│  │                                   │  │
│  │  ┌─ QR Code area ──────────────┐  │  │
│  │  │  [QR Code image]           │  │  │
│  │  │  หรือ โอนเข้าบัญชี:         │  │  │
│  │  │  ธ.กสิกร xxx-x-xxxxx-x    │  │  │
│  │  └────────────────────────────┘  │  │
│  │                                   │  │
│  │  อัพโหลดสลิป:                     │  │
│  │  [Drop zone — ลากสลิปมาวางที่นี่]  │  │
│  │                                   │  │
│  │  [btn-primary: ยืนยันการชำระเงิน]  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─ Transaction history (glass) ─────┐  │
│  │ ประวัติการเติมเงิน                  │  │
│  │ วันที่       แพ็กเกจ  จำนวน  สถานะ  │  │
│  │ 2026-03-01  C      ฿10,000 ✓     │  │
│  │ 2026-02-15  A      ฿500    ✓     │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Key Details:**
- Balance card: prominent neon-blue value, sky border glow
- Package grid: reuse pricing card design from landing page
- Selected package: sky border highlight + checkmark
- QR code: centered in glass sub-card
- Slip upload: drag-drop zone with dashed border
- Transaction history: simple table with status badges
- Radio buttons: custom styled with sky-400 active ring

---

## Page 7: API Keys (`/dashboard/api-keys`)

**Purpose:** Manage API authentication keys

```
┌─────────────────────────────────────────┐
│ 🔑 API Keys               [+ สร้าง Key] │
├─────────────────────────────────────────┤
│                                         │
│  ┌─ Info banner (glass) ─────────────┐  │
│  │ 📖 API Documentation              │  │
│  │ ดู docs ได้ที่ docs.smsok.com      │  │
│  │ [btn-glass: เปิด API Docs →]     │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─ API Key card (glass card-glow) ──┐  │
│  │                                   │  │
│  │  Production Key                   │  │
│  │  badge-success: ACTIVE            │  │
│  │                                   │  │
│  │  ┌─ Key display ───────────────┐  │  │
│  │  │ sk_live_••••••••••••ab3f    │  │  │
│  │  │ [👁 Show] [📋 Copy]         │  │  │
│  │  └─────────────────────────────┘  │  │
│  │                                   │  │
│  │  สร้าง: 2026-02-01               │  │
│  │  ใช้ล่าสุด: 2 ชั่วโมงที่แล้ว         │  │
│  │  Requests: 12,345                 │  │
│  │                                   │  │
│  │  [btn-glass: Regenerate]          │  │
│  │  [btn-danger: Revoke]             │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─ Code example (glass) ────────────┐  │
│  │  ┌─ terminal header ──────────┐   │  │
│  │  │ ● ● ●  curl example       │   │  │
│  │  ├────────────────────────────┤   │  │
│  │  │ curl -X POST \             │   │  │
│  │  │   api.smsok.com/v1/send \  │   │  │
│  │  │   -H "Authorization: ..." │   │  │
│  │  │   -d '{"to":"089..."}'    │   │  │
│  │  └────────────────────────────┘   │  │
│  │  [📋 Copy]                        │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─ Usage chart (glass) ─────────────┐  │
│  │  API Requests (7 วัน)              │  │
│  │  ┌────────────────────────────┐   │  │
│  │  │  ▂ ▄ ▆ █ ▅ ▃ ▇            │   │  │
│  │  │  M T W T F S S            │   │  │
│  │  └────────────────────────────┘   │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Key Details:**
- Key display: monospace font, masked by default, reveal on click
- Copy button: click → "Copied!" toast, sky-400 flash
- Code example: terminal mockup (same style as landing page code preview)
- Usage chart: simple bar chart with sky-400 bars
- Regenerate: confirmation modal (glass-elevated) with warning
- Revoke: btn-danger with double-confirm
- Create key: modal — name + permissions (read/write/admin)

---

## Page 8: ตั้งค่า (`/dashboard/settings`)

**Purpose:** Account settings and preferences

```
┌─────────────────────────────────────────┐
│ ⚙ ตั้งค่า                               │
├─────────────────────────────────────────┤
│                                         │
│  ┌─ Tab / Section nav ───────────────┐  │
│  │ [ข้อมูลบัญชี] [ความปลอดภัย] [การแจ้งเตือน] │
│  └───────────────────────────────────┘  │
│                                         │
│  ── ข้อมูลบัญชี ──                       │
│                                         │
│  ┌─ Profile section (glass) ─────────┐  │
│  │                                   │  │
│  │  ┌─ Avatar ─┐                     │  │
│  │  │  [S]     │  สมชาย ใจดี          │  │
│  │  │ gradient │  somchai@email.com   │  │
│  │  └──────────┘  สมาชิกตั้งแต่ 2026-02│  │
│  │                                   │  │
│  │  ชื่อ-นามสกุล                      │  │
│  │  [input-glass: สมชาย ใจดี]        │  │
│  │                                   │  │
│  │  อีเมล                            │  │
│  │  [input-glass: somchai@email.com] │  │
│  │                                   │  │
│  │  เบอร์โทร                          │  │
│  │  [input-glass: 089-123-4567]      │  │
│  │                                   │  │
│  │  [btn-primary: บันทึก]             │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ── ความปลอดภัย ──                      │
│                                         │
│  ┌─ Password section (glass) ────────┐  │
│  │  เปลี่ยนรหัสผ่าน                    │  │
│  │  [input-glass: รหัสผ่านปัจจุบัน]     │  │
│  │  [input-glass: รหัสผ่านใหม่]        │  │
│  │  [input-glass: ยืนยันรหัสผ่านใหม่]   │  │
│  │  [btn-primary: เปลี่ยนรหัสผ่าน]     │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─ Sessions section (glass) ────────┐  │
│  │  อุปกรณ์ที่ล็อกอินอยู่                │  │
│  │  Chrome / macOS — กรุงเทพฯ (ปัจจุบัน)│  │
│  │  Safari / iOS — กรุงเทพฯ          │  │
│  │  [btn-danger: ออกจากทุกอุปกรณ์]    │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ── การแจ้งเตือน ──                      │
│                                         │
│  ┌─ Notification prefs (glass) ──────┐  │
│  │  แจ้งเตือนทางอีเมล                  │  │
│  │  [toggle] SMS ส่งสำเร็จ              │  │
│  │  [toggle] SMS ล้มเหลว               │  │
│  │  [toggle] เครดิตเหลือน้อย             │  │
│  │  [toggle] รายงานประจำสัปดาห์          │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ── Danger Zone ──                      │
│                                         │
│  ┌─ Danger section (glass, red border)┐  │
│  │  ลบบัญชี                           │  │
│  │  การลบบัญชีจะลบข้อมูลทั้งหมดถาวร     │  │
│  │  [btn-danger: ลบบัญชีของฉัน]        │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Key Details:**
- Sections: use glass cards, separated by section headers
- Tabs: same underline style as contacts page
- Toggle switches: `w-10 h-5 rounded-full` — off=`bg-white/10`, on=`bg-sky-500` with white dot
- Avatar: gradient circle `from-sky-500/30 to-indigo-500/20` with initial
- Danger zone: glass card with `border-red-500/15` border
- Delete account: double-confirm modal — type "DELETE" to confirm
- Save buttons: only enabled when form is dirty (changed)

---

## Priority Order for Implementation

| Priority | Page | Complexity | Notes |
|----------|------|-----------|-------|
| P0 | `/dashboard/send` | Medium | Core feature — must work |
| P0 | `/dashboard/messages` | Medium | View sent history |
| P1 | `/dashboard/contacts` | Medium | 3 tabs (list, groups, import) |
| P1 | `/dashboard/topup` | High | Payment flow, QR, slip upload |
| P1 | `/dashboard/senders` | Low | Simple CRUD cards |
| P2 | `/dashboard/campaigns` | High | Multi-step create flow |
| P2 | `/dashboard/api-keys` | Medium | Key management + code preview |
| P2 | `/dashboard/settings` | Medium | 3 sections, toggles |

---

## File Structure

```
app/(dashboard)/dashboard/
├── layout.tsx              ← NEW: shared sidebar + topbar
├── page.tsx                ← existing (dashboard home)
├── DashboardContent.tsx    ← refactor to use layout
├── send/
│   └── page.tsx            ← P0
├── messages/
│   └── page.tsx            ← P0
├── campaigns/
│   └── page.tsx            ← P2
├── contacts/
│   └── page.tsx            ← P1
├── senders/
│   └── page.tsx            ← P1
├── topup/
│   └── page.tsx            ← P1
├── api-keys/
│   └── page.tsx            ← P2
└── settings/
    └── page.tsx            ← P2
```

---

*Designed by UXUI Oracle — Web3 Dark + Blue Glassmorphism v3*
*All pages use existing CSS classes from globals.css — no new CSS needed*
