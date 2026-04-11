// StaffLog.jsx — Dhanshree Porwal
// Real-time audit trail of staff acknowledgements derived from alert nodes.
// Reads: /hospitals/{HOSPITAL_ID}/alerts — extracts doctorAckAt, nurseAckAt, wardAckAt
// No separate log node needed — everything is already in the alert data.

import { useEffect, useState } from 'react';

const ROLE_CONFIG = {
  doctor: {
    label: 'Doctor',
    icon: '🩺',
    color: '#3B5BDB',
    bg: '#EEF4FF',
    ackField: 'doctorAck',
    atField: 'doctorAckAt',
    action: 'Acknowledged alert',
  },
  nurse: {
    label: 'Nurse',
    icon: '💊',
    color: '#0D6E56',
    bg: '#E1F5EE',
    ackField: 'nurseAck',
    atField: 'nurseAckAt',
    action: 'Completed preparation checklist',
  },
  ward: {
    label: 'Ward Boy',
    icon: '🛏️',
    color: '#854F0B',
    bg: '#FAEEDA',
    ackField: 'wardAck',
    atField: 'wardAckAt',
    action: 'Confirmed bed ready',
  },
  escalation: {
    label: 'System',
    icon: '⚠️',
    color: '#A32D2D',
    bg: '#FCEBEB',
    action: 'Escalated to nurse — doctor timeout',
  },
};

function fmtTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function fmtDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function timeDiff(from, to) {
  if (!from || !to) return null;
  const diff = Math.round((to - from) / 1000);
  if (diff < 60) return `${diff}s after alert`;
  return `${Math.round(diff / 60)}m after alert`;
}

function LogEntry({ entry }) {
  const cfg = ROLE_CONFIG[entry.role];
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '12px 0',
      borderBottom: '1px solid var(--color-border)',
    }}>
      {/* Avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: cfg.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16,
      }}>
        {cfg.icon}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>
            {cfg.label}
          </span>
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {cfg.action}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
          {/* Patient name */}
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 999,
            background: entry.condition === 'CRITICAL' ? '#FCEBEB'
                      : entry.condition === 'SERIOUS'  ? '#FAEEDA' : '#E1F5EE',
            color:      entry.condition === 'CRITICAL' ? '#A32D2D'
                      : entry.condition === 'SERIOUS'  ? '#854F0B' : '#0D6E56',
          }}>
            {entry.patientName ?? 'Unknown'}
          </span>

          {/* Response time */}
          {entry.diffLabel && (
            <span style={{
              fontSize: 11, color: 'var(--color-text-muted)',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              {entry.diffLabel}
            </span>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{
          fontSize: 12, fontFamily: 'JetBrains Mono, monospace',
          color: 'var(--color-text-muted)', margin: 0,
        }}>
          {fmtTime(entry.ts)}
        </p>
        <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
          {fmtDate(entry.ts)}
        </p>
      </div>
    </div>
  );
}

function SkeletonEntry() {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
      <div className="animate-pulse" style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-bg-secondary)', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
        <div className="animate-pulse" style={{ height: 13, width: '60%', background: 'var(--color-bg-secondary)', borderRadius: 4 }} />
        <div className="animate-pulse" style={{ height: 11, width: '40%', background: 'var(--color-bg-secondary)', borderRadius: 4 }} />
      </div>
      <div className="animate-pulse" style={{ width: 48, height: 13, background: 'var(--color-bg-secondary)', borderRadius: 4, flexShrink: 0, marginTop: 4 }} />
    </div>
  );
}

function buildEntries(alerts) {
  const entries = [];

  for (const alert of alerts) {
    const base = {
      alertId:     alert.id,
      patientName: alert.patientName,
      condition:   alert.condition,
      alertTs:     alert.timestamp,
    };

    if (alert.doctorAck && alert.doctorAckAt) {
      entries.push({
        ...base, role: 'doctor', ts: alert.doctorAckAt,
        diffLabel: timeDiff(alert.escalationStartedAt ?? alert.timestamp, alert.doctorAckAt),
      });
    }

    if (alert.escalatedToNurse && alert.escalationFiredAt) {
      entries.push({
        ...base, role: 'escalation', ts: alert.escalationFiredAt,
        diffLabel: null,
      });
    }

    if (alert.nurseAck && alert.nurseAckAt) {
      entries.push({
        ...base, role: 'nurse', ts: alert.nurseAckAt,
        diffLabel: timeDiff(alert.timestamp, alert.nurseAckAt),
      });
    }

    if (alert.wardAck && alert.wardAckAt) {
      entries.push({
        ...base, role: 'ward', ts: alert.wardAckAt,
        diffLabel: timeDiff(alert.timestamp, alert.wardAckAt),
      });
    }
  }

  // Newest first
  return entries.sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));
}

export default function StaffLog() {
  const [entries, setEntries] = useState(null); // null = loading
  const [error,   setError]   = useState(null);

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
            if (!data) { setEntries([]); return; }
            const alerts = Object.entries(data).map(([id, v]) => ({ id, ...v }));
            setEntries(buildEntries(alerts));
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

  const total = entries?.length ?? 0;

  return (
    <div style={{
      background: 'var(--color-bg-card)',
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
            Staff Activity
          </span>
          {entries !== null && total > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
              background: 'var(--color-brand-light)', color: 'var(--color-brand)',
            }}>
              {total} action{total !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>
          Live · Firebase
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px' }}>

        {/* Error */}
        {error && (
          <p style={{
            padding: '16px 0', fontSize: 'var(--font-sm)',
            color: 'var(--color-serious)',
          }}>
            {error}
          </p>
        )}

        {/* Loading */}
        {entries === null && !error && (
          <>
            <SkeletonEntry />
            <SkeletonEntry />
            <SkeletonEntry />
          </>
        )}

        {/* Empty */}
        {entries !== null && entries.length === 0 && (
          <p style={{
            padding: '32px 0', textAlign: 'center',
            fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)',
          }}>
            No activity yet — log entries appear when staff acknowledge alerts
          </p>
        )}

        {/* Entries */}
        {entries !== null && entries.map((entry) => (
          <LogEntry key={`${entry.alertId}-${entry.role}-${entry.ts}`} entry={entry} />
        ))}

        {/* Bottom padding when entries exist */}
        {entries !== null && entries.length > 0 && (
          <div style={{ height: 8 }} />
        )}
      </div>
    </div>
  );
}
