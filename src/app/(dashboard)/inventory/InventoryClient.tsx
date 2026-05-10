"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { HelpButton } from "@/components/HelpButton";
import { receiveStock, adjustStock, updateStockSettings, initStockRow } from "./actions";
import { generateReorderPOs } from "@/app/(dashboard)/inbound/actions";

export interface StockRow {
  id: string;
  skuId: string;
  skuName: string;
  skuSku: string;
  warehouseId: string;
  warehouseName: string;
  onHand: number;
  reserved: number;
  reorderAt: number | null;
  maxLevel: number | null;
}

export interface MoveRow {
  id: string;
  skuId: string;
  skuName: string;
  warehouseName: string;
  type: string;
  qty: number;
  costPerUnit: string;
  ref: string | null;
  note: string | null;
  by: string | null;
  at: string;
}

interface CatalogItem { id: string; sku: string; name: string }
interface Warehouse { id: string; name: string }

export interface LotRow {
  id: string;
  lotNumber: string;
  skuName: string;
  skuSku: string;
  warehouseName: string;
  warehouseId: string;
  receivedQty: number;
  remainingQty: number;
  expiryDate: string | null;
  poId: string | null;
  createdAt: string;
}

interface Props {
  stocks: StockRow[];
  moves: MoveRow[];
  catalogItems: CatalogItem[];
  warehouses: Warehouse[];
  lots: LotRow[];
}

// ── Shared field wrapper ──────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="field-label">{label}</label>{children}</div>;
}

