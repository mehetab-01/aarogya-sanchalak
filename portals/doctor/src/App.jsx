import { useState, useEffect, useRef } from "react";
import { db, auth } from "../../shared/firebase";
import { ref, onValue, update } from "firebase/database";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { HOSPITAL_ID } from "../../shared/types";
import { API_BASE_URL } from "../../shared/config";
import { Stethoscope, Clock, CheckCircle, Activity, LogOut, Wifi, Server, User, Droplets } from "lucide-react";

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
  bgCard:        "#FFFFFF",
  bgSecondary:   "#F1EFE8",
  textPrimary:   "#0D0D0D",
  textSecondary: "#5F5E5A",
  textMuted:     "#888780",
  border:        "#D3D1C7",
};

const COND_BG    = { CRITICAL: "#FCEBEB", SERIOUS: "#FAEEDA", STABLE: "#E1F5EE" };
const COND_COLOR = { CRITICAL: "#A32D2D", SERIOUS: "#854F0B", STABLE: "#0F6E56" };

// ── Spinner ───────────────────────────────────────────────────────────────────
function FullSpinner() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      background: C.bgPrimary,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        border: `4px solid ${C.brand}`, borderTopColor: "transparent",
        animation: "spin 0.7s linear infinite",
      }} />
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────────────────────────
function LoginScreen() {
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [loginError, setLoginError] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setLoginError("Please enter email and password");
      return;
    }
    setSigningIn(true);
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setLoginError("Invalid credentials — try doctor@aarogya.in");
      setSigningIn(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      background: C.bgPrimary, padding: "16px",
    }}>
      <div style={{
        background: "white", border: `1px solid ${C.border}`,
        borderRadius: "12px", padding: "32px",
        width: "100%", maxWidth: "380px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}>
        {/* Icon */}
        <div style={{
          width: "56px", height: "56px", borderRadius: "12px",
          background: C.brandLight, display: "flex",
          alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
        }}>
          <Stethoscope size={24} color={C.brand} />
        </div>

        {/* Title */}
        <p style={{
          textAlign: "center", fontSize: "11px", fontWeight: 500,
          color: C.textMuted, letterSpacing: "0.08em",
          textTransform: "uppercase", marginBottom: "4px",
        }}>
          Aarogya Sanchalak
        </p>
        <h1 style={{
          textAlign: "center", fontSize: "20px", fontWeight: 500,
          color: C.textPrimary, margin: "0 0 4px",
        }}>
          Doctor Portal
        </h1>
        <p style={{
          textAlign: "center", fontSize: "13px",
          color: C.textMuted, marginBottom: "24px",
        }}>
          Sign in to access Aarogya Sanchalak
        </p>

        {/* Email */}
        <label style={{
          display: "block", fontSize: "11px", fontWeight: 500,
          color: C.textSecondary, textTransform: "uppercase",
          letterSpacing: "0.05em", marginBottom: "6px",
        }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="doctor@aarogya.in"
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{
            width: "100%", border: `1px solid ${C.border}`,
            borderRadius: "8px", padding: "12px",
            fontSize: "14px", marginBottom: "16px",
            boxSizing: "border-box", outline: "none",
          }}
        />

        {/* Password */}
        <label style={{
          display: "block", fontSize: "11px", fontWeight: 500,
          color: C.textSecondary, textTransform: "uppercase",
          letterSpacing: "0.05em", marginBottom: "6px",
        }}>
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{
            width: "100%", border: `1px solid ${C.border}`,
            borderRadius: "8px", padding: "12px",
            fontSize: "14px", marginBottom: "20px",
            boxSizing: "border-box", outline: "none",
          }}
        />

        {/* Error */}
        {loginError && (
          <p style={{
            color: C.critical, fontSize: "13px",
            textAlign: "center", marginBottom: "12px",
          }}>
            {loginError}
          </p>
        )}

        {/* Sign In */}
        <button
          onClick={handleLogin}
          disabled={signingIn}
          style={{
            width: "100%", padding: "14px",
            background: signingIn ? C.textMuted : C.brand,
            color: "white", border: "none",
            borderRadius: "8px", fontSize: "15px",
            fontWeight: 500, cursor: signingIn ? "not-allowed" : "pointer",
            display: "block",
          }}
        >
          {signingIn ? "Signing in..." : "Sign In"}
        </button>

        {/* Footer */}
        <p style={{
          textAlign: "center", fontSize: "12px",
          color: C.textMuted, marginTop: "24px", marginBottom: 0,
        }}>
          Aarogya Sanchalak Clinical System · NEOFuture 2026
        </p>
      </div>
    </div>
  );
}

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
      {lastAlert ? (
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
              background: lastAlert.doctorAck ? C.stableLight : C.bgSecondary,
              color: lastAlert.doctorAck ? C.stable : C.textMuted,
              fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999,
              textTransform: "uppercase"
            }}>
              {lastAlert.doctorAck ? "Acked" : "Pending"}
            </span>
          </div>
        </div>
      ) : (
        <div style={{
          background: C.bgCard, border: `1px solid ${C.border}`,
          borderRadius: 14, padding: "20px 24px", marginBottom: 16,
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            Last Patient
          </p>
          <p style={{ fontSize: 13, color: C.textMuted }}>No recent activity</p>
        </div>
      )}

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
          { icon: <User size={14} color={C.brand} />, label: "Role", value: "Doctor on Duty", ok: true },
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

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user,        setUser]        = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [alert,       setAlert]       = useState(null);
  const [alertId,     setAlertId]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [acking,      setAcking]      = useState(false);
  const [elapsed,     setElapsed]     = useState(0);
  const [lastAlert,   setLastAlert]   = useState(null);
  const [backendOk,   setBackendOk]   = useState(true);

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Alerts (only when logged in)
  useEffect(() => {
    if (!user) return;
    const unsub = onValue(
      ref(db, `/hospitals/${HOSPITAL_ID}/alerts`),
      snap => {
        const data = snap.val();
        if (data) {
          const entries = Object.entries(data).map(([id, a]) => ({ id, ...a }));
          const incoming = entries
            .filter(a => a.status === "INCOMING")
            .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))[0];
          if (incoming) {
            setAlertId(incoming.id);
            setAlert(incoming);
          } else {
            setAlert(null);
            setAlertId(null);
          }
          // Last non-incoming (admitted/discharged) for idle summary
          const past = entries
            .filter(a => a.status !== "INCOMING")
            .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
          if (past.length > 0) setLastAlert(past[0]);
        } else {
          setAlert(null);
          setAlertId(null);
        }
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  // Backend health ping
  useEffect(() => {
    if (!user) return;
    const check = () =>
      fetch(`${API_BASE_URL}/api/beds/status`, { signal: AbortSignal.timeout(3000) })
        .then(() => setBackendOk(true))
        .catch(() => setBackendOk(false));
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [user]);

  // Elapsed timer — updates every 30s
  useEffect(() => {
    if (!alert?.timestamp) return;
    const calc = () =>
      setElapsed(Math.floor((Date.now() - alert.timestamp) / 60000));
    calc();
    const id = setInterval(calc, 30000);
    return () => clearInterval(id);
  }, [alert?.timestamp]);

  async function handleAck() {
    if (!alertId || acking) return;
    setAcking(true);
    try {
      await update(
        ref(db, `/hospitals/${HOSPITAL_ID}/alerts/${alertId}`),
        { doctorAck: true, doctorAckAt: Date.now() }
      );
      await fetch(`${API_BASE_URL}/api/alert/doctor-ack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      });
    } catch (e) {
      console.error("Ack failed:", e);
    }
    setAcking(false);
  }

  // ── Auth gates ────────────────────────────────────────────────────────────
  if (authLoading) return <FullSpinner />;
  if (!user)       return <LoginScreen />;

  const etaColor =
    (alert?.eta ?? 99) <= 5  ? C.critical :
    (alert?.eta ?? 99) <= 10 ? C.serious  : C.textPrimary;

  const elapsedColor =
    elapsed < 3 ? C.stable :
    elapsed < 6 ? C.serious : C.critical;

  // vitals — backend stores them top-level (bp, pulse)
  // but some older writes may have them nested under vitals{}
  const bp    = alert?.bp    ?? alert?.vitals?.bp    ?? "—";
  const pulse = alert?.pulse ?? alert?.vitals?.pulse ?? "—";

  return (
    <div style={{ minHeight: "100vh", background: C.bgPrimary }}>

      {/* ── Header ── */}
      <div style={{
        background: "white", borderBottom: `1px solid ${C.border}`,
        padding: "16px 24px", display: "flex",
        justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div>
          <p style={{
            fontSize: "11px", fontWeight: 500, color: C.textMuted,
            letterSpacing: "0.08em", textTransform: "uppercase",
            marginBottom: "2px",
          }}>
            Aarogya Sanchalak
          </p>
          <p style={{ fontSize: "17px", fontWeight: 500, color: C.textPrimary }}>
            Doctor Portal
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{
            background: C.brandLight, color: C.brand,
            fontSize: "11px", fontWeight: 500,
            padding: "4px 12px", borderRadius: "999px",
          }}>
            Doctor
          </span>
          <button
            onClick={() => signOut(auth)}
            style={{
              background: "none", border: "none",
              cursor: "pointer", display: "flex",
              alignItems: "center", padding: "4px",
            }}
            title="Logout"
          >
            <LogOut size={16} color={C.textMuted} />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: "80px" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            border: `4px solid ${C.brand}`, borderTopColor: "transparent",
            animation: "spin 0.7s linear infinite",
          }} />
        </div>
      )}

      {!loading && !alert && (
        <IdleDashboard lastAlert={lastAlert} backendOk={backendOk} />
      )}

      {!loading && alert && (
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "32px 24px" }}>
          <>
            {/* 1 — Patient card */}
            <div style={{
              background: "white", border: `1px solid ${C.border}`,
              borderRadius: "10px", padding: "24px", marginBottom: "16px",
            }}>
              {/* Name + badge */}
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", marginBottom: "8px",
              }}>
                <p style={{ fontSize: "17px", fontWeight: 500, color: C.textPrimary }}>
                  {alert.patientName ?? "Unknown Patient"}
                </p>
                <span style={{
                  background: COND_BG[alert.condition]    ?? C.bgSecondary,
                  color:      COND_COLOR[alert.condition] ?? C.textMuted,
                  padding: "3px 12px", borderRadius: "999px",
                  fontSize: "11px", fontWeight: 500,
                  letterSpacing: "0.05em", textTransform: "uppercase",
                  flexShrink: 0, marginLeft: "12px",
                }}>
                  {alert.condition ?? "—"}
                </span>
              </div>

              <p style={{ fontSize: "13px", color: C.textMuted, marginBottom: "16px" }}>
                Age {alert.age ?? "—"} years
              </p>

              <hr style={{ border: "none", borderTop: `1px solid ${C.border}`, margin: "0 0 16px" }} />

              {/* Vitals */}
              <div style={{ fontFamily: "JetBrains Mono, monospace", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: C.textMuted }}>Blood Pressure</span>
                  <span style={{ fontSize: "15px", fontWeight: 500, color: C.textPrimary }}>
                    {bp} mmHg
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: C.textMuted }}>Pulse Rate</span>
                  <span style={{ fontSize: "15px", fontWeight: 500, color: C.textPrimary }}>
                    {pulse} bpm
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: C.textMuted }}>
                    <Clock size={14} color={C.textMuted} /> ETA
                  </span>
                  <span style={{ fontSize: "15px", fontWeight: 500, color: etaColor }}>
                    {alert.eta ?? "—"} minutes
                  </span>
                </div>
              </div>

              {/* Blood info */}
              {(alert.bloodLoss && alert.bloodLoss !== "None") && (
                <>
                  <hr style={{ border: "none", borderTop: `1px solid ${C.border}`, margin: "16px 0 12px" }} />
                  {alert.bloodLoss === "Severe" && (
                    <div style={{
                      background: C.criticalLight, border: `1px solid ${C.critical}`,
                      borderRadius: 8, padding: "10px 14px", marginBottom: 10,
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <Droplets size={14} color={C.critical} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.critical }}>
                        SEVERE blood loss — emergency transfusion may be required
                      </span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "JetBrains Mono, monospace" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.textMuted }}>
                      <Droplets size={14} color={C.critical} /> Blood Loss
                    </span>
                    <span style={{
                      fontSize: 14, fontWeight: 600,
                      color: alert.bloodLoss === "Severe" ? C.critical : alert.bloodLoss === "Moderate" ? C.serious : C.textPrimary,
                    }}>
                      {alert.bloodLoss}
                    </span>
                  </div>
                  {alert.bloodGroup && alert.bloodGroup !== "Unknown" && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, fontFamily: "JetBrains Mono, monospace" }}>
                      <span style={{ fontSize: 13, color: C.textMuted }}>Blood Group</span>
                      <span style={{
                        background: C.brandLight, color: C.brand,
                        fontSize: 13, fontWeight: 700, padding: "2px 10px", borderRadius: 999,
                      }}>
                        {alert.bloodGroup}
                      </span>
                    </div>
                  )}
                </>
              )}

              <hr style={{ border: "none", borderTop: `1px solid ${C.border}`, margin: "16px 0" }} />

              <p style={{ fontSize: "13px", color: C.textMuted }}>
                Ambulance {alert.driverId ?? "—"}
              </p>

              {alert.notes && (
                <p style={{
                  fontSize: "13px", color: C.textMuted,
                  marginTop: "8px", fontStyle: "italic",
                }}>
                  Notes: {alert.notes}
                </p>
              )}
            </div>

            {/* 2 — Elapsed timer */}
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              fontSize: "13px", color: elapsedColor, marginBottom: "16px",
            }}>
              <Activity size={14} color={elapsedColor} />
              Alert received {elapsed} minute{elapsed !== 1 ? "s" : ""} ago
            </div>

            {/* 3 — Acknowledge */}
            {alert.doctorAck ? (
              <div style={{
                background: C.stableLight, border: `1px solid ${C.stable}`,
                borderRadius: "10px", padding: "16px",
                display: "flex", alignItems: "center", gap: "12px",
              }}>
                <CheckCircle size={20} color={C.stable} />
                <span style={{ fontSize: "15px", fontWeight: 500, color: C.stable }}>
                  You have acknowledged this emergency
                </span>
              </div>
            ) : (
              <button
                onClick={handleAck}
                disabled={acking}
                style={{
                  width: "100%", padding: "16px",
                  background: acking ? C.textMuted : C.brand,
                  color: "white", border: "none",
                  borderRadius: "10px", fontSize: "15px",
                  fontWeight: 500,
                  cursor: acking ? "not-allowed" : "pointer",
                }}
              >
                {acking ? "Acknowledging..." : "Acknowledge Emergency"}
              </button>
            )}
          </>
      </div>
      )}
    </div>
  );
}
