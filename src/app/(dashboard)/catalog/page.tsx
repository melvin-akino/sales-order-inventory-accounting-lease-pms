import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { peso } from "@/lib/utils";

export default async function CatalogPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["AGENT", "FINANCE", "ADMIN"].includes(session.user.role)) redirect("/orders");

  const items = await prisma.catalogItem.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="text-[18px] font-semibold mb-4">Catalog</h1>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th className="id">SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>Brand</th>
              <th className="num">Unit Price</th>
              <th>Unit</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} style={{ cursor: "default" }}>
                <td className="id">{item.id}</td>
                <td>{item.name}</td>
                <td className="dim">{item.category}</td>
                <td className="dim">{item.brand ?? "—"}</td>
                <td className="num">{peso(item.unitPrice)}</td>
                <td className="dim">{item.unit}</td>
                <td>
                  <span className={`pill ${item.active ? "pill-DELIVERED" : "pill-CANCELLED"}`}>
                    {item.active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
