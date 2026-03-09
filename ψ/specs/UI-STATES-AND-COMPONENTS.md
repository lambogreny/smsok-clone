# UI States, Responsive, Toast, Modal Spec

> UXUI Oracle | 2026-03-09

---

## 1. ERROR STATES — ทุกหน้า

### 1A. Empty State (ไม่มีข้อมูล)

```
┌─────────────────────────────┐
│                             │
│      ┌──────────────┐       │
│      │   🔲 icon    │       │
│      │  (32x32)     │       │
│      └──────────────┘       │
│                             │
│    หัวข้อ (text-white/30)    │
│    คำอธิบาย (text-white/15)  │
│                             │
│      [ CTA Button ]         │
│                             │
└─────────────────────────────┘
```

```tsx
function EmptyState({
  icon,        // SVG element
  title,       // "ยังไม่มีรายการ"
  description, // "เริ่มส่งข้อความแรกของคุณ"
  action,      // { label: "ส่งข้อความ", href: "/dashboard/send" }
}: EmptyStateProps) {
  return (
    <div className="glass p-12 text-center animate-fade-in-up">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center">
        <span className="text-white/10">{icon}</span>
      </div>
      <p className="text-sm text-white/30 mb-1">{title}</p>
      <p className="text-xs text-white/15 mb-5">{description}</p>
      {action && (
        <Link href={action.href}
          className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold">
          {action.label}
        </Link>
      )}
    </div>
  );
}
```

**ข้อความ Empty State ทุกหน้า:**

| หน้า | title | description | CTA |
|------|-------|-------------|-----|
| ภาพรวม (recent) | ยังไม่มีรายการ | เริ่มส่งข้อความแรกของคุณ | ส่งข้อความ → /dashboard/send |
| ประวัติการส่ง | ยังไม่มีรายการ | เริ่มส่งข้อความแรกของคุณ | ส่งข้อความใหม่ → /dashboard/send |
| ประวัติ (filter ไม่เจอ) | ไม่พบรายการที่ค้นหา | ลองเปลี่ยนเงื่อนไขการค้นหา | ล้างตัวกรอง (onClick reset) |
| รายชื่อผู้ติดต่อ | ยังไม่มีรายชื่อ | เพิ่มรายชื่อผู้ติดต่อเพื่อส่งข้อความได้ง่ายขึ้น | + เพิ่มรายชื่อ (onClick) |
| ชื่อผู้ส่ง | ยังไม่มีรายการ | ยื่นขอชื่อผู้ส่งเพื่อใช้ส่งข้อความในชื่อแบรนด์ | ส่งคำขอ (scroll to form) |
| คีย์ API | ยังไม่มีคีย์ API | สร้างคีย์ API เพื่อเชื่อมต่อระบบของคุณ | สร้างคีย์ใหม่ (onClick) |

### 1B. Loading State (กำลังโหลด)

```tsx
function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass overflow-hidden animate-fade-in">
      {/* Table header skeleton */}
      <div className="flex gap-4 px-5 py-3 border-b border-white/5">
        {[120, 200, 80, 100, 80].map((w, i) => (
          <div key={i} className="skeleton h-3 rounded" style={{ width: w }} />
        ))}
      </div>
      {/* Table rows skeleton */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-5 py-4 border-b border-white/[0.02]"
             style={{ animationDelay: `${i * 0.05}s` }}>
          <div className="skeleton h-4 w-28 rounded" />
          <div className="skeleton h-4 w-40 rounded" />
          <div className="skeleton h-4 w-16 rounded" />
          <div className="skeleton h-4 w-20 rounded" />
          <div className="skeleton h-4 w-14 rounded" />
        </div>
      ))}
    </div>
  );
}
```

**Stats skeleton:**

```tsx
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger-children">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="glass p-5">
          <div className="skeleton h-3 w-16 rounded mb-3" />
          <div className="skeleton h-7 w-20 rounded mb-2" />
          <div className="skeleton h-2 w-12 rounded" />
        </div>
      ))}
    </div>
  );
}
```

