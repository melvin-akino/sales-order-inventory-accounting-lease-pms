import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatePill } from "@/components/ui/StatePill";
import Link from "next/link";
import type { OrderState } from "@prisma/client";

const COLS: OrderState[] = ["APPROVED", "PREPARING", "SHIPPED"];

export default async function WarehousePage() {
  const session = await getServerSession(authOptions);
  if (!session || !["WAREHOUSE", "ADMIN"].includes(session.user.role)) redirect("/orders");

  const orders = await prisma.order.findMany({
    where: { state: { in: COLS } },
    include: { customer: true },
    orderBy: { createdAt: "asc" },
  });

  const byState = (s: OrderState) => orders.filter((o) => o.state === s);

  return (
    <div>
      <h1 className="text-[18px] font-semibold mb-4">Warehouse Kanban</h1>
      <div className="kanban" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {COLS.map((col) => (
          <div key={col} className="kcol">
            <div className="kcol-h">
              <StatePill state={col} />
              <span className="ml-auto badge">{byState(col).length}</span>
            </div>
            {byState(col).map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`} className="kcard no-underline">
                <div className="text-[12px] font-semibold" style={{ color: "oklch(var(--ink))" }}>{order.id}</div>
                <div className="text-[11.5px]" style={{ color: "oklch(var(--ink-3))" }}>{order.customer.name}</div>
              </Link>
            ))}
            {byState(col).length === 0 && (
              <div className="text-[11.5px] text-center py-6" style={{ color: "oklch(var(--ink-4))" }}>Empty</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
