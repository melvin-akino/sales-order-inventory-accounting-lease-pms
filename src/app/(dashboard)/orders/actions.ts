"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NEXT_STATE } from "@/types";
import type { OrderState } from "@prisma/client";
import { z } from "zod";
import { orderTotal } from "@/lib/utils";

// ── Advance order state FSM ───────────────────────────────────────────────────
export async function advanceOrderState(orderId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthenticated");

  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  const transition = NEXT_STATE[order.state as OrderState];
  if (!transition?.next) throw new Error("No next state");

  const userRole = session.user.role;
  if (!transition.roles.includes(userRole)) throw new Error("Forbidden");

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { state: transition.next } }),
    prisma.orderEvent.create({
      data: {
        orderId,
        state: transition.next,
        actorId: session.user.id,
        note: transition.label,
      },
    }),
  ]);

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
}

// ── Cancel order ──────────────────────────────────────────────────────────────
export async function cancelOrder(orderId: string, reason: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthenticated");

  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.state === "DELIVERED" || order.state === "CANCELLED") {
    throw new Error("Cannot cancel order in this state");
  }

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { state: "CANCELLED" } }),
    prisma.orderEvent.create({
      data: {
        orderId,
        state: "CANCELLED",
        actorId: session.user.id,
        note: reason || "Cancelled",
      },
    }),
  ]);

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
}

// ── New order ─────────────────────────────────────────────────────────────────
const NewOrderSchema = z.object({
  customerId: z.string().min(1),
  warehouseId: z.string().min(1),
  cwt2307: z.boolean().default(false),
  notes: z.string().optional(),
  lines: z.array(
    z.object({
      skuId: z.string().min(1),
      qty: z.number().int().positive(),
      unitPrice: z.number().positive(),
    })
  ).min(1),
});

export async function createOrder(input: z.infer<typeof NewOrderSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthenticated");

  const data = NewOrderSchema.parse(input);
  const subtotal = data.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const { vat, cwt, total } = orderTotal(subtotal, data.cwt2307);

  const year = new Date().getFullYear();
  const count = await prisma.order.count({ where: { createdAt: { gte: new Date(`${year}-01-01`) } } });
  const orderId = `SO-${year}-${String(count + 1).padStart(4, "0")}`;

  // Fetch catalog items to get name + unit for each line
  const skuIds = data.lines.map((l) => l.skuId);
  const items = await prisma.catalogItem.findMany({ where: { id: { in: skuIds } } });
  const itemMap = Object.fromEntries(items.map((i) => [i.id, i]));

  const order = await prisma.order.create({
    data: {
      id: orderId,
      customerId: data.customerId,
      agentId: session.user.id,
      warehouseId: data.warehouseId,
      subtotal,
      vat,
      cwt,
      total,
      cwt2307: data.cwt2307,
      notes: data.notes,
      lines: {
        create: data.lines.map((l) => ({
          skuId: l.skuId,
          name: itemMap[l.skuId]?.name ?? l.skuId,
          unit: itemMap[l.skuId]?.unit ?? "pc",
          qty: l.qty,
          unitPrice: l.unitPrice,
          lineTotal: l.qty * l.unitPrice,
        })),
      },
      events: {
        create: {
          state: "PENDING",
          actorId: session.user.id,
          note: "Order created",
        },
      },
    },
  });

  revalidatePath("/orders");
  return order.id;
}
