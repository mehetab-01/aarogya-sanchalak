# Admin Portal CLAUDE.md
## Owner: Dhanshree Porwal — Pitch Presenter

---

## Your Role

You own everything inside `portals/admin/`. This portal is the command center — the hospital admin sees the full picture: live bed counts, all incoming alerts, and an audit trail of staff actions. It runs at **http://localhost:5173**.

You are also the pitch presenter. The admin portal is what's shown on the laptop during the live demo, so it must be visually polished and update in real-time without any page refresh.

---

## Files You Own

```
portals/admin/
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── App.jsx                       # Root component, auth check, layout
    └── components/
        ├── BedStatusCards.jsx        # Live bed counts (ICU / General / Emergency)
        ├── ActiveAlerts.jsx          # Real-time incoming patient alert table
        └── StaffLog.jsx              # Audit trail of acknowledgements
```

---

## Do Not Touch

- `portals/shared/` — Mehetab owns this. Read from it, never edit it.
- `portals/driver/`, `portals/doctor/`, `portals/nurse/`, `portals/wardboy/` — other team members' portals.
- `backend/` — Mehetab only.

---

## Running the Portal

```bash
cd portals/admin
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## Firebase Schema — What You Read

Your portal is **read-only** from Firebase. You observe, you don't write.

```
/hospitals/{HOSPITAL_ID}/
  beds/
    icu:       { total: 20, occupied: 14 }
    general:   { total: 80, occupied: 61 }
    emergency: { total: 10, occupied: 7  }
  alerts/{alertId}/
    patientName   string
    age           number
    condition     "CRITICAL" | "SERIOUS" | "STABLE"
    vitals:       { bp: "90/60", pulse: 112 }
    eta           number  (minutes until arrival)
    driverId      string
    status        "INCOMING" | "ADMITTED" | "DISCHARGED"
    doctorAck     boolean
    nurseAck      boolean
    wardAck       boolean
    timestamp     number  (Unix ms)
```

---

## Correct Import Pattern

```js
// Always import from shared — never re-initialize Firebase
import { db } from '../../shared/firebase.js';
import { HOSPITAL_ID, DB_PATHS, CONDITIONS } from '../../shared/types.js';
```

---

## BedStatusCards.jsx — Pattern to Follow

```jsx
import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../shared/firebase.js';
import { HOSPITAL_ID } from '../../shared/types.js';

export default function BedStatusCards() {
  const [beds, setBeds] = useState(null);  // null = loading

  useEffect(() => {
    const bedsRef = ref(db, `/hospitals/${HOSPITAL_ID}/beds`);
    const unsubscribe = onValue(bedsRef, (snapshot) => {
      setBeds(snapshot.val());
    });
    return () => unsubscribe();  // cleanup on unmount
  }, []);

  if (!beds) return <div className="text-gray-400">Loading bed status...</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {Object.entries(beds).map(([type, data]) => (
        <div key={type} className="bg-white rounded-xl shadow p-4">
          <h3 className="text-sm font-semibold uppercase text-gray-500">{type}</h3>
          <p className="text-3xl font-bold text-red-600">
            {data.occupied}
            <span className="text-gray-400 text-lg">/{data.total}</span>
          </p>
          <p className="text-xs text-gray-400">occupied</p>
        </div>
      ))}
    </div>
  );
}
```

Key points:
- `useState(null)` — null means loading, not empty
- `onValue()` for real-time sync — not a one-time `get()`
- Always return the `unsubscribe` function from `useEffect` cleanup

---

## ActiveAlerts.jsx — Pattern to Follow

```jsx
import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../shared/firebase.js';
import { HOSPITAL_ID, CONDITIONS } from '../../shared/types.js';

const conditionColors = {
  CRITICAL: 'bg-red-100 text-red-700 border-red-300',
  SERIOUS:  'bg-orange-100 text-orange-700 border-orange-300',
  STABLE:   'bg-green-100 text-green-700 border-green-300',
};

export default function ActiveAlerts() {
  const [alerts, setAlerts] = useState(null);

  useEffect(() => {
    const alertsRef = ref(db, `/hospitals/${HOSPITAL_ID}/alerts`);
    const unsubscribe = onValue(alertsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) { setAlerts([]); return; }
      // Convert object to sorted array (newest first)
      const list = Object.entries(data)
        .map(([id, val]) => ({ id, ...val }))
        .filter(a => a.status === 'INCOMING')
        .sort((a, b) => b.timestamp - a.timestamp);
      setAlerts(list);
    });
    return () => unsubscribe();
  }, []);

  if (!alerts) return <div className="text-gray-400">Loading alerts...</div>;
  if (alerts.length === 0) return <div className="text-gray-400">No active alerts</div>;

  return (
    <div className="space-y-3">
      {alerts.map(alert => (
        <div key={alert.id}
             className={`rounded-xl border p-4 ${conditionColors[alert.condition]}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold">{alert.patientName}, {alert.age}y</p>
              <p className="text-sm">{alert.condition} • ETA {alert.eta} min</p>
              <p className="text-xs mt-1">
                BP {alert.vitals?.bp} • Pulse {alert.vitals?.pulse}
              </p>
            </div>
            <div className="text-xs space-y-1 text-right">
              <p>{alert.doctorAck ? '✓ Doctor' : '⏳ Doctor'}</p>
              <p>{alert.nurseAck  ? '✓ Nurse'  : '⏳ Nurse'}</p>
              <p>{alert.wardAck   ? '✓ Ward'   : '⏳ Ward'}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## StaffLog.jsx — Pattern to Follow

Show all alerts (not just INCOMING) with timestamps and acknowledgement status as an audit trail.

```jsx
// Similar onValue() pattern — show all alerts sorted by timestamp descending
// Display: patient name, condition, timestamp, doctorAck/nurseAck/wardAck, status
// This is the history view — don't filter by status
```

---

## Common Mistakes to Avoid

- **Forgetting null check:** Firebase `snapshot.val()` returns `null` when the path is empty. Always handle this before mapping over data.
- **Not cleaning up listeners:** Always `return () => unsubscribe()` inside `useEffect`. Without this, you'll have duplicate listeners after re-renders.
- **Hardcoding HOSPITAL_ID:** Use the constant from `../../shared/types.js`.
- **Using `get()` instead of `onValue()`:** `get()` is a one-time read. Your portal needs live updates — use `onValue()`.
- **Constructing DB paths by string:** Use `DB_PATHS.alerts(HOSPITAL_ID)` — don't write `/hospitals/hospital_001/alerts` by hand.

---

## Demo Tips (You're Presenting)

- The admin portal should be open full-screen on the laptop
- When Sayali (driver) submits the patient form, the alert should appear in `ActiveAlerts` within 1–2 seconds
- The acknowledgement checkmarks update live as the doctor and nurse portals are clicked
- Bed counts show current state at all times — no refresh needed
- Keep the UI clean: Tailwind, white cards, red accents for critical conditions

---

## Golden Rules

1. Import `db` from `../../shared/firebase.js` — never create your own Firebase init
2. Use `onValue()` for everything — no polling
3. Always handle `null` (loading) and empty states in your components
4. Never hardcode `HOSPITAL_ID` — import it from `../../shared/types.js`
5. Don't edit any file outside `portals/admin/`
