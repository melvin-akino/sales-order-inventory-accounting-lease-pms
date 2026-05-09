import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { peso, fmtDate } from "@/lib/utils";
import { StatePill } from "@/components/ui/StatePill";
import type { OrderState } from "@prisma/client";

export default async function LedgerPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["FINANCE", "ADMIN"].includes(session.user.role)) redirect("/orders");

  const orders = await prisma.order.findMany({
    where: { state: { in: ["DELIVERED", "CANCELLED"] } },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const totalRevenue = orders
    .filter((o) => o.state === "DELIVERED")
    .reduce((s, o) => s + Number(o.total), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-semibold">Ledger</h1>
        <div className="stat-card" style={{ padding: "8px 16px", display: "inline-block" }}>
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value text-[16px]">{peso(totalRevenue)}</div>
        </div>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th className="id">Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Status</th>
              <th className="num">Subtotal</th>
              <th className="num">VAT</th>
              <th className="num">CWT</th>
              <th className="num">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ cursor: "default" }}>
                <td className="id">{o.id}</td>
                <td>{o.customer.name}</td>
                <td className="dim">{fmtDate(o.createdAt)}</td>
                <td><StatePill state={o.state as OrderState} /></td>
                <td className="num">{peso(o.subtotal)}</td>
                <td className="num dim">{peso(o.vat)}</td>
                <td className="num dim">{o.cwt2307 ? `(${peso(o.cwt)})` : "—"}</td>
                <td className="num">{peso(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
