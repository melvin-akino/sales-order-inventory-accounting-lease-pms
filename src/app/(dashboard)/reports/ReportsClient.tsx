"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReportData, ReportType, SalesRow, ArAgingRow, InventoryRow, PoSummaryRow, PlRow } from "./page";
import { HelpButton } from "@/components/HelpButton";

const REPORT_TYPES: { value: ReportType; label: string; desc: string }[] = [
  { value: "SALES",     label: "Sales Summary",       desc: "Revenue by month, top customers" },
  { value: "AR_AGING",  label: "AR Aging",            desc: "Outstanding receivables by age bucket" },
  { value: "INVENTORY", label: "Inventory Snapshot",  desc: "Current stock levels by SKU & warehouse" },
  { value: "PO_SUMMARY",label: "PO Summary",          desc: "Purchase orders by supplier & status" },
  { value: "PL",        label: "P&L Statement",       desc: "Revenue vs expenses for the period" },
];

const SHOW_DATE: Record<ReportType, boolean> = {
  SALES: true, AR_AGING: false, INVENTORY: false, PO_SUMMARY: true, PL: true,
};

function peso(n: number) {
  return "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Th({ children, right = false }: { children: React.ReactNode; right?: boolean }) {
  return <th className={right ? "num" : ""}>{children}</th>;
}

function Td({ children, right = false, dim = false, warn = false }: { children: React.ReactNode; right?: boolean; dim?: boolean; warn?: boolean }) {
  const style: React.CSSProperties = right ? { textAlign: "right", fontFamily: "var(--font-geist-mono, monospace)" } : {};
  if (warn) style.color = "oklch(0.55 0.18 25)";
  if (dim) style.color = "oklch(var(--ink-3))";
  return <td style={style}>{children}</td>;
}

// ── Sales ─────────────────────────────────────────────────────────────────────

function SalesTable({ rows }: { rows: SalesRow[] }) {
  if (!rows.length) return <p className="empty-state" style={{ padding: "32px 0" }}>No orders in this period.</p>;
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr><Th>Month</Th><Th right>Orders</Th><Th right>Revenue</Th><Th right>VAT</Th><Th right>CWT</Th><Th right>Net</Th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.month}>
              <Td>{r.month}</Td>
              <Td right>{r.orders}</Td>
              <Td right>{peso(r.revenue)}</Td>
              <Td right dim>{peso(r.vat)}</Td>
              <Td right dim>{peso(r.cwt)}</Td>
              <Td right>{peso(r.net)}</Td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: 700, borderTop: "2px solid oklch(var(--line))" }}>
            <td>Total</td>
            <td style={{ textAlign: "right" }}>{rows.reduce((s, r) => s + r.orders, 0)}</td>
            <td style={{ textAlign: "right", fontFamily: "monospace" }}>{peso(rows.reduce((s, r) => s + r.revenue, 0))}</td>
            <td style={{ textAlign: "right", fontFamily: "monospace" }}>{peso(rows.reduce((s, r) => s + r.vat, 0))}</td>
            <td style={{ textAlign: "right", fontFamily: "monospace" }}>{peso(rows.reduce((s, r) => s + r.cwt, 0))}</td>
            <td style={{ textAlign: "right", fontFamily: "monospace" }}>{peso(rows.reduce((s, r) => s + r.net, 0))}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── AR Aging ──────────────────────────────────────────────────────────────────

const AGING_COLORS: Record<string, string> = {
  "Current": "oklch(0.75 0.15 145)",
  "1–30 d":  "oklch(0.78 0.17 85)",
  "31–60 d": "oklch(0.72 0.16 55)",
  "61–90 d": "oklch(0.62 0.18 40)",
  "90+ d":   "oklch(0.55 0.20 25)",
};

function AgingPill({ bucket }: { bucket: string }) {
  return (
    <span style={{ padding: "1px 8px", borderRadius: 3, fontSize: 11, fontWeight: 600, background: AGING_COLORS[bucket] + "22", color: AGING_COLORS[bucket] }}>
      {bucket}
    </span>
  );
}

