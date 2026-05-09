import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatePill } from "@/components/ui/StatePill";
import { peso, fmtDate } from "@/lib/utils";

export default async function ApprovalsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["FINANCE", "ADMIN"].includes(session.user.role)) redirect("/orders");

  const pending = await prisma.order.findMany({
    where: { state: "PENDING" },
    include: { customer: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="text-[18px] font-semibold mb-4">Pending Approvals</h1>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th className="id">Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Status</th>
              <th className="num">Total</th>
            </tr>
          </thead>
          <tbody>
            {pending.length === 0 && (
              <tr><td colSpan={5}><div className="empty-state">No pending approvals</div></td></tr>
            )}
            {pending.map((order) => (
              <tr key={order.id}>
                <td className="id"><Link href={`/orders/${order.id}`} className="hover:underline">{order.id}</Link></td>
                <td>{order.customer.name}</td>
                <td className="dim">{fmtDate(order.createdAt)}</td>
                <td><StatePill state="PENDING" /></td>
                <td className="num">{peso(order.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
