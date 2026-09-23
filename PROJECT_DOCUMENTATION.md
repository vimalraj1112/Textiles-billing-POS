# Mathi Collections — Dress Shop POS (A–Z Documentation)

Complete documentation for the **dress shop Point-of-Sale / Billing / Inventory** system built with the **MERN stack**.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Data Model (Database)](#4-data-model-database)
5. [Business Rules & Money Handling](#5-business-rules--money-handling)
6. [Enums & Constants](#6-enums--constants)
7. [Roles & Permissions](#7-roles--permissions)
8. [REST API Reference](#8-rest-api-reference)
9. [Frontend (Client)](#9-frontend-client)
10. [Authentication & Security](#10-authentication--security)
11. [Notifications & Audit Logs](#11-notifications--audit-logs)
12. [Key Workflows](#12-key-workflows)
13. [Feature List (A–Z of what the app can do)](#13-feature-list-az-of-what-the-app-can-do)
14. [Bugs Found & Fixed (development history)](#14-bugs-found--fixed-development-history)
15. [Tests & Lint](#15-tests--lint)
16. [Setup & Run](#16-setup--run)
17. [Demo Credentials & Seed Data](#17-demo-credentials--seed-data)
18. [Operational Notes & Gotchas](#18-operational-notes--gotchas)

---

## 1. Project Overview

**Mathi Collections** is a complete retail-management application for a dress/textile shop. It covers:

- **Billing (POS)** — fast billing, multiple payment methods, credit sales, coupons, hold & release bills.
- **Products & Variants** — products with size/colour variants, SKU, barcode, purchase/selling price, tax, minimum stock.
- **Inventory** — stock per variant, stock movements ledger, manual adjustments, low/out-of-stock alerts.
- **Purchases & Purchase Returns** — supplier billing, dues tracking, stock increase on purchase, reversal on returns.
- **Sales & Sales Returns** — invoices, void/cancel with automatic restock, returns with refund/store credit/exchange.
- **Customers & Suppliers** — profiles, outstandings, loyalty points.
- **Expenses** — categorised operational expenses.
- **Reports** — sales, products, categories, payments, profit, expenses, stock value.
- **Employees (Users) & Roles** — ADMIN, MANAGER, CASHIER, STAFF with route + API-level permission checks.
- **Masters** — categories, brands, sizes, colours.
- **Coupons** — flat/percentage discount coupons.
- **Settings** — shop details, receipt layout, taxes, loyalty rules.
- **Audit Logs** — every important action is recorded.
- **Notifications** — low stock, out-of-stock, pending/overdue payments, supplier dues, large returns.

### Tech Summary
| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router 6, TanStack Query v5, axios, zod, react-hook-form, react-hot-toast, recharts, lucide-react |
| Backend | Node.js, Express 4, Mongoose 8, JWT (jsonwebtoken), bcryptjs, zod validation, multer (uploads), helmet, cors, morgan, express-rate-limit |
| Database | MongoDB (Mongoose, standalone — no replica set, so **no multi-doc transactions**) |
| Tooling | ESLint + Prettier, `node --test` test runner, nodemon |

---

## 2. Tech Stack

**Monorepo layout:**
```
dress-shop-pos/
├── client/            # React + Vite frontend (port 5173)
│   ├── src/
│   │   ├── api/            # axios instance + all API modules
│   │   ├── components/     # shared UI components
│   │   ├── constants/      # roles, stock labels, report ranges
│   │   ├── context/        # AuthContext
│   │   ├── hooks/          # useDebounce
│   │   ├── layouts/        # AppLayout (sidebar shell)
│   │   ├── pages/          # feature pages
│   │   └── utils/          # money/date formatting
│   └── vite.config.js      # dev server *proxies* /api and /uploads → http://localhost:5001
├── server/            # Express backend (port 5001)
│   ├── src/
│   │   ├── config/         # db connection (+ optional seed guard)
│   │   ├── constants/      # enums
│   │   ├── controllers/    # route handlers
│   │   ├── middleware/     # auth, role guard, error handler, upload
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # route definitions
│   │   ├── services/       # business logic
│   │   ├── utils/          # helpers
│   │   ├── validators/     # zod schemas
│   │   ├── seed.js         # demo data seeder
│   │   └── server.js       # entry point
│   └── tests/              # node:test unit + integration tests
└── README.md / PROJECT_DOCUMENTATION.md
```

**Ports**
- Backend dev: **5001** (`server/.env` → `SERVER_PORT=5001`)
- Frontend dev: **5173** (Vite; proxies API calls to 5001)
- Port **5000** is used by an unrelated project (`D:\studies\VJ_Pdf`) — never touch those processes.

---

## 3. Project Structure

### Server (`server/src`)
```
config/         appConfig?/mongoose connection
constants/      index.js — all enums
controllers/    auth, dashboard, product, inventory, customer, supplier, purchase,
                sale, return, expense, report, user, audit, settings, notification,
                coupon, master, upload
middleware/     authMiddleware (verify JWT), requireRole, errorHandler, notFound,
                uploadMiddleware (multer)
models/         User, Product, ProductVariant, Customer, Supplier, Purchase,
                Sale(+Payment), Return(+Sales/PurchaseReturn), Expense, Coupon,
                Category, Brand, Size, Color, Setting, AuditLog, Notification,
                InventoryMovement, LoyaltyTransaction
routes/         one router per resource
services/       authService, productService, inventoryService, saleService,
                purchaseService, returnService, expenseService, reportService,
                notificationService, settingsService, loyaltyService, auditService,
                masterService, dashboardService, couponService
validators/     zod schemas per resource (authValidator, productValidator,
                inventoryValidator, customerValidator, supplierValidator,
                purchaseValidator, saleValidator, returnValidator,
                expenseValidator, reportValidator, userValidator,
                settingsValidator, couponValidator, masterValidator, uploadValidator)
utils/          numberFormatting, pagination, id helpers, etc.
seed.js         demo data (categories, brands, sizes, colours, products, admin user)
server.js       entry — mounts middleware, routes, starts server
```

### Client (`client/src`)
```
api/          client.js (axios + interceptors), index.js (all resource APIs),
              queryClient.js (react-query defaults)
components/   Badge, Button, ConfirmDialog, EmptyState, ErrorState, Input, Loading,
              Modal, PageHeader, Pagination, ProtectedRoute, SearchBox, Select, Table
context/      AuthContext (user, token, login, logout, hasRole)
layouts/      AppLayout (sidebar + header + notification bell)
pages/        Login, Dashboard, pos/{POS, InvoiceReceipt}, products/{Products,
              ProductForm, ProductDetail, BarcodeLabels}, inventory/{Inventory,
              Movements}, masters/MasterList, purchases/{Purchases, PurchaseForm,
              PurchaseDetail}, suppliers/{Suppliers, SupplierDetail}, customers/
              {Customers, CustomerDetail}, sales/{Sales, SaleDetail}, returns/Returns,
              expenses/Expenses, reports/Reports, employees/Employees,
              settings/{Settings, AuditLogs}
utils/        format.js (paise→INR, dates)
```

---

## 4. Data Model (Database)

All monetary values are stored as **paise (integer)**. Timestamps on every schema.

### User
`name`, `email` (unique), `password` (hashed), `role` (ADMIN/MANAGER/CASHIER/STAFF), `isActive`, `lastLoginAt`.

### Product
`name`, `sku` (unique), `category` (ref), `subcategory`, `brand` (ref), `description`, `material`, `gender`, `taxRate`, `supplier` (ref), `purchasePrice`, `sellingPrice`, `discount`, `minimumStock`, `images[]`, `status` (ACTIVE/INACTIVE).

### ProductVariant
`product` (ref, required), `size` (ref Size), `color` (ref Color), `sku`, `barcode`, `purchasePrice`, `sellingPrice`, `stock` (min 0), `minimumStock`, `status`.
**Unique index:** `{ product, size, color }` → one variant per product/size/colour combination.

### Category / Brand / Size / Color (Masters)
Simple documents: `name` (unique) + `color.hex`. Soft behaviour via active flag.

### Customer
`name`, `phone`, `email`, `address`, `city`, `state`, `pincode`, `notes`, `loyaltyPoints`, `totalPurchases`, `outstandingAmount`, `status`.

### Supplier
`name`, `phone`, `email`, `address`, `company`, `gstin`, `outstandingAmount`, `status`, plus contact fields.

### Sale
`invoiceNumber` (unique), `customer` (ref), `items[]` (variant, product, name, size, color, quantity, unitPrice, discount, tax, subtotal, base), `subtotal`, `discount`, `tax`, `grandTotal`, `amountPaid`, `amountDue`, `paymentMethod`, `paymentStatus` (PAID/PARTIAL/PENDING), `isCredit`, `coupon`, `couponDiscount`, `loyaltyPointsEarned`, `status` (COMPLETED/HELD/CANCELLED), `notes`, `createdBy`, `saleDate`.

### Payment (embedded in sale or separate sub-collection)
Payments against a sale: amount, method, date — supports split and partial payments.

### Purchase
`purchaseNumber`, `supplier` (ref), `items[]` (product, variant, name, sku, size, color, quantity, unitPrice, tax, subtotal), `subtotal`, `discount`, `tax`, `total`, `paidAmount`, `dueAmount`, `paymentStatus` (PAID/PARTIAL/PENDING), `paymentMethod`, `purchaseDate`, `createdBy`, `notes`.

### SalesReturn / PurchaseReturn
`returnNumber`, linked `sale`/`purchase`, `customer`/`supplier`, `items[]` (saleItem/product/variant reference, name, quantity, unitPrice, refundAmount), `reason` (enum), `action` (REFUND/STORE_CREDIT/EXCHANGE for sales), `refundAmount`, `paymentMethod`, `note`, `createdBy`, `returnedAt`.

### Expense
`description`, `amount`, `category` (enum), `expenseDate`, `paymentMethod`, `referenceNumber`, `notes`, `createdBy`.

### Coupon
`code` (unique), `type` (FLAT/PERCENTAGE), `value`, `minOrderAmount`, `maxDiscount`, `usageLimit`, `usedCount`, `startsAt`, `expiresAt`, `isActive`.

### InventoryMovement
`variant` (ref), `product` (ref), `type` (PURCHASE/SALE/SALE_RETURN/PURCHASE_RETURN/DAMAGE/ADJUSTMENT/TRANSFER), `quantity` (signed), `before`, `after`, `reason`, `referenceType`, `referenceId`, `user`, `createdAt`.

### LoyaltyTransaction
`customer` (ref), `type` (EARN/REDEEM/ADJUST), `points`, `sale` (ref), `balanceAfter`, `note`.

### Setting
Single doc `{ key: 'app', value: { ... } }` with defaults below.

### AuditLog
`user` (ref), `action`, `entity`, `entityId`, `details`, `ip`, `createdAt`.

### Notification
`user` (ref) or `role` target, `type`, `title`, `message`, `read` (bool), `link`, `createdAt`.

---

## 5. Business Rules & Money Handling

### Money
- **All prices/totals are integers of paise** server-side (`89900` = ₹899.00).
- Client formats with `utils/format.js` (e.g. `formatMoney`, `formatDate`).
- Client inputs parse rupees → paise before sending and format paise → rupees on display.

### Document numbering
- Invoices: `<prefix>-<year>-<6-digit-seq>` → `INV-2026-000005` (prefix from settings).
- Purchases: `PUR-000001`, Returns: `RET-000001`, etc. (sequential counters, unique + indexed).
- Coupons equal discount: a `FLAT` coupon with `value = discount` or percentage applied on subtotal — validated server-side before checkout applies.

### Stock rules
- Selling **decreases** variant stock; voiding a sale / creating a sales return **increases** it back (compensating movement recorded).
- Purchase **increases** stock; purchase return **decreases** it.
- Every stock change writes an `InventoryMovement` row (before/after/signed quantity).
- Manual **adjustments** (`/inventory/adjust`) support `allowNegativeStock` flag; default throws if stock would go below 0.
- `stockStatus` is computed per variant:
  - `stock <= 0` → `OUT_OF_STOCK`
  - `stock <= minimumStock` → `LOW_STOCK`
  - otherwise → `IN_STOCK`

### Sales & credit
- `PAID` when `amountDue === 0`, `PARTIAL` when partially paid, `PENDING` when nothing paid.
- Credit sales create an **outstanding** for the customer (`customer.outstandingAmount`); payments settle it.
- Coupon validation endpoint (`/sales/validate-coupon`) checks code, active window, min-order and returns the discount before you charge.

### Hold / release
- Sale can be created as **HELD** (`/sales/hold`) → stock is **reserved** (decrement + movement marked).
- Held bill is completed later via `/sales/held/:id/complete` (finalise payment + invoice).
- Voiding a held bill releases stock.

### Loyalty (settings-driven)
- Points **earned** on shopping; points **redeemed** against an amount threshold; redemption credited/updated on customer; transaction logged in `LoyaltyTransaction`.
- Drives customer `loyaltyPoints` and `totalPurchases`.

### No transactions
MongoDB standalone → sequential writes + compensating deletes (drop the movement/record if the parent save fails).

---

## 6. Enums & Constants

Defined in `server/src/constants/index.js` (mirrored in client `constants/index.js` where needed):

- **Roles:** `ADMIN`, `MANAGER`, `CASHIER`, `STAFF`
- **Product status:** `ACTIVE`, `INACTIVE`
- **Stock status:** `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`
- **Payment methods:** `Cash`, `UPI`, `Card`, `Bank Transfer`, `Credit`
- **Payment status:** `PAID`, `PARTIAL`, `PENDING`
- **Credit status:** `PAID`, `PARTIAL`, `PENDING`, `OVERDUE`
- **Movement types:** `PURCHASE`, `SALE`, `SALE_RETURN`, `PURCHASE_RETURN`, `DAMAGE`, `ADJUSTMENT`, `TRANSFER`
- **Return reasons:** `Size Issue`, `Color Issue`, `Defective`, `Customer Request`, `Wrong Product`, `Other`
- **Return action:** `REFUND`, `STORE_CREDIT`, `EXCHANGE`
- **Expense categories:** `Rent`, `Electricity`, `Salary`, `Internet`, `Transport`, `Maintenance`, `Marketing`, `Packaging`, `Other`
- **Genders:** `Male`, `Female`, `Unisex`, `Kids`
- **Materials:** `Cotton`, `Silk`, `Polyester`, `Linen`, `Wool`, `Nylon`, `Rayon`, `Other`
- **Audit actions:** `LOGIN`, `LOGOUT`, `CREATE/UPDATE/DELETE_PRODUCT`, `CREATE/UPDATE/DELETE_CATEGORY`, `CREATE_SALE`, `CANCEL_SALE`, `RETURN_SALE`, `CREATE_PURCHASE`, `UPDATE_STOCK`, `CREATE/UPDATE_CUSTOMER`, `CREATE/UPDATE_SUPPLIER`, `CREATE_EXPENSE`, `UPDATE_SETTINGS`, `CREATE/UPDATE_COUPON`, `CREATE/UPDATE/DELETE_USER`, `HOLD_BILL`
- **Notification types:** `LOW_STOCK`, `OUT_OF_STOCK`, `PENDING_PAYMENT`, `OVERDUE_PAYMENT`, `SUPPLIER_DUE`, `LARGE_RETURN`, `SYSTEM`

**Default masters (seeded):**
- Categories: Sarees, Kurtis, Chudidars, Lehengas, Shirts, T-Shirts, Jeans, Kids Wear, Night Wear, Inner Wear, Accessories, Other
- Sizes: XS, S, M, L, XL, XXL, XXXL, Free Size
- Colours: Red, Blue, Green, Yellow, Black, White, Pink, Orange, Purple, Grey (with hex)

**Settings defaults (`settingsService.DEFAULTS`):**
```json
{
  "shopName": "Mathi Collections",
  "address": "", "phone": "", "email": "", "gstin": "", "logo": "",
  "invoicePrefix": "INV", "currency": "INR", "defaultPaymentMethod": "Cash",
  "receiptSize": "80mm", "autoPrint": true, "allowNegativeStock": false,
  "returnPolicy": "Items can be returned within 7 days with the original bill.",
  "invoiceFooter": "Thank you for shopping with Mathi Collections!",
  "loyaltyPointsPerRupee": 100, "loyaltyRupeePerPoint": 1, "loyaltyMinRedemption": 100,
  "taxRate": 0
}
```

---

## 7. Roles & Permissions

| Action | ADMIN | MANAGER | CASHIER | STAFF |
|---|---|---|---|---|
| Dashboard, POS, Sales, Sales Detail | ✔ | ✔ | ✔ | ✔ |
| Products (view/create/edit/delete) | ✔ | ✔ | ✔ (view) | — |
| Inventory view / movements | ✔ | ✔ | ✔ | ✔ |
| Inventory **adjust** | ✔ | ✔ | ✖ | ✖ |
| Purchases (view/create/pay) | ✔ | ✔ | — | — |
| Purchases view | ✔ | ✔ | — | — |
| Customers / Suppliers | ✔ | ✔ | ✔ | ✔ |
| Returns | ✔ | ✔ | ✔ | — |
| Expenses | ✔ | ✔ | — | — |
| Reports (all incl. sales/profit/payments) | ✔ | ✔ | ✖ (403) | ✖ |
| Employees (users) | ✔ | ✖ | ✖ | ✖ |
| Audit logs | ✔ | ✖ | ✖ | ✖ |
| Coupons (create/update/delete) | ✔ | ✔ | ✖ | ✖ |
| Settings (update) | ✔ | ✔ | ✖ | ✖ |
| Masters (categories/brands/sizes/colours) | ✔ | ✔ | — | — |

Key points:
- **Role checks happen on the API**, not just the UI — the frontend hides menus, the backend rejects with **403**.
- CASHIER is blocked from `/reports/sales`, `/users`, `/audit-logs`, and coupon write endpoints (verified by tests).
- STAFF has view-only access to most modules and no reports.

---

## 8. REST API Reference

All routes are mounted under `/api`. Notification response shape is `{ ...pagination, unread }` (`data.items`, `data.total`, `data.unread`). List responses are paginated `{ items, total, page, limit, pages }`.

### Auth
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/api/auth/login` | public | returns `{ token, user }` |
| GET | `/api/auth/me` | any auth | current user |
| POST | `/api/auth/logout` | any auth | logs audit |

### Dashboard
| GET | `/api/dashboard` | any auth | today's sales, counts, low-stock, recent activity |

### Products
| GET/POST | `/api/products` | auth | list (paginated + search) / create |
| GET/PUT/DELETE | `/api/products/:id` | auth | read / update / delete |
| POST | `/api/products/variants` | auth | add variant |
| PUT/DELETE | `/api/products/:id/variants/:variantId` | auth | update / remove variant |
| GET | `/api/products/search/pos` | auth | POS search |

### Masters (categories / brands / sizes / colors)
| GET/POST | `/api/categories` | auth | paginated list / create |
| PUT/DELETE | `/api/categories/:id` | auth | update / delete |
| GET | `/api/categories/all` | auth | **raw active array** (for dropdowns) |

> Note: the master router is mounted at `/api` (`app.use('/api', masterRoutes)`), so paths are exactly `/api/categories`, `/api/brands`, `/api/sizes`, `/api/colors`.

### Inventory
| GET | `/api/inventory` | auth | paginated, `search`, `stockStatus` filter |
| GET | `/api/inventory/movements` | auth | ledger |
| POST | `/api/inventory/adjust` | ADMIN/MANAGER | body `{ variantId, quantity, reason, allowNegative }` |
| GET | `/api/inventory/low-stock` | auth | list for alerts |

### Customers
| GET/POST | `/api/customers` | auth | list (search) / create |
| GET/PUT | `/api/customers/:id` | auth | read / update |
| GET | `/api/customers/search` | auth | quick search `?q=` |
| POST | `/api/customers/quick` | auth | quick-create from POS |

### Suppliers
| GET/POST | `/api/suppliers` | auth | list / create |
| GET/PUT | `/api/suppliers/:id` | auth | read / update |

### Purchases
| GET/POST | `/api/purchases` | auth | list (with filters) / create |
| GET | `/api/purchases/:id` | auth | detail + items |
| POST | `/api/purchases/:id/pay` | auth | record payment, settle dues |

### Sales
| GET/POST | `/api/sales` | auth | list (filters) / create |
| GET | `/api/sales/:id` | auth | detail incl. payments |
| POST | `/api/sales/validate-coupon` | auth | `{ code, subTotal }` → discount |
| POST | `/api/sales/hold` | auth | create HELD bill (reserves stock) |
| GET | `/api/sales/held` | auth | list held bills |
| POST | `/api/sales/held/:id/complete` | auth | finalise held bill |
| POST | `/api/sales/:id/void` | auth | cancel + restock + audit |

### Returns
| POST | `/api/returns/sales` | auth | create sales return (restock + adjust outstandings) |
| GET | `/api/returns/sales` | auth | list |
| GET | `/api/returns/sale/:saleId` | auth | what's returnable from a sale |
| POST | `/api/returns/purchases` | auth | create purchase return |
| GET | `/api/returns/purchases` | auth | list |

### Expenses
| GET/POST | `/api/expenses` | auth | list / create |
| PUT/DELETE | `/api/expenses/:id` | auth | update / delete |
| GET | `/api/expenses/categories` | auth | enum list |

### Reports
| GET | `/api/reports/sales` | ADMIN/MANAGER | sales by range/category/status |
| GET | `/api/reports/products` | ADMIN/MANAGER | top products |
| GET | `/api/reports/categories` | ADMIN/MANAGER | category performance |
| GET | `/api/reports/payments` | ADMIN/MANAGER | payment-method breakdown |
| GET | `/api/reports/profit` | ADMIN/MANAGER | revenue − cost, by period |
| GET | `/api/reports/expenses` | ADMIN/MANAGER | expenses by category |
| GET | `/api/reports/stock-value` | ADMIN/MANAGER | inventory valuation |

Date filters use `from`/`to` (ISO) or pre-built ranges `today|yesterday|this_week|this_month|this_year`.

### Users (Employees)
| GET/POST | `/api/users` | ADMIN only | list / create |
| PUT/DELETE | `/api/users/:id` | ADMIN only | update / delete |
| POST | `/api/users/:id/reset-password` | ADMIN only | set new password |

### Audit Logs
| GET | `/api/audit-logs` | ADMIN only | paginated + filters |

### Settings
| GET | `/api/settings` | any auth | returns merged defaults + saved |
| PUT | `/api/settings` | ADMIN/MANAGER | update (validator: receiptSize enum, loyalty numbers, taxRate 0–100, booleans) |

> There is **no POST** `/api/settings` (a POST returns 404 — that is expected, not a bug).

### Notifications
| GET | `/api/notifications` | any auth | paginated + `unread` count |
| POST | `/api/notifications/read-all` | any auth | mark all read |
| POST | `/api/notifications/:id/read` | any auth | mark one read |

### Coupons
| GET/POST | `/api/coupons` | auth(ADMIN/MANAGER for writes) | list / create |
| PUT/DELETE | `/api/coupons/:id` | ADMIN/MANAGER | update / delete |

### Uploads
| POST | `/api/uploads` | auth | multer multi-file image upload → `/uploads/...` (served statically) |

---

## 9. Frontend (Client)

### Routing (`App.jsx`)
```
/login
/                    → Dashboard (protected)
/pos                 → POS (billing)
/products            → product list
/products/new        → create product
/products/barcode-labels → print barcode labels
/products/:id        → detail
/products/:id/edit   → edit
/inventory           → stock list + adjust
/inventory/movements → stock ledger
/categories /brands /sizes /colors → master lists
/purchases           → list
/purchases/new       → purchase form
/purchases/:id       → detail + pay
/suppliers           → list
/suppliers/:id       → detail
/customers           → list
/customers/:id       → detail (incl. balance)
/sales               → list
/sales/:id           → invoice detail
/returns             → returns hub (sales + purchase)
/expenses            → expenses
/reports             → report tabs (sales/products/payments/profit + extra routes)
/employees           → user management
/audit-logs          → audit trail
/settings            → shop settings
```

### Key components
- **ProtectedRoute** — wraps `AppLayout`; redirects to `/login` if no token.
- **AppLayout** — sidebar navigation, header, notification bell (polls `/notifications`, shows unread badge).
- **Table / Pagination / SearchBox / Select / Badge / Modal / ConfirmDialog / Loading / EmptyState / ErrorState / Input / Button / PageHeader** — reusable UI kit (Tailwind, consistent look).
- **POS.jsx + InvoiceReceipt.jsx** — product grid + cart + coupon + payment section; receipt can be auto-printed per `settings.autoPrint` & `receiptSize` (58mm/80mm/A4).

### State & data
- **AuthContext** — persists `mathi_token` + `mathi_user` in localStorage; `login`, `logout`, `hasRole`.
- **api/client.js (axios)** — base URL `/api`, injects `Authorization: Bearer <token>`, on **401** clears session & redirects to login, unwraps `data.data`.
- **queryClient.js** — React Query with sensible defaults (staleTime, retry, etc.).
- Pages use `useQuery`/`useMutation` from TanStack Query v5.

---

## 10. Authentication & Security

- Passwords hashed with **bcryptjs**.
- Login returns a **JWT** (`JWT_EXPIRES_IN` default 7d) + user object.
- `authMiddleware` verifies `Bearer` token on every protected route.
- `requireRole(...)` guards admin-only / manager+ routes — returns **403** for insufficient roles.
- `express-rate-limit` on auth endpoints.
- **helmet** security headers; **cors** allows `CLIENT_URL`; request logging via **morgan**.
- `server.js` has a top-level `process.on('uncaughtException', ...)` guard so a stray error doesn't silently kill the process.
- Zod validators reject unexpected/missing fields and sanitise input (e.g. `description` fields, money as integers).

---

## 11. Notifications & Audit Logs

**Notifications** are created automatically by services:
- Low stock / out of stock (on sales, purchases, adjustments) — message includes product + size + colour label.
- Pending / overdue customer payments.
- Supplier dues on purchases and payments.
- Large returns.
- System messages.

**Audit logs** on every important action: login/logout, product create/update/delete, category CRUD, sale create/cancel/return, purchase create, stock update, customer/supplier/expense changes, settings updates, coupon CRUD, user CRUD, hold bill. Stored with action, entity, entityId, details, IP, user.

---

## 12. Key Workflows

### POS checkout
1. Search products (barcode/name/code → `/products/search/pos`).
2. Add variants (size/colour) → cart.
3. Optional coupon → `/sales/validate-coupon`.
4. Choose customer (existing / quick-create), payment method.
5. Select quantity, discounts; total computed in paise.
6. Create sale → stock decremented, movement logged, invoice `INV-YYYY-NNNNNN`, loyalty points earned, outstandings updated on credit, notification on low/out-of-stock, audit `CREATE_SALE`.
7. Print receipt (respects `autoPrint`/`receiptSize`).

### Hold / resume
- During checkout, "Hold Bill" → stock reserved, sale `HELD`.
- `/sales/held` lists held bills → "Complete" finalises payment and prints invoice.

### Void a sale
- `/sales/:id/void` → status `CANCELLED`, **stock restored**, movement logged, audit `CANCEL_SALE`.

### Sales return
- Pick a sale → `/returns/sale/:id` lists returnable line items → create return
- Choose reason + action (REFUND / STORE_CREDIT / EXCHANGE)
- Stock restored; if credit sale, outstandings adjusted; `RET-…` number generated; notification if large.

### Purchase
- Select supplier → add items (product/variant/qty/unit cost/tax) → total
- Pay full/partial → `paidAmount`/`dueAmount`, `PUR-…` number, stock **increases**, supplier due tracked.

### Purchase return
- Reverse unpaid/returned items → stock decreased, `RET-…` for purchase, supplier due adjusted.

### Stock adjustment
- `POST /inventory/adjust` with `{ variantId, quantity(±), reason, allowNegative }`
- Writes movement + optional notification; manager/admin only.

---

## 13. Feature List (A–Z of what the app can do)

- **A — Audit Logs**: full trail of user/entity actions for admins.
- **B — Barcodes**: per-variant barcode + barcode-label printing page.
- **B — Brands** (master), **C — Categories/Colours** (masters, colour picker with palette).
- **C — Coupons**: flat/percentage, min order, max discount, expiry, usage limits.
- **C — Credit Sales**: partial/pending payment with per-customer outstandings.
- **C — Customers**: profiles, search, quick-create at POS, credit, loyalty points.
- **D — Dashboard**: today's sales/orders/customers, low-stock alerts, charts.
- **E — Employees**: create users, roles, reset passwords, activate/deactivate.
- **E — Expenses**: categorised expense tracking and reports.
- **H — Hold & Release**: park billing sessions, resume and complete later.
- **I — Inventory**: live stock, statuses, adjust, full movement ledger.
- **L — Loyalty**: earn/redeem points, threshold, per-customer balance.
- **N — Notifications**: unread badge, low/out-of-stock, pending/overdue dues.
- **P — POS**: fast billing screen with search, variants, coupons, payments, print.
- **P — Products**: rich catalogue with multi-image, tax, material/gender, prices.
- **P — Purchases**: supplier billing with payments, stock-in, purchase returns.
- **R — Receipts**: configurable size (58mm/80mm/A4), auto-print, shop footer/return policy.
- **R — Reports**: sales, products, categories, payments, profit, expenses, stock value.
- **R — Returns**: sales returns (refund/store credit/exchange) + purchase returns.
- **R — Roles & Permissions**: 4 roles enforced server + client side.
- **S — Settings**: shop profile, GSTIN, invoice prefix, taxes, loyalty, receipts.
- **S — Sizes** (master) + **Suppliers**: profiles, dues, purchase history.
- **S — Search**: debounced search everywhere (`useDebounce`).
- **U — Uploads**: product image uploads served statically.
- **V — Variants**: size + colour bundles with own SKU/barcode/price/stock.
- **V — Void**: cancel any sale with instant restock.

---

## 14. Bugs Found & Fixed (development history)

This section records the notable bugs discovered and fixed while building/verifying the app.

1. **Sales could not be created at all (NaN CastError).**
   `saleService.loadCartItems` never added the item `base` too the lines array while it did add `discount/tax/subtotal`. Result: `base` was `undefined`, `itemsSubtotal` became `NaN`, and `Sale.create` threw a Mongoose CastError ("NaN casts to Number failed") on every checkout. **Fix:** push `base: totals.base` for every cart line. Then full, partial, held and coupon sales all verified end-to-end.

2. **Master routes were doubly-prefixed (`/api/categories/categories`).**
   `app.js` mounted the master router at `/api/categories` while the router itself defined `/categories`, `/brands`, etc. **Fix:** mount once: `app.use('/api', masterRoutes)`.

3. **`stockStatus` was always `{}` in inventory responses.**
   `inventoryService.getStockStatus` was declared `async` but called **without `await`** in `inventoryController.listInventory`, so each item's `stockStatus` serialised as an empty object instead of a string. Symptoms: Status badge blank on the Inventory page and the In/Low/Out stock filter never matched anything. **Fix:** made `getStockStatus` synchronous; verified filter returns correct counts (`IN_STOCK` 56 / `LOW_STOCK` 21 / `OUT_OF_STOCK` 3).

4. **Settings page stuck on the loading skeleton.**
   The page seeded its form state via `useQuery`'s `onSuccess`, which does not fire reliably (removed/deprecated) in TanStack Query v5, especially when data comes from the cache. **Fix:** seed the form from `data` inside a `useEffect` (`if (data && form === null) setForm({...emptyForm(), ...data})`).

5. **Login falsely reported "Email is required / Password is required" with correct autofilled credentials.**
   The old `Login.jsx` used `react-hook-form`, which only tracks its own onChange values — browser auto-fill left React-Hook-Form state empty while fields *looked* filled, so `zodResolver` flagged "required". It also spread RHF `ref` onto a non-forwardRef `Input` ("Function components cannot be given refs"). **Fix:** rewrote `Login.jsx` as controlled `useState` inputs, `z.string().trim().email()`, `noValidate` form.

6. **Expenses silently dropped notes.**
   `Expenses.jsx` sent/rendered field `note`, but the schema/validator use `description`; zod stripped `note`. **Fix:** use `description` in save mutation, edit dialog, and table column.

7. **Inventory adjustment created bad `user` references.**
   `inventoryService.adjustStock` passed the request user object straight into the movement doc. **Fix:** normalise — `user && user._id ? user._id : (user || null)`.

8. **Notification messages for low/out-of-stock printed ObjectIds.**
   **Fix:** build a label from product name + size name + colour name.

9. **Server would silently die / look "stuck".**
   Added `process.on('uncaughtException', …)` to `server.js`. Also noted a recurring operational cause: a **stale Node process holding port 5001** (`EADDRINUSE`) meant the frontend kept talking to old code — restart the backend after edits and check `server-pid.txt`.

10. **Client-side checks.** The client `vite build` is run after every change; both `client` and `server` ESLint pass (0 errors; only warnings from unused variables remain).

---

## 15. Tests & Lint

```bash
cd server
npm run lint          # ESLint (0 errors)
npm test              # node --test tests/*.test.js
```

**Test files (`server/tests/`):**
- `pagination.test.js` — pagination defaults (limit 20, clamp at 200) and page/limit parsing.
- `validators.test.js` — zod validators accept good payloads and reject bad ones (settings, coupons, users, etc.).
- `stockStatus.test.js` — inventory `getStockStatus` sync logic across thresholds.
- `integration.test.js` — live-server E2E: login, auth/me, customer create, sale create, void restock, settings, links. Skips gracefully when the server is down.

**Result:** 17/17 tests pass.

Also verified manually via the live API: full sale, partial credit sale (due ₹1,618.20, PARTIAL, loyalty points earned, customer outstanding updated), callbacks → notifications created, void restores stock, hold → release flow, `RET-000001`, `PUR-000001` (stock 0→10), coupon create+validate (`DIWALI10`), expenses, all reports, user create/reset-password/login, settings update, audit trail summary, and role 403s for CASHIER on reports/users/audit/coupons.

---

## 16. Setup & Run

Requirements: Node.js 18+ (developed on **v24**), MongoDB running locally.

### Backend
```bash
cd server
cp .env.example .env        # then edit: SERVER_PORT=5001, MONGODB_URI, JWT_SECRET
npm install
npm run seed                # optional: load demo data + admin user
npm run dev                 # nodemon, or: npm start
```

### Frontend
```bash
cd client
npm install
npm run dev                 # http://localhost:5173 (proxies /api + /uploads → :5001)
npm run build               # production bundle
```

### Env vars (`server/.env`)
| Var | Default | Meaning |
|---|---|---|
| `SERVER_PORT` | 5000 | API port (**use 5001** here) |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/mathi-collections` | DB connection |
| `JWT_SECRET` | — | signing secret (change in prod) |
| `JWT_EXPIRES_IN` | `7d` | token lifetime |
| `CLIENT_URL` | `http://localhost:5173` | CORS origin |
| `NODE_ENV` | development | |

Client `.env.example` supports `VITE_*` vars if needed (defaults work out of the box).

---

## 17. Demo Credentials & Seed Data

`npm run seed` (in `server/`) creates demo categories/brands/sizes/colours, ~10 products with variants, and default users:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `admin123` (overridable via `SEED_ADMIN_PASSWORD`) |

Hyperlinked demo records that can exist after testing: invoices `INV-2026-000005…000008`, returns `RET-000001`, purchase `PUR-000001`, coupon `DIWALI10`, a test expense, and a test cashier `cashier@test.com` / `newpass456`.

To reset everything to a clean demo state: `npm run seed` again.

---

## 18. Operational Notes & Gotchas

- **Money is integer paise everywhere on the server** — never send rupee decimals to the API.
- **MongoDB standalone → no transactions.** Business logic uses sequential writes + compensating writes; do not wrap multi-step flows in `session`.
- **Port 5000** belongs to `VJ_Pdf` processes on this machine — don't kill them; the POS backend lives on **5001**.
- **After editing server code**, restart the backend. If `http://localhost:5001/api/health` doesn't answer, check for `EADDRINUSE` (stale process) before starting a new one; record the new PID in `server/server-pid.txt` and tail `server-out.log` / `server-err.log`.
- **Dev-server slowness / "always loading"** is usually the stale-process problem above (browser hitting the old server), not the code.
- **Settings page** relies on GET `/api/settings`; there is intentionally no POST route.
- **Inventory filter** requires the current server build (status is computed in JS per page, min/max clamping applies).
- **Hard-refresh** (`Ctrl+Shift+R`) after a client rebuild to clear Vite/HMR cache of pre-fix JS.
```
```