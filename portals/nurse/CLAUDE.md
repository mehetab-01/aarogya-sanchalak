# Nurse Portal CLAUDE.md
## Owner: Aditya Dherange — Nurse Portal

---

## Your Role

You own everything inside `portals/nurse/`. This portal activates when a patient alert comes in — the nurse sees a task checklist to prepare for the incoming patient. Each checklist item is a Firebase write, giving the admin dashboard a live audit trail of preparation steps.

The nurse portal also serves as the **escalation fallback**: if the doctor hasn't acknowledged within 60 seconds, Twilio calls the nurse. This portal ensures they have the patient details immediately when they open it.

It runs at **http://localhost:5176**.

---

## Files You Own

```
portals/nurse/
├── package.json
├── vite.config.js
├── index.html
└── src/
    └── App.jsx       # Task checklist with Firebase writes per item
```

---

## Do Not Touch

- `portals/shared/` — Mehetab owns this. Import from it, never edit it.
- `portals/admin/`, `portals/driver/`, `portals/doctor/`, `portals/wardboy/` — other portals.
- `backend/` — Mehetab only.

---

## Running the Portal

```bash
cd portals/nurse
npm install
npm run dev
# Opens at http://localhost:5176
```

---

## Firebase Schema — What You Read and Write

**Read** (via `onValue`): Listen for `INCOMING` alerts.

**Write** (via `update`): Mark tasks complete and set `nurseAck: true` when all tasks are done.

```
/hospitals/{HOSPITAL_ID}/alerts/{alertId}/
  patientName   string
  age           number
  condition     "CRITICAL" | "SERIOUS" | "STABLE"
  vitals:       { bp: string, pulse: number }
  eta           number
  status        "INCOMING"
  nurseAck      boolean  ← you write this to true when tasks complete
```

There's no separate `nurseTasks` node — `nurseAck` being `true` signals the nurse is fully prepared. You can track task completion locally in component state.

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

// Preparation tasks the nurse must complete
const PREP_TASKS = [
  'Review patient vitals and condition',
  'Prepare IV line and fluids',
  'Set up monitoring equipment',
  'Notify attending physician',
  'Prepare medication cart',
  'Clear and prep assigned bed',
];

export default function App() {
  const [alerts, setAlerts] = useState(null);
  const [tasks, setTasks] = useState({});    // { alertId: Set<taskIndex> }
  const [submitting, setSubmitting] = useState(null);

  useEffect(() => {
    const alertsRef = ref(db, `/hospitals/${HOSPITAL_ID}/alerts`);
    const unsubscribe = onValue(alertsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) { setAlerts([]); return; }

      const incoming = Object.entries(data)
        .map(([id, val]) => ({ id, ...val }))
        .filter(a => a.status === 'INCOMING')
        .sort((a, b) => b.timestamp - a.timestamp);

      setAlerts(incoming);
    });
    return () => unsubscribe();
  }, []);

  function toggleTask(alertId, taskIndex) {
    setTasks(prev => {
      const alertTasks = new Set(prev[alertId] || []);
      if (alertTasks.has(taskIndex)) {
        alertTasks.delete(taskIndex);
      } else {
        alertTasks.add(taskIndex);
      }
      return { ...prev, [alertId]: alertTasks };
    });
  }

  function allTasksDone(alertId) {
    const done = tasks[alertId];
    return done && done.size === PREP_TASKS.length;
  }

  async function confirmReady(alertId) {
    setSubmitting(alertId);
    try {
      await update(ref(db, `/hospitals/${HOSPITAL_ID}/alerts/${alertId}`), {
        nurseAck: true,
      });
    } finally {
      setSubmitting(null);
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
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Nurse Preparation</h1>

      {alerts.map(alert => {
        const alertTasks = tasks[alert.id] || new Set();
        const completed = alertTasks.size;
        const total = PREP_TASKS.length;

        return (
          <div key={alert.id} className="bg-white rounded-2xl shadow p-5 space-y-4">
            {/* Patient header */}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">{alert.patientName}</h2>
                <p className="text-gray-500 text-sm">{alert.age}y • {alert.condition} • ETA {alert.eta} min</p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full
                ${alert.condition === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                  alert.condition === 'SERIOUS'  ? 'bg-orange-100 text-orange-700' :
                                                   'bg-green-100 text-green-700'}`}>
                {alert.condition}
              </span>
            </div>

            {/* Vitals bar */}
            <div className="flex gap-4 text-sm bg-gray-50 rounded-xl p-3">
              <span><span className="text-gray-400">BP</span> {alert.vitals?.bp}</span>
              <span><span className="text-gray-400">Pulse</span> {alert.vitals?.pulse}</span>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(completed / total) * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-500">{completed}/{total}</span>
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              {PREP_TASKS.map((task, idx) => {
                const done = alertTasks.has(idx);
                return (
                  <button key={idx} type="button"
                    onClick={() => toggleTask(alert.id, idx)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left
                      transition-colors
                      ${done
                        ? 'bg-green-50 border-green-300 text-green-800'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                    <span className={`w-5 h-5 rounded flex items-center justify-center text-sm
                      flex-shrink-0
                      ${done ? 'bg-green-500 text-white' : 'border border-gray-300'}`}>
                      {done ? '✓' : ''}
                    </span>
                    <span className={done ? 'line-through' : ''}>{task}</span>
                  </button>
                );
              })}
            </div>

            {/* Confirm ready — only enabled when all tasks done */}
            {!alert.nurseAck && (
              <button
                onClick={() => confirmReady(alert.id)}
                disabled={!allTasksDone(alert.id) || submitting === alert.id}
                className="w-full bg-blue-600 text-white rounded-xl py-3 font-bold
                           disabled:opacity-40 hover:bg-blue-700 transition-colors">
                {submitting === alert.id ? 'Confirming...' : 'Confirm Ready'}
              </button>
            )}

            {alert.nurseAck && (
              <div className="text-center text-green-600 font-semibold py-2">
                Preparation Confirmed ✓
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

---

## Design Decisions

- **Task state is local (useState), not Firebase.** Individual tasks don't need to be tracked in the DB — only the final `nurseAck: true` confirmation matters. This keeps the schema clean.
- **"Confirm Ready" button is disabled until all tasks are checked.** This forces the nurse to go through the full checklist before marking done.
- **Alert disappears after nurseAck?** No — keep the card visible but show "Preparation Confirmed ✓" so the nurse can still see patient details.

---

## Common Mistakes to Avoid

- **Storing task state in Firebase per task:** Overkill. Keep it in `useState`. Only write `nurseAck: true` when done.
- **Enabling "Confirm Ready" before all tasks done:** The button should be `disabled={!allTasksDone(alertId)}` — no partial confirmations.
- **Not handling null snapshot:** `snapshot.val()` is `null` when the alerts node is empty. Check before `Object.entries()`.
- **Forgetting to unsubscribe:** Always return `() => unsubscribe()` from the `useEffect` cleanup.
- **Hardcoding HOSPITAL_ID:** Import from `../../shared/types.js`.

---

## Golden Rules

1. Import `db` from `../../shared/firebase.js` — never create your own Firebase init
2. Local task completion state (`useState`) — write only `nurseAck: true` to Firebase when done
3. Use `onValue()` for real-time alert display — not `get()`
4. Always return `() => unsubscribe()` from useEffect
5. Never hardcode `HOSPITAL_ID` — import from `../../shared/types.js`
6. Don't edit any file outside `portals/nurse/`
