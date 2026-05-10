import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InboundClient } from "./InboundClient";

export default async function InboundPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["WAREHOUSE", "ADMIN"].includes(session.user.role)) redirect("/orders");

  const [pos, suppliers, warehouses, catalog] = await Promise.all([
    prisma.inboundPO.findMany({
      include: {
        supplier: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        lines: { include: { sku: { select: { id: true, sku: true, name: true, unit: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.supplier.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.warehouse.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.catalogItem.findMany({ where: { active: true }, select: { id: true, sku: true, name: true, unit: true }, orderBy: { name: "asc" } }),
  ]);

  const serialized = pos.map(po => ({
    id: po.id,
    supplierId: po.supplierId,
    supplierName: po.supplier.name,
    warehouseId: po.warehouseId,
    warehouseName: po.warehouse.name,
    status: po.status,
    expectedAt: po.expectedAt.toISOString(),
    total: po.total.toString(),
    createdAt: po.createdAt.toISOString(),
    lines: po.lines.map(l => ({
      id: l.id,
      skuId: l.skuId,
      skuCode: l.sku.sku,
      skuName: l.sku.name,
      unit: l.sku.unit,
      qty: l.qty,
      accepted: l.accepted,
      damaged: l.damaged,
    })),
  }));

  return (
    <InboundClient
      pos={serialized}
      suppliers={suppliers}
      warehouses={warehouses}
      catalog={catalog}
    />
  );
}
