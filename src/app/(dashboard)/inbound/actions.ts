"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function requireAccess() {
  const session = await getServerSession(authOptions);
  if (!session || !["WAREHOUSE", "ADMIN"].includes(session.user.role)) throw new Error("Forbidden");
  return session;
}

function genPoId() {
  return `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
}

// ── Create PO ─────────────────────────────────────────────────────────────────
const CreatePoSchema = z.object({
  supplierId: z.string(),
  warehouseId: z.string(),
  expectedAt: z.string(),
  lines: z.array(z.object({ skuId: z.string(), qty: z.number().int().positive(), unitCost: z.number().min(0) })).min(1),
});

export async function createPO(input: z.infer<typeof CreatePoSchema>) {
  await requireAccess();
  const data = CreatePoSchema.parse(input);

  const total = data.lines.reduce((s, l) => s + l.qty * l.unitCost, 0);

  await prisma.inboundPO.create({
    data: {
      id: genPoId(),
      supplierId: data.supplierId,
      warehouseId: data.warehouseId,
      expectedAt: new Date(data.expectedAt),
      total,
      lines: {
        create: data.lines.map(l => ({ skuId: l.skuId, qty: l.qty })),
      },
    },
  });

  revalidatePath("/inbound");
}

// ── Update PO status ──────────────────────────────────────────────────────────
export async function updatePOStatus(id: string, status: "RECEIVING" | "DELAYED") {
  await requireAccess();
  await prisma.inboundPO.update({ where: { id }, data: { status } });
  revalidatePath("/inbound");
}

// ── Receive PO (mark received, update stock, create lots) ─────────────────────
const ReceivePoSchema = z.object({
  poId: z.string(),
  lines: z.array(z.object({
    lineId: z.string(),
    skuId: z.string(),
    accepted: z.number().int().min(0),
    damaged: z.number().int().min(0),
    lotNumber: z.string().optional(),
    expiryDate: z.string().optional(),
  })),
});

export async function receivePO(input: z.infer<typeof ReceivePoSchema>) {
  const session = await requireAccess();
  const { poId, lines } = ReceivePoSchema.parse(input);

  const po = await prisma.inboundPO.findUniqueOrThrow({ where: { id: poId } });

  await prisma.$transaction(async (tx) => {
    for (const l of lines) {
      await tx.inboundPOLine.update({
        where: { id: l.lineId },
        data: { accepted: l.accepted, damaged: l.damaged },
      });

      if (l.accepted > 0) {
        await tx.stock.upsert({
          where: { skuId_warehouseId: { skuId: l.skuId, warehouseId: po.warehouseId } },
          create: { skuId: l.skuId, warehouseId: po.warehouseId, onHand: l.accepted },
          update: { onHand: { increment: l.accepted } },
        });

        await tx.stockMove.create({
          data: {
            skuId: l.skuId,
            warehouseId: po.warehouseId,
            type: "RECEIPT",
            qty: l.accepted,
            ref: poId,
            note: l.damaged > 0 ? `${l.damaged} damaged` : undefined,
            by: session.user.name ?? session.user.email,
          },
        });

        // Create or update lot record if lot number provided
        const lotNum = l.lotNumber?.trim() || `LOT-${poId}`;
        const expiry = l.expiryDate ? new Date(l.expiryDate) : undefined;

        const existing = await tx.lot.findFirst({
          where: { lotNumber: lotNum, skuId: l.skuId, warehouseId: po.warehouseId },
        });

        if (existing) {
          await tx.lot.update({
            where: { id: existing.id },
            data: {
              receivedQty: existing.receivedQty + l.accepted,
              remainingQty: existing.remainingQty + l.accepted,
              ...(expiry ? { expiryDate: expiry } : {}),
            },
          });
        } else {
          await tx.lot.create({
            data: {
              lotNumber: lotNum,
              skuId: l.skuId,
              warehouseId: po.warehouseId,
              receivedQty: l.accepted,
              remainingQty: l.accepted,
              expiryDate: expiry,
              poId,
            },
          });
        }
      }
    }

    await tx.inboundPO.update({ where: { id: poId }, data: { status: "RECEIVED" } });
  });

  revalidatePath("/inbound");
  revalidatePath("/inventory");
}

// ── Generate Reorder POs from low-stock items ──────────────────────────────────
export async function generateReorderPOs(warehouseId: string | "ALL") {
  const session = await requireAccess();

  const lowStocks = await prisma.stock.findMany({
    where: {
      ...(warehouseId !== "ALL" ? { warehouseId } : {}),
      reorderAt: { not: null },
    },
    include: {
      sku: { select: { id: true, name: true, supplierId: true } },
    },
  });

  const needReorder = lowStocks.filter(
    s => s.reorderAt != null && s.onHand - s.reserved <= s.reorderAt
  );

  if (needReorder.length === 0) return { created: 0 };

  // Group by supplierId
  const bySupplier = new Map<string, typeof needReorder>();
  for (const s of needReorder) {
    const key = s.sku.supplierId ?? "__none__";
    if (!bySupplier.has(key)) bySupplier.set(key, []);
    bySupplier.get(key)!.push(s);
  }

  let created = 0;
  for (const [supplierId, items] of Array.from(bySupplier)) {
    if (supplierId === "__none__") continue; // skip items with no supplier

    const poId = genPoId() + `-R${created}`;
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + 7); // default 7-day lead time

    const whId = items[0].warehouseId;
    await prisma.inboundPO.create({
      data: {
        id: poId,
        supplierId,
        warehouseId: whId,
        expectedAt: expectedDate,
        status: "EXPECTED",
        total: 0,
        lines: {
          create: items.map(s => ({
            skuId: s.skuId,
            qty: Math.max((s.maxLevel ?? s.reorderAt! * 2) - s.onHand, 1),
          })),
        },
      },
    });
    created++;
  }

  revalidatePath("/inbound");
  revalidatePath("/inventory");
  return { created };
}
