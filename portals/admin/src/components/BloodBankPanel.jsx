// BloodBankPanel.jsx — Blood bank coordination for active CRITICAL/SERIOUS alerts
// Admin portal — read/write via backend API + Firebase realtime listener

import { useState, useEffect, useRef } from 'react';
import { Droplets, Phone, MapPin, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const C = {
  brand:          '#0D6E56',
  brandLight:     '#E1F5EE',
  critical:       '#A32D2D',
  criticalLight:  '#FCEBEB',
  serious:        '#854F0B',
  seriousLight:   '#FAEEDA',
  stable:         '#0F6E56',
  stableLight:    '#E1F5EE',
  bgCard:         '#FFFFFF',
  border:         '#D3D1C7',
  textPrimary:    '#0D0D0D',
  textMuted:      '#888780',
  textSecondary:  '#5F5E5A',
};

const STEPS = ['Searching', 'Requested', 'Confirmed', 'Dispatched'];

function statusToStep(status) {
  if (!status || status === 'SEARCHING')  return 0;
  if (status === 'REQUESTED')             return 1;
  if (status === 'CONFIRMED')             return 2;
  if (status === 'DISPATCHED')            return 3;
  if (status === 'RECEIVED')              return 4; // all 4 steps done
  return 0;
}

function BloodPill({ label, count }) {
  const bg    = count > 5 ? C.stableLight   : count >= 1 ? C.seriousLight   : C.criticalLight;
  const color = count > 5 ? C.stable        : count >= 1 ? C.serious        : C.critical;
  return (
    <span style={{
      fontSize: 11, borderRadius: 999, padding: '2px 8px',
      background: bg, color, fontWeight: 500,
    }}>
      {label}: {count}
    </span>
  );
}

export default function BloodBankPanel({ alertId, condition, bloodLoss = 'None', bloodGroup = 'Unknown' }) {
  const [bbData,      setBbData]      = useState(null);
  const [banks,       setBanks]       = useState([]);
  const [requesting,  setRequesting]  = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [actioning,   setActioning]   = useState(null); // 'received' | 'not-received'
  const [locationUsed, setLocationUsed] = useState(false);
  const [locality,     setLocality]     = useState(null); // "Mira Road", "Ghatkopar" etc.
  const checkedRef    = useRef(false);
  const actionsTimer  = useRef(null);
  const userCoords    = useRef(null); // { lat, lng }

  // Firebase realtime listener
  useEffect(() => {
    if (!alertId) return;
    let unsubscribe;
    let cancelled = false;

    Promise.all([
      import('firebase/database'),
      import('../../../shared/firebase.js'),
      import('../../../shared/types.js'),
    ]).then(([{ ref, onValue }, { db }, { HOSPITAL_ID }]) => {
      if (cancelled) return;
      const bbRef = ref(db, `/hospitals/${HOSPITAL_ID}/bloodbank/${alertId}`);
      unsubscribe = onValue(bbRef, (snap) => {
        if (!cancelled) setBbData(snap.val());
      });
    }).catch(() => {});

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [alertId]);

  // POST /check on mount (once per alertId) — try geolocation first
  useEffect(() => {
    if (!alertId || !condition) return;
    if (condition === 'STABLE' && bloodLoss === 'None') return;
    if (checkedRef.current) return;
    checkedRef.current = true;

    function doCheck(lat, lng) {
      const body = { alertId, condition, bloodGroup };
      if (lat !== null) { body.lat = lat; body.lng = lng; setLocationUsed(true); }
      fetch(`${API_BASE}/api/bloodbank/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then(r => r.json())
        .then(data => { if (data.banks) setBanks(data.banks); })
        .catch(() => {});
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          userCoords.current = { lat, lng };
          doCheck(lat, lng);
          // Reverse geocode to get locality name (Nominatim — free, no key)
          fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14`,
            { headers: { 'Accept-Language': 'en' } }
          )
            .then(r => r.json())
            .then(d => {
              const a = d.address || {};
              // Pick the most specific available label
              const name =
                a.suburb || a.neighbourhood || a.quarter ||
                a.city_district || a.town || a.village ||
                a.county || a.city || 'Your Location';
              setLocality(name);
            })
            .catch(() => setLocality('Your Location'));
        },
        () => doCheck(null, null),
        { timeout: 5000, maximumAge: 60000 }
      );
    } else {
      doCheck(null, null);
    }
  }, [alertId, condition]);

  // Show action buttons 5s after CONFIRMED
  useEffect(() => {
    if (bbData?.status === 'CONFIRMED') {
      clearTimeout(actionsTimer.current);
      actionsTimer.current = setTimeout(() => setShowActions(true), 5000);
    } else {
      clearTimeout(actionsTimer.current);
      setShowActions(false);
    }
    return () => clearTimeout(actionsTimer.current);
  }, [bbData?.status]);

  async function handleReceived() {
    setActioning('received');
    try {
      const [{ ref, update }, { db }, { HOSPITAL_ID }] = await Promise.all([
        import('firebase/database'),
        import('../../../shared/firebase.js'),
        import('../../../shared/types.js'),
      ]);
      await update(ref(db, `/hospitals/${HOSPITAL_ID}/bloodbank/${alertId}`), {
        status: 'RECEIVED',
        receivedAt: Date.now(),
      });
    } catch (e) {
      console.error('[BLOODBANK] received error:', e);
    }
    setActioning(null);
  }

  async function handleNotReceived() {
    setActioning('not-received');
    try {
      const [{ ref, update }, { db }, { HOSPITAL_ID }] = await Promise.all([
        import('firebase/database'),
        import('../../../shared/firebase.js'),
        import('../../../shared/types.js'),
      ]);
      await update(ref(db, `/hospitals/${HOSPITAL_ID}/bloodbank/${alertId}`), {
        status: 'SEARCHING',
        confirmedBank: null,
        confirmedAt: null,
        requestedBankId: null,
        eta_minutes: null,
        failedAt: Date.now(),
      });
      setShowActions(false);
      setBanks([]);
    } catch (e) {
      console.error('[BLOODBANK] not-received error:', e);
    }
    setActioning(null);
  }

  async function handleRequest(bankId) {
    setRequesting(true);
    try {
      await fetch(`${API_BASE}/api/bloodbank/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, bankId }),
      });
    } catch (e) {
      console.error('[BLOODBANK] request error:', e);
    }
    setRequesting(false);
  }

  const activeStep = statusToStep(bbData?.status);
  const topBanks   = banks.slice(0, 4);

  return (
    <div>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Droplets size={16} color={C.critical} />
          <span style={{
            fontSize: 11, fontWeight: 500, color: C.textSecondary,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            Blood Bank Coordination
          </span>
          {/* Locality pill — left side, only when location accessed */}
          {locationUsed && locality && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
              background: C.brandLight, color: C.brand,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              📍 {locality}
            </span>
          )}
        </div>
        {/* Radius badge — right side */}
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
          background: locationUsed ? '#EEF4FF' : '#F1EFE8',
          color: locationUsed ? '#3B5BDB' : C.textMuted,
        }}>
          {locationUsed ? '50 km radius' : 'Static Distance'}
        </span>
      </div>

      {/* Urgency / blood loss banner */}
      {(condition === 'CRITICAL' || bloodLoss === 'Severe' || bloodLoss === 'Moderate') && (
        <div style={{
          background: bloodLoss === 'Severe' || condition === 'CRITICAL' ? C.criticalLight : C.seriousLight,
          borderLeft: `4px solid ${bloodLoss === 'Severe' || condition === 'CRITICAL' ? C.critical : C.serious}`,
          borderRadius: 8, padding: 12, marginBottom: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={14} color={bloodLoss === 'Severe' || condition === 'CRITICAL' ? C.critical : C.serious} />
            <span style={{
              fontSize: 13, fontWeight: 500,
              color: bloodLoss === 'Severe' || condition === 'CRITICAL' ? C.critical : C.serious,
            }}>
              {bloodLoss === 'Severe' ? 'SEVERE blood loss' : condition === 'CRITICAL' ? 'IMMEDIATE' : 'MODERATE blood loss'} — {bbData?.units ?? (condition === 'CRITICAL' ? 2 : 1)} units required
            </span>
          </div>
          {bloodGroup && bloodGroup !== 'Unknown' && (
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '2px 10px',
              borderRadius: 999, background: C.brandLight, color: C.brand,
              whiteSpace: 'nowrap',
            }}>
              {bloodGroup}
            </span>
          )}
        </div>
      )}

      {/* Status stepper */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        {STEPS.map((label, i) => {
          const done   = i < activeStep;
          const active = i === activeStep;
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', fontSize: 11,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 500,
                  background: done ? C.brand : active ? C.serious : '#F1EFE8',
                  color: done || active ? '#fff' : C.textMuted,
                  animation: active ? 'pulse 1.5s infinite' : 'none',
                }}>
                  {done ? '✓' : i + 1}
                </div>
                <span style={{
                  fontSize: 9, textAlign: 'center', marginTop: 2, whiteSpace: 'nowrap',
                  color: done ? C.brand : active ? C.serious : C.textMuted,
                  fontWeight: done || active ? 600 : 400,
                }}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: 2, margin: '0 4px', marginBottom: 14,
                  background: done ? C.brand : C.border,
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Bank cards */}
      {topBanks.map(bank => {
        const isRequested = bbData?.status === 'REQUESTED' && bbData?.requestedBankId === bank.id;
        const isConfirmed = bbData?.status === 'CONFIRMED' && bbData?.confirmedBank === bank.id;
        const canRequest  = !bbData || bbData.status === 'SEARCHING';

        return (
          <div key={bank.id} style={{
            background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: 16, marginBottom: 8,
          }}>
            {/* Row 1: name + distance */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: C.textPrimary }}>{bank.name}</span>
              <span style={{
                fontSize: 11, background: C.brandLight, color: C.brand,
                borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap', marginLeft: 8,
              }}>
                {bank.distance_km} km
              </span>
            </div>

            {/* Row 2: location */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <MapPin size={12} color={C.textMuted} />
              <span style={{ fontSize: 12, color: C.textMuted }}>{bank.location}</span>
            </div>

            {/* Row 3: phone */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Phone size={12} color={C.brand} />
              <span style={{ fontSize: 12, color: C.brand, fontFamily: 'JetBrains Mono, monospace' }}>
                {bank.phone}
              </span>
            </div>

            {/* Blood availability — show all groups, highlight requested group */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(g => (
                <span key={g} style={{
                  fontSize: 10, borderRadius: 999, padding: '2px 7px', fontWeight: 600,
                  border: g === bloodGroup ? '1.5px solid ' + C.critical : '1px solid transparent',
                  background: bank.available[g] > 5 ? C.stableLight
                            : bank.available[g] >= 1 ? C.seriousLight : C.criticalLight,
                  color:      bank.available[g] > 5 ? C.stable
                            : bank.available[g] >= 1 ? C.serious : C.critical,
                }}>
                  {g}: {bank.available[g]}
                </span>
              ))}
            </div>

            {/* Request button / status pill */}
            <div style={{ marginTop: 10 }}>
              {isConfirmed ? (
                <span style={{
                  background: C.stableLight, color: C.stable,
                  borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 600,
                }}>
                  Confirmed ✓
                </span>
              ) : isRequested ? (
                <span style={{
                  background: C.seriousLight, color: C.serious,
                  borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 600,
                }}>
                  Requested
                </span>
              ) : canRequest ? (
                <button
                  disabled={requesting}
                  onClick={() => handleRequest(bank.id)}
                  style={{
                    border: `1px solid ${C.brand}`, color: C.brand,
                    background: '#fff', borderRadius: 8,
                    padding: '6px 14px', fontSize: 12, fontWeight: 500,
                    cursor: requesting ? 'not-allowed' : 'pointer',
                    opacity: requesting ? 0.6 : 1,
                  }}
                >
                  Request Blood
                </button>
              ) : null}
            </div>
          </div>
        );
      })}

      {/* Confirmation box + action buttons */}
      {(bbData?.status === 'CONFIRMED' || bbData?.status === 'RECEIVED') && (
        <div style={{
          background: bbData.status === 'RECEIVED' ? C.stableLight : C.stableLight,
          border: `1px solid ${C.stable}`,
          borderRadius: 10, padding: 16, marginTop: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle size={18} color={C.stable} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: C.stable, margin: 0 }}>
                {bbData.status === 'RECEIVED'
                  ? 'Blood received ✓'
                  : `Blood confirmed — arriving in ~${bbData.eta_minutes} min`}
              </p>
              <p style={{ fontSize: 12, color: C.textMuted, margin: '2px 0 0' }}>
                {bbData.status === 'RECEIVED'
                  ? `Received from ${bbData.confirmedBank}`
                  : `Dispatched from ${bbData.confirmedBank}`}
              </p>
            </div>
          </div>

          {/* Slide-in action buttons — appear 5s after CONFIRMED */}
          {bbData.status === 'CONFIRMED' && showActions && (
            <div style={{
              marginTop: 14,
              display: 'flex', gap: 8,
              animation: 'slideUp 0.3s ease',
            }}>
              <style>{`
                @keyframes slideUp {
                  from { opacity: 0; transform: translateY(8px); }
                  to   { opacity: 1; transform: translateY(0); }
                }
              `}</style>
              <button
                disabled={actioning !== null}
                onClick={handleReceived}
                style={{
                  flex: 1, padding: '10px 0',
                  background: C.brand, color: '#fff',
                  border: 'none', borderRadius: 8,
                  fontSize: 13, fontWeight: 600,
                  cursor: actioning ? 'not-allowed' : 'pointer',
                  opacity: actioning ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <CheckCircle size={14} />
                {actioning === 'received' ? 'Confirming...' : 'Blood Received'}
              </button>
              <button
                disabled={actioning !== null}
                onClick={handleNotReceived}
                style={{
                  flex: 1, padding: '10px 0',
                  background: '#fff', color: C.critical,
                  border: `1px solid ${C.critical}`, borderRadius: 8,
                  fontSize: 13, fontWeight: 600,
                  cursor: actioning ? 'not-allowed' : 'pointer',
                  opacity: actioning ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <XCircle size={14} />
                {actioning === 'not-received' ? 'Resetting...' : 'Not Received'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