### 1C. Error State (โหลดผิดพลาด)

```
┌─────────────────────────────┐
│                             │
│      ┌──────────────┐       │
│      │   ⚠ icon     │       │
│      │  (red tint)  │       │
│      └──────────────┘       │
│                             │
│  ไม่สามารถโหลดข้อมูลได้      │
│  กรุณาลองใหม่อีกครั้ง        │
│                             │
│      [ ลองใหม่ ]            │
│                             │
└─────────────────────────────┘
```

```tsx
function ErrorState({
  title = "ไม่สามารถโหลดข้อมูลได้",
  description = "กรุณาลองใหม่อีกครั้ง หากยังมีปัญหาติดต่อทีมงาน",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="glass p-12 text-center border-red-500/10 animate-fade-in-up">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/[0.05] border border-red-500/10 flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1" className="text-red-400/40">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <p className="text-sm text-white/30 mb-1">{title}</p>
      <p className="text-xs text-white/15 mb-5">{description}</p>
      {onRetry && (
        <button onClick={onRetry}
          className="btn-glass inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
          </svg>
          ลองใหม่
        </button>
      )}
    </div>
  );
}
```

---

## 2. RESPONSIVE BREAKPOINTS

### Breakpoint Map

| Token | Width | Device | Layout |
|-------|-------|--------|--------|
| `xs` | 0–374px | iPhone SE | Stack ทุกอย่าง, ซ่อน sidebar |
| `sm` | 375–767px | Mobile | 1 col, cards แทน table, bottom nav |
| `md` | 768–1023px | Tablet | Sidebar 240px + content, 2 col grids |
| `lg` | 1024–1279px | Desktop | Full layout, 3-4 col grids |
| `xl` | 1280px+ | Wide | max-w-6xl centered, spacious |

### Component Responsive Rules

**Sidebar:**
```
xs–sm (< 768px): ซ่อน sidebar → ใช้ bottom nav แทน
md+ (≥ 768px):   แสดง sidebar 240px fixed
```

**Data Tables:**
```
xs–sm (< 768px): ซ่อนตาราง → แสดง card list แทน
md+ (≥ 768px):   แสดงตาราง ซ่อนคอลัมน์ที่ไม่จำเป็น
lg+ (≥ 1024px):  แสดงตาราง ทุกคอลัมน์
```

**ตารางคอลัมน์ที่ซ่อน:**

| คอลัมน์ | xs-sm | md | lg+ |
|---------|-------|----|-----|
| หมายเลขผู้รับ | ✅ card | ✅ | ✅ |
| ข้อความ | ✅ card | ซ่อน | ✅ |
| ชื่อผู้ส่ง | ✅ card | ✅ | ✅ |
| สถานะ | ✅ card | ✅ | ✅ |
| วันเวลา | ✅ card | ✅ | ✅ |
| เครดิต | ✅ card | ซ่อน | ✅ |

**Filter Bar:**
```
xs–sm: stack ทุก filter เป็น col (space-y-3)
md+:   flex row (gap-3)
```

**Stats Grid:**
```
xs–sm: grid-cols-2
md+:   grid-cols-4
```

**Form Layouts:**
```
xs–sm: 1 column
md+:   2 columns (grid-cols-2)
```

**Page Padding:**
```
xs–sm: p-4
md+:   p-6 md:p-8
```

**Pricing Cards:**
```
xs–sm: grid-cols-1
sm:    grid-cols-2
lg:    grid-cols-3 หรือ grid-cols-4
```

### Specific Page Layouts

**Send SMS (lg+):**
```
┌─────────────────────────────────┐
│ ┌──────────────┐ ┌───────────┐  │
│ │ Compose      │ │ Preview   │  │
│ │ (col-span-3) │ │ (col-span-2)│
│ │              │ │ Cost      │  │
│ └──────────────┘ └───────────┘  │
└─────────────────────────────────┘
```
**Send SMS (sm):**
```
┌─────────────┐
│ Compose     │
│ (full width)│
├─────────────┤
│ Preview     │
├─────────────┤
│ Cost + Send │
└─────────────┘
```

