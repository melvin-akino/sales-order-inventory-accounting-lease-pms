"use client";

import { useState } from "react";
import { peso, shortPeso, fmtDate, fmtRel } from "@/lib/utils";
import type { OrderState, InvoiceStatus, WoStatus } from "@prisma/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CustomerData {
  id: string; name: string; code: string; tin: string;
  city: string; region: string; terms: string;
  creditLimit: number; contactEmail: string;
}

interface OrderLine { name: string; qty: number; unitPrice: number }
interface Shipment {
  trackingNumber: string | null; courierId: string | null;
  shippedAt: string | null; eta: string | null;
}
interface PortalOrder {
  id: string; state: OrderState; total: number;
  createdAt: string; lines: OrderLine[]; shipment: Shipment | null;
}
interface PortalInvoice {
  id: string; soId: string | null; issued: string; due: string;
  amount: number; paid: number; status: InvoiceStatus;
}
interface WorkOrderSummary { status: WoStatus; title: string; dueDate: string | null }
interface LeaseAsset {
  id: string; name: string; serialNumber: string; category: string;
  lastWo: WorkOrderSummary | null;
}
interface PortalLease {
  id: string; startDate: string; endDate: string;
  monthlyRate: number; active: boolean; assets: LeaseAsset[];
}

interface Props {
  customer: CustomerData;
  openAR: number;
  orders: PortalOrder[];
  invoices: PortalInvoice[];
  leases: PortalLease[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATE_LABEL: Record<string, string> = {
  PENDING: "Pending", APPROVED: "Approved", PREPARING: "Preparing",
  SHIPPED: "Shipped", DELIVERED: "Delivered", CANCELLED: "Cancelled",
};
const STATE_COLOR: Record<string, { bg: string; fg: string }> = {
  PENDING:   { bg: "oklch(0.95 0.03 240)", fg: "oklch(0.35 0.10 240)" },
  APPROVED:  { bg: "oklch(0.95 0.03 290)", fg: "oklch(0.36 0.12 290)" },
  PREPARING: { bg: "oklch(0.95 0.04 80)",  fg: "oklch(0.32 0.10 80)"  },
  SHIPPED:   { bg: "oklch(0.95 0.03 200)", fg: "oklch(0.35 0.10 200)" },
  DELIVERED: { bg: "oklch(0.94 0.04 145)", fg: "oklch(0.32 0.10 145)" },
  CANCELLED: { bg: "oklch(0.94 0.03 25)",  fg: "oklch(0.40 0.12 25)"  },
};
const INV_STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  DRAFT:   { label: "Draft",   bg: "oklch(0.94 0.01 250)", fg: "oklch(0.40 0.02 250)" },
  OPEN:    { label: "Open",    bg: "oklch(0.95 0.03 240)", fg: "oklch(0.35 0.10 240)" },
  PARTIAL: { label: "Partial", bg: "oklch(0.94 0.04 80)",  fg: "oklch(0.32 0.10 80)"  },
  OVERDUE: { label: "Overdue", bg: "oklch(0.94 0.05 25)",  fg: "oklch(0.40 0.12 25)"  },
  PAID:    { label: "Paid",    bg: "oklch(0.94 0.04 145)", fg: "oklch(0.32 0.10 145)" },
};
const WO_STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  PENDING:     { label: "Pending",     bg: "oklch(0.94 0.01 250)", fg: "oklch(0.40 0.02 250)" },
  IN_PROGRESS: { label: "In progress", bg: "oklch(0.95 0.04 80)",  fg: "oklch(0.32 0.10 80)"  },
  NEEDS_PARTS: { label: "Needs parts", bg: "oklch(0.94 0.05 25)",  fg: "oklch(0.40 0.12 25)"  },
  COMPLETED:   { label: "Completed",   bg: "oklch(0.94 0.04 145)", fg: "oklch(0.32 0.10 145)" },
};

