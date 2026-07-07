/* ═══════════════════════════════════════════════════════════
   Expense Tracker — script.js
   Pure vanilla JS, LocalStorage, Chart.js v4
═══════════════════════════════════════════════════════════ */

/* ── Category Config ─────────────────────────────────────── */
const CATEGORIES = [
  { name: 'Mess & Food',    color: '#f97316', bg: '#fff7ed', text: '#ea580c' },
  { name: 'Travel',         color: '#3b82f6', bg: '#eff6ff', text: '#2563eb' },
  { name: 'Hostel',         color: '#8b5cf6', bg: '#f5f3ff', text: '#7c3aed' },
  { name: 'Academics',      color: '#06b6d4', bg: '#ecfeff', text: '#0891b2' },
  { name: 'Subscriptions',  color: '#ec4899', bg: '#fdf2f8', text: '#db2777' },
  { name: 'College Events', color: '#f59e0b', bg: '#fffbeb', text: '#d97706' },
  { name: 'Shopping',       color: '#a855f7', bg: '#faf5ff', text: '#9333ea' },
  { name: 'Health',         color: '#10b981', bg: '#ecfdf5', text: '#059669' },
  { name: 'Other',          color: '#6b7280', bg: '#f9fafb', text: '#4b5563' },
];
const CAT_NAMES = CATEGORIES.map(c => c.name);
function getCat(name) { return CATEGORIES.find(c => c.name === name) || CATEGORIES[CATEGORIES.length - 1]; }

/* ── Demo Seed Data ──────────────────────────────────────── */
const PAST_TREND = [3800, 5200, 4600, 6100, 5500]; // realistic past-month amounts

function buildSeedExpenses() {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = n => `${y}-${m}-${String(n).padStart(2, '0')}`;
  return [
    { id: 's1',  title: 'Mess Bill',               amount: 1800, category: 'Mess & Food',    date: d(1),  note: 'Monthly mess fee paid' },
    { id: 's2',  title: 'Metro Card Recharge',      amount: 500,  category: 'Travel',          date: d(2),  note: '' },
    { id: 's3',  title: 'Hostel Electricity Share', amount: 320,  category: 'Hostel',          date: d(3),  note: 'Split among 4 roommates' },
    { id: 's4',  title: 'Notes & Printouts',        amount: 180,  category: 'Academics',       date: d(4),  note: 'Exam prep materials' },
    { id: 's5',  title: 'Canteen Lunch',            amount: 150,  category: 'Mess & Food',    date: d(5),  note: '' },
    { id: 's6',  title: 'College Fest Ticket',      amount: 250,  category: 'College Events',  date: d(6),  note: 'Annual cultural fest' },
    { id: 's7',  title: 'Internet Recharge',        amount: 299,  category: 'Subscriptions',   date: d(7),  note: '1 month broadband plan' },
    { id: 's8',  title: 'Course Subscription',      amount: 799,  category: 'Subscriptions',   date: d(8),  note: 'Coursera monthly' },
    { id: 's9',  title: 'Auto to College',          amount: 80,   category: 'Travel',          date: d(9),  note: '' },
    { id: 's10', title: 'Stationery',               amount: 120,  category: 'Academics',       date: d(10), note: 'Notebooks and pens' },
    { id: 's11', title: 'Paracetamol & Vitamins',   amount: 95,   category: 'Health',          date: d(11), note: '' },
    { id: 's12', title: 'Hostel Room Supplies',     amount: 450,  category: 'Hostel',          date: d(12), note: 'Bedsheet and pillow cover' },
    { id: 's13', title: 'Canteen Snacks',           amount: 90,   category: 'Mess & Food',    date: d(13), note: '' },
    { id: 's14', title: 'Spotify Premium',          amount: 119,  category: 'Subscriptions',   date: d(14), note: '' },
    { id: 's15', title: 'Sports Day Entry',         amount: 50,   category: 'College Events',  date: d(15), note: '' },
  ];
}

/* ── State ───────────────────────────────────────────────── */
const LS = {
  EXPENSES:   'kharcha_expenses',
  BUDGET:     'kharcha_budget',
  CAT_BUD:    'kharcha_cat_budgets',
  SEEDED:     'kharcha_seeded_v1',
};

let state = { expenses: [], budget: 10000, catBudgets: {} };
let charts = {};
let deleteTarget = null;
let editingCatLimit = null;
let currentPage = 'dashboard';

/* ── LocalStorage Helpers ────────────────────────────────── */
function loadState() {
  state.expenses   = JSON.parse(localStorage.getItem(LS.EXPENSES)  || '[]');
  state.budget     = JSON.parse(localStorage.getItem(LS.BUDGET)    || '10000');
  state.catBudgets = JSON.parse(localStorage.getItem(LS.CAT_BUD)   || '{}');

  if (!localStorage.getItem(LS.SEEDED)) {
    localStorage.setItem(LS.SEEDED, 'true');
    state.expenses = buildSeedExpenses();
    saveExpenses();
  }
}
function saveExpenses()   { localStorage.setItem(LS.EXPENSES,  JSON.stringify(state.expenses)); }
function saveBudget()     { localStorage.setItem(LS.BUDGET,    JSON.stringify(state.budget)); }
function saveCatBudgets() { localStorage.setItem(LS.CAT_BUD,   JSON.stringify(state.catBudgets)); }

