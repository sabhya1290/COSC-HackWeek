// src/components/ExpenseForm.jsx
// Modal form for adding and editing expenses.
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CATEGORY_NAMES } from '../utils/categories';

const EMPTY = { title: '', amount: '', category: '', date: '', note: '' };

export default function ExpenseForm({ initial, onSubmit, onClose }) {
  const [form, setForm] = useState(initial ? { ...initial, amount: String(initial.amount) } : { ...EMPTY, date: new Date().toISOString().slice(0, 10) });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Close on Escape
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.title.trim())          errs.title    = 'Title is required.';
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Amount must be greater than 0.';
    if (!form.category)              errs.category = 'Please select a category.';
    if (!form.date)                  errs.date     = 'Date is required.';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit({ ...form, amount: Number(form.amount) });
  };

  const field = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((er) => { const n = { ...er }; delete n[key]; return n; });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-[fadeIn_0.15s_ease]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {initial ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => field('title', e.target.value)}
              placeholder="e.g. Lunch, Bus fare..."
              className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400 transition ${errors.title ? 'border-red-400' : 'border-slate-200'}`}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹) *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => field('amount', e.target.value)}
              placeholder="0.00"
              className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400 transition ${errors.amount ? 'border-red-400' : 'border-slate-200'}`}
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
            <select
              value={form.category}
              onChange={(e) => field('category', e.target.value)}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400 bg-white transition ${errors.category ? 'border-red-400' : 'border-slate-200'}`}
            >
              <option value="">Select a category</option>
              {CATEGORY_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => field('date', e.target.value)}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400 transition ${errors.date ? 'border-red-400' : 'border-slate-200'}`}
            />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Note <span className="text-slate-400">(optional)</span></label>
            <textarea
              value={form.note}
              onChange={(e) => field('note', e.target.value)}
              rows={2}
              placeholder="Add a note..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400 resize-none transition"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-200 text-slate-700 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors">
              {initial ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