// ── Receive modal ─────────────────────────────────────────────────────────────
function ReceiveModal({ stock, onClose }: { stock: StockRow; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [qty, setQty] = useState("1");
  const [cost, setCost] = useState("");
  const [ref, setRef] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    start(async () => {
      try {
        await receiveStock({
          stockId: stock.id,
          qty: parseInt(qty),
          costPerUnit: cost ? parseFloat(cost) : undefined,
          ref: ref || undefined,
          note: note || undefined,
        });
        router.refresh(); onClose();
      } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
    });
  }

  return (
    <Modal open onClose={onClose} title={`Receive Stock — ${stock.skuName}`}>
      <div className="card-body">
        <p style={{ fontSize: 12.5, color: "oklch(var(--ink-3))", marginBottom: 4 }}>
          {stock.warehouseName} · Current on hand: <strong>{stock.onHand.toLocaleString()}</strong>
        </p>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Quantity Received *">
              <input className="field-input" type="number" min="1" step="1" value={qty} onChange={e => setQty(e.target.value)} required />
            </Field>
            <Field label="Cost / Unit (₱)">
              <input className="field-input" type="number" min="0" step="0.01" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" />
            </Field>
          </div>
          <Field label="PO / Reference">
            <input className="field-input" value={ref} onChange={e => setRef(e.target.value)} placeholder="PO-2025-001" />
          </Field>
          <Field label="Note">
            <input className="field-input" value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note" />
          </Field>
          {err && <p style={{ fontSize: 12.5, color: "oklch(var(--err))" }}>{err}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Saving…" : `Receive +${parseInt(qty) || 0}`}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

// ── Adjust modal ──────────────────────────────────────────────────────────────
function AdjustModal({ stock, onClose }: { stock: StockRow; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  const parsed = parseInt(delta) || 0;
  const preview = stock.onHand + parsed;

  function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    start(async () => {
      try {
        await adjustStock({ stockId: stock.id, delta: parsed, note });
        router.refresh(); onClose();
      } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
    });
  }

  return (
    <Modal open onClose={onClose} title={`Adjust Stock — ${stock.skuName}`}>
      <div className="card-body">
        <p style={{ fontSize: 12.5, color: "oklch(var(--ink-3))", marginBottom: 4 }}>
          {stock.warehouseName} · Current on hand: <strong>{stock.onHand.toLocaleString()}</strong>
        </p>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Adjustment (e.g. +10 or -5) *">
            <input
              className="field-input"
              type="number"
              step="1"
              value={delta}
              onChange={e => setDelta(e.target.value)}
              placeholder="+10 to add, -5 to reduce"
              required
            />
          </Field>
          {delta && (
            <div style={{
              padding: "8px 12px",
              borderRadius: 7,
              fontSize: 12.5,
              background: preview < 0 ? "oklch(0.96 0.02 25)" : "oklch(var(--accent-soft))",
              color: preview < 0 ? "oklch(0.45 0.12 25)" : "oklch(var(--accent-ink))",
            }}>
              Result: {stock.onHand} → <strong>{preview}</strong>
              {preview < 0 && " ⚠ Cannot go below zero"}
            </div>
          )}
          <Field label="Reason / Note *">
            <input className="field-input" value={note} onChange={e => setNote(e.target.value)} placeholder="Stocktake correction, damaged goods…" required />
          </Field>
          {err && <p style={{ fontSize: 12.5, color: "oklch(var(--err))" }}>{err}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={pending || preview < 0 || !parsed}>
              {pending ? "Saving…" : "Apply Adjustment"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

// ── Stock settings modal ──────────────────────────────────────────────────────
function SettingsModal({ stock, onClose }: { stock: StockRow; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [reorderAt, setReorderAt] = useState(stock.reorderAt != null ? String(stock.reorderAt) : "");
  const [maxLevel, setMaxLevel] = useState(stock.maxLevel != null ? String(stock.maxLevel) : "");
  const [err, setErr] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    start(async () => {
      try {
        await updateStockSettings({
          stockId: stock.id,
          reorderAt: reorderAt !== "" ? parseInt(reorderAt) : null,
          maxLevel: maxLevel !== "" ? parseInt(maxLevel) : null,
        });
        router.refresh(); onClose();
      } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
    });
  }

  return (
    <Modal open onClose={onClose} title={`Stock Settings — ${stock.skuName}`}>
      <div className="card-body">
        <p style={{ fontSize: 12.5, color: "oklch(var(--ink-3))", marginBottom: 4 }}>
          {stock.warehouseName}
        </p>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Reorder At (units)">
              <input className="field-input" type="number" min="0" step="1" value={reorderAt} onChange={e => setReorderAt(e.target.value)} placeholder="e.g. 50" />
            </Field>
            <Field label="Max Level (units)">
              <input className="field-input" type="number" min="0" step="1" value={maxLevel} onChange={e => setMaxLevel(e.target.value)} placeholder="e.g. 500" />
            </Field>
          </div>
          <p style={{ fontSize: 12, color: "oklch(var(--ink-3))" }}>
            Leave blank to disable the threshold. Reorder At triggers a low-stock alert on the dashboard.
          </p>
          {err && <p style={{ fontSize: 12.5, color: "oklch(var(--err))" }}>{err}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Saving…" : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

// ── Init stock row modal ──────────────────────────────────────────────────────
function InitModal({ catalogItems, warehouses, onClose }: {
  catalogItems: CatalogItem[];
  warehouses: Warehouse[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [skuId, setSkuId] = useState("");
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [err, setErr] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    start(async () => {
      try {
        await initStockRow(skuId, warehouseId);
        router.refresh(); onClose();
      } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
    });
  }

  return (
    <Modal open onClose={onClose} title="Track New SKU">
      <div className="card-body">
        <p style={{ fontSize: 12.5, color: "oklch(var(--ink-3))", marginBottom: 4 }}>
          Initializes a stock record at zero for a SKU that isn&apos;t tracked yet.
        </p>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Product *">
            <select className="field-input" value={skuId} onChange={e => setSkuId(e.target.value)} required>
              <option value="">— Select a product —</option>
              {catalogItems.map(i => (
                <option key={i.id} value={i.id}>{i.sku} — {i.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Warehouse *">
            <select className="field-input" value={warehouseId} onChange={e => setWarehouseId(e.target.value)} required>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </Field>
          {err && <p style={{ fontSize: 12.5, color: "oklch(var(--err))" }}>{err}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={pending || !skuId}>
              {pending ? "Adding…" : "Track SKU"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

// ── Move type pill ────────────────────────────────────────────────────────────
const MOVE_PILL: Record<string, string> = {
  RECEIPT:    "pill-DELIVERED",
  PICK:       "pill-SHIPPED",
  TRANSFER:   "pill-APPROVED",
  ADJUSTMENT: "pill-PREPARING",
  RETURN:     "pill-PENDING",
};

// ── Main component ────────────────────────────────────────────────────────────
export function InventoryClient({ stocks, moves, catalogItems, warehouses, lots }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"levels" | "lots" | "history">("levels");
  const [receiveStock_, setReceive] = useState<StockRow | null>(null);
  const [adjustStock_, setAdjust] = useState<StockRow | null>(null);
  const [settingsStock, setSettings] = useState<StockRow | null>(null);
  const [initOpen, setInitOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterWh, setFilterWh] = useState("ALL");
  const [filterAlert, setFilterAlert] = useState(false);
  const [moveSearch, setMoveSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [reorderPending, startReorder] = useTransition();
  const [reorderMsg, setReorderMsg] = useState("");

  const filteredStocks = stocks.filter(s => {
    if (filterWh !== "ALL" && s.warehouseId !== filterWh) return false;
    if (filterAlert && !(s.reorderAt != null && s.onHand <= s.reorderAt)) return false;
    const q = search.toLowerCase();
    return !q || s.skuName.toLowerCase().includes(q) || s.skuSku.toLowerCase().includes(q) || s.warehouseName.toLowerCase().includes(q);
  });

  const lowCount = stocks.filter(s => s.reorderAt != null && s.onHand <= s.reorderAt).length;

  const filteredMoves = moves.filter(m => {
    if (filterType !== "ALL" && m.type !== filterType) return false;
    const q = moveSearch.toLowerCase();
    return !q || m.skuName.toLowerCase().includes(q) || m.warehouseName.toLowerCase().includes(q) || (m.ref ?? "").toLowerCase().includes(q) || (m.by ?? "").toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2" style={{ flex: 1 }}>
          <h1 style={{ fontSize: 17, fontWeight: 600 }}>Inventory</h1>
          <HelpButton slug="inventory" label="Help: Inventory" />
        </div>
        {lowCount > 0 && (
          <>
            <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 99, background: "oklch(0.94 0.05 25)", color: "oklch(0.40 0.12 25)", fontWeight: 600 }}>
              {lowCount} low stock
            </span>
            <button
              className="btn btn-sm"
              style={{ borderColor: "oklch(0.75 0.10 25)", color: "oklch(0.40 0.12 25)" }}
              disabled={reorderPending}
              title="Create draft Purchase Orders for all items below reorder point"
              onClick={() => {
                setReorderMsg("");
                startReorder(async () => {
                  const { created } = await generateReorderPOs(filterWh);
                  setReorderMsg(created > 0 ? `${created} draft PO${created > 1 ? "s" : ""} created → check Inbound` : "No items with a supplier to reorder");
                  if (created > 0) router.refresh();
                });
              }}
            >
              {reorderPending ? "Generating…" : "Generate Reorder POs"}
            </button>
          </>
        )}
        <a href={tab === "history" ? "/api/export/stock-moves" : "/api/export/inventory"} className="btn btn-sm">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export CSV
        </a>
        <button className="btn" onClick={() => setInitOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Track SKU
        </button>
      </div>

      {reorderMsg && (
        <div style={{ padding: "8px 14px", borderRadius: 8, marginBottom: 12, fontSize: 13,
          background: reorderMsg.includes("created") ? "oklch(0.96 0.04 155)" : "oklch(0.96 0.02 60)",
          color: reorderMsg.includes("created") ? "oklch(0.35 0.12 155)" : "oklch(0.45 0.10 60)",
          border: `1px solid ${reorderMsg.includes("created") ? "oklch(0.80 0.08 155)" : "oklch(0.80 0.06 60)"}`,
        }}>
          {reorderMsg}
        </div>
      )}

      <div className="tabs">
        <button className="tab" aria-selected={tab === "levels"} onClick={() => setTab("levels")}>
          Stock Levels
          <span className="tab-count">{stocks.length}</span>
        </button>
        <button className="tab" aria-selected={tab === "lots"} onClick={() => setTab("lots")}>
          Lots / Batches
          <span className="tab-count">{lots.length}</span>
        </button>
        <button className="tab" aria-selected={tab === "history"} onClick={() => setTab("history")}>
          Move History
          <span className="tab-count">{moves.length}</span>
        </button>
      </div>

      {/* ── Stock Levels tab ── */}
      {tab === "levels" && (
        <>
          <div className="filters">
            <div className="search-box" style={{ width: 240 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input placeholder="Search SKU, name…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="field-input" style={{ width: 160, height: 32 }} value={filterWh} onChange={e => setFilterWh(e.target.value)}>
              <option value="ALL">All warehouses</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <button
              className="btn btn-sm"
              style={filterAlert ? { background: "oklch(0.94 0.05 25)", borderColor: "oklch(0.88 0.07 25)", color: "oklch(0.40 0.12 25)" } : {}}
              onClick={() => setFilterAlert(v => !v)}
            >
              {filterAlert ? "⚠ Low stock only" : "Show all"}
            </button>
          </div>

          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="id">SKU</th>
                  <th>Product</th>
                  <th>Warehouse</th>
                  <th className="num">On Hand</th>
                  <th className="num">Reserved</th>
                  <th className="num">Available</th>
                  <th className="num">Reorder At</th>
                  <th className="num">Max</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.length === 0 && (
                  <tr><td colSpan={9} className="empty-state" style={{ padding: "32px 0" }}>No stock records found</td></tr>
                )}
                {filteredStocks.map(s => {
                  const available = s.onHand - s.reserved;
                  const low = s.reorderAt != null && s.onHand <= s.reorderAt;
                  return (
                    <tr key={s.id} style={{ cursor: "default" }}>
                      <td className="id">{s.skuSku}</td>
                      <td style={{ fontWeight: 500 }}>{s.skuName}</td>
                      <td className="dim">{s.warehouseName}</td>
                      <td className="num" style={low ? { color: "oklch(0.50 0.14 25)", fontWeight: 600 } : {}}>
                        {s.onHand.toLocaleString()}
                        {low && " ⚠"}
                      </td>
                      <td className="num dim">{s.reserved.toLocaleString()}</td>
                      <td className="num">{available.toLocaleString()}</td>
                      <td className="num dim">{s.reorderAt?.toLocaleString() ?? "—"}</td>
                      <td className="num dim">{s.maxLevel?.toLocaleString() ?? "—"}</td>
                      <td>
                        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                          <button className="btn btn-sm btn-accent" onClick={() => setReceive(s)} title="Receive stock">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                            Receive
                          </button>
                          <button className="btn btn-sm" onClick={() => setAdjust(s)} title="Adjust stock">
                            Adjust
                          </button>
                          <button className="btn btn-sm btn-ghost" onClick={() => setSettings(s)} title="Reorder settings">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="3"/>
                              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Lots / Batches tab ── */}
      {tab === "lots" && (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Lot / Batch No.</th>
                <th>Product</th>
                <th>Warehouse</th>
                <th className="num">Received</th>
                <th className="num">Remaining</th>
                <th>Expiry Date</th>
                <th>PO Ref</th>
                <th>Received On</th>
              </tr>
            </thead>
            <tbody>
              {lots.length === 0 && (
                <tr><td colSpan={8} className="empty-state" style={{ padding: "32px 0" }}>No lots recorded yet. Lot numbers are captured when receiving purchase orders.</td></tr>
              )}
              {lots.map(l => {
                const expiry = l.expiryDate ? new Date(l.expiryDate) : null;
                const today = new Date();
                const daysToExpiry = expiry ? Math.ceil((expiry.getTime() - today.getTime()) / 86400000) : null;
                const expired = daysToExpiry !== null && daysToExpiry < 0;
                const expiring = daysToExpiry !== null && daysToExpiry >= 0 && daysToExpiry <= 90;
                return (
                  <tr key={l.id} style={{ cursor: "default" }}>
                    <td className="id" style={{ fontWeight: 600 }}>{l.lotNumber}</td>
                    <td style={{ fontWeight: 500 }}>{l.skuName}</td>
                    <td className="dim">{l.warehouseName}</td>
                    <td className="num">{l.receivedQty.toLocaleString()}</td>
                    <td className="num" style={{ fontWeight: 600, color: l.remainingQty === 0 ? "oklch(var(--ink-3))" : undefined }}>
                      {l.remainingQty.toLocaleString()}
                    </td>
                    <td>
                      {expiry ? (
                        <span style={{
                          fontSize: 12.5,
                          color: expired ? "oklch(0.45 0.14 25)" : expiring ? "oklch(0.50 0.14 60)" : "oklch(var(--ink-2))",
                          fontWeight: expired || expiring ? 600 : undefined,
                        }}>
                          {expiry.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                          {expired && " — EXPIRED"}
                          {!expired && expiring && ` — ${daysToExpiry}d left`}
                        </span>
                      ) : <span className="dim">—</span>}
                    </td>
                    <td className="id dim">{l.poId ?? "—"}</td>
                    <td className="dim" style={{ fontSize: 12 }}>
                      {new Date(l.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Move History tab ── */}
      {tab === "history" && (
        <>
          <div className="filters">
            <div className="search-box" style={{ width: 240 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input placeholder="Search SKU, ref, by…" value={moveSearch} onChange={e => setMoveSearch(e.target.value)} />
            </div>
            <select className="field-input" style={{ width: 150, height: 32 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="ALL">All types</option>
              {["RECEIPT", "PICK", "TRANSFER", "ADJUSTMENT", "RETURN"].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Warehouse</th>
                  <th>Type</th>
                  <th className="num">Qty</th>
                  <th>Reference</th>
                  <th>Note</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {filteredMoves.length === 0 && (
                  <tr><td colSpan={8} className="empty-state" style={{ padding: "32px 0" }}>No moves found</td></tr>
                )}
                {filteredMoves.map(m => (
                  <tr key={m.id} style={{ cursor: "default" }}>
                    <td className="dim" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                      {new Date(m.at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td style={{ fontWeight: 500 }}>{m.skuName}</td>
                    <td className="dim">{m.warehouseName}</td>
                    <td><span className={`pill ${MOVE_PILL[m.type] ?? "pill-PENDING"}`}>{m.type}</span></td>
                    <td className="num" style={{ fontWeight: 600, color: m.qty >= 0 ? "oklch(0.40 0.09 155)" : "oklch(0.45 0.12 25)" }}>
                      {m.qty >= 0 ? "+" : ""}{m.qty.toLocaleString()}
                    </td>
                    <td className="id">{m.ref ?? "—"}</td>
                    <td className="dim" style={{ fontSize: 12, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{m.note ?? "—"}</td>
                    <td className="dim" style={{ fontSize: 12 }}>{m.by ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Modals ── */}
      {receiveStock_ && <ReceiveModal stock={receiveStock_} onClose={() => setReceive(null)} />}
      {adjustStock_ && <AdjustModal stock={adjustStock_} onClose={() => setAdjust(null)} />}
      {settingsStock && <SettingsModal stock={settingsStock} onClose={() => setSettings(null)} />}
      {initOpen && <InitModal catalogItems={catalogItems} warehouses={warehouses} onClose={() => setInitOpen(false)} />}
    </div>
  );
}
