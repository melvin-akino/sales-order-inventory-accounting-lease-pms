"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { approveReturn, receiveReturn, closeReturn, createReturn } from "./actions";

type ReturnStatus = "REQUESTED" | "APPROVED" | "RECEIVED" | "CLOSED";
type Disposition = "RESTOCK" | "SCRAP";

interface ReturnLine {
  id: string; skuId: string; name: string;
  qtyRequested: number; qtyReceived: number; disposition: Disposition;
}
interface ReturnItem {
  id: string; status: ReturnStatus; reason: string; notes: string | null;
  createdAt: string; orderId: string;
  order: { id: string; customer: { name: string } };
  lines: ReturnLine[];
}
interface OrderOption {
  id: string;
  customer: { name: string };
  lines: { skuId: string; name: string; qty: number }[];
}

interface Props {
  returns: ReturnItem[];
  deliveredOrders: OrderOption[];
  canApprove: boolean;
  canReceive: boolean;
  canClose: boolean;
  canCreate: boolean;
}

const STATUS_COLOR: Record<ReturnStatus, string> = {
  REQUESTED: "#d97706", APPROVED: "#2563eb", RECEIVED: "#16a34a", CLOSED: "#6b7280",
};

function StatusPill({ status }: { status: ReturnStatus }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 4,
      fontSize: 11, fontWeight: 600,
      background: STATUS_COLOR[status] + "22", color: STATUS_COLOR[status],
    }}>{status}</span>
  );
}

