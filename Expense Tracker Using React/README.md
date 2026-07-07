# 💸 ExpenseFlow — React & Tailwind Campus Expense Tracker

A modern, high-fidelity React web application designed for students to track expenses, set budget goals, analyze spending trends, and manage finances in real-time. 

Built with **React 19, Vite, TailwindCSS (v4), Recharts, and Lucide React**, ExpenseFlow offers a premium UI/UX experience featuring animations, responsive dashboards, and interactive charting.

---

## ✨ Features

- **📱 State-Driven SPA Routing**: Seamless navigation between tabs (Dashboard, Expenses, Analytics, Budget) without page reloads.
- **📊 Modern Dashboard**:
  - Live budget overview featuring a progress bar that shifts colors based on consumption.
  - Interactive summary cards showing total budget, total spent, remaining budget, and transaction count.
  - Snapshot showing metrics like the most expensive day, most used category, and daily average.
  - A quick-insight card summarizing category percentages and saving tips.
- **📉 Advanced Recharts Visualizations**:
  - **Category Doughnut Chart**: Interactive and responsive breakdown of current month's expenses.
  - **Spending Trend Line Chart**: Smooth Bezier curve displaying 6-month historical trends.
  - **Category Totals Bar Chart**: Vertical bar chart highlighting cumulative spending per category.
- **💳 Expense Management (CRUD)**:
  - Add, edit, and delete transactions.
  - Search filter (searches title & note keywords).
  - Category, month, and sorting filters (Latest, Oldest, Highest, Lowest).
- **🎯 Budget & Threshold Control**:
  - Edit your overall monthly budget threshold dynamically.
  - Configure specific limits on each individual category with status labels indicating near-budget (80%+) or over-budget states.
- **🔒 Persistent Storage**: Data is synced in real-time to the browser's `localStorage` via custom React hooks.
- **⚡ Seeding & Demo Data**: Comes with a realistic set of initial college-student transactions that can be easily reset to original demo seed values at any time.

---

## 🛠️ Tech Stack & Packages

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 8](https://vite.dev/)
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Linter**: [Oxlint](https://github.com/oxc-project/oxc) (for super-fast linting)

---

## 📁 Project Directory Structure

```text
Expense Tracker Using React/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images and styles
│   ├── components/         # Reusable React components (Sidebar, Header, Toast, etc.)
│   ├── hooks/              # Custom React hooks (useExpenses, useLocalStorage)
│   ├── pages/              # Main view containers (Dashboard, Expenses, Analytics, Budget)
│   ├── utils/              # Helper functions & constants (calculations, categories)
│   ├── App.jsx             # Main App layout & central state manager
│   ├── index.css           # Global stylesheet containing Tailwind directives
│   └── main.jsx            # React root mount point
├── package.json            # NPM dependencies & scripts
├── vite.config.js          # Vite configuration
└── README.md               # You are here!
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or higher recommended)
- npm (installed automatically with Node)

### Installation
1. Navigate to the React app folder:
   ```bash
   cd "Expense Tracker Using React"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally (Development)
To start the Vite dev server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

### Building for Production
To generate optimized production build assets in the `/dist` folder:
```bash
npm run build
```

To preview the built production app locally:
```bash
npm run preview
```

---

## 🎨 Color System & Categories

The app uses Tailwind theme colors for different expense categories:
- 🍔 **Mess & Food**: `#f97316` (Orange)
- 🚇 **Travel**: `#3b82f6` (Blue)
- 🏠 **Hostel**: `#8b5cf6` (Violet)
- 📚 **Academics**: `#06b6d4` (Cyan)
- 📺 **Subscriptions**: `#ec4899` (Pink)
- 🎪 **College Events**: `#f59e0b` (Amber)
- 🛍️ **Shopping**: `#a855f7` (Purple)
- 🏥 **Health**: `#10b981` (Emerald)
- ⚙️ **Other**: `#6b7280` (Gray)

---
