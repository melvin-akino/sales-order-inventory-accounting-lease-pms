# Vital Sign · Ops — Implementation Plan

> Medical-supply ERP for Philippine healthcare distributors.
> Stack: Next.js 14 · TypeScript · Prisma 5 · Supabase PostgreSQL · NextAuth · Tailwind CSS

---

## Project overview

A full-stack operations platform covering the complete order-to-cash and procure-to-pay cycles for a multi-warehouse medical-supply business in the Philippines. Modules span sales order management, warehouse operations, equipment leasing, preventive maintenance, and double-entry accounting with BIR compliance.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 (strict mode) |
| ORM | Prisma 5 with Supabase PostgreSQL |
| Auth | NextAuth v4 (credentials provider, 7 roles) |
| Styling | Tailwind CSS 3 + custom CSS design system |
| State | React 18 `useTransition` + `router.refresh()` pattern |
| Deployment | Docker (standalone Next.js build) |
| Database | Supabase PostgreSQL (pooled via PgBouncer) |

---

## Roles

| Role | Access |
|------|--------|
| `ADMIN` | Full access to all modules |
| `FINANCE` | Orders (read), Approvals, Leases, Accounting |
| `AGENT` | Orders (create/read), Catalog, Customers |
| `WAREHOUSE` | Warehouse, Inventory, Shipments, PMS, Suppliers |
| `TECHNICIAN` | PMS / Work orders |
| `CUSTOMER` | Leases (own records only) |
| `DRIVER` | Shipments (assigned only) |

---

## Phase 1 — Core Application ✅ COMPLETE

### 1.1 Auth & Layout
- NextAuth credentials provider with bcrypt password hashing
- 7-role RBAC enforced at middleware and page level
- Sidebar navigation (role-filtered), topbar, app shell
- Responsive CSS design system (CSS custom properties + Tailwind)

### 1.2 Sales Orders
- Order creation with line items (SKU, qty, price, VAT 12%, CWT 2%)
- Order pipeline: DRAFT → SUBMITTED → APPROVED → PICKING → SHIPPED → COMPLETE → CANCELLED
- Order events timeline (actor + timestamp)
- Approve / reject server actions

### 1.3 Approvals
- Finance review queue for submitted orders
- Approve / reject with notes

### 1.4 Warehouse & Inventory
- Multi-warehouse stock levels (MNL, CEB, DVO)
- Stock movements: RECEIPT / PICK / TRANSFER / ADJUSTMENT / RETURN
- Reorder threshold alerts
- Inbound POs and inter-warehouse transfers

### 1.5 Shipments
- Courier assignment, tracking number, ETA
- POD (proof of delivery) URL upload
- Shipment status tracking

### 1.6 Catalog
- Product / SKU master with unit price, brand, unit of measure
- Role-gated editing (ADMIN only)

### 1.7 Customers & Suppliers
- Customer master: TIN, credit limit, payment terms, contact info, region
- Supplier master: lead times, status (ACTIVE / ON_HOLD / INACTIVE)

### 1.8 Leases
- Equipment lease contracts with monthly rates
- Lease assets (many assets per lease)
- Lease status: ACTIVE / EXPIRED / TERMINATED

### 1.9 PMS / Work Orders
- Preventive maintenance scheduling
- Work order types: PREVENTIVE / CORRECTIVE / INSTALLATION
- Priority: LOW / MEDIUM / HIGH / URGENT
- Technician assignments, work order notes

### 1.10 Settings
- System configuration (ADMIN only)

### 1.11 Data Infrastructure
- Comprehensive Prisma schema with all field names aligned across schema, pages, and seed
- Realistic Philippine seed data: 8 hospitals, 4 suppliers, 12 SKUs, 6 orders, full WO history

---

## Phase 1.5 — Accounting Module ✅ COMPLETE

Implemented as an 8-tab full accounting system accessible to FINANCE and ADMIN roles.

### Chart of Accounts (`src/lib/coa.ts`)
- 32 PH-flavored accounts: Assets (1000–1510), Liabilities (2000–2300), Equity (3000–3100), Revenue (4000–4900), Expenses (5000–5700)
- Philippine-specific accounts: Output VAT Payable, Input VAT, CWT Receivable, SSS/PhilHealth/Pag-IBIG Payable, BIR Withholding Tax
- Opening balances in PHP for all accounts
- `computeTrialBalance()` — applies journal lines to opening balances

### Database Models
- `JournalEntry` — date, source (AR/AP/BANK/PAYROLL/INV/GL/OPENING), ref, memo, posted-by user
- `JournalLine` — jeId, account code, DR amount, CR amount
- `Invoice` — AR invoice linked to customer and optionally to a Sales Order
- `Bill` — AP bill linked to supplier or free-text vendor
- `BirFiling` — BIR tax form compliance tracking

### Seed Data
- 14 journal entries (covering AR, payroll, COGS, bank, inventory, opening)
- 11 AR invoices across 8 hospital customers (OPEN / PARTIAL / OVERDUE / PAID)
- 8 AP bills (supplier invoices + utilities: Meralco, Maynilad, PLDT)
- 6 BIR filings (2550M, 2550Q, 1601-EQ, 1601-C, 0619-E, 1701Q)

