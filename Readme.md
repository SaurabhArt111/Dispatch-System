# Dispatch Management System

A real-time Dispatch Management System that consumes Delivery Challans (DC) from an
external "System 1", then manages the full operational flow:

```
System 1 → Dispatch Backend → MongoDB → Godown Screen / Godown Users / Dispatch Office
  → Packing → Roll Creation → QR Generation → QR Scanning → Vehicle Loading → Dispatch
```

Built with React + Vite (plain CSS, no Tailwind), Node.js + Express, MongoDB + Mongoose,
and Socket.IO for real-time updates. Ships as an installable PWA with a light/dark theme.

---

## 1. Project structure

```
dispatch-management/
├── backend/            Express API, MongoDB models, Socket.IO, mock System 1
├── frontend/           React + Vite PWA (dashboard, godown TV screen, dispatch office…)
├── docker-compose.yml  Optional local MongoDB for development
├── package.json        Convenience scripts to run both apps
└── README.md
```

## 2. Prerequisites

- Node.js 18+ and npm
- A MongoDB instance — any of:
  - Local MongoDB (`mongod`), or
  - `docker compose up -d` (starts MongoDB in Docker, see `docker-compose.yml`), or
  - A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

## 3. Setup

```bash
# 1. Install dependencies for both apps
npm run install:all

# 2. Configure environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit backend/.env if your MongoDB URI or secrets differ from the defaults

# 3. Seed demo data (roles, users, godowns, vehicles, sample Delivery Challans)
npm run seed

# 4. Run the backend (Express + Socket.IO) — http://localhost:5000
npm run dev:backend

# 5. In a second terminal, run the frontend — http://localhost:5173
npm run dev:frontend
```

Open **http://localhost:5173** and log in with any demo account below.

### Production build

```bash
npm run build:frontend   # outputs frontend/dist — serve as static files / behind a CDN
npm run start:backend    # runs backend/src/server.js with node
```

## 4. Demo credentials

Password for every account: **`Password@123`**

| Role | Email |
|---|---|
| Super Admin | `superadmin@dispatch.local` |
| Admin | `admin@dispatch.local` |
| Dispatch Manager | `dispatch.manager@dispatch.local` |
| Dispatch Operator | `dispatch.operator@dispatch.local` |
| Godown Manager (godown S-28 only) | `godown.manager@dispatch.local` |
| Godown Operator (godown S-17 only) | `godown.operator@dispatch.local` |
| Viewer (read-only) | `viewer@dispatch.local` |

## 5. Key features & where to find them

- **System 1 integration** — `backend/src/services/mockSystem1.js` simulates the external
  DC source. Real integration only requires editing `backend/src/services/system1Service.js`
  and setting `SYSTEM1_API_URL` / `SYSTEM1_API_KEY` / `USE_MOCK_SYSTEM1=false` in `.env`.
  System 1 can also push DCs directly via webhook: `POST /api/webhooks/system1/dc`
  (HMAC-signed with `SYSTEM1_WEBHOOK_SECRET`). Every sync attempt is recorded on the
  **Sync Log** page, including a "Trigger mock DC" button to see the real-time pipeline live.
- **Never re-keying DC data** — System 1's `sourceId` is the dedupe key
  (`backend/src/services/dcIngestService.js`); a DC already imported is never touched again,
  protecting all local operational data (packing, rolls, QR, statuses, etc).
- **Godown Screen (TV)** — visit `/godown-screen/<CODE>` (e.g. `/godown-screen/S-28`) on any
  TV/browser. Generate a one-time pairing code from **Admin → Godowns & Screens**, enter it
  once on the screen, and it never needs to log in again. New jobs push instantly via
  Socket.IO with a highlighted row, a top-right popup, and a sound.
- **RBAC** — 8 roles (Super Admin, Admin, Dispatch Manager, Dispatch Operator, Godown
  Manager, Godown Operator, Viewer, Godown Screen) with granular permissions
  (`backend/src/models/Role.js`). Godown-scoped roles only see their assigned godowns.
- **Packing & Rolls** — from a job's "Manage" screen, split a DC item's quantity into
  individual rolls; mismatched totals require an authorized override with a reason.
- **QR** — generated per roll (not per DC), containing enough data to look up DC, customer,
  item, roll, quantity, godown and status. Includes a scan page (camera or manual entry)
  that blocks re-scanning an already-scanned/loaded/dispatched roll.
- **Vehicle loading** — Dispatch Office lets you start a loading session against a DC +
  vehicle, scan each expected roll in, and only allows "Dispatched" once every roll is
  verified loaded.
- **Transfers** — request a job's transfer to another godown; the receiving godown must
  confirm receipt before the job continues.
- **Auth** — short-lived access tokens + long-lived, revocable refresh-token sessions
  (no daily login). Admins can disable a user, force logout, or revoke individual sessions.
- **Audit & Sync logs** — every sensitive action and every DC sync attempt is recorded.
- **Theme** — light/dark toggle in the top bar (persisted per browser), plus an automatic
  large-type "TV mode" on the Godown Screen for readability from a distance.
- **PWA** — installable on desktop/mobile, offline app shell via a generated service worker,
  and a custom app icon (see `frontend/public/icons`).

## 6. MongoDB models

`User, Role, Godown, GodownScreen, DeliveryChallan, DeliveryItem, GodownJob, Transfer, Roll,
QRCode, Vehicle, Dispatch, Notification, Session, AuditLog, SyncLog` — all in
`backend/src/models/`.

## 7. Notes & next steps for production

- Set strong values for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `SCREEN_PAIRING_SECRET`
  and `SYSTEM1_WEBHOOK_SECRET` in `backend/.env` before deploying.
- Point `SYSTEM1_API_URL` / `SYSTEM1_API_KEY` at the real System 1 and set
  `USE_MOCK_SYSTEM1=false` once that API is available; no other code changes are required.
- Add HTTPS/TLS termination (e.g. via a reverse proxy) in front of both apps in production.
- The Google Sheets fallback mentioned in the spec can be added as another adapter
  alongside `system1Service.js`, feeding into the same `ingestDC()` pipeline.
