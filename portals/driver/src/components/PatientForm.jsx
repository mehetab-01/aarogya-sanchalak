// PatientForm.jsx — Driver Emergency Alert Form
// Mobile-first: large tap targets, minimal fields, one submit action
// Owner: Sayali Bhagwat

import { useRef, useState } from 'react';
import { CONDITIONS } from '../../../shared/types.js';
import { Truck, Zap, AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const DEMO_PATIENTS = [
  {
    patientName: 'Rahul Sharma',
    age: '34',
    condition: CONDITIONS.CRITICAL,
    bp: '90/60',
    pulse: '112',
    eta: '8',
    driverId: 'AMB-042',
    notes: 'Road accident, unconscious on arrival',
  },
  {
    patientName: 'Priya Mehta',
    age: '28',
    condition: CONDITIONS.SERIOUS,
    bp: '110/70',
    pulse: '95',
    eta: '12',
    driverId: 'AMB-017',
    notes: 'Fall from height, suspected leg fracture',
  },
  {
    patientName: 'Arjun Patil',
    age: '56',
    condition: CONDITIONS.CRITICAL,
    bp: '80/50',
    pulse: '130',
    eta: '5',
    driverId: 'AMB-031',
    notes: 'Chest pain, suspected cardiac arrest',
  },
  {
    patientName: 'Sunita Desai',
    age: '42',
    condition: CONDITIONS.SERIOUS,
    bp: '130/85',
    pulse: '88',
    eta: '15',
    driverId: 'AMB-009',
    notes: 'Burns on arms and torso, conscious',
  },
  {
    patientName: 'Vikram Nair',
    age: '19',
    condition: CONDITIONS.STABLE,
    bp: '120/80',
    pulse: '78',
    eta: '20',
    driverId: 'AMB-055',
    notes: 'Minor head injury, fully conscious',
  },
];

const CONDITION_CONFIG = {
  [CONDITIONS.CRITICAL]: {
    label: 'CRITICAL',
    icon: <AlertTriangle size={24} />,
    active: 'bg-[var(--color-critical)] border-[var(--color-critical)] text-white shadow-card ring-2 ring-offset-1 ring-[var(--color-critical)]',
    inactive: 'bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-critical)] hover:bg-[var(--color-critical-light)]',
    desc: 'Life-threatening',
  },
  [CONDITIONS.SERIOUS]: {
    label: 'SERIOUS',
    icon: <AlertTriangle size={24} />,
    active: 'bg-[var(--color-serious)] border-[var(--color-serious)] text-white shadow-card ring-2 ring-offset-1 ring-[var(--color-serious)]',
    inactive: 'bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-serious)] hover:bg-[var(--color-serious-light)]',
    desc: 'Urgent care',
  },
  [CONDITIONS.STABLE]: {
    label: 'STABLE',
    icon: <AlertTriangle size={24} />,
    active: 'bg-[var(--color-stable)] border-[var(--color-stable)] text-white shadow-card ring-2 ring-offset-1 ring-[var(--color-stable)]',
    inactive: 'bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-stable)] hover:bg-[var(--color-stable-light)]',
    desc: 'Monitoring',
  },
};

const EMPTY = {
  patientName: '',
  age: '',
  condition: null,
  bp: '',
  pulse: '',
  eta: '',
  driverId: '',
  notes: '',
};

export default function PatientForm({ onAlertSent, user }) {
  const [patientName, setPatientName] = useState('');
  const [age,         setAge]         = useState('');
  const [condition,   setCondition]   = useState(null);
  const [bp,          setBp]          = useState('');
  const [pulse,       setPulse]       = useState('');
  const [eta,         setEta]         = useState('');
  const [driverId,    setDriverId]    = useState('');
  const [notes,       setNotes]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

  const lastDemoIndex = useRef(-1);

  const hasAnyValue = patientName || age || condition || bp || pulse || eta || notes;

  function loadDemoData() {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * DEMO_PATIENTS.length);
    } while (nextIndex === lastDemoIndex.current && DEMO_PATIENTS.length > 1);

    lastDemoIndex.current = nextIndex;
    const p = DEMO_PATIENTS[nextIndex];

    setPatientName(p.patientName);
    setAge(p.age);
    setCondition(p.condition);
    setBp(p.bp);
    setPulse(p.pulse);
    setEta(p.eta);
    setDriverId(p.driverId);
    setNotes(p.notes);
    setError(null);
    toast.success(`Demo: ${p.patientName}`);
  }

  function clearDemoData() {
    setPatientName('');
    setAge('');
    setCondition(null);
    setBp('');
    setPulse('');
    setEta('');
    setDriverId('');
    setNotes('');
    setError(null);
    lastDemoIndex.current = -1;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!patientName.trim() || !condition || !age || !eta) {
      setError('Please fill all required fields');
      return;
    }
    if (!bp.trim() || !pulse) {
      setError('Please fill BP and Pulse');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/alert/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: patientName.trim(),
          age:         parseInt(age)   || 0,
          condition,
          bp:          bp.trim(),
          pulse:       parseInt(pulse) || 0,
          eta:         parseInt(eta)   || 0,
          driverId:    driverId.trim() || 'AMB-001',
          notes:       notes.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      const alertId = data.alertId || data.alert_id || data.id;
      if (!alertId) throw new Error('No alert ID returned from server');

      toast.success('Alert transmitted');
      onAlertSent(alertId, {
        patientName: patientName.trim(),
        age:         parseInt(age) || 0,
        condition,
        bp:          bp.trim(),
        pulse:       parseInt(pulse) || 0,
        eta:         parseInt(eta) || 0,
        driverId:    driverId.trim() || 'AMB-001',
        notes:       notes.trim(),
      });

    } catch (err) {
      if (err?.message) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('Failed to send alert. Check backend connection.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-dvh max-w-[420px] mx-auto bg-[var(--color-bg-primary)]">

      {/* Top bar */}
      <div className="bg-[var(--color-bg-card)] border-b border-[var(--color-border)] h-14 px-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Truck size={18} className="text-[var(--color-serious)]" />
          <span className="text-[var(--font-md)] font-semibold text-[var(--color-text-primary)]">
            Aarogya Sanchalak
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded bg-[var(--color-serious-light)] text-[var(--color-serious)]">
            {driverId || 'AMB-001'}
          </span>
          <button
            type="button"
            onClick={hasAnyValue ? clearDemoData : loadDemoData}
            className="flex items-center gap-1 text-[var(--font-xs)] font-medium bg-[var(--color-bg-secondary)] border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] px-2 py-1 rounded-[4px] hover:bg-gray-200"
          >
            {hasAnyValue ? <><X size={12} /> Clear</> : <><Zap size={12} className="text-amber-500" /> Demo</>}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 p-5 space-y-5">

        {/* Patient Identity */}
        <div className="space-y-4">
          <div>
            <label className="block text-[var(--font-sm)] font-medium text-[var(--color-text-secondary)] mb-1" htmlFor="patient-name">
              Patient Name *
            </label>
            <input
              id="patient-name"
              type="text"
              required
              placeholder="Full name"
              value={patientName}
              onChange={e => setPatientName(e.target.value)}
              className={clsx(
                "w-full bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]",
                "border border-[var(--color-border)] rounded-[8px] px-4 min-h-[48px] text-[var(--font-md)] shadow-sm",
                "focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-colors"
              )}
            />
          </div>

          <div>
            <label className="block text-[var(--font-sm)] font-medium text-[var(--color-text-secondary)] mb-1" htmlFor="patient-age">
              Age *
            </label>
            <input
              id="patient-age"
              type="number"
              required
              min={0}
              max={120}
              placeholder="Years"
              value={age}
              onChange={e => setAge(e.target.value)}
              className={clsx(
                "w-full font-data bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]",
                "border border-[var(--color-border)] rounded-[8px] px-4 min-h-[48px] text-[var(--font-md)] shadow-sm",
                "focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-colors"
              )}
            />
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-[var(--font-sm)] font-medium text-[var(--color-text-secondary)] mb-2">
            Condition Level *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(CONDITIONS).map(cond => {
              const cfg = CONDITION_CONFIG[cond];
              const isActive = condition === cond;
              return (
                <button
                  key={cond}
                  type="button"
                  onClick={() => setCondition(cond)}
                  className={clsx(
                    'flex flex-col items-center justify-center rounded-[8px] border-2 py-3 px-1 min-h-[96px] transition-all',
                    isActive ? cfg.active : cfg.inactive
                  )}
                >
                  <span className="mb-1">{cfg.icon}</span>
                  <span className="font-bold text-[12px] tracking-wide">{cfg.label}</span>
                  <span className="text-[10px] font-normal mt-0.5 opacity-80">{cfg.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Vitals */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[var(--font-sm)] font-medium text-[var(--color-text-secondary)] mb-1" htmlFor="bp-input">
              BP <span className="text-[10px] font-normal opacity-70">(mmHg)</span>
            </label>
            <input
              id="bp-input"
              type="text"
              placeholder="120/80"
              value={bp}
              onChange={e => setBp(e.target.value)}
              className={clsx(
                "w-full font-data bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]",
                "border border-[var(--color-border)] rounded-[8px] px-4 min-h-[48px] text-[var(--font-md)] shadow-sm",
                "focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-colors"
              )}
            />
          </div>
          <div>
            <label className="block text-[var(--font-sm)] font-medium text-[var(--color-text-secondary)] mb-1" htmlFor="pulse-input">
              Pulse <span className="text-[10px] font-normal opacity-70">(bpm)</span>
            </label>
            <input
              id="pulse-input"
              type="number"
              min={0}
              max={300}
              placeholder="112"
              value={pulse}
              onChange={e => setPulse(e.target.value)}
              className={clsx(
                "w-full font-data bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]",
                "border border-[var(--color-border)] rounded-[8px] px-4 min-h-[48px] text-[var(--font-md)] shadow-sm",
                "focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-colors"
              )}
            />
          </div>
        </div>

        {/* ETA */}
        <div>
          <label className="block text-[var(--font-sm)] font-medium text-[var(--color-text-secondary)] mb-1" htmlFor="eta-input">
            ETA <span className="text-[10px] font-normal opacity-70">(minutes) *</span>
          </label>
          <div className="relative">
            <input
              id="eta-input"
              type="number"
              required
              min={1}
              max={120}
              placeholder="8"
              value={eta}
              onChange={e => setEta(e.target.value)}
              className={clsx(
                "w-full font-data bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]",
                "border border-[var(--color-border)] rounded-[8px] px-4 pr-16 min-h-[64px] text-[var(--font-2xl)] font-bold text-center shadow-sm",
                "focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-colors"
              )}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-[var(--font-sm)] pointer-events-none">
              min
            </span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[var(--font-sm)] font-medium text-[var(--color-text-secondary)] mb-1" htmlFor="notes-input">
            Clinical Notes <span className="text-[10px] font-normal opacity-70">(optional)</span>
          </label>
          <textarea
            id="notes-input"
            rows={2}
            placeholder="Trauma, allergies, symptoms..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className={clsx(
              "w-full bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]",
              "border border-[var(--color-border)] rounded-[8px] px-4 py-3 min-h-[80px] text-[var(--font-base)] shadow-sm resize-none",
              "focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-colors"
            )}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-[var(--color-critical-light)] border border-[var(--color-critical)] rounded-[8px] px-4 py-3 flex items-start gap-3">
            <AlertTriangle size={16} className="text-[var(--color-critical)] shrink-0 mt-0.5" />
            <p className="text-[var(--color-critical)] text-[var(--font-sm)] font-medium leading-snug">
              {error}
            </p>
          </div>
        )}

        {/* Submit */}
        <div className="pb-6">
          <button
            type="submit"
            disabled={loading}
            className={clsx(
              "w-full select-none rounded-[10px] min-h-[64px] flex items-center justify-center gap-2",
              "text-white font-bold text-[var(--font-lg)] tracking-wide uppercase transition-all shadow-card",
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[var(--color-critical)] hover:bg-[#7b1515] active:scale-[0.98]"
            )}
          >
            {loading ? (
              <><span className="spinner" style={{ width: 22, height: 22, borderWidth: 3 }} /> Transmitting...</>
            ) : (
              <><AlertTriangle size={24} /> Alert Hospital</>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
