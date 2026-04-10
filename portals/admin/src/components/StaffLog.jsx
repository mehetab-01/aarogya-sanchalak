export default function StaffLog() {
  return (
    <div style={{
      background: "var(--color-bg-card)",
      border: "1px solid var(--color-border)",
      borderRadius: "10px",
      padding: "16px",
      marginTop: "16px"
    }}>
      <p style={{
        fontSize: "var(--font-xs)",
        fontWeight: 500,
        color: "var(--color-text-secondary)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: "8px"
      }}>
        Staff Response Log
      </p>
      <p style={{
        fontSize: "var(--font-sm)",
        color: "var(--color-text-muted)"
      }}>
        No activity yet — logs appear when staff acknowledge alerts
      </p>
    </div>
  )
}