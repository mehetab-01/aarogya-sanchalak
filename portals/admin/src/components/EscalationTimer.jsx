import { useState, useEffect } from 'react';

const COLORS = {
  brand:         '#0D6E56',
  brandLight:    '#E1F5EE',
  critical:      '#A32D2D',
  criticalLight: '#FCEBEB',
  serious:       '#854F0B',
  seriousLight:  '#FAEEDA',
  stable:        '#0F6E56',
  stableLight:   '#E1F5EE',
  border:        '#D3D1C7',
  textMuted:     '#888780',
  textPrimary:   '#0D0D0D',
};

export default function EscalationTimer({ escalationStartedAt, doctorAck }) {
  const [remaining, setRemaining] = useState(60);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - escalationStartedAt) / 1000);
      const rem = Math.max(0, 60 - elapsed);
      setRemaining(rem);
    }, 1000);
    return () => clearInterval(interval);
  }, [escalationStartedAt]);

  // STATE 1 — doctor acknowledged
  if (doctorAck) {
    return (
      <div style={{
        background: COLORS.stableLight,
        border: '1px solid ' + COLORS.stable,
        borderRadius: 10, padding: 12,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: COLORS.stable,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color: 'white', fontSize: 16, fontWeight: 500 }}>✓</span>
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 500, color: COLORS.stable, margin: 0 }}>
            Doctor Confirmed
          </p>
          <p style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2, marginBottom: 0 }}>
            Responding to emergency
          </p>
        </div>
      </div>
    );
  }

  // STATE 2 — waiting, time remaining
  if (remaining > 0) {
    return (
      <div style={{
        background: COLORS.seriousLight,
        border: '1px solid ' + COLORS.serious,
        borderRadius: 10, padding: 12, marginBottom: 8,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.serious }}>
            Waiting for Doctor
          </span>
          <span style={{
            fontSize: 13, fontWeight: 500, color: COLORS.serious,
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {remaining}s
          </span>
        </div>
        <div style={{
          marginTop: 8, width: '100%', height: 4,
          borderRadius: 999, background: COLORS.border, overflow: 'hidden',
        }}>
          <div style={{
            height: 4, borderRadius: 999,
            background: COLORS.serious,
            width: (remaining / 60 * 100) + '%',
            transition: 'width 1s linear',
          }} />
        </div>
        <p style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6, marginBottom: 0 }}>
          Auto-escalates to nurse if no response
        </p>
      </div>
    );
  }

  // STATE 3 — escalated
  return (
    <div style={{
      background: COLORS.criticalLight,
      border: '1px solid ' + COLORS.critical,
      borderRadius: 10, padding: 12,
      animation: 'pulse 1s infinite',
    }}>
      <p style={{
        fontSize: 13, fontWeight: 500, color: COLORS.critical,
        letterSpacing: '0.05em', margin: 0,
      }}>
        ESCALATED TO NURSE
      </p>
      <p style={{
        fontSize: 11, color: COLORS.critical,
        marginTop: 4, marginBottom: 0, opacity: 0.8,
      }}>
        Doctor did not respond — nurse notified
      </p>
    </div>
  );
}
