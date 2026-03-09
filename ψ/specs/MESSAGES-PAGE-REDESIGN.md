# Messages Page Redesign + Shared Sidebar Spec

> UXUI Oracle | 2026-03-09
> อ้างอิงจาก: SMSOK.co, Twilio Console, MessageBird, ThaiBulkSMS

---

## 1. Messages Page — `/dashboard/messages`

### Layout Overview

```
┌─────────────────────────────────────────────────────────┐
│  Page Header                                            │
│  ┌───────────────────────────────────┐  ┌────────────┐  │
│  │ ประวัติการส่งข้อความ              │  │ ส่งข้อความ →│  │
│  │ รายการข้อความทั้งหมด (1,234)     │  └────────────┘  │
│  └───────────────────────────────────┘                   │
├─────────────────────────────────────────────────────────┤
│  Filter Bar (glass)                                     │
│  ┌──────────┐ ┌──────────────────┐ ┌─────────────────┐  │
│  │ สถานะ  ▼ │ │ 📅 วันที่เริ่ม–สิ้นสุด │ │ 🔍 ค้นหาเบอร์... │  │
│  └──────────┘ └──────────────────┘ └─────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  Summary Stats (4 mini cards)                           │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │
│  │ ทั้งหมด │ │ สำเร็จ  │ │ รอส่ง  │ │ ไม่สำเร็จ│           │
│  │ 1,234  │ │ 1,180  │ │   42   │ │   12   │           │
│  └────────┘ └────────┘ └────────┘ └────────┘           │
├─────────────────────────────────────────────────────────┤
│  Table (glass) — Desktop View                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │ หมายเลขผู้รับ │ ข้อความ    │ ผู้ส่ง   │ สถานะ │ วันเวลา   │ เครดิต ││
│  ├─────────────────────────────────────────────────────┤│
│  │ 089-123-4567 │ สวัสดีคร...│ EasySlip│ ●สำเร็จ│ 9 มี.ค. 14:32│  0.22 ││
│  │ 091-234-5678 │ OTP: 4821  │ MyBrand │ ●รอส่ง │ 9 มี.ค. 14:30│  0.22 ││
│  │ 086-345-6789 │ แจ้งชำระ...│ EasySlip│ ●ไม่สำเร็จ│ 9 มี.ค. 14:28│  0.22 ││
│  └─────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│  Pagination                                             │
│  ◀ ก่อนหน้า  1  2  3  ...  24  ถัดไป ▶  │ แสดง 50 ▼  │  │
└─────────────────────────────────────────────────────────┘
```

### Filter Bar

```tsx
{/* Filter Bar */}
<div className="glass p-4 mb-6 flex flex-col sm:flex-row gap-3">
  {/* Status Dropdown */}
  <div className="relative">
    <select className="input-glass pr-10 appearance-none text-sm min-w-[140px]">
      <option value="">สถานะทั้งหมด</option>
      <option value="delivered">ส่งสำเร็จ</option>
      <option value="sent">กำลังส่ง</option>
      <option value="pending">รอดำเนินการ</option>
      <option value="failed">ส่งไม่สำเร็จ</option>
    </select>
    {/* chevron icon */}
  </div>

  {/* Date Range */}
  <div className="flex gap-2 items-center">
    <input type="date" className="input-glass text-sm" />
    <span className="text-white/20 text-xs">ถึง</span>
    <input type="date" className="input-glass text-sm" />
  </div>

  {/* Search */}
  <div className="relative flex-1">
    <input
      type="text"
      className="input-glass text-sm pl-9"
      placeholder="ค้นหาหมายเลขหรือข้อความ..."
    />
    {/* search icon absolute left */}
  </div>
</div>
```

### Summary Stats (Mini Cards)

```tsx
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
  <div className="glass p-4 text-center">
    <p className="text-xl font-bold text-white">{total}</p>
    <p className="text-[11px] text-white/30 mt-0.5">ทั้งหมด</p>
  </div>
  <div className="glass p-4 text-center">
    <p className="text-xl font-bold text-emerald-400">{delivered}</p>
    <p className="text-[11px] text-white/30 mt-0.5">ส่งสำเร็จ</p>
  </div>
  <div className="glass p-4 text-center">
    <p className="text-xl font-bold text-amber-400">{pending}</p>
    <p className="text-[11px] text-white/30 mt-0.5">รอดำเนินการ</p>
  </div>
  <div className="glass p-4 text-center">
    <p className="text-xl font-bold text-red-400">{failed}</p>
    <p className="text-[11px] text-white/30 mt-0.5">ส่งไม่สำเร็จ</p>
  </div>
</div>
```

