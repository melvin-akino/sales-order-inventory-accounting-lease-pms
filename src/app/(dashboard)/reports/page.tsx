import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeTrialBalance } from "@/lib/coa";
import { ReportsClient } from "./ReportsClient";

export const dynamic = "force-dynamic";

export type ReportType = "SALES" | "AR_AGING" | "INVENTORY" | "PO_SUMMARY" | "PL";

// ── Data shapes ───────────────────────────────────────────────────────────────

export interface SalesRow {
  month: string;
  orders: number;
  revenue: number;
  vat: number;
  cwt: number;
  net: number;
}

export interface SalesByCustomer {
  name: string;
  orders: number;
  revenue: number;
}

export interface ArAgingRow {
  id: string;
  customer: string;
  issued: string;
  due: string;
  amount: number;
  paid: number;
  balance: number;
  bucket: "Current" | "1–30 d" | "31–60 d" | "61–90 d" | "90+ d";
  daysOverdue: number;
}

export interface InventoryRow {
  sku: string;
  name: string;
  category: string;
  unit: string;
  warehouse: string;
  onHand: number;
  reserved: number;
  available: number;
  reorderAt: number | null;
  belowReorder: boolean;
}

export interface PoSummaryRow {
  id: string;
  supplier: string;
  warehouse: string;
  status: string;
  expectedAt: string;
  lines: number;
  total: number;
}

export interface PlRow {
  code: string;
  name: string;
  type: string;
  balance: number;
}

export interface ReportData {
  type: ReportType;
  from: string;
  to: string;
  sales?: { monthly: SalesRow[]; byCustomer: SalesByCustomer[]; totalRevenue: number; totalOrders: number };
  arAging?: { rows: ArAgingRow[]; totalBalance: number; buckets: Record<string, number> };
  inventory?: { rows: InventoryRow[]; belowReorderCount: number; totalSkus: number };
  poSummary?: { rows: PoSummaryRow[]; byStatus: Record<string, number>; totalValue: number };
  pl?: { revenue: PlRow[]; expenses: PlRow[]; totalRevenue: number; totalExpenses: number; netIncome: number };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function monthLabel(d: Date) {
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "short" });
}

