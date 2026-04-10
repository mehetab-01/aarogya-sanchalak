// ActiveAlerts.jsx — Dhanshree Porwal
// Pulls all alerts from Firebase: /hospitals/{HOSPITAL_ID}/alerts
// Columns: Patient Name, Condition, ETA, Ambulance ID, Ack Status, Alert Status, Time

import React, { useEffect, useState } from 'react';

function toTitleCase(str) {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Condition badge styles
const conditionStyle = {
  CRITICAL: { bg: 'var(--color-critical-light)', color: 'var(--color-critical)', border: 'var(--color-critical)' },
  SERIOUS:  { bg: 'var(--color-serious-light)',  color: 'var(--color-serious)',  border: 'var(--color-serious)' },
  STABLE:   { bg: 'var(--color-stable-light)',   color: 'var(--color-stable)',   border: 'var(--color-stable)' },
};

const statusStyle = {
  INCOMING:   { bg: 'var(--color-serious-light)', color: 'var(--color-serious)' },
  ADMITTED:   { bg: 'var(--color-stable-light)',  color: 'var(--color-stable)' },
  DISCHARGED: { bg: 'var(--color-bg-secondary)',  color: 'var(--color-text-muted)' },
};

function ConditionBadge({ condition }) {
  const s = conditionStyle[condition] ?? { bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 999,
      border: `1px solid ${s.border}`,
      backgroundColor: s.bg, color: s.color,
      fontSize: 11, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>
      {condition}
    </span>
  );
}

function StatusPill({ status }) {
  const s = statusStyle[status] ?? { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px', borderRadius: 999,
      backgroundColor: s.bg, color: s.color,
      fontSize: 11, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>
      {status}
    </span>
  );
}

function AckCell({ doctorAck, nurseAck, wardAck }) {
  const ack = (label, val) => (
    <span style={{
      display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
      color: val ? 'var(--color-stable)' : 'var(--color-text-muted)',
    }}>
      <span>{val ? '✓' : '○'}</span>
      <span>{label}</span>
    </span>
  );
  return (
    <td style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {ack('Doctor', doctorAck)}
        {ack('Nurse',  nurseAck)}
        {ack('Ward',   wardAck)}
      </div>
    </td>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {[180, 120, 60, 90, 110, 80, 60].map((w, i) => (
        <td key={i} style={{ padding: '12px 16px' }}>
          <div className="animate-pulse" style={{
            height: 14, width: w,
            backgroundColor: 'var(--color-bg-secondary)', borderRadius: 4,
          }} />
        </td>
      ))}
    </tr>
  );
}

const TH = ({ children }) => (
  <th style={{
    padding: '10px 16px', textAlign: 'left',
    fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
    color: 'var(--color-text-muted)',
    borderBottom: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg-secondary)',
    whiteSpace: 'nowrap',
  }}>
    {children}
  </th>
);

