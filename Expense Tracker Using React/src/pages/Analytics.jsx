// src/pages/Analytics.jsx
import CategoryChart from '../components/CategoryChart';
import BarChartComp from '../components/BarChartComp';
import SpendingTrendChart from '../components/SpendingTrendChart';
import {
  currentMonthKey, monthlyTotal, categoryTotals,
  last6MonthsTotals, allCategoryTotals, averageExpense, formatAmount,
} from '../utils/calculations';
import { Lightbulb } from 'lucide-react';

export default function Analytics({ expenses }) {
  const monthKey  = currentMonthKey();
  const thisMonth = monthlyTotal(expenses, monthKey);

  // last month key
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const lastMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const lastMonth = monthlyTotal(expenses, lastMonthKey);

  const catThisMonth = categoryTotals(expenses, monthKey);
  const allCat       = allCategoryTotals(expenses);
  const trend        = last6MonthsTotals(expenses);
  const avg          = averageExpense(expenses);

  const topCat = catThisMonth.length
    ? catThisMonth.reduce((a, b) => (a.value >= b.value ? a : b))
    : null;

  // Generate insights
  const insights = [];
  if (topCat) insights.push(`📌 ${topCat.name} is your highest spending category this month (${formatAmount(topCat.value)}).`);
  if (lastMonth > 0) {
    if (thisMonth > lastMonth) insights.push(`📈 You spent ${formatAmount(thisMonth - lastMonth)} more this month compared to last month.`);
    else if (thisMonth < lastMonth) insights.push(`📉 Great! You spent ${formatAmount(lastMonth - thisMonth)} less this month compared to last month.`);
    else insights.push('📊 Your spending is the same as last month.');
  }
  if (avg > 0) insights.push(`💡 Your average expense amount is ${formatAmount(avg)}.`);
  if (insights.length === 0) insights.push('Add expenses to generate spending insights.');

  return (
    <div className="p-6 space-y-6">
      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Expenses',       value: expenses.length            },
          { label: 'This Month Spent',     value: formatAmount(thisMonth)    },
          { label: 'Last Month Spent',     value: formatAmount(lastMonth)    },
          { label: 'Average per Expense',  value: formatAmount(avg)          },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{m.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoryChart data={catThisMonth} title="This Month by Category" />
        <BarChartComp data={allCat} title="All-Time Category Totals" />
      </div>

      <SpendingTrendChart data={trend} title="Monthly Spending Trend (Last 6 Months)" />

      {/* Insights */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={18} className="text-amber-500" />
          <h3 className="font-semibold text-slate-800">Spending Insights</h3>
        </div>
        <ul className="space-y-2">
          {insights.map((msg, i) => (
            <li key={i} className="text-sm text-slate-700 bg-slate-50 rounded-xl px-4 py-2.5">{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
