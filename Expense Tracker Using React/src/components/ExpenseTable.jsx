// src/components/ExpenseTable.jsx
// Filterable, sortable expense table.
// On small screens (<640px) rows render as stacked cards for readability.
import { useState } from 'react';
import { Pencil, Trash2, Search } from 'lucide-react';
import { getCategoryConfig, CATEGORY_NAMES } from '../utils/categories';
import { formatDate, formatAmount } from '../utils/calculations';
import EmptyState from './EmptyState';

const SORT_OPTIONS = [
  { value: 'latest',   label: 'Latest First'   },
  { value: 'oldest',   label: 'Oldest First'   },
  { value: 'highest',  label: 'Highest Amount' },
  { value: 'lowest',   label: 'Lowest Amount'  },
];

export default function ExpenseTable({ expenses, onEdit, onDelete, onAdd }) {
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('');
  const [month,    setMonth]    = useState('');
  const [sort,     setSort]     = useState('latest');

  const months = [...new Set(expenses.map((e) => e.date.slice(0, 7)))].sort((a, b) => b.localeCompare(a));

  let filtered = expenses
    .filter((e) => !search   || e.title.toLowerCase().includes(search.toLowerCase()))
    .filter((e) => !category || e.category === category)
    .filter((e) => !month    || e.date.startsWith(month));

  filtered = [...filtered].sort((a, b) => {
    if (sort === 'latest')  return b.date.localeCompare(a.date);
    if (sort === 'oldest')  return a.date.localeCompare(b.date);
    if (sort === 'highest') return b.amount - a.amount;
    if (sort === 'lowest')  return a.amount - b.amount;
    return 0;
  });

  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
      {/* Filters bar */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-36">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
        >
          <option value="">All Categories</option>
          {CATEGORY_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
        >
          <option value="">All Months</option>
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <button
          onClick={onAdd}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors ml-auto"
        >
          + Add
        </button>
      </div>

      {/* Total row */}
      {filtered.length > 0 && (
        <div className="px-4 py-2 bg-slate-50 text-sm text-slate-600 border-b border-slate-100">
          Showing <strong>{filtered.length}</strong> expense{filtered.length !== 1 && 's'} — Total:{' '}
          <strong>{formatAmount(total)}</strong>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title="No expenses found"
          message="Try adjusting your filters or add a new expense."
          action={{ label: '+ Add Expense', onClick: onAdd }}
        />
      ) : (
        <>
          {/* Desktop table (hidden on mobile) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wide">
                  <th className="px-5 py-3 text-left font-medium">Title</th>
                  <th className="px-5 py-3 text-left font-medium">Category</th>
                  <th className="px-5 py-3 text-left font-medium">Date</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const cat = getCategoryConfig(e.category);
                  return (
                    <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-800">{e.title}</div>
                        {e.note && <div className="text-xs text-slate-400 truncate max-w-[180px]">{e.note}</div>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cat.bg} ${cat.text}`}>
                          {e.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{formatDate(e.date)}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-slate-900">{formatAmount(e.amount)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => onEdit(e)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" aria-label="Edit"><Pencil size={15} /></button>
                          <button onClick={() => onDelete(e)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" aria-label="Delete"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list (shown only on small screens) */}
          <div className="sm:hidden divide-y divide-slate-100">
            {filtered.map((e) => {
              const cat = getCategoryConfig(e.category);
              return (
                <div key={e.id} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${cat.bg} ${cat.text}`}>
                    {e.category[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 text-sm truncate">{e.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{e.category} · {formatDate(e.date)}</div>
                    {e.note && <div className="text-xs text-slate-400 mt-0.5 truncate">{e.note}</div>}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="font-bold text-slate-900 text-sm">{formatAmount(e.amount)}</div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => onEdit(e)} className="p-1 text-slate-400 hover:text-emerald-600 rounded" aria-label="Edit"><Pencil size={13} /></button>
                      <button onClick={() => onDelete(e)} className="p-1 text-slate-400 hover:text-red-600 rounded" aria-label="Delete"><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
