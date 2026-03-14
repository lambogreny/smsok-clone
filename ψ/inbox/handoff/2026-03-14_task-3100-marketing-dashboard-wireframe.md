# Task #3100 — Marketing Dashboard Wireframe

## Status: COMPLETED
**Agent**: Lead Dev (UXUI)
**Date**: 2026-03-14
**Commit**: `e59b178`

---

## 1. Marketing Dashboard (Analytics Page)

### Wireframe Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Marketing Dashboard                    [วันนี้|เดือนนี้] [สร้างแคมเปญ] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ ━━━━━━━  │ │ ━━━━━━━  │ │ ━━━━━━━  │ │ ━━━━━━━  │      │
│  │ ส่งทั้งหมด  │ │ สำเร็จ     │ │ อัตราสำเร็จ │ │ ล้มเหลว    │      │
│  │   1,234  │ │   1,180  │ │    96%   │ │     54   │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
│  ┌─── SMS คงเหลือ ──────────────────────────────────┐      │
│  │ ⚡ 45,200 SMS                        [เติมเครดิต] │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  ┌─── สัดส่วนสถานะ ─────┐ ┌─── รายละเอียดการส่ง ──────┐   │
│  │                      │ │                           │   │
│  │    ┌────────┐        │ │ สำเร็จ    ████████░░ 96%  │   │
│  │    │ DONUT  │        │ │ ส่งแล้ว   ██████░░░░ 62%  │   │
│  │    │ 1,234  │        │ │ รอส่ง     ██░░░░░░░░ 18%  │   │
│  │    │ ข้อความ │        │ │ ล้มเหลว   █░░░░░░░░░  4%  │   │
│  │    └────────┘        │ │                           │   │
│  │  ● สำเร็จ  ● ส่งแล้ว │ │ ⚠ อัตราล้มเหลวสูง (>10%) │   │
│  │  ● รอส่ง   ● ล้มเหลว │ │   (แสดงเมื่อ fail > 10%) │   │
│  └──────────────────────┘ └───────────────────────────┘   │
│                                                             │
│  ┌─── กิจกรรมล่าสุด ───────────────────── [ดูทั้งหมด →] ┐  │
│  │ สถานะ     เบอร์ผู้รับ        ผู้ส่ง      เครดิต        │  │
│  │ ● สำเร็จ   0891234567     SMSOK     1 SMS         │  │
│  │ ● ส่งแล้ว  0851112233     PROMO     2 SMS         │  │
│  │ ● ล้มเหลว  0869998877     SMSOK     1 SMS         │  │
│  │ ...8 rows, nansen-table-dense                     │  │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Design Specs

| Element | Spec |
|---------|------|
| **Stat Cards** | `rounded-lg`, top accent gradient line (2px), icon glow (radial-gradient 6% opacity), `stagger-children` animation |
| **Period Toggle** | Segmented control with `rounded-md` buttons, accent bg when active |
| **SMS Banner** | `rgba(accent-rgb, 0.04)` bg, Activity icon, "เติมเครดิต" CTA link |
| **Donut Chart** | 180px, 18px stroke, smooth 0.8s transitions, center text (total + label) |
| **Progress Bars** | 2px height, rounded-full, percentage + count labels |
| **Fail Alert** | Auto-shows when failure rate > 10%, error border + XCircle icon |
| **Recent Table** | `nansen-table-dense`, 8 rows, status dot + label, monospace phone numbers |
| **CTA Button** | "สร้างแคมเปญ" — accent bg, Zap icon, links to /dashboard/campaigns |

### Colors

