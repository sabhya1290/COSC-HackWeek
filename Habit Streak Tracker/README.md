# 🔥 Streakly — Habit Streak Tracker

> A polished, frontend-only habit tracker built with pure HTML, CSS, and vanilla JavaScript.  
> No frameworks. No backend. Just open `index.html` and start building streaks.  
> **Live Demo**: [streakly-habit.netlify.app](https://streakly-habit.netlify.app/)

---

## ✨ Features

| Feature | Details |
|---|---|
| **Dashboard** | Summary cards, today's habits, weekly overview grid, motivational banner |
| **My Habits** | View, search, filter, edit, and delete habits with streak stats |
| **30-Day Calendar** | Visual grid — click any cell to toggle completion, streaks update instantly |
| **Insights** | Completion rate, best streak, per-habit performance, weekly bar chart |
| **Settings** | Dark mode, export/import JSON, reset all data |
| **LocalStorage** | Everything persists after refresh — zero data loss |
| **Demo Data** | 5 pre-loaded habits on first launch |

---

## 🗂️ Folder Structure

```
Habit Streak Tracker/
├── index.html   ← App shell, HTML structure, modals, navigation
├── style.css    ← Design system: tokens, themes, all components
├── script.js    ← State, logic, renders, streak calc, LocalStorage
└── README.md    ← This file
```

---

## 🚀 How to Run

**Option 1 — Direct open:**
> Double-click `index.html` — works instantly in any modern browser.

**Option 2 — VS Code Live Server:**
1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension.
2. Right-click `index.html` → **Open with Live Server**.

No npm, no build step, no dependencies.

---

## 💾 How LocalStorage Works

All data is saved automatically under two keys:

| Key | Contents |
|---|---|
| `streakly_habits` | Array of all habit objects with completions history |
| `streakly_settings` | `{ darkMode: true/false }` |

### Habit Data Structure

```json
{
  "id": "lm9q4abc",
  "name": "Read for 30 Minutes",
  "icon": "📚",
  "category": "Study",
  "color": "#8b5cf6",
  "startDate": "2026-06-23",
  "frequency": "daily",
  "selectedDays": [],
  "reminder": "21:00",
  "completions": {
    "2026-07-01": true,
    "2026-07-02": true,
    "2026-07-07": true
  }
}
```

- **`frequency: "daily"`** — habit is scheduled every day.
- **`frequency: "custom"`** — habit runs on specific `selectedDays` (0=Sun … 6=Sat).
- **`completions`** — only stores dates marked `true` (skipped dates are absent).

---

## 📊 Streak Calculation

| Metric | Logic |
|---|---|
| **Current Streak** | Counts consecutive completed days backwards from today, skipping unscheduled days |
| **Longest Streak** | Scans full completion history for the longest unbroken chain |
| **Missed Day** | A scheduled day without a completion entry resets the current streak |

---

## ⚙️ Technical Architecture

To ensure high performance and prevent browser crashes, the application uses:
- **Timezone-Safe Calculations**: Date helpers use local calendar components (`date.getFullYear()`, `date.getDate()`) instead of UTC strings. This prevents infinite rendering loops in Western timezones (where UTC and local dates mismatch near midnight).
- **Infinite Loop Safeguards**: All date-traversal while-loops include a safety breakout cap (365 iterations max).
- **Separation of Concerns (Safe Flow)**: 
  - `loadData()` runs once on startup.
  - `saveData()` persists state only after explicit user actions (add, edit, toggle, import, reset).
  - `renderApp()` executes a unified draw of all active sections sequentially, eliminating recursive render loops.
- **Defensive Parsing**: Habit initialization automatically normalizes malformed storage records, ensuring older formats do not cause runtime TypeErrors.

---

## 🎨 Design System

- **Light/Dark themes** — CSS custom properties on `:root` / `[data-theme="dark"]`
- **Accent colors** — Green (done), Orange/Yellow (streaks), Red (missed), Blue (today)
- **Typography** — System UI stack for fast rendering
- **Responsive** — Sidebar collapses to hamburger menu on mobile (≤768px)

---

## 🔄 How to Reset Demo Data

**Option A — Settings page:**
1. Navigate to **Settings** in the sidebar.
2. Click **Reset** under *Danger Zone*.
3. Confirm — all habits and history are wiped.

**Option B — Browser DevTools:**
1. Open DevTools → **Application** → **Local Storage**.
2. Delete `streakly_habits` and `streakly_settings`.
3. Refresh the page — demo habits reload automatically.

---

## 📤 Export & Import

- **Export**: Downloads `streakly-backup-YYYY-MM-DD.json` with all habits + settings.
- **Import**: Upload any previously exported JSON to restore data on any device.

---

## 🛠️ Browser Support

Works in all modern browsers: Chrome, Firefox, Edge, Safari (ES6+).

---

*Built for COSC HackWeek — Pure HTML · CSS · JavaScript*