function NewReturnModal({ orders, onClose }: { orders: OrderOption[]; onClose: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<{ skuId: string; name: string; qtyRequested: number; disposition: Disposition }[]>([]);

  const selectedOrder = orders.find(o => o.id === orderId);

  function handleOrderChange(id: string) {
    setOrderId(id);
    const order = orders.find(o => o.id === id);
    setLines(order ? order.lines.map(l => ({ skuId: l.skuId, name: l.name, qtyRequested: 1, disposition: "RESTOCK" as Disposition })) : []);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderId || !reason || lines.length === 0) { toast("Fill all fields", "error"); return; }
    const activeLines = lines.filter(l => l.qtyRequested > 0);
    if (!activeLines.length) { toast("At least one line must have qty > 0", "error"); return; }
    startTransition(async () => {
      try {
        const id = await createReturn({ orderId, reason, notes, lines: activeLines });
        toast(`Return ${id} requested`, "success");
        router.refresh();
        onClose();
      } catch (e) { toast((e as Error).message, "error"); }
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "oklch(var(--bg))", borderRadius: 10, width: "min(680px, 95vw)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <form onSubmit={submit}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid oklch(var(--line))", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>New Return / RMA</span>
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">✕</button>
          </div>
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="field-label">Delivered Order</label>
              <select className="field-input" value={orderId} onChange={e => handleOrderChange(e.target.value)} required>
                <option value="">Select order…</option>
                {orders.map(o => <option key={o.id} value={o.id}>{o.id} — {o.customer.name}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Reason for Return</label>
              <input className="field-input" value={reason} onChange={e => setReason(e.target.value)} placeholder="Defective unit, wrong item, excess order…" required />
            </div>
            <div>
              <label className="field-label">Notes</label>
              <textarea className="field-input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional details…" />
            </div>

            {lines.length > 0 && (
              <div>
                <label className="field-label">Line Items</label>
                <div style={{ border: "1px solid oklch(var(--line))", borderRadius: 7, overflow: "hidden" }}>
                  <table className="tbl" style={{ borderRadius: 0 }}>
                    <thead><tr><th>Product</th><th className="num" style={{ width: 80 }}>Max Qty</th><th className="num" style={{ width: 80 }}>Return Qty</th><th style={{ width: 110 }}>Disposition</th></tr></thead>
                    <tbody>
                      {lines.map((line, i) => {
                        const original = selectedOrder?.lines.find(l => l.skuId === line.skuId);
                        return (
                          <tr key={line.skuId}>
                            <td>{line.name}</td>
                            <td className="num" style={{ color: "oklch(var(--ink-3))", fontSize: 12 }}>{original?.qty ?? 0}</td>
                            <td className="num">
                              <input type="number" min={0} max={original?.qty ?? 999} className="field-input text-right"
                                value={line.qtyRequested}
                                onChange={e => {
                                  const v = parseInt(e.target.value) || 0;
                                  setLines(prev => prev.map((l, idx) => idx === i ? { ...l, qtyRequested: v } : l));
                                }}
                              />
                            </td>
                            <td>
                              <select className="field-input" value={line.disposition}
                                onChange={e => setLines(prev => prev.map((l, idx) => idx === i ? { ...l, disposition: e.target.value as Disposition } : l))}>
                                <option value="RESTOCK">Restock</option>
                                <option value="SCRAP">Scrap</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <div style={{ padding: "14px 20px", display: "flex", justifyContent: "flex-end", gap: 8, borderTop: "1px solid oklch(var(--line))" }}>
            <button type="button" onClick={onClose} className="btn">Cancel</button>
            <button type="submit" disabled={isPending} className="btn btn-accent">{isPending ? "Submitting…" : "Submit Return"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReceiveModal({ ret, onClose }: { ret: ReturnItem; onClose: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [qtys, setQtys] = useState<Record<string, number>>(
    Object.fromEntries(ret.lines.map(l => [l.id, l.qtyRequested]))
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const lines = ret.lines.map(l => ({ id: l.id, qtyReceived: qtys[l.id] ?? 0 }));
    startTransition(async () => {
      try {
        await receiveReturn(ret.id, lines);
        toast("Return received", "success");
        router.refresh();
        onClose();
      } catch (e) { toast((e as Error).message, "error"); }
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "oklch(var(--bg))", borderRadius: 10, width: "min(560px, 95vw)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <form onSubmit={submit}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid oklch(var(--line))", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Receive Return — {ret.id}</span>
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">✕</button>
          </div>
          <div style={{ padding: 20 }}>
            <table className="tbl">
              <thead><tr><th>Product</th><th className="num">Requested</th><th className="num">Received</th><th>Disposition</th></tr></thead>
              <tbody>
                {ret.lines.map(line => (
                  <tr key={line.id}>
                    <td>{line.name}</td>
                    <td className="num">{line.qtyRequested}</td>
                    <td className="num">
                      <input type="number" min={0} max={line.qtyRequested} className="field-input text-right" style={{ width: 70 }}
                        value={qtys[line.id] ?? line.qtyRequested}
                        onChange={e => setQtys(p => ({ ...p, [line.id]: parseInt(e.target.value) || 0 }))}
                      />
                    </td>
                    <td><span style={{ fontSize: 12, padding: "2px 6px", borderRadius: 4, background: line.disposition === "RESTOCK" ? "#dcfce7" : "#fee2e2", color: line.disposition === "RESTOCK" ? "#16a34a" : "#dc2626" }}>{line.disposition}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "14px 20px", display: "flex", justifyContent: "flex-end", gap: 8, borderTop: "1px solid oklch(var(--line))" }}>
            <button type="button" onClick={onClose} className="btn">Cancel</button>
            <button type="submit" disabled={isPending} className="btn btn-accent">{isPending ? "Saving…" : "Confirm Receipt"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ReturnsClient({ returns, deliveredOrders, canApprove, canReceive, canClose, canCreate }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showNew, setShowNew] = useState(false);
  const [receiving, setReceiving] = useState<ReturnItem | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  function handleApprove(id: string) {
    startTransition(async () => {
      try { await approveReturn(id); toast("Return approved", "success"); router.refresh(); }
      catch (e) { toast((e as Error).message, "error"); }
    });
  }
  function handleClose(id: string) {
    startTransition(async () => {
      try { await closeReturn(id); toast("Return closed", "success"); router.refresh(); }
      catch (e) { toast((e as Error).message, "error"); }
    });
  }

  const filtered = returns.filter(r => statusFilter === "ALL" || r.status === statusFilter);

  return (
    <>
      {showNew && <NewReturnModal orders={deliveredOrders} onClose={() => setShowNew(false)} />}
      {receiving && <ReceiveModal ret={receiving} onClose={() => setReceiving(null)} />}

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <select className="field-input" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="ALL">All Statuses</option>
            {["REQUESTED", "APPROVED", "RECEIVED", "CLOSED"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{ flex: 1 }} />
          {canCreate && (
            <button className="btn btn-accent" onClick={() => setShowNew(true)}>+ New Return</button>
          )}
        </div>

        <div className="card">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Return ID</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Items</th>
                  <th>Date</th>
                  <th style={{ width: 180 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: "32px 0", color: "oklch(var(--ink-3))", fontSize: 13 }}>No returns found</td></tr>
                )}
                {filtered.map(ret => (
                  <tr key={ret.id}>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{ret.id.slice(0, 8)}…</td>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{ret.orderId}</td>
                    <td>{ret.order.customer.name}</td>
                    <td style={{ fontSize: 12, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ret.reason}</td>
                    <td><StatusPill status={ret.status} /></td>
                    <td style={{ fontSize: 12 }}>{ret.lines.length} line{ret.lines.length !== 1 ? "s" : ""}</td>
                    <td style={{ fontSize: 12 }}>{new Date(ret.createdAt).toLocaleDateString("en-PH")}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        {ret.status === "REQUESTED" && canApprove && (
                          <button className="btn btn-sm" onClick={() => handleApprove(ret.id)} disabled={isPending}>Approve</button>
                        )}
                        {ret.status === "APPROVED" && canReceive && (
                          <button className="btn btn-accent btn-sm" onClick={() => setReceiving(ret)}>Receive</button>
                        )}
                        {ret.status === "RECEIVED" && canClose && (
                          <button className="btn btn-sm" onClick={() => handleClose(ret.id)} disabled={isPending}>Close</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
