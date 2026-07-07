// src/App.jsx
// Root component: routing (useState-based), expense CRUD, toasts, budget.
import { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Analytics from './pages/Analytics';
import Budget from './pages/Budget';
import { useExpenses } from './hooks/useExpenses';
import { useLocalStorage } from './hooks/useLocalStorage';

let toastId = 0;

export default function App() {
  const [page,       setPage]       = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toasts,     setToasts]     = useState([]);
  const [budget,     setBudget]     = useLocalStorage('expenseflow_budget', 10000);

  const { expenses, addExpense, editExpense, deleteExpense, resetToDemo } = useExpenses();

  const addToast = useCallback(({ type, message }) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleAdd = (data) => {
    addExpense(data);
    addToast({ type: 'success', message: `"${data.title}" added successfully.` });
  };

  const handleEdit = (id, data) => {
    editExpense(id, data);
    addToast({ type: 'info', message: `"${data.title}" updated.` });
  };

  const handleDelete = (id) => {
    const exp = expenses.find((e) => e.id === id);
    deleteExpense(id);
    addToast({ type: 'error', message: `"${exp?.title}" deleted.` });
  };

  const handleResetDemo = () => {
    resetToDemo();
    setBudget(10000);
  };

  const pages = {
    dashboard: <Dashboard expenses={expenses} budget={budget} onAdd={handleAdd} />,
    expenses:  <Expenses  expenses={expenses} onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete} />,
    analytics: <Analytics expenses={expenses} />,
    budget:    <Budget    expenses={expenses} budget={budget} setBudget={setBudget} addToast={addToast} onResetDemo={handleResetDemo} />,
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar page={page} setPage={setPage} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header page={page} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {pages[page] || pages.dashboard}
        </main>
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
