// TODO Sayali: listen to Firebase alert/{alertId}/doctorAck
// Show live status: Hospital Notified → Doctor Acknowledged → Bed Assigned

export default function Confirmation({ alertId }) {
  return (
    <div className="text-center space-y-4 mt-8">
      <div className="text-5xl">✅</div>
      <h2 className="text-xl font-bold text-green-700">Hospital Notified</h2>
      <p className="text-gray-500 text-sm">Doctor being contacted...</p>
      {/* TODO: live doctorAck status */}
    </div>
  );
}
