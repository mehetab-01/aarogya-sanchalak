import StatusBadge from './StatusBadge.jsx';
import { Clock, User, Truck, Activity } from 'lucide-react';

export default function PatientCard({ patient }) {
  const { name, age, condition, bp, pulse, eta, driverId } = patient;

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[10px] p-5 shadow-card">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <User size={16} className="text-[var(--color-text-muted)]" />
          <div>
            <p className="text-[var(--font-md)] font-semibold text-[var(--color-text-primary)] leading-tight">
              {name}
            </p>
            <p className="text-[var(--font-sm)] text-[var(--color-text-muted)]">{age} years</p>
          </div>
        </div>
        <StatusBadge condition={condition} />
      </div>

      {/* Vitals */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[var(--color-bg-secondary)] rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock size={12} className="text-[var(--color-text-muted)]" />
            <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">ETA</p>
          </div>
          <p className="font-data text-[var(--font-xl)] font-normal text-[var(--color-text-primary)] leading-none">
            {eta}
          </p>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">min</p>
        </div>

        <div className="bg-[var(--color-bg-secondary)] rounded-lg p-3 text-center">
          <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1">BP</p>
          <p className="font-data text-[var(--font-lg)] font-normal text-[var(--color-text-primary)] leading-none">
            {bp}
          </p>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">mmHg</p>
        </div>

        <div className="bg-[var(--color-bg-secondary)] rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Activity size={12} className="text-[var(--color-text-muted)]" />
            <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Pulse</p>
          </div>
          <p className="font-data text-[var(--font-xl)] font-normal text-[var(--color-text-primary)] leading-none">
            {pulse}
          </p>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">bpm</p>
        </div>
      </div>

      {/* Driver ID */}
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[var(--color-border)]">
        <Truck size={12} className="text-[var(--color-text-muted)]" />
        <p className="font-data text-[var(--font-sm)] text-[var(--color-text-muted)]">{driverId}</p>
      </div>
    </div>
  );
}
