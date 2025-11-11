# TRACKwo — Freelancer Command Center

Modern freelancers need one cockpit for tracking time, managing clients, shipping invoices, and understanding runway. TRACKwo stitches those workflows together on top of Next.js 15 and Prisma so you can get productive fast without sacrificing code quality.

## Features

- Insightful dashboard with six‑month revenue charting, status donuts, and KPI cards
- CRM‑light client/project management including archiving, hand‑off, and task boards
- Real‑time and manual time tracking plus CSV exports and per‑project rollups
- Invoice generation with line items, partial payments, PDF exports, and status automation
- Lucia‑powered authentication with email/password login, signup, and password reset
- SQLite + Prisma schema, migrations, and seed data for reproducible local environments

## Tech Stack

- Next.js 15 (App Router + Turbopack dev server)
- React 19
- Prisma 6 with SQLite (switchable to PostgreSQL)
- Tailwind CSS 4
- pdf-lib for server‑side invoice PDFs

## Getting Started

### Prerequisites

- Node.js 20 LTS (minimum 18.18)
- npm (ships with Node)

### Local Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env # if provided
   ```

   Update `DATABASE_URL` (SQLite by default) and any other secrets.

3. **Apply migrations & seed sample data**

   ```bash
   npx prisma migrate dev
   npm run prisma:seed
   ```

4. **Start the dev server**

   ```bash
   npm run dev
   ```

   Visit <http://localhost:3000>.

The seed script creates a demo workspace with mock clients, projects, invoices, and time entries so that charts render immediately.

### Useful Scripts

- `npm run dev` — Next.js dev server (Turbopack)
- `npm run build` — production build
- `npm start` — run the compiled app
- `npm run lint` — ESLint
- `npm run prisma:seed` — seed data
- `npm run db:seed` — alternative Prisma seeding entrypoint
- `npm run db:reset` — wipe & reseed the local database

## Project Structure

- `app/` — routes, layouts, and API endpoints
  - `app/(auth)` — marketing, login, signup, password reset
  - `app/(app)` — authenticated dashboard, clients, projects, invoices, time
  - `app/api` — REST endpoints for data operations
- `components/` — shared UI primitives (nav tabs, boards, cards)
- `lib/` — Prisma client, auth helpers, utility modules
- `prisma/` — schema, migrations, and seed scripts
- `public/` — static assets

## Troubleshooting

- **Port 3000 in use**: stop the existing dev server or `pkill -f "next dev"`.
- **Prisma client mismatch**: run `npx prisma generate`.
- **Reset data**: `npm run db:reset` (drops the SQLite file and reseeds).

## Contributing

1. Create a branch — `git checkout -b feat/awesome-improvement`
2. Develop & lint — `npm run dev` and `npm run lint`
3. Commit & push — `git commit -m "feat: add awesome improvement"` then `git push -u origin feat/awesome-improvement`
4. Open a Pull Request

## License

This codebase is provided for public reference. Adapt or redistribute according to your organization’s policies.
