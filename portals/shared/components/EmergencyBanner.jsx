import { AlertTriangle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EmergencyBanner({ active, patientName, eta }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="bg-[var(--color-critical)] text-white px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={16} />
              <span className="text-[var(--font-sm)] font-semibold uppercase tracking-wide">
                Incoming Patient
              </span>
              <span className="text-[var(--font-sm)] font-normal opacity-90">
                {patientName}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="opacity-80" />
              <span className="font-data text-[var(--font-sm)] font-normal">
                {eta} min
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
