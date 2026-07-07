/* ─── CONSTANTS ─────────────────────────────────────────────────── */
const STORAGE_KEY = 'streakly_habits';
const SETTINGS_KEY = 'streakly_settings';

const EMOJI_OPTIONS = [
  '💧', '📚', '🏃', '💪', '🧘', '🍎', '😴', '✍️',
  '🎯', '🧠', '🎸', '🌱', '💊', '📝', '🍵', '🖥️'
];

const COLOR_SWATCHES = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#f97316'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_ABBR = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/* ─── STATE ─────────────────────────────────────────────────────── */
let habits = [];
let settings = { darkMode: false };
let editingId = null;
let selectedEmoji = '📋';
let selectedColor = '#10b981';
let confirmCallback = null;

/* ─── HELPERS: DATE (TIMEZONE-SAFE LOCAL COMPONENT IMPLEMENTATION) ─── */
function toDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dateOnly(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date();
  }
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date();
  const [y, m, d] = parts.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return new Date();
  return new Date(y, m - 1, d);
}

function daysBetween(a, b) {
  const msA = dateOnly(a).getTime();
  const msB = dateOnly(b).getTime();
  return Math.round((msB - msA) / 86400000);
}

function getLast30Days() {
  const days = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(toDateStr(d));
  }
  return days;
}

function getLast7Days() {
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(toDateStr(d));
  }
  return days;
}

/* ─── HELPERS: HABIT LOGIC ──────────────────────────────────────── */
function isScheduledDay(habit, dateStr) {
  if (habit.frequency === 'daily') return true;
  const dow = dateOnly(dateStr).getDay();
  return (habit.selectedDays || []).includes(String(dow));
}

function calcCurrentStreak(habit) {
  const today = toDateStr();
  let cursor = today;

  if (isScheduledDay(habit, today)) {
    if (!habit.completions[today]) {
      let prevDate = dateOnly(today);
      prevDate.setDate(prevDate.getDate() - 1);
      let prevStr = toDateStr(prevDate);
      
      let iter = 0;
      while (daysBetween(habit.startDate, prevStr) >= 0 && !isScheduledDay(habit, prevStr)) {
        if (iter++ > 365) break; // safety cap
        prevDate.setDate(prevDate.getDate() - 1);
        prevStr = toDateStr(prevDate);
      }
      
      if (daysBetween(habit.startDate, prevStr) >= 0 && habit.completions[prevStr]) {
        cursor = prevStr;
      } else {
        return 0;
      }
    }
  } else {
    let prevDate = dateOnly(today);
    prevDate.setDate(prevDate.getDate() - 1);
    let prevStr = toDateStr(prevDate);
    
    let iter = 0;
    while (daysBetween(habit.startDate, prevStr) >= 0 && !isScheduledDay(habit, prevStr)) {
      if (iter++ > 365) break; // safety cap
      prevDate.setDate(prevDate.getDate() - 1);
      prevStr = toDateStr(prevDate);
    }
    
    if (daysBetween(habit.startDate, prevStr) >= 0) {
      if (habit.completions[prevStr]) {
        cursor = prevStr;
      } else {
        return 0;
      }
    } else {
      return 0;
    }
  }

  let streak = 0;
  let checkCursor = cursor;
  let iter = 0;

  while (true) {
    if (iter++ > 365) break; // safety cap
    if (!isScheduledDay(habit, checkCursor)) {
      let d = dateOnly(checkCursor);
      d.setDate(d.getDate() - 1);
      checkCursor = toDateStr(d);
      if (daysBetween(habit.startDate, checkCursor) < 0) break;
      continue;
    }
    if (habit.completions[checkCursor]) {
      streak++;
      let d = dateOnly(checkCursor);
      d.setDate(d.getDate() - 1);
      checkCursor = toDateStr(d);
      if (daysBetween(habit.startDate, checkCursor) < 0) break;
    } else {
      break;
    }
  }
  return streak;
}

