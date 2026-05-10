import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShipmentsClient } from "./ShipmentsClient";

export default async function ShipmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["WAREHOUSE", "FINANCE", "ADMIN", "DRIVER"].includes(session.user.role)) redirect("/orders");

  const role = session.user.role;

  const shipments = await prisma.shipment.findMany({
    include: { order: { include: { customer: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const serialized = shipments.map((s) => ({
    id: s.id,
    orderId: s.orderId,
    trackingNumber: s.trackingNumber,
    courierId: s.courierId,
    shippedAt: s.shippedAt?.toISOString() ?? null,
    eta: s.eta?.toISOString() ?? null,
    podSignedBy: s.podSignedBy,
    orderState: s.order.state,
    customerName: s.order.customer.name,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-semibold">Shipments</h1>
      </div>
      <ShipmentsClient shipments={serialized} role={role} />
    </div>
  );
}
