import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InventoryClient } from "./InventoryClient";

export default async function InventoryPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["WAREHOUSE", "ADMIN"].includes(session.user.role)) redirect("/orders");

  const [stocks, moves, catalogItems, warehouses] = await Promise.all([
    prisma.stock.findMany({
      include: { sku: true, warehouse: true },
      orderBy: [{ warehouse: { name: "asc" } }, { sku: { name: "asc" } }],
    }),
    prisma.stockMove.findMany({
      include: { sku: true, warehouse: true },
      orderBy: { at: "desc" },
      take: 200,
    }),
    prisma.catalogItem.findMany({
      where: { active: true },
      select: { id: true, sku: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.warehouse.findMany({ orderBy: { name: "asc" } }),
  ]);

  const serializedStocks = stocks.map(s => ({
    id: s.id,
    skuId: s.skuId,
    skuName: s.sku.name,
    skuSku: s.sku.sku,
    warehouseId: s.warehouseId,
    warehouseName: s.warehouse.name,
    onHand: s.onHand,
    reserved: s.reserved,
    reorderAt: s.reorderAt,
    maxLevel: s.maxLevel,
  }));

  const serializedMoves = moves.map(m => ({
    id: m.id,
    skuId: m.skuId,
    skuName: m.sku.name,
    warehouseName: m.warehouse.name,
    type: m.type,
    qty: m.qty,
    costPerUnit: m.costPerUnit.toString(),
    ref: m.ref,
    note: m.note,
    by: m.by,
    at: m.at.toISOString(),
  }));

  return (
    <InventoryClient
      stocks={serializedStocks}
      moves={serializedMoves}
      catalogItems={catalogItems}
      warehouses={warehouses}
    />
  );
}
