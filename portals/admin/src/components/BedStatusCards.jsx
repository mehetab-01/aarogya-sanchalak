// BedStatusCards.jsx — Dhanshree Porwal
// Pulls live bed data from Firebase: /hospitals/{HOSPITAL_ID}/beds
// Uses onValue() for real-time updates — no polling

import { useEffect, useState } from 'react';
import clsx from 'clsx';

// Occupancy thresholds → color per UI_SYSTEM.md
function getOccupancyColor(pct) {
  if (pct > 80) return 'var(--color-critical)';
  if (pct > 60) return 'var(--color-serious)';
  return 'var(--color-stable)';
}

function getOccupancyBg(pct) {
  if (pct > 80) return 'var(--color-critical-light)';
  if (pct > 60) return 'var(--color-serious-light)';
  return 'var(--color-stable-light)';
}

const BED_LABELS = { icu: 'ICU', general: 'General', emergency: 'Emergency' };
const BED_ORDER  = ['icu', 'general', 'emergency'];

function BedIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ color: 'var(--color-text-muted)' }}>
      <path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>
    </svg>
  );
}

function BedCard({ type, data }) {
  const label     = BED_LABELS[type] ?? type.toUpperCase();
  const total     = data?.total    ?? 0;
  const occupied  = data?.occupied ?? 0;
  const available = total - occupied;
  const pct       = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const color     = getOccupancyColor(pct);
  const bgLight   = getOccupancyBg(pct);

  return (
    <div style={{
      backgroundColor: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 10,
      padding: 20,
      boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BedIcon />
          <span style={{
            fontSize: 'var(--font-sm)', fontWeight: 600,
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {label}
          </span>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
          color, backgroundColor: bgLight,
        }}>
          {pct}%
        </span>
      </div>

      {/* Count — JetBrains Mono per data display rules */}
      <div>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', lineHeight: 1, marginBottom: 4 }}>
          <span style={{ fontSize: 'var(--font-2xl)', color: 'var(--color-text-primary)' }}>
            {occupied}
          </span>
          <span style={{ fontSize: 'var(--font-lg)', color: 'var(--color-text-muted)' }}>
            /{total}
          </span>
        </p>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
          {available} available
        </p>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 6, borderRadius: 999, overflow: 'hidden',
        backgroundColor: 'var(--color-bg-secondary)',
      }}>
        <div style={{
          height: '100%', borderRadius: 999,
          width: `${pct}%`, backgroundColor: color,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  );
}

function BedCardSkeleton() {
  return (
    <div style={{
      backgroundColor: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 10, padding: 20,
      boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08)',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="animate-pulse" style={{ height: 14, width: 80, backgroundColor: 'var(--color-bg-secondary)', borderRadius: 4 }} />
        <div className="animate-pulse" style={{ height: 18, width: 36, backgroundColor: 'var(--color-bg-secondary)', borderRadius: 999 }} />
      </div>
      <div>
        <div className="animate-pulse" style={{ height: 32, width: 96, backgroundColor: 'var(--color-bg-secondary)', borderRadius: 4, marginBottom: 8 }} />
        <div className="animate-pulse" style={{ height: 12, width: 80, backgroundColor: 'var(--color-bg-secondary)', borderRadius: 4 }} />
      </div>
      <div className="animate-pulse" style={{ height: 6, borderRadius: 999, backgroundColor: 'var(--color-bg-secondary)' }} />
    </div>
  );
}

// Empty bed card shown when Firebase has responded but path has no data
function BedCardEmpty({ type }) {
  const label = BED_LABELS[type] ?? type.toUpperCase();
  return (
    <div style={{
      backgroundColor: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 10,
      padding: 20,
      boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08)',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BedIcon />
          <span style={{
            fontSize: 'var(--font-sm)', fontWeight: 600,
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {label}
          </span>
        </div>
      </div>
      <div>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', lineHeight: 1, marginBottom: 4 }}>
          <span style={{ fontSize: 'var(--font-2xl)', color: 'var(--color-text-primary)' }}>--</span>
          <span style={{ fontSize: 'var(--font-lg)', color: 'var(--color-text-muted)' }}> / --</span>
        </p>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>No data</p>
      </div>
      <div style={{ height: 6, borderRadius: 999, backgroundColor: 'var(--color-bg-secondary)' }}>
        <div style={{ height: '100%', borderRadius: 999, width: '0%', backgroundColor: 'var(--color-stable)' }} />
      </div>
    </div>
  );
}

export default function BedStatusCards() {
  const [beds,    setBeds]    = useState(null);  // null = not yet received
  const [loading, setLoading] = useState(true);
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

        const bedsRef = ref(db, DB_PATHS.BEDS(HOSPITAL_ID));
        unsubscribe = onValue(
          bedsRef,
          (snapshot) => {
            setBeds(snapshot.val());
            setLoading(false);
            setError(null);
          },
          (err) => {
            console.error('[BedStatusCards]', err);
            setError('Firebase connection error.');
            setLoading(false);
          }
        );
      } catch (err) {
        console.error('[BedStatusCards] init error:', err);
        setError('Firebase not configured. Waiting for credentials…');
        setLoading(false);
      }
    })();

    return () => unsubscribe?.();
  }, []);

  if (error) {
    return (
      <div style={{
        padding: '12px 16px', borderRadius: 10, fontSize: 'var(--font-sm)',
        backgroundColor: 'var(--color-serious-light)', color: 'var(--color-serious)',
        border: '1px solid var(--color-serious)',
      }}>
        {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[1, 2, 3].map((i) => <BedCardSkeleton key={i} />)}
      </div>
    );
  }

  if (!beds) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {BED_ORDER.map((type) => <BedCardEmpty key={type} type={type} />)}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      {BED_ORDER.map((type) =>
        beds[type] ? <BedCard key={type} type={type} data={beds[type]} /> : <BedCardEmpty key={type} type={type} />
      )}
    </div>
  );
}
