import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["AGENT", "FINANCE", "ADMIN"].includes(session.user.role)) redirect("/orders");

  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="text-[18px] font-semibold mb-4">Customers</h1>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th className="id">ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>TIN</th>
              <th>City</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} style={{ cursor: "default" }}>
                <td className="id">{c.id}</td>
                <td>{c.name}</td>
                <td className="dim">{c.type}</td>
                <td className="dim">{c.tin ?? "—"}</td>
                <td className="dim">{c.city ?? "—"}</td>
                <td className="dim">{c.contactEmail ?? c.contactPhone ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
