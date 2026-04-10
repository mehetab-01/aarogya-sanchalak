# Doctor Portal CLAUDE.md
## Owner: Aditya Dherange — Doctor Portal

---

## Your Role

You own everything inside `portals/doctor/`. This portal is what the on-call doctor sees when an ambulance alert fires. A patient card appears in real-time with the incoming patient's details, and the doctor taps a single "Acknowledge" button to confirm they're ready.

When the doctor acknowledges, it:
1. Sets `doctorAck: true` in Firebase
2. Notifies the backend (which stops the 60-second nurse escalation timer)
3. Updates the driver's Confirmation screen live

This portal runs at **http://localhost:5175**.

You also own the nurse portal (`portals/nurse/`) and ward boy portal (`portals/wardboy/`). Each has its own briefing file.

---

## Files You Own

```
portals/doctor/
├── package.json
├── vite.config.js
├── index.html
└── src/
    └── App.jsx       # Patient card + Acknowledge button
```

---

## Do Not Touch

- `portals/shared/` — Mehetab owns this. Import from it, never edit it.
- `portals/admin/`, `portals/driver/`, `portals/nurse/`, `portals/wardboy/` — other portals (you own nurse + wardboy separately, see their CLAUDE.md files).
- `backend/` — Mehetab only.

---

## Running the Portal

```bash
cd portals/doctor
npm install
npm run dev
# Opens at http://localhost:5175
```

---

## Firebase Schema — What You Read and Write

**Read** (via `onValue`): Listen for incoming alerts with `status: "INCOMING"` and `doctorAck: false`.

**Write** (via `update`): When the doctor taps Acknowledge, set `doctorAck: true` on the alert.

```
/hospitals/{HOSPITAL_ID}/alerts/{alertId}/
  patientName   string
  age           number
  condition     "CRITICAL" | "SERIOUS" | "STABLE"
  vitals:       { bp: string, pulse: number }
  eta           number   (minutes)
  driverId      string
  doctorAck     boolean  ← you write this to true on acknowledge
  status        string
  timestamp     number
```

---

## Correct Import Pattern

```js
import { db } from '../../shared/firebase.js';
import { HOSPITAL_ID, CONDITIONS } from '../../shared/types.js';
```

---

## App.jsx — Full Pattern

The doctor portal is simple: one screen that either shows "Waiting for alerts..." or a patient card.

```jsx
import { useEffect, useState } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../../shared/firebase.js';
import { HOSPITAL_ID } from '../../shared/types.js';

const conditionColors = {
  CRITICAL: 'border-red-500 bg-red-50',
  SERIOUS:  'border-orange-400 bg-orange-50',
  STABLE:   'border-green-400 bg-green-50',
};

export default function App() {
  const [alerts, setAlerts] = useState(null);  // null = loading
  const [acking, setAcking] = useState(null);  // alertId currently being acked

  useEffect(() => {
    const alertsRef = ref(db, `/hospitals/${HOSPITAL_ID}/alerts`);
    const unsubscribe = onValue(alertsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) { setAlerts([]); return; }

      // Show only INCOMING alerts not yet acked by doctor
      const incoming = Object.entries(data)
        .map(([id, val]) => ({ id, ...val }))
        .filter(a => a.status === 'INCOMING' && !a.doctorAck)
        .sort((a, b) => b.timestamp - a.timestamp);

      setAlerts(incoming);
    });
    return () => unsubscribe();
  }, []);

  async function acknowledge(alertId) {
    setAcking(alertId);
    try {
      await update(ref(db, `/hospitals/${HOSPITAL_ID}/alerts/${alertId}`), {
        doctorAck: true,
      });
      // Also notify backend so it can stop the escalation timer
      await fetch('http://localhost:8000/api/alert/doctor-ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      });
    } finally {
      setAcking(null);
    }
  }

  if (!alerts) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Loading...
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400 text-lg">
        No incoming patients
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Incoming Patients</h1>

      {alerts.map(alert => (
        <div key={alert.id}
             className={`rounded-2xl border-2 p-5 shadow-sm ${conditionColors[alert.condition]}`}>

          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{alert.patientName}</h2>
              <p className="text-gray-500">{alert.age} years • {alert.driverId}</p>
            </div>
            <span className={`text-sm font-bold px-3 py-1 rounded-full
              ${alert.condition === 'CRITICAL' ? 'bg-red-600 text-white' :
                alert.condition === 'SERIOUS'  ? 'bg-orange-500 text-white' :
                                                 'bg-green-500 text-white'}`}>
              {alert.condition}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4 text-center">
            <div className="bg-white rounded-xl p-2">
              <p className="text-xs text-gray-400">ETA</p>
              <p className="text-lg font-bold text-gray-800">{alert.eta} min</p>
            </div>
            <div className="bg-white rounded-xl p-2">
              <p className="text-xs text-gray-400">BP</p>
              <p className="text-lg font-bold text-gray-800">{alert.vitals?.bp}</p>
            </div>
            <div className="bg-white rounded-xl p-2">
              <p className="text-xs text-gray-400">Pulse</p>
              <p className="text-lg font-bold text-gray-800">{alert.vitals?.pulse}</p>
            </div>
          </div>

          <button
            onClick={() => acknowledge(alert.id)}
            disabled={acking === alert.id}
            className="w-full bg-blue-600 text-white rounded-xl py-3 font-bold text-lg
                       disabled:opacity-50 hover:bg-blue-700 transition-colors">
            {acking === alert.id ? 'Acknowledging...' : 'Acknowledge Patient'}
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## How Acknowledgement Works

1. `update()` writes `doctorAck: true` directly to Firebase — this is the fastest path and immediately updates the driver's Confirmation screen and admin dashboard
2. `fetch('POST /api/alert/doctor-ack')` notifies the backend — which stops the 60-second nurse escalation timer
3. Both happen in sequence — Firebase first, then backend

If the backend call fails, the Firebase write still went through. The driver sees "Doctor Acknowledged" correctly. Log the error but don't show it to the doctor.

---

## Common Mistakes to Avoid

- **Writing to wrong Firebase path:** The path must be `/hospitals/${HOSPITAL_ID}/alerts/${alertId}` — not `/alerts/${alertId}` directly.
- **Showing already-acked alerts:** Filter to `!a.doctorAck` so alerts disappear after the doctor taps — otherwise the card stays on screen confusingly.
- **Blocking the UI during ack:** Use an `acking` state per alert ID so only the tapped button shows "Acknowledging..." — other cards remain interactive.
- **Not handling null from Firebase:** `snapshot.val()` returns `null` when no alerts exist. Handle this before calling `Object.entries()`.
- **Forgetting unsubscribe:** Return the unsubscribe function from useEffect or you'll get stale listeners after remounts.

---

## Golden Rules

1. Import `db` from `../../shared/firebase.js` — never create your own Firebase init
2. Use `onValue()` for real-time alerts — not a one-time `get()`
3. Always return `() => unsubscribe()` from useEffect
4. Firebase write (`update`) first, then backend notify — never the reverse
5. Never hardcode `HOSPITAL_ID` — import from `../../shared/types.js`
6. Don't edit any file outside `portals/doctor/`
