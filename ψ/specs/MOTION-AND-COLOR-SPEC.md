# Motion Design + Advanced Color System Spec

> UXUI Oracle | 2026-03-09
> Human preference: animation เยอะ, สีหลากหลาย, gradient, neon glow, depth
> อ้างอิง: Dribbble glassmorphism dashboards, Behance dark theme, 2026 UI trends

---

## 1. EXTENDED COLOR SYSTEM

### Background Depth Layers (ไม่ใช่สีเดียวทั้งหมด)

```css
@layer base {
  :root {
    /* Background depth — 5 ระดับ */
    --bg-base: #040810;        /* deepest — page background */
    --bg-raised: #080e1a;      /* sidebar, topbar */
    --bg-surface: #0c1322;     /* cards, glass base tint */
    --bg-elevated: #101828;    /* modals, dropdowns */
    --bg-hover: #151f32;       /* hover states */

    /* Accent palette — หลากหลาย ไม่ใช่แค่ sky-400 */
    --accent-primary: #38BDF8;    /* sky-400 — หลัก */
    --accent-secondary: #818CF8;  /* indigo-400 — รอง */
    --accent-tertiary: #A78BFA;   /* violet-400 — เสริม */
    --accent-success: #34D399;    /* emerald-400 */
    --accent-warning: #FBBF24;    /* amber-400 */
    --accent-danger: #F87171;     /* red-400 */
    --accent-pink: #F472B6;       /* pink-400 — สำหรับ highlights */
    --accent-cyan: #22D3EE;       /* cyan-400 — สำหรับ data viz */
  }
}
```

### Gradient Text Effects (หลายแบบ)

```css
@layer components {
  /* Sky gradient text (primary) */
  .gradient-text-sky {
    background: linear-gradient(135deg, #38BDF8 0%, #818CF8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Violet-Pink gradient text */
  .gradient-text-violet {
    background: linear-gradient(135deg, #A78BFA 0%, #F472B6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Emerald-Cyan gradient text */
  .gradient-text-emerald {
    background: linear-gradient(135deg, #34D399 0%, #22D3EE 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Amber-Orange gradient text */
  .gradient-text-amber {
    background: linear-gradient(135deg, #FBBF24 0%, #FB923C 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Full rainbow neon (สำหรับ hero, special elements) */
  .gradient-text-rainbow {
    background: linear-gradient(90deg, #38BDF8, #818CF8, #A78BFA, #F472B6, #38BDF8);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradient-shift 4s linear infinite;
  }
}

@keyframes gradient-shift {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}
```

### Glass Cards with Color Tint

```css
@layer components {
  /* Glass with sky tint */
  .glass-sky {
    background: linear-gradient(135deg,
      rgba(56, 189, 248, 0.05) 0%,
      rgba(56, 189, 248, 0.02) 100%);
    backdrop-filter: blur(40px) saturate(1.5);
    border: 1px solid rgba(56, 189, 248, 0.08);
    border-radius: 16px;
  }

  /* Glass with indigo tint */
  .glass-indigo {
    background: linear-gradient(135deg,
      rgba(129, 140, 248, 0.05) 0%,
      rgba(129, 140, 248, 0.02) 100%);
    backdrop-filter: blur(40px) saturate(1.5);
    border: 1px solid rgba(129, 140, 248, 0.08);
    border-radius: 16px;
  }

  /* Glass with violet tint */
  .glass-violet {
    background: linear-gradient(135deg,
      rgba(167, 139, 250, 0.05) 0%,
      rgba(167, 139, 250, 0.02) 100%);
    backdrop-filter: blur(40px) saturate(1.5);
    border: 1px solid rgba(167, 139, 250, 0.08);
    border-radius: 16px;
  }

  /* Glass with emerald tint */
  .glass-emerald {
    background: linear-gradient(135deg,
      rgba(52, 211, 153, 0.05) 0%,
      rgba(52, 211, 153, 0.02) 100%);
    backdrop-filter: blur(40px) saturate(1.5);
    border: 1px solid rgba(52, 211, 153, 0.08);
    border-radius: 16px;
  }
}
```