### Table Columns (Desktop)

| Column | Key | Width | Style |
|--------|-----|-------|-------|
| หมายเลขผู้รับ | `recipient` | auto | `font-mono text-xs text-white/70` — format: `089-123-4567` |
| ข้อความ | `message` | max-w-[200px] | `text-white/50 text-xs truncate` — tooltip for full text |
| ชื่อผู้ส่ง | `senderName` | auto | `text-white/50` |
| สถานะ | `status` | auto | badge with color dot |
| วันเวลา | `createdAt` | auto | `text-white/30 text-xs` — format: `9 มี.ค. 14:32` |
| เครดิต | `creditCost` | auto | `text-white/50 font-mono text-right` |

### Status Badge Design

```
สถานะ           สี              Dot shadow
────────────────────────────────────────────
ส่งสำเร็จ       emerald-400     shadow-[0_0_6px_rgba(52,211,153,0.4)]
กำลังส่ง        sky-400         shadow-[0_0_6px_rgba(56,189,248,0.4)]
รอดำเนินการ     amber-400       shadow-[0_0_6px_rgba(251,191,36,0.4)]
ส่งไม่สำเร็จ    red-400         shadow-[0_0_6px_rgba(248,113,113,0.4)]
```

```tsx
{/* Status badge example */}
<span className="inline-flex items-center gap-1.5">
  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]" />
  <span className="text-xs text-emerald-400">ส่งสำเร็จ</span>
</span>
```

### Mobile View — Card Layout

เมื่อ screen < `md` (768px) เปลี่ยนจากตารางเป็น card list:

```
┌─────────────────────────────┐
│ 089-123-4567    ● ส่งสำเร็จ │
│ สวัสดีครับ ขอแจ้งยอดชำระ...  │
│ EasySlip  │  0.22 เครดิต    │
│ 9 มี.ค. 2569 — 14:32       │
└─────────────────────────────┘
```

```tsx
{/* Mobile Card View */}
<div className="md:hidden space-y-3">
  {messages.map((msg) => (
    <div key={msg.id} className="glass p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-sm text-white/70">{formatPhone(msg.recipient)}</span>
        <StatusBadge status={msg.status} />
      </div>
      <p className="text-xs text-white/40 line-clamp-2 mb-3">{msg.message || "—"}</p>
      <div className="flex items-center justify-between text-[11px] text-white/25">
        <span>{msg.senderName}</span>
        <span>{msg.creditCost} เครดิต</span>
      </div>
      <div className="text-[11px] text-white/20 mt-1">
        {formatDate(msg.createdAt)}
      </div>
    </div>
  ))}
</div>
```

### Pagination

```tsx
<div className="flex items-center justify-between mt-6">
  <div className="text-xs text-white/30">
    แสดง {from}–{to} จาก {total} รายการ
  </div>
  <div className="flex items-center gap-1">
    <button className="btn-glass px-3 py-1.5 text-xs rounded-lg disabled:opacity-30"
            disabled={page === 1}>
      ก่อนหน้า
    </button>
    {/* Page numbers */}
    {pages.map(p => (
      <button
        className={`w-8 h-8 rounded-lg text-xs font-medium ${
          p === currentPage
            ? "bg-sky-500/20 text-sky-400 border border-sky-500/20"
            : "btn-glass"
        }`}
      >
        {p}
      </button>
    ))}
    <button className="btn-glass px-3 py-1.5 text-xs rounded-lg disabled:opacity-30"
            disabled={page === totalPages}>
      ถัดไป
    </button>
  </div>
  <div className="hidden sm:block">
    <select className="input-glass text-xs py-1.5 pr-8">
      <option>แสดง 25</option>
      <option>แสดง 50</option>
      <option>แสดง 100</option>
    </select>
  </div>
</div>
```

### Interactions

| Action | Behavior |
|--------|----------|
| คลิกแถว | Expand row แสดงข้อความเต็ม + รายละเอียด (message ID, timestamp exact) |
| ค้นหา | Filter แบบ debounce 300ms ค้นจาก recipient + message content |
| เปลี่ยนสถานะ | Re-fetch ด้วย query param `?status=delivered` |
| เปลี่ยนวันที่ | Re-fetch ด้วย `?from=2026-03-01&to=2026-03-09` |
| เปลี่ยนหน้า | URL query `?page=2&limit=50` |
| Empty state (ไม่มีผลลัพธ์) | แสดง icon + "ไม่พบรายการที่ค้นหา" + ปุ่ม "ล้างตัวกรอง" |

