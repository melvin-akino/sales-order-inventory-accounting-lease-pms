"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { approveOrder, rejectOrder } from "./actions";
import { useToast } from "@/components/ui/Toast";
import { peso, fmtDate } from "@/lib/utils";

interface Order {
  id: string;
  createdAt: string;
  total: string;
  notes: string | null;
  customer: { name: string };
}

interface Props { orders: Order[] }

export function ApprovalsClient({ orders }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  function handleApprove(orderId: string) {
    setBusy(orderId);
    startTransition(async () => {
      try {
        await approveOrder(orderId);
        toast(`Order ${orderId} approved`, "success");
        router.refresh();
      } catch (e) {
        toast((e as Error).message, "error");
      } finally {
        setBusy(null);
      }
    });
  }

  function openReject(orderId: string) {
    setRejectTarget(orderId);
    setRejectReason("");
  }

  function handleReject() {
    if (!rejectTarget) return;
    const id = rejectTarget;
    setBusy(id);
    setRejectTarget(null);
    startTransition(async () => {
      try {
        await rejectOrder(id, rejectReason);
        toast(`Order ${id} rejected`, "success");
        router.refresh();
      } catch (e) {
        toast((e as Error).message, "error");
      } finally {
        setBusy(null);
      }
    });
  }

  return (
    <>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th className="id">Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Notes</th>
              <th className="num">Total</th>
              <th style={{ width: 180 }}></th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                    </div>
                    No pending approvals
                  </div>
                </td>
              </tr>
            )}
            {orders.map((order) => {
              const isBusy = busy === order.id || (isPending && busy === order.id);
              return (
                <tr key={order.id} style={{ cursor: "default" }}>
                  <td className="id">
                    <Link href={`/orders/${order.id}`} className="hover:underline">
                      {order.id}
                    </Link>
                  </td>
                  <td>{order.customer.name}</td>
                  <td className="dim">{fmtDate(new Date(order.createdAt))}</td>
                  <td className="dim" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {order.notes ?? "—"}
                  </td>
                  <td className="num">{peso(order.total)}</td>
                  <td>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => handleApprove(order.id)}
                        disabled={isBusy || isPending}
                        className="btn btn-sm btn-accent"
                      >
                        {isBusy ? "…" : "Approve"}
                      </button>
                      <button
                        onClick={() => openReject(order.id)}
                        disabled={isBusy || isPending}
                        className="btn btn-sm btn-danger"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Reject modal */}
      {rejectTarget && (
        <>
          <div className="scrim" onClick={() => setRejectTarget(null)} />
          <div className="modal" style={{ width: "min(420px, 92vw)" }}>
            <div className="card-head">
              <span className="card-h">Reject Order</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setRejectTarget(null)}>✕</button>
            </div>
            <div className="card-body flex flex-col gap-4">
              <p className="text-[13px]" style={{ color: "oklch(var(--ink-2))" }}>
                Rejecting <strong>{rejectTarget}</strong>. This will cancel the order.
              </p>
              <div>
                <label className="field-label">Reason (optional)</label>
                <textarea
                  className="field-input"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for rejection…"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <button className="btn" onClick={() => setRejectTarget(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleReject}>
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
