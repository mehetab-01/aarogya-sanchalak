# UI_SYSTEM.md — Aarogya Sanchalak Design System
## Single source of truth for all 5 portals. No exceptions.

---

## 1. Design Philosophy

Aarogya Sanchalak is a clinical tool, not a consumer product. Every visual decision must serve one purpose: give the right person the right information in the minimum possible time, under maximum possible stress. The aesthetic language is borrowed from medical instrumentation — high-contrast, unambiguous, hierarchically dense, and completely devoid of decoration. Color is not branding; it is signal. Space is not beauty; it is clarity. The test for every design decision is: "Would a doctor trust this screen with a patient's life?" If the answer is anything less than an immediate yes, the element is redesigned or removed. This system prioritizes calm authority over visual appeal — the interface should feel as reliable and legible as hospital signage at 3am.

---

## 2. Color System

### Philosophy
No gradients. No shadows except the single card utility. No color used decoratively. Every color token carries semantic meaning — critical means danger, stable means safe, brand means system.

### CSS Custom Properties — paste into `src/index.css` of every portal

```css
:root {
  /* Brand — deep medical teal */
  --color-brand:          #0D6E6E;
  --color-brand-dark:     #094F4F;
  --color-brand-light:    #E6F4F4;

  /* Condition — Critical */
  --color-critical:       #9B1C1C;
  --color-critical-light: #FEF2F2;

  /* Condition — Serious */
  --color-serious:        #92400E;
  --color-serious-light:  #FFFBEB;

  /* Condition — Stable */
  --color-stable:         #155E3E;
  --color-stable-light:   #F0FDF4;

  /* Backgrounds */
  --color-bg-primary:     #F7F8FA;   /* clinical off-white, not pure white */
  --color-bg-secondary:   #EDEEF1;   /* slightly darker surface */
  --color-bg-card:        #FFFFFF;

  /* Text */
  --color-text-primary:   #111318;
  --color-text-secondary: #3D424F;
  --color-text-muted:     #6B7280;

  /* Borders */
  --color-border:         #E2E4E9;
  --color-border-strong:  #C5C9D4;
}
```

### Complete `src/index.css` base block

```css
@import '@fontsource/inter/400.css';
@import '@fontsource/inter/500.css';
@import '@fontsource/inter/600.css';
@import '@fontsource/jetbrains-mono/400.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-brand:          #0D6E6E;
  --color-brand-dark:     #094F4F;
  --color-brand-light:    #E6F4F4;

  --color-critical:       #9B1C1C;
  --color-critical-light: #FEF2F2;

  --color-serious:        #92400E;
  --color-serious-light:  #FFFBEB;

  --color-stable:         #155E3E;
  --color-stable-light:   #F0FDF4;

  --color-bg-primary:     #F7F8FA;
  --color-bg-secondary:   #EDEEF1;
  --color-bg-card:        #FFFFFF;

  --color-text-primary:   #111318;
  --color-text-secondary: #3D424F;
  --color-text-muted:     #6B7280;

  --color-border:         #E2E4E9;
  --color-border-strong:  #C5C9D4;

  --font-xs:   11px;
  --font-sm:   13px;
  --font-base: 15px;
  --font-md:   17px;
  --font-lg:   20px;
  --font-xl:   24px;
  --font-2xl:  30px;

  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-7:  28px;
  --space-8:  32px;
  --space-9:  36px;
  --space-10: 40px;
}

* {
  box-sizing: border-box;
}

body {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: var(--font-base);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

.font-data {
  font-family: 'JetBrains Mono', monospace;
}

.shadow-card {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.06);
}
```

---

## 3. Typography

### Font Stack
- **Inter** — all UI text, labels, buttons, headings
- **JetBrains Mono** — all medical data: BP, pulse, bed counts, timestamps, IDs

### Install

```bash
npm install @fontsource/inter @fontsource/jetbrains-mono
```

### Import (in `src/main.jsx` of every portal)

```js
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/jetbrains-mono/400.css';
```

### Type Scale

