import React, { useState, useEffect } from 'react';
import { db } from "../../shared/firebase";
import { ref, onValue, update } from "firebase/database";
import { HOSPITAL_ID } from "../../shared/types";
import { API_BASE_URL } from "../../shared/config";
import { CheckCircle } from "lucide-react";

const conditionStyle = {
  CRITICAL: { bg: "var(--color-critical-light)", text: "var(--color-critical)" },
  SERIOUS:  { bg: "var(--color-serious-light)",  text: "var(--color-serious)" },
  STABLE:   { bg: "var(--color-stable-light)",   text: "var(--color-stable)" },
};

export default function App() {
  const [alert, setAlert] = useState(null);
  const [alertId, setAlertId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const alertsRef = ref(db, `hospitals/${HOSPITAL_ID}/alerts`);
    const unsubscribe = onValue(alertsRef, (snap) => {
      const data = snap.val();
      if (data) {
        const incoming = Object.entries(data).find(([id, a]) => a.status === "INCOMING");
        if (incoming) {
          setAlertId(incoming[0]);
          setAlert(incoming[1]);
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

  const handleAck = async () => {
    if (!alertId) return;
    try {
      await update(ref(db, `hospitals/${HOSPITAL_ID}/alerts/${alertId}`), {
        doctorAck: true,
        doctorAckAt: Date.now()
      });
      await fetch(`${API_BASE_URL}/api/alert/doctor-ack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId })
      });
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

  const { patientName, condition, age, bp, pulse, eta, driverId, doctorAck } = alert;

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
            Doctor Portal
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
          Doctor
        </span>
      </div>

      <div className="max-w-lg mx-auto px-6 py-8">
        <div className="p-6 mb-4 border" style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)", borderRadius: "10px" }}>
          <div className="flex justify-between items-center">
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
          <p className="mt-1" style={{ fontSize: "var(--font-sm)", color: "var(--color-text-muted)" }}>
            Age {age} years
          </p>
          
          <hr className="my-4 border-t" style={{ borderColor: "var(--color-border)" }} />
          
          <div style={{ fontFamily: "var(--font-mono)" }}>
            <div className="flex justify-between items-center mb-2">
              <span style={{ fontSize: "var(--font-xs)", color: "var(--color-text-muted)" }}>Blood Pressure</span>
              <span style={{ fontSize: "var(--font-base)", color: "var(--color-text-primary)" }}>{bp} mmHg</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span style={{ fontSize: "var(--font-xs)", color: "var(--color-text-muted)" }}>Pulse Rate</span>
              <span style={{ fontSize: "var(--font-base)", color: "var(--color-text-primary)" }}>{pulse} bpm</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ fontSize: "var(--font-xs)", color: "var(--color-text-muted)" }}>ETA</span>
              <span style={{ fontSize: "var(--font-base)", color: "var(--color-text-primary)" }}>{eta} minutes</span>
            </div>
          </div>
          
          <hr className="my-4 border-t" style={{ borderColor: "var(--color-border)" }} />
          
          <p style={{ fontSize: "var(--font-xs)", color: "var(--color-text-muted)" }}>
            Ambulance {driverId}
          </p>
        </div>

        <div className="mt-4">
          {doctorAck ? (
            <div className="p-4 flex items-center gap-3 border" style={{ background: "var(--color-stable-light)", borderColor: "var(--color-stable)", borderRadius: "10px" }}>
              <CheckCircle size={20} style={{ color: "var(--color-stable)" }} />
              <span className="font-medium" style={{ color: "var(--color-stable)" }}>
                You have acknowledged this emergency
              </span>
            </div>
          ) : (
            <button 
              onClick={handleAck}
              className="w-full py-4 font-medium text-white transition-colors"
              style={{ background: "var(--color-brand)", borderRadius: "10px" }}
              onMouseOver={(e) => e.target.style.background = "var(--color-brand-dark)"}
              onMouseOut={(e) => e.target.style.background = "var(--color-brand)"}
            >
              Acknowledge Emergency
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
