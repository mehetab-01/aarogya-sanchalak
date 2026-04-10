import React, { useState, useEffect } from 'react';
import { db } from "../../shared/firebase";
import { ref, onValue, update } from "firebase/database";
import { HOSPITAL_ID } from "../../shared/types";
import { API_BASE_URL } from "../../shared/config";
import { CheckCircle, AlertTriangle, Wifi, Server, User, Activity } from "lucide-react";

const C = {
  brand:         "#0D6E56",
  brandDark:     "#0a5a45",
  brandLight:    "#E1F5EE",
  critical:      "#A32D2D",
  criticalLight: "#FCEBEB",
  serious:       "#854F0B",
  seriousLight:  "#FAEEDA",
  stable:        "#0F6E56",
  stableLight:   "#E1F5EE",
  bgPrimary:     "#F8F9FA",
  bgSecondary:   "#F1EFE8",
  bgCard:        "#FFFFFF",
  textPrimary:   "#0D0D0D",
  textSecondary: "#5F5E5A",
  textMuted:     "#888780",
  border:        "#D3D1C7",
  borderStrong:  "#B5B3AA",
};

const conditionColors = {
  CRITICAL: { bg: C.criticalLight, text: C.critical },
  SERIOUS:  { bg: C.seriousLight,  text: C.serious },
  STABLE:   { bg: C.stableLight,   text: C.stable },
};

const TASKS = [
  "Prepare stretcher at emergency bay",
  "Set up IV drip station",
  "Alert OT team",
  "Prepare blood type kit",
  "Notify on-duty anaesthetist",
];

