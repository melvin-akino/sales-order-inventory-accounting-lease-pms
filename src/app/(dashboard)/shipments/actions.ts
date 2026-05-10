"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function updateShipmentInfo(
  shipmentId: string,
  data: { trackingNumber?: string; courierId?: string; eta?: string },
) {
  const session = await getServerSession(authOptions);
  if (!session || !["WAREHOUSE", "ADMIN"].includes(session.user.role)) throw new Error("Forbidden");

  await prisma.shipment.update({
    where: { id: shipmentId },
    data: {
      trackingNumber: data.trackingNumber ?? null,
      courierId: data.courierId ?? null,
      eta: data.eta ? new Date(data.eta) : null,
    },
  });

  revalidatePath("/shipments");
}

export async function confirmDeliveryFromShipments(orderId: string, podSignedBy: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthenticated");
  if (!["WAREHOUSE", "ADMIN", "FINANCE", "DRIVER"].includes(session.user.role)) throw new Error("Forbidden");

  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.state !== "SHIPPED") throw new Error("Order is not in SHIPPED state");

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { state: "DELIVERED" } });
    await tx.orderEvent.create({
      data: {
        orderId,
        state: "DELIVERED",
        actorId: session.user.id,
        note: podSignedBy ? `Delivered — signed by ${podSignedBy}` : "Delivered",
      },
    });
    if (podSignedBy) {
      await tx.shipment.updateMany({ where: { orderId }, data: { podSignedBy } });
    }
  });

  revalidatePath("/shipments");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
}