function ArAgingTable({ rows, buckets }: { rows: ArAgingRow[]; buckets: Record<string, number> }) {
  if (!rows.length) return <p className="empty-state" style={{ padding: "32px 0" }}>No outstanding receivables.</p>;
  return (
    <>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {Object.entries(buckets).map(([bucket, amt]) => (
          <div key={bucket} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid oklch(var(--line))", background: "oklch(var(--bg-2))", minWidth: 120 }}>
            <div style={{ fontSize: 11, color: "oklch(var(--ink-3))", marginBottom: 4 }}>{bucket}</div>
            <div style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 14, color: AGING_COLORS[bucket] }}>{peso(amt)}</div>
          </div>
        ))}
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><Th>Invoice</Th><Th>Customer</Th><Th>Issued</Th><Th>Due</Th><Th right>Amount</Th><Th right>Paid</Th><Th right>Balance</Th><Th>Age</Th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="id">{r.id}</td>
                <Td>{r.customer}</Td>
                <Td dim>{r.issued}</Td>
                <Td dim>{r.due}</Td>
                <Td right>{peso(r.amount)}</Td>
                <Td right dim>{peso(r.paid)}</Td>
                <Td right warn={r.daysOverdue > 30}>{peso(r.balance)}</Td>
                <td><AgingPill bucket={r.bucket} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Inventory ─────────────────────────────────────────────────────────────────

function InventoryTable({ rows }: { rows: InventoryRow[] }) {
  if (!rows.length) return <p className="empty-state" style={{ padding: "32px 0" }}>No stock records found.</p>;
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr><Th>SKU</Th><Th>Product</Th><Th>Category</Th><Th>Warehouse</Th><Th right>On Hand</Th><Th right>Reserved</Th><Th right>Available</Th><Th right>Reorder At</Th><Th>Status</Th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ opacity: r.available === 0 && !r.belowReorder ? 0.6 : 1 }}>
              <td className="id">{r.sku}</td>
              <Td>{r.name}</Td>
              <Td dim>{r.category}</Td>
              <Td dim>{r.warehouse}</Td>
              <Td right>{r.onHand}</Td>
              <Td right dim>{r.reserved}</Td>
              <Td right warn={r.belowReorder}>{r.available}</Td>
              <Td right dim>{r.reorderAt ?? "—"}</Td>
              <td>
                {r.belowReorder && <span className="pill pill-CANCELLED" style={{ fontSize: 10 }}>Low Stock</span>}
                {!r.belowReorder && r.available > 0 && <span className="pill pill-DELIVERED" style={{ fontSize: 10 }}>OK</span>}
                {!r.belowReorder && r.available === 0 && <span className="pill pill-PREPARING" style={{ fontSize: 10 }}>Out</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── PO Summary ────────────────────────────────────────────────────────────────

const PO_STATUS_PILL: Record<string, string> = {
  EXPECTED: "pill-PREPARING", RECEIVING: "pill-PREPARING", RECEIVED: "pill-DELIVERED", DELAYED: "pill-CANCELLED",
};

function PoSummaryTable({ rows }: { rows: PoSummaryRow[] }) {
  if (!rows.length) return <p className="empty-state" style={{ padding: "32px 0" }}>No purchase orders in this period.</p>;
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr><Th>PO ID</Th><Th>Supplier</Th><Th>Warehouse</Th><Th>Expected</Th><Th right>Lines</Th><Th right>Total</Th><Th>Status</Th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="id">{r.id}</td>
              <Td>{r.supplier}</Td>
              <Td dim>{r.warehouse}</Td>
              <Td dim>{r.expectedAt}</Td>
              <Td right dim>{r.lines}</Td>
              <Td right>{peso(r.total)}</Td>
              <td><span className={`pill ${PO_STATUS_PILL[r.status] ?? "pill-PREPARING"}`} style={{ fontSize: 10 }}>{r.status}</span></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: 700, borderTop: "2px solid oklch(var(--line))" }}>
            <td colSpan={5}>Total</td>
            <td style={{ textAlign: "right", fontFamily: "monospace" }}>{peso(rows.reduce((s, r) => s + r.total, 0))}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── P&L ──────────────────────────────────────────────────────────────────────

