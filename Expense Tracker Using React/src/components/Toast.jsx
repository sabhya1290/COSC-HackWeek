// src/components/Toast.jsx
// Toast notification stack — rendered globally in App.jsx
import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const ICONS = {
  success: <CheckCircle size={18} className="text-emerald-500" />,
  error:   <XCircle   size={18} className="text-red-500" />,
  info:    <Info      size={18} className="text-blue-500" />,
};

export default function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="pointer-events-auto bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 flex items-start gap-3 animate-[fadeInRight_0.25s_ease]">
      <span className="mt-0.5 flex-shrink-0">{ICONS[toast.type] || ICONS.info}</span>
      <p className="text-sm text-slate-700 flex-1">{toast.message}</p>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}
