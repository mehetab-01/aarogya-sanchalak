# Driver Portal CLAUDE.md
## Owner: Sayali Bhagwat — Ambulance Driver Portal + Demo Data

---

## Your Role

You own everything inside `portals/driver/`. This is the ambulance driver's mobile interface — the first point of contact in the entire system. When the driver submits patient data, it triggers the entire emergency coordination chain.

This portal is **mobile-first**. Assume the driver is using a phone with one hand while managing the emergency. Large buttons, minimal text input, quick to fill, instant feedback.

It runs at **http://localhost:5174**.

You also own demo data — make sure the preloaded scenario is ready for the pitch before the demo begins.

---

## Files You Own

```
portals/driver/
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── App.jsx                   # Root: auth check, shows PatientForm or Confirmation
    └── components/
        ├── PatientForm.jsx       # Mobile form: patient details, condition buttons, submit
        └── Confirmation.jsx      # Live status: Hospital Notified → Doctor Ack → Bed Assigned
```

---

## Do Not Touch

- `portals/shared/` — Mehetab owns this. Import from it, never edit it.
- `portals/admin/`, `portals/doctor/`, `portals/nurse/`, `portals/wardboy/` — other portals.
- `backend/` — Mehetab only.

---

## Running the Portal

```bash
cd portals/driver
npm install
npm run dev
# Opens at http://localhost:5174
```

---

## The User Flow

```
1. Driver opens app on phone
2. Fills in patient form:
   - Patient name (text input)
   - Age (number input)
   - Condition (3 big buttons: CRITICAL / SERIOUS / STABLE)
   - BP (text, e.g. "90/60")
   - Pulse (number)
   - ETA in minutes (number)
3. Taps "Send Alert" button
4. App calls POST /api/alert/trigger (backend)
5. Navigates to Confirmation screen
6. Confirmation screen shows live Firebase status:
   "Hospital Notified ✓" → "Doctor Acknowledged ✓" → "Bed Assigned ✓"
```

---

## Firebase Schema — What You Read

After creating the alert via the backend API, you listen to the specific alert's node to show confirmation status:

```
/hospitals/{HOSPITAL_ID}/alerts/{alertId}/
  doctorAck     boolean   (watch this to show "Doctor Acknowledged")
  nurseAck      boolean   (watch this for nurse confirmation)
  wardAck       boolean   (watch this to show "Bed Assigned")
  status        string    ("INCOMING" → "ADMITTED")
```

You don't write to Firebase directly — writing happens through the backend API call.

---

## Correct Import Pattern

```js
import { db } from '../../shared/firebase.js';
import { HOSPITAL_ID, CONDITIONS } from '../../shared/types.js';
```

---

## PatientForm.jsx — Pattern to Follow

```jsx
import { useState } from 'react';
import { CONDITIONS } from '../../shared/types.js';

export default function PatientForm({ onAlertCreated }) {
  const [form, setForm] = useState({
    patientName: '',
    age: '',
    condition: null,   // must select one of the 3 buttons
    vitals: { bp: '', pulse: '' },
    eta: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.condition) { setError('Select a condition'); return; }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:8000/api/alert/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          age: Number(form.age),
          eta: Number(form.eta),
          vitals: { bp: form.vitals.bp, pulse: Number(form.vitals.pulse) },
          driverId: 'AMB-042',  // in real use, from auth context
        }),
      });

      if (!res.ok) throw new Error('Failed to trigger alert');
      const { alertId } = await res.json();
      onAlertCreated(alertId);   // navigate to Confirmation

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const conditionStyle = (cond) =>
    form.condition === cond
      ? 'bg-red-600 text-white'
      : 'bg-white text-red-600 border border-red-400';

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 max-w-sm mx-auto">
      <h1 className="text-xl font-bold text-center">Patient Alert</h1>

      <input
        required
        placeholder="Patient Name"
        className="w-full border rounded-lg px-4 py-3 text-lg"
        value={form.patientName}
        onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))}
      />

      {/* Condition — big tap targets */}
      <div className="grid grid-cols-3 gap-2">
        {Object.values(CONDITIONS).map(cond => (
          <button key={cond} type="button"
            className={`rounded-lg py-4 font-bold text-sm ${conditionStyle(cond)}`}
            onClick={() => setForm(f => ({ ...f, condition: cond }))}>
            {cond}
          </button>
        ))}
      </div>

      {/* Age, BP, Pulse, ETA */}
      <input required type="number" placeholder="Age"
        className="w-full border rounded-lg px-4 py-3 text-lg"
        value={form.age}
        onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />

      <input required placeholder="BP (e.g. 90/60)"
        className="w-full border rounded-lg px-4 py-3 text-lg"
        value={form.vitals.bp}
        onChange={e => setForm(f => ({ ...f, vitals: { ...f.vitals, bp: e.target.value } }))} />

      <input required type="number" placeholder="Pulse (bpm)"
        className="w-full border rounded-lg px-4 py-3 text-lg"
        value={form.vitals.pulse}
        onChange={e => setForm(f => ({ ...f, vitals: { ...f.vitals, pulse: e.target.value } }))} />

      <input required type="number" placeholder="ETA (minutes)"
        className="w-full border rounded-lg px-4 py-3 text-lg"
        value={form.eta}
        onChange={e => setForm(f => ({ ...f, eta: e.target.value }))} />

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full bg-red-600 text-white rounded-lg py-4 text-lg font-bold
                   disabled:opacity-50">
        {loading ? 'Sending Alert...' : 'Send Alert'}
      </button>
    </form>
  );
}
```

