import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildCSV, csvResponse } from "@/lib/csv";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !["WAREHOUSE", "ADMIN"].includes(session.user.role))
    return new Response("Unauthorized", { status: 401 });

  const stocks = await prisma.stock.findMany({
    include: { sku: true, warehouse: true },
    orderBy: [{ warehouse: { name: "asc" } }, { sku: { name: "asc" } }],
  });

  const rows = stocks.map(s => ({
    "SKU Code": s.sku.sku,
    "Product": s.sku.name,
    "Category": s.sku.category,
    "Unit": s.sku.unit,
    "Warehouse": s.warehouse.name,
    "On Hand": s.onHand,
    "Reserved": s.reserved,
    "Available": s.onHand - s.reserved,
    "Reorder At": s.reorderAt ?? "",
    "Max Level": s.maxLevel ?? "",
  }));

  const today = new Date().toISOString().slice(0, 10);
  return csvResponse(buildCSV(rows), `inventory-${today}.csv`);
}
