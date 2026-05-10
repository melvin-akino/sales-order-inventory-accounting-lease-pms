import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EquipmentClient } from "./EquipmentClient";

export default async function EquipmentPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["WAREHOUSE", "ADMIN"].includes(session.user.role)) redirect("/orders");

  const [assets, warehouses] = await Promise.all([
    prisma.asset.findMany({
      include: {
        _count: {
          select: { workOrders: { where: { status: { not: "COMPLETED" } } } },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.warehouse.findMany({ orderBy: { name: "asc" } }),
  ]);

  const serialized = assets.map((a) => ({
    id: a.id,
    name: a.name,
    serialNumber: a.serialNumber,
    category: a.category,
    warehouseId: a.warehouseId,
    warehouseName: null as string | null,
    purchasedAt: a.purchasedAt?.toISOString() ?? null,
    maintenanceIntervalDays: a.maintenanceIntervalDays,
    createdAt: a.createdAt.toISOString(),
    openWoCount: a._count.workOrders,
  }));

  // Attach warehouse names
  const whMap = Object.fromEntries(warehouses.map((w) => [w.id, w.name]));
  serialized.forEach((a) => {
    if (a.warehouseId) a.warehouseName = whMap[a.warehouseId] ?? null;
  });

  return (
    <EquipmentClient
      assets={serialized}
      warehouses={warehouses.map((w) => ({ id: w.id, name: w.name }))}
    />
  );
}