---

## Confirmation.jsx — Pattern to Follow

```jsx
import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../shared/firebase.js';
import { HOSPITAL_ID } from '../../shared/types.js';

export default function Confirmation({ alertId }) {
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const alertRef = ref(db, `/hospitals/${HOSPITAL_ID}/alerts/${alertId}`);
    const unsubscribe = onValue(alertRef, (snapshot) => {
      setAlert(snapshot.val());
    });
    return () => unsubscribe();
  }, [alertId]);

  if (!alert) return <div className="text-center p-8">Connecting...</div>;

  const steps = [
    { label: 'Hospital Notified', done: true },             // always true once we're here
    { label: 'Doctor Acknowledged', done: alert.doctorAck },
    { label: 'Bed Assigned', done: alert.wardAck },
  ];

  return (
    <div className="p-6 max-w-sm mx-auto space-y-4">
      <h1 className="text-xl font-bold text-center text-red-600">
        Alert Active — ETA {alert.eta} min
      </h1>
      <p className="text-center text-gray-600">
        {alert.patientName}, {alert.age}y • {alert.condition}
      </p>

      <div className="space-y-3 mt-6">
        {steps.map(({ label, done }) => (
          <div key={label}
               className={`flex items-center gap-3 p-4 rounded-xl border
                           ${done ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
            <span className={`text-2xl ${done ? 'text-green-500' : 'text-gray-300'}`}>
              {done ? '✓' : '○'}
            </span>
            <span className={`font-medium ${done ? 'text-green-700' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Demo Data (Your Responsibility)

Preload this scenario so the form fills instantly during the pitch:

```
Patient Name: Rahul Sharma
Age: 34
Condition: CRITICAL (pre-selected)
BP: 90/60
Pulse: 112
ETA: 8
Driver ID: AMB-042
```

Consider adding a "Load Demo Data" button that fills the form programmatically:

```jsx
function loadDemo() {
  setForm({
    patientName: 'Rahul Sharma',
    age: '34',
    condition: 'CRITICAL',
    vitals: { bp: '90/60', pulse: '112' },
    eta: '8',
  });
}
```

Place this as a small "Demo" button in the top-right corner of the form — visible only for the pitch.

---

## Common Mistakes to Avoid

- **Not handling loading state on submit:** The form must disable the submit button and show "Sending Alert..." while the `fetch` call is in progress. Judges will test double-tapping.
- **Not handling network errors:** Wrap the fetch in try/catch. If the backend is down during the demo, show a clear error message instead of a silent failure.
- **Listening on the wrong Firebase path:** The `Confirmation` component needs `alertId` — this comes from the backend response, not from Firebase client-side push.
- **Forgetting to clean up onValue:** Always `return () => unsubscribe()` in the useEffect cleanup.
- **Not handling null alert:** Firebase can return null briefly. Show "Connecting..." until the data arrives.

---

## Golden Rules

1. This portal is mobile-first — large tap targets (py-3 or py-4 minimum), readable text at arm's length
2. Import `db` from `../../shared/firebase.js` — never create your own Firebase init
3. Alert creation goes through `POST /api/alert/trigger` — you never write to Firebase directly
4. Use `onValue()` on the specific alert node in Confirmation — not a full alerts scan
5. Never hardcode `HOSPITAL_ID` — import from `../../shared/types.js`
6. Don't edit any file outside `portals/driver/`
