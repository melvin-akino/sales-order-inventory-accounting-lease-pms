import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ReturnsClient } from "./ReturnsClient";

export default async function ReturnsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = session.user.role;
  if (!["AGENT", "FINANCE", "WAREHOUSE", "ADMIN"].includes(role)) redirect("/dashboard");

  const [returns, deliveredOrders] = await Promise.all([
    prisma.returnRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        order: { select: { id: true, customer: { select: { name: true } } } },
        lines: true,
      },
    }),
    prisma.order.findMany({
      where: { state: "DELIVERED" },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        customer: { select: { name: true } },
        lines: { select: { skuId: true, name: true, qty: true } },
      },
    }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="page-title">Returns / RMA</h1>
        <p className="page-sub">Manage return merchandise authorizations and restock or scrap decisions</p>
      </div>
      <ReturnsClient
        returns={JSON.parse(JSON.stringify(returns))}
        deliveredOrders={deliveredOrders}
        canApprove={["FINANCE", "ADMIN", "WAREHOUSE"].includes(role)}
        canReceive={["WAREHOUSE", "ADMIN"].includes(role)}
        canClose={["FINANCE", "ADMIN"].includes(role)}
        canCreate={["AGENT", "FINANCE", "ADMIN", "WAREHOUSE"].includes(role)}
      />
    </div>
  );
}
