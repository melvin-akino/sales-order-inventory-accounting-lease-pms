import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeTrialBalance } from "@/lib/coa";
import { DashboardClient } from "./DashboardClient";
import type { Role } from "@prisma/client";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = session.user.role as Role;

  // Customer has no dashboard — send to portal
  if (role === "CUSTOMER") redirect("/portal");

  // ── ADMIN: full view ──────────────────────────────────────────────────────
  if (role === "ADMIN") {
    const [orderCounts, invoiceSummary, billSummary, stockAlerts, birDue, recentOrders, recentJe, allJeLines] =
      await Promise.all([
        prisma.order.groupBy({ by: ["state"], _count: { state: true } }),
        prisma.invoice.findMany({ where: { status: { not: "PAID" } }, select: { amount: true, paid: true, status: true } }),
        prisma.bill.findMany({ where: { status: { not: "PAID" } }, select: { amount: true, paid: true, status: true } }),
        prisma.stock.findMany({ where: { reorderAt: { not: null } }, include: { sku: { select: { name: true } }, warehouse: { select: { name: true } } } }),
        prisma.birFiling.count({ where: { status: "DUE" } }),
        prisma.order.findMany({ take: 6, orderBy: { createdAt: "desc" }, select: { id: true, state: true, total: true, createdAt: true, customer: { select: { name: true } } } }),
        prisma.journalEntry.findMany({ take: 6, orderBy: { date: "desc" }, select: { id: true, date: true, source: true, memo: true, lines: { select: { dr: true } } } }),
        prisma.journalLine.findMany({ select: { code: true, dr: true, cr: true } }),
      ]);

    const tb = computeTrialBalance(allJeLines.map(l => ({ code: l.code, dr: Number(l.dr), cr: Number(l.cr) })));
    const arOpen = invoiceSummary.reduce((s, i) => s + Number(i.amount) - Number(i.paid), 0);
    const arOverdue = invoiceSummary.filter(i => i.status === "OVERDUE").reduce((s, i) => s + Number(i.amount) - Number(i.paid), 0);
    const apOpen = billSummary.reduce((s, b) => s + Number(b.amount) - Number(b.paid), 0);
    const apOverdue = billSummary.filter(b => b.status === "OVERDUE").reduce((s, b) => s + Number(b.amount) - Number(b.paid), 0);
    const lowStock = stockAlerts.filter(s => s.onHand <= (s.reorderAt ?? 0));

    return (
      <DashboardClient
        role="ADMIN"
        orderPipeline={["PENDING","APPROVED","PREPARING","SHIPPED","DELIVERED"].map(s => ({
          state: s, count: orderCounts.find(o => o.state === s)?._count.state ?? 0,
        }))}
        ar={{ open: arOpen, overdue: arOverdue }}
        ap={{ open: apOpen, overdue: apOverdue }}
        birDue={birDue}
        lowStockCount={lowStock.length}
        lowStockItems={lowStock.slice(0, 5).map(s => ({ name: s.sku.name, warehouse: s.warehouse.name, onHand: s.onHand, reorderAt: s.reorderAt! }))}
        trialBalance={tb}
        recentOrders={recentOrders.map(o => ({ id: o.id, state: o.state, customerName: o.customer.name, total: Number(o.total), createdAt: o.createdAt.toISOString() }))}
        recentJe={recentJe.map(j => ({ id: j.id, date: j.date.toISOString(), source: j.source, memo: j.memo, amount: j.lines.reduce((s, l) => s + Number(l.dr), 0) }))}
      />
    );
  }

  // ── FINANCE ───────────────────────────────────────────────────────────────
  if (role === "FINANCE") {
    const [invoiceSummary, billSummary, birDue, recentJe, allJeLines] = await Promise.all([
      prisma.invoice.findMany({ where: { status: { not: "PAID" } }, select: { amount: true, paid: true, status: true, due: true, customer: { select: { name: true } }, id: true } }),
      prisma.bill.findMany({ where: { status: { not: "PAID" } }, select: { amount: true, paid: true, status: true, due: true, vendor: true, id: true } }),
      prisma.birFiling.count({ where: { status: "DUE" } }),
      prisma.journalEntry.findMany({ take: 8, orderBy: { date: "desc" }, select: { id: true, date: true, source: true, memo: true, lines: { select: { dr: true } } } }),
      prisma.journalLine.findMany({ select: { code: true, dr: true, cr: true } }),
    ]);

    const tb = computeTrialBalance(allJeLines.map(l => ({ code: l.code, dr: Number(l.dr), cr: Number(l.cr) })));
    const arOpen = invoiceSummary.reduce((s, i) => s + Number(i.amount) - Number(i.paid), 0);
    const arOverdue = invoiceSummary.filter(i => i.status === "OVERDUE").reduce((s, i) => s + Number(i.amount) - Number(i.paid), 0);
    const apOpen = billSummary.reduce((s, b) => s + Number(b.amount) - Number(b.paid), 0);
    const apOverdue = billSummary.filter(b => b.status === "OVERDUE").reduce((s, b) => s + Number(b.amount) - Number(b.paid), 0);
    const overdueInvoices = invoiceSummary.filter(i => i.status === "OVERDUE").slice(0, 5);

    return (
      <DashboardClient
        role="FINANCE"
        ar={{ open: arOpen, overdue: arOverdue }}
        ap={{ open: apOpen, overdue: apOverdue }}
        birDue={birDue}
        trialBalance={tb}
        recentJe={recentJe.map(j => ({ id: j.id, date: j.date.toISOString(), source: j.source, memo: j.memo, amount: j.lines.reduce((s, l) => s + Number(l.dr), 0) }))}
        overdueInvoices={overdueInvoices.map(i => ({ id: i.id, customerName: (i as { customer?: { name: string } }).customer?.name ?? "—", amount: Number(i.amount) - Number(i.paid), due: (i as { due: Date }).due.toISOString() }))}
      />
    );
  }

  // ── AGENT ─────────────────────────────────────────────────────────────────
  if (role === "AGENT") {
    const agentId = session.user.id;
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [allMyOrders, thisMonthCount, customerCount, recentOrders] = await Promise.all([
      prisma.order.groupBy({ by: ["state"], where: { agentId }, _count: { state: true } }),
      prisma.order.count({ where: { agentId, createdAt: { gte: startOfMonth } } }),
      prisma.customer.count(),
      prisma.order.findMany({ where: { agentId }, take: 8, orderBy: { createdAt: "desc" }, select: { id: true, state: true, total: true, createdAt: true, customer: { select: { name: true } } } }),
    ]);

    const totalOrders = allMyOrders.reduce((s, o) => s + o._count.state, 0);
    const pendingCount = allMyOrders.find(o => o.state === "PENDING")?._count.state ?? 0;

    return (
      <DashboardClient
        role="AGENT"
        agentStats={{ total: totalOrders, pending: pendingCount, thisMonth: thisMonthCount, customers: customerCount }}
        recentOrders={recentOrders.map(o => ({ id: o.id, state: o.state, customerName: o.customer.name, total: Number(o.total), createdAt: o.createdAt.toISOString() }))}
        orderPipeline={["PENDING","APPROVED","PREPARING","SHIPPED","DELIVERED"].map(s => ({
          state: s, count: allMyOrders.find(o => o.state === s)?._count.state ?? 0,
        }))}
      />
    );
  }

  // ── WAREHOUSE ─────────────────────────────────────────────────────────────
  if (role === "WAREHOUSE") {
    const [orderCounts, stockAlerts, recentOrders] = await Promise.all([
      prisma.order.groupBy({ by: ["state"], where: { state: { in: ["APPROVED","PREPARING","SHIPPED"] } }, _count: { state: true } }),
      prisma.stock.findMany({ where: { reorderAt: { not: null } }, include: { sku: { select: { name: true, sku: true } }, warehouse: { select: { name: true } } }, orderBy: { onHand: "asc" }, take: 8 }),
      prisma.order.findMany({ where: { state: { in: ["APPROVED","PREPARING"] } }, take: 8, orderBy: { createdAt: "asc" }, select: { id: true, state: true, total: true, createdAt: true, customer: { select: { name: true } } } }),
    ]);

    const lowStock = stockAlerts.filter(s => s.onHand <= (s.reorderAt ?? 0));

    return (
      <DashboardClient
        role="WAREHOUSE"
        orderPipeline={["APPROVED","PREPARING","SHIPPED"].map(s => ({
          state: s, count: orderCounts.find(o => o.state === s)?._count.state ?? 0,
        }))}
        lowStockCount={lowStock.length}
        lowStockItems={lowStock.slice(0, 6).map(s => ({ name: s.sku.name, warehouse: s.warehouse.name, onHand: s.onHand, reorderAt: s.reorderAt! }))}
        recentOrders={recentOrders.map(o => ({ id: o.id, state: o.state, customerName: o.customer.name, total: Number(o.total), createdAt: o.createdAt.toISOString() }))}
      />
    );
  }

  // ── TECHNICIAN ────────────────────────────────────────────────────────────
  if (role === "TECHNICIAN") {
    const techId = session.user.technicianId;
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [myWos, doneThisMonth] = await Promise.all([
      prisma.workOrder.findMany({
        where: techId ? { technicianId: techId } : {},
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: 10,
        include: { asset: { select: { name: true, serialNumber: true } } },
      }),
      prisma.workOrder.count({
        where: { ...(techId ? { technicianId: techId } : {}), status: "COMPLETED", completedAt: { gte: startOfMonth } },
      }),
    ]);

    const open = myWos.filter(w => w.status !== "COMPLETED").length;
    const overdue = myWos.filter(w => w.status !== "COMPLETED" && w.dueDate && w.dueDate < new Date()).length;

    return (
      <DashboardClient
        role="TECHNICIAN"
        woStats={{ open, overdue, doneThisMonth }}
        myWorkOrders={myWos.map(w => ({
          id: w.id, title: w.title, status: w.status, priority: w.priority,
          assetName: w.asset.name, serialNumber: w.asset.serialNumber,
          dueDate: w.dueDate?.toISOString() ?? null,
        }))}
      />
    );
  }

  // ── DRIVER ────────────────────────────────────────────────────────────────
  if (role === "DRIVER") {
    const shipments = await prisma.shipment.findMany({
      where: { order: { state: "SHIPPED" } },
      include: { order: { select: { id: true, customer: { select: { name: true } }, total: true } } },
      orderBy: { eta: "asc" },
      take: 10,
    });

    return (
      <DashboardClient
        role="DRIVER"
        myShipments={shipments.map(s => ({
          id: s.id, orderId: s.orderId, customerName: s.order.customer.name,
          trackingNumber: s.trackingNumber, eta: s.eta?.toISOString() ?? null,
          total: Number(s.order.total),
        }))}
      />
    );
  }

  redirect("/orders");
}
