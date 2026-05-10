import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildCSV, csvResponse } from "@/lib/csv";
import { computeTrialBalance, COA } from "@/lib/coa";
import type { ReportType } from "@/app/(dashboard)/reports/page";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["FINANCE", "ADMIN"].includes(session.user.role))
    return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") ?? "SALES") as ReportType;
  const toDate = searchParams.get("to") ?? new Date().toISOString().slice(0, 10);
  const fromDate = searchParams.get("from") ?? new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const from = new Date(fromDate + "T00:00:00");
  const to = new Date(toDate + "T23:59:59");
  const today = new Date().toISOString().slice(0, 10);

  if (type === "SALES") {
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { customer: { select: { name: true } }, agent: { select: { name: true } }, warehouse: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    });
    const rows = orders.map((o) => ({
      "Order ID": o.id, "Date": new Date(o.createdAt).toLocaleDateString("en-PH"),
      "Customer": o.customer.name, "Agent": o.agent?.name ?? "", "Warehouse": o.warehouse.name,
      "Status": o.state, "Subtotal": Number(o.subtotal).toFixed(2),
      "VAT": Number(o.vat).toFixed(2), "CWT": Number(o.cwt).toFixed(2), "Total": Number(o.total).toFixed(2),
    }));
    return csvResponse(buildCSV(rows), `report-sales-${fromDate}-${toDate}.csv`);
  }

  if (type === "AR_AGING") {
    const invoices = await prisma.invoice.findMany({
      where: { status: { not: "PAID" } },
      include: { customer: { select: { name: true } } },
      orderBy: { due: "asc" },
    });
    const today2 = new Date();
    const rows = invoices.map((inv) => {
      const balance = Number(inv.amount) - Number(inv.paid);
      const daysOverdue = Math.floor((today2.getTime() - new Date(inv.due).getTime()) / 86400_000);
      const bucket = daysOverdue <= 0 ? "Current" : daysOverdue <= 30 ? "1–30 d" : daysOverdue <= 60 ? "31–60 d" : daysOverdue <= 90 ? "61–90 d" : "90+ d";
      return { "Invoice ID": inv.id, "Customer": inv.customer.name, "Issued": new Date(inv.issued).toLocaleDateString("en-PH"), "Due": new Date(inv.due).toLocaleDateString("en-PH"), "Amount": Number(inv.amount).toFixed(2), "Paid": Number(inv.paid).toFixed(2), "Balance": balance.toFixed(2), "Days Overdue": daysOverdue > 0 ? daysOverdue : 0, "Bucket": bucket };
    });
    return csvResponse(buildCSV(rows), `report-ar-aging-${today}.csv`);
  }

  if (type === "INVENTORY") {
    const stocks = await prisma.stock.findMany({
      include: { sku: { select: { sku: true, name: true, category: true, unit: true } }, warehouse: { select: { name: true } } },
      orderBy: [{ warehouse: { name: "asc" } }, { sku: { name: "asc" } }],
    });
    const rows = stocks.map((s) => ({
      "SKU Code": s.sku.sku, "Product": s.sku.name, "Category": s.sku.category,
      "Unit": s.sku.unit, "Warehouse": s.warehouse.name,
      "On Hand": s.onHand, "Reserved": s.reserved, "Available": s.onHand - s.reserved,
      "Reorder At": s.reorderAt ?? "", "Status": s.reorderAt != null && s.onHand <= s.reorderAt ? "LOW STOCK" : "OK",
    }));
    return csvResponse(buildCSV(rows), `report-inventory-${today}.csv`);
  }

  if (type === "PO_SUMMARY") {
    const pos = await prisma.inboundPO.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { supplier: { select: { name: true } }, warehouse: { select: { name: true } }, lines: true },
      orderBy: { createdAt: "desc" },
    });
    const rows = pos.map((po) => ({
      "PO ID": po.id, "Supplier": po.supplier.name, "Warehouse": po.warehouse.name,
      "Status": po.status, "Expected": new Date(po.expectedAt).toLocaleDateString("en-PH"),
      "Lines": po.lines.length, "Total": Number(po.total).toFixed(2),
    }));
    return csvResponse(buildCSV(rows), `report-po-${fromDate}-${toDate}.csv`);
  }

  if (type === "PL") {
    const jes = await prisma.journalEntry.findMany({
      where: { date: { gte: from, lte: to } },
      include: { lines: true },
    });
    const allLines = jes.flatMap((je) => je.lines.map((l) => ({ code: l.code, dr: Number(l.dr), cr: Number(l.cr) })));
    const tb = computeTrialBalance(allLines);
    const rows = COA
      .filter((a) => a.type === "REVENUE" || a.type === "EXPENSE")
      .map((a) => {
        const raw = tb[a.code] ?? 0;
        const balance = a.normal === "DR" ? raw : -raw;
        return { "Code": a.code, "Account": a.name, "Type": a.type, "Balance": balance.toFixed(2) };
      });
    return csvResponse(buildCSV(rows), `report-pl-${fromDate}-${toDate}.csv`);
  }

  return new Response("Invalid report type", { status: 400 });
}