---

## 2. Shared Sidebar — Consistent ทุกหน้า

### ปัญหาปัจจุบัน

- **DashboardContent.tsx** มี sidebar ของตัวเอง (labels ภาษาไทย)
- **DashboardShell.tsx** มี sidebar แยก (labels English: "Dashboard", "Campaigns", "Sender Names")
- 4 หน้าไม่มี shell เลย (senders, topup, api-keys, settings)

### Solution: ใช้ DashboardShell.tsx เป็น single source of truth

**ขั้นตอน:**
1. แก้ DashboardShell.tsx ให้ labels เป็นไทยทั้งหมด (ตาม copywriting spec)
2. ทุกหน้า wrap ด้วย `<DashboardShell>` — **ไม่มีข้อยกเว้น**
3. ลบ sidebar ออกจาก DashboardContent.tsx — ใช้ Shell แทน

### Sidebar Labels (Final)

```tsx
const sidebarItems = [
  // === เมนูหลัก ===
  { label: "ภาพรวม",          href: "/dashboard",           section: "main" },
  { label: "ส่ง SMS",          href: "/dashboard/send",      section: "main" },
  { label: "ประวัติการส่ง",     href: "/dashboard/messages",  section: "main" },
  { label: "แคมเปญ",          href: "/dashboard/campaigns",  section: "main" },

  // === จัดการ ===
  { label: "รายชื่อผู้ติดต่อ",  href: "/dashboard/contacts",  section: "manage" },
  { label: "ชื่อผู้ส่ง",        href: "/dashboard/senders",   section: "manage" },
  { label: "เติมเครดิต",       href: "/dashboard/topup",      section: "manage" },

  // === ตั้งค่า ===
  { label: "คีย์ API",         href: "/dashboard/api-keys",   section: "settings" },
  { label: "ตั้งค่า",          href: "/dashboard/settings",   section: "settings" },
];
```

### Section Headers

| เดิม | ใหม่ |
|------|------|
| `Main` | `เมนูหลัก` |
| `Management` | `จัดการ` |
| `Settings` | `ตั้งค่า` |

### Mobile Bottom Nav

```tsx
// 5 items: หน้าหลัก, ส่ง, [+ FAB], ข้อความ, เพิ่มเติม
<nav className="md:hidden fixed bottom-0 ...">
  <NavItem href="/dashboard"          icon={grid}   label="หน้าหลัก" />
  <NavItem href="/dashboard/send"     icon={send}   label="ส่ง" />
  <FAB href="/dashboard/send" /> {/* center floating action button */}
  <NavItem href="/dashboard/messages" icon={chat}   label="ข้อความ" />
  <MoreMenu /> {/* opens sheet with remaining menu items */}
</nav>
```

### DashboardShell Title Map

ทุกหน้าต้องส่ง `title` เป็นภาษาไทย:

| Page | Title |
|------|-------|
| dashboard | `ภาพรวม` |
| send | `ส่งข้อความ` |
| messages | `ประวัติการส่ง` |
| campaigns | `แคมเปญ` |
| contacts | `รายชื่อผู้ติดต่อ` |
| senders | `ชื่อผู้ส่ง` |
| topup | `เติมเครดิต` |
| api-keys | `คีย์ API` |
| settings | `ตั้งค่า` |

### Footer

```tsx
<footer className="border-t border-white/[0.03] px-8 py-4 mt-8">
  <div className="flex items-center justify-between text-[11px] text-white/15">
    <span>v1.0</span>
    <span>&copy; SMSOK — ระบบส่ง SMS สำหรับธุรกิจ</span>
  </div>
</footer>
```

---

## 3. Implementation Priority

| Priority | Task | Files |
|----------|------|-------|
| P0 | แก้ 4 หน้าที่ขาด DashboardShell | senders, topup, api-keys, settings page.tsx |
| P0 | แก้ sidebar labels เป็นไทย | DashboardShell.tsx, DashboardContent.tsx |
| P0 | Redesign messages page (filter, table, mobile cards) | messages/page.tsx → split MessagesContent.tsx |
| P1 | Apply copywriting ทั้งเว็บ | ทุก component (ดู COPYWRITING-SPEC.md) |
| P1 | ลบ sidebar ออกจาก DashboardContent.tsx ใช้ Shell แทน | DashboardContent.tsx |
| P2 | เพิ่ม message body column ใน DB query | lib/actions/sms.ts |