function calcLongestStreak(habit) {
  const sorted = Object.keys(habit.completions)
    .filter(d => habit.completions[d])
    .sort();
  if (!sorted.length) return 0;

  let longest = 1, current = 1;
  for (let i = 1; i < sorted.length; i++) {
    let prev = sorted[i - 1];
    let cur = sorted[i];
    let gap = daysBetween(prev, cur);
    let consecutive = false;
    if (gap === 1) {
      consecutive = true;
    } else if (gap > 1 && gap <= 365 && habit.frequency !== 'daily') {
      // Check if all days in between are non-scheduled
      consecutive = true;
      for (let g = 1; g < gap; g++) {
        const d = new Date(dateOnly(prev));
        d.setDate(d.getDate() + g);
        if (isScheduledDay(habit, toDateStr(d))) { consecutive = false; break; }
      }
    }
    if (consecutive) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

function calcCompletionRate(habit, days = null) {
  const today = toDateStr();
  let startDateStr = habit.startDate;

  // Find Monday of the starting week of the habit
  const startD = dateOnly(habit.startDate);
  const day = startD.getDay(); // 0 = Sun, 1 = Mon, ...
  const offset = day === 0 ? -6 : 1 - day;
  const startOfWeek = new Date(startD);
  startOfWeek.setDate(startD.getDate() + offset);
  const startOfWeekStr = toDateStr(startOfWeek);

  if (days === null) {
    startDateStr = startOfWeekStr;
  } else {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - days + 1);
    const limitStr = toDateStr(limitDate);
    // Start from whichever is later
    startDateStr = daysBetween(startOfWeekStr, limitStr) > 0 ? limitStr : startOfWeekStr;
  }

  let cursor = startDateStr;
  let scheduled = 0, completed = 0;
  let iter = 0;

  while (daysBetween(cursor, today) >= 0) {
    if (iter++ > 365) break; // safety cap
    if (isScheduledDay(habit, cursor)) {
      scheduled++;
      if (habit.completions[cursor]) {
        completed++;
      }
    }
    const nextD = dateOnly(cursor);
    nextD.setDate(nextD.getDate() + 1);
    cursor = toDateStr(nextD);
  }

  return scheduled ? Math.round((completed / scheduled) * 100) : 0;
}

function uniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ─── DATA ACCESS (SAFE ARCHITECTURE) ────────────────────────────── */
function saveHabits() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadHabits() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(data)) {
      habits = data.map(h => {
        return {
          id: h.id || uniqueId(),
          name: h.name || 'Untitled Habit',
          icon: h.icon || '🎯',
          category: h.category || 'Other',
          color: h.color || '#10b981',
          startDate: h.startDate || toDateStr(),
          frequency: h.frequency || 'daily',
          selectedDays: Array.isArray(h.selectedDays) ? h.selectedDays : [],
          reminder: h.reminder || '',
          completions: h.completions && typeof h.completions === 'object' ? h.completions : {}
        };
      });
    } else {
      habits = [];
    }
  } catch {
    habits = [];
  }
}

function loadSettings() {
  try {
    settings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || { darkMode: false };
  } catch { settings = { darkMode: false }; }
}

function loadData() {
  loadSettings();
  loadHabits();
  seedDemoData();
}

function saveData() {
  saveHabits();
  saveSettings();
}

/* ─── DEMO DATA ─────────────────────────────────────────────────── */
function seedDemoData() {
  if (habits.length) return;
  const today = toDateStr();

  const demos = [
    { name: 'Drink 8 Glasses of Water', icon: '💧', category: 'Health', color: '#06b6d4' },
    { name: 'Read for 30 Minutes', icon: '📚', category: 'Study', color: '#8b5cf6' },
    { name: 'Workout', icon: '💪', category: 'Fitness', color: '#ef4444' },
    { name: 'Practice DSA', icon: '🧠', category: 'Productivity', color: '#f59e0b' },
    { name: 'Sleep Before 11 PM', icon: '😴', category: 'Personal', color: '#10b981' },
  ];

  habits = demos.map(d => {
    const completions = {};
    for (let i = 14; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      if (Math.random() > 0.2) completions[toDateStr(dt)] = true;
    }
    completions[today] = true;
    return {
      id: uniqueId(),
      name: d.name,
      icon: d.icon,
      category: d.category,
      color: d.color,
      startDate: (() => { const s = new Date(); s.setDate(s.getDate() - 14); return toDateStr(s); })(),
      frequency: 'daily',
      selectedDays: [],
      reminder: '',
      completions
    };
  });
  saveHabits();
}

/* ─── TOAST ─────────────────────────────────────────────────────── */
function showToast(message, type = 'success', duration = 2800) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  toast.innerHTML = `<span>${icons[type] || '📢'}</span><span>${message}</span>`;
  container.appendChild(toast);

  const timer = setTimeout(() => {
    toast.classList.add('fadeOut');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);

  toast.addEventListener('click', () => {
    clearTimeout(timer);
    toast.classList.add('fadeOut');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  });
}

