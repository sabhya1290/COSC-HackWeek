// src/pages/Dashboard.jsx
import { useState } from 'react';
import { Wallet, TrendingUp, PiggyBank, Receipt, Plus, Lightbulb, CalendarDays } from 'lucide-react';
import SummaryCard from '../components/SummaryCard';
import BudgetProgress from '../components/BudgetProgress';
import CategoryChart from '../components/CategoryChart';
import SpendingTrendChart from '../components/SpendingTrendChart';
import BarChartComp from '../components/BarChartComp';
import ExpenseForm from '../components/ExpenseForm';
import EmptyState from '../components/EmptyState';
import { getCategoryConfig } from '../utils/categories';
import {
  currentMonthKey, monthlyTotal, categoryTotals,
  last6MonthsTotals, allCategoryTotals, formatAmount, formatDate,
  monthlySnapshot,
} from '../utils/calculations';

export default function Dashboard({ expenses, budget, onAdd }) {
  const [showForm, setShowForm] = useState(false);
  const monthKey  = currentMonthKey();
  const spent     = monthlyTotal(expenses, monthKey);
  const remaining = Math.max(budget - spent, 0);
  const catData   = categoryTotals(expenses, monthKey);
  const trendData = last6MonthsTotals(expenses);
  const allCatData = allCategoryTotals(expenses);
  const recent    = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const snapshot  = monthlySnapshot(expenses, monthKey);

  const topCat = catData.length
    ? catData.reduce((a, b) => (a.value >= b.value ? a : b))
    : null;

  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  const remainTrend = pct >= 90 ? 'bad' : pct >= 70 ? 'warn' : 'good';

  // Personalized insight: top-spending category this month
  const insightCat = topCat;
  const insightPct = spent > 0 && insightCat
    ? ((insightCat.value / spent) * 100).toFixed(0)
    : 0;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard
          title="Monthly Budget"
          value={formatAmount(budget)}
          sub="Current month limit"
          icon={Wallet}
          iconBg="bg-blue-100 text-blue-600"
        />
        <SummaryCard
          title="Total Spent"
          value={formatAmount(spent)}
          sub={`${pct.toFixed(1)}% of budget used`}
          icon={TrendingUp}
          iconBg="bg-amber-100 text-amber-600"
          trend={pct >= 90 ? 'bad' : pct >= 70 ? 'warn' : 'good'}
        />
        <SummaryCard
          title="Remaining"
          value={formatAmount(remaining)}
          sub={pct >= 100 ? 'Budget exceeded!' : 'Available to spend'}
          icon={PiggyBank}
          iconBg="bg-emerald-100 text-emerald-600"
          trend={remainTrend}
        />
        <SummaryCard
          title="Transactions"
          value={expenses.length}
          sub={`${expenses.filter(e => e.date.startsWith(monthKey)).length} this month`}
          icon={Receipt}
          iconBg="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Personalized insight card */}
      {insightCat && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 flex gap-3 items-start">
          <Lightbulb size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-slate-700 space-y-1">
            <p>
              This month, you spent{' '}
              <span className="font-semibold text-slate-900">{formatAmount(insightCat.value)}</span> on{' '}
              <span className="font-semibold text-slate-900">{insightCat.name}</span>, which is{' '}
              <span className="font-semibold text-slate-900">{insightPct}%</span> of your total spending.
            </p>
            <p className="text-slate-500">
              💡 Tip: Reducing outside food spending by ₹50 per week can save around ₹200 this month.
            </p>
          </div>
        </div>
      )}

      {/* Budget progress + top category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <BudgetProgress budget={budget} spent={spent} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-3">Top Category</h3>
          {topCat ? (
            <div>
              <div className="text-2xl font-bold text-slate-900 mb-0.5">{topCat.name}</div>
              <div className="text-lg font-semibold text-emerald-600">{formatAmount(topCat.value)}</div>
              <div className="text-xs text-slate-500 mt-1">Highest spending this month</div>
              <div className="mt-3 space-y-1.5">
                {catData.slice(0, 4).map((c) => {
                  const pctOfSpent = spent > 0 ? (c.value / spent) * 100 : 0;
                  return (
                    <div key={c.name} className="flex items-center gap-2 text-xs">
                      <span className="w-24 text-slate-600 truncate">{c.name}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{ width: `${pctOfSpent}%`, background: c.color }} />
                      </div>
                      <span className="text-slate-500 w-16 text-right">{formatAmount(c.value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-sm">No expenses this month.</p>
          )}
        </div>
      </div>

      {/* Monthly Snapshot */}
      {snapshot && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays size={17} className="text-emerald-600" />
            <h3 className="font-semibold text-slate-800">Monthly Snapshot</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SnapshotStat
              label="Most Expensive Day"
              value={snapshot.mostExpensiveDay ? formatDate(snapshot.mostExpensiveDay.date) : '—'}
              sub={snapshot.mostExpensiveDay ? formatAmount(snapshot.mostExpensiveDay.amount) : ''}
            />
            <SnapshotStat
              label="Most Used Category"
              value={snapshot.mostUsedCategory || '—'}
            />
            <SnapshotStat
              label="Transactions"
              value={snapshot.transactionCount}
              sub="this month"
            />
            <SnapshotStat
              label="Daily Average"
              value={formatAmount(snapshot.dailyAverage)}
              sub="on active days"
            />
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoryChart data={catData} title="This Month by Category" />
        <SpendingTrendChart data={trendData} />
      </div>

      <BarChartComp data={allCatData} title="All-Time Category Breakdown" />

      {/* Recent expenses */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Recent Expenses</h3>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus size={15} /> Quick Add
          </button>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            title="No expenses yet"
            message="Add your first expense to see it here."
            action={{ label: '+ Add Expense', onClick: () => setShowForm(true) }}
          />
        ) : (
          <div className="divide-y divide-slate-50">
            {recent.map((e) => {
              const cat = getCategoryConfig(e.category);
              return (
                <div key={e.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cat.bg}`}>
                    <span className={`text-sm font-bold ${cat.text}`}>{e.category[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 truncate">{e.title}</div>
                    <div className={`text-xs ${cat.text}`}>{e.category} · {formatDate(e.date)}</div>
                  </div>
                  <div className="font-bold text-slate-900 flex-shrink-0">{formatAmount(e.amount)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <ExpenseForm
          onSubmit={(data) => { onAdd(data); setShowForm(false); }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function SnapshotStat({ label, value, sub }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <div className="text-xs text-slate-500 mb-1 font-medium">{label}</div>
      <div className="font-bold text-slate-900 text-sm leading-tight">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}
