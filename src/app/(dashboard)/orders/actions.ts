"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NEXT_STATE } from "@/types";
import type { OrderState } from "@prisma/client";
import { z } from "zod";
import { orderTotal } from "@/lib/utils";
import { getCustomerCredit } from "@/lib/credit";
import { sendOrderEmail } from "@/lib/email";

export { getCustomerCredit };

// ── Stock helpers ─────────────────────────────────────────────────────────────

async function reserveStock(orderId: string, warehouseId: string) {
  const lines = await prisma.orderLine.findMany({ where: { orderId } });

  // Check availability first (onHand - reserved >= qty needed)
  for (const line of lines) {
    const stock = await prisma.stock.findUnique({
      where: { skuId_warehouseId: { skuId: line.skuId, warehouseId } },
    });
    const available = (stock?.onHand ?? 0) - (stock?.reserved ?? 0);
    if (available < line.qty) {
      throw new Error(
        `Insufficient stock for "${line.name}": ${available} available, ${line.qty} needed. Adjust stock before approving.`
      );
    }
  }

  // All good — reserve
  await Promise.all(
    lines.map(line =>
      prisma.stock.upsert({
        where: { skuId_warehouseId: { skuId: line.skuId, warehouseId } },
        update: { reserved: { increment: line.qty } },
        create: { skuId: line.skuId, warehouseId, onHand: 0, reserved: line.qty },
      })
    )
  );
}

async function releaseReservation(orderId: string, warehouseId: string) {
  const lines = await prisma.orderLine.findMany({ where: { orderId } });
  await Promise.all(
    lines.map(line =>
      prisma.stock.updateMany({
        where: { skuId: line.skuId, warehouseId },
        data: { reserved: { decrement: line.qty } },
      })
    )
  );
}

async function consumeStock(orderId: string, warehouseId: string, actorId: string) {
  const lines = await prisma.orderLine.findMany({ where: { orderId } });
  await Promise.all(
    lines.map(async line => {
      await prisma.stock.updateMany({
        where: { skuId: line.skuId, warehouseId },
        data: {
          onHand: { decrement: line.qty },
          reserved: { decrement: line.qty },
        },
      });
      await prisma.stockMove.create({
        data: {
          skuId: line.skuId,
          warehouseId,
          type: "PICK",
          qty: -line.qty,
          ref: orderId,
          note: `Picked for order ${orderId}`,
          by: actorId,
        },
      });
    })
  );
}

// ── Advance order state FSM ───────────────────────────────────────────────────
export async function advanceOrderState(orderId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthenticated");

  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  const transition = NEXT_STATE[order.state as OrderState];
  if (!transition?.next) throw new Error("No next state");

  const userRole = session.user.role;
  if (!transition.roles.includes(userRole)) throw new Error("Forbidden");

  // Stock side-effects before the state update
  if (transition.next === "APPROVED") {
    await reserveStock(orderId, order.warehouseId);
  }

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

  // Consume stock when delivered (decrement onHand + release reservation)
  if (transition.next === "DELIVERED") {
    await consumeStock(orderId, order.warehouseId, session.user.id);
  }

  // Email notification (non-blocking)
  const fullOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: { include: { users: { where: { active: true }, select: { email: true } } } } },
  });
  if (fullOrder) {
    sendOrderEmail(fullOrder.id, transition.next as OrderState, fullOrder.customer).catch(() => {});
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/inventory");
}

// ── Cancel order ──────────────────────────────────────────────────────────────
export async function cancelOrder(orderId: string, reason: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthenticated");

  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.state === "DELIVERED" || order.state === "CANCELLED") {
    throw new Error("Cannot cancel order in this state");
  }

  // Release reservation if stock was already reserved
  if (["APPROVED", "PREPARING", "SHIPPED"].includes(order.state)) {
    await releaseReservation(orderId, order.warehouseId);
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
  revalidatePath("/inventory");
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

export async function createOrder(input: z.infer<typeof NewOrderSchema> & { overrideCreditLimit?: boolean }) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthenticated");

  const data = NewOrderSchema.parse(input);
  const subtotal = data.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const { vat, cwt, total } = orderTotal(subtotal, data.cwt2307);

  // ── Credit limit check ────────────────────────────────────────────────────
  const credit = await getCustomerCredit(data.customerId);
  if (credit.creditLimit > 0) {
    const projectedOutstanding = credit.outstanding + total;
    if (projectedOutstanding > credit.creditLimit) {
      const canOverride = ["FINANCE", "ADMIN"].includes(session.user.role);
      if (!canOverride) {
        throw new Error(
          `Credit limit exceeded. Available: ₱${credit.available.toLocaleString("en-PH", { minimumFractionDigits: 2 })} · Order total: ₱${total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
        );
      }
      if (!input.overrideCreditLimit) {
        throw new Error(`CREDIT_LIMIT_WARNING:₱${credit.available.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`);
      }
    }
  }

  const year = new Date().getFullYear();
  const count = await prisma.order.count({ where: { createdAt: { gte: new Date(`${year}-01-01`) } } });
  const orderId = `SO-${year}-${String(count + 1).padStart(4, "0")}`;

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
