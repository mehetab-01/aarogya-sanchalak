// PatientForm.jsx — Driver Emergency Alert Form
// Mobile-first: large tap targets, minimal fields, one submit action
// Owner: Sayali Bhagwat

import { useState } from 'react';
import { CONDITIONS } from '../../../shared/types.js';
import { Truck, Zap, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const DEMO_DATA = {
  patientName: 'Rahul Sharma',
  age: '34',
  condition: CONDITIONS.CRITICAL,
  vitals: { bp: '90/60', pulse: '112' },
  eta: '8',
  notes: 'Road accident. Unconscious on arrival. Head trauma suspected.',
};

const EMPTY_FORM = {
  patientName: '',
  age: '',
  condition: null,
  vitals: { bp: '', pulse: '' },
  eta: '',
  notes: '',
};

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

export default function PatientForm({ onAlertSent, user }) {
  const [form, setForm]       = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [demoLoaded, setDemoLoaded] = useState(false);

  function loadDemo() {
    setForm(DEMO_DATA);
    setDemoLoaded(true);
    toast.success('Demo data loaded');
  }

  function clearForm() {
    setForm(EMPTY_FORM);
    setDemoLoaded(false);
  }

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function setVital(key, value) {
    setForm(f => ({ ...f, vitals: { ...f.vitals, [key]: value } }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.condition) {
      toast.error('Please select a condition');
      return;
    }
    if (!form.patientName.trim()) {
      toast.error('Patient name is required');
      return;
    }
    setLoading(true);

    const payload = {
      patientName: form.patientName.trim(),
      age: Number(form.age),
      condition: form.condition,
      vitals: {
        bp: form.vitals.bp.trim(),
        pulse: Number(form.vitals.pulse),
      },
      eta: Number(form.eta),
      notes: form.notes.trim(),
      driverId: 'AMB-042',
      hospitalId: 'hospital1',
    };

    try {
      const res = await fetch('http://localhost:8000/api/alert/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      const alertId = data.alertId || data.alert_id || data.id;
      if (!alertId) throw new Error('No alert ID returned');
      
      toast.success('Alert transmitted');
      onAlertSent(alertId, payload);

    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        toast.error('Cannot connect to hospital server');
      } else {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-dvh max-w-[420px] mx-auto bg-[var(--color-bg-primary)]">
      {/* Top bar (PortalLayout equivalent for driver narrow screen) */}
      <div className="bg-[var(--color-bg-card)] border-b border-[var(--color-border)] h-14 px-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Truck size={18} className="text-[var(--color-serious)]" />
          <span className="text-[var(--font-md)] font-semibold text-[var(--color-text-primary)]">
            Aarogya Sanchalak
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded bg-[var(--color-serious-light)] text-[var(--color-serious)]">
            AMB-042
          </span>
          <button
            type="button"
            onClick={demoLoaded ? clearForm : loadDemo}
            className="flex items-center gap-1 text-[var(--font-xs)] font-medium bg-[var(--color-bg-secondary)] border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] px-2 py-1 rounded-[4px] hover:bg-gray-200"
          >
            {demoLoaded ? 'Clear' : <><Zap size={12} className="text-amber-500"/> Demo</>}
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
              value={form.patientName}
              onChange={e => setField('patientName', e.target.value)}
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
              value={form.age}
              onChange={e => setField('age', e.target.value)}
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
              const isActive = form.condition === cond;
              return (
                <button
                  key={cond}
                  type="button"
                  onClick={() => setField('condition', cond)}
                  className={clsx(
                    'condition-btn flex flex-col items-center justify-center rounded-[8px] border-2 py-3 px-1 min-h-[96px] transition-all',
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
              value={form.vitals.bp}
              onChange={e => setVital('bp', e.target.value)}
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
              value={form.vitals.pulse}
              onChange={e => setVital('pulse', e.target.value)}
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
              value={form.eta}
              onChange={e => setField('eta', e.target.value)}
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
            value={form.notes}
            onChange={e => setField('notes', e.target.value)}
            className={clsx(
              "w-full bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]",
              "border border-[var(--color-border)] rounded-[8px] px-4 py-3 min-h-[80px] text-[var(--font-base)] shadow-sm resize-none",
              "focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-colors"
            )}
          />
        </div>

        {/* Submit */}
        <div className="pt-4 pb-6">
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