function Pill({ bg, fg, label }: { bg: string; fg: string; label: string }) {
  return (
    <span style={{ padding: "3px 9px", borderRadius: 4, fontSize: 11.5, background: bg, color: fg, fontWeight: 500, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

// ── Tab definitions ───────────────────────────────────────────────────────────

const TABS = [
  ["OVERVIEW",  "Overview"],
  ["ORDERS",    "My orders"],
  ["INVOICES",  "Invoices"],
  ["LEASES",    "Leases & equipment"],
] as const;

// ── Main component ────────────────────────────────────────────────────────────

export function PortalClient({ customer, openAR, orders, invoices, leases }: Props) {
  const [tab, setTab]   = useState<typeof TABS[number][0]>("OVERVIEW");
  const [expanded, setExpanded] = useState<string | null>(null);

  const creditUsedPct = customer.creditLimit > 0
    ? Math.min(openAR / customer.creditLimit, 1)
    : 0;
  const creditWarn = creditUsedPct > 0.8;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: "oklch(var(--accent-soft))", color: "oklch(var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
            {customer.name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{customer.name}</h1>
            <div style={{ fontSize: 12, color: "oklch(var(--ink-3))", marginTop: 2, display: "flex", gap: 12 }}>
              <span>Code: <strong>{customer.code}</strong></span>
              {customer.tin && <span>TIN: <strong>{customer.tin}</strong></span>}
              <span>{customer.city}{customer.region && `, ${customer.region}`}</span>
              <span>Terms: <strong>{customer.terms}</strong></span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
            <a href="/orders/new" className="btn btn-accent">+ New Order</a>
            <div style={{ fontSize: 11, color: "oklch(var(--ink-3))", marginBottom: 4 }}>
              Credit utilization ({Math.round(creditUsedPct * 100)}%)
            </div>
            <div style={{ width: 200, height: 8, borderRadius: 4, background: "oklch(var(--bg-2))", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 4, transition: "width 0.3s",
                width: `${creditUsedPct * 100}%`,
                background: creditWarn ? "oklch(0.55 0.14 25)" : "oklch(0.55 0.13 145)",
              }} />
            </div>
            <div style={{ fontSize: 12, marginTop: 4, color: creditWarn ? "oklch(0.50 0.14 25)" : "oklch(var(--ink-3))" }}>
              {shortPeso(openAR)} used of {shortPeso(customer.creditLimit)} limit
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(([k, l]) => (
          <button key={k} className="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "OVERVIEW"  && <OverviewTab customer={customer} orders={orders} invoices={invoices} leases={leases} openAR={openAR} onTabChange={setTab} />}
      {tab === "ORDERS"    && <OrdersTab orders={orders} expanded={expanded} onExpand={setExpanded} />}
      {tab === "INVOICES"  && <InvoicesTab invoices={invoices} />}
      {tab === "LEASES"    && <LeasesTab leases={leases} />}
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ customer, orders, invoices, leases, openAR, onTabChange }: {
  customer: CustomerData; orders: PortalOrder[]; invoices: PortalInvoice[];
  leases: PortalLease[]; openAR: number;
  onTabChange: (t: typeof TABS[number][0]) => void;
}) {
  const pendingOrders  = orders.filter((o) => ["PENDING","APPROVED","PREPARING"].includes(o.state)).length;
  const shippedOrders  = orders.filter((o) => o.state === "SHIPPED").length;
  const overdueInv     = invoices.filter((i) => i.status === "OVERDUE");
  const activeLeases   = leases.filter((l) => l.active).length;
  const totalAssets    = leases.reduce((s, l) => s + l.assets.length, 0);

  return (
    <div>
      {overdueInv.length > 0 && (
        <div className="callout mb-4" style={{ background: "oklch(0.97 0.04 25)", borderColor: "oklch(0.85 0.10 25)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="oklch(0.55 0.14 25)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 500, fontSize: 13 }}>{overdueInv.length} overdue invoice{overdueInv.length > 1 ? "s" : ""} — </span>
            <span style={{ fontSize: 13 }}>{shortPeso(overdueInv.reduce((s, i) => s + i.amount - i.paid, 0))} past due</span>
          </div>
          <button className="btn btn-sm" onClick={() => onTabChange("INVOICES")}>View invoices</button>
        </div>
      )}

      <div className="stat-grid mb-4">
        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => onTabChange("ORDERS")}>
          <div className="stat-label">Active orders</div>
          <div className="stat-value">{pendingOrders + shippedOrders}</div>
          <div className="stat-trend">{shippedOrders} in transit</div>
        </div>
        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => onTabChange("INVOICES")}>
          <div className="stat-label">Outstanding balance</div>
          <div className="stat-value">{shortPeso(openAR)}</div>
          <div className="stat-trend" style={overdueInv.length > 0 ? { color: "oklch(0.50 0.14 25)" } : undefined}>
            {overdueInv.length > 0 ? `${overdueInv.length} overdue` : "All current"}
          </div>
        </div>
        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => onTabChange("LEASES")}>
          <div className="stat-label">Active leases</div>
          <div className="stat-value">{activeLeases}</div>
          <div className="stat-trend">{totalAssets} leased assets</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total orders (all time)</div>
          <div className="stat-value">{orders.length}</div>
          <div className="stat-trend">{orders.filter((o) => o.state === "DELIVERED").length} delivered</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Recent orders */}
        <div className="card">
          <div className="card-head">
            <span className="card-h">Recent orders</span>
            <button className="btn btn-ghost btn-sm ml-auto" onClick={() => onTabChange("ORDERS")}>See all</button>
          </div>
          <div className="tbl-wrap" style={{ border: 0, borderRadius: 0, borderTop: "1px solid oklch(var(--line))" }}>
            <table className="tbl">
              <thead><tr><th className="id">Order</th><th>Date</th><th className="num">Amount</th><th>Status</th></tr></thead>
              <tbody>
                {orders.slice(0, 5).map((o) => {
                  const sc = STATE_COLOR[o.state] ?? { bg: "oklch(var(--bg-2))", fg: "oklch(var(--ink-3))" };
                  return (
                    <tr key={o.id} style={{ cursor: "default" }}>
                      <td className="id">{o.id}</td>
                      <td className="dim">{fmtRel(o.createdAt)}</td>
                      <td className="num">{peso(o.total)}</td>
                      <td><Pill bg={sc.bg} fg={sc.fg} label={STATE_LABEL[o.state] ?? o.state} /></td>
                    </tr>
                  );
                })}
                {orders.length === 0 && <tr><td colSpan={4}><div className="empty-state">No orders yet</div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Unpaid invoices */}
        <div className="card">
          <div className="card-head">
            <span className="card-h">Unpaid invoices</span>
            <button className="btn btn-ghost btn-sm ml-auto" onClick={() => onTabChange("INVOICES")}>See all</button>
          </div>
          <div className="tbl-wrap" style={{ border: 0, borderRadius: 0, borderTop: "1px solid oklch(var(--line))" }}>
            <table className="tbl">
              <thead><tr><th className="id">Invoice</th><th>Due</th><th className="num">Balance</th><th>Status</th></tr></thead>
              <tbody>
                {invoices.filter((i) => i.status !== "PAID").slice(0, 5).map((i) => {
                  const st = INV_STATUS_STYLE[i.status];
                  const overdue = i.status === "OVERDUE";
                  return (
                    <tr key={i.id} style={{ cursor: "default" }}>
                      <td className="id">{i.id}</td>
                      <td style={overdue ? { color: "var(--st-cancel-fg)", fontWeight: 500 } : {}}>{fmtDate(i.due)}</td>
                      <td className="num" style={{ fontWeight: 500 }}>{peso(i.amount - i.paid)}</td>
                      <td><Pill bg={st.bg} fg={st.fg} label={st.label} /></td>
                    </tr>
                  );
                })}
                {invoices.filter((i) => i.status !== "PAID").length === 0 && (
                  <tr><td colSpan={4}><div className="empty-state" style={{ color: "oklch(0.45 0.12 145)" }}>All invoices paid ✓</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Orders tab ────────────────────────────────────────────────────────────────

function OrdersTab({ orders, expanded, onExpand }: { orders: PortalOrder[]; expanded: string | null; onExpand: (id: string | null) => void }) {
  const [filter, setFilter] = useState("ALL");
  const filters = ["ALL", "PENDING", "APPROVED", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"];

  const filtered = filter === "ALL" ? orders : orders.filter((o) => o.state === filter);

  return (
    <div>
      <div className="filters">
        {filters.map((f) => (
          <button key={f} className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f === "ALL" ? "All" : STATE_LABEL[f]}
          </button>
        ))}
        <span className="ml-auto text-[12px]" style={{ color: "oklch(var(--ink-3))" }}>{filtered.length} orders</span>
      </div>

      <div className="flex flex-col gap-2">
        {filtered.map((o) => {
          const sc = STATE_COLOR[o.state] ?? { bg: "oklch(var(--bg-2))", fg: "oklch(var(--ink-3))" };
          const isOpen = expanded === o.id;
          return (
            <div key={o.id} className="je-card">
              <button className="je-head" onClick={() => onExpand(isOpen ? null : o.id)}>
                <span className="id text-[12px]" style={{ fontFamily: "monospace" }}>{o.id}</span>
                <Pill bg={sc.bg} fg={sc.fg} label={STATE_LABEL[o.state] ?? o.state} />
                <span className="dim" style={{ fontSize: 12 }}>{fmtDate(o.createdAt)}</span>
                {o.shipment?.trackingNumber && (
                  <span style={{ fontSize: 12, color: "oklch(var(--ink-3))" }}>
                    📦 {o.shipment.courierId} · {o.shipment.trackingNumber}
                  </span>
                )}
                <span className="ml-auto flex items-center gap-4">
                  {o.state === "SHIPPED" && o.shipment?.eta && (
                    <span style={{ fontSize: 12, color: "oklch(0.35 0.10 200)" }}>ETA {fmtDate(o.shipment.eta)}</span>
                  )}
                  <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace" }}>{peso(o.total)}</span>
                  <svg className="je-chevron" data-open={isOpen ? "1" : "0"} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </button>

              {isOpen && (
                <div className="je-body">
                  {/* Shipment info */}
                  {o.shipment && (
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid oklch(var(--line))", display: "flex", gap: 24, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: 11, color: "oklch(var(--ink-3))", marginBottom: 2 }}>Courier</div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{o.shipment.courierId ?? "—"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "oklch(var(--ink-3))", marginBottom: 2 }}>Tracking number</div>
                        <div style={{ fontSize: 13, fontWeight: 500, fontFamily: "monospace" }}>{o.shipment.trackingNumber ?? "—"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "oklch(var(--ink-3))", marginBottom: 2 }}>Shipped</div>
                        <div style={{ fontSize: 13 }}>{o.shipment.shippedAt ? fmtDate(o.shipment.shippedAt) : "—"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "oklch(var(--ink-3))", marginBottom: 2 }}>ETA</div>
                        <div style={{ fontSize: 13, fontWeight: o.state === "SHIPPED" ? 500 : 400, color: o.state === "SHIPPED" ? "oklch(0.35 0.10 200)" : undefined }}>
                          {o.shipment.eta ? fmtDate(o.shipment.eta) : "—"}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Line items */}
                  <div className="tbl-wrap" style={{ border: 0, borderRadius: 0 }}>
                    <table className="tbl">
                      <thead><tr><th>Item</th><th className="num">Qty</th><th className="num">Unit price</th><th className="num">Line total</th></tr></thead>
                      <tbody>
                        {o.lines.map((l, i) => (
                          <tr key={i} style={{ cursor: "default" }}>
                            <td>{l.name}</td>
                            <td className="num">{l.qty.toLocaleString()}</td>
                            <td className="num dim">{peso(l.unitPrice)}</td>
                            <td className="num" style={{ fontWeight: 500 }}>{peso(l.qty * l.unitPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="je-foot">
                    <span style={{ fontSize: 12, color: "oklch(var(--ink-3))" }}>Ordered {fmtDate(o.createdAt)}</span>
                    <span style={{ marginLeft: "auto", fontWeight: 600, fontFamily: "monospace" }}>Total: {peso(o.total)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <div className="empty-state">No orders in this category</div>}
      </div>
    </div>
  );
}

// ── Invoices tab ──────────────────────────────────────────────────────────────

function InvoicesTab({ invoices }: { invoices: PortalInvoice[] }) {
  const [sub, setSub] = useState("UNPAID");
  const today = new Date();

  const counts = {
    UNPAID: invoices.filter((i) => i.status !== "PAID").length,
    OVERDUE: invoices.filter((i) => i.status === "OVERDUE").length,
    PAID: invoices.filter((i) => i.status === "PAID").length,
    ALL: invoices.length,
  };
  const filtered = invoices.filter((i) => {
    if (sub === "UNPAID")  return i.status !== "PAID";
    if (sub === "OVERDUE") return i.status === "OVERDUE";
    if (sub === "PAID")    return i.status === "PAID";
    return true;
  });

  const totalDue = invoices.filter((i) => i.status !== "PAID").reduce((s, i) => s + i.amount - i.paid, 0);

  return (
    <div>
      <div className="stat-grid mb-4">
        <div className="stat-card">
          <div className="stat-label">Total outstanding</div>
          <div className="stat-value">{shortPeso(totalDue)}</div>
          <div className="stat-trend">{counts.UNPAID} open invoices</div>
        </div>
        <div className="stat-card" style={counts.OVERDUE > 0 ? { borderTop: "3px solid oklch(0.55 0.14 25)" } : undefined}>
          <div className="stat-label">Overdue</div>
          <div className="stat-value">{counts.OVERDUE}</div>
          <div className="stat-trend" style={counts.OVERDUE > 0 ? { color: "oklch(0.50 0.14 25)" } : undefined}>
            {counts.OVERDUE > 0 ? "Immediate attention" : "None overdue"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Paid invoices</div>
          <div className="stat-value">{counts.PAID}</div>
          <div className="stat-trend">Fully settled</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total invoices</div>
          <div className="stat-value">{invoices.length}</div>
          <div className="stat-trend">All time</div>
        </div>
      </div>

      <div className="tabs">
        {[["UNPAID","Unpaid",counts.UNPAID],["OVERDUE","Overdue",counts.OVERDUE],["PAID","Paid",counts.PAID],["ALL","All",counts.ALL]].map(([k,l,n]) => (
          <button key={k} className="tab" aria-selected={sub === k} onClick={() => setSub(k as string)}>{l} <span className="tab-count">{n}</span></button>
        ))}
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr>
            <th className="id">Invoice</th><th className="id">Order</th>
            <th>Issued</th><th>Due</th>
            <th className="num">Amount</th><th className="num">Paid</th><th className="num">Balance</th>
            <th>Status</th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8}><div className="empty-state">No invoices</div></td></tr>}
            {filtered.map((i) => {
              const st = INV_STATUS_STYLE[i.status];
              const overdue = i.status === "OVERDUE";
              const days = Math.floor((today.getTime() - new Date(i.due).getTime()) / 86400000);
              return (
                <tr key={i.id} style={{ cursor: "default" }}>
                  <td className="id">{i.id}</td>
                  <td className="id dim">{i.soId ?? "—"}</td>
                  <td className="dim">{fmtDate(i.issued)}</td>
                  <td style={overdue ? { color: "var(--st-cancel-fg)", fontWeight: 500 } : {}}>
                    {fmtDate(i.due)}{overdue && days > 0 && <span className="ml-1 text-[11px] opacity-70">{days}d</span>}
                  </td>
                  <td className="num">{peso(i.amount)}</td>
                  <td className="num dim">{i.paid > 0 ? peso(i.paid) : "—"}</td>
                  <td className="num" style={{ fontWeight: 500, color: overdue ? "var(--st-cancel-fg)" : undefined }}>{peso(i.amount - i.paid)}</td>
                  <td><Pill bg={st.bg} fg={st.fg} label={st.label} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Leases & equipment tab ────────────────────────────────────────────────────

function LeasesTab({ leases }: { leases: PortalLease[] }) {
  if (leases.length === 0) {
    return (
      <div className="empty-state" style={{ marginTop: 48 }}>
        <div className="empty-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
        </div>
        No active leases
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {leases.map((l) => {
        const daysLeft = Math.ceil((new Date(l.endDate).getTime() - Date.now()) / 86400000);
        const expiringSoon = daysLeft > 0 && daysLeft <= 60;
        const expired = daysLeft <= 0;
        return (
          <div key={l.id} className="card">
            <div className="card-head">
              <div>
                <div className="card-h">Lease {l.id.slice(0, 8).toUpperCase()}</div>
                <div style={{ fontSize: 12, color: "oklch(var(--ink-3))", marginTop: 2 }}>
                  {fmtDate(l.startDate)} → {fmtDate(l.endDate)} · {peso(l.monthlyRate)}/mo
                </div>
              </div>
              <div className="ml-auto flex items-center gap-3">
                {expired ? (
                  <Pill bg="oklch(0.94 0.05 25)" fg="oklch(0.40 0.12 25)" label="Expired" />
                ) : expiringSoon ? (
                  <Pill bg="oklch(0.94 0.04 80)" fg="oklch(0.32 0.10 80)" label={`Expires in ${daysLeft}d`} />
                ) : l.active ? (
                  <Pill bg="oklch(0.94 0.04 145)" fg="oklch(0.32 0.10 145)" label="Active" />
                ) : (
                  <Pill bg="oklch(0.94 0.01 250)" fg="oklch(0.40 0.02 250)" label="Inactive" />
                )}
              </div>
            </div>

            {l.assets.length === 0 ? (
              <div style={{ padding: "12px 16px", fontSize: 13, color: "oklch(var(--ink-3))" }}>No assets on this lease.</div>
            ) : (
              <div className="tbl-wrap" style={{ border: 0, borderRadius: 0, borderTop: "1px solid oklch(var(--line))" }}>
                <table className="tbl">
                  <thead><tr>
                    <th>Equipment</th><th>Serial number</th><th>Category</th><th>Last maintenance</th><th>Status</th>
                  </tr></thead>
                  <tbody>
                    {l.assets.map((a) => {
                      const wo = a.lastWo;
                      const ws = wo ? WO_STATUS_STYLE[wo.status] : null;
                      return (
                        <tr key={a.id} style={{ cursor: "default" }}>
                          <td style={{ fontWeight: 500 }}>{a.name}</td>
                          <td className="id">{a.serialNumber}</td>
                          <td className="dim" style={{ fontSize: 12 }}>{a.category.replace(/_/g, " ")}</td>
                          <td>
                            {wo ? (
                              <div>
                                <div style={{ fontSize: 12.5 }}>{wo.title}</div>
                                {wo.dueDate && <div style={{ fontSize: 11, color: "oklch(var(--ink-3))" }}>Due {fmtDate(wo.dueDate)}</div>}
                              </div>
                            ) : <span className="dim">—</span>}
                          </td>
                          <td>
                            {ws ? <Pill bg={ws.bg} fg={ws.fg} label={ws.label} /> : <span className="dim">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
