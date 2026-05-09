import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SuppliersPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["WAREHOUSE", "FINANCE", "ADMIN"].includes(session.user.role)) redirect("/orders");

  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="text-[18px] font-semibold mb-4">Suppliers</h1>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th className="id">ID</th>
              <th>Name</th>
              <th>Contact</th>
              <th>Lead Days</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id} style={{ cursor: "default" }}>
                <td className="id">{s.id}</td>
                <td>{s.name}</td>
                <td className="dim">{s.contactEmail ?? s.contactPhone ?? "—"}</td>
                <td className="num dim">{s.leadTimeDays ?? "—"}</td>
                <td>
                  <span className={`pill ${s.status === "ACTIVE" ? "pill-DELIVERED" : s.status === "ON_HOLD" ? "pill-PREPARING" : "pill-CANCELLED"}`}>
                    {s.status}
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