| Token | Size | Usage |
|---|---|---|
| `--font-xs` | 11px | Labels, meta, role badges |
| `--font-sm` | 13px | Secondary info, table cells |
| `--font-base` | 15px | Body text, form inputs |
| `--font-md` | 17px | Card titles, section headers |
| `--font-lg` | 20px | Page titles |
| `--font-xl` | 24px | Large data values (bed count, ETA) |
| `--font-2xl` | 30px | Hero numbers, dashboard KPIs |

### Weights
- `font-normal` (400) — body, secondary
- `font-medium` (500) — labels, metadata
- `font-semibold` (600) — headings, buttons, emphasis

**Never use `font-bold` (700) or higher.**

---

## 4. Spacing & Layout

### Base Unit: 4px

```
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--space-7:  28px
--space-8:  32px
--space-9:  36px
--space-10: 40px
```

### Layout Rules

| Rule | Value |
|---|---|
| Max content width — admin, doctor, nurse, wardboy | 1200px |
| Max content width — driver portal | 420px |
| Base page padding | `--space-6` (24px) |
| Card border-radius | 10px |
| Button border-radius | 8px |
| Input border-radius | 8px |
| Table row border-radius | 0px (none) |

---

## 5. Component Library — The Locked List

**No library additions without full team discussion. Use only what is listed here.**

---

### 1. @fontsource/inter
```bash
npm install @fontsource/inter
```
- **Used for:** All UI typography
- **Not for:** Data/numbers (use JetBrains Mono)
```js
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
```

---

### 2. @fontsource/jetbrains-mono
```bash
npm install @fontsource/jetbrains-mono
```
- **Used for:** BP, pulse, bed counts, timestamps, patient IDs
- **Not for:** Any prose or UI labels
```js
import '@fontsource/jetbrains-mono/400.css';
// usage: className="font-data" (defined in index.css)
```

---

### 3. lucide-react
```bash
npm install lucide-react
```
- **Used for:** All icons — one library only
- **Not for:** Decorative icons, emoji replacements
```jsx
import { AlertTriangle } from 'lucide-react';
<AlertTriangle size={16} className="text-[var(--color-critical)]" />
```

---

### 4. clsx
```bash
npm install clsx
```
- **Used for:** Conditional Tailwind class composition
- **Not for:** Inline styles, style objects
```js
import clsx from 'clsx';
const cls = clsx('base-class', isActive && 'active-class', hasError && 'error-class');
```

---

### 5. date-fns
```bash
npm install date-fns
```
- **Used for:** Formatting timestamps as "HH:mm", relative times
- **Not for:** Date math in business logic (keep that in utils/)
```js
import { format } from 'date-fns';
const time = format(new Date(timestamp), 'HH:mm');
```

---

### 6. react-hot-toast
```bash
npm install react-hot-toast
```
- **Used for:** All user feedback — success, error, info toasts
- **Not for:** Alerts, confirms, modals, inline errors
```jsx
import toast from 'react-hot-toast';
toast.success('Acknowledged');
toast.error('Connection failed');
```
Add `<Toaster position="top-right" />` once in `App.jsx` of each portal.

---

### 7. framer-motion
```bash
npm install framer-motion
```
- **Used for:** Status badge transitions, alert card entrance animation ONLY
- **Not for:** Page transitions, hover effects, decorative motion, loading spinners
```jsx
import { motion } from 'framer-motion';
<motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
  {/* alert card */}
</motion.div>
```

---

## 6. Core Components Spec

These are the canonical implementations. Every portal imports from `../../shared/components/`. No portal defines its own version of these.

---

### StatusBadge

**File:** `portals/shared/components/StatusBadge.jsx`

```jsx
import clsx from 'clsx';

const styles = {
  CRITICAL: 'bg-[var(--color-critical-light)] text-[var(--color-critical)] border-[var(--color-critical)]',
  SERIOUS:  'bg-[var(--color-serious-light)]  text-[var(--color-serious)]  border-[var(--color-serious)]',
  STABLE:   'bg-[var(--color-stable-light)]   text-[var(--color-stable)]   border-[var(--color-stable)]',
};

export default function StatusBadge({ condition }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-semibold tracking-wide uppercase',
        styles[condition] ?? 'bg-gray-100 text-gray-600 border-gray-300'
      )}
    >
      {condition}
    </span>
  );
}
```

