# 🪙 Expense Tracker

A sleek, premium, and fully client-side Expense Tracker designed specifically for college students. Track your campus spending, manage monthly budgets, set category-wise limits, and visualize your financial habits through interactive charts.

Built entirely with **Vanilla HTML5, CSS3, and JavaScript (ES6+)**, Expense Tracker requires no build step, no NPM installs, and works completely offline using standard web technologies.

---

## ✨ Features

- **📊 Dynamic Dashboard**: Get a quick overview of your monthly budget, total spending, remaining balance, and total transactions.
- **💡 Smart Spending Insights**: Automated tips and analysis based on your highest spending category to help you optimize campus expenses.
- **📈 Rich Visualizations**: Powered by **Chart.js** via CDN:
  - **Doughnut Chart**: This month's spending breakdown by category.
  - **Line Chart**: 6-month historical spending trends.
  - **Bar Chart**: All-time total spending across categories.
- **📑 Transaction Management**: Add, edit, and delete transactions with ease. Form includes validation for titles, positive amounts, categories, and dates.
- **⚙️ Advanced Budgeting**:
  - Set a global monthly budget with a real-time progress bar.
  - Progress bar dynamically changes color (Green 🟢, Orange 🟡, Red 🔴) based on budget utilization.
  - Set individual monthly spending limits for specific categories (e.g., Mess & Food, Hostel, Travel).
- **🔍 Advanced Filtering & Sorting**: Search transactions by keyword, filter by month/category, and sort by date or amount.
- **💾 LocalStorage Persistence**: All your data is saved automatically in your browser's local storage.
- **🌱 Pre-seeded Demo Data**: Starts with preloaded realistic student data (Mess Bill, Canteen, Metro Card, Spotify, etc.) so you can try out the analytics instantly. You can easily reset back to this seed data anytime.

---

## 🛠️ Tech Stack & Libraries

- **Markup & Structure**: HTML5 (Semantic elements)
- **Styling & Theme**: Modern Vanilla CSS3 (Custom CSS variables, Glassmorphism elements, CSS Flexbox/Grid, Responsive layouts)
- **Programming Logic**: Pure Vanilla JavaScript (ES6+ Modules, state-oriented rendering)
- **Data Visuals**: [Chart.js v4.4.0](https://www.chartjs.org/) (UMD via CDN)
- **Icons**: Emoji & Custom SVG Icons

---

## 📁 File Structure

```text
Expense Tracker/
├── index.html     # Semantic HTML page structure & modals
├── style.css      # CSS styling variables, grid/flex layouts, and dark sidebar theme
└── script.js      # Core application logic, Chart.js integrations, and state updates
```

---

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge, etc.)

### Running the App Locally
Since this is a client-side static application, you don't need any complex development servers. Simply:

1. Clone or download the repository.
2. Navigate to the `Expense Tracker` directory.
3. Open `index.html` directly in your browser:
   ```bash
   # Or using a simple python server if you prefer:
   python -m http.server 8000
   ```
4. Access the app in your browser at `http://localhost:8000`.

---

## 🎨 Color Coding & Categorization

The tracker is configured with standard campus life categories:
- 🍔 **Mess & Food** (Orange)
- 🚇 **Travel** (Blue)
- 🏠 **Hostel** (Purple)
- 📚 **Academics** (Cyan)
- 📺 **Subscriptions** (Pink)
- 🎪 **College Events** (Amber)
- 🛍️ **Shopping** (Purple-Light)
- 🏥 **Health** (Green)
- ⚙️ **Other** (Gray)

---

## 🛡️ License

This project is part of the **COSC Hackweek 2026**. Open source under the MIT License.