**Topup Cards:**
```
xs:  1 col → scroll vertical
sm:  2 cols
lg:  3 cols
xl:  4 cols
```

### Touch Target Sizes (Mobile a11y)

```
ปุ่มทุกอัน:    min-h-[44px] min-w-[44px]
Sidebar item: min-h-[44px] py-2.5
Table row:    min-h-[48px]
Input:        min-h-[44px]
Mobile nav:   min-h-[48px] per item
```

---

## 3. TOAST / NOTIFICATION

### Design

```
┌──────────────────────────────────────┐
│ ● ส่งข้อความสำเร็จ 3 หมายเลข    ✕  │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ ● เครดิตไม่เพียงพอ กรุณาเติมเครดิต ✕ │
└──────────────────────────────────────┘
```

### Types

| Type | Dot color | Border | bg |
|------|-----------|--------|-----|
| success | emerald-400 | emerald-500/15 | emerald-500/[0.06] |
| error | red-400 | red-500/15 | red-500/[0.06] |
| warning | amber-400 | amber-500/15 | amber-500/[0.06] |
| info | sky-400 | sky-500/15 | sky-500/[0.06] |

### Component

```tsx
function Toast({ type, message, onClose }: ToastProps) {
  const colors = {
    success: { dot: "bg-emerald-400", border: "border-emerald-500/15", bg: "bg-emerald-500/[0.06]", text: "text-emerald-300" },
    error:   { dot: "bg-red-400",     border: "border-red-500/15",     bg: "bg-red-500/[0.06]",     text: "text-red-300" },
    warning: { dot: "bg-amber-400",   border: "border-amber-500/15",   bg: "bg-amber-500/[0.06]",   text: "text-amber-300" },
    info:    { dot: "bg-sky-400",     border: "border-sky-500/15",     bg: "bg-sky-500/[0.06]",     text: "text-sky-300" },
  };
  const c = colors[type];

  return (
    <div className={`
      fixed top-4 right-4 z-[100] max-w-sm
      ${c.bg} ${c.border} border
      backdrop-blur-2xl rounded-xl px-4 py-3
      flex items-center gap-3
      shadow-[0_8px_32px_rgba(0,0,0,0.4)]
      toast-enter
    `}>
      <span className={`w-2 h-2 rounded-full ${c.dot} flex-shrink-0
        shadow-[0_0_8px_currentColor]`} />
      <p className={`text-sm ${c.text} flex-1`}>{message}</p>
      <button onClick={onClose}
        className="text-white/20 hover:text-white/50 transition-colors flex-shrink-0 p-1">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
```

### useToast Hook

```tsx
function useToast() {
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const show = (type: "success" | "error" | "warning" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000); // auto-dismiss 4s
  };

  return { toast, show, dismiss: () => setToast(null) };
}
```

### ข้อความ Toast ทุกสถานการณ์

| Action | Type | Message |
|--------|------|---------|
| ส่ง SMS สำเร็จ | success | `ส่งข้อความสำเร็จ X หมายเลข` |
| ส่ง SMS ล้มเหลว | error | `ส่งไม่สำเร็จ: {error}` |
| เครดิตไม่พอ | warning | `เครดิตไม่เพียงพอ กรุณาเติมเครดิต` |
| เพิ่มรายชื่อ | success | `เพิ่มรายชื่อสำเร็จ` |
| ลบรายชื่อ | success | `ลบรายชื่อแล้ว` |
| สร้าง API Key | success | `สร้างคีย์เรียบร้อยแล้ว` |
| ลบ API Key | success | `ลบคีย์แล้ว` |
| คัดลอก API Key | info | `คัดลอกแล้ว` |
| เปลี่ยนรหัสผ่าน | success | `เปลี่ยนรหัสผ่านเรียบร้อยแล้ว` |
| ส่งคำขอ Sender | success | `ส่งคำขอเรียบร้อยแล้ว` |
| Session expired | warning | `เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่` |
| Network error | error | `ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่` |
| Generic error | error | `เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง` |