---

### PatientCard

**File:** `portals/shared/components/PatientCard.jsx`

```jsx
import StatusBadge from './StatusBadge.jsx';
import { Clock, User, Truck, Activity } from 'lucide-react';

export default function PatientCard({ patient }) {
  const { name, age, condition, bp, pulse, eta, driverId } = patient;

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[10px] p-5 shadow-card">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <User size={16} className="text-[var(--color-text-muted)]" />
          <div>
            <p className="text-[var(--font-md)] font-semibold text-[var(--color-text-primary)] leading-tight">
              {name}
            </p>
            <p className="text-[var(--font-sm)] text-[var(--color-text-muted)]">{age} years</p>
          </div>
        </div>
        <StatusBadge condition={condition} />
      </div>

      {/* Vitals */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[var(--color-bg-secondary)] rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock size={12} className="text-[var(--color-text-muted)]" />
            <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">ETA</p>
          </div>
          <p className="font-data text-[var(--font-xl)] font-normal text-[var(--color-text-primary)] leading-none">
            {eta}
          </p>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">min</p>
        </div>

        <div className="bg-[var(--color-bg-secondary)] rounded-lg p-3 text-center">
          <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1">BP</p>
          <p className="font-data text-[var(--font-lg)] font-normal text-[var(--color-text-primary)] leading-none">
            {bp}
          </p>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">mmHg</p>
        </div>

        <div className="bg-[var(--color-bg-secondary)] rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Activity size={12} className="text-[var(--color-text-muted)]" />
            <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Pulse</p>
          </div>
          <p className="font-data text-[var(--font-xl)] font-normal text-[var(--color-text-primary)] leading-none">
            {pulse}
          </p>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">bpm</p>
        </div>
      </div>

      {/* Driver */}
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[var(--color-border)]">
        <Truck size={12} className="text-[var(--color-text-muted)]" />
        <p className="font-data text-[var(--font-sm)] text-[var(--color-text-muted)]">{driverId}</p>
      </div>
    </div>
  );
}
```

---

### BedCard

**File:** `portals/shared/components/BedCard.jsx`

```jsx
import { Bed } from 'lucide-react';
import clsx from 'clsx';

function getOccupancyColor(pct) {
  if (pct > 80) return 'bg-[var(--color-critical)]';
  if (pct > 60) return 'bg-[var(--color-serious)]';
  return 'bg-[var(--color-stable)]';
}

function getOccupancyTextColor(pct) {
  if (pct > 80) return 'text-[var(--color-critical)]';
  if (pct > 60) return 'text-[var(--color-serious)]';
  return 'text-[var(--color-stable)]';
}

export default function BedCard({ type, total, occupied }) {
  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const available = total - occupied;

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[10px] p-4 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bed size={15} className="text-[var(--color-text-muted)]" />
          <p className="text-[var(--font-sm)] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
            {type}
          </p>
        </div>
        <span className={clsx('text-[11px] font-semibold', getOccupancyTextColor(pct))}>
          {pct}%
        </span>
      </div>

      <p className="font-data text-[var(--font-2xl)] font-normal text-[var(--color-text-primary)] leading-none mb-1">
        {occupied}
        <span className="text-[var(--font-lg)] text-[var(--color-text-muted)]">/{total}</span>
      </p>
      <p className="text-[var(--font-xs)] text-[var(--color-text-muted)] mb-3">
        {available} available
      </p>

      {/* Progress bar */}
      <div className="h-1.5 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-300', getOccupancyColor(pct))}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
```

---

### AlertButton

**File:** `portals/shared/components/AlertButton.jsx`

