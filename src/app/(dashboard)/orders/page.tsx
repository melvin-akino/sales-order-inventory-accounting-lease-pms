import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatePill } from "@/components/ui/StatePill";
import { peso, fmtDate } from "@/lib/utils";
import { STATE_LABEL } from "@/types";
import type { OrderState } from "@prisma/client";

interface Props {
  searchParams: { state?: string };
}

export default async function OrdersPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  const role = session!.user.role;
  const stateFilter = searchParams.state as OrderState | undefined;

  const where =
    role === "CUSTOMER"
      ? { customerId: session!.user.customerId, ...(stateFilter ? { state: stateFilter } : {}) }
      : stateFilter
      ? { state: stateFilter }
      : {};

  const orders = await prisma.order.findMany({
    where,
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const counts: Record<string, number> = {};
  for (const s of Object.keys(STATE_LABEL)) {
    counts[s] = await prisma.order.count({
      where: { ...(role === "CUSTOMER" ? { customerId: session!.user.customerId } : {}), state: s as OrderState },
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-semibold">Sales Orders</h1>
        {(role === "AGENT" || role === "ADMIN" || role === "CUSTOMER") && (
          <Link href="/orders/new" className="btn btn-accent">
            + New Order
          </Link>
        )}
      </div>

      {/* State filter tabs */}
      <div className="tabs">
        <Link
          href="/orders"
          className={`tab ${!stateFilter ? '[aria-selected="true"]' : ""}`}
          aria-selected={!stateFilter}
        >
          All
        </Link>
        {(Object.keys(STATE_LABEL) as (OrderState | "CANCELLED")[]).map((s) => (
          <Link
            key={s}
            href={`/orders?state=${s}`}
            className="tab"
            aria-selected={stateFilter === s}
          >
            {STATE_LABEL[s]}
            {counts[s] > 0 && <span className="tab-count">{counts[s]}</span>}
          </Link>
        ))}
      </div>

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
            {orders.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <div className="empty-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18" />
                      </svg>
                    </div>
                    No orders found
                  </div>
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="id">
                  <Link href={`/orders/${order.id}`} className="hover:underline">
                    {order.id}
                  </Link>
                </td>
                <td>{order.customer.name}</td>
                <td className="dim">{fmtDate(order.createdAt)}</td>
                <td><StatePill state={order.state as OrderState} /></td>
                <td className="num">{peso(order.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