// ── Idle Dashboard ────────────────────────────────────────────────────────────
function IdleDashboard({ lastAlert, backendOk }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "32px 24px" }}>

      {/* On Duty badge + clock */}
      <div style={{
        background: C.bgCard, border: `1px solid ${C.border}`,
        borderRadius: 14, padding: "28px 24px", marginBottom: 16,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
      }}>
        <span style={{
          background: C.brandLight, color: C.brand,
          fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
          textTransform: "uppercase", padding: "5px 16px", borderRadius: 999,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.brand, display: "inline-block" }} />
          On Duty
        </span>
        <p style={{
          fontSize: 36, fontWeight: 600, color: C.textPrimary,
          fontFamily: "'JetBrains Mono', monospace", margin: 0, letterSpacing: "0.02em",
        }}>
          {timeStr}
        </p>
        <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>{dateStr}</p>
      </div>

      {/* Last alert summary */}
      <div style={{
        background: C.bgCard, border: `1px solid ${C.border}`,
        borderRadius: 14, padding: "20px 24px", marginBottom: 16,
      }}>
        <p style={{
          fontSize: 11, fontWeight: 600, color: C.textMuted,
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12,
        }}>
          Last Patient
        </p>
        {lastAlert ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 500, color: C.textPrimary, marginBottom: 4 }}>
                {lastAlert.patientName ?? "Unknown"}
              </p>
              <p style={{ fontSize: 12, color: C.textMuted }}>
                {lastAlert.condition} · {lastAlert.status}
                {lastAlert.timestamp
                  ? " · " + new Date(lastAlert.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                  : ""}
              </p>
            </div>
            <span style={{
              background: lastAlert.nurseAck ? C.brandLight : C.bgSecondary,
              color: lastAlert.nurseAck ? C.brand : C.textMuted,
              fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999,
              textTransform: "uppercase"
            }}>
              {lastAlert.nurseAck ? "Ready" : "Pending"}
            </span>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: C.textMuted }}>No recent activity</p>
        )}
      </div>

      {/* System status */}
      <div style={{
        background: C.bgCard, border: `1px solid ${C.border}`,
        borderRadius: 14, padding: "20px 24px",
      }}>
        <p style={{
          fontSize: 11, fontWeight: 600, color: C.textMuted,
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14,
        }}>
          System Status
        </p>

        {[
          { icon: <Wifi size={14} color={C.stable} />, label: "Firebase", value: "Connected", ok: true },
          { icon: <Server size={14} color={backendOk ? C.stable : C.critical} />, label: "Backend", value: backendOk ? "Connected" : "Unreachable", ok: backendOk },
          { icon: <User size={14} color={C.brand} />, label: "Role", value: "Nurse on Duty", ok: true },
        ].map(({ icon, label, value, ok }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            paddingBottom: 10, marginBottom: 10,
            borderBottom: `1px solid ${C.border}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {icon}
              <span style={{ fontSize: 13, color: C.textSecondary }}>{label}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: ok ? C.stable : C.critical, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: ok ? C.stable : C.critical, fontWeight: 500 }}>{value}</span>
            </div>
          </div>
        ))}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={14} color={C.brand} />
            <span style={{ fontSize: 13, color: C.textSecondary }}>Listening for alerts</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.brand, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: C.brand, fontWeight: 500 }}>Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckIcon({ checked }) {
  if (!checked) return null;
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function App() {
  const [alert, setAlert]           = useState(null);
  const [alertId, setAlertId]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [checked, setChecked]       = useState({});
  const [confirmed, setConfirmed]   = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [lastAlert, setLastAlert]   = useState(null);
  const [backendOk, setBackendOk]   = useState(true);

  useEffect(() => {
    const alertsRef = ref(db, `hospitals/${HOSPITAL_ID}/alerts`);
    const unsubscribe = onValue(alertsRef, (snap) => {
      const data = snap.val();
      if (data) {
        const entries = Object.entries(data).map(([id, a]) => ({ id, ...a }));
        const incoming = entries
          .filter(a => a.status === "INCOMING")
          .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))[0];
        if (incoming) {
          setAlertId(incoming.id);
          setAlert(incoming);
          setConfirmed(incoming.nurseAck === true);
        } else {
          setAlert(null);
          setAlertId(null);
          setConfirmed(false);
          setChecked({});
        }
        const past = entries
          .filter(a => a.status !== "INCOMING")
          .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
        if (past.length > 0) setLastAlert(past[0]);
      } else {
        setAlert(null);
        setAlertId(null);
        setConfirmed(false);
        setChecked({});
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Backend health ping
  useEffect(() => {
    const check = () =>
      fetch(`${API_BASE_URL}/api/beds/status`, { signal: AbortSignal.timeout(3000) })
        .then(() => setBackendOk(true))
        .catch(() => setBackendOk(false));
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  // Reset checklist whenever the active alert changes
  useEffect(() => {
    setChecked({});
  }, [alertId]);

  function toggleTask(idx) {
    setChecked(prev => ({ ...prev, [idx]: !prev[idx] }));
  }

  // allDone: every task index has been explicitly set to true
  const allDone = TASKS.every((_, idx) => checked[idx] === true);
  const checkedCount = TASKS.filter((_, idx) => checked[idx] === true).length;

  async function handleConfirm() {
    if (!alertId || !allDone || confirming) return;
    setConfirming(true);
    try {
      await update(ref(db, `hospitals/${HOSPITAL_ID}/alerts/${alertId}`), {
        nurseAck: true,
        nurseAckAt: Date.now(),
      });
      try {
        await fetch(`${API_BASE_URL}/api/alert/nurse-ack`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alertId }),
        });
      } catch (fetchErr) {
        console.error("Backend notify failed (non-fatal):", fetchErr);
      }
      setConfirmed(true);
    } catch (err) {
      console.error("Error confirming ready:", err);
    } finally {
      setConfirming(false);
    }
  }

  // --- Loading ---
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bgPrimary }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          border: `4px solid ${C.brand}`,
          borderTopColor: "transparent",
          animation: "spin 0.8s linear infinite"
        }} />
      </div>
    );
  }

  // --- No alert ---
  if (!alert) {
    return (
      <div style={{ minHeight: "100vh", background: C.bgPrimary }}>
        {/* Top bar */}
        <div style={{
          background: C.bgCard, borderBottom: `1px solid ${C.border}`,
          padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div>
            <p style={{ fontSize: 11, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>
              Aarogya Sanchalak
            </p>
            <h1 style={{ fontSize: 17, fontWeight: 600, color: C.textPrimary, margin: 0 }}>
              Nurse Portal
            </h1>
          </div>
          <span style={{ background: C.brandLight, color: C.brand, padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
            Nurse
          </span>
        </div>
        <IdleDashboard lastAlert={lastAlert} backendOk={backendOk} />
      </div>
    );
  }

  const { patientName, condition, eta, escalatedToNurse } = alert;
  const condColor = conditionColors[condition] || conditionColors.STABLE;

  return (
    <div style={{ minHeight: "100vh", background: C.bgPrimary }}>
      {/* Top bar */}
      <div style={{
        background: C.bgCard,
        borderBottom: `1px solid ${C.border}`,
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div>
          <p style={{ fontSize: 11, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>
            Aarogya Sanchalak
          </p>
          <h1 style={{ fontSize: 17, fontWeight: 600, color: C.textPrimary, margin: 0 }}>
            Nurse Portal
          </h1>
        </div>
        <span style={{
          background: C.brandLight, color: C.brand,
          padding: "4px 12px", borderRadius: 999,
          fontSize: 11, fontWeight: 600
        }}>
          Nurse
        </span>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "32px 24px" }}>

        {/* Escalation banner */}
        {escalatedToNurse && !alert.doctorAck && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: C.criticalLight, borderLeft: `4px solid ${C.critical}`,
            borderRadius: 10, padding: "12px 16px", marginBottom: 16
          }}>
            <AlertTriangle size={18} color={C.critical} />
            <span style={{ color: C.critical, fontWeight: 600, fontSize: 13 }}>
              ESCALATED — Doctor did not respond
            </span>
          </div>
        )}

        {/* Patient card */}
        <div style={{
          background: C.bgCard, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: 16, marginBottom: 20
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: C.textPrimary, margin: 0 }}>
              {patientName || "Unknown Patient"}
            </h2>
            <span style={{
              background: condColor.bg, color: condColor.text,
              padding: "3px 12px", borderRadius: 999,
              fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em"
            }}>
              {condition || "UNKNOWN"}
            </span>
          </div>
          <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>
            ETA: <span style={{ fontFamily: "'JetBrains Mono', monospace", color: C.textSecondary }}>{eta}</span> minutes
          </p>
        </div>

        {/* Checklist */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{
            fontSize: 11, color: C.textSecondary, textTransform: "uppercase",
            letterSpacing: "0.08em", fontWeight: 600, marginBottom: 12
          }}>
            Preparation Checklist
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {TASKS.map((task, idx) => {
              const isChecked = checked[idx] === true;
              return (
                <div
                  key={idx}
                  onClick={() => { if (!confirmed) toggleTask(idx); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 16px",
                    background: isChecked ? C.brandLight : C.bgCard,
                    border: `1px solid ${isChecked ? C.brand : C.border}`,
                    borderRadius: 10,
                    cursor: confirmed ? "default" : "pointer",
                    transition: "background 0.15s, border-color 0.15s",
                    userSelect: "none"
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: isChecked ? C.brand : "#ffffff",
                    border: `2px solid ${isChecked ? C.brand : C.borderStrong}`,
                    transition: "background 0.15s, border-color 0.15s"
                  }}>
                    <CheckIcon checked={isChecked} />
                  </div>
                  <span style={{
                    fontSize: 13,
                    color: isChecked ? C.textSecondary : C.textPrimary,
                    textDecoration: isChecked ? "line-through" : "none",
                  }}>
                    {task}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>
              {checkedCount} / {TASKS.length} tasks complete
            </p>
            <div style={{ width: "100%", height: 6, borderRadius: 999, background: C.border, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 999, background: C.brand,
                width: `${(checkedCount / TASKS.length) * 100}%`,
                transition: "width 0.3s ease"
              }} />
            </div>
          </div>
        </div>

        {/* Confirm / Confirmed */}
        {confirmed ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            background: C.stableLight, border: `1px solid ${C.stable}`,
            borderRadius: 12, padding: "16px 20px"
          }}>
            <CheckCircle size={22} color={C.stable} />
            <span style={{ color: C.stable, fontWeight: 600, fontSize: 15 }}>
              All tasks complete — Nurse ready
            </span>
          </div>
        ) : (
          <button
            onClick={handleConfirm}
            disabled={!allDone || confirming}
            style={{
              width: "100%",
              padding: "16px 0",
              borderRadius: 12,
              border: "none",
              fontSize: 15,
              fontWeight: 600,
              cursor: allDone && !confirming ? "pointer" : "not-allowed",
              background: allDone ? C.brand : C.bgSecondary,
              color: allDone ? "#ffffff" : C.textMuted,
              transition: "background 0.15s",
            }}
          >
            {confirming
              ? "Confirming..."
              : allDone
                ? "Confirm Ready"
                : `Complete all tasks to confirm (${TASKS.length - checkedCount} remaining)`}
          </button>
        )}
      </div>
    </div>
  );
}
