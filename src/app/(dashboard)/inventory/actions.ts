"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function requireAccess() {
  const session = await getServerSession(authOptions);
  if (!session || !["WAREHOUSE", "ADMIN"].includes(session.user.role)) {
    throw new Error("Forbidden");
  }
  return session;
}

// ── Receive stock (inbound) ───────────────────────────────────────────────────
export async function receiveStock(input: {
  stockId: string;
  qty: number;
  costPerUnit?: number;
  ref?: string;
  note?: string;
}) {
  const session = await requireAccess();
  const { stockId, qty, costPerUnit, ref, note } = z.object({
    stockId: z.string(),
    qty: z.number().int().positive(),
    costPerUnit: z.number().min(0).optional(),
    ref: z.string().optional(),
    note: z.string().optional(),
  }).parse(input);

  const stock = await prisma.stock.findUniqueOrThrow({ where: { id: stockId } });

  await prisma.$transaction([
    prisma.stockMove.create({
      data: {
        skuId: stock.skuId,
        warehouseId: stock.warehouseId,
        type: "RECEIPT",
        qty,
        costPerUnit: costPerUnit ?? 0,
        ref: ref || null,
        note: note || null,
        by: session.user.name ?? session.user.email,
      },
    }),
    prisma.stock.update({
      where: { id: stockId },
      data: { onHand: { increment: qty } },
    }),
  ]);

  revalidatePath("/inventory");
}

// ── Adjust stock (correction / stocktake) ────────────────────────────────────
export async function adjustStock(input: {
  stockId: string;
  delta: number;
  note: string;
}) {
  const session = await requireAccess();
  const { stockId, delta, note } = z.object({
    stockId: z.string(),
    delta: z.number().int(),
    note: z.string().min(1, "Note is required for adjustments"),
  }).parse(input);

  if (delta === 0) throw new Error("Delta cannot be zero");

  const stock = await prisma.stock.findUniqueOrThrow({ where: { id: stockId } });
  if (stock.onHand + delta < 0) throw new Error("Adjustment would result in negative stock");

  await prisma.$transaction([
    prisma.stockMove.create({
      data: {
        skuId: stock.skuId,
        warehouseId: stock.warehouseId,
        type: "ADJUSTMENT",
        qty: delta,
        costPerUnit: 0,
        note,
        by: session.user.name ?? session.user.email,
      },
    }),
    prisma.stock.update({
      where: { id: stockId },
      data: { onHand: { increment: delta } },
    }),
  ]);

  revalidatePath("/inventory");
}

// ── Update reorder settings ───────────────────────────────────────────────────
export async function updateStockSettings(input: {
  stockId: string;
  reorderAt: number | null;
  maxLevel: number | null;
}) {
  await requireAccess();
  const { stockId, reorderAt, maxLevel } = z.object({
    stockId: z.string(),
    reorderAt: z.number().int().min(0).nullable(),
    maxLevel: z.number().int().min(0).nullable(),
  }).parse(input);

  await prisma.stock.update({
    where: { id: stockId },
    data: { reorderAt, maxLevel },
  });

  revalidatePath("/inventory");
}

// ── Initialize a stock row for a new SKU + warehouse ─────────────────────────
export async function initStockRow(skuId: string, warehouseId: string) {
  await requireAccess();

  await prisma.stock.upsert({
    where: { skuId_warehouseId: { skuId, warehouseId } },
    create: { skuId, warehouseId, onHand: 0, reserved: 0 },
    update: {},
  });

  revalidatePath("/inventory");
}
