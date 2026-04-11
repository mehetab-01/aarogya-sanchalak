// Confirmation.jsx — Live Firebase status screen
// onValue() listener shows doctorAck, nurseAck, wardAck in real-time
// Owner: Sayali Bhagwat

import { useEffect, useState } from 'react';
import { HOSPITAL_ID } from '../../../shared/types.js';
import { Truck, CheckCircle, Activity, Bed, User, Shield, Phone, Stethoscope, ClipboardList, Package } from 'lucide-react';
import clsx from 'clsx';
import StatusBadge from '../../../shared/components/StatusBadge.jsx';

const STEPS = [
  {
    key:   'hospitalNotified',
    label: 'Hospital Notified',
    desc:  'Alert received by system',
    Icon:  CheckCircle,
    alwaysDone: true,
  },
  {
    key:   'doctorAck',
    label: 'Doctor Acknowledged',
    desc:  'Attending physician alerted',
    Icon:  Stethoscope,
  },
  {
    key:   'nurseAck',
    label: 'Nurse Ready',
    desc:  'Nursing team preparing',
    Icon:  ClipboardList,
  },
  {
    key:   'wardAck',
    label: 'Bed Assigned',
    desc:  'Ward team confirmed bed prep',
    Icon:  Bed,
  },
];

export default function Confirmation({ alertId, patientData, onNewAlert }) {
  const [alertSnap, setAlertSnap] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [elapsed, setElapsed]     = useState(0);

  // Firebase real-time listener
  useEffect(() => {
    if (!alertId) return;
    let unsubscribe;
    let cancelled = false;

    Promise.all([
      import('firebase/database'),
      import('../../../shared/firebase.js'),
    ]).then(([{ ref, onValue }, { db }]) => {
      if (cancelled) return;
      try {
        const alertRef = ref(db, `/hospitals/${HOSPITAL_ID}/alerts/${alertId}`);
        unsubscribe = onValue(alertRef, snapshot => {
          if (!cancelled) {
            setAlertSnap(snapshot.val());
            setLoading(false);
          }
        });
      } catch (err) {
        console.warn('[Confirmation] Firebase listener failed:', err.message);
        if (!cancelled) setLoading(false);
      }
    }).catch(err => {
      console.warn('[Confirmation] Firebase module failed:', err.message);
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [alertId]);

  // Elapsed time counter
  useEffect(() => {
    const timer = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  function formatElapsed(s) {
    if (s < 60) return `${s}s ago`;
    return `${Math.floor(s / 60)}m ${s % 60}s ago`;
  }

  // Show connecting state
  if (loading) {
    return (
      <div className="min-h-dvh bg-[var(--color-bg-primary)] flex justify-center items-center">
        <div className="text-center space-y-4">
          <div className="spinner mx-auto" style={{ width: 40, height: 40, borderWidth: 4, borderColor: 'var(--color-border-strong)', borderTopColor: 'var(--color-brand)' }} />
          <p className="text-[var(--color-text-primary)] font-medium">Connecting to hospital...</p>
          <p className="font-data text-[var(--color-text-muted)] text-[var(--font-sm)]">Alert: {alertId}</p>
        </div>
      </div>
    );
  }

  // Merge Firebase data with local patientData (fallback if Firebase not yet written)
  const data = alertSnap || patientData || {};
  const steps = STEPS.map(step => ({
    ...step,
    done: step.alwaysDone || Boolean(data[step.key]),
  }));
  const doneCount = steps.filter(s => s.done).length;
  const allDone   = doneCount === steps.length;

  return (
    <div className="min-h-dvh flex flex-col max-w-[420px] mx-auto bg-[var(--color-bg-primary)]">
      {/* Top bar */}
      <div className="bg-[var(--color-bg-card)] border-b border-[var(--color-border)] h-14 px-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Truck size={18} className="text-[var(--color-serious)]" />
          <span className="text-[var(--font-md)] font-semibold text-[var(--color-text-primary)]">
            Aarogya Sanchalak
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-critical-light)] border border-[var(--color-critical)]">
            <span className="w-2 h-2 rounded-full bg-[var(--color-critical)] animate-pulse" />
            <span className="text-[10px] font-bold text-[var(--color-critical)] tracking-wide uppercase">Live</span>
          </span>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-5">
        
        {/* Navigating to hospital banner */}
        <div style={{
          background: 'var(--color-critical)', borderRadius: 10, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Truck size={20} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
              Navigating to
            </p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.3 }}>
              {patientData?.hospitalName || data.hospitalName || 'City General Hospital'}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', margin: 0 }}>
              Emergency Bay · {data.eta ? `ETA ${data.eta} min` : 'En route'}
            </p>
          </div>
        </div>

        {/* Big confirmation icon + heading */}
        <div className="text-center py-2 animate-slide-up">
          <div className={clsx(
            "inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 shadow-card",
            allDone ? "bg-[var(--color-stable)]" : "bg-[var(--color-critical)]"
          )}>
            {allDone
              ? <CheckCircle className="w-10 h-10 text-white" />
              : <Activity className="w-10 h-10 text-white animate-pulse" />
            }
          </div>
          <h1 className="text-[var(--font-xl)] font-semibold text-[var(--color-text-primary)] tracking-tight">
            {allDone ? 'All Confirmed!' : 'Hospital Notified ✓'}
          </h1>
          <p className="text-[var(--font-base)] text-[var(--color-text-secondary)] mt-1">
            {allDone
              ? 'Hospital is fully prepared for arrival'
              : 'Emergency team being mobilised...'
            }
          </p>
          <div className="font-data text-[var(--font-sm)] text-[var(--color-text-muted)] mt-2">
            {data.driverId || 'AMB-001'} · {formatElapsed(elapsed)}
          </div>
        </div>

        {/* Patient info card */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[10px] p-5 shadow-card">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <User size={16} className="text-[var(--color-text-muted)]" />
              <div>
                <p className="text-[var(--font-md)] font-semibold text-[var(--color-text-primary)] leading-tight">
                  {data.patientName || 'Unknown'}
                </p>
                {data.age && <p className="text-[var(--font-sm)] text-[var(--color-text-muted)]">{data.age} years</p>}
              </div>
            </div>
            {data.condition && <StatusBadge condition={data.condition} />}
          </div>
          
          {data.notes && (
            <div className="bg-[var(--color-bg-secondary)] rounded-md p-3 mb-4">
              <p className="text-[var(--font-sm)] text-[var(--color-text-secondary)] leading-relaxed italic">{data.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[var(--color-bg-secondary)] rounded-lg p-3 text-center">
              <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1">ETA</p>
              <p className="font-data text-[var(--font-lg)] font-normal text-[var(--color-text-primary)] leading-none">{data.eta || '-'}</p>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">min</p>
            </div>
            <div className="bg-[var(--color-bg-secondary)] rounded-lg p-3 text-center">
              <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1">BP</p>
              <p className="font-data text-[var(--font-lg)] font-normal text-[var(--color-text-primary)] leading-none">{data.vitals?.bp || '-'}</p>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">mmHg</p>
            </div>
            <div className="bg-[var(--color-bg-secondary)] rounded-lg p-3 text-center">
              <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Pulse</p>
              <p className="font-data text-[var(--font-lg)] font-normal text-[var(--color-text-primary)] leading-none">{data.vitals?.pulse || '-'}</p>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">bpm</p>
            </div>
          </div>
        </div>

        {/* Live status steps */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[10px] p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[var(--font-md)] font-semibold text-[var(--color-text-primary)]">Live Status</h3>
            <p className="text-[var(--font-sm)] text-[var(--color-text-muted)] font-data">{doneCount}/{steps.length} Confirmed</p>
          </div>

          <div className="space-y-4">
            {steps.map((step, i) => {
              const { Icon } = step;
              const isProcessing = (!step.done && i === doneCount);
              
              return (
                <div key={step.key} className={clsx("flex items-center gap-4 step-appear", step.done ? "opacity-100" : (isProcessing ? "opacity-100" : "opacity-40"))} style={{ animationDelay: `${i * 80}ms` }}>
                  <div className={clsx(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm",
                    step.done ? "bg-[var(--color-stable-light)] text-[var(--color-stable)] border border-[var(--color-stable)]" : 
                    isProcessing ? "bg-[var(--color-critical-light)] text-[var(--color-critical)] border border-[var(--color-critical)] animate-pulse" : 
                    "bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
                  )}>
                    {step.done ? <CheckCircle size={20} /> : <Icon size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={clsx("font-semibold text-[var(--font-base)]", step.done ? "text-[var(--color-stable)]" : "text-[var(--color-text-primary)]")}>
                      {step.label}
                    </p>
                    <p className="text-[var(--font-xs)] text-[var(--color-text-muted)] mt-0.5">
                      {step.desc}
                    </p>
                  </div>
                  {isProcessing && (
                    <div className="flex-shrink-0">
                      <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderColor: 'var(--color-border-strong)', borderTopColor: 'var(--color-brand)' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[10px] p-3 shadow-card flex items-center justify-between">
            <span className="text-[var(--font-sm)] text-[var(--color-text-muted)] font-medium px-1">Tracking ID</span>
            <span className="font-data text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] px-3 py-1 rounded-[4px]">{alertId}</span>
        </div>

        {/* New alert button */}
        <div className="pt-2 pb-6">
          <button
            type="button"
            onClick={onNewAlert}
            className="w-full flex items-center justify-center gap-2 min-h-[56px] rounded-[10px] bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] font-semibold text-[var(--font-base)] shadow-sm transition-colors"
          >
            ← Standardize New Alert
          </button>
        </div>
      </div>
    </div>
  );
}
