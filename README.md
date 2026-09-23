# Mathi Collections — Dress Shop POS

Full-stack billing, inventory and shop-management system for **Mathi Collections** (dress / textile shop).

- **Frontend:** React 18 + Vite + Tailwind (client/)
- **Backend:** Node.js + Express + MongoDB (server/)
- **Stack notes:** Money is stored as integer paise; JS everywhere; local Multer file uploads; printable receipts/barcodes/invoices via CSS print styles

---

## Features

- **POS Billing** — barcode-style quick add, variant picker, item discount, bill discount (fixed/percent), coupons, loyalty points (earn/redeem), cash/UPI/card/credit splits, hold & release bills, printable 58mm/80mm/A4 receipts
- **Products & Inventory** — products with multiple variants (size/color), SKUs, barcode label sheets, stock adjustments, movement history, low-stock / out-of-stock notifications
- **Purchases** — supplier purchase orders, partial payments, pay-due, purchase returns
- **Sales** — invoice list/detail, void with auto restock, print invoice, credit/partial tracking
- **Returns** — sales returns (refund / store credit / exchange) and purchase returns
- **Customers & Suppliers** — profiles, quick-create, outstanding/credit, loyalty ledger
- **Reports** — sales, top/least products, category, payment methods, profit (vs expenses & purchases), stock value
- **Expenses** — categorized expense tracking
- **Employees** — role-based users (Admin / Manager / Cashier / Staff), password reset
- **Audit log, settings, notifications, coupons, dashboard**

---

## Getting started

### 1. Prerequisites

- Node.js >= 18 (tested on v24)
- MongoDB running locally (`mongodb://127.0.0.1:27017`)

### 2. Server

```bash
cd server
npm install
cp .env.example .env        # edit credentials if needed
npm run seed                 # optional: seed demo data
npm run dev                  # starts on port 5001
```

Default seeded login (dev only): `admin@example.com` / `admin123`
(source: `server/.env` → `SEED_ADMIN_PASSWORD`)

Environment variables (`server/.env`):

| Var | Default | Purpose |
| --- | --- | --- |
| `SERVER_PORT` | `5000` | API port (use `5001` locally) |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/mathi-collections` | database |
| `JWT_SECRET` | dev-secret | token signing (change in prod) |
| `JWT_EXPIRES_IN` | `7d` | token lifetime |
| `CLIENT_URL` | `http://localhost:5173` | CORS origin |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@example.com` / `admin123` | auto-created admin on first run |
| `NODE_ENV` | `development` | runtime mode |

> On first start the server auto-creates the admin user, default settings and
> master data (categories/sizes/colors) **only if the database is empty**.

### 3. Client

```bash
cd client
npm install
cp .env.example .env       # optional VITE_API_URL
npm run dev                # starts Vite dev server (proxies /api and /uploads to :5001)
```

Production build:

```bash
npm run build
npm run preview
```

## Deploy to Render

One web service serves both the API and the built React app.

1. **Database** — create a free cluster at MongoDB Atlas, make a database user, and copy the connection string (`mongodb+srv://<user>:<pass>@<cluster>/mathi-collections`).
2. **Push this repo** to GitHub.
3. In Render → **New → Blueprint** (or New Web Service) → select the repo.
   - Blueprint reads `render.yaml`; set the `sync: false` env vars:
     - `MONGODB_URI` = Atlas connection string
     - `JWT_SECRET` = long random string
     - `CLIENT_URL` = `https://<your-service>.onrender.com`
     - `ADMIN_EMAIL` / `ADMIN_PASSWORD` = first-run admin credentials
   - Plain Web Service: build command `npm install && npm run build`, start command `npm start`, same env vars.
4. Open the service URL → login with the admin credentials.

Notes:
- Uploads live on the ephemeral disk (cleared on redeploy); add blob storage for persistent images.
- Set `SERVER_PORT=10000` on Render if the service doesn't pick up its injected `PORT`.

---

## Tests & lint