function PlTable({ revenue, expenses, totalRevenue, totalExpenses, netIncome }: {
  revenue: PlRow[]; expenses: PlRow[]; totalRevenue: number; totalExpenses: number; netIncome: number;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase", color: "oklch(var(--ink-3))", marginBottom: 8 }}>Revenue</div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><Th>Code</Th><Th>Account</Th><Th right>Balance</Th></tr></thead>
            <tbody>
              {revenue.map((r) => (
                <tr key={r.code}>
                  <td className="id">{r.code}</td>
                  <Td>{r.name}</Td>
                  <Td right>{peso(Math.abs(r.balance))}</Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 700, borderTop: "2px solid oklch(var(--line))" }}>
                <td colSpan={2}>Total Revenue</td>
                <td style={{ textAlign: "right", fontFamily: "monospace" }}>{peso(Math.abs(totalRevenue))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase", color: "oklch(var(--ink-3))", marginBottom: 8 }}>Expenses</div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><Th>Code</Th><Th>Account</Th><Th right>Balance</Th></tr></thead>
            <tbody>
              {expenses.map((r) => (
                <tr key={r.code}>
                  <td className="id">{r.code}</td>
                  <Td>{r.name}</Td>
                  <Td right>{peso(r.balance)}</Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 700, borderTop: "2px solid oklch(var(--line))" }}>
                <td colSpan={2}>Total Expenses</td>
                <td style={{ textAlign: "right", fontFamily: "monospace" }}>{peso(totalExpenses)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      <div style={{ gridColumn: "1 / -1", padding: "16px 20px", borderRadius: 8, background: netIncome >= 0 ? "oklch(0.95 0.04 145)" : "oklch(0.95 0.05 25)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>Net Income</span>
        <span style={{ fontWeight: 800, fontSize: 18, fontFamily: "monospace", color: netIncome >= 0 ? "oklch(0.38 0.12 145)" : "oklch(0.45 0.18 25)" }}>
          {netIncome < 0 ? "(" : ""}{peso(Math.abs(netIncome))}{netIncome < 0 ? ")" : ""}
        </span>
      </div>
    </div>
  );
}

// ── Main client ───────────────────────────────────────────────────────────────

export function ReportsClient({ data }: { data: ReportData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [type, setType] = useState<ReportType>(data.type);
  const [from, setFrom] = useState(data.from);
  const [to, setTo] = useState(data.to);

  function apply(newType?: ReportType, newFrom?: string, newTo?: string) {
    const t = newType ?? type;
    const f = newFrom ?? from;
    const d = newTo ?? to;
    setType(t);
    startTransition(() => {
      router.push(`/reports?type=${t}&from=${f}&to=${d}`);
    });
  }

  const showDate = SHOW_DATE[type];
  const exportUrl = `/api/export/reports?type=${data.type}&from=${data.from}&to=${data.to}`;
  const printUrl = `/print/report?type=${data.type}&from=${data.from}&to=${data.to}`;

  const totalOrders = data.sales?.totalOrders ?? 0;
  const totalRevenue = data.sales?.totalRevenue ?? 0;
  const arTotal = data.arAging?.totalBalance ?? 0;
  const invSkus = data.inventory?.totalSkus ?? 0;
  const invLow = data.inventory?.belowReorderCount ?? 0;
  const poTotal = data.poSummary?.totalValue ?? 0;
  const netIncome = data.pl?.netIncome ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-2">
            <h1 style={{ fontSize: 17, fontWeight: 600 }}>Report Builder</h1>
            <HelpButton slug="reports" label="Help: Reports" />
          </div>
          <p style={{ fontSize: 12, color: "oklch(var(--ink-3))", marginTop: 2 }}>
            Generate, view, and export operational reports
          </p>
        </div>
        <a href={exportUrl} className="btn btn-sm">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export CSV
        </a>
        <a href={printUrl} target="_blank" className="btn btn-sm">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Print
        </a>
      </div>

      {/* Report type selector */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 18 }}>
        {REPORT_TYPES.map((rt) => (
          <button
            key={rt.value}
            onClick={() => apply(rt.value)}
            style={{
              padding: "10px 12px", borderRadius: 8, border: "1px solid",
              borderColor: type === rt.value ? "oklch(var(--accent))" : "oklch(var(--line))",
              background: type === rt.value ? "oklch(var(--accent) / 0.08)" : "oklch(var(--bg))",
              cursor: "pointer", textAlign: "left", transition: "all 0.15s",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 12.5, color: type === rt.value ? "oklch(var(--accent))" : "oklch(var(--ink))" }}>
              {rt.label}
            </div>
            <div style={{ fontSize: 11, color: "oklch(var(--ink-3))", marginTop: 2, lineHeight: 1.3 }}>{rt.desc}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      {showDate && (
        <div className="filters" style={{ marginBottom: 20 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ color: "oklch(var(--ink-3))" }}>From</span>
            <input
              type="date" className="field-input" style={{ height: 32, width: 150 }}
              value={from} onChange={(e) => setFrom(e.target.value)}
              onBlur={() => apply(undefined, from, to)}
            />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ color: "oklch(var(--ink-3))" }}>To</span>
            <input
              type="date" className="field-input" style={{ height: 32, width: 150 }}
              value={to} onChange={(e) => setTo(e.target.value)}
              onBlur={() => apply(undefined, from, to)}
            />
          </label>
          <button className="btn btn-primary btn-sm" onClick={() => apply()} disabled={isPending}>
            {isPending ? "Loading…" : "Run Report"}
          </button>
        </div>
      )}

      {/* Summary KPIs */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        {data.type === "SALES" && (
          <>
            <div className="stat-card"><div className="stat-label">Total Orders</div><div className="stat-value">{totalOrders}</div></div>
            <div className="stat-card"><div className="stat-label">Total Revenue</div><div className="stat-value" style={{ fontFamily: "monospace" }}>₱{(totalRevenue / 1_000_000).toFixed(2)}M</div></div>
            <div className="stat-card"><div className="stat-label">Avg Order Value</div><div className="stat-value" style={{ fontFamily: "monospace" }}>{totalOrders > 0 ? `₱${(totalRevenue / totalOrders / 1000).toFixed(1)}K` : "—"}</div></div>
            <div className="stat-card"><div className="stat-label">Top Customer</div><div className="stat-value" style={{ fontSize: 13 }}>{data.sales?.byCustomer[0]?.name ?? "—"}</div></div>
          </>
        )}
        {data.type === "AR_AGING" && (
          <>
            <div className="stat-card"><div className="stat-label">Outstanding Invoices</div><div className="stat-value">{data.arAging?.rows.length ?? 0}</div></div>
            <div className="stat-card"><div className="stat-label">Total AR Balance</div><div className="stat-value" style={{ fontFamily: "monospace", color: arTotal > 0 ? "oklch(0.55 0.18 25)" : undefined }}>₱{(arTotal / 1_000_000).toFixed(2)}M</div></div>
            <div className="stat-card"><div className="stat-label">90+ Days Overdue</div><div className="stat-value" style={{ color: (data.arAging?.buckets["90+ d"] ?? 0) > 0 ? "oklch(0.55 0.18 25)" : undefined }}>₱{((data.arAging?.buckets["90+ d"] ?? 0) / 1000).toFixed(0)}K</div></div>
            <div className="stat-card"><div className="stat-label">Current (not overdue)</div><div className="stat-value">₱{((data.arAging?.buckets["Current"] ?? 0) / 1000).toFixed(0)}K</div></div>
          </>
        )}
        {data.type === "INVENTORY" && (
          <>
            <div className="stat-card"><div className="stat-label">Total SKUs</div><div className="stat-value">{invSkus}</div></div>
            <div className="stat-card"><div className="stat-label">Stock Records</div><div className="stat-value">{data.inventory?.rows.length ?? 0}</div></div>
            <div className="stat-card"><div className="stat-label">Below Reorder</div><div className="stat-value" style={{ color: invLow > 0 ? "oklch(0.55 0.18 25)" : undefined }}>{invLow}</div></div>
            <div className="stat-card"><div className="stat-label">Out of Stock</div><div className="stat-value">{data.inventory?.rows.filter(r => r.available === 0).length ?? 0}</div></div>
          </>
        )}
        {data.type === "PO_SUMMARY" && (
          <>
            <div className="stat-card"><div className="stat-label">Total POs</div><div className="stat-value">{data.poSummary?.rows.length ?? 0}</div></div>
            <div className="stat-card"><div className="stat-label">Total Value</div><div className="stat-value" style={{ fontFamily: "monospace" }}>₱{(poTotal / 1_000).toFixed(0)}K</div></div>
            <div className="stat-card"><div className="stat-label">Received</div><div className="stat-value">{data.poSummary?.byStatus["RECEIVED"] ?? 0}</div></div>
            <div className="stat-card"><div className="stat-label">Delayed</div><div className="stat-value" style={{ color: (data.poSummary?.byStatus["DELAYED"] ?? 0) > 0 ? "oklch(0.55 0.18 25)" : undefined }}>{data.poSummary?.byStatus["DELAYED"] ?? 0}</div></div>
          </>
        )}
        {data.type === "PL" && (
          <>
            <div className="stat-card"><div className="stat-label">Total Revenue</div><div className="stat-value" style={{ fontFamily: "monospace" }}>₱{(Math.abs(data.pl?.totalRevenue ?? 0) / 1_000_000).toFixed(2)}M</div></div>
            <div className="stat-card"><div className="stat-label">Total Expenses</div><div className="stat-value" style={{ fontFamily: "monospace" }}>₱{((data.pl?.totalExpenses ?? 0) / 1_000_000).toFixed(2)}M</div></div>
            <div className="stat-card"><div className="stat-label">Net Income</div><div className="stat-value" style={{ fontFamily: "monospace", color: netIncome < 0 ? "oklch(0.55 0.18 25)" : "oklch(0.40 0.14 145)" }}>₱{(Math.abs(netIncome) / 1_000_000).toFixed(2)}M</div></div>
            <div className="stat-card"><div className="stat-label">Margin</div><div className="stat-value">{data.pl?.totalRevenue ? ((netIncome / Math.abs(data.pl.totalRevenue)) * 100).toFixed(1) + "%" : "—"}</div></div>
          </>
        )}
      </div>

      {/* Top customers for sales */}
      {data.type === "SALES" && (data.sales?.byCustomer.length ?? 0) > 0 && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-head"><span className="card-h">Top Customers by Revenue</span></div>
          <div className="card-body" style={{ padding: "0 0 8px" }}>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><Th>Customer</Th><Th right>Orders</Th><Th right>Revenue</Th></tr></thead>
                <tbody>
                  {data.sales!.byCustomer.map((c, i) => (
                    <tr key={i}>
                      <Td>{c.name}</Td>
                      <Td right dim>{c.orders}</Td>
                      <Td right>{peso(c.revenue)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Main table */}
      <div className="card">
        <div className="card-head">
          <span className="card-h">
            {REPORT_TYPES.find((r) => r.value === data.type)?.label}
            {showDate && <span style={{ fontWeight: 400, color: "oklch(var(--ink-3))", fontSize: 12, marginLeft: 8 }}>{data.from} → {data.to}</span>}
          </span>
        </div>
        <div className="card-body" style={{ padding: "0 0 8px" }}>
          {data.type === "SALES"     && <SalesTable rows={data.sales?.monthly ?? []} />}
          {data.type === "AR_AGING"  && <ArAgingTable rows={data.arAging?.rows ?? []} buckets={data.arAging?.buckets ?? {}} />}
          {data.type === "INVENTORY" && <InventoryTable rows={data.inventory?.rows ?? []} />}
          {data.type === "PO_SUMMARY"&& <PoSummaryTable rows={data.poSummary?.rows ?? []} />}
          {data.type === "PL"        && data.pl && <PlTable {...data.pl} />}
        </div>
      </div>
    </div>
  );
}