/* ─── NAVIGATION ────────────────────────────────────────────────── */
const sectionTitles = {
  dashboard: 'Dashboard',
  habits: 'My Habits',
  calendar: 'Calendar',
  insights: 'Insights',
  settings: 'Settings'
};

function navigate(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.section === sectionId);
    a.setAttribute('aria-current', a.dataset.section === sectionId ? 'page' : 'false');
  });
  const sec = document.getElementById(`section-${sectionId}`);
  if (sec) sec.classList.add('active');
  document.getElementById('pageTitle').textContent = sectionTitles[sectionId] || 'Streakly';
  closeSidebar();
}

/* ─── SIDEBAR ───────────────────────────────────────────────────── */
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('active');
  document.getElementById('hamburger').setAttribute('aria-expanded', 'true');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('active');
  document.getElementById('hamburger').setAttribute('aria-expanded', 'false');
}

/* ─── RENDER APP (ROOT RENDERER) ────────────────────────────────── */
function renderApp() {
  console.log("renderApp started");
  renderDashboard();
  renderHabits();
  renderCalendar();
  renderInsights();
  renderSettings();
}

/* ─── RENDER: DASHBOARD ─────────────────────────────────────────── */
function renderDashboard() {
  console.log("renderDashboard started");
  const today = toDateStr();
  const todayHabits = habits.filter(h => isScheduledDay(h, today));

  // Summary cards
  document.getElementById('totalHabits').textContent = habits.length;
  document.getElementById('completedToday').textContent = todayHabits.filter(h => h.completions[today]).length;

  const allStreaks = habits.map(h => calcCurrentStreak(h));
  document.getElementById('bestStreak').textContent = allStreaks.length ? Math.max(...allStreaks) : 0;

  const rates = habits.map(h => calcCompletionRate(h));
  const avgRate = rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0;
  document.getElementById('completionRate').textContent = avgRate + '%';

  // Today date display
  document.getElementById('todayDateDisplay').textContent =
    new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Motivational banner
  const doneCount = todayHabits.filter(h => h.completions[today]).length;
  const total = todayHabits.length;
  const ratio = total ? doneCount / total : 0;
  const banner = document.getElementById('motivationBanner');
  const msgEl = document.getElementById('motivationText');
  const emojEl = document.getElementById('motivationEmoji');

  if (total === 0) {
    emojEl.textContent = '🌱'; msgEl.textContent = 'Add your first habit to get started!';
    banner.style.background = '';
  } else if (ratio === 1) {
    emojEl.textContent = '🏆'; msgEl.textContent = `Amazing! You've completed all ${total} habits today. Keep the streak alive!`;
    banner.style.background = 'linear-gradient(135deg,#f0fdf4,#dcfce7)';
  } else if (ratio >= 0.5) {
    emojEl.textContent = '🔥'; msgEl.textContent = `Great momentum! ${doneCount} of ${total} done. Keep pushing!`;
    banner.style.background = '';
  } else if (doneCount > 0) {
    emojEl.textContent = '💪'; msgEl.textContent = `Good start! ${doneCount} of ${total} habits done today. You can do this!`;
    banner.style.background = '';
  } else {
    emojEl.textContent = '⏰'; msgEl.textContent = 'Today is a new opportunity. Complete your first habit!';
    banner.style.background = '';
  }

  // Today's habit list
  const list = document.getElementById('todayHabitsList');
  const empty = document.getElementById('todayEmptyState');
  list.innerHTML = '';

  if (todayHabits.length === 0) {
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    todayHabits.forEach(h => {
      const done = !!h.completions[today];
      const streak = calcCurrentStreak(h);
      const item = document.createElement('div');
      item.className = `today-habit-item${done ? ' done' : ''}`;
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', `${h.name} — ${done ? 'completed' : 'not completed'}`);
      item.innerHTML = `
        <div class="habit-check" style="${done ? `background:${h.color};border-color:${h.color}` : ''}">
          ${done ? '✓' : ''}
        </div>
        <div class="today-habit-info">
          <div class="today-habit-name">${h.icon} ${escHtml(h.name)}</div>
          <div class="today-habit-meta">${h.category}</div>
        </div>
        ${streak > 0 ? `<span class="streak-badge">🔥 ${streak}d</span>` : ''}
      `;
      item.addEventListener('click', () => toggleCompletion(h.id, today));
      item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCompletion(h.id, today); } });
      list.appendChild(item);
    });
  }

  // Weekly grid
  renderWeeklyGrid();
}