---

## 4. CONFIRM MODAL / DIALOG

### Design

```
┌─ backdrop (bg-black/60 backdrop-blur-sm) ────────┐
│                                                   │
│    ┌─────────────────────────────────────┐        │
│    │  glass-elevated                     │        │
│    │                                     │        │
│    │  ┌────┐                             │        │
│    │  │ ⚠  │  ต้องการลบรายการนี้?        │        │
│    │  └────┘                             │        │
│    │                                     │        │
│    │  การลบจะไม่สามารถเรียกคืนได้        │        │
│    │                                     │        │
│    │       [ ยกเลิก ]  [ ยืนยันลบ ]     │        │
│    │                                     │        │
│    └─────────────────────────────────────┘        │
│                                                   │
└───────────────────────────────────────────────────┘
```

### Component

```tsx
function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "ยืนยัน",
  cancelLabel = "ยกเลิก",
  variant = "danger",  // "danger" | "warning" | "info"
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const variants = {
    danger: {
      icon: "text-red-400/60",
      iconBg: "bg-red-500/[0.08] border-red-500/10",
      btn: "btn-danger",
    },
    warning: {
      icon: "text-amber-400/60",
      iconBg: "bg-amber-500/[0.08] border-amber-500/10",
      btn: "btn-primary",
    },
    info: {
      icon: "text-sky-400/60",
      iconBg: "bg-sky-500/[0.08] border-sky-500/10",
      btn: "btn-primary",
    },
  };
  const v = variants[variant];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
           onClick={onCancel} />

      {/* Dialog */}
      <div className="relative glass-elevated p-6 sm:p-8 max-w-sm w-full animate-fade-in-up"
           style={{ animationDuration: "0.2s" }}>

        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl ${v.iconBg} border flex items-center justify-center mb-4`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.5" className={v.icon}>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        {/* Text */}
        <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-white/40 mb-6">{description}</p>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <button onClick={onCancel} disabled={loading}
            className="btn-glass px-5 py-2.5 rounded-xl text-sm font-medium">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`${v.btn} px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-40`}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                กำลังดำเนินการ...
              </span>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### ข้อความ Confirm Dialog ทุกสถานการณ์

| Action | variant | title | description | confirmLabel |
|--------|---------|-------|-------------|-------------|
| ลบรายชื่อ | danger | ต้องการลบรายชื่อนี้? | การลบจะไม่สามารถเรียกคืนได้ | ยืนยันลบ |
| ลบ API Key | danger | ต้องการลบคีย์ API นี้? | ระบบที่ใช้คีย์นี้จะไม่สามารถเชื่อมต่อได้อีก | ยืนยันลบ |
| ปิดใช้งาน API Key | warning | ต้องการปิดใช้งานคีย์นี้? | ระบบที่ใช้คีย์นี้จะไม่สามารถส่งข้อความได้ชั่วคราว | ปิดใช้งาน |
| ส่ง SMS (batch) | info | ยืนยันการส่งข้อความ? | จะส่งถึง X หมายเลข ใช้เครดิต Y | ส่งข้อความ |
| ออกจากระบบ | warning | ต้องการออกจากระบบ? | คุณจะต้องเข้าสู่ระบบใหม่อีกครั้ง | ออกจากระบบ |

---

## 5. FILE STRUCTURE — Shared Components

```
app/components/ui/
├── EmptyState.tsx       ← empty state (icon + title + desc + CTA)
├── ErrorState.tsx       ← error with retry button
├── LoadingSkeleton.tsx  ← table/stats skeleton with shimmer
├── Toast.tsx            ← notification toast + useToast hook
├── ConfirmDialog.tsx    ← confirm modal (danger/warning/info)
├── StatusBadge.tsx      ← dot + glow + label
├── Pagination.tsx       ← page numbers + per-page + info text
└── FilterBar.tsx        ← status dropdown + date range + search
```