function agingBucket(daysOverdue: number): ArAgingRow["bucket"] {
  if (daysOverdue <= 0) return "Current";
  if (daysOverdue <= 30) return "1–30 d";
  if (daysOverdue <= 60) return "31–60 d";
  if (daysOverdue <= 90) return "61–90 d";
  return "90+ d";
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface Props { searchParams: { type?: string; from?: string; to?: string } }

export default async function ReportsPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session || !["FINANCE", "ADMIN"].includes(session.user.role)) redirect("/orders");

  const type = (searchParams.type ?? "SALES") as ReportType;
  const toDate = searchParams.to ?? new Date().toISOString().slice(0, 10);
  const fromDate = searchParams.from ?? new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);

  const from = new Date(fromDate + "T00:00:00");
  const to = new Date(toDate + "T23:59:59");

  let data: ReportData = { type, from: fromDate, to: toDate };

  // ── Sales Summary ──────────────────────────────────────────────────────────
  if (type === "SALES") {
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    });

    const monthMap = new Map<string, SalesRow>();
    const customerMap = new Map<string, SalesByCustomer>();

    for (const o of orders) {
      const m = monthLabel(o.createdAt);
      const rev = Number(o.subtotal);
      const vat = Number(o.vat);
      const cwt = Number(o.cwt);

      if (!monthMap.has(m)) monthMap.set(m, { month: m, orders: 0, revenue: 0, vat: 0, cwt: 0, net: 0 });
      const row = monthMap.get(m)!;
      row.orders++;
      row.revenue += rev;
      row.vat += vat;
      row.cwt += cwt;
      row.net += rev - cwt;

      const cn = o.customer.name;
      if (!customerMap.has(cn)) customerMap.set(cn, { name: cn, orders: 0, revenue: 0 });
      const cr = customerMap.get(cn)!;
      cr.orders++;
      cr.revenue += rev;
    }

    const monthly = Array.from(monthMap.values());
    const byCustomer = Array.from(customerMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    const totalRevenue = monthly.reduce((s, r) => s + r.revenue, 0);

    data.sales = { monthly, byCustomer, totalRevenue, totalOrders: orders.length };
  }

  // ── AR Aging ───────────────────────────────────────────────────────────────
  if (type === "AR_AGING") {
    const invoices = await prisma.invoice.findMany({
      where: { status: { not: "PAID" } },
      include: { customer: { select: { name: true } } },
      orderBy: { due: "asc" },
    });

    const today = new Date();
    const rows: ArAgingRow[] = invoices.map((inv) => {
      const balance = Number(inv.amount) - Number(inv.paid);
      const daysOverdue = Math.floor((today.getTime() - new Date(inv.due).getTime()) / 86400_000);
      return {
        id: inv.id,
        customer: inv.customer.name,
        issued: new Date(inv.issued).toLocaleDateString("en-PH"),
        due: new Date(inv.due).toLocaleDateString("en-PH"),
        amount: Number(inv.amount),
        paid: Number(inv.paid),
        balance,
        bucket: agingBucket(daysOverdue),
        daysOverdue,
      };
    });

    const totalBalance = rows.reduce((s, r) => s + r.balance, 0);
    const buckets: Record<string, number> = { "Current": 0, "1–30 d": 0, "31–60 d": 0, "61–90 d": 0, "90+ d": 0 };
    for (const r of rows) buckets[r.bucket] = (buckets[r.bucket] ?? 0) + r.balance;

    data.arAging = { rows, totalBalance, buckets };
  }

  // ── Inventory Snapshot ─────────────────────────────────────────────────────
  if (type === "INVENTORY") {
    const stocks = await prisma.stock.findMany({
      include: {
        sku: { select: { sku: true, name: true, category: true, unit: true } },
        warehouse: { select: { name: true } },
      },
      orderBy: [{ warehouse: { name: "asc" } }, { sku: { name: "asc" } }],
    });

    const rows: InventoryRow[] = stocks.map((s) => {
      const available = s.onHand - s.reserved;
      const belowReorder = s.reorderAt != null && s.onHand <= s.reorderAt;
      return {
        sku: s.sku.sku,
        name: s.sku.name,
        category: s.sku.category,
        unit: s.sku.unit,
        warehouse: s.warehouse.name,
        onHand: s.onHand,
        reserved: s.reserved,
        available,
        reorderAt: s.reorderAt,
        belowReorder,
      };
    });

    data.inventory = {
      rows,
      belowReorderCount: rows.filter((r) => r.belowReorder).length,
      totalSkus: new Set(rows.map((r) => r.sku)).size,
    };
  }

  // ── PO Summary ─────────────────────────────────────────────────────────────
  if (type === "PO_SUMMARY") {
    const pos = await prisma.inboundPO.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: {
        supplier: { select: { name: true } },
        warehouse: { select: { name: true } },
        lines: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const rows: PoSummaryRow[] = pos.map((po) => ({
      id: po.id,
      supplier: po.supplier.name,
      warehouse: po.warehouse.name,
      status: po.status,
      expectedAt: new Date(po.expectedAt).toLocaleDateString("en-PH"),
      lines: po.lines.length,
      total: Number(po.total),
    }));

    const byStatus: Record<string, number> = {};
    for (const r of rows) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    const totalValue = rows.reduce((s, r) => s + r.total, 0);

    data.poSummary = { rows, byStatus, totalValue };
  }

  // ── P&L ────────────────────────────────────────────────────────────────────
  if (type === "PL") {
    const jes = await prisma.journalEntry.findMany({
      where: { date: { gte: from, lte: to } },
      include: { lines: true },
    });

    const allLines = jes.flatMap((je) => je.lines.map((l) => ({ code: l.code, dr: Number(l.dr), cr: Number(l.cr) })));
    const tb = computeTrialBalance(allLines);

    const { COA, COA_BY_CODE } = await import("@/lib/coa");

    const revenue: PlRow[] = [];
    const expenses: PlRow[] = [];
    let totalRevenue = 0;
    let totalExpenses = 0;

    for (const acct of COA) {
      if (acct.type === "REVENUE" || acct.type === "EXPENSE") {
        const raw = tb[acct.code] ?? 0;
        const balance = acct.normal === "DR" ? raw : -raw;
        const row: PlRow = { code: acct.code, name: acct.name, type: acct.type, balance };
        if (acct.type === "REVENUE") {
          revenue.push(row);
          totalRevenue += balance;
        } else {
          expenses.push(row);
          totalExpenses += balance;
        }
      }
    }

    data.pl = { revenue, expenses, totalRevenue, totalExpenses, netIncome: totalRevenue - totalExpenses };
  }

  return <ReportsClient data={data} />;
}