```bash
cd server
npm test        # node --test tests/*.test.js (unit + live API when server is running)
npm run lint    # eslint src
```

---

## Project layout

```
dress-shop-pos/
├── client/
│   ├── src/
│   │   ├── api/          # REST client + per-module API wrappers
│   │   ├── components/   # shared UI (Modal, Table, Pagination, Badges, ...)
│   │   ├── constants/    # enums shared by forms
│   │   ├── contexts/     # auth context
│   │   ├── layouts/      # app shell with sidebar + topbar (notifications)
│   │   ├── pages/        # POS, Dashboard, Products, Inventory, Purchases,
│   │   │                 # Sales, Returns, Customers, Suppliers, Expenses,
│   │   │                 # Reports, Employees, Masters, Settings, Audit
│   │   └── utils/        # formatting helpers, hooks
│   └── vite.config.js    # proxy → http://localhost:5001
└── server/
    ├── src/
    │   ├── config/       # env, db
    │   ├── controllers/
    │   ├── middleware/   # auth, role, validate, errorHandler, uploads
    │   ├── models/       # mongoose schemas (Product, Variant, Sale, Purchase, ...)
    │   ├── routes/       # express routers (thin)
    │   ├── services/     # business logic (sale, purchase, return, report, ...)
    │   ├── utils/
    │   └── validators/   # zod schemas
    ├── tests/            # node:test suite
    ├── uploads/          # product images (multer, local)
    └── .env              # secrets (not committed)
```

---

## API overview

All endpoints are under `/api` and require `Authorization: Bearer <token>`
(obtained from `POST /api/auth/login`).

| Module | Routes |
| --- | --- |
| Auth | `POST /auth/login`, `GET /auth/me` |
| Products | `GET/POST /products`, `GET/PUT/DELETE /products/:id`, `POST /products/import`, barcode list |
| Inventory | `GET /inventory`, `POST /inventory/adjust`, `GET /inventory/movements` |
| Masters | `/categories`, `/brands`, `/sizes`, `/colors` (list/all/CRUD) |
| Purchases | `GET/POST /purchases`, `GET/PUT/DELETE /purchases/:id`, `POST /purchases/:id/pay-due` |
| Sales | `GET/POST /sales`, `GET /sales/:id`, `POST /sales/hold`, `GET /sales/held`, `POST /sales/held/:id/complete`, `POST /sales/:id/void`, `POST /sales/validate-coupon` |
| Returns | `GET/POST /returns/sales`, `GET/POST /returns/purchases`, `GET /returns/sale/:saleId` |
| Customers | `GET/POST /customers`, `GET/PUT/DELETE /customers/:id`, `GET /customers/search`, `POST /customers/quick` |
| Suppliers | `GET/POST /suppliers`, `GET/PUT /suppliers/:id` |
| Expenses | `GET/POST /expenses`, `PUT/DELETE /expenses/:id`, `GET /expenses/categories` |
| Reports | `/reports/sales|products|categories|payments|profit|expenses|stock-value` |
| Dashboard | `GET /dashboard` |
| Employees | `GET/POST /users`, `PUT /users/:id`, `POST /users/:id/reset-password`, `DELETE /users/:id` |
| Settings | `GET/PUT /settings` |
| Notifications | `GET /notifications`, `POST /notifications/:id/read`, `POST /notifications/read-all` |
| Coupons | `GET/POST /coupons`, `PUT/DELETE /coupons/:id` |
| Audit | `GET /audit-logs` |
| Uploads | `POST /uploads` (single/multiple image) |

Roles: `ADMIN`, `MANAGER`, `CASHIER`, `STAFF`.

---

## Notes

- **No multi-doc transactions** — MongoDB standalone; sale/purchase flows do sequential writes and compensate on failure (e.g. delete sale + vehicles on stock error).
- **Images** are served from `/uploads` and stored under `server/uploads/`.
- Reset demo data anytime: `cd server && npm run seed` (drops existing collections first).