```jsx
import clsx from 'clsx';

const variantStyles = {
  primary: 'bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-dark)] border-transparent',
  danger:  'bg-[var(--color-critical)] text-white hover:bg-[#7B1515] border-transparent min-h-[48px]',
  ghost:   'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] border-[var(--color-border)]',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-[var(--font-sm)]',
  md: 'px-4 py-2.5 text-[var(--font-base)]',
  lg: 'px-6 py-3 text-[var(--font-md)]',
};

export default function AlertButton({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  children,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'inline-flex items-center justify-center gap-2',
        'rounded-[8px] border font-semibold',
        'transition-colors duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-brand)]',
        variantStyles[variant],
        sizeStyles[size],
      )}
    >
      {children}
    </button>
  );
}
```

---

### PortalLayout

**File:** `portals/shared/components/PortalLayout.jsx`

```jsx
import clsx from 'clsx';

const roleColors = {
  Admin:   'bg-[var(--color-brand-light)] text-[var(--color-brand-dark)]',
  Driver:  'bg-[var(--color-serious-light)] text-[var(--color-serious)]',
  Doctor:  'bg-[var(--color-critical-light)] text-[var(--color-critical)]',
  Nurse:   'bg-[var(--color-brand-light)] text-[var(--color-brand-dark)]',
  'Ward Boy': 'bg-[var(--color-stable-light)] text-[var(--color-stable)]',
};

export default function PortalLayout({ title, role, children }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Top bar */}
      <header className="bg-[var(--color-bg-card)] border-b border-[var(--color-border)] sticky top-0 z-10">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[var(--color-brand)]" />
            <span className="text-[var(--font-base)] font-semibold text-[var(--color-text-primary)]">
              Aarogya Sanchalak
            </span>
            <span className="text-[var(--color-border-strong)]">—</span>
            <span className="text-[var(--font-base)] text-[var(--color-text-secondary)]">{title}</span>
          </div>

          <span className={clsx(
            'text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full',
            roleColors[role] ?? 'bg-gray-100 text-gray-600'
          )}>
            {role}
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1200px] mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  );
}
```

> For the driver portal, override max-width to 420px by wrapping `children` in a `max-w-[420px] mx-auto` div inside the portal's own `App.jsx`.

---

### EmergencyBanner

**File:** `portals/shared/components/EmergencyBanner.jsx`

```jsx
import { AlertTriangle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EmergencyBanner({ active, patientName, eta }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="bg-[var(--color-critical)] text-white px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={16} />
              <span className="text-[var(--font-sm)] font-semibold uppercase tracking-wide">
                Incoming Patient
              </span>
              <span className="text-[var(--font-sm)] font-normal opacity-90">
                {patientName}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="opacity-80" />
              <span className="font-data text-[var(--font-sm)] font-normal">
                {eta} min
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## 7. Icon Reference

```jsx
import {
  AlertTriangle,
  Clock,
  Bed,
  Phone,
  CheckCircle,
  XCircle,
  Activity,
  User,
  Shield,
  Truck,
  Stethoscope,
  ClipboardList,
  Package,
  Wifi,
  WifiOff,
} from 'lucide-react';
```

| Icon | Used for |
|---|---|
| `AlertTriangle` | Critical condition indicator, emergency banner |
| `Clock` | ETA display |
| `Bed` | Bed count cards |
| `Phone` | Call/voice notification status |
| `CheckCircle` | Acknowledged / completed state |
| `XCircle` | Not acknowledged / failed state |
| `Activity` | Vitals, pulse reading |
| `User` | Patient identity |
| `Shield` | Admin role badge |
| `Truck` | Ambulance / driver identity |
| `Stethoscope` | Doctor role badge |
| `ClipboardList` | Nurse role badge |
| `Package` | Ward boy role badge |
| `Wifi` | Firebase connected indicator |
| `WifiOff` | Offline / disconnected indicator |

**Always use `size={16}` as the default. Use `size={12}` for inline/label icons. Never use icon sizes above 24px in UI components.**

---

## 8. Data Display Rules

These rules are non-negotiable. Consistency here is what makes the product trustworthy.

| Data type | Rule | Example |
|---|---|---|
| BP | JetBrains Mono, always show both values | `90/60` |
| Pulse | JetBrains Mono, append "bpm" as muted label | `112 bpm` |
| Condition | Always `<StatusBadge />` — never raw text | `<StatusBadge condition="CRITICAL" />` |
| ETA | Append "min" as muted label, never bare number | `8 min` |
| Timestamps | `format(new Date(ts), 'HH:mm')` via date-fns | `14:32` |
| Bed counts | Always `occupied/total` — never percentage alone | `14/20` |
| Loading state | Tailwind `animate-pulse` skeleton — never `--` dashes | `<div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />` |
| Patient names | Title Case via `toTitleCase()` utility — never raw input | `Rahul Sharma` |
| Phone numbers | Never displayed in UI — backend only | — |
| Alert IDs | JetBrains Mono if shown | `AMB-042` |

---

## 9. Tailwind Config

This config is **identical across all 5 portals**. Copy verbatim.

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
    '../../shared/**/*.{js,jsx}',   // shared components
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        data: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          DEFAULT: 'var(--color-brand)',
          dark:    'var(--color-brand-dark)',
          light:   'var(--color-brand-light)',
        },
        critical: {
          DEFAULT: 'var(--color-critical)',
          light:   'var(--color-critical-light)',
        },
        serious: {
          DEFAULT: 'var(--color-serious)',
          light:   'var(--color-serious-light)',
        },
        stable: {
          DEFAULT: 'var(--color-stable)',
          light:   'var(--color-stable-light)',
        },
        bg: {
          primary:   'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          card:      'var(--color-bg-card)',
        },
        text: {
          primary:   'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted:     'var(--color-text-muted)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong:  'var(--color-border-strong)',
        },
      },
      borderRadius: {
        card:   '10px',
        button: '8px',
        input:  '8px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
```

