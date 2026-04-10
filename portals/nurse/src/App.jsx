import React, { useState, useEffect } from 'react';
import { db } from "../../shared/firebase";
import { ref, onValue, update } from "firebase/database";
import { HOSPITAL_ID } from "../../shared/types";
import { API_BASE_URL } from "../../shared/config";
import { CheckCircle, AlertTriangle, Check } from "lucide-react";

const conditionStyle = {
  CRITICAL: { bg: "var(--color-critical-light)", text: "var(--color-critical)" },
  SERIOUS:  { bg: "var(--color-serious-light)",  text: "var(--color-serious)" },
  STABLE:   { bg: "var(--color-stable-light)",   text: "var(--color-stable)" },
};

const TASKS = [
  { id: 0, label: "Prepare stretcher at emergency bay" },
  { id: 1, label: "Set up IV drip station" },
  { id: 2, label: "Alert OT team" },
  { id: 3, label: "Prepare blood type kit" },
  { id: 4, label: "Notify on-duty anaesthetist" }
];

export default function App() {
  const [alert, setAlert] = useState(null);
  const [alertId, setAlertId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState({});
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const alertsRef = ref(db, `hospitals/${HOSPITAL_ID}/alerts`);
    const unsubscribe = onValue(alertsRef, (snap) => {
      const data = snap.val();
      if (data) {
        const incoming = Object.entries(data).find(([id, a]) => a.status === "INCOMING");
        if (incoming) {
          setAlertId(incoming[0]);
          setAlert(incoming[1]);
          if (incoming[1].nurseAck === true) {
            setConfirmed(true);
          }
        } else {
          setAlert(null);
          setAlertId(null);
        }
      } else {
        setAlert(null);
        setAlertId(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleTask = (taskId) => {
    setChecked(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleConfirm = async () => {
    if (!alertId) return;
    try {
      await update(ref(db, `hospitals/${HOSPITAL_ID}/alerts/${alertId}`), {
        nurseAck: true,
        nurseAckAt: Date.now()
      });
      await fetch(`${API_BASE_URL}/api/alert/nurse-ack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId })
      });
      setConfirmed(true);
    } catch (error) {
      console.error("Error acknowledging alert:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "var(--color-bg-primary)" }}>
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--color-brand)", borderTopColor: "transparent" }}></div>
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "var(--color-bg-primary)" }}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: "var(--color-stable)" }} />
          <span className="text-base" style={{ color: "var(--color-text-muted)" }}>
            No active emergencies
          </span>
        </div>
      </div>
    );
  }

  const { patientName, condition, eta, escalatedToNurse } = alert;
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const allDone = checkedCount === TASKS.length;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-primary)" }}>
      <div style={{
        background: "var(--color-bg-card)",
        borderBottom: "1px solid var(--color-border)",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div>
          <p style={{
            fontSize: "var(--font-xs)",
            color: "var(--color-text-muted)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "2px"
          }}>
            Aarogya Sanchalak
          </p>
          <h1 style={{
            fontSize: "var(--font-md)",
            fontWeight: 500,
            color: "var(--color-text-primary)"
          }}>
            Nurse Portal
          </h1>
        </div>
        <span style={{
          background: "var(--color-brand-light)",
          color: "var(--color-brand)",
          padding: "4px 12px",
          borderRadius: "999px",
          fontSize: "var(--font-xs)",
          fontWeight: 500
        }}>
          Nurse
        </span>
      </div>

      <div className="max-w-lg mx-auto px-6 py-8">
        {escalatedToNurse && (
          <div className="p-4 mb-4 border-l-4" style={{ 
            background: "var(--color-critical-light)", 
            borderColor: "var(--color-critical)", 
            borderRadius: "10px" 
          }}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} style={{ color: "var(--color-critical)" }} />
              <span className="font-medium" style={{ color: "var(--color-critical)" }}>
                ESCALATED — Doctor did not respond
              </span>
            </div>
          </div>
        )}

        <div className="p-4 mb-4 border" style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)", borderRadius: "10px" }}>
          <div className="flex justify-between items-center mb-1">
            <h2 className="font-medium" style={{ fontSize: "var(--font-md)", color: "var(--color-text-primary)" }}>
              {patientName || "Unknown Patient"}
            </h2>
            <span style={{
              background: conditionStyle[condition]?.bg,
              color: conditionStyle[condition]?.text,
              padding: "2px 12px",
              borderRadius: "999px",
              fontSize: "var(--font-xs)",
              fontWeight: 500,
              letterSpacing: "0.05em",
              textTransform: "uppercase"
            }}>
              {condition || "UNKNOWN"}
            </span>
          </div>
          <p style={{ fontSize: "var(--font-sm)", color: "var(--color-text-muted)" }}>
            ETA: <span style={{ fontFamily: "var(--font-mono)" }}>{eta}</span> minutes
          </p>
        </div>

        <div className="mb-4">
          <h3 className="uppercase tracking-wide font-medium mb-3" style={{ fontSize: "var(--font-sm)", color: "var(--color-text-secondary)" }}>
            Preparation Checklist
          </h3>
          
          <div className="space-y-2">
            {TASKS.map(task => {
              const isChecked = checked[task.id];
              return (
                <div 
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="flex items-center gap-3 p-4 border cursor-pointer transition-colors"
                  style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)", borderRadius: "10px" }}
                >
                  <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{
                    background: isChecked ? "var(--color-brand)" : "#ffffff",
                    border: `2px solid ${isChecked ? "var(--color-brand)" : "var(--color-border)"}`
                  }}>
                    {isChecked && <Check size={12} color="#ffffff" />}
                  </div>
                  <span style={{ 
                    fontSize: "var(--font-sm)",
                    color: isChecked ? "var(--color-text-muted)" : "var(--color-text-primary)",
                    textDecoration: isChecked ? "line-through" : "none"
                  }}>
                    {task.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <p className="mb-1" style={{ fontSize: "var(--font-xs)", color: "var(--color-text-muted)" }}>
              {checkedCount} / {TASKS.length} tasks complete
            </p>
            <div className="w-full h-1.5 rounded-full" style={{ background: "var(--color-border)" }}>
              <div 
                className="h-full rounded-full transition-all duration-300 ease-in-out" 
                style={{ background: "var(--color-brand)", width: `${(checkedCount / TASKS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          {confirmed ? (
            <div className="p-4 flex items-center gap-3 border" style={{ background: "var(--color-stable-light)", borderColor: "var(--color-stable)", borderRadius: "10px" }}>
              <CheckCircle size={20} style={{ color: "var(--color-stable)" }} />
              <span className="font-medium" style={{ color: "var(--color-stable)" }}>
                All tasks complete — Nurse ready
              </span>
            </div>
          ) : (
            <button 
              onClick={() => allDone && handleConfirm()}
              disabled={!allDone}
              className={`w-full py-4 font-medium transition-colors ${allDone ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              style={{ 
                background: allDone ? "var(--color-brand)" : "var(--color-bg-secondary)", 
                color: allDone ? "#ffffff" : "var(--color-text-muted)",
                borderRadius: "10px" 
              }}
            >
              {allDone ? "Confirm Ready" : `Complete all tasks to confirm (${TASKS.length - checkedCount} remaining)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
