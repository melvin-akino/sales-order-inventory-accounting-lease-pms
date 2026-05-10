import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApprovalsClient } from "./ApprovalsClient";

export default async function ApprovalsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["FINANCE", "ADMIN"].includes(session.user.role)) redirect("/orders");

  const pending = await prisma.order.findMany({
    where: { state: "PENDING" },
    include: { customer: true },
    orderBy: { createdAt: "asc" },
  });

  const orders = pending.map((o) => ({
    id: o.id,
    createdAt: o.createdAt.toISOString(),
    total: o.total.toString(),
    notes: o.notes,
    customer: { name: o.customer.name },
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-semibold">
          Pending Approvals
          {orders.length > 0 && (
            <span className="ml-2 badge badge-warn">{orders.length}</span>
          )}
        </h1>
      </div>
      <ApprovalsClient orders={orders} />
    </div>
  );
}
