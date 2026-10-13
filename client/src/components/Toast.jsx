import { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';
export default function Toast({ message, onClose }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);
  return (
    <div role="status" aria-live="polite">
      {message && (
        <div className="fixed bottom-6 left-4 right-4 z-[60] flex items-center gap-3 rounded-xl bg-ink p-4 text-sm text-white shadow-xl sm:left-auto sm:w-auto">
          <CheckCircle2 size={19} />
          {message}
          <button onClick={onClose} aria-label="Dismiss notification" className="ml-4 rounded p-1">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
