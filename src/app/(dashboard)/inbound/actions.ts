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

// ── Receive PO (mark received, update stock) ──────────────────────────────────
const ReceivePoSchema = z.object({
  poId: z.string(),
  lines: z.array(z.object({
    lineId: z.string(),
    skuId: z.string(),
    accepted: z.number().int().min(0),
    damaged: z.number().int().min(0),
  })),
});

export async function receivePO(input: z.infer<typeof ReceivePoSchema>) {
  const session = await requireAccess();
  const { poId, lines } = ReceivePoSchema.parse(input);

  const po = await prisma.inboundPO.findUniqueOrThrow({ where: { id: poId } });

  await prisma.$transaction(async (tx) => {
    // Update each line
    for (const l of lines) {
      await tx.inboundPOLine.update({
        where: { id: l.lineId },
        data: { accepted: l.accepted, damaged: l.damaged },
      });

      if (l.accepted > 0) {
        // Upsert stock row
        await tx.stock.upsert({
          where: { skuId_warehouseId: { skuId: l.skuId, warehouseId: po.warehouseId } },
          create: { skuId: l.skuId, warehouseId: po.warehouseId, onHand: l.accepted },
          update: { onHand: { increment: l.accepted } },
        });

        // Stock move
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
      }
    }

    // Mark PO as received
    await tx.inboundPO.update({ where: { id: poId }, data: { status: "RECEIVED" } });
  });

  revalidatePath("/inbound");
  revalidatePath("/inventory");
}
