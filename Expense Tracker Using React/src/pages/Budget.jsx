// src/pages/Budget.jsx
import { useState } from 'react';
import { Pencil, Check, X, AlertTriangle, RefreshCw } from 'lucide-react';
import BudgetProgress from '../components/BudgetProgress';
import { currentMonthKey, monthlyTotal, categoryTotals, getBudgetStatus, formatAmount } from '../utils/calculations';
import { CATEGORY_NAMES, getCategoryConfig } from '../utils/categories';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function Budget({ expenses, budget, setBudget, addToast, onResetDemo }) {
  const monthKey = currentMonthKey();
  const spent    = monthlyTotal(expenses, monthKey);

  const [editing, setEditing]         = useState(false);
  const [inputVal, setInputVal]       = useState('');
  const [catBudgets, setCatBudgets]   = useLocalStorage('expenseflow_cat_budgets', {});
  const [editCat, setEditCat]         = useState(null);
  const [catInput, setCatInput]       = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const catData = categoryTotals(expenses, monthKey);

  const saveBudget = () => {
    const v = Number(inputVal);
    if (!v || v <= 0) return;
    setBudget(v);
    setEditing(false);
    addToast({ type: 'success', message: `Monthly budget updated to ${formatAmount(v)}` });
  };

  const saveCatBudget = (cat) => {
    const v = Number(catInput);
    if (!v || v <= 0) { setEditCat(null); return; }
    setCatBudgets((prev) => ({ ...prev, [cat]: v }));
    setEditCat(null);
    addToast({ type: 'success', message: `${cat} budget set to ${formatAmount(v)}` });
  };

  const removeCatBudget = (cat) => {
    setCatBudgets((prev) => {
      const next = { ...prev };
      delete next[cat];
      return next;
    });
  };

  const handleResetDemo = () => {
    onResetDemo();
    setShowResetConfirm(false);
    addToast({ type: 'success', message: 'Demo data has been restored.' });
  };

  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  const { label, color } = getBudgetStatus(pct);

  return (
    <div className="p-4 sm:p-6 space-y-6">

      {/* Monthly budget editor */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Monthly Budget</h2>
          {!editing ? (
            <button
              onClick={() => { setInputVal(String(budget)); setEditing(true); }}
              className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              <Pencil size={14} /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing(false)} className="p-1.5 text-slate-400 hover:text-slate-600"><X size={16} /></button>
              <button onClick={saveBudget} className="p-1.5 text-emerald-600 hover:text-emerald-700"><Check size={16} /></button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl font-bold text-slate-400">₹</span>
            <input
              type="number"
              min="1"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveBudget(); if (e.key === 'Escape') setEditing(false); }}
              className="flex-1 text-2xl font-bold border-b-2 border-emerald-400 outline-none py-1 text-slate-900"
              autoFocus
            />
          </div>
        ) : (
          <div className="text-4xl font-bold text-slate-900 mb-4">{formatAmount(budget)}</div>
        )}

        <BudgetProgress budget={budget} spent={spent} />

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-xs text-slate-500 mb-1">Budget</div>
            <div className="font-bold text-slate-900">{formatAmount(budget)}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-xs text-slate-500 mb-1">Spent</div>
            <div className="font-bold text-slate-900">{formatAmount(spent)}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-xs text-slate-500 mb-1">Remaining</div>
            <div className={`font-bold ${color}`}>{formatAmount(Math.max(budget - spent, 0))}</div>
          </div>
        </div>
      </div>

      {/* Category budget limits */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Category Budget Limits</h2>
        <p className="text-sm text-slate-500 mb-4">
          Set optional limits for each category. You'll see a warning when 80% is reached.
        </p>
        <div className="space-y-3">
          {CATEGORY_NAMES.map((cat) => {
            const cfg      = getCategoryConfig(cat);
            const catSpent = catData.find((c) => c.name === cat)?.value || 0;
            const catLimit = catBudgets[cat] || 0;
            const catPct   = catLimit > 0 ? Math.min((catSpent / catLimit) * 100, 100) : 0;
            const overLimit  = catLimit > 0 && catSpent > catLimit;
            const nearLimit  = catLimit > 0 && !overLimit && catPct >= 80;

            // Bar colour
            const barColor = overLimit ? 'bg-red-500' : nearLimit ? 'bg-amber-400' : 'bg-emerald-500';

            return (
              <div key={cat} className={`border rounded-xl p-4 ${overLimit ? 'border-red-200 bg-red-50' : nearLimit ? 'border-amber-200 bg-amber-50' : 'border-slate-100'}`}>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${cfg.bg} ${cfg.text} flex-shrink-0`}>
                    {cat[0]}
                  </span>
                  <span className="font-medium text-slate-800 flex-1 min-w-0">{cat}</span>
                  <span className="text-sm text-slate-500">Spent: <span className="font-semibold text-slate-800">{formatAmount(catSpent)}</span></span>

                  {editCat === cat ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        value={catInput}
                        onChange={(e) => setCatInput(e.target.value)}
                        placeholder="Limit ₹"
                        className="w-24 border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') saveCatBudget(cat); if (e.key === 'Escape') setEditCat(null); }}
                      />
                      <button onClick={() => saveCatBudget(cat)} className="text-emerald-600 p-1"><Check size={14} /></button>
                      <button onClick={() => setEditCat(null)} className="text-slate-400 p-1"><X size={14} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditCat(cat); setCatInput(catLimit ? String(catLimit) : ''); }}
                        className="text-xs text-emerald-600 hover:underline font-medium"
                      >
                        {catLimit ? `Limit: ${formatAmount(catLimit)}` : 'No limit set'}
                      </button>
                      {catLimit > 0 && (
                        <button
                          onClick={() => removeCatBudget(cat)}
                          className="text-xs text-slate-400 hover:text-red-500"
                          title="Remove limit"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {catLimit > 0 && (
                  <>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-1">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${barColor}`}
                        style={{ width: `${catPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-slate-400">{catPct.toFixed(0)}% used</span>
                      {overLimit && (
                        <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                          <AlertTriangle size={11} /> Over by {formatAmount(catSpent - catLimit)}
                        </span>
                      )}
                      {nearLimit && (
                        <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                          <AlertTriangle size={11} /> Near limit — {formatAmount(catLimit - catSpent)} left
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset Demo Data */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Reset Demo Data</h2>
        <p className="text-sm text-slate-500 mb-4">
          Restore the original student expense examples. All your current expenses will be replaced.
        </p>
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <RefreshCw size={14} /> Reset to Demo Data
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700 font-medium mb-3">
              ⚠ This will replace all your expenses with demo data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetDemo}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                Yes, Reset Demo Data
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
