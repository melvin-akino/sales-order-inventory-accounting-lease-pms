"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Disposition } from "@prisma/client";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthenticated");
  return session;
}

const CreateReturnSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(1),
  notes: z.string().optional(),
  lines: z.array(z.object({
    skuId: z.string().min(1),
    name: z.string(),
    qtyRequested: z.number().int().positive(),
    disposition: z.enum(["RESTOCK", "SCRAP"]),
  })).min(1),
});

export async function createReturn(input: z.infer<typeof CreateReturnSchema>) {
  const session = await requireSession();
  if (!["AGENT", "FINANCE", "ADMIN", "WAREHOUSE"].includes(session.user.role)) throw new Error("Forbidden");

  const data = CreateReturnSchema.parse(input);

  // Validate order exists and is DELIVERED
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: data.orderId },
    include: { lines: true },
  });
  if (order.state !== "DELIVERED") throw new Error("Returns can only be requested for delivered orders");

  // Validate quantities don't exceed original order lines
  for (const line of data.lines) {
    const orderLine = order.lines.find(l => l.skuId === line.skuId);
    if (!orderLine) throw new Error(`SKU not found in original order`);
    if (line.qtyRequested > orderLine.qty) {
      throw new Error(`Cannot return more than ordered qty for "${line.name}"`);
    }
  }

  const ret = await prisma.returnRequest.create({
    data: {
      orderId: data.orderId,
      reason: data.reason,
      notes: data.notes,
      lines: {
        create: data.lines.map(l => ({
          skuId: l.skuId,
          name: l.name,
          qtyRequested: l.qtyRequested,
          disposition: l.disposition as Disposition,
        })),
      },
    },
  });

  revalidatePath("/returns");
  revalidatePath(`/orders/${data.orderId}`);
  return ret.id;
}

export async function approveReturn(returnId: string) {
  const session = await requireSession();
  if (!["FINANCE", "ADMIN", "WAREHOUSE"].includes(session.user.role)) throw new Error("Forbidden");

  await prisma.returnRequest.update({
    where: { id: returnId },
    data: { status: "APPROVED" },
  });

  revalidatePath("/returns");
}

export async function receiveReturn(returnId: string, lines: { id: string; qtyReceived: number }[]) {
  const session = await requireSession();
  if (!["WAREHOUSE", "ADMIN"].includes(session.user.role)) throw new Error("Forbidden");

  const ret = await prisma.returnRequest.findUniqueOrThrow({
    where: { id: returnId },
    include: { lines: true, order: { select: { warehouseId: true } } },
  });

  if (ret.status !== "APPROVED") throw new Error("Return must be approved before receiving");

  const warehouseId = ret.order.warehouseId;

  await prisma.$transaction(async tx => {
    for (const input of lines) {
      const line = ret.lines.find(l => l.id === input.id);
      if (!line || input.qtyReceived <= 0) continue;

      await tx.returnLine.update({
        where: { id: input.id },
        data: { qtyReceived: input.qtyReceived },
      });

      // Restock: increment onHand, create RETURN StockMove
      if (line.disposition === "RESTOCK") {
        await tx.stock.upsert({
          where: { skuId_warehouseId: { skuId: line.skuId, warehouseId } },
          update: { onHand: { increment: input.qtyReceived } },
          create: { skuId: line.skuId, warehouseId, onHand: input.qtyReceived, reserved: 0 },
        });
      }

      await tx.stockMove.create({
        data: {
          skuId: line.skuId,
          warehouseId,
          type: "RETURN",
          qty: input.qtyReceived,
          ref: returnId,
          note: `Return ${returnId} — ${line.disposition}`,
          by: session.user.id,
        },
      });
    }

    await tx.returnRequest.update({
      where: { id: returnId },
      data: { status: "RECEIVED" },
    });
  });

  revalidatePath("/returns");
  revalidatePath("/inventory");
}

export async function closeReturn(returnId: string) {
  const session = await requireSession();
  if (!["FINANCE", "ADMIN"].includes(session.user.role)) throw new Error("Forbidden");

  await prisma.returnRequest.update({
    where: { id: returnId },
    data: { status: "CLOSED" },
  });

  revalidatePath("/returns");
}