### Status Badges (สีชัดเจน + glow)

```css
@layer components {
  .badge-glow-success {
    background: rgba(52, 211, 153, 0.1);
    border: 1px solid rgba(52, 211, 153, 0.2);
    color: #34D399;
    box-shadow: 0 0 12px rgba(52, 211, 153, 0.15);
  }
  .badge-glow-info {
    background: rgba(56, 189, 248, 0.1);
    border: 1px solid rgba(56, 189, 248, 0.2);
    color: #38BDF8;
    box-shadow: 0 0 12px rgba(56, 189, 248, 0.15);
  }
  .badge-glow-warning {
    background: rgba(251, 191, 36, 0.1);
    border: 1px solid rgba(251, 191, 36, 0.2);
    color: #FBBF24;
    box-shadow: 0 0 12px rgba(251, 191, 36, 0.15);
  }
  .badge-glow-error {
    background: rgba(248, 113, 113, 0.1);
    border: 1px solid rgba(248, 113, 113, 0.2);
    color: #F87171;
    box-shadow: 0 0 12px rgba(248, 113, 113, 0.15);
  }
}
```

### Accent Color Usage Map

| หน้า/Section | Accent Color | ใช้กับ |
|-------------|-------------|--------|
| Dashboard stats | sky-400, emerald-400, amber-400, red-400 | StatCards ใช้สีต่างกัน |
| Send SMS | sky → indigo gradient | card headers, cost total |
| Messages | emerald/amber/red per status | badges + dots |
| Contacts | indigo-400 | section icons, tags |
| Senders | violet-400 | process steps, form icon |
| Topup | sky → cyan gradient | pricing cards, best seller glow |
| API Keys | emerald-400 for new key | success state |
| Settings | neutral — sky-400 minimal | section icons only |
| Landing hero | sky + indigo + violet gradient | heading, orbs |

---

## 2. MOTION DESIGN

### Page Transitions

```css
/* ใน globals.css */

/* Stagger fade-in สำหรับ page content */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out forwards;
  opacity: 0;
}

/* Stagger children — ใช้กับ grid/list containers */
.stagger-children > * {
  animation: fade-in-up 0.4s ease-out forwards;
  opacity: 0;
}
.stagger-children > *:nth-child(1) { animation-delay: 0.05s; }
.stagger-children > *:nth-child(2) { animation-delay: 0.10s; }
.stagger-children > *:nth-child(3) { animation-delay: 0.15s; }
.stagger-children > *:nth-child(4) { animation-delay: 0.20s; }
.stagger-children > *:nth-child(5) { animation-delay: 0.25s; }
.stagger-children > *:nth-child(6) { animation-delay: 0.30s; }
.stagger-children > *:nth-child(7) { animation-delay: 0.35s; }
.stagger-children > *:nth-child(8) { animation-delay: 0.40s; }
```

### Hover Effects

```css
@layer components {
  /* Card hover — lift + glow + border brighten */
  .card-hover {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .card-hover:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3),
                0 0 30px rgba(56, 189, 248, 0.06);
    border-color: rgba(56, 189, 248, 0.15);
  }

  /* Button hover — scale + glow */
  .btn-primary:hover {
    transform: scale(1.02);
    box-shadow: 0 0 30px rgba(56, 189, 248, 0.3),
                0 8px 24px rgba(0, 0, 0, 0.3);
  }

  /* Icon hover — rotate + color shift */
  .icon-hover {
    transition: all 0.3s ease;
  }
  .icon-hover:hover {
    transform: rotate(5deg) scale(1.1);
    filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.4));
  }

  /* Table row hover — slide-in highlight */
  .table-row-hover {
    transition: all 0.2s ease;
    position: relative;
  }
  .table-row-hover:hover {
    background: rgba(56, 189, 248, 0.03);
  }
  .table-row-hover::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0;
    background: linear-gradient(to right, rgba(56, 189, 248, 0.2), transparent);
    transition: width 0.3s ease;
  }
  .table-row-hover:hover::before {
    width: 3px;
  }

  /* Sidebar item hover — glow bg */
  .sidebar-hover {
    transition: all 0.25s ease;
    position: relative;
    overflow: hidden;
  }
  .sidebar-hover::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.08), transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .sidebar-hover:hover::after {
    opacity: 1;
  }
}
```