function renderWeeklyGrid() {
  const today = new Date();
  // Get Monday–Sunday of current week
  const startOfWeek = new Date(today);
  const dow = today.getDay(); // 0=Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  startOfWeek.setDate(today.getDate() + mondayOffset);

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    weekDates.push(toDateStr(d));
  }

  const grid = document.getElementById('weeklyGrid');
  grid.innerHTML = '';

  habits.slice(0, 6).forEach(h => {
    const row = document.createElement('div');
    row.className = 'weekly-row';
    weekDates.forEach(ds => {
      const cell = document.createElement('div');
      cell.className = 'weekly-cell';
      if (ds === toDateStr()) cell.classList.add('today');
      if (h.completions[ds]) cell.classList.add('done');
      cell.title = `${h.icon} ${h.name} — ${ds}`;
      row.appendChild(cell);
    });
    grid.appendChild(row);
  });
}

/* ─── TOGGLE COMPLETION ─────────────────────────────────────────── */
function toggleCompletion(habitId, dateStr) {
  const habit = habits.find(h => h.id === habitId);
  if (!habit) return;
  if (habit.completions[dateStr]) {
    delete habit.completions[dateStr];
  } else {
    habit.completions[dateStr] = true;
  }
  saveData();
  renderApp();
}

/* ─── RENDER: MY HABITS ─────────────────────────────────────────── */
function renderHabits() {
  const query = (document.getElementById('habitSearch')?.value || '').toLowerCase();
  const category = document.getElementById('categoryFilter')?.value || '';

  const filtered = habits.filter(h => {
    const matchName = h.name.toLowerCase().includes(query);
    const matchCat = !category || h.category === category;
    return matchName && matchCat;
  });

  const grid = document.getElementById('habitsGrid');
  const empty = document.getElementById('habitsEmptyState');
  grid.innerHTML = '';

  if (filtered.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  filtered.forEach(h => {
    const currentStreak = calcCurrentStreak(h);
    const longestStreak = calcLongestStreak(h);
    const rate = calcCompletionRate(h);
    const card = document.createElement('div');
    card.className = 'habit-card';
    card.style.setProperty('--habit-color', h.color);

    card.innerHTML = `
      <div class="habit-card-top">
        <div class="habit-card-left">
          <div class="habit-card-icon">${h.icon}</div>
          <div>
            <div class="habit-card-name">${escHtml(h.name)}</div>
            <div class="habit-card-category">${h.category}</div>
          </div>
        </div>
        <div class="habit-card-actions">
          <button class="btn-icon" data-action="edit" data-id="${h.id}" aria-label="Edit ${escHtml(h.name)}">✏️</button>
          <button class="btn-icon" data-action="delete" data-id="${h.id}" aria-label="Delete ${escHtml(h.name)}">🗑</button>
        </div>
      </div>
      <div class="habit-stats">
        <div class="habit-stat">
          <div class="habit-stat-val" style="color:${h.color}">🔥 ${currentStreak}</div>
          <div class="habit-stat-lbl">Current Streak</div>
        </div>
        <div class="habit-stat">
          <div class="habit-stat-val">🏆 ${longestStreak}</div>
          <div class="habit-stat-lbl">Longest Streak</div>
        </div>
        <div class="habit-stat">
          <div class="habit-stat-val">${rate}%</div>
          <div class="habit-stat-lbl">Overall Rate</div>
        </div>
      </div>
      <div class="habit-progress-bar-wrap">
        <div class="habit-progress-bar" style="width:${rate}%;background:${h.color}"></div>
      </div>
      <div class="habit-progress-label">${rate}% completion</div>
    `;

    card.querySelector('[data-action="edit"]').addEventListener('click', e => { e.stopPropagation(); openEditModal(h.id); });
    card.querySelector('[data-action="delete"]').addEventListener('click', e => { e.stopPropagation(); confirmDeleteHabit(h.id); });
    grid.appendChild(card);
  });
}

/* ─── RENDER: CALENDAR ──────────────────────────────────────────── */
function renderCalendar() {
  console.log("renderCalendar started");
  const days30 = getLast30Days();
  const today = toDateStr();
  const container = document.getElementById('calendarContainer');
  container.innerHTML = '';

  const gridTemplate = `140px repeat(30, 28px)`;

  // Header row (dates)
  const headerRow = document.createElement('div');
  headerRow.className = 'calendar-header-row';
  headerRow.style.gridTemplateColumns = gridTemplate;
  headerRow.setAttribute('role', 'row');

  const labelTh = document.createElement('div');
  labelTh.className = 'cal-habit-label';
  labelTh.setAttribute('role', 'columnheader');
  labelTh.textContent = 'Habit';
  headerRow.appendChild(labelTh);

  days30.forEach(ds => {
    const d = dateOnly(ds);
    const th = document.createElement('div');
    th.className = 'cal-day-label';
    th.setAttribute('role', 'columnheader');
    if (ds === today) th.style.color = 'var(--blue)';
    th.textContent = d.getDate();
    th.title = ds;
    headerRow.appendChild(th);
  });
  container.appendChild(headerRow);

  // One row per habit
  habits.forEach(h => {
    const row = document.createElement('div');
    row.className = 'calendar-row';
    row.style.gridTemplateColumns = gridTemplate;
    row.setAttribute('role', 'row');

    const labelCell = document.createElement('div');
    labelCell.className = 'cal-habit-label';
    labelCell.setAttribute('role', 'rowheader');
    labelCell.textContent = `${h.icon} ${h.name}`;
    row.appendChild(labelCell);

    days30.forEach(ds => {
      const cell = document.createElement('button');
      cell.className = 'cal-cell';
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', `${h.name} on ${ds}`);

      const isToday = ds === today;
      const isFuture = ds > today;
      const isScheduled = isScheduledDay(h, ds);
      const isDone = !!h.completions[ds];
      const isPast = !isFuture && !isToday;

      if (!isScheduled) {
        cell.classList.add('scheduled-off');
        cell.setAttribute('aria-disabled', 'true');
      } else if (isFuture) {
        cell.classList.add('future');
        cell.setAttribute('aria-disabled', 'true');
      } else {
        if (isDone) {
          cell.classList.add('completed');
          cell.textContent = '✓';
          cell.setAttribute('aria-pressed', 'true');
        } else if (isPast) {
          cell.classList.add('missed');
          cell.setAttribute('aria-pressed', 'false');
        }
        if (isToday) cell.classList.add('today');

        cell.addEventListener('click', () => {
          toggleCompletion(h.id, ds);
        });
      }
      row.appendChild(cell);
    });
    container.appendChild(row);
  });

  if (!habits.length) {
    container.innerHTML = '<div class="empty-state"><span>📅</span><p>No habits to display. Add habits first!</p></div>';
  }
}

/* ─── RENDER: INSIGHTS ──────────────────────────────────────────── */
function renderInsights() {
  const today = toDateStr();
  const last7 = getLast7Days();

  // Overall rate (7-day)
  let totalSlots = 0, totalDone = 0;
  habits.forEach(h => {
    last7.forEach(d => {
      if (!isScheduledDay(h, d)) return;
      if (daysBetween(h.startDate, d) < 0) return;
      totalSlots++;
      if (h.completions[d]) totalDone++;
    });
  });
  const overallRate = totalSlots ? Math.round(totalDone / totalSlots * 100) : 0;
  document.getElementById('insightOverall').textContent = overallRate + '%';

  // Longest active streak
  const allStreaks = habits.map(h => ({ name: h.name, icon: h.icon, streak: calcCurrentStreak(h) }));
  const maxStreak = allStreaks.reduce((max, h) => h.streak > max.streak ? h : max, { streak: 0 });
  document.getElementById('insightLongestStreak').textContent =
    maxStreak.streak ? `${maxStreak.streak} days` : '0 days';

  // Most consistent
  const rates = habits.map(h => ({ name: h.name, icon: h.icon, rate: calcCompletionRate(h) }));
  const best = rates.reduce((max, h) => h.rate > max.rate ? h : max, { rate: -1, name: '—', icon: '' });
  document.getElementById('insightMostConsistent').textContent =
    best.rate >= 0 && habits.length ? `${best.icon} ${best.name}` : '—';

  // Bar chart
  const chartEl = document.getElementById('weeklyChart');
  chartEl.innerHTML = '';
  last7.forEach(ds => {
    const dayHabits = habits.filter(h => isScheduledDay(h, ds) && daysBetween(h.startDate, ds) >= 0);
    const done = dayHabits.filter(h => h.completions[ds]).length;
    const total = dayHabits.length;
    const pct = total ? (done / total) * 100 : 0;

    const d = dateOnly(ds);
    const group = document.createElement('div');
    group.className = 'bar-group';
    group.innerHTML = `
      <div class="bar-value">${done}/${total}</div>
      <div class="bar-track">
        <div class="bar-fill" style="height:${pct}%;background:${pct > 70 ? 'var(--green)' : pct > 40 ? 'var(--orange)' : 'var(--red)'}"></div>
      </div>
      <div class="bar-label">${DAYS[d.getDay()].slice(0, 3)}</div>
    `;
    chartEl.appendChild(group);
  });

  // Habit performance
  const perfList = document.getElementById('habitPerformanceList');
  perfList.innerHTML = '';
  const sortedHabits = [...habits].sort(
    (a, b) => calcCompletionRate(b, 7) - calcCompletionRate(a, 7)
  );
  sortedHabits.forEach(h => {
    const rate = calcCompletionRate(h, 7);
    const row = document.createElement('div');
    row.className = 'perf-row';
    row.innerHTML = `
      <div class="perf-icon">${h.icon}</div>
      <div class="perf-name">${escHtml(h.name)}</div>
      <div class="perf-bar-wrap">
        <div class="perf-bar" style="width:${rate}%;background:${h.color}"></div>
      </div>
      <div class="perf-pct">${rate}%</div>
    `;
    perfList.appendChild(row);
  });
  if (!habits.length) perfList.innerHTML = '<p class="text-muted" style="padding:12px">No habit data yet.</p>';

  // Insight messages
  const msgList = document.getElementById('insightMessages');
  msgList.innerHTML = '';

  const messages = generateInsightMessages(overallRate, maxStreak, best, last7);
  messages.forEach(({ icon, text }) => {
    const li = document.createElement('li');
    li.className = 'insight-msg';
    li.innerHTML = `<span class="insight-msg-icon">${icon}</span><span>${text}</span>`;
    msgList.appendChild(li);
  });
}

function generateInsightMessages(overallRate, maxStreak, best, last7) {
  const today = toDateStr();
  const todayHabits = habits.filter(h => isScheduledDay(h, today));
  const doneToday = todayHabits.filter(h => h.completions[today]).length;
  const msgs = [];

  if (!habits.length) {
    msgs.push({ icon: '💡', text: 'Add your first habit to start tracking progress!' });
    return msgs;
  }

  msgs.push({ icon: '📊', text: `You completed ${overallRate}% of scheduled habits over the last 7 days.` });

  if (maxStreak.streak > 0) {
    msgs.push({ icon: '🔥', text: `Your longest active streak is ${maxStreak.streak} days — keep going!` });
  }

  if (best.rate >= 0 && best.name !== '—') {
    msgs.push({ icon: '⭐', text: `"${best.name}" is your strongest habit with ${best.rate}% completion in 30 days.` });
  }

  if (doneToday < todayHabits.length) {
    const rem = todayHabits.length - doneToday;
    msgs.push({ icon: '🎯', text: `Complete ${rem} more habit${rem > 1 ? 's' : ''} today to maintain your momentum.` });
  } else if (todayHabits.length > 0) {
    msgs.push({ icon: '🏆', text: "You've completed all today's habits. Outstanding discipline!" });
  }

  if (overallRate < 50 && habits.length > 0) {
    msgs.push({ icon: '💪', text: 'Consistency is built one day at a time. Try completing just one habit today.' });
  }

  return msgs;
}

/* ─── RENDER: SETTINGS ──────────────────────────────────────────── */
function renderSettings() {
  document.getElementById('darkModeToggle').checked = !!settings.darkMode;
}

/* ─── ADD/EDIT MODAL ────────────────────────────────────────────── */
function openAddModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Add New Habit';
  document.getElementById('modalSubmit').textContent = 'Add Habit';
  resetForm();
  showModal('habitModal');
}

