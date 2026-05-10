import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PortalClient } from "./PortalClient";

export default async function PortalPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!session.user.customerId) redirect("/orders");

  const customerId = session.user.customerId;

  const [customer, orders, invoices, leases, quotations] = await Promise.all([
    prisma.customer.findUniqueOrThrow({ where: { id: customerId } }),
    prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        shipment: { select: { trackingNumber: true, courierId: true, eta: true, shippedAt: true } },
        lines: { select: { name: true, qty: true, unitPrice: true } },
      },
    }),
    prisma.invoice.findMany({
      where: { customerId },
      orderBy: { issued: "desc" },
    }),
    prisma.lease.findMany({
      where: { customerId },
      include: {
        assets: {
          include: {
            asset: {
              include: {
                workOrders: {
                  orderBy: { createdAt: "desc" },
                  take: 1,
                  select: { status: true, title: true, dueDate: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.quotation.findMany({
      where: { customerId, status: { in: ["SENT", "ACCEPTED", "CONVERTED"] } },
      orderBy: { createdAt: "desc" },
      include: { lines: { select: { name: true, qty: true, unitPrice: true } } },
    }),
  ]);

  const openAR = invoices
    .filter((i) => i.status !== "PAID")
    .reduce((s, i) => s + Number(i.amount) - Number(i.paid), 0);

  return (
    <PortalClient
      customer={{
        id: customer.id,
        name: customer.name,
        code: customer.code ?? "",
        tin: customer.tin ?? "",
        city: customer.city ?? "",
        region: customer.region ?? "",
        terms: customer.terms,
        creditLimit: Number(customer.creditLimit),
        contactEmail: customer.contactEmail ?? "",
      }}
      openAR={openAR}
      orders={orders.map((o) => ({
        id: o.id,
        state: o.state,
        total: Number(o.total),
        createdAt: o.createdAt.toISOString(),
        lines: o.lines.map((l) => ({ name: l.name, qty: l.qty, unitPrice: Number(l.unitPrice) })),
        shipment: o.shipment
          ? {
              trackingNumber: o.shipment.trackingNumber,
              courierId: o.shipment.courierId,
              shippedAt: o.shipment.shippedAt?.toISOString() ?? null,
              eta: o.shipment.eta?.toISOString() ?? null,
            }
          : null,
      }))}
      invoices={invoices.map((i) => ({
        id: i.id,
        soId: i.soId,
        issued: i.issued.toISOString(),
        due: i.due.toISOString(),
        amount: Number(i.amount),
        paid: Number(i.paid),
        status: i.status,
      }))}
      leases={leases.map((l) => ({
        id: l.id,
        startDate: l.startDate.toISOString(),
        endDate: l.endDate.toISOString(),
        monthlyRate: Number(l.monthlyRate),
        active: l.active,
        assets: l.assets.map((la) => ({
          id: la.asset.id,
          name: la.asset.name,
          serialNumber: la.asset.serialNumber,
          category: la.asset.category,
          lastWo: la.asset.workOrders[0]
            ? {
                status: la.asset.workOrders[0].status,
                title: la.asset.workOrders[0].title,
                dueDate: la.asset.workOrders[0].dueDate?.toISOString() ?? null,
              }
            : null,
        })),
      }))}
      quotations={quotations.map((q) => ({
        id: q.id,
        status: q.status,
        total: Number(q.total),
        validUntil: q.validUntil.toISOString(),
        createdAt: q.createdAt.toISOString(),
        orderId: q.orderId,
        lines: q.lines.map(l => ({ name: l.name, qty: l.qty, unitPrice: Number(l.unitPrice) })),
      }))}
    />
  );
}
