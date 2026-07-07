// src/components/Sidebar.jsx
// Dark sidebar with navigation links and user profile section.
import {
  LayoutDashboard, CreditCard, BarChart3, Target,
  Settings, Wallet, X, TrendingDown,
} from 'lucide-react';

const NAV = [
  { id: 'dashboard', label: 'Dashboard',  Icon: LayoutDashboard },
  { id: 'expenses',  label: 'Expenses',   Icon: CreditCard       },
  { id: 'analytics', label: 'Analytics',  Icon: BarChart3        },
  { id: 'budget',    label: 'Budget',     Icon: Target           },
  { id: 'settings',  label: 'Settings',   Icon: Settings, disabled: true },
];

export default function Sidebar({ page, setPage, mobileOpen, setMobileOpen }) {
  const handleNav = (id) => {
    setPage(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-slate-900 text-white z-40 flex flex-col
          transform transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:flex
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <TrendingDown size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">ExpenseFlow</span>
          </div>
          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV.map(({ id, label, Icon, disabled }) => {
            const active = page === id;
            return (
              <button
                key={id}
                onClick={() => !disabled && handleNav(id)}
                disabled={disabled}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  ${active
                    ? 'bg-emerald-500 text-white'
                    : disabled
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }
                `}
              >
                <Icon size={18} />
                {label}
                {disabled && (
                  <span className="ml-auto text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User profile */}
        <div className="px-5 py-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-bold">
              S
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Student User</p>
              <p className="text-xs text-slate-400 truncate">COSC Hackweek</p>
            </div>
            <Wallet size={16} className="text-slate-400 flex-shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
}
