import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatePill } from "@/components/ui/StatePill";
import { peso, fmtDate, fmtDateTime } from "@/lib/utils";
import { NEXT_STATE, STATE_LABEL } from "@/types";
import type { OrderState } from "@prisma/client";
import { OrderActions } from "./OrderActions";

interface Props { params: { id: string } }

export default async function OrderDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const role = session!.user.role;

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      lines: { include: { sku: true } },
      events: { include: { actor: true }, orderBy: { createdAt: "asc" } },
      shipments: true,
    },
  });
  if (!order) notFound();

  if (role === "CUSTOMER" && order.customerId !== session!.user.customerId) notFound();

  const transition = NEXT_STATE[order.state as OrderState];

  return (
    <div className="max-w-[900px]">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/orders" className="btn btn-ghost btn-sm">← Orders</Link>
        <h1 className="text-[17px] font-semibold flex-1">{order.id}</h1>
        <StatePill state={order.state as OrderState} />
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 300px" }}>
        {/* Main */}
        <div className="flex flex-col gap-4">
          {/* Lines */}
          <div className="card">
            <div className="card-head">
              <span className="card-h">Order Lines</span>
            </div>
            <div className="tbl-wrap" style={{ border: 0, borderRadius: 0 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="id">SKU</th>
                    <th className="num">Qty</th>
                    <th className="num">Unit Price</th>
                    <th className="num">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lines.map((line) => (
                    <tr key={line.id} style={{ cursor: "default" }}>
                      <td>{line.sku.name}</td>
                      <td className="id">{line.skuId}</td>
                      <td className="num">{line.qty.toLocaleString()}</td>
                      <td className="num">{peso(line.unitPrice)}</td>
                      <td className="num">{peso(line.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Totals */}
            <div className="card-body border-t" style={{ borderColor: "oklch(var(--line))" }}>
              <div className="ledger">
                <div className="ledger-row">
                  <span>Subtotal</span>
                  <span></span>
                  <span>{peso(order.subtotal)}</span>
                </div>
                <div className="ledger-row">
                  <span className="ledger-row-cr">VAT (12%)</span>
                  <span></span>
                  <span>{peso(order.vat)}</span>
                </div>
                {order.cwt2307 && (
                  <div className="ledger-row">
                    <span className="ledger-row-cr">CWT 2307 (−2%)</span>
                    <span></span>
                    <span>({peso(order.cwt)})</span>
                  </div>
                )}
                <div className="ledger-row ledger-row-total">
                  <span>Total</span>
                  <span></span>
                  <span>{peso(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="card">
            <div className="card-head"><span className="card-h">Order History</span></div>
            <div className="card-body">
              <div>
                {order.events.map((ev, i) => {
                  const isLast = i === order.events.length - 1;
                  return (
                    <div key={ev.id} className="tl-item">
                      <div className={`tl-dot ${isLast ? "tl-dot-active" : "tl-dot-done"}`}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          {isLast ? <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" /> : <path d="M20 6 9 17l-5-5" />}
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <StatePill state={ev.state as OrderState | "CANCELLED"} />
                          <span className="text-[11.5px]" style={{ color: "oklch(var(--ink-3))" }}>
                            by {ev.actor.name} · {fmtDateTime(ev.createdAt)}
                          </span>
                        </div>
                        {ev.note && <p className="text-[12.5px] mt-1" style={{ color: "oklch(var(--ink-2))" }}>{ev.note}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Details */}
          <div className="card">
            <div className="card-head"><span className="card-h">Details</span></div>
            <div className="card-body">
              <dl className="dl">
                <dt>Customer</dt>
                <dd>{order.customer.name}</dd>
                <dt>Date</dt>
                <dd>{fmtDate(order.createdAt)}</dd>
                {order.notes && (
                  <>
                    <dt>Notes</dt>
                    <dd>{order.notes}</dd>
                  </>
                )}
              </dl>
            </div>
          </div>

          {/* Actions */}
          {transition && (
            <OrderActions
              orderId={order.id}
              transition={transition}
              currentRole={role}
              state={order.state as OrderState}
            />
          )}
        </div>
      </div>
    </div>
  );
}
