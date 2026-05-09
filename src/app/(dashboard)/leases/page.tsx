import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { peso, fmtDate } from "@/lib/utils";

export default async function LeasesPage() {
  const session = await getServerSession(authOptions);
  const role = session!.user.role;

  const where =
    role === "CUSTOMER"
      ? { customerId: session!.user.customerId }
      : {};

  const leases = await prisma.lease.findMany({
    where,
    include: { customer: true, assets: { include: { asset: true } } },
    orderBy: { startDate: "desc" },
  });

  return (
    <div>
      <h1 className="text-[18px] font-semibold mb-4">Equipment Leases</h1>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th className="id">Lease ID</th>
              <th>Customer</th>
              <th>Assets</th>
              <th>Start</th>
              <th>End</th>
              <th className="num">Monthly Rate</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {leases.length === 0 && (
              <tr><td colSpan={7}><div className="empty-state">No leases</div></td></tr>
            )}
            {leases.map((l) => {
              const now = new Date();
              const active = l.startDate <= now && l.endDate >= now;
              return (
                <tr key={l.id} style={{ cursor: "default" }}>
                  <td className="id">{l.id}</td>
                  <td>{l.customer.name}</td>
                  <td>{l.assets.map((la) => la.asset.name).join(", ")}</td>
                  <td className="dim">{fmtDate(l.startDate)}</td>
                  <td className="dim">{fmtDate(l.endDate)}</td>
                  <td className="num">{peso(l.monthlyRate)}</td>
                  <td>
                    <span className={`pill ${active ? "pill-APPROVED" : "pill-CANCELLED"}`}>
                      {active ? "Active" : "Expired"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
