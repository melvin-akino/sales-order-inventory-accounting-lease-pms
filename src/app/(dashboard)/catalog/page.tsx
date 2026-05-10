import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CatalogClient } from "./CatalogClient";

export default async function CatalogPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["AGENT", "FINANCE", "ADMIN"].includes(session.user.role)) redirect("/orders");

  const [items, suppliers] = await Promise.all([
    prisma.catalogItem.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedItems = items.map(i => ({
    id: i.id,
    sku: i.sku,
    name: i.name,
    category: i.category,
    unit: i.unit,
    unitPrice: i.unitPrice.toString(),
    brand: i.brand,
    active: i.active,
    supplierId: i.supplierId,
  }));

  return <CatalogClient items={serializedItems} suppliers={suppliers} />;
}