/* ── Utilities ───────────────────────────────────────────── */
function fmt(n) {
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
function fmtDate(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function thisMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function toMK(dateStr) { return dateStr.slice(0, 7); }
function genId() { return `e_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }
function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* ── Calculations ────────────────────────────────────────── */
function monthlyTotal(expenses, mk) {
  return expenses.filter(e => toMK(e.date) === mk).reduce((s, e) => s + Number(e.amount), 0);
}
function catTotals(expenses, mk) {
  const map = {};
  expenses.filter(e => toMK(e.date) === mk).forEach(e => {
    map[e.category] = (map[e.category] || 0) + Number(e.amount);
  });
  return CATEGORIES.map(c => ({ name: c.name, value: map[c.name] || 0, color: c.color })).filter(c => c.value > 0);
}
function allCatTotals(expenses) {
  const map = {};
  expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + Number(e.amount); });
  return CATEGORIES.map(c => ({ name: c.name, value: map[c.name] || 0, color: c.color }));
}
function last6Months(expenses) {
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    const real  = monthlyTotal(expenses, key);
    const amount = real > 0 ? real : (i > 0 ? PAST_TREND[5 - i] : 0);
    result.push({ month: label, amount });
  }
  return result;
}
function monthSnapshot(expenses, mk) {
  const mExp = expenses.filter(e => toMK(e.date) === mk);
  if (!mExp.length) return null;
  const dayMap = {}, catCount = {};
  mExp.forEach(e => {
    dayMap[e.date]    = (dayMap[e.date]    || 0) + Number(e.amount);
    catCount[e.category] = (catCount[e.category] || 0) + 1;
  });
  const topDay = Object.entries(dayMap).sort((a,b) => b[1]-a[1])[0];
  const topCat = Object.entries(catCount).sort((a,b) => b[1]-a[1])[0];
  const total  = monthlyTotal(expenses, mk);
  const days   = Object.keys(dayMap).length;
  return {
    topDay: topDay ? { date: topDay[0], amount: topDay[1] } : null,
    topCat: topCat ? topCat[0] : null,
    count: mExp.length,
    dailyAvg: days ? total / days : 0,
  };
}
function getBudgetStatus(pct) {
  if (pct >= 100) return { label: 'Budget exceeded!',             bar: '#ef4444', text: '#ef4444' };
  if (pct >= 90)  return { label: 'Warning: Budget almost full.', bar: '#ef4444', text: '#ef4444' };
  if (pct >= 70)  return { label: 'You are close to your limit.', bar: '#f59e0b', text: '#d97706' };
  return { label: 'You are managing your budget well!',           bar: '#10b981', text: '#059669' };
}

/* ── Chart Helpers ───────────────────────────────────────── */
function mkChart(id, cfg) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
  const el = document.getElementById(id);
  if (!el) return;
  charts[id] = new Chart(el.getContext('2d'), cfg);
}

const TOOLTIP_STYLE = {
  callbacks: { label: ctx => ` ${fmt(ctx.raw)}` },
  backgroundColor: '#1e293b', titleColor: '#f1f5f9',
  bodyColor: '#94a3b8', cornerRadius: 8, padding: 10,
};

function drawPie(id, catData) {
  if (!catData.length) {
    mkChart(id, { type: 'doughnut', data: { labels: ['No data'], datasets: [{ data: [1], backgroundColor: ['#e2e8f0'] }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } } });
    return;
  }
  mkChart(id, {
    type: 'doughnut',
    data: {
      labels: catData.map(c => c.name),
      datasets: [{ data: catData.map(c => c.value), backgroundColor: catData.map(c => c.color), borderWidth: 2, borderColor: '#fff', hoverOffset: 6 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '62%',
      plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12, boxWidth: 10, color: '#64748b' } }, tooltip: TOOLTIP_STYLE },
    },
  });
}

function drawLine(id, trendData) {
  mkChart(id, {
    type: 'line',
    data: {
      labels: trendData.map(t => t.month),
      datasets: [{
        label: 'Spent', data: trendData.map(t => t.amount),
        borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,.1)',
        borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: '#10b981',
        tension: 0.35, fill: true,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: TOOLTIP_STYLE },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
        y: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { size: 11 }, callback: v => '₹' + v.toLocaleString('en-IN') } },
      },
    },
  });
}

function drawBar(id, allCat) {
  const nonZero = allCat.filter(c => c.value > 0);
  if (!nonZero.length) { mkChart(id, { type: 'bar', data: { labels: [], datasets: [{ data: [] }] }, options: { responsive: true, maintainAspectRatio: false } }); return; }
  mkChart(id, {
    type: 'bar',
    data: {
      labels: nonZero.map(c => c.name),
      datasets: [{ label: 'Total Spent', data: nonZero.map(c => c.value), backgroundColor: nonZero.map(c => c.color), borderRadius: 6, maxBarThickness: 40 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: TOOLTIP_STYLE },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
        y: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { size: 11 }, callback: v => '₹' + v.toLocaleString('en-IN') } },
      },
    },
  });
}

/* ── Navigation ──────────────────────────────────────────── */
const PAGE_META = {
  dashboard: { title: 'Dashboard',  sub: "Welcome back! Here's your campus spending overview."    },
  expenses:  { title: 'Expenses',   sub: 'Manage and track all your transactions.'                },
  analytics: { title: 'Analytics',  sub: 'Detailed insights into your spending patterns.'         },
  budget:    { title: 'Budget',     sub: 'Set and monitor your monthly and category budgets.'     },
};

function navigate(page) {
  currentPage = page;
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  // Show section
  document.querySelectorAll('.pg').forEach(s => s.classList.remove('active'));
  document.getElementById('pg-' + page).classList.add('active');
  // Update header
  const meta = PAGE_META[page] || PAGE_META.dashboard;
  document.getElementById('pg-title').textContent = meta.title;
  document.getElementById('pg-sub').textContent = meta.sub;
  // Render the section
  if (page === 'dashboard') renderDashboard();
  if (page === 'expenses')  renderExpenses();
  if (page === 'analytics') renderAnalytics();
  if (page === 'budget')    renderBudget();
  closeSidebar();
}

function toggleSidebar() { document.body.classList.toggle('sb-open'); }
function closeSidebar()  { document.body.classList.remove('sb-open'); }

/* ── Dashboard Render ────────────────────────────────────── */
function renderDashboard() {
  const mk      = thisMonth();
  const spent   = monthlyTotal(state.expenses, mk);
  const budget  = state.budget;
  const remain  = Math.max(budget - spent, 0);
  const pct     = budget > 0 ? (spent / budget) * 100 : 0;
  const catData = catTotals(state.expenses, mk);
  const topCat  = catData.length ? catData.reduce((a,b) => a.value >= b.value ? a : b) : null;
  const snap    = monthSnapshot(state.expenses, mk);
  const trend   = last6Months(state.expenses);
  const allCat  = allCatTotals(state.expenses);
  const thisMonthCount = state.expenses.filter(e => toMK(e.date) === mk).length;

  // Summary cards
  const cardsEl = document.getElementById('dash-cards');
  const pctTrend = pct >= 90 ? 'bad' : pct >= 70 ? 'warn' : 'good';
  const remainTrend = pct >= 90 ? 'bad' : pct >= 70 ? 'warn' : 'good';
  cardsEl.innerHTML = buildSumCards([
    { ico: '💰', label: 'Monthly Budget',  value: fmt(budget),              sub: 'Current month limit',                              trend: '',          iconColor: '#3b82f6', iconBg: '#eff6ff' },
    { ico: '📊', label: 'Total Spent',     value: fmt(spent),               sub: `${pct.toFixed(1)}% of budget used`,                trend: pctTrend,    iconColor: '#f59e0b', iconBg: '#fffbeb' },
    { ico: '🐷', label: 'Remaining',       value: fmt(remain),              sub: pct >= 100 ? 'Budget exceeded!' : 'Available',      trend: remainTrend, iconColor: '#10b981', iconBg: '#ecfdf5' },
    { ico: '🧾', label: 'Transactions',    value: state.expenses.length,    sub: `${thisMonthCount} this month`,                     trend: '',          iconColor: '#a855f7', iconBg: '#faf5ff' },
  ]);

  // Insight banner
  const insightEl = document.getElementById('dash-insight');
  if (topCat && spent > 0) {
    const insightPct = ((topCat.value / spent) * 100).toFixed(0);
    insightEl.className = 'insight-banner';
    insightEl.innerHTML = `
      <span class="ins-ico">💡</span>
      <div>
        <p>This month, you spent <strong>${fmt(topCat.value)}</strong> on <strong>${escHtml(topCat.name)}</strong>, which is <strong>${insightPct}%</strong> of your total spending.</p>
        <p class="tip">Tip: Reducing outside food spending by ₹50 per week can save around ₹200 this month.</p>
      </div>`;
    insightEl.style.display = '';
  } else {
    insightEl.style.display = 'none';
  }

  // Budget progress
  const status = getBudgetStatus(pct);
  document.getElementById('dash-budget-prog').innerHTML = `
    <h3 class="ctitle">Monthly Budget Progress</h3>
    <div class="progress-wrap">
      <div class="progress-label"><span>Spent: <strong>${fmt(spent)}</strong></span><span>${pct.toFixed(1)}% used</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(pct,100)}%;background:${status.bar}"></div></div>
    </div>
    <div class="progress-status" style="color:${status.text}">${status.label}</div>
    <div class="bud-nums">
      <div class="bud-stat"><div class="bud-stat-lbl">Budget</div><div class="bud-stat-val">${fmt(budget)}</div></div>
      <div class="bud-stat"><div class="bud-stat-lbl">Spent</div><div class="bud-stat-val">${fmt(spent)}</div></div>
      <div class="bud-stat"><div class="bud-stat-lbl">Remaining</div><div class="bud-stat-val" style="color:${status.text}">${fmt(remain)}</div></div>
    </div>`;

  // Top category
  const topCatEl = document.getElementById('dash-top-cat');
  if (topCat) {
    const miniRows = catData.slice(0, 4).map(c => {
      const p = spent > 0 ? ((c.value / spent) * 100).toFixed(0) : 0;
      return `<div class="mini-bar-row">
        <span class="mini-bar-lbl">${escHtml(c.name)}</span>
        <div class="mini-bar-bg"><div class="mini-bar-fill" style="width:${p}%;background:${c.color}"></div></div>
        <span class="mini-bar-amt">${fmt(c.value)}</span>
      </div>`;
    }).join('');
    topCatEl.innerHTML = `
      <h3 class="ctitle">Top Category</h3>
      <div class="top-cat-name">${escHtml(topCat.name)}</div>
      <div class="top-cat-amt">${fmt(topCat.value)}</div>
      <div class="top-cat-sub">Highest spending this month</div>
      <div style="margin-top:14px">${miniRows}</div>`;
  } else {
    topCatEl.innerHTML = `<h3 class="ctitle">Top Category</h3><p style="color:var(--muted);font-size:13px;margin-top:8px">No expenses this month yet.</p>`;
  }

  // Monthly Snapshot
  const snapEl = document.getElementById('dash-snapshot');
  if (snap) {
    snapEl.innerHTML = `
      <h3 class="ctitle">📅 Monthly Snapshot</h3>
      <div class="snapshot-grid">
        <div class="snap-cell">
          <div class="snap-lbl">Most Expensive Day</div>
          <div class="snap-val">${snap.topDay ? fmtDate(snap.topDay.date) : '—'}</div>
          ${snap.topDay ? `<div class="snap-sub">${fmt(snap.topDay.amount)}</div>` : ''}
        </div>
        <div class="snap-cell">
          <div class="snap-lbl">Most Used Category</div>
          <div class="snap-val">${snap.topCat ? escHtml(snap.topCat) : '—'}</div>
        </div>
        <div class="snap-cell">
          <div class="snap-lbl">Transactions</div>
          <div class="snap-val">${snap.count}</div>
          <div class="snap-sub">this month</div>
        </div>
        <div class="snap-cell">
          <div class="snap-lbl">Daily Average</div>
          <div class="snap-val">${fmt(snap.dailyAvg)}</div>
          <div class="snap-sub">on active days</div>
        </div>
      </div>`;
    snapEl.style.display = '';
  } else {
    snapEl.style.display = 'none';
  }

  // Charts
  drawPie('ch-pie-d', catData);
  drawLine('ch-line-d', trend);
  drawBar('ch-bar-d', allCat);

  // Recent expenses
  const recent = [...state.expenses].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 5);
  const recentEl = document.getElementById('dash-recent');
  if (recent.length === 0) {
    recentEl.innerHTML = `<div class="empty-state"><div class="empty-ico">📭</div><strong>No expenses yet</strong><p>Add your first expense to see it here.</p><button class="btn primary" onclick="openAddModal()">+ Add Expense</button></div>`;
  } else {
    recentEl.innerHTML = recent.map(e => {
      const cat = getCat(e.category);
      return `<div class="recent-item">
        <div class="recent-ico" style="background:${cat.bg};color:${cat.text}">${e.category[0]}</div>
        <div class="recent-info">
          <div class="recent-title">${escHtml(e.title)}</div>
          <div class="recent-meta" style="color:${cat.text}">${escHtml(e.category)} · ${fmtDate(e.date)}</div>
        </div>
        <div class="recent-amt">${fmt(e.amount)}</div>
      </div>`;
    }).join('');
  }
}

function buildSumCards(items) {
  return items.map(({ ico, label, value, sub, trend, iconColor, iconBg }) => {
    const tc = { bad: 'trend-bad', warn: 'trend-warn', good: 'trend-good' }[trend] || 'trend-muted';
    return `<div class="sum-card">
      <div class="sum-icon" style="background:${iconBg};color:${iconColor};font-size:20px;border-radius:10px">${ico}</div>
      <div style="min-width:0">
        <div class="sum-label">${label}</div>
        <div class="sum-value">${value}</div>
        <div class="sum-sub ${tc}">${sub}</div>
      </div>
    </div>`;
  }).join('');
}

/* ── Expenses Page Render ─────────────────────────────────── */
function renderExpenses() {
  populateMonthFilter();
  const filtered = getFiltered();
  const total    = filtered.reduce((s, e) => s + Number(e.amount), 0);

  const strip = document.getElementById('exp-strip');
  if (filtered.length > 0) {
    strip.style.display = '';
    strip.innerHTML = `Showing <strong>${filtered.length}</strong> expense${filtered.length !== 1 ? 's' : ''} — Total: <strong>${fmt(total)}</strong>`;
  } else {
    strip.style.display = 'none';
  }

  const empty = document.getElementById('exp-empty');
  const table = document.getElementById('exp-table-wrap');
  const mcards = document.getElementById('exp-mcards');

  if (filtered.length === 0) {
    empty.style.display = '';
    table.style.display = 'none';
    mcards.innerHTML = '';
    return;
  }
  empty.style.display = 'none';
  table.style.display = '';

  // Desktop table rows
  document.getElementById('exp-tbody').innerHTML = filtered.map(e => {
    const cat = getCat(e.category);
    return `<tr>
      <td>
        <div class="td-title">${escHtml(e.title)}</div>
        ${e.note ? `<div class="td-note">${escHtml(e.note)}</div>` : ''}
      </td>
      <td><span class="badge" style="background:${cat.bg};color:${cat.text}">${escHtml(e.category)}</span></td>
      <td style="color:var(--muted);white-space:nowrap">${fmtDate(e.date)}</td>
      <td class="r td-amt">${fmt(e.amount)}</td>
      <td class="r">
        <div class="act-btns">
          <button class="act-btn edit" onclick="openEditModal('${e.id}')" title="Edit">✏️</button>
          <button class="act-btn del"  onclick="openDeleteModal('${e.id}')" title="Delete">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  // Mobile cards
  mcards.innerHTML = filtered.map(e => {
    const cat = getCat(e.category);
    return `<div class="mcard">
      <div class="recent-ico" style="background:${cat.bg};color:${cat.text};width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0">${e.category[0]}</div>
      <div class="mcard-info">
        <div class="mcard-title">${escHtml(e.title)}</div>
        <div class="mcard-meta">${escHtml(e.category)} · ${fmtDate(e.date)}</div>
        ${e.note ? `<div class="mcard-meta">${escHtml(e.note)}</div>` : ''}
      </div>
      <div class="mcard-right">
        <div class="mcard-amt">${fmt(e.amount)}</div>
        <div style="display:flex;gap:4px">
          <button class="act-btn edit" onclick="openEditModal('${e.id}')" title="Edit">✏️</button>
          <button class="act-btn del"  onclick="openDeleteModal('${e.id}')" title="Delete">🗑️</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function getFiltered() {
  const search = (document.getElementById('si-search')?.value || '').toLowerCase();
  const cat    = document.getElementById('si-cat')?.value   || '';
  const month  = document.getElementById('si-month')?.value || '';
  const sort   = document.getElementById('si-sort')?.value  || 'latest';

  let filtered = state.expenses.filter(e => {
    if (search && !e.title.toLowerCase().includes(search) && !e.note.toLowerCase().includes(search)) return false;
    if (cat   && e.category !== cat)          return false;
    if (month && !e.date.startsWith(month))  return false;
    return true;
  });

  filtered.sort((a, b) => {
    if (sort === 'latest')  return b.date.localeCompare(a.date);
    if (sort === 'oldest')  return a.date.localeCompare(b.date);
    if (sort === 'highest') return b.amount - a.amount;
    if (sort === 'lowest')  return a.amount - b.amount;
    return 0;
  });
  return filtered;
}

function populateMonthFilter() {
  const months = [...new Set(state.expenses.map(e => toMK(e.date)))].sort((a, b) => b.localeCompare(a));
  const sel = document.getElementById('si-month');
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">All Months</option>' + months.map(m => `<option value="${m}"${cur===m?' selected':''}>${m}</option>`).join('');
}

/* ── Analytics Render ────────────────────────────────────── */
function renderAnalytics() {
  const mk = thisMonth();
  const d  = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1);
  const lastMK = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  const thisMonthSpent = monthlyTotal(state.expenses, mk);
  const lastMonthSpent = monthlyTotal(state.expenses, lastMK);
  const avg = state.expenses.length ? state.expenses.reduce((s,e) => s + Number(e.amount), 0) / state.expenses.length : 0;
  const catData = catTotals(state.expenses, mk);
  const allCat  = allCatTotals(state.expenses);
  const trend   = last6Months(state.expenses);

  // Stats
  document.getElementById('an-cards').innerHTML = [
    { label: 'Total Expenses',     value: state.expenses.length         },
    { label: 'This Month Spent',   value: fmt(thisMonthSpent)           },
    { label: 'Last Month Spent',   value: fmt(lastMonthSpent)           },
    { label: 'Avg per Expense',    value: fmt(avg)                      },
  ].map(s => `<div class="an-stat"><div class="an-stat-lbl">${s.label}</div><div class="an-stat-val">${s.value}</div></div>`).join('');

  drawPie('ch-pie-a', catData);
  drawBar('ch-bar-a', allCat);
  drawLine('ch-line-a', trend);

  // Insights
  const ins = [];
  const topCat = catData.length ? catData.reduce((a,b) => a.value >= b.value ? a : b) : null;
  if (topCat) ins.push(`📌 <strong>${escHtml(topCat.name)}</strong> is your highest spending category this month (${fmt(topCat.value)}).`);
  if (lastMonthSpent > 0) {
    if (thisMonthSpent > lastMonthSpent) ins.push(`📈 You spent <strong>${fmt(thisMonthSpent - lastMonthSpent)}</strong> more this month compared to last month.`);
    else if (thisMonthSpent < lastMonthSpent) ins.push(`📉 You spent <strong>${fmt(lastMonthSpent - thisMonthSpent)}</strong> less this month. Great going!`);
    else ins.push('📊 Your spending is the same as last month.');
  }
  if (avg > 0) ins.push(`💡 Your average expense is <strong>${fmt(avg)}</strong>. Tracking each purchase helps stay on budget.`);
  if (ins.length === 0) ins.push('Add expenses to generate personalised spending insights.');
  document.getElementById('insights-list').innerHTML = ins.map(i => `<div class="insight-item">${i}</div>`).join('');
}

/* ── Budget Page Render ──────────────────────────────────── */
function renderBudget() {
  renderBudgetEditor();
  renderCatLimits();
}

function renderBudgetEditor() {
  const mk    = thisMonth();
  const spent = monthlyTotal(state.expenses, mk);
  const pct   = state.budget > 0 ? (spent / state.budget) * 100 : 0;
  const status = getBudgetStatus(pct);
  const remain = Math.max(state.budget - spent, 0);

  document.getElementById('bud-card').innerHTML = `
    <div class="bud-edit-row">
      <h3 class="ctitle mb0">Monthly Budget</h3>
      <button class="btn sm secondary" onclick="toggleBudgetEdit()" id="bud-edit-btn">✏️ Edit</button>
    </div>
    <div id="bud-display">
      <div class="bud-big">${fmt(state.budget)}</div>
    </div>
    <div id="bud-form" style="display:none">
      <div class="bud-input-row">
        <span class="bud-symbol">₹</span>
        <input type="number" class="bud-input" id="bud-input" min="1" value="${state.budget}"
          onkeydown="if(event.key==='Enter')saveBudgetEdit();if(event.key==='Escape')cancelBudgetEdit()">
      </div>
      <div class="btn-row" style="max-width:220px">
        <button class="btn sm secondary" onclick="cancelBudgetEdit()">Cancel</button>
        <button class="btn sm primary"   onclick="saveBudgetEdit()">Save</button>
      </div>
    </div>
    <div class="progress-wrap">
      <div class="progress-label"><span>Spent: <strong>${fmt(spent)}</strong></span><span>${pct.toFixed(1)}% used</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(pct,100)}%;background:${status.bar}"></div></div>
    </div>
    <div class="progress-status" style="color:${status.text}">${status.label}</div>
    <div class="bud-nums" style="margin-top:12px">
      <div class="bud-stat"><div class="bud-stat-lbl">Budget</div><div class="bud-stat-val">${fmt(state.budget)}</div></div>
      <div class="bud-stat"><div class="bud-stat-lbl">Spent</div><div class="bud-stat-val">${fmt(spent)}</div></div>
      <div class="bud-stat"><div class="bud-stat-lbl">Remaining</div><div class="bud-stat-val" style="color:${status.text}">${fmt(remain)}</div></div>
    </div>`;
}

function toggleBudgetEdit() {
  const disp = document.getElementById('bud-display');
  const form = document.getElementById('bud-form');
  const btn  = document.getElementById('bud-edit-btn');
  if (form.style.display === 'none') {
    disp.style.display = 'none';
    form.style.display = '';
    btn.textContent = '';
    document.getElementById('bud-input').focus();
  } else {
    cancelBudgetEdit();
  }
}
function cancelBudgetEdit() {
  document.getElementById('bud-display').style.display = '';
  document.getElementById('bud-form').style.display = 'none';
  document.getElementById('bud-edit-btn').textContent = '✏️ Edit';
}
function saveBudgetEdit() {
  const v = Number(document.getElementById('bud-input').value);
  if (!v || v <= 0) { showToast('Enter a valid budget amount.', 'error'); return; }
  state.budget = v;
  saveBudget();
  showToast(`Monthly budget updated to ${fmt(v)}`, 'success');
  renderBudget();
}

function renderCatLimits() {
  const mk   = thisMonth();
  const catData = catTotals(state.expenses, mk);

  document.getElementById('cat-limits').innerHTML = CAT_NAMES.map(cat => {
    const cfg    = getCat(cat);
    const spent  = catData.find(c => c.name === cat)?.value || 0;
    const limit  = state.catBudgets[cat] || 0;
    const pct    = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
    const over   = limit > 0 && spent > limit;
    const near   = limit > 0 && !over && pct >= 80;
    const barClr = over ? '#ef4444' : near ? '#f59e0b' : '#10b981';
    const rowCls = over ? 'cat-row over' : near ? 'cat-row near' : 'cat-row';

    let limitSection = '';
    if (editingCatLimit === cat) {
      limitSection = `
        <div class="cat-input-row">
          <input type="number" id="cat-lim-input" min="1" placeholder="Limit ₹" value="${limit || ''}"
            onkeydown="if(event.key==='Enter')saveCatLimit('${cat}');if(event.key==='Escape')cancelCatLimit()"
            style="width:100px;padding:5px 8px;font-size:13px">
          <button class="btn sm primary"   onclick="saveCatLimit('${escHtml(cat)}')">✓</button>
          <button class="btn sm secondary" onclick="cancelCatLimit()">✕</button>
        </div>`;
    } else {
      limitSection = `
        <button class="cat-limit-btn" onclick="startCatLimit('${escHtml(cat)}')">
          ${limit ? `Limit: ${fmt(limit)}` : 'No limit set — click to add'}
        </button>
        ${limit ? `<span class="remove-lim" onclick="removeCatLimit('${escHtml(cat)}')" title="Remove limit">✕</span>` : ''}`;
    }

    let progSection = '';
    if (limit > 0) {
      progSection = `
        <div class="cat-prog">
          <div class="cat-prog-bar"><div class="cat-prog-fill" style="width:${pct}%;background:${barClr}"></div></div>
          <div class="cat-prog-info">
            <span>${pct.toFixed(0)}% used</span>
            ${over ? `<span class="cat-over">⚠ Over by ${fmt(spent - limit)}</span>` : ''}
            ${near ? `<span class="cat-warn">⚠ Near limit — ${fmt(limit - spent)} left</span>` : ''}
          </div>
        </div>`;
    }

    return `<div class="${rowCls}">
      <div class="cat-row-top">
        <div class="cat-dot" style="background:${cfg.color}"></div>
        <span class="cat-row-name">${escHtml(cat)}</span>
        <span class="cat-spent">Spent: <strong>${fmt(spent)}</strong></span>
        <div style="display:flex;align-items:center;gap:4px">${limitSection}</div>
      </div>
      ${progSection}
    </div>`;
  }).join('');
}

function startCatLimit(cat) { editingCatLimit = cat; renderCatLimits(); setTimeout(() => document.getElementById('cat-lim-input')?.focus(), 50); }
function cancelCatLimit()   { editingCatLimit = null; renderCatLimits(); }
function saveCatLimit(cat) {
  const v = Number(document.getElementById('cat-lim-input')?.value);
  if (!v || v <= 0) { cancelCatLimit(); return; }
  state.catBudgets[cat] = v;
  saveCatBudgets();
  editingCatLimit = null;
  showToast(`${cat} budget set to ${fmt(v)}`, 'success');
  renderCatLimits();
}
function removeCatLimit(cat) {
  delete state.catBudgets[cat];
  saveCatBudgets();
  renderCatLimits();
}

function toggleResetConfirm() {
  const c = document.getElementById('reset-confirm');
  c.style.display = c.style.display === 'none' ? '' : 'none';
}
function doResetDemo() {
  state.expenses = buildSeedExpenses();
  state.budget   = 10000;
  saveExpenses();
  saveBudget();
  toggleResetConfirm();
  showToast('Demo data restored successfully!', 'success');
  navigate('dashboard');
}

/* ── Modals ──────────────────────────────────────────────── */
function openAddModal() {
  document.getElementById('modal-ttl').textContent = 'Add Expense';
  document.getElementById('form-btn').textContent  = 'Add Expense';
  document.getElementById('f-id').value    = '';
  document.getElementById('f-title').value = '';
  document.getElementById('f-amount').value= '';
  document.getElementById('f-cat').value   = '';
  document.getElementById('f-date').value  = new Date().toISOString().slice(0, 10);
  document.getElementById('f-note').value  = '';
  clearErrors();
  openModal('modal-add');
  setTimeout(() => document.getElementById('f-title').focus(), 100);
}

function openEditModal(id) {
  const e = state.expenses.find(x => x.id === id);
  if (!e) return;
  document.getElementById('modal-ttl').textContent = 'Edit Expense';
  document.getElementById('form-btn').textContent  = 'Save Changes';
  document.getElementById('f-id').value    = e.id;
  document.getElementById('f-title').value = e.title;
  document.getElementById('f-amount').value= e.amount;
  document.getElementById('f-cat').value   = e.category;
  document.getElementById('f-date').value  = e.date;
  document.getElementById('f-note').value  = e.note || '';
  clearErrors();
  openModal('modal-add');
  setTimeout(() => document.getElementById('f-title').focus(), 100);
}

function openDeleteModal(id) {
  const e = state.expenses.find(x => x.id === id);
  if (!e) return;
  deleteTarget = id;
  document.getElementById('del-preview').innerHTML = `<strong>${escHtml(e.title)}</strong> — ${fmt(e.amount)}`;
  openModal('modal-del');
}

function confirmDelete() {
  if (!deleteTarget) return;
  const e = state.expenses.find(x => x.id === deleteTarget);
  state.expenses = state.expenses.filter(x => x.id !== deleteTarget);
  saveExpenses();
  deleteTarget = null;
  closeModal('modal-del');
  showToast(`"${e?.title}" deleted.`, 'error');
  refreshCurrentPage();
}

function openModal(id)  { document.getElementById(id).style.display = 'flex'; document.body.style.overflow = 'hidden'; }
function closeModal(id) { document.getElementById(id).style.display = 'none';  document.body.style.overflow = ''; }
function overlayClose(e, id) { if (e.target === e.currentTarget) closeModal(id); }

function handleSubmit(e) {
  e.preventDefault();
  if (!validateForm()) return;

  const id    = document.getElementById('f-id').value;
  const data  = {
    title:    document.getElementById('f-title').value.trim(),
    amount:   Number(document.getElementById('f-amount').value),
    category: document.getElementById('f-cat').value,
    date:     document.getElementById('f-date').value,
    note:     document.getElementById('f-note').value.trim(),
  };

  if (id) {
    const idx = state.expenses.findIndex(x => x.id === id);
    if (idx >= 0) state.expenses[idx] = { ...state.expenses[idx], ...data };
    showToast(`"${data.title}" updated.`, 'info');
  } else {
    state.expenses.unshift({ id: genId(), ...data });
    showToast(`"${data.title}" added!`, 'success');
  }
  saveExpenses();
  closeModal('modal-add');
  refreshCurrentPage();
}

function validateForm() {
  let valid = true;
  clearErrors();
  const title  = document.getElementById('f-title').value.trim();
  const amount = document.getElementById('f-amount').value;
  const cat    = document.getElementById('f-cat').value;
  const date   = document.getElementById('f-date').value;
  if (!title)               { setErr('e-title', 'f-title',  'Title is required.');             valid = false; }
  if (!amount || amount<=0) { setErr('e-amount','f-amount', 'Enter a valid amount.');           valid = false; }
  if (!cat)                 { setErr('e-cat',   'f-cat',    'Please select a category.');       valid = false; }
  if (!date)                { setErr('e-date',  'f-date',   'Date is required.');               valid = false; }
  return valid;
}
function setErr(errId, fieldId, msg) {
  document.getElementById(errId).textContent = msg;
  document.getElementById(fieldId).classList.add('err');
}
function clearErrors() {
  ['e-title','e-amount','e-cat','e-date'].forEach(id => {
    const el = document.getElementById(id); if (el) el.textContent = '';
  });
  ['f-title','f-amount','f-cat','f-date'].forEach(id => {
    const el = document.getElementById(id); if (el) el.classList.remove('err');
  });
}

/* ── Toasts ──────────────────────────────────────────────── */
function showToast(msg, type = 'success') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const id    = genId();
  const el    = document.createElement('div');
  el.className = `toast ${type}`;
  el.id        = id;
  el.innerHTML = `<span class="t-ico">${icons[type] || icons.success}</span><span class="t-msg">${escHtml(msg)}</span><span class="t-x" onclick="document.getElementById('${id}').remove()">✕</span>`;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el && el.parentNode && el.remove(), 3500);
}

/* ── Refresh helpers ─────────────────────────────────────── */
function refreshCurrentPage() {
  if (currentPage === 'dashboard') renderDashboard();
  if (currentPage === 'expenses')  renderExpenses();
  if (currentPage === 'analytics') renderAnalytics();
  if (currentPage === 'budget')    renderBudget();
}

/* ── Populate Category Selects ───────────────────────────── */
function populateCatSelects() {
  const opts = CAT_NAMES.map(c => `<option value="${c}">${c}</option>`).join('');
  ['f-cat', 'si-cat'].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    const first = el.options[0].outerHTML;
    el.innerHTML = first + opts;
  });
}

/* ── Keyboard handlers ───────────────────────────────────── */
function setupKeyboard() {
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal('modal-add');
      closeModal('modal-del');
      closeSidebar();
    }
  });
}

/* ── Init ────────────────────────────────────────────────── */
function init() {
  loadState();
  populateCatSelects();
  setupKeyboard();

  // Sidebar nav click events
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.page));
  });

  // Render first page
  navigate('dashboard');
}

document.addEventListener('DOMContentLoaded', init);