### Counter Animation (Stats)

```tsx
// useCountUp hook (ปรับปรุง)
function useCountUp(target: number, duration = 1500, delay = 0) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Intersection Observer — นับเมื่อเลื่อนมาเห็น
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const timeout = setTimeout(() => {
            let start = 0;
            const step = target / (duration / 16);
            const timer = setInterval(() => {
              start += step;
              if (start >= target) {
                setCount(target);
                clearInterval(timer);
              } else {
                setCount(Math.floor(start));
              }
            }, 16);
          }, delay);
          return () => clearTimeout(timeout);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration, delay]);

  return { count, ref };
}

// ใช้:
// <div ref={ref}>{count.toLocaleString()}</div>
```

### Skeleton Loading (Shimmer)

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(90deg,
    rgba(255,255,255,0.03) 25%,
    rgba(255,255,255,0.06) 50%,
    rgba(255,255,255,0.03) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}
```

### Smooth Expand/Collapse (FAQ, Row expand)

```css
.expand-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.expand-content.open {
  grid-template-rows: 1fr;
}
.expand-content > div {
  overflow: hidden;
}
```

### Ambient Orb Animations (Background)

```css
@keyframes orb-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

@keyframes orb-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

.ambient-orb {
  animation: orb-float 20s ease-in-out infinite, orb-pulse 8s ease-in-out infinite;
}

.ambient-orb-2 {
  animation: orb-float 25s ease-in-out infinite reverse, orb-pulse 10s ease-in-out infinite;
}
```

### Notification/Toast Animation

```css
@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slide-out-right {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

.toast-enter { animation: slide-in-right 0.3s ease-out forwards; }
.toast-exit { animation: slide-out-right 0.3s ease-in forwards; }
```

---

## 3. APPLICATION MAP

### Landing Page
- Hero heading: `gradient-text-sky` (animated gradient shift)
- Stats bar numbers: `useCountUp` on scroll into view
- Benefit cards: `stagger-children` + `card-hover`
- Feature cards: `stagger-children` + `card-hover`
- Pricing cards: `stagger-children` + best seller card uses `glass-sky`
- FAQ: `expand-content` smooth grid-template-rows
- Background: `ambient-orb` + `ambient-orb-2`

### Dashboard
- Stat cards: `stagger-children` + each card different accent tint glass
  - เครดิต: `glass-sky`
  - ส่งวันนี้: `glass-indigo`
  - ส่งสำเร็จ: `glass-emerald`
  - ส่งไม่สำเร็จ: `glass` (default neutral)
- Stat numbers: `useCountUp`
- Recent messages: `stagger-children` on table rows
- Table rows: `table-row-hover`

### Messages Page
- Summary stats: `stagger-children` + `useCountUp`
- Filter bar: `animate-fade-in-up`
- Table rows: `stagger-children` + `table-row-hover`
- Mobile cards: `stagger-children`
- Row expand: `expand-content`
- Status badges: `badge-glow-*`

### Topup
- Package cards: `stagger-children` + `card-hover`
- Best seller: `glass-sky` + enhanced glow
- Credit counter: `useCountUp`

### All Pages
- Page container: `animate-fade-in-up`
- Glass forms: subtle `animate-fade-in` on mount
- Success/error feedback: `toast-enter` animation
- Sidebar active: left border glow pulse
- Skeleton loading: `skeleton` shimmer on data fetch

---

## Performance Notes

- ใช้ `will-change: transform, opacity` เฉพาะ elements ที่ animate
- `backdrop-filter: blur()` อาจหนักบน mobile — ลด blur เป็น 20px บน mobile
- `animation-fill-mode: forwards` ทุก fade-in เพื่อไม่กระพริบ
- ใช้ `prefers-reduced-motion` media query สำหรับ a11y:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
