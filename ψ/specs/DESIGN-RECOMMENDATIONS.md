# Design Recommendations — จาก Research Competitors

> UXUI Oracle | 2026-03-09
> อ้างอิง: SMSOK.co, Twilio, MessageBird, ThaiBulkSMS

---

## สิ่งที่เรียนรู้จาก Competitors

### SMSOK.co (Reference หลัก)
- สี: ขาว/ฟ้า/ส้ม — clean, conversion-focused
- ไม่มี glassmorphism — เน้น clarity
- Copy: Thai casual + professional ผสม ("ส่งปุ๊บ ถึงปั๊บ!")
- Trust signals: ย้ำซ้ำ "จริง" 5 ครั้ง, stats bar, awards

### Twilio Console
- Sidebar: hierarchical — Messaging > Send > Logs > Insights
- Message logs: table + expand row for detail
- Filter: status dropdown + date range
- Credentials: prominently displayed, copy button

### MessageBird (Bird)
- Unified inbox: ทุก channel ในที่เดียว (SMS, WhatsApp, Email)
- Customizable dashboards: user สร้าง view ได้เอง
- Clean white UI + purple accent

### ThaiBulkSMS
- ราคาต่ำกว่า 0.15 บาท — เราใช้ 0.147 ตรง
- Copy: professional Thai, ไม่ casual เกินไป
- Stats: "10,000,000 messages/day", "0.75 วินาที"
- Dashboard sections: ส่งข้อความ, เครดิตคงเหลือ, ข้อมูลผู้รับ

---

## Design Recommendations สำหรับ SMSOK Clone

### 1. Color — คง Web3 Dark แต่ปรับ contrast

**ปัจจุบัน:** ดีแล้ว — `#040810` bg, sky-400 accent, indigo secondary
**ปรับ:**
- เพิ่ม contrast text: `text-white/70` → ใช้กับ body text ให้อ่านง่ายกว่า `text-white/50`
- Status colors: ใช้ dot + glow shadow (ตาม Messages spec)
- Success: emerald-400, Warning: amber-400, Error: red-400 — consistent ทั้งเว็บ

### 2. Typography — ปรับ hierarchy ให้ชัด

| Level | Current | Recommend |
|-------|---------|-----------|
| Page title | `text-2xl font-bold` | `text-2xl font-bold tracking-tight` ✅ ดีแล้ว |
| Subtitle | `text-sm text-white/40` | `text-sm text-white/40 mt-1` ✅ |
| Section header | `text-base font-semibold` | ✅ |
| Table header | `text-xs text-white/40 uppercase` | ✅ |
| Body text | `text-white/50` | ใช้ `text-white/60` แทน — อ่านง่ายกว่า |
| Muted | `text-white/30` | ✅ |
| Helper/hint | `text-white/20` | ✅ |

**เพิ่ม:** Font weight hierarchy
- Page title: `font-bold` (700)
- Section: `font-semibold` (600)
- Label: `font-medium` (500)
- Body: `font-normal` (400)

### 3. Layout — เพิ่ม structure

**จาก Twilio:** Sidebar → hierarchical sections ชัดเจน
**จาก ThaiBulkSMS:** Stats bar ด้านบนทุกหน้าที่มี data

**แนะนำ:**
- ทุกหน้าที่มี list/table → มี summary stats mini bar ด้านบน
- Messages: total, delivered, pending, failed
- Contacts: total contacts
- API Keys: total keys, active, inactive
- Topup: current credits, estimated SMS remaining

### 4. Copywriting — ตามที่ส่งไปแล้ว

ดู `ψ/specs/COPYWRITING-SPEC.md` — ภาษาไทยทั้งหมด, professional tone

### 5. Icons — ใช้ inline SVG ต่อไป

ปัจจุบันใช้ inline SVG (Feather-style) — ดีแล้ว consistent
**ไม่แนะนำ** เปลี่ยนเป็น icon library เพราะจะเพิ่ม bundle size

### 6. Patterns จาก Competitors ที่ควร Apply

| Pattern | Source | Apply ที่ |
|---------|--------|----------|
| Filter bar (status + date + search) | Twilio | Messages page |
| Expand row for detail | Twilio | Messages page — click row to see full message |
| Summary stats mini bar | ThaiBulkSMS | Messages, Contacts, API Keys |
| Trust signals / stats bar | SMSOK.co | Landing page ✅ มีแล้ว |
| Mobile card view แทน table | Best practice | Messages, Contacts |
| Copy button สำหรับ API key | Twilio | API Keys ✅ มีแล้ว |
| Status dot with glow | Modern UI | ทุกที่ที่แสดง status |

---

## สรุป Priority

1. **Messages page redesign** — ดู `MESSAGES-PAGE-REDESIGN.md`
2. **DashboardShell fix** — 4 หน้าขาด shell
3. **Sidebar consistency** — labels ภาษาไทย
4. **Copywriting** — ดู `COPYWRITING-SPEC.md`
5. **Body text contrast** — `text-white/50` → `text-white/60`
