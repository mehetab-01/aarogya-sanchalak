import React, { useState, useEffect } from 'react';
import { db } from "../../shared/firebase";
import { ref, onValue, update } from "firebase/database";
import { HOSPITAL_ID } from "../../shared/types";
import { API_BASE_URL } from "../../shared/config";
import { CheckCircle, Clock, Bed } from "lucide-react";

const conditionStyle = {
  CRITICAL: { bg: "var(--color-critical-light)", text: "var(--color-critical)" },
  SERIOUS:  { bg: "var(--color-serious-light)",  text: "var(--color-serious)" },
  STABLE:   { bg: "var(--color-stable-light)",   text: "var(--color-stable)" },
};

export default function App() {
  const [alert, setAlert] = useState(null);
  const [alertId, setAlertId] = useState(null);
  const [loading, setLoading] = useState(true);
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
          if (incoming[1].wardAck === true) {
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

  const handleConfirm = async () => {
    if (!alertId) return;
    try {
      await update(ref(db, `hospitals/${HOSPITAL_ID}/alerts/${alertId}`), {
        wardAck: true,
        wardAckAt: Date.now()
      });
      await fetch(`${API_BASE_URL}/api/alert/ward-ack`, {
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

  const { patientName, condition, eta } = alert;

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
            Ward Boy Portal
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
          Ward Boy
        </span>
      </div>

      <div className="max-w-sm mx-auto px-6 py-8">
        <div className="p-6 mb-4 border" style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)", borderRadius: "10px" }}>
          <div className="flex items-center gap-2 mb-3">
            <Bed size={20} style={{ color: "var(--color-brand)" }} />
            <span className="font-medium uppercase tracking-wide" style={{ fontSize: "var(--font-sm)", color: "var(--color-text-secondary)" }}>
              Incoming Patient
            </span>
          </div>
          
          <h2 className="font-medium mt-3" style={{ fontSize: "var(--font-lg)", color: "var(--color-text-primary)" }}>
            {patientName || "Unknown Patient"}
          </h2>
          
          <div className="mt-2">
            <span style={{
              background: conditionStyle[condition]?.bg,
              color: conditionStyle[condition]?.text,
              padding: "2px 12px",
              borderRadius: "999px",
              fontSize: "var(--font-xs)",
              fontWeight: 500,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              display: "inline-block"
            }}>
              {condition || "UNKNOWN"}
            </span>
          </div>
          
          <hr className="my-4 border-t" style={{ borderColor: "var(--color-border)" }} />
          
          <div className="flex items-center gap-2">
            <Clock size={16} style={{ color: "var(--color-text-muted)" }} />
            <span style={{ fontSize: "var(--font-sm)", color: "var(--color-text-muted)" }}>
              Arriving in <span className="font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>{eta}</span> minutes
            </span>
          </div>
        </div>

        <div className="p-5 mb-6 border" style={{ background: "var(--color-brand-light)", borderColor: "var(--color-brand)", borderRadius: "10px" }}>
          <p className="uppercase tracking-wide mb-2" style={{ fontSize: "var(--font-xs)", color: "var(--color-text-muted)" }}>
            Assigned Location
          </p>
          <p className="font-medium" style={{ fontSize: "var(--font-lg)", color: "var(--color-brand)" }}>
            Emergency Bay 1
          </p>
          <p className="mt-1" style={{ fontSize: "var(--font-xs)", color: "var(--color-text-muted)" }}>
            Prepare bed, trolley and monitoring equipment
          </p>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 py-2 border-b last:border-0" style={{ borderColor: "var(--color-border)" }}>
            <div className="w-4 h-4 border rounded flex-shrink-0" style={{ background: "#ffffff", borderColor: "var(--color-border)", borderRadius: "4px" }}></div>
            <span style={{ fontSize: "var(--font-sm)", color: "var(--color-text-primary)" }}>Clean and prepare the bed</span>
          </div>
          <div className="flex items-center gap-2 py-2 border-b last:border-0" style={{ borderColor: "var(--color-border)" }}>
            <div className="w-4 h-4 border rounded flex-shrink-0" style={{ background: "#ffffff", borderColor: "var(--color-border)", borderRadius: "4px" }}></div>
            <span style={{ fontSize: "var(--font-sm)", color: "var(--color-text-primary)" }}>Set up vital monitoring equipment</span>
          </div>
          <div className="flex items-center gap-2 py-2 border-b last:border-0" style={{ borderColor: "var(--color-border)" }}>
            <div className="w-4 h-4 border rounded flex-shrink-0" style={{ background: "#ffffff", borderColor: "var(--color-border)", borderRadius: "4px" }}></div>
            <span style={{ fontSize: "var(--font-sm)", color: "var(--color-text-primary)" }}>Ensure IV stand is in position</span>
          </div>
        </div>

        <div className="mt-4">
          {confirmed ? (
            <div className="p-5 flex items-center gap-3 border" style={{ background: "var(--color-stable-light)", borderColor: "var(--color-stable)", borderRadius: "10px" }}>
              <CheckCircle size={22} style={{ color: "var(--color-stable)" }} />
              <div>
                <p className="font-medium" style={{ color: "var(--color-stable)" }}>Bed Confirmed Ready</p>
                <p className="mt-0.5" style={{ fontSize: "var(--font-sm)", color: "var(--color-text-muted)" }}>Patient can be received</p>
              </div>
            </div>
          ) : (
            <button 
              onClick={handleConfirm}
              className="w-full py-4 font-medium text-white transition-colors"
              style={{ background: "var(--color-brand)", borderRadius: "10px" }}
              onMouseOver={(e) => e.target.style.background = "var(--color-brand-dark)"}
              onMouseOut={(e) => e.target.style.background = "var(--color-brand)"}
            >
              Confirm Bed Ready
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
