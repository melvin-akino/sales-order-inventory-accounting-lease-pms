# MediSupply PMS

Full-stack sales order, inventory, equipment lease & PMS application for medical supplies (Philippines market).

**Stack:** Next.js 14 App Router · TypeScript · PostgreSQL (Supabase) · Prisma ORM · NextAuth · TanStack Query · Supabase Realtime · Tailwind CSS

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | **18 or later** |
| npm | 9+ |
| PostgreSQL | via [Supabase](https://supabase.com) (free tier works) |

> Your current Node.js must be **v18+**. Check with `node -v`. Download from https://nodejs.org if needed.

---

## Setup

### 1. Clone & install

```bash
git clone https://github.com/melvin-akino/sales-order-inventory-accounting-lease-pms.git
cd sales-order-inventory-accounting-lease-pms
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:

```
# Supabase → Settings → Database → Connection string (Transaction mode for DATABASE_URL, Session mode for DIRECT_URL)
DATABASE_URL="postgresql://postgres.xxx:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Supabase → Settings → API
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."

# NextAuth — generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-32-byte-secret"
NEXTAUTH_URL="http://localhost:3000"

NEXT_PUBLIC_APP_NAME="MediSupply PMS"
NEXT_PUBLIC_ORG="MediSupply"
```

### 3. Push schema & seed

```bash
npm run db:push      # push Prisma schema to Supabase
npm run db:seed      # seed demo data
```

### 4. Run dev server

```bash
npm run dev
```

Open http://localhost:3000

---

## Demo accounts

All demo passwords: `password123`

| Email | Role |
|---|---|
| admin@medisupply.ph | ADMIN |
| finance@medisupply.ph | FINANCE |
| agent@medisupply.ph | AGENT |
| warehouse@medisupply.ph | WAREHOUSE |
| tech@medisupply.ph | TECHNICIAN |
| procurement@stlukes.com.ph | CUSTOMER |

---

## Modules

| Module | Path | Roles |
|---|---|---|
| Sales Orders | `/orders` | All |
| Approvals | `/approvals` | FINANCE, ADMIN |
| Warehouse Kanban | `/warehouse` | WAREHOUSE, ADMIN |
| Shipments | `/shipments` | WAREHOUSE, FINANCE, ADMIN |
| Inventory | `/inventory` | WAREHOUSE, ADMIN |
| Leases | `/leases` | FINANCE, ADMIN, CUSTOMER |
| PMS / Work Orders | `/pms` | TECHNICIAN, WAREHOUSE, ADMIN |
| Catalog | `/catalog` | AGENT, FINANCE, ADMIN |
| Customers | `/customers` | AGENT, FINANCE, ADMIN |
| Suppliers | `/suppliers` | WAREHOUSE, FINANCE, ADMIN |
| Ledger | `/ledger` | FINANCE, ADMIN |
| Settings | `/settings` | ADMIN |

---

## Order State Machine

```
PENDING → APPROVED (Finance/Admin)
       → PREPARING (Warehouse/Admin)
       → SHIPPED (Warehouse/Admin)
       → DELIVERED (Warehouse/Admin/Finance)

Any non-terminal state → CANCELLED (Finance/Admin)
```

---

## Production

```bash
npm run build
npm start
```

Set `NEXTAUTH_URL` to your production domain.
