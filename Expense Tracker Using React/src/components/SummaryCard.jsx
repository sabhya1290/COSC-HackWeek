// src/components/SummaryCard.jsx
export default function SummaryCard({ title, value, sub, icon: Icon, iconBg, trend }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5 truncate">{value}</p>
        {sub && <p className={`text-xs mt-0.5 font-medium ${trend === 'good' ? 'text-emerald-600' : trend === 'warn' ? 'text-amber-600' : trend === 'bad' ? 'text-red-600' : 'text-slate-500'}`}>{sub}</p>}
      </div>
    </div>
  );
}
