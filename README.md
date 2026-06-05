# SFITS — Startup Funding & Investor Tracking System

A full-stack web application for managing startups, funding rounds, investor ownership, and equity dilution over time — built as a DBMS mini project.

When a startup raises funds from multiple investors across multiple funding rounds, tracking ownership percentages becomes increasingly complex. Each new investment leads to changes in existing ownership due to equity dilution, making it difficult to maintain accurate records over time. Without a structured system, ownership data may be overwritten or lost, preventing reliable historical analysis. The Startup Funding and Investment Tracking System (SFITS) addresses this problem by organizing data related to startups, investors, funding rounds, and investments using a structured relational database. It also maintains a complete history of ownership changes after each funding round, enabling stakeholders to accurately track and query ownership distribution at any stage, such as “Who owned how much at a specific funding round?

## 🚀 What It Does

| Feature             | Description                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------- |
| **Founder Panel**   | Manage startups, add co-founders, create funding rounds, view cap table & equity history |
| **Investor Panel**  | Browse startups, invest in live rounds, track portfolio & equity acquired                |
| **Equity Dilution** | Automatically recalculates ownership % for all stakeholders after each investment        |
| **Cap Table**       | Full historical snapshot of ownership across every funding round                         |
| **Dashboard**       | Real-time stats — valuation, funding progress, investor count, founder equity            |

---

## 🛠 Tech Stack

- **Frontend** — HTML, Vanilla CSS, Tailwind CDN, Chart.js
- **Backend** — Node.js, Express.js
- **Database** — MySQL (relational schema with `STARTUP`, `FOUNDER`, `FUNDING_ROUND`, `INVESTMENT`, `EQUITY_HISTORY`)

---

## ⚙️ How to Run

### 1. Clone & switch branch

```bash
git clone https://github.com/karvevaishnavi16/SFITS_DBMS.git
cd SFITS_DBMS
git checkout final-fix
```

### 2. Install backend dependencies

```bash
cd backend
npm install express mysql2 cors
```

### 3. Configure MySQL

- Create database: `SFITS_DBMS_PRJ`
- Default credentials in `backend/server.js`: `root` / `root123` — update if different

### 4. Start the server

```bash
node server.js
# → Server running on https://startup-funding-investment-tracking.onrender.com
```

### 5. Open the frontend

- Open `Frontend/welcome.html` in a browser (or use VS Code Live Server)
- No frontend build step required

---

## 👥 Roles

- **Founder** — registers a startup, manages rounds and co-founders
- **Investor** — browses active rounds, invests, tracks portfolio

---

## 🗃 Key DB Tables

`USERS` → `STARTUP` → `FOUNDER` → `FUNDING_ROUND` → `INVESTMENT` → `EQUITY_HISTORY`
