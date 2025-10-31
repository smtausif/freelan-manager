TRACKwo — Freelancer Command Center
==================================

All‑in‑one freelancer hub built with Next.js 15: track time, manage clients and projects, create invoices (with PDFs), and monitor your business from a clean dashboard.

Key Features
------------
- Dashboard overview with:
  - Six‑month revenue bar chart
  - Donut chart of project status with hover details
  - Stat cards for Due, Paid, Active Projects, and Hours
- Clients and Projects management (archive, statuses, hand‑over)
- Time tracking (live timer + manual entries) with per‑project summaries and CSV export
- Invoicing with line items, payments, status workflow, and PDF generation
- SQLite + Prisma schema, migrations, and seed data for quick local setup

Tech Stack
---------
- Next.js 15 (App Router, Turbopack in dev)
- React 19
- Prisma 6.x with SQLite
- Tailwind CSS 4
- pdf-lib for PDF invoices

Getting Started
---------------

Prerequisites
- Node.js 20 LTS (or >=18.18)
- npm (bundled with Node)

Install and run (local dev)
```bash
# 1) Install deps
npm install

# 2) Generate DB and seed example data
npx prisma migrate dev
npm run prisma:seed

# 3) Start the dev server
npm run dev

# Open http://localhost:3000
```

Default demo data
- A demo user is created during seeding: `demo@fcc.app`
- Sample clients, projects, invoices, and time entries are included so the dashboard renders immediately.

Common Scripts
--------------
- `npm run dev` — start Next.js dev server (Turbopack)
- `npm run build` — production build
- `npm start` — start the built app
- `npm run lint` — run ESLint
- `npm run prisma:seed` — seed demo data
- `npm run db:seed` — Prisma seed via `prisma db seed`
- `npm run db:reset` — reset the local SQLite DB and reseed

Project Structure
-----------------
- `app/` — routes, pages, and API endpoints (App Router)
  - `app/dashboard/` — dashboard UI and charts
  - `app/api/` — REST‑style API routes (clients, projects, time, invoices)
- `components/` — shared React components (e.g., nav tabs, to‑do board)
- `lib/` — Prisma client and helpers
- `prisma/` — Prisma schema, migrations, and seed
- `public/` — static assets

Troubleshooting
---------------
- Port already in use (3000): close the running dev server or `pkill -f "next dev"`
- Prisma client issues: `npx prisma generate`
- Reset DB: `npm run db:reset`

Contributing
------------
1) Create a feature branch: `git checkout -b feat/your-change`
2) Run lint and dev locally: `npm run lint && npm run dev`
3) Commit and push: `git commit -m "feat: describe change"` then `git push -u origin feat/your-change`
4) Open a Pull Request on GitHub

License
-------
Private project. Do not distribute without permission.