function openEditModal(id) {
  const h = habits.find(h => h.id === id);
  if (!h) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = 'Edit Habit';
  document.getElementById('modalSubmit').textContent = 'Save Changes';

  document.getElementById('habitName').value = h.name;
  document.getElementById('habitIconCustom').value = h.icon;
  document.getElementById('habitColor').value = h.color;
  document.getElementById('habitCategory').value = h.category;
  document.getElementById('habitStartDate').value = h.startDate;
  document.getElementById('habitReminder').value = h.reminder || '';

  // Frequency
  const freqRadio = document.querySelector(`input[name="frequency"][value="${h.frequency}"]`);
  if (freqRadio) freqRadio.checked = true;
  document.getElementById('daySelector').hidden = h.frequency !== 'custom';

  // Selected days
  document.querySelectorAll('#daySelector input[type="checkbox"]').forEach(cb => {
    cb.checked = (h.selectedDays || []).includes(cb.value);
  });

  // Emoji / color selection
  selectedEmoji = h.icon;
  selectedColor = h.color;
  updateEmojiSelection(h.icon);
  updateColorSelection(h.color);

  showModal('habitModal');
}

function resetForm() {
  document.getElementById('habitForm').reset();
  document.getElementById('habitStartDate').value = toDateStr();
  selectedEmoji = '📋';
  selectedColor = '#10b981';
  document.getElementById('habitColor').value = '#10b981';
  updateEmojiSelection('📋');
  updateColorSelection('#10b981');
  document.getElementById('daySelector').hidden = true;
  document.getElementById('habitNameError').textContent = '';
  document.getElementById('habitName').classList.remove('input-error');
}

