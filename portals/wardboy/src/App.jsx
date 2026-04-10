import { useState, useEffect } from "react";
import { db, auth } from "../../shared/firebase";
import { ref, onValue, update } from "firebase/database";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { HOSPITAL_ID } from "../../shared/types";
import { API_BASE_URL } from "../../shared/config";
import { Bed, Clock, CheckCircle, MapPin, LogOut, Shield, Wifi, Server, User, Activity } from "lucide-react";

// Hardcoded palette (CSS vars may not load reliably at runtime)
const C = {
  brand:        "#0D6E56",
  brandLight:   "#E1F5EE",
  critical:     "#A32D2D",
  criticalLight:"#FCEBEB",
  stable:       "#0F6E56",
  stableLight:  "#E1F5EE",
  bgPrimary:    "#F8F9FA",
  bgSecondary:  "#F1EFE8",
  bgCard:       "#FFFFFF",
  textPrimary:  "#0D0D0D",
  textSecondary:"#5F5E5A",
  textMuted:    "#888780",
  border:       "#D3D1C7",
  borderStrong: "#B5B3AA",
};

const conditionStyle = {
  CRITICAL: { bg: "var(--color-critical-light)", color: "var(--color-critical)" },
  SERIOUS:  { bg: "var(--color-serious-light)",  color: "var(--color-serious)"  },
  STABLE:   { bg: "var(--color-stable-light)",   color: "var(--color-stable)"   },
};

const TASK_LABELS = [
  "Clean and prepare the bed",
  "Set up vital monitoring equipment",
  "Ensure IV stand is in position",
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

      {/* Last patient */}
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
              background: lastAlert.wardAck ? C.brandLight : C.bgSecondary,
              color: lastAlert.wardAck ? C.brand : C.textMuted,
              fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999,
              textTransform: "uppercase"
            }}>
              {lastAlert.wardAck ? "Bed Ready" : "Pending"}
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
          { icon: <User size={14} color={C.brand} />, label: "Role", value: "Ward Boy on Duty", ok: true },
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

// ── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", backgroundColor: "var(--color-bg-primary)",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        border: "4px solid var(--color-brand)",
        borderTopColor: "transparent",
        animation: "spin 0.7s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────────────────────────