### 8-Tab Accounting UI (`src/app/(dashboard)/ledger/`)
| Tab | Features |
|-----|---------|
| Overview | P&L bar chart, 4 KPI cards, action items, recent journals |
| Journal | Expandable JE accordion, source filter chips, search |
| General Ledger | COA sidebar with type filter, per-account running balance |
| Receivables | AR aging buckets (5 columns), invoice table with subtabs |
| Payables | AP stat cards, due-in-7-days, bill table with subtabs |
| Trial Balance | Grouped by account type, balance check |
| Statements | Income Statement (PFRS), Balance Sheet, Cash Flow (indirect) |
| BIR Filings | Form badges, compliance calendar, eFPS link |

---

## Phase 2 — Workflows & Dashboard 🚧 IN PROGRESS

### 2.1 Journal Entry Form ✅
- Modal with dynamic line items (add/remove rows)
- Account code selector with COA grouped by type
- Balanced DR/CR validation before submission
- Server action: `createJournalEntry`

### 2.2 Invoice Generation from Sales Order ✅
- Button on approved order detail page
- Auto-creates Invoice + AR journal entry (Dr AR / Cr Revenue + Output VAT)
- Server action: `generateInvoiceFromOrder`

### 2.3 Payment Recording ✅
- "Record Payment" modal on invoices (AR) and bills (AP)
- Auto-creates bank journal entry
- Updates paid amount and status (PARTIAL → PAID when fully settled)
- Server actions: `recordInvoicePayment`, `recordBillPayment`

### 2.4 BIR Filing Submission ✅
- "Mark Filed" modal with eFPS confirmation reference number
- Server action: `markBirFiled`

### 2.5 Executive Dashboard ✅
- KPI cards: revenue, AR, AP, cash position
- Order pipeline funnel (count by status)
- Low stock alerts
- BIR deadline countdown
- Recent activity feed (orders + journal entries)

### 2.6 PDF Export 🔲
- Invoice PDF (jsPDF or react-pdf)
- Financial statements export

### 2.7 Notifications 🔲
- In-app alerts for overdue invoices, BIR deadlines, reorder points
- Polling or Server-Sent Events

### 2.8 Audit Log 🔲
- Full activity trail for financial transactions
- Immutable event log (BIR compliance requirement)

### 2.9 Multi-currency 🔲
- USD/EUR purchase orders with PHP conversion
- Exchange rate table

### 2.10 Report Builder 🔲
- Custom date-range financial reports
- CSV / Excel export

---

## Phase 3 — Integrations (planned)

| # | Feature |
|---|---------|
| 3.1 | BIR eFPS API integration (auto-submit returns) |
| 3.2 | Supabase Realtime for live order updates |
| 3.3 | Email notifications (Resend / SendGrid) |
| 3.4 | SMS alerts for drivers (Semaphore PH) |
| 3.5 | Mobile-responsive PWA |
| 3.6 | QuickBooks / Xero sync |

---

## File structure

```
src/
  app/
    (auth)/login/          — login page
    (dashboard)/
      dashboard/           — executive dashboard (Phase 2)
      orders/              — sales order queue + detail
      approvals/           — finance approval queue
      warehouse/           — stock movements
      shipments/           — courier tracking
      inventory/           — multi-warehouse stock
      catalog/             — product master
      customers/           — customer CRM
      suppliers/           — supplier master
      leases/              — equipment leases
      pms/                 — preventive maintenance
      ledger/              — accounting (8 tabs)
        actions.ts         — server actions (JE, payments, BIR)
        page.tsx           — server component (data fetching)
        AccountingClient.tsx — client component (UI)
      settings/
    api/
      auth/[...nextauth]/  — NextAuth handler
      health/              — Docker health check
  components/layout/       — Sidebar, Topbar, AppShell
  lib/
    auth.ts                — NextAuth config
    prisma.ts              — Prisma singleton
    coa.ts                 — Chart of accounts + computeTrialBalance
    utils.ts               — peso(), fmtDate(), cn(), etc.
  types/                   — shared TypeScript types
prisma/
  schema.prisma            — full data model
  seed.ts                  — realistic Philippine seed data
```

---

## Setup

### Prerequisites
- Node.js 20+
- Supabase project (free tier works)
- Docker (for containerized deployment)

### Local development

```bash
# 1. Clone and install
git clone <repo>
cd sales-order-inventory-accounting-pms
npm install

# 2. Configure environment
cp .env.example .env
# Fill in DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, etc.

# 3. Push schema and seed
npm run db:push
npm run db:seed

# 4. Start dev server
npm run dev
```

### Docker deployment

```bash
# Build and run
docker compose up --build -d

# View logs
docker compose logs -f app

# Run migrations inside container
docker compose exec app npx prisma migrate deploy
```

### Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase pooled connection (port 6543, pgbouncer=true) |
| `DIRECT_URL` | Supabase direct connection (port 5432, for migrations) |
| `NEXTAUTH_SECRET` | Random 32-byte base64 secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | App URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `NEXT_PUBLIC_ORG` | Organisation name displayed in the sidebar |

---

## Current status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1 — Core modules | ✅ Complete | All 11 modules live |
| Phase 1.5 — Accounting | ✅ Complete | 8-tab accounting module |
| Phase 2 — Workflows | 🚧 In progress | JE form, payments, BIR, dashboard |
| Phase 3 — Integrations | 🔲 Planned | |
