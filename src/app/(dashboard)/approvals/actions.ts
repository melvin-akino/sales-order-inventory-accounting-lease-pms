"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function requireApprover(role: string) {
  if (!["FINANCE", "ADMIN"].includes(role)) throw new Error("Forbidden");
}

export async function approveOrder(orderId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthenticated");
  requireApprover(session.user.role);

  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.state !== "PENDING") throw new Error("Order is not pending");

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { state: "APPROVED" } }),
    prisma.orderEvent.create({
      data: { orderId, state: "APPROVED", actorId: session.user.id, note: "Approved" },
    }),
  ]);

  revalidatePath("/approvals");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
}

export async function rejectOrder(orderId: string, reason: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthenticated");
  requireApprover(session.user.role);

  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.state !== "PENDING") throw new Error("Order is not pending");

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { state: "CANCELLED" } }),
    prisma.orderEvent.create({
      data: { orderId, state: "CANCELLED", actorId: session.user.id, note: reason || "Rejected" },
    }),
  ]);

  revalidatePath("/approvals");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
}
