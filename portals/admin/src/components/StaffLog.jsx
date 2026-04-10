// StaffLog.jsx — Dhanshree Porwal
// Staff response audit trail — ALL alerts, newest first
// Shows per-alert: patient, condition, time called, Doctor/Nurse/Ward ack status

import { useEffect, useState } from 'react';

function toTitleCase(str) {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function fmtTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

const conditionColor = {
  CRITICAL: 'var(--color-critical)',
  SERIOUS:  'var(--color-serious)',
  STABLE:   'var(--color-stable)',
};

const statusLabel = {
  INCOMING:   'Incoming',
  ADMITTED:   'Admitted',
  DISCHARGED: 'Discharged',
};
const statusColor = {
  INCOMING:   'var(--color-critical)',
  ADMITTED:   'var(--color-serious)',
  DISCHARGED: 'var(--color-stable)',
};

function LogEntry({ alert, isLast }) {
  const callTime = fmtTime(alert.timestamp);
  const cColor   = conditionColor[alert.condition] ?? 'var(--color-text-muted)';

  const ackRow = (label, acked) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11,
      color: acked ? 'var(--color-stable)' : 'var(--color-text-muted)' }}>
      <span>{acked ? '✓' : '○'}</span>
      <span>
        {acked
          ? `${label} acknowledged`
          : `${label} — pending`}
      </span>
    </div>
  );

  return (
    <div style={{
      padding: '16px 20px',
      borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          {/* Condition dot */}
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor: cColor, display: 'inline-block', marginTop: 4, flexShrink: 0,
          }} />
          <div>
            <p style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
              {toTitleCase(alert.patientName ?? 'Unknown Patient')}
              {alert.age && (
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 400, fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 6 }}>
                  {alert.age}y
                </span>
              )}
            </p>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: cColor, marginTop: 2 }}>
              {alert.condition}
            </p>
          </div>
        </div>

        {/* Right: status + time */}
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
            color: statusColor[alert.status] ?? 'var(--color-text-muted)' }}>
            {statusLabel[alert.status] ?? alert.status}
          </p>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
            {callTime}
          </p>
          {alert.driverId && (
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--color-text-muted)' }}>
              {alert.driverId}
            </p>
          )}
        </div>
      </div>

      {/* Audit entries */}
      <div style={{ marginLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: cColor }}>
          <span>→</span>
          <span>Alert created — AI call triggered at {callTime}</span>
        </div>
        {ackRow('Doctor', alert.doctorAck)}
        {ackRow('Nurse',  alert.nurseAck)}
        {ackRow('Ward boy', alert.wardAck)}
      </div>
    </div>
  );
}

function LogSkeleton({ isLast }) {
  return (
    <div style={{ padding: '16px 20px', borderBottom: isLast ? 'none' : '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="animate-pulse" style={{ width: 8, height: 8, borderRadius:'50%', backgroundColor:'var(--color-bg-secondary)', marginTop:4 }}/>
          <div>
            <div className="animate-pulse" style={{ height:14, width:120, backgroundColor:'var(--color-bg-secondary)', borderRadius:4, marginBottom:6 }}/>
            <div className="animate-pulse" style={{ height:11, width:70, backgroundColor:'var(--color-bg-secondary)', borderRadius:4 }}/>
          </div>
        </div>
        <div className="animate-pulse" style={{ height:14, width:60, backgroundColor:'var(--color-bg-secondary)', borderRadius:4 }}/>
      </div>
      <div style={{ marginLeft:18, display:'flex', flexDirection:'column', gap:4 }}>
        {[100,90,80,80].map((w,i)=>(
          <div key={i} className="animate-pulse" style={{ height:11, width:w, backgroundColor:'var(--color-bg-secondary)', borderRadius:4 }}/>
        ))}
      </div>
    </div>
  );
}

export default function StaffLog() {
  const [alerts, setAlerts] = useState(null); // null = loading
  const [error,  setError]  = useState(null);

  useEffect(() => {
    let unsubscribe;

    (async () => {
      try {
        const [{ ref, onValue }, { db }, { HOSPITAL_ID, DB_PATHS }] = await Promise.all([
          import('firebase/database'),
          import('../../../shared/firebase.js'),
          import('../../../shared/types.js'),
        ]);

        const alertsRef = ref(db, DB_PATHS.ALERTS(HOSPITAL_ID));
        unsubscribe = onValue(
          alertsRef,
          (snapshot) => {
            const data = snapshot.val();
            if (!data) { setAlerts([]); return; }
            const list = Object.entries(data)
              .map(([id, val]) => ({ id, ...val }))
              .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
            setAlerts(list);
            setError(null);
          },
          (err) => {
            console.error('[StaffLog]', err);
            setError('Firebase connection error.');
          }
        );
      } catch (err) {
        console.error('[StaffLog] init error:', err);
        setError('Firebase not configured. Waiting for credentials…');
      }
    })();

    return () => unsubscribe?.();
  }, []);

  return (
    <div style={{
      backgroundColor: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 10,
      boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 'var(--font-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Staff Response Log
          </span>
          {alerts !== null && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
              backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)',
            }}>
              {alerts.length}
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>
          Full audit trail
        </span>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '12px 20px', fontSize: 'var(--font-sm)',
          backgroundColor: 'var(--color-serious-light)', color: 'var(--color-serious)',
        }}>
          {error}
        </div>
      )}

      {/* Skeletons */}
      {!error && alerts === null && (
        <>
          <LogSkeleton />
          <LogSkeleton isLast />
        </>
      )}

      {/* Empty */}
      {!error && alerts !== null && alerts.length === 0 && (
        <div style={{
          padding: '40px 20px', textAlign: 'center',
          fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)',
        }}>
          No staff activity recorded yet.
        </div>
      )}

      {/* Entries */}
      {!error && alerts !== null && alerts.map((alert, idx) => (
        <LogEntry
          key={alert.id}
          alert={alert}
          isLast={idx === alerts.length - 1}
        />
      ))}
    </div>
  );
}
