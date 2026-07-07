// src/components/BudgetProgress.jsx
import { getBudgetStatus, formatAmount } from '../utils/calculations';

export default function BudgetProgress({ budget, spent }) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const { label, color, bar } = getBudgetStatus(budget > 0 ? (spent / budget) * 100 : 0);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800">Monthly Budget Progress</h3>
        <span className="text-sm font-medium text-slate-500">{pct.toFixed(1)}% used</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-100 rounded-full h-3 mb-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex justify-between text-sm mb-2">
        <span className="text-slate-500">Spent: <span className="font-semibold text-slate-800">{formatAmount(spent)}</span></span>
        <span className="text-slate-500">Budget: <span className="font-semibold text-slate-800">{formatAmount(budget)}</span></span>
      </div>

      <div className={`text-sm font-medium ${color} mt-1`}>
        {label}
      </div>

      <div className="mt-2 text-sm text-slate-600">
        Remaining: <span className="font-bold">{formatAmount(Math.max(budget - spent, 0))}</span>
      </div>
    </div>
  );
}
