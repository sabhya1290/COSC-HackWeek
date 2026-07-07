// src/components/EmptyState.jsx
import { PiggyBank } from 'lucide-react';

export default function EmptyState({ title = 'No expenses yet', message = 'Add your first expense to get started.', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
        <PiggyBank size={36} className="text-emerald-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-xs mb-5">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
