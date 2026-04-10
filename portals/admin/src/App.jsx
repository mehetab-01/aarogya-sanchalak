// ADMIN PORTAL — Dhanshree Porwal
// Command center: live bed counts, active alerts table, staff response audit trail

import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';

import BedStatusCards from './components/BedStatusCards.jsx';
import ActiveAlerts from './components/ActiveAlerts.jsx';
import StaffLog from './components/StaffLog.jsx';
import Login from './components/Login.jsx';
import { useAuth } from './hooks/useAuth.js';

// ── Inline PortalLayout (avoids shared/ import crash when Firebase isn't set up) ──
function PortalLayout({ title, role, onLogout, children }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-primary)' }}>
      <header style={{
        backgroundColor: 'var(--color-bg-card)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 24px',
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              backgroundColor: 'var(--color-brand)', display: 'inline-block',
            }} />
            <span style={{ fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Aarogya Sanchalak
            </span>
            <span style={{ color: 'var(--color-border-strong)' }}>—</span>
            <span style={{ fontSize: 'var(--font-base)', color: 'var(--color-text-secondary)' }}>{title}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
              padding: '4px 10px', borderRadius: 999,
              backgroundColor: 'var(--color-brand-light)', color: 'var(--color-brand-dark)',
            }}>
              {role}
            </span>
            {onLogout && (
              <button 
                onClick={onLogout}
                style={{
                  fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 6,
                  color: 'var(--color-text-secondary)', backgroundColor: 'transparent',
                  border: '1px solid var(--color-border)', cursor: 'pointer'
                }}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </header>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        {children}
      </main>
    </div>
  );
}

// ── Firebase config warning banner ──
function FirebaseWarningBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if firebase.js still has placeholder values by catching initialization errors
    const handler = (event) => {
      if (event.message && event.message.includes('FIREBASE FATAL ERROR')) {
        setShow(true);
      }
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  if (!show) return null;

  return (
    <div style={{
      backgroundColor: 'var(--color-serious-light)',
      border: '1px solid var(--color-serious)',
      borderRadius: 10,
      padding: '12px 16px',
      marginBottom: 16,
      fontSize: 'var(--font-sm)',
      color: 'var(--color-serious)',
    }}>
      <strong>Firebase not configured</strong> — Ask Mehetab to fill in{' '}
      <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
        portals/shared/firebase.js
      </code>{' '}
      with real credentials. Data will load automatically once configured.
    </div>
  );
}

// ── Emergency Banner (inline — avoids shared/ crash) ──
function EmergencyBanner({ active, patientName, eta }) {
  if (!active) return null;
  return (
    <div style={{
      backgroundColor: 'var(--color-critical)',
      color: '#fff',
      padding: '10px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      margin: '-24px -24px 24px -24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Incoming Patient
        </span>
        <span style={{ fontSize: 'var(--font-sm)', opacity: 0.9 }}>{patientName}</span>
      </div>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'var(--font-sm)' }}>
        ETA {eta} min
      </span>
    </div>
  );
}

// ── Section Label ──
function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 12,
    }}>
      {children}
    </p>
  );
}

export default function AdminApp() {
  const { user, loading, logout } = useAuth();
  const [criticalAlert, setCriticalAlert] = useState(null);

  // Listen for critical incoming alerts for the banner
  // Wrapped in try/catch in case Firebase isn't configured yet
  useEffect(() => {
    let unsubscribe;
    try {
      Promise.all([
        import('firebase/database'),
        import('../../shared/firebase.js'),
        import('../../shared/types.js'),
      ]).then(([{ ref, onValue }, { db }, { HOSPITAL_ID, DB_PATHS }]) => {
        const alertsRef = ref(db, DB_PATHS.ALERTS(HOSPITAL_ID));
        unsubscribe = onValue(alertsRef, (snapshot) => {
          const data = snapshot.val();
          if (!data) { setCriticalAlert(null); return; }
          const priority = { CRITICAL: 0, SERIOUS: 1, STABLE: 2 };
          const incoming = Object.entries(data)
            .map(([id, v]) => ({ id, ...v }))
            .filter((a) => a.status === 'INCOMING')
            .sort((a, b) =>
              (priority[a.condition] ?? 3) - (priority[b.condition] ?? 3) ||
              (b.timestamp ?? 0) - (a.timestamp ?? 0)
            );
          setCriticalAlert(incoming[0] ?? null);
        });
      }).catch(() => {
        // Firebase not configured — silently handled by each component
      });
    } catch {
      // Ignore
    }
    return () => unsubscribe?.();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-primary)' }}>
        <div style={{ padding: 24, fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)' }}>Loading authentication...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster position="top-right" />
        <Login />
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <PortalLayout title="Admin Dashboard" role="Admin" onLogout={logout}>
        <FirebaseWarningBanner />

        <EmergencyBanner
          active={!!criticalAlert}
          patientName={criticalAlert?.patientName ?? ''}
          eta={criticalAlert?.eta ?? ''}
        />

        {/* ── Bed Availability ── */}
        <section style={{ marginBottom: 24 }}>
          <SectionLabel>Bed Availability</SectionLabel>
          <BedStatusCards />
        </section>

        {/* ── Active Alerts ── */}
        <section style={{ marginBottom: 24 }}>
          <SectionLabel>Patient Alerts</SectionLabel>
          <ActiveAlerts />
        </section>

        {/* ── Staff Log ── */}
        <section>
          <SectionLabel>Staff Activity</SectionLabel>
          <StaffLog />
        </section>
      </PortalLayout>
    </>
  );
}
