import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function InventoryPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["WAREHOUSE", "ADMIN"].includes(session.user.role)) redirect("/orders");

  const stocks = await prisma.stock.findMany({
    include: { sku: true, warehouse: true },
    orderBy: [{ warehouse: { name: "asc" } }, { sku: { name: "asc" } }],
  });

  return (
    <div>
      <h1 className="text-[18px] font-semibold mb-4">Inventory</h1>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th className="id">SKU</th>
              <th>Product</th>
              <th>Warehouse</th>
              <th className="num">On Hand</th>
              <th className="num">Reserved</th>
              <th className="num">Available</th>
              <th className="num">Reorder At</th>
            </tr>
          </thead>
          <tbody>
            {stocks.length === 0 && (
              <tr><td colSpan={7}><div className="empty-state">No stock records</div></td></tr>
            )}
            {stocks.map((s) => {
              const available = s.onHand - s.reserved;
              const low = s.reorderAt != null && s.onHand <= s.reorderAt;
              return (
                <tr key={s.id} style={{ cursor: "default" }}>
                  <td className="id">{s.skuId}</td>
                  <td>{s.sku.name}</td>
                  <td className="dim">{s.warehouse.name}</td>
                  <td className="num">{s.onHand.toLocaleString()}</td>
                  <td className="num dim">{s.reserved.toLocaleString()}</td>
                  <td className="num" style={low ? { color: "oklch(0.50 0.14 25)" } : undefined}>
                    {available.toLocaleString()}
                  </td>
                  <td className="num dim">{s.reorderAt?.toLocaleString() ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