function updateEmojiSelection(emoji) {
  document.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.emoji === emoji);
  });
}

function updateColorSelection(color) {
  document.querySelectorAll('.color-swatch').forEach(sw => {
    sw.classList.toggle('selected', sw.dataset.color === color);
  });
}

function buildEmojiGrid() {
  const grid = document.getElementById('emojiGrid');
  grid.innerHTML = '';
  EMOJI_OPTIONS.forEach(emoji => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'emoji-btn';
    btn.textContent = emoji;
    btn.dataset.emoji = emoji;
    btn.setAttribute('aria-label', emoji);
    btn.addEventListener('click', () => {
      selectedEmoji = emoji;
      document.getElementById('habitIconCustom').value = '';
      updateEmojiSelection(emoji);
    });
    grid.appendChild(btn);
  });
}

function buildColorSwatches() {
  const container = document.getElementById('colorSwatches');
  container.innerHTML = '';
  COLOR_SWATCHES.forEach(color => {
    const sw = document.createElement('button');
    sw.type = 'button';
    sw.className = 'color-swatch';
    sw.style.background = color;
    sw.dataset.color = color;
    sw.setAttribute('aria-label', `Color ${color}`);
    sw.addEventListener('click', () => {
      selectedColor = color;
      document.getElementById('habitColor').value = color;
      updateColorSelection(color);
    });
    container.appendChild(sw);
  });
}

function handleFormSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('habitName').value.trim();
  const nameErr = document.getElementById('habitNameError');
  document.getElementById('habitName').classList.remove('input-error');
  nameErr.textContent = '';

  if (!name) {
    nameErr.textContent = 'Habit name is required.';
    document.getElementById('habitName').classList.add('input-error');
    document.getElementById('habitName').focus();
    return;
  }

  const duplicate = habits.find(h => h.name.toLowerCase() === name.toLowerCase() && h.id !== editingId);
  if (duplicate) {
    nameErr.textContent = 'A habit with this name already exists.';
    document.getElementById('habitName').classList.add('input-error');
    return;
  }

  const customEmoji = document.getElementById('habitIconCustom').value.trim();
  const icon = customEmoji || selectedEmoji;
  const color = document.getElementById('habitColor').value;
  const category = document.getElementById('habitCategory').value;
  const startDate = document.getElementById('habitStartDate').value || toDateStr();
  const reminder = document.getElementById('habitReminder').value;
  const frequency = document.querySelector('input[name="frequency"]:checked')?.value || 'daily';
  const selectedDays = frequency === 'custom'
    ? Array.from(document.querySelectorAll('#daySelector input:checked')).map(c => c.value)
    : [];

  if (editingId) {
    const idx = habits.findIndex(h => h.id === editingId);
    if (idx !== -1) {
      habits[idx] = { ...habits[idx], name, icon, color, category, startDate, reminder, frequency, selectedDays };
    }
    showToast(`"${name}" updated!`, 'info');
  } else {
    habits.push({
      id: uniqueId(), name, icon, color, category,
      startDate, reminder, frequency, selectedDays, completions: {}
    });
    showToast(`"${name}" added!`, 'success');
  }

  saveData();
  closeModal('habitModal');
  renderApp();
}

/* ─── DELETE HABIT ──────────────────────────────────────────────── */
function confirmDeleteHabit(id) {
  const h = habits.find(h => h.id === id);
  if (!h) return;
  document.getElementById('confirmTitle').textContent = 'Delete Habit';
  document.getElementById('confirmMessage').textContent = `Are you sure you want to delete "${h.name}"? This cannot be undone.`;
  document.getElementById('confirmOk').textContent = 'Yes, Delete';
  confirmCallback = () => {
    habits = habits.filter(h => h.id !== id);
    saveData();
    showToast(`"${h.name}" deleted.`, 'warning');
    renderApp();
  };
  showModal('confirmModal');
}