---

## 10. File Structure Per Portal

Every portal must follow this structure exactly. No exceptions.

```
portals/<name>/
├── package.json
├── vite.config.js
├── tailwind.config.js      ← identical copy across all portals
├── index.html
└── src/
    ├── components/         ← portal-specific UI fragments only
    ├── hooks/              ← custom React hooks
    │   ├── useAlerts.js    ← onValue listener for /alerts
    │   ├── useBeds.js      ← onValue listener for /beds
    │   └── useAuth.js      ← Firebase Auth state
    ├── utils/              ← pure functions, no side effects
    │   └── index.js        ← re-exports from shared/utils/
    ├── App.jsx             ← auth gate + routing only, no UI logic
    ├── main.jsx            ← entry point, font imports here
    └── index.css           ← CSS variables + Tailwind base
```

```
portals/shared/
├── firebase.js             ← Mehetab only
├── types.js                ← Mehetab only
├── components/
│   ├── StatusBadge.jsx
│   ├── PatientCard.jsx
│   ├── BedCard.jsx
│   ├── AlertButton.jsx
│   ├── PortalLayout.jsx
│   └── EmergencyBanner.jsx
└── utils/
    └── index.js            ← formatTime, toTitleCase, getConditionColor, formatETA, formatBP
```

---

## 11. Dos and Don'ts

### DO

- Use CSS variables for all colors — `text-[var(--color-critical)]` not `text-red-700`
- Use `lucide-react` for every icon — nothing else
- Use `react-hot-toast` for every user feedback message
- Use `clsx` for all conditional class composition
- Use `font-data` class (JetBrains Mono) for all numeric medical data
- Handle loading states with `animate-pulse` skeleton divs
- Test every screen at 375px width (iPhone SE) and 1280px width
- Import shared components from `../../shared/components/`
- Import shared utils from `../../shared/utils/`

### DON'T

- Use emoji anywhere in the UI
- Use `style={{ color: '...' }}` — use Tailwind classes
- Use any color not defined in the CSS variables
- Import from any library not in the locked list (section 5)
- Use `window.alert()` or `window.confirm()`
- Use `border-radius` above 10px on any card or container
- Use `font-bold` (weight 700) or higher
- Use more than 3 distinct font sizes on a single screen
- Animate anything that isn't a status change or alert card entrance
- Use `setInterval` or `setTimeout` for data fetching — use Firebase `onValue()`
- Hardcode `HOSPITAL_ID` anywhere — import from `../../shared/types.js`
- Duplicate the Firebase initialization — import from `../../shared/firebase.js`
- Create a local version of any shared component
