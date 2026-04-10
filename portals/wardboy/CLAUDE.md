# Ward Boy Portal CLAUDE.md
## Owner: Aditya Dherange — Ward Boy Portal

---

## Your Role

You own everything inside `portals/wardboy/`. This portal is the ward boy's interface for bed preparation. The moment an ambulance alert fires, the ward boy receives a WhatsApp message (via backend + Twilio) and opens this portal to see which bed to prepare and confirm when it's ready.

When the ward boy confirms, it:
1. Sets `wardAck: true` in Firebase
2. Updates the driver's Confirmation screen with "Bed Assigned ✓"
3. Updates the admin dashboard live

This is a **single-purpose portal** — show the incoming patient details, show the bed to prep, provide one confirmation button. Keep it simple.

It runs at **http://localhost:5177**.

---

## Files You Own

```
portals/wardboy/
├── package.json
├── vite.config.js
├── index.html
└── src/
    └── App.jsx       # Bed prep confirmation — patient details + single confirm button
```

---

## Do Not Touch

- `portals/shared/` — Mehetab owns this. Import from it, never edit it.
- `portals/admin/`, `portals/driver/`, `portals/doctor/`, `portals/nurse/` — other portals.
- `backend/` — Mehetab only.

---

## Running the Portal

```bash
cd portals/wardboy
npm install
npm run dev
# Opens at http://localhost:5177
```

---

## Firebase Schema — What You Read and Write

**Read** (via `onValue`): Listen for `INCOMING` alerts where `wardAck: false`.

**Write** (via `update`): Set `wardAck: true` when the bed is ready.

```
/hospitals/{HOSPITAL_ID}/alerts/{alertId}/
  patientName   string
  age           number
  condition     "CRITICAL" | "SERIOUS" | "STABLE"
  eta           number   (minutes)
  wardAck       boolean  ← you write this to true on confirmation
  status        "INCOMING"
```

Also read bed availability for context:

```
/hospitals/{HOSPITAL_ID}/beds/
  icu:       { total: 20, occupied: 14 }
  general:   { total: 80, occupied: 61 }
  emergency: { total: 10, occupied: 7  }
```

---

## Correct Import Pattern

```js
import { db } from '../../shared/firebase.js';
import { HOSPITAL_ID } from '../../shared/types.js';
```

---

## App.jsx — Full Pattern

