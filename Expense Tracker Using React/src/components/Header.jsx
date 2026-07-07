// src/components/Header.jsx
import { Menu, Bell } from 'lucide-react';

const PAGE_TITLES = {
  dashboard: { title: 'Dashboard',     sub: 'Welcome back! Here\'s your financial overview.' },
  expenses:  { title: 'Expenses',      sub: 'Manage and track all your transactions.'        },
  analytics: { title: 'Analytics',     sub: 'Detailed insights into your spending patterns.' },
  budget:    { title: 'Budget',        sub: 'Set and monitor your monthly budget limits.'    },
  settings:  { title: 'Settings',      sub: 'Configure your preferences.'                   },
};

export default function Header({ page, onMenuClick }) {
  const { title, sub } = PAGE_TITLES[page] || PAGE_TITLES.dashboard;
  return (
    <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-4">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-slate-500 hover:text-slate-900 p-1 rounded-md"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold text-slate-900 leading-tight">{title}</h1>
        <p className="text-sm text-slate-500 truncate">{sub}</p>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 relative">
          <Bell size={20} />
        </button>
        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center">
          S
        </div>
      </div>
    </header>
  );
}