export default function ActiveAlerts() {
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
            const all = Object.entries(data)
              .map(([id, val]) => ({ id, ...val }));
            // INCOMING first (newest-first within group), then others by time
            const incoming = all
              .filter(a => a.status === 'INCOMING')
              .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
            const rest = all
              .filter(a => a.status !== 'INCOMING')
              .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
            setAlerts([...incoming, ...rest]);
            setError(null);
          },
          (err) => {
            console.error('[ActiveAlerts]', err);
            setError('Firebase connection error.');
          }
        );
      } catch (err) {
        console.error('[ActiveAlerts] init error:', err);
        setError('Firebase not configured. Waiting for credentials…');
      }
    })();

    return () => unsubscribe?.();
  }, []);

  const fmtTime = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      backgroundColor: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 10,
      boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08)',
      overflow: 'hidden',
    }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 'var(--font-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Active Alerts
          </span>
          {alerts !== null && (() => {
            const incomingCount = alerts.filter(a => a.status === 'INCOMING').length;
            return (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                backgroundColor: incomingCount > 0 ? 'var(--color-critical-light)' : 'var(--color-bg-secondary)',
                color: incomingCount > 0 ? 'var(--color-critical)' : 'var(--color-text-muted)',
              }}>
                {incomingCount > 0 ? `${incomingCount} incoming` : alerts.length}
              </span>
            );
          })()}
        </div>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>
          Live · Firebase
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

      {/* Table */}
      {!error && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <TH>Patient</TH>
                <TH>Condition</TH>
                <TH>ETA</TH>
                <TH>Ambulance ID</TH>
                <TH>Acknowledgements</TH>
                <TH>Status</TH>
                <TH>Time</TH>
              </tr>
            </thead>
            <tbody>
              {/* Loading */}
              {alerts === null && [1,2,3].map(i => <SkeletonRow key={i} />)}

              {/* Empty */}
              {alerts !== null && alerts.length === 0 && (
                <tr>
                  <td colSpan={7} style={{
                    padding: '40px 16px', textAlign: 'center',
                    fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)',
                  }}>
                    No alerts at this time. System standing by.
                  </td>
                </tr>
              )}

              {/* Rows */}
              {alerts !== null && alerts.map((alert, idx) => {
                // Insert a section divider between INCOMING and non-INCOMING rows
                const prevWasIncoming = idx > 0 && alerts[idx - 1].status === 'INCOMING';
                const thisIsNotIncoming = alert.status !== 'INCOMING';
                const showDivider = prevWasIncoming && thisIsNotIncoming;
                return (
                <React.Fragment key={alert.id}>
                {showDivider && (
                  <tr>
                    <td colSpan={7} style={{
                      padding: '6px 16px',
                      backgroundColor: 'var(--color-bg-secondary)',
                      fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                      letterSpacing: '0.06em', color: 'var(--color-text-muted)',
                    }}>
                      Past Alerts
                    </td>
                  </tr>
                )}
                <tr style={{
                  borderBottom: idx < alerts.length - 1 ? '1px solid var(--color-border)' : 'none',
                  backgroundColor:
                    alert.condition === 'CRITICAL' && alert.status === 'INCOMING'
                      ? 'rgba(155,28,28,0.02)' : undefined,
                }}>
                  {/* Patient */}
                  <td style={{ padding: '12px 16px' }}>
                    <p style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--color-text-primary)' }}>
                      {toTitleCase(alert.patientName ?? '—')}
                    </p>
                    {alert.age && (
                      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {alert.age}y
                      </p>
                    )}
                  </td>

                  {/* Condition */}
                  <td style={{ padding: '12px 16px' }}>
                    <ConditionBadge condition={alert.condition} />
                    {(alert.vitals?.bp || alert.vitals?.pulse) && (
                      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, whiteSpace: 'nowrap' }}>
                        {alert.vitals?.bp ? `BP ${alert.vitals.bp}` : ''}
                        {alert.vitals?.bp && alert.vitals?.pulse ? ' · ' : ''}
                        {alert.vitals?.pulse ? `${alert.vitals.pulse} bpm` : ''}
                      </p>
                    )}
                  </td>

                  {/* ETA */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'var(--font-sm)', color: 'var(--color-text-primary)' }}>
                      {alert.eta != null ? alert.eta : '—'}
                    </span>
                    {alert.eta != null && (
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}> min</span>
                    )}
                  </td>

                  {/* Ambulance ID */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                      {alert.driverId ?? '—'}
                    </span>
                  </td>

                  {/* Acks */}
                  <AckCell
                    doctorAck={alert.doctorAck}
                    nurseAck={alert.nurseAck}
                    wardAck={alert.wardAck}
                  />

                  {/* Status */}
                  <td style={{ padding: '12px 16px' }}>
                    <StatusPill status={alert.status} />
                  </td>

                  {/* Time */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)' }}>
                      {fmtTime(alert.timestamp)}
                    </span>
                  </td>
                </tr>
                </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