- Primary accent: `--accent` (#00E2B5 teal)
- Secondary: `--accent-secondary` (#4779FF blue)
- Focus: `--accent-focus` (#5B4FFF purple)
- Success/Warning/Error for status indicators

---

## 2. Campaign Builder (Existing — Enhancement Notes)

### Current State
Campaign Builder อยู่ใน `CampaignsClient.tsx` เป็น inline animated panel (Framer Motion) ไม่ใช่ separate page

### Current Flow
```
[สร้างแคมเปญ] → Panel slides down
  ├── ชื่อแคมเปญ (text input)
  ├── ชื่อผู้ส่ง (SenderDropdown — approved senders only)
  ├── กลุ่มผู้รับ (CustomSelect — contact groups)
  ├── เทมเพลต (CustomSelect — with preview panel)
  ├── ตั้งเวลาส่ง (datetime picker, optional)
  ├── SMS estimate calculator
  ├── SendingHoursWarning (blocks outside hours)
  └── [สร้างแคมเปญ] / [ส่งทันที]
```

### Wireframe — Campaign Builder Panel

```
┌─── สร้างแคมเปญใหม่ ─────────────────────────── [✕] ┐
│                                                      │
│  ชื่อแคมเปญ                                          │
│  ┌──────────────────────────────────────────────┐    │
│  │ Welcome Campaign Q1                          │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌─── ผู้ส่ง ──────────┐  ┌─── กลุ่มผู้รับ ────────┐  │
│  │ SMSOK           ▾ │  │ VIP Customers     ▾ │  │
│  └──────────────────┘  └──────────────────────┘  │
│                                                      │
│  เทมเพลต                                             │
│  ┌──────────────────────────────────────────────┐    │
│  │ Welcome Message                           ▾ │    │
│  └──────────────────────────────────────────────┘    │
│  ┌─── Preview ─────────────────────────────────┐    │
│  │ สวัสดีครับ {{name}} ยินดีต้อนรับสู่ SMSOK!     │    │
│  │ ใช้โค้ด WELCOME10 รับส่วนลด 10%              │    │
│  │                                    2 SMS/msg │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ตั้งเวลาส่ง (ไม่บังคับ)                               │
│  ┌──────────────────────────────────────────────┐    │
│  │ 📅 2026-03-15 09:00                          │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌─── สรุป ────────────────────────────────────┐    │
│  │ ผู้รับ: 1,234 คน  ×  2 SMS/msg  =  2,468 SMS │    │
│  │ เครดิตคงเหลือ: 45,200 SMS  ✓ เพียงพอ         │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ⚠ ส่งได้เฉพาะ 08:00-20:00 ตามเวลาไทย              │
│                                                      │
│          [ยกเลิก]  [สร้างฉบับร่าง]  [ส่งทันที]        │
└──────────────────────────────────────────────────────┘
```

### Campaign Table — Desktop

```
┌────────────────────────────────────────────────────────────────┐
│ ชื่อแคมเปญ           สถานะ      ส่ง/ทั้งหมด    ผู้ส่ง    วันที่    ⋯ │
├────────────────────────────────────────────────────────────────┤
│ Welcome Q1          ● กำลังส่ง   ████░░ 62%  SMSOK   14 มี.ค.  ⋯ │
│ Flash Sale March    ✓ สำเร็จ    ██████ 98%  PROMO   13 มี.ค.  ⋯ │
│ VIP Reminder        ◻ ฉบับร่าง   —          SMSOK   12 มี.ค.  ⋯ │
│ Inactive Re-engage  ⏱ ตั้งเวลา   —          ALERT   15 มี.ค.  ⋯ │
└────────────────────────────────────────────────────────────────┘
```

### Campaign Table — Mobile (Card Grid)

```
┌─── Welcome Q1 ────────────────────┐
│ ● กำลังส่ง                          │
│ SMSOK · 1,234 ผู้รับ               │
│ ████████░░░░ 62% (765/1,234)      │
│ 14 มี.ค. 2569                      │
└───────────────────────────────────┘
```

---

## 3. Implementation Status

| Component | Status | File |
|-----------|--------|------|
| Marketing Dashboard | ✅ Coded + Committed | `app/(dashboard)/dashboard/analytics/AnalyticsContent.tsx` |
| Campaign Builder | ✅ Already exists | `app/(dashboard)/dashboard/campaigns/CampaignsClient.tsx` |
| Campaign Table | ✅ Already exists | `app/(dashboard)/dashboard/campaigns/CampaignsClient.tsx` |

### What was redesigned (this task)
- Analytics page → Marketing Dashboard with Nansen DNA v2
- Stat cards with accent gradients + icon glow
- Larger donut chart (180px) with smooth transitions
- Progress bars with percentage labels
- SMS remaining banner with CTA
- Recent activity → nansen-table-dense (8 rows)
- Fail rate alert (auto when >10%)
- "สร้างแคมเปญ" CTA in header

### What already existed (no changes needed)
- Campaign Builder — already feature-complete inline panel
- Campaign Table — already uses PageLayout + Nansen DNA v2
- Real-time progress polling during sends
- Status-based filtering + search

---

## Notes for PM
- Code pushed to `main` — commit `e59b178`
- Logic untouched — UI/visual only
- All Thai language preserved
- Nansen DNA v2 design system classes used throughout
- Campaign Builder ไม่ต้อง redesign — ใช้ PageLayout + Framer Motion อยู่แล้ว ครบ flow