```jsx
import { useEffect, useState } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../../shared/firebase.js';
import { HOSPITAL_ID } from '../../shared/types.js';

// Map condition to recommended bed type
function recommendedBed(condition) {
  if (condition === 'CRITICAL') return 'ICU';
  if (condition === 'SERIOUS')  return 'Emergency';
  return 'General';
}

export default function App() {
  const [alerts, setAlerts]       = useState(null);
  const [beds, setBeds]           = useState(null);
  const [confirming, setConfirming] = useState(null);

  useEffect(() => {
    const alertsRef = ref(db, `/hospitals/${HOSPITAL_ID}/alerts`);
    const unsubAlerts = onValue(alertsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) { setAlerts([]); return; }

      const pending = Object.entries(data)
        .map(([id, val]) => ({ id, ...val }))
        .filter(a => a.status === 'INCOMING' && !a.wardAck)
        .sort((a, b) => b.timestamp - a.timestamp);

      setAlerts(pending);
    });

    const bedsRef = ref(db, `/hospitals/${HOSPITAL_ID}/beds`);
    const unsubBeds = onValue(bedsRef, (snapshot) => {
      setBeds(snapshot.val());
    });

    return () => {
      unsubAlerts();
      unsubBeds();
    };
  }, []);

  async function confirmBed(alertId) {
    setConfirming(alertId);
    try {
      await update(ref(db, `/hospitals/${HOSPITAL_ID}/alerts/${alertId}`), {
        wardAck: true,
      });
    } finally {
      setConfirming(null);
    }
  }

  if (!alerts || !beds) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Loading...
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-400 space-y-2">
        <span className="text-4xl">✓</span>
        <p className="text-lg">All beds assigned</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Bed Preparation</h1>

      {/* Current bed availability summary */}
      {beds && (
        <div className="grid grid-cols-3 gap-2 text-center">
          {Object.entries(beds).map(([type, data]) => {
            const available = data.total - data.occupied;
            return (
              <div key={type} className={`rounded-xl p-3
                ${available === 0 ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                <p className="text-xs uppercase text-gray-400 font-medium">{type}</p>
                <p className={`text-xl font-bold
                  ${available === 0 ? 'text-red-600' : 'text-gray-800'}`}>
                  {available}
                </p>
                <p className="text-xs text-gray-400">free</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Pending bed prep tasks */}
      {alerts.map(alert => {
        const bedType = recommendedBed(alert.condition);
        const bedData = beds?.[bedType.toLowerCase()];
        const available = bedData ? bedData.total - bedData.occupied : null;

        return (
          <div key={alert.id}
               className={`rounded-2xl border-2 p-5 space-y-4
                 ${alert.condition === 'CRITICAL' ? 'border-red-400 bg-red-50' :
                   alert.condition === 'SERIOUS'  ? 'border-orange-400 bg-orange-50' :
                                                    'border-green-400 bg-green-50'}`}>

            {/* Patient header */}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{alert.patientName}</h2>
                <p className="text-gray-500 text-sm">{alert.age}y • ETA {alert.eta} min</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full
                ${alert.condition === 'CRITICAL' ? 'bg-red-600 text-white' :
                  alert.condition === 'SERIOUS'  ? 'bg-orange-500 text-white' :
                                                   'bg-green-500 text-white'}`}>
                {alert.condition}
              </span>
            </div>

            {/* Bed assignment instruction */}
            <div className="bg-white rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase font-medium mb-1">Assign Bed</p>
              <p className="text-lg font-bold text-gray-800">{bedType} Ward</p>
              {available !== null && (
                <p className={`text-sm mt-1
                  ${available === 0 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                  {available === 0
                    ? 'No beds available — escalate to admin'
                    : `${available} bed${available !== 1 ? 's' : ''} available`}
                </p>
              )}
            </div>

            {/* Prep checklist (visual, not tracked in Firebase) */}
            <div className="space-y-1 text-sm text-gray-700">
              <p className="font-medium text-gray-500 text-xs uppercase">Prep steps</p>
              {[
                'Clean and disinfect the bed',
                'Set up oxygen supply if needed',
                'Ensure call bell is functional',
                'Confirm bed number with nurse',
              ].map(step => (
                <p key={step} className="flex items-center gap-2">
                  <span className="text-gray-300">○</span> {step}
                </p>
              ))}
            </div>

            {/* Confirm button */}
            <button
              onClick={() => confirmBed(alert.id)}
              disabled={confirming === alert.id}
              className="w-full bg-green-600 text-white rounded-xl py-3 font-bold text-lg
                         disabled:opacity-50 hover:bg-green-700 transition-colors">
              {confirming === alert.id ? 'Confirming...' : 'Bed Ready'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

---

## Design Decisions

- **Two `onValue` listeners in one `useEffect`:** One for alerts, one for bed counts. Both return unsubscribe functions — call both in the cleanup.
- **Visual prep checklist (not Firebase-tracked):** These steps are shown for guidance only. The only Firebase write is `wardAck: true` — keeping the schema simple.
- **`recommendedBed()` maps condition to ward:** CRITICAL → ICU, SERIOUS → Emergency, STABLE → General. This is the ward boy's instruction, not a hard lock.
- **Alert disappears after `wardAck: true`:** The filter `!a.wardAck` means once confirmed, the card is gone. This is intentional — job done, move on.

---

## Common Mistakes to Avoid

- **Single `useEffect` cleanup for two listeners:** Both `unsubAlerts()` and `unsubBeds()` must be called in the return function — missing one creates a memory leak.
- **Not checking null on bed data:** `beds` starts as `null` until Firebase responds. Gate the render behind `if (!alerts || !beds)`.
- **Missing the wardAck filter:** Without `!a.wardAck` in the filter, confirmed alerts stay on screen after pressing "Bed Ready", causing confusion.
- **Hardcoding HOSPITAL_ID:** Import from `../../shared/types.js`.
- **Writing to wrong path:** `update(ref(db, '/hospitals/HOSPITAL_ID/alerts/alertId'), { wardAck: true })` — make sure all three parts of the path are correct.

---

## Golden Rules

1. Import `db` from `../../shared/firebase.js` — never create your own Firebase init
2. Two `onValue` listeners in one `useEffect` — clean up both in the return function
3. Only Firebase write: `wardAck: true` on the alert node — nothing else
4. Use `onValue()` — not `get()` — for real-time updates
5. Never hardcode `HOSPITAL_ID` — import from `../../shared/types.js`
6. Don't edit any file outside `portals/wardboy/`
