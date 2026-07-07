// src/hooks/useExpenses.js
// Central hook: owns all expense CRUD, seeding, and demo-reset.

import { useLocalStorage } from './useLocalStorage';

const SEED_KEY = 'expenseflow_seeded_v2'; // bump version so existing users see fresh student data

// Realistic college-student seed expenses across the current month
function buildSeedExpenses() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = (n) => `${y}-${m}-${String(n).padStart(2, '0')}`;

  return [
    { id: 's1',  title: 'Mess Bill',              amount: 1800, category: 'Mess & Food',    date: d(1),  note: 'Monthly mess fee paid'      },
    { id: 's2',  title: 'Metro Card Recharge',    amount: 500,  category: 'Travel',          date: d(2),  note: ''                           },
    { id: 's3',  title: 'Hostel Electricity Share',amount: 320, category: 'Hostel',          date: d(3),  note: 'Split among 4 roommates'    },
    { id: 's4',  title: 'Notes & Printouts',      amount: 180,  category: 'Academics',       date: d(4),  note: 'Exam notes printing'        },
    { id: 's5',  title: 'Canteen Lunch',          amount: 150,  category: 'Mess & Food',    date: d(5),  note: ''                           },
    { id: 's6',  title: 'College Fest Ticket',    amount: 250,  category: 'College Events',  date: d(6),  note: 'Annual cultural fest'       },
    { id: 's7',  title: 'Internet Recharge',      amount: 299,  category: 'Subscriptions',   date: d(7),  note: '1 month broadband'          },
    { id: 's8',  title: 'Course Subscription',    amount: 799,  category: 'Subscriptions',   date: d(8),  note: 'Coursera monthly plan'      },
    { id: 's9',  title: 'Auto to College',        amount: 80,   category: 'Travel',          date: d(9),  note: ''                           },
    { id: 's10', title: 'Stationery',             amount: 120,  category: 'Academics',       date: d(10), note: 'Notebooks and pens'         },
    { id: 's11', title: 'Paracetamol & Vitamins', amount: 95,   category: 'Health',          date: d(11), note: ''                           },
    { id: 's12', title: 'Hostel Room Supplies',   amount: 450,  category: 'Hostel',          date: d(12), note: 'Bedsheet and pillow cover'   },
    { id: 's13', title: 'Canteen Snacks',         amount: 90,   category: 'Mess & Food',    date: d(13), note: ''                           },
    { id: 's14', title: 'Spotify Premium',        amount: 119,  category: 'Subscriptions',   date: d(14), note: ''                           },
    { id: 's15', title: 'Sports Day Entry',       amount: 50,   category: 'College Events',  date: d(15), note: ''                           },
  ];
}

export const SEED_EXPENSES = buildSeedExpenses();

function genId() {
  return `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function useExpenses() {
  const [expenses, setExpenses] = useLocalStorage('expenseflow_expenses', []);

  // Seed demo data on first ever load (or after version bump)
  if (!localStorage.getItem(SEED_KEY)) {
    localStorage.setItem(SEED_KEY, 'true');
    // Also clear old seed key from previous version
    localStorage.removeItem('expenseflow_seeded_v1');
    setExpenses(SEED_EXPENSES);
  }

  const addExpense = (data) => {
    const expense = { ...data, id: genId(), amount: Number(data.amount) };
    setExpenses((prev) => [expense, ...prev]);
    return expense;
  };

  const editExpense = (id, data) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...data, amount: Number(data.amount) } : e))
    );
  };

  const deleteExpense = (id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  /** Wipe everything and restore factory demo data */
  const resetToDemo = () => {
    setExpenses(SEED_EXPENSES);
  };

  return { expenses, addExpense, editExpense, deleteExpense, resetToDemo };
}
