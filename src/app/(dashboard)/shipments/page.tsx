import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/utils";

export default async function ShipmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["WAREHOUSE", "FINANCE", "ADMIN"].includes(session.user.role)) redirect("/orders");

  const shipments = await prisma.shipment.findMany({
    include: { order: { include: { customer: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="text-[18px] font-semibold mb-4">Shipments</h1>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th className="id">Tracking #</th>
              <th className="id">Order</th>
              <th>Customer</th>
              <th>Courier</th>
              <th>Shipped</th>
              <th>ETA</th>
              <th>POD</th>
            </tr>
          </thead>
          <tbody>
            {shipments.length === 0 && (
              <tr><td colSpan={7}><div className="empty-state">No shipments yet</div></td></tr>
            )}
            {shipments.map((s) => (
              <tr key={s.id} style={{ cursor: "default" }}>
                <td className="id">{s.trackingNumber ?? "—"}</td>
                <td className="id">{s.orderId}</td>
                <td>{s.order.customer.name}</td>
                <td className="dim">{s.courierId}</td>
                <td className="dim">{s.shippedAt ? fmtDate(s.shippedAt) : "—"}</td>
                <td className="dim">{s.eta ? fmtDate(s.eta) : "—"}</td>
                <td>
                  {s.podUrl ? (
                    <a href={s.podUrl} target="_blank" className="badge badge-ok hover:underline">POD</a>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
