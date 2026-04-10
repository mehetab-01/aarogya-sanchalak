// SimulateFlow.jsx — Admin Portal
// Triggers a realistic multi-patient simulation for hackathon demo.
// Registers 5 patients via POST /api/alert/trigger with staggered delays.

import { useRef, useState } from 'react';
import { Zap } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const HOSPITAL_ID = 'hospital1';

const DEMO_PATIENTS = [
  {
    patientName: 'Rahul Sharma',
    age: 34,
    condition: 'CRITICAL',
    bp: '90/60',
    pulse: 112,
    eta: 8,
    driverId: 'AMB-042',
    notes: 'Road accident, unconscious',
  },
  {
    patientName: 'Priya Mehta',
    age: 28,
    condition: 'SERIOUS',
    bp: '110/70',
    pulse: 95,
    eta: 12,
    driverId: 'AMB-017',
    notes: 'Fall from height, leg fracture',
  },
  {
    patientName: 'Arjun Patil',
    age: 56,
    condition: 'CRITICAL',
    bp: '80/50',
    pulse: 130,
    eta: 5,
    driverId: 'AMB-031',
    notes: 'Chest pain, suspected cardiac',
  },
  {
    patientName: 'Sunita Desai',
    age: 42,
    condition: 'SERIOUS',
    bp: '130/85',
    pulse: 88,
    eta: 15,
    driverId: 'AMB-009',
    notes: 'Burns on arms and torso',
  },
  {
    patientName: 'Vikram Nair',
    age: 19,
    condition: 'STABLE',
    bp: '120/80',
    pulse: 78,
    eta: 20,
    driverId: 'AMB-055',
    notes: 'Minor head injury, conscious',
  },
];

const DELAYS_MS = [0, 8000, 20000, 35000, 50000];

export default function SimulateFlow() {
  const [simActive, setSimActive]   = useState(false);
  const [simPatients, setSimPatients] = useState([]);
  const simTimerRef = useRef([]);

  const fmtNow = () =>
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  async function registerPatient(patient) {
    try {
      await fetch(`${API_BASE_URL}/api/alert/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patient),
      });
      setSimPatients((prev) => [...prev, { ...patient, time: fmtNow() }]);
    } catch (e) {
      console.error('[SimulateFlow] patient registration failed:', e);
    }
  }

  function startSimulation() {
    setSimActive(true);
    setSimPatients([]);

    const timers = DEMO_PATIENTS.map((patient, i) => {
      const id = setTimeout(() => registerPatient(patient), DELAYS_MS[i]);
      return id;
    });

    simTimerRef.current = timers;
  }

  async function stopSimulation() {
    simTimerRef.current.forEach((id) => clearTimeout(id));
    simTimerRef.current = [];
    setSimActive(false);
    setSimPatients([]);

    try {
      const [{ ref, set }, { db }] = await Promise.all([
        import('firebase/database'),
        import('../../../shared/firebase.js'),
      ]);

      await set(ref(db, `/hospitals/${HOSPITAL_ID}/alerts`), null);
      await set(ref(db, `/hospitals/${HOSPITAL_ID}/beds`), {
        icu:       { total: 20, occupied: 14 },
        general:   { total: 80, occupied: 61 },
        emergency: { total: 10, occupied: 7  },
      });
    } catch (e) {
      console.error('[SimulateFlow] reset failed:', e);
    }
  }

  const conditionColor = {
    CRITICAL: 'var(--color-critical)',
    SERIOUS:  'var(--color-serious)',
    STABLE:   'var(--color-stable)',
  };

  return (
    <div style={{
      backgroundColor: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 10,
      padding: 20,
      boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: simActive ? 16 : 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={16} style={{ color: 'var(--color-brand)' }} />
          <span style={{
            fontSize: 'var(--font-sm)', fontWeight: 500,
            color: 'var(--color-text-primary)',
          }}>
            Simulate Emergency Flow
          </span>
        </div>

        {/* Toggle */}
        <div
          onClick={() => simActive ? stopSimulation() : startSimulation()}
          role="switch"
          aria-checked={simActive}
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}
        >
          <span style={{
            fontSize: 11, color: simActive ? 'var(--color-brand)' : 'var(--color-text-muted)',
            fontWeight: 500,
          }}>
            {simActive ? 'Simulation Active' : 'Simulation Off'}
          </span>
          <div style={{
            width: 36, height: 20, borderRadius: 999,
            backgroundColor: simActive ? 'var(--color-brand)' : 'var(--color-bg-secondary)',
            border: `1px solid ${simActive ? 'var(--color-brand)' : 'var(--color-border)'}`,
            position: 'relative', transition: 'background-color 0.2s',
            flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute', top: 2,
              left: simActive ? 17 : 2,
              width: 14, height: 14, borderRadius: '50%',
              backgroundColor: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              transition: 'left 0.2s',
            }} />
          </div>
        </div>
      </div>

      {/* Off state */}
      {!simActive && (
        <div>
          <p style={{
            fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 14, lineHeight: 1.5,
          }}>
            Enable simulation to auto-register test patients and demonstrate
            the full emergency coordination flow.
          </p>
          <button
            onClick={startSimulation}
            style={{
              border: '1px solid var(--color-brand)',
              color: 'var(--color-brand)',
              backgroundColor: 'transparent',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 'var(--font-sm)',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Start Simulation
          </button>
        </div>
      )}

      {/* Active state */}
      {simActive && (
        <div>
          {/* Running indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              backgroundColor: 'var(--color-stable)',
              display: 'inline-block',
              animation: 'pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite',
            }} />
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-stable)', fontWeight: 500 }}>
              Simulation running
            </span>
          </div>

          {/* Registered patients */}
          {simPatients.length > 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14,
            }}>
              {simPatients.map((p, i) => (
                <span key={i} style={{
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  {'• '}
                  <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                    {p.patientName}
                  </span>
                  {' — '}
                  <span style={{ color: conditionColor[p.condition] ?? 'var(--color-text-muted)' }}>
                    {p.condition}
                  </span>
                  {' — '}
                  {p.time}
                </span>
              ))}
            </div>
          )}

          {simPatients.length === 0 && (
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 14 }}>
              Registering first patient...
            </p>
          )}

          <button
            onClick={stopSimulation}
            style={{
              border: '1px solid var(--color-critical)',
              color: 'var(--color-critical)',
              backgroundColor: 'transparent',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Stop & Reset
          </button>
        </div>
      )}

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