function LoginScreen() {
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [error,     setError]     = useState("");
  const [signingIn, setSigningIn] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    setSigningIn(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError("Invalid credentials — try ward@aarogya.in");
      setSigningIn(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      background: "#F8F9FA", padding: "16px",
    }}>
      <div style={{
        background: "white", border: "1px solid #D3D1C7",
        borderRadius: "12px", padding: "32px",
        width: "100%", maxWidth: "380px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}>

        {/* Icon */}
        <div style={{
          width: "56px", height: "56px", borderRadius: "12px",
          background: "#E1F5EE", display: "flex",
          alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
        }}>
          <Shield size={24} color="#0D6E56" />
        </div>

        {/* Title */}
        <p style={{
          textAlign: "center", fontSize: "11px", fontWeight: 500,
          color: "#888780", letterSpacing: "0.08em",
          textTransform: "uppercase", marginBottom: "4px",
        }}>
          Aarogya Sanchalak
        </p>
        <h1 style={{
          textAlign: "center", fontSize: "20px", fontWeight: 500,
          color: "#0D0D0D", marginBottom: "4px", margin: "0 0 4px",
        }}>
          Ward Boy Portal
        </h1>
        <p style={{
          textAlign: "center", fontSize: "13px", color: "#888780",
          marginBottom: "24px",
        }}>
          Sign in to access Aarogya Sanchalak
        </p>

        {/* Email */}
        <label style={{
          display: "block", fontSize: "11px", fontWeight: 500,
          color: "#5F5E5A", textTransform: "uppercase",
          letterSpacing: "0.05em", marginBottom: "6px",
        }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="ward@aarogya.in"
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{
            width: "100%", border: "1px solid #D3D1C7",
            borderRadius: "8px", padding: "12px",
            fontSize: "14px", marginBottom: "16px",
            boxSizing: "border-box", outline: "none",
          }}
        />

        {/* Password */}
        <label style={{
          display: "block", fontSize: "11px", fontWeight: 500,
          color: "#5F5E5A", textTransform: "uppercase",
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
            width: "100%", border: "1px solid #D3D1C7",
            borderRadius: "8px", padding: "12px",
            fontSize: "14px", marginBottom: "20px",
            boxSizing: "border-box", outline: "none",
          }}
        />

        {/* Error */}
        {error && (
          <p style={{
            color: "#A32D2D", fontSize: "13px",
            textAlign: "center", marginBottom: "12px",
          }}>
            {error}
          </p>
        )}

        {/* Sign In button */}
        <button
          onClick={handleLogin}
          disabled={signingIn}
          style={{
            width: "100%", padding: "14px",
            background: signingIn ? "#888780" : "#0D6E56",
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
          color: "#888780", marginTop: "24px", marginBottom: 0,
        }}>
          Aarogya Sanchalak Clinical System · NEOFuture 2026
        </p>
      </div>
    </div>
  );
}

// ── Main Portal ───────────────────────────────────────────────────────────────
export default function App() {
  const [user,        setUser]        = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [alert,       setAlert]       = useState(null);
  const [alertId,     setAlertId]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [confirmed,   setConfirmed]   = useState(false);
  const [tasks,       setTasks]       = useState({ 0: false, 1: false, 2: false });
  const [lastAlert,   setLastAlert]   = useState(null);
  const [backendOk,   setBackendOk]   = useState(true);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Alerts listener (only active when logged in)
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onValue(
      ref(db, `/hospitals/${HOSPITAL_ID}/alerts`),
      (snap) => {
        const data = snap.val();
        if (data) {
          const entries = Object.entries(data).map(([id, a]) => ({ id, ...a }));
          const incoming = entries
            .filter(a => a.status === "INCOMING")
            .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))[0];
          if (incoming) {
            setAlertId(incoming.id);
            setAlert(incoming);
            setConfirmed(incoming.wardAck === true);
          } else {
            setAlert(null);
            setAlertId(null);
            setConfirmed(false);
            setTasks({ 0: false, 1: false, 2: false });
          }
          const past = entries
            .filter(a => a.status !== "INCOMING")
            .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
          if (past.length > 0) setLastAlert(past[0]);
        } else {
          setAlert(null);
          setAlertId(null);
          setConfirmed(false);
          setTasks({ 0: false, 1: false, 2: false });
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
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

  async function handleConfirm() {
    if (!alertId) return;
    try {
      await update(ref(db, `/hospitals/${HOSPITAL_ID}/alerts/${alertId}`), {
        wardAck: true,
        wardAckAt: Date.now(),
      });
      await fetch(`${API_BASE_URL}/api/alert/ward-ack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      });
      setConfirmed(true);
    } catch (e) {
      console.error("Ward ack failed:", e);
    }
  }

  // Reset task checkboxes whenever the active alert changes
  useEffect(() => {
    setTasks({ 0: false, 1: false, 2: false });
  }, [alertId]);

  function toggleTask(i) {
    setTasks(prev => ({ ...prev, [i]: !prev[i] }));
  }

  // ── Auth states ────────────────────────────────────────────────────────────
  if (authLoading) return <Spinner />;
  if (!user)       return <LoginScreen />;

  const allTasksDone  = tasks[0] && tasks[1] && tasks[2];
  const remaining     = 3 - Object.values(tasks).filter(Boolean).length;
  const cStyle        = conditionStyle[alert?.condition] ?? conditionStyle.STABLE;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-primary)" }}>

      {/* ── Header ── */}
      <div style={{
        backgroundColor: "var(--color-bg-card)",
        borderBottom: "1px solid var(--color-border)",
        padding: "16px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div>
          <p style={{
            fontSize: "var(--font-xs)", fontWeight: 500,
            color: "var(--color-text-muted)",
            textTransform: "uppercase", letterSpacing: "0.1em",
            marginBottom: 2,
          }}>
            Aarogya Sanchalak
          </p>
          <p style={{ fontSize: "var(--font-md)", fontWeight: 500, color: "var(--color-text-primary)" }}>
            Ward Boy Portal
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            backgroundColor: "var(--color-brand-light)",
            color: "var(--color-brand)",
            fontSize: "var(--font-xs)", fontWeight: 500,
            padding: "4px 12px", borderRadius: 999,
          }}>
            Ward Boy
          </span>
          <button
            onClick={() => signOut(auth)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", padding: 4,
            }}
            title="Logout"
          >
            <LogOut size={16} style={{ color: "var(--color-text-muted)" }} />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 512, margin: "0 auto", padding: "32px 24px" }}>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              border: "4px solid var(--color-brand)",
              borderTopColor: "transparent",
              animation: "spin 0.7s linear infinite",
            }} />
          </div>
        )}

        {/* No alert — idle dashboard */}
        {!loading && !alert && (
          <IdleDashboard lastAlert={lastAlert} backendOk={backendOk} />
        )}

        {/* Active alert */}
        {!loading && alert && (
          <>
            {/* 1 — Patient card */}
            <div style={{
              backgroundColor: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 10, padding: 20, marginBottom: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Bed size={16} style={{ color: "var(--color-brand)" }} />
                <span style={{
                  fontSize: "var(--font-xs)", fontWeight: 500,
                  color: "var(--color-text-muted)",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                }}>
                  Incoming Patient
                </span>
              </div>

              <p style={{ fontSize: "var(--font-md)", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 8 }}>
                {alert.patientName ?? "Unknown"}
              </p>

              <span style={{
                display: "inline-block",
                backgroundColor: cStyle.bg, color: cStyle.color,
                padding: "2px 12px", borderRadius: 999,
                fontSize: "var(--font-xs)", fontWeight: 500,
                textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                {alert.condition ?? "—"}
              </span>

              <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: "12px 0" }} />

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Clock size={14} style={{ color: "var(--color-text-muted)" }} />
                <span style={{ fontSize: "var(--font-sm)", color: "var(--color-text-muted)" }}>
                  Arriving in{" "}
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 500, color: "var(--color-text-primary)" }}>
                    {alert.eta ?? "—"}
                  </span>
                  {" "}minutes
                </span>
              </div>
            </div>

            {/* 2 — Assigned location card */}
            <div style={{
              backgroundColor: "var(--color-brand-light)",
              border: "1px solid var(--color-brand)",
              borderRadius: 10, padding: 20, marginBottom: 16,
            }}>
              <p style={{
                fontSize: "var(--font-xs)", fontWeight: 500,
                color: "var(--color-brand)",
                textTransform: "uppercase", letterSpacing: "0.08em",
                marginBottom: 8,
              }}>
                Assigned Location
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <MapPin size={16} style={{ color: "var(--color-brand)" }} />
                <span style={{ fontSize: "var(--font-md)", fontWeight: 500, color: "var(--color-brand)" }}>
                  Emergency Bay 1
                </span>
              </div>
              <p style={{ fontSize: "var(--font-sm)", color: "var(--color-text-muted)" }}>
                Prepare bed, trolley and monitoring equipment
              </p>
            </div>

            {/* 3 — Checklist */}
            <p style={{
              fontSize: "var(--font-xs)", fontWeight: 500,
              color: "var(--color-text-secondary)",
              textTransform: "uppercase", letterSpacing: "0.08em",
              marginBottom: 12,
            }}>
              Preparation Checklist
            </p>

            {TASK_LABELS.map((label, i) => (
              <div
                key={i}
                onClick={() => toggleTask(i)}
                style={{
                  backgroundColor: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 10, padding: 16, marginBottom: 8,
                  display: "flex", alignItems: "center", gap: 12,
                  cursor: "pointer", userSelect: "none",
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                  border: tasks[i] ? "2px solid var(--color-brand)" : "2px solid var(--color-border)",
                  backgroundColor: tasks[i] ? "var(--color-brand)" : "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}>
                  {tasks[i] && (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>

                <span style={{
                  fontSize: "var(--font-sm)",
                  color: tasks[i] ? "var(--color-text-muted)" : "var(--color-text-primary)",
                  textDecoration: tasks[i] ? "line-through" : "none",
                  transition: "all 0.15s",
                }}>
                  {label}
                </span>
              </div>
            ))}

            {/* 4 — Confirm / confirmed */}
            <div style={{ marginTop: 16 }}>
              {confirmed ? (
                <div style={{
                  backgroundColor: "var(--color-stable-light)",
                  border: "1px solid var(--color-stable)",
                  borderRadius: 10, padding: 20,
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <CheckCircle size={22} style={{ color: "var(--color-stable)", flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: "var(--font-md)", fontWeight: 500, color: "var(--color-stable)" }}>
                      Bed Confirmed Ready
                    </p>
                    <p style={{ fontSize: "var(--font-sm)", color: "var(--color-text-muted)", marginTop: 2 }}>
                      Patient can be received
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={allTasksDone ? handleConfirm : undefined}
                  style={{
                    width: "100%", padding: "16px",
                    borderRadius: 10, border: "none",
                    fontSize: "var(--font-sm)", fontWeight: 500,
                    cursor: allTasksDone ? "pointer" : "not-allowed",
                    backgroundColor: allTasksDone ? "var(--color-brand)" : "var(--color-bg-secondary)",
                    color: allTasksDone ? "#fff" : "var(--color-text-muted)",
                    transition: "background-color 0.15s",
                  }}
                >
                  {allTasksDone
                    ? "Confirm Bed Ready"
                    : `Complete all tasks first (${remaining} remaining)`}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