/* ─── MODAL HELPERS ─────────────────────────────────────────────── */
function showModal(id) {
  const m = document.getElementById(id);
  m.removeAttribute('hidden');
  setTimeout(() => {
    const focusable = m.querySelector('input, button, select');
    if (focusable) focusable.focus();
  }, 50);
}

function closeModal(id) {
  document.getElementById(id).setAttribute('hidden', '');
}

/* ─── DARK MODE ─────────────────────────────────────────────────── */
function applyTheme() {
  document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
}

/* ─── EXPORT / IMPORT ───────────────────────────────────────────── */
function exportData() {
  const data = { habits, settings, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `streakly-backup-${toDateStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported successfully!', 'success');
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data.habits)) throw new Error('Invalid format');
      habits = data.habits;
      settings = data.settings || settings;
      saveData();
      applyTheme();
      renderApp();
      showToast('Data imported successfully!', 'success');
    } catch {
      showToast('Import failed. Invalid JSON file.', 'error');
    }
  };
  reader.readAsText(file);
}

function resetAllData() {
  document.getElementById('confirmTitle').textContent = 'Reset All Data';
  document.getElementById('confirmMessage').textContent = 'This will permanently delete ALL habits and history. Are you absolutely sure?';
  document.getElementById('confirmOk').textContent = 'Yes, Reset Everything';
  confirmCallback = () => {
    habits = [];
    saveData();
    showToast('All data has been reset.', 'warning');
    renderApp();
  };
  showModal('confirmModal');
}

/* ─── UTILITY ───────────────────────────────────────────────────── */
function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ─── SIDEBAR DATE ──────────────────────────────────────────────── */
function updateSidebarDate() {
  const el = document.getElementById('sidebarDate');
  if (el) el.textContent = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/* ─── INIT ──────────────────────────────────────────────────────── */
function init() {
  loadData();
  applyTheme();
  updateSidebarDate();

  // Build modal UI
  buildEmojiGrid();
  buildColorSwatches();
  document.getElementById('habitStartDate').value = toDateStr();

  // Navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navigate(link.dataset.section);
    });
  });

  // Sidebar
  document.getElementById('hamburger').addEventListener('click', openSidebar);
  document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
  document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);

  // Add habit buttons
  document.getElementById('topbarAddBtn').addEventListener('click', openAddModal);
  document.getElementById('habitsAddBtn')?.addEventListener('click', openAddModal);

  // Modal controls
  document.getElementById('modalClose').addEventListener('click', () => closeModal('habitModal'));
  document.getElementById('modalCancel').addEventListener('click', () => closeModal('habitModal'));
  document.getElementById('habitForm').addEventListener('submit', handleFormSubmit);

  // Confirm modal
  document.getElementById('confirmCancel').addEventListener('click', () => closeModal('confirmModal'));
  document.getElementById('confirmOk').addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    confirmCallback = null;
    closeModal('confirmModal');
  });

  // Close modals on backdrop click
  document.getElementById('habitModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal('habitModal');
  });
  document.getElementById('confirmModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal('confirmModal');
  });

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal('habitModal');
      closeModal('confirmModal');
      closeSidebar();
    }
  });

  // Frequency toggle
  document.querySelectorAll('input[name="frequency"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.getElementById('daySelector').hidden = radio.value !== 'custom';
    });
  });

  // Custom emoji input
  document.getElementById('habitIconCustom').addEventListener('input', e => {
    const val = e.target.value.trim();
    if (val) {
      selectedEmoji = val;
      updateEmojiSelection(''); // deselect grid
    }
  });

  // Color picker
  document.getElementById('habitColor').addEventListener('input', e => {
    selectedColor = e.target.value;
    updateColorSelection(''); // deselect swatches
  });

  // Search & filter in My Habits
  document.getElementById('habitSearch')?.addEventListener('input', renderHabits);
  document.getElementById('categoryFilter')?.addEventListener('change', renderHabits);

  // Dark mode
  document.getElementById('darkModeToggle').addEventListener('change', e => {
    settings.darkMode = e.target.checked;
    applyTheme();
    saveData();
    renderApp();
  });

  // Export / Import / Reset
  document.getElementById('exportBtn').addEventListener('click', exportData);
  document.getElementById('importFile').addEventListener('change', e => {
    importData(e.target.files[0]);
    e.target.value = ''; // Reset for re-import
  });
  document.getElementById('resetAllBtn').addEventListener('click', resetAllData);

  // Initial render
  renderApp();
  navigate('dashboard');
}

document.addEventListener('DOMContentLoaded', init);
