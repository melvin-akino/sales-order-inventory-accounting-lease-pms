// shipments-inventory.jsx — Shipments tracking + Inventory workflow

// ─── Couriers (PH) ──────────────────────────────────────────────────────────
const COURIERS = [
  { id: "JRS", name: "JRS Express",   color: "oklch(0.62 0.16 32)" },
  { id: "LBC", name: "LBC Express",   color: "oklch(0.55 0.16 27)" },
  { id: "JNT", name: "J&T Express",   color: "oklch(0.55 0.10 240)" },
  { id: "2GO", name: "2GO Logistics", color: "oklch(0.50 0.14 260)" },
  { id: "OWN", name: "Own fleet",     color: "oklch(0.40 0.04 250)" },
];
const courierByWaybill = (wb) => {
  if (!wb) return COURIERS[4];
  if (wb.startsWith("JRS")) return COURIERS[0];
  if (wb.startsWith("LBC")) return COURIERS[1];
  if (wb.startsWith("JNT")) return COURIERS[2];
  if (wb.startsWith("2GO")) return COURIERS[3];
  return COURIERS[4];
};

// Synthetic per-shipment metadata
function shipmentMeta(o) {
  if (!o.waybill && o.state !== "SHIPPED") return null;
  const courier = courierByWaybill(o.waybill);
  // Deterministic ETA from id hash
  const seed = [...o.id].reduce((s, ch) => s + ch.charCodeAt(0), 0);
  const dest = customerById(o.customerId);
  const km = 30 + (seed % 800);
  const etaHours = Math.max(4, Math.round(km / 50));
  const shippedEvent = o.timeline.find((e) => e.state === "SHIPPED");
  const shippedAt = shippedEvent ? shippedEvent.at : hoursAgo(8);
  const deliveredEvent = o.timeline.find((e) => e.state === "DELIVERED");
  const eta = deliveredEvent ? deliveredEvent.at : new Date(new Date(shippedAt).getTime() + etaHours * 3600 * 1000).toISOString();
  // progress: 0..1
  const total = etaHours * 3600 * 1000;
  const elapsed = Date.now() - new Date(shippedAt).getTime();
  const progress = Math.max(0, Math.min(1, elapsed / total));
  return { courier, km, etaHours, shippedAt, eta, progress, dest, waybill: o.waybill || `${courier.id}-PENDING` };
}

// ─── ShipmentsView ──────────────────────────────────────────────────────────
function ShipmentsView({ orders, role, onOpen, onTransition }) {
  const [tab, setTab] = React.useState("INTRANSIT");
  const [search, setSearch] = React.useState("");
  const [courierFilter, setCourierFilter] = React.useState("ALL");
  const [whFilter, setWhFilter] = React.useState("");
  const [sel, setSel] = React.useState(null);

  const shipments = orders.filter((o) => ["SHIPPED", "DELIVERED"].includes(o.state) || o.waybill);

  const counts = {
    INTRANSIT: shipments.filter((o) => o.state === "SHIPPED").length,
    DELIVERED: shipments.filter((o) => o.state === "DELIVERED").length,
    ALL: shipments.length,
  };
  // Compute risk: shipped > etaHours ago and not delivered = late
  const late = shipments.filter((o) => {
    if (o.state !== "SHIPPED") return false;
    const m = shipmentMeta(o);
    return m && m.progress >= 1;
  });

  const tabFilter = (o) => tab === "ALL" ? true
    : tab === "INTRANSIT" ? o.state === "SHIPPED"
    : tab === "LATE" ? late.includes(o)
    : o.state === "DELIVERED";

  const filtered = shipments.filter(tabFilter).filter((o) => {
    if (whFilter && o.warehouseId !== whFilter) return false;
    if (courierFilter !== "ALL" && courierByWaybill(o.waybill).id !== courierFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    const c = customerById(o.customerId).name.toLowerCase();
    return o.id.toLowerCase().includes(s) || c.includes(s) || (o.waybill || "").toLowerCase().includes(s);
  });

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-h1">Shipments</h1>
          <div className="page-sub">Live tracking · waybills · proof of delivery</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-sm"><Icon.Print /> Print manifest</button>
          <button className="btn btn-sm"><Icon.Down /> Export tracking CSV</button>
          <button className="btn btn-primary btn-sm"><Icon.Tag /> Generate waybill batch</button>
        </div>
      </div>

      <div className="stat-grid">
        <Stat label="In transit" value={counts.INTRANSIT.toString()} trend={`${shipments.filter((o)=>{const m=shipmentMeta(o);return o.state==="SHIPPED"&&m&&m.progress<0.5;}).length} just dispatched`} />
        <Stat label="Out for delivery" value={shipments.filter((o)=>{const m=shipmentMeta(o);return o.state==="SHIPPED"&&m&&m.progress>=0.5;}).length.toString()} trend="Final-mile in progress" />
        <Stat label="Past ETA" value={late.length.toString()} trend={late.length > 0 ? "Action required" : "All on time"} dn={late.length > 0} />
        <Stat label="Delivered (window)" value={counts.DELIVERED.toString()} trend="Last 7 days" up />
      </div>

      <div className="tabs">
        {[
          ["INTRANSIT", "In transit", counts.INTRANSIT],
          ["LATE", "Past ETA", late.length],
          ["DELIVERED", "Delivered", counts.DELIVERED],
          ["ALL", "All", counts.ALL],
        ].map(([k, l, n]) => (
          <button key={k} className="tab" data-active={tab === k ? "1" : "0"} onClick={() => setTab(k)}>
            {l} <span className="tab-count">{n}</span>
          </button>
        ))}
      </div>

      <div className="filters">
        <div className="search" style={{ width: 320 }}>
          <Icon.Search />
          <input placeholder="SO, customer, or waybill…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="chip" data-on={whFilter ? "0" : "1"} onClick={() => setWhFilter("")}>All origins</button>
        {WAREHOUSES.map((w) => (
          <button key={w.id} className="chip" data-on={whFilter === w.id ? "1" : "0"}
                  onClick={() => setWhFilter(whFilter === w.id ? "" : w.id)}>
            {w.code}
          </button>
        ))}
        <span style={{ width: 1, height: 18, background: "var(--line-2)", margin: "0 4px" }} />
        <button className="chip" data-on={courierFilter === "ALL" ? "1" : "0"} onClick={() => setCourierFilter("ALL")}>All couriers</button>
        {COURIERS.map((c) => (
          <button key={c.id} className="chip" data-on={courierFilter === c.id ? "1" : "0"}
                  onClick={() => setCourierFilter(c.id)}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: c.color, marginRight: 6 }} />
            {c.name}
          </button>
        ))}
        <span className="dim" style={{ marginLeft: "auto", fontSize: 12 }}>{filtered.length} shipments</span>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><div className="empty"><div className="empty-ic"><Icon.Truck /></div>No shipments match.</div></div>
      ) : (
        <div className="stack gap-2">
          {filtered.map((o) => <ShipmentRow key={o.id} order={o} onOpen={() => setSel(o.id)} />)}
        </div>
      )}

      {sel && (() => {
        const o = orders.find((x) => x.id === sel);
        return o ? <ShipmentDrawer order={o} onClose={() => setSel(null)} role={role}
                                   onMarkDelivered={() => { onTransition(o.id, "DELIVERED", "Marked delivered with POD"); setSel(null); }} /> : null;
      })()}
    </div>
  );
}

function ShipmentRow({ order, onOpen }) {
  const c = customerById(order.customerId);
  const w = warehouseById(order.warehouseId);
  const m = shipmentMeta(order);
  if (!m) return null;
  const isDelivered = order.state === "DELIVERED";
  const isLate = !isDelivered && m.progress >= 1;

  return (
    <button className="ship-row" onClick={onOpen}>
      <div className="ship-row-head">
        <div className="row gap-3" style={{ alignItems: "center" }}>
          <div className="ship-status-dot" data-state={isDelivered ? "ok" : isLate ? "late" : "transit"} />
          <span className="mono" style={{ fontWeight: 500, fontSize: 13 }}>{order.id}</span>
          <StatePill state={order.state} />
          <span className="dim" style={{ fontSize: 12 }}>· {order.lines.length} lines · {PESO(order.total)}</span>
        </div>
        <div className="row gap-2" style={{ alignItems: "center" }}>
          <span className="badge mono" style={{ fontSize: 11 }}>{m.waybill}</span>
          <span className="ship-courier-pill" style={{ "--cc": m.courier.color }}>
            <span className="cdot" /> {m.courier.name}
          </span>
        </div>
      </div>

      <div className="ship-route">
        <div className="ship-stop">
          <div className="ship-stop-label">Origin</div>
          <div className="ship-stop-value">{w.code} · {w.name.replace(/^.*— /, "")}</div>
        </div>

        <div className="ship-track">
          <div className="ship-track-bar">
            <div className="ship-track-fill" style={{ width: `${m.progress * 100}%`, background: isLate ? "oklch(0.55 0.14 25)" : "var(--ink)" }} />
            <div className="ship-track-truck" style={{ left: `calc(${m.progress * 100}% - 10px)` }}>
              <Icon.Truck />
            </div>
          </div>
          <div className="ship-track-meta">
            <span>Shipped {fmtRel(m.shippedAt)}</span>
            <span style={{ marginLeft: "auto" }}>{m.km} km · {m.etaHours}h transit</span>
          </div>
        </div>

        <div className="ship-stop right">
          <div className="ship-stop-label">{isDelivered ? "Delivered" : isLate ? "Past ETA" : "ETA"}</div>
          <div className="ship-stop-value">{fmtDate(m.eta)} · {c.city}</div>
        </div>
      </div>

      <div className="ship-row-foot">
        <div className="dim" style={{ fontSize: 12 }}>{c.name}</div>
        <div className="dim" style={{ fontSize: 12, marginLeft: "auto" }}>
          PO {order.poRef} · Need by {fmtDate(order.needBy)}
        </div>
      </div>
    </button>
  );
}

function ShipmentDrawer({ order, onClose, onMarkDelivered, role }) {
  const c = customerById(order.customerId);
  const w = warehouseById(order.warehouseId);
  const m = shipmentMeta(order);
  if (!m) return null;
  const isDelivered = order.state === "DELIVERED";
  const isLate = !isDelivered && m.progress >= 1;

  // Synthetic tracking pings for visual interest
  const pings = [
    { time: m.shippedAt, label: "Picked up by " + m.courier.name, where: w.name },
    { time: new Date(new Date(m.shippedAt).getTime() + m.etaHours * 0.25 * 3600 * 1000).toISOString(), label: "Departed sort hub", where: w.code + " Hub" },
    { time: new Date(new Date(m.shippedAt).getTime() + m.etaHours * 0.6 * 3600 * 1000).toISOString(), label: "Arrived at delivery hub", where: c.region + " Hub" },
    !isDelivered && m.progress >= 0.85 ? { time: new Date(new Date(m.shippedAt).getTime() + m.etaHours * 0.85 * 3600 * 1000).toISOString(), label: "Out for final-mile delivery", where: c.city } : null,
    isDelivered ? order.timeline.find((e) => e.state === "DELIVERED") && {
      time: order.timeline.find((e) => e.state === "DELIVERED").at,
      label: "Delivered · POD on file",
      where: order.timeline.find((e) => e.state === "DELIVERED").note || c.name,
    } : null,
  ].filter(Boolean).filter((p) => new Date(p.time) <= new Date());

  return (
    <>
      <div className="scrim" onClick={onClose}></div>
      <div className="drawer">
        <div className="drawer-head">
          <div>
            <div className="card-h" style={{ fontSize: 17 }}>Shipment · {order.id}</div>
            <div className="dim" style={{ fontSize: 12 }}>Waybill <span className="mono">{m.waybill}</span> · {m.courier.name}</div>
          </div>
          <button className="btn-ghost btn btn-sm" onClick={onClose}><Icon.X /></button>
        </div>

        <div className="drawer-body">
          {/* Live status banner */}
          <div className="ship-banner" data-tone={isDelivered ? "ok" : isLate ? "warn" : "info"}>
            <div className="ship-banner-l">
              {isDelivered ? <Icon.Check /> : isLate ? <Icon.Bell /> : <Icon.Truck />}
              <div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>
                  {isDelivered ? "Delivered" : isLate ? "Past ETA — courier follow-up needed" : "In transit"}
                </div>
                <div className="dim" style={{ fontSize: 12 }}>
                  {isDelivered
                    ? `Confirmed ${fmtRel(order.timeline.find((e) => e.state === "DELIVERED").at)}`
                    : isLate
                      ? `Expected ${fmtDate(m.eta)} — already past`
                      : `Estimated arrival ${fmtDate(m.eta)} (${m.etaHours - Math.round(m.progress * m.etaHours)}h remaining)`}
                </div>
              </div>
            </div>
            {!isDelivered && (
              <button className="btn btn-sm" onClick={() => alert(`Calling ${m.courier.name}…`)}>
                <Icon.Bell /> Ping courier
              </button>
            )}
          </div>

          {/* Synthetic route map */}
          <RouteMap origin={w} destCity={c.city} destRegion={c.region} progress={m.progress} late={isLate} delivered={isDelivered} />

          {/* Tracking events */}
          <div className="card-h" style={{ marginTop: 16, marginBottom: 8 }}>Tracking events</div>
          <div className="ship-events">
            {pings.slice().reverse().map((p, i) => (
              <div key={i} className="ship-event">
                <div className="ship-event-dot" data-current={i === 0 && !isDelivered ? "1" : "0"} />
                <div className="ship-event-body">
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.label}</div>
                  <div className="dim" style={{ fontSize: 11.5 }}>{fmtDate(p.time)} · {p.where}</div>
                </div>
                <div className="dim mono" style={{ fontSize: 11 }}>{fmtRel(p.time)}</div>
              </div>
            ))}
          </div>

          {/* Cargo */}
          <div className="card-h" style={{ marginTop: 16, marginBottom: 8 }}>Cargo · {order.lines.reduce((s, l) => s + l.qty, 0)} units in {order.lines.length} lines</div>
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>SKU</th><th>Item</th><th className="num">Qty</th></tr></thead>
              <tbody>
                {order.lines.map((l) => (
                  <tr key={l.sku}><td className="id">{l.sku}</td><td>{l.name}</td><td className="num">{l.qty} {l.unit}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* POD section */}
          {isDelivered ? (
            <div className="pod-card">
              <div className="row gap-2" style={{ alignItems: "center", marginBottom: 8 }}>
                <Icon.Check />
                <div style={{ fontWeight: 500, fontSize: 13 }}>Proof of delivery on file</div>
              </div>
              <div className="dim" style={{ fontSize: 12, marginBottom: 10 }}>
                {order.timeline.find((e) => e.state === "DELIVERED")?.note || "Receiving signed off"}
              </div>
              <div className="pod-thumb">
                <div className="pod-sig">
                  <svg viewBox="0 0 220 60" width="100%" height="100%">
                    <path d="M10 45 Q 25 10 45 35 T 80 30 Q 100 20 115 40 T 160 32 Q 180 22 205 38" stroke="var(--ink)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="dim mono" style={{ fontSize: 11, paddingTop: 6, borderTop: "1px solid var(--line)" }}>
                  Signed by R. Mariano · {c.name}
                </div>
              </div>
            </div>
          ) : (
            <div className="pod-card pod-empty">
              <div className="row gap-2" style={{ alignItems: "center", marginBottom: 6 }}>
                <Icon.Doc />
                <div style={{ fontWeight: 500, fontSize: 13 }}>Awaiting proof of delivery</div>
              </div>
              <div className="dim" style={{ fontSize: 12, marginBottom: 12 }}>Upload signed waybill copy or driver photo to close this shipment.</div>
              {role !== "CUSTOMER" && (
                <div className="row gap-2">
                  <button className="btn btn-sm"><Icon.Doc /> Upload POD</button>
                  <button className="btn btn-sm"><Icon.Edit /> Capture e-signature</button>
                  <button className="btn btn-primary btn-sm" style={{ marginLeft: "auto" }} onClick={onMarkDelivered}>
                    <Icon.Check /> Mark delivered
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function RouteMap({ origin, destCity, destRegion, progress, late, delivered }) {
  // Stylized map — abstract islands of PH with a route arc
  return (
    <div className="route-map">
      <svg viewBox="0 0 600 260" width="100%" height="100%">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0 L0 0 0 20" fill="none" stroke="var(--line)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="600" height="260" fill="var(--bg-2)" />
        <rect width="600" height="260" fill="url(#grid)" opacity="0.5" />
        {/* Abstract land masses */}
        <path d="M80 50 Q 110 30 160 50 Q 200 70 195 110 Q 220 140 195 170 Q 160 200 120 185 Q 70 175 65 130 Q 45 90 80 50 Z" fill="var(--bg)" stroke="var(--line-2)" />
        <path d="M280 110 Q 310 95 340 115 Q 360 135 345 155 Q 325 175 295 165 Q 270 145 280 110 Z" fill="var(--bg)" stroke="var(--line-2)" />
        <path d="M420 90 Q 470 80 510 110 Q 540 145 520 195 Q 480 220 440 200 Q 410 175 415 130 Q 410 105 420 90 Z" fill="var(--bg)" stroke="var(--line-2)" />
        {/* Route arc */}
        {(() => {
          // origin x by warehouse code
          const ox = origin.code === "MNL" ? 130 : origin.code === "CEB" ? 305 : 470;
          const oy = origin.code === "MNL" ? 110 : origin.code === "CEB" ? 140 : 145;
          const dx = 460, dy = 80; // generic destination
          const mx = (ox + dx) / 2, my = Math.min(oy, dy) - 50;
          const arcD = `M ${ox} ${oy} Q ${mx} ${my} ${dx} ${dy}`;
          // Truck position along arc
          const t = progress;
          const bx = (1 - t) * (1 - t) * ox + 2 * (1 - t) * t * mx + t * t * dx;
          const by = (1 - t) * (1 - t) * oy + 2 * (1 - t) * t * my + t * t * dy;
          return (
            <>
              <path d={arcD} stroke="var(--line-2)" strokeWidth="1.5" strokeDasharray="3 4" fill="none" />
              <path d={arcD} stroke={late ? "oklch(0.55 0.14 25)" : "var(--ink)"} strokeWidth="2" fill="none"
                    strokeDasharray="500" strokeDashoffset={500 * (1 - t)} />
              {/* Origin pin */}
              <g>
                <circle cx={ox} cy={oy} r="6" fill="var(--bg)" stroke="var(--ink)" strokeWidth="2" />
                <circle cx={ox} cy={oy} r="2.5" fill="var(--ink)" />
                <text x={ox} y={oy + 22} fontSize="11" fontFamily="ui-monospace" fill="var(--fg)" textAnchor="middle">{origin.code}</text>
              </g>
              {/* Destination pin */}
              <g>
                <circle cx={dx} cy={dy} r="7" fill={delivered ? "oklch(0.55 0.13 145)" : "var(--bg)"} stroke="var(--ink)" strokeWidth="2" />
                {delivered && <path d={`M ${dx-3} ${dy} l 2 2 l 4 -4`} stroke="var(--bg)" strokeWidth="1.8" fill="none" strokeLinecap="round" />}
                <text x={dx} y={dy - 12} fontSize="11" fontFamily="ui-sans-serif" fill="var(--fg)" textAnchor="middle">{destCity}</text>
                <text x={dx} y={dy - 24} fontSize="10" fontFamily="ui-monospace" fill="var(--muted)" textAnchor="middle">Region {destRegion}</text>
              </g>
              {/* Truck */}
              {!delivered && (
                <g transform={`translate(${bx - 9} ${by - 9})`}>
                  <rect width="18" height="18" rx="9" fill={late ? "oklch(0.55 0.14 25)" : "var(--ink)"} />
                  <g transform="translate(2 2) scale(0.875)" stroke="var(--bg)" strokeWidth="1.2" fill="none">
                    <path d="M1.5 4h7v7h-7zM8.5 6.5h3l2 2.5v2H8.5z" strokeLinejoin="round"/>
                    <circle cx="4.5" cy="12" r="1.2"/>
                    <circle cx="11.5" cy="12" r="1.2"/>
                  </g>
                </g>
              )}
            </>
          );
        })()}
      </svg>
    </div>
  );
}

// ─── INVENTORY WORKFLOW ─────────────────────────────────────────────────────
// Synthetic per-warehouse stock distribution
function buildInventory() {
  const rows = [];
  const split = { "WH-MNL": 0.55, "WH-CEB": 0.28, "WH-DVO": 0.17 };
  const reorder = { "WH-MNL": 0.18, "WH-CEB": 0.12, "WH-DVO": 0.08 };
  CATALOG.forEach((p) => {
    WAREHOUSES.forEach((w) => {
      const onHand = Math.round(p.stock * split[w.id]);
      const reserved = Math.round(onHand * (0.05 + (p.sku.length % 4) * 0.02));
      const reorderPt = Math.round(p.stock * reorder[w.id]);
      const max = reorderPt * 4;
      rows.push({
        sku: p.sku, name: p.name, unit: p.unit, cat: p.cat, price: p.price,
        warehouseId: w.id, warehouseCode: w.code,
        onHand, reserved, available: onHand - reserved,
        reorderPt, max,
        avgDaily: Math.max(1, Math.round(onHand / (40 + (p.sku.length * 3) % 50))),
      });
    });
  });
  return rows;
}

const _MOVEMENTS_SEED = [
  // recent stock movements
  { id: "MV-9941", at: hoursAgo(0.5),  type: "PICK",      sku: "CON-IV-018",  warehouseId: "WH-MNL", qty: -200, ref: "SO-2026-0418", by: "L. Aquino",      cost: 78.00 },
  { id: "MV-9940", at: hoursAgo(1.2),  type: "PICK",      sku: "CON-SY-10",   warehouseId: "WH-MNL", qty: -1500, ref: "SO-2026-0418", by: "L. Aquino",     cost: 14.50 },
  { id: "MV-9939", at: hoursAgo(2.1),  type: "RECEIPT",   sku: "CON-MSK-N95", warehouseId: "WH-MNL", qty: +5000, ref: "PO-101-2241",  by: "Receiving Bay 2", cost: 38.00 },
  { id: "MV-9938", at: hoursAgo(3.4),  type: "TRANSFER",  sku: "CON-GLV-M",   warehouseId: "WH-CEB", qty: +200, ref: "TR-0034 ← MNL", by: "S. Tan",         cost: 365.00 },
  { id: "MV-9937", at: hoursAgo(3.4),  type: "TRANSFER",  sku: "CON-GLV-M",   warehouseId: "WH-MNL", qty: -200, ref: "TR-0034 → CEB", by: "S. Tan",         cost: 365.00 },
  { id: "MV-9936", at: hoursAgo(5),    type: "ADJUSTMENT",sku: "CON-CTH-16",  warehouseId: "WH-DVO", qty: -8,   ref: "CC-2026-W19",   by: "M. Reyes",       cost: 142.00, note: "Cycle count: shrinkage" },
  { id: "MV-9935", at: hoursAgo(6.5),  type: "PICK",      sku: "CON-GZE-4",   warehouseId: "WH-CEB", qty: -1200, ref: "SO-2026-0417", by: "WH-CEB Pack",   cost: 9.75 },
  { id: "MV-9934", at: hoursAgo(8),    type: "RECEIPT",   sku: "CON-BAG-1L",  warehouseId: "WH-CEB", qty: +800, ref: "PO-104-1812",  by: "Receiving Bay 1", cost: 64.00 },
  { id: "MV-9933", at: hoursAgo(11),   type: "PICK",      sku: "CON-SY-10",   warehouseId: "WH-CEB", qty: -800, ref: "SO-2026-0414", by: "WH-CEB Pack",    cost: 14.50 },
  { id: "MV-9932", at: hoursAgo(14),   type: "RETURN",    sku: "CON-IV-018",  warehouseId: "WH-MNL", qty: +12,  ref: "RMA-2026-118",  by: "QA Hold",        cost: 78.00, note: "Customer return — accepted" },
  { id: "MV-9931", at: hoursAgo(20),   type: "ADJUSTMENT",sku: "CON-ALC-500", warehouseId: "WH-MNL", qty: +3,   ref: "CC-2026-W19",   by: "M. Reyes",       cost: 0,      note: "Found stock" },
  { id: "MV-9930", at: hoursAgo(26),   type: "RECEIPT",   sku: "EQP-MON-BP",  warehouseId: "WH-MNL", qty: +24,  ref: "PO-108-0901",   by: "Receiving Bay 1", cost: 12500.00 },
  { id: "MV-9929", at: hoursAgo(30),   type: "TRANSFER",  sku: "CON-MSK-N95", warehouseId: "WH-DVO", qty: +500, ref: "TR-0033 ← MNL", by: "S. Tan",         cost: 38.00 },
  { id: "MV-9928", at: hoursAgo(30),   type: "TRANSFER",  sku: "CON-MSK-N95", warehouseId: "WH-MNL", qty: -500, ref: "TR-0033 → DVO", by: "S. Tan",         cost: 38.00 },
];

const _TRANSFERS_SEED = [
  { id: "TR-0035", from: "WH-MNL", to: "WH-CEB", status: "IN_TRANSIT", createdAt: hoursAgo(6),  eta: hoursAgo(-18), lines: [ { sku: "CON-IV-018", qty: 400 }, { sku: "CON-SY-3", qty: 2000 } ] },
  { id: "TR-0034", from: "WH-MNL", to: "WH-CEB", status: "RECEIVED",   createdAt: hoursAgo(50), eta: hoursAgo(8),   lines: [ { sku: "CON-GLV-M", qty: 200 } ] },
  { id: "TR-0033", from: "WH-MNL", to: "WH-DVO", status: "RECEIVED",   createdAt: hoursAgo(72), eta: hoursAgo(30),  lines: [ { sku: "CON-MSK-N95", qty: 500 } ] },
  { id: "TR-0036", from: "WH-CEB", to: "WH-DVO", status: "DRAFT",      createdAt: hoursAgo(0.5), eta: hoursAgo(-36), lines: [ { sku: "CON-GZE-4", qty: 1500 }, { sku: "CON-BAG-1L", qty: 100 } ] },
];

const _INBOUND_SEED = [
  { id: "PO-2026-0301", supplierId: "SUP-101", warehouseId: "WH-MNL", status: "EXPECTED",  expectedAt: hoursAgo(-6),  total: 480000, lines: [ { sku: "CON-MSK-N95", qty: 5000 }, { sku: "CON-IV-018", qty: 800 } ] },
  { id: "PO-2026-0299", supplierId: "SUP-104", warehouseId: "WH-MNL", status: "RECEIVING", expectedAt: hoursAgo(2),   total: 340000, lines: [ { sku: "CON-BAG-1L", qty: 4000 } ], received: 2400 },
  { id: "PO-2026-0297", supplierId: "SUP-102", warehouseId: "WH-CEB", status: "EXPECTED",  expectedAt: hoursAgo(-30), total: 192000, lines: [ { sku: "CON-GLV-M", qty: 400 } ] },
  { id: "PO-2026-0294", supplierId: "SUP-108", warehouseId: "WH-MNL", status: "RECEIVED",  expectedAt: hoursAgo(40),  total: 825000, lines: [ { sku: "EQP-MON-BP", qty: 24 } ] },
  { id: "PO-2026-0291", supplierId: "SUP-103", warehouseId: "WH-DVO", status: "DELAYED",   expectedAt: hoursAgo(96),  total: 128000, lines: [ { sku: "CON-CTH-16", qty: 600 } ] },
];

function InventoryView({ orders }) {
  const [tab, setTab] = React.useState("STOCK");
  const inventory = React.useMemo(() => buildInventory(), []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-h1">Inventory</h1>
          <div className="page-sub">Multi-warehouse stock control · movements · transfers · inbound</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-sm"><Icon.Down /> Export valuation</button>
          <button className="btn btn-sm"><Icon.Print /> Cycle count sheet</button>
          <button className="btn btn-primary btn-sm"><Icon.Plus /> New transfer</button>
        </div>
      </div>

      <div className="tabs">
        {[
          ["STOCK",    "Stock levels"],
          ["MOVE",     "Movements"],
          ["INBOUND",  "Inbound POs"],
          ["TRANSFER", "Transfers"],
          ["REORDER",  "Reorder"],
          ["COUNT",    "Cycle counts"],
        ].map(([k, l]) => (
          <button key={k} className="tab" data-active={tab === k ? "1" : "0"} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "STOCK"    && <StockLevelsTab inventory={inventory} />}
      {tab === "MOVE"     && <MovementsTab />}
      {tab === "INBOUND"  && <InboundTab />}
      {tab === "TRANSFER" && <TransfersTab />}
      {tab === "REORDER"  && <ReorderTab inventory={inventory} />}
      {tab === "COUNT"    && <CycleCountTab inventory={inventory} />}
    </div>
  );
}

// ── Stock levels (matrix)
function StockLevelsTab({ inventory }) {
  const [search, setSearch] = React.useState("");
  const [cat, setCat] = React.useState("All");
  const [showLow, setShowLow] = React.useState(false);

  // Aggregate per SKU with per-warehouse cells
  const skus = [...new Set(inventory.map((r) => r.sku))];
  const cats = ["All", ...new Set(inventory.map((r) => r.cat))];
  const rows = skus.map((sku) => {
    const cells = inventory.filter((r) => r.sku === sku);
    const sample = cells[0];
    const totalOnHand = cells.reduce((s, c) => s + c.onHand, 0);
    const totalReserved = cells.reduce((s, c) => s + c.reserved, 0);
    const totalReorder = cells.reduce((s, c) => s + c.reorderPt, 0);
    const value = totalOnHand * sample.price;
    const low = cells.some((c) => c.onHand <= c.reorderPt);
    return { sku, name: sample.name, cat: sample.cat, unit: sample.unit, price: sample.price, cells, totalOnHand, totalReserved, totalReorder, value, low };
  });

  const filtered = rows.filter((r) => {
    if (cat !== "All" && r.cat !== cat) return false;
    if (showLow && !r.low) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return r.sku.toLowerCase().includes(s) || r.name.toLowerCase().includes(s);
  });

  const totalValue = rows.reduce((s, r) => s + r.value, 0);
  const lowCount = rows.filter((r) => r.low).length;

  return (
    <div>
      <div className="stat-grid">
        <Stat label="On-hand value" value={SHORT_PESO(totalValue)} trend={`${rows.length} SKUs · ${WAREHOUSES.length} warehouses`} />
        <Stat label="Total units" value={rows.reduce((s, r) => s + r.totalOnHand, 0).toLocaleString()} trend={`${rows.reduce((s, r) => s + r.totalReserved, 0).toLocaleString()} reserved for orders`} />
        <Stat label="Below reorder point" value={lowCount.toString()} trend={lowCount > 0 ? "Action needed" : "Healthy"} dn={lowCount > 0} />
        <Stat label="Stock turn (annualized)" value="6.4x" trend="Faster than LY" up />
      </div>

      <div className="filters">
        <div className="search" style={{ width: 320 }}>
          <Icon.Search />
          <input placeholder="SKU or item name…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {cats.map((c) => (
          <button key={c} className="chip" data-on={cat === c ? "1" : "0"} onClick={() => setCat(c)}>{c}</button>
        ))}
        <button className="chip" data-on={showLow ? "1" : "0"} onClick={() => setShowLow(!showLow)}>Below reorder only</button>
        <span className="dim" style={{ marginLeft: "auto", fontSize: 12 }}>{filtered.length} of {rows.length}</span>
      </div>

      <div className="table-wrap">
        <table className="tbl inv-matrix">
          <thead>
            <tr>
              <th rowSpan="2">SKU</th>
              <th rowSpan="2">Item</th>
              <th rowSpan="2" className="num">Total on hand</th>
              <th rowSpan="2" className="num">Reserved</th>
              <th colSpan={WAREHOUSES.length} style={{ textAlign: "center", borderLeft: "1px solid var(--line)" }}>By warehouse</th>
              <th rowSpan="2" className="num">Value</th>
              <th rowSpan="2"></th>
            </tr>
            <tr>
              {WAREHOUSES.map((w) => <th key={w.id} className="num" style={{ borderLeft: w.id === WAREHOUSES[0].id ? "1px solid var(--line)" : "none" }}>{w.code}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.sku}>
                <td className="id">{r.sku}</td>
                <td>
                  <div>{r.name}</div>
                  <div className="dim" style={{ fontSize: 11.5, marginTop: 2 }}>{r.cat} · {r.unit}</div>
                </td>
                <td className="num" style={r.low ? { color: "var(--st-cancel-fg)", fontWeight: 500 } : {}}>{r.totalOnHand.toLocaleString()}</td>
                <td className="num dim">{r.totalReserved.toLocaleString()}</td>
                {r.cells.map((c, i) => {
                  const ratio = c.reorderPt > 0 ? c.onHand / (c.reorderPt * 4) : 0.5;
                  const pct = Math.min(1, ratio);
                  const isLow = c.onHand <= c.reorderPt;
                  return (
                    <td key={c.warehouseId} className="num" style={{ borderLeft: i === 0 ? "1px solid var(--line)" : "none", padding: "8px 12px" }}>
                      <div style={{ fontWeight: 500, fontSize: 13, color: isLow ? "var(--st-cancel-fg)" : "var(--fg)" }}>
                        {c.onHand.toLocaleString()}
                      </div>
                      <div style={{ height: 3, marginTop: 5, background: "var(--bg-2)", borderRadius: 2, overflow: "hidden", width: 56, marginLeft: "auto" }}>
                        <div style={{ height: "100%", width: `${pct * 100}%`, background: isLow ? "oklch(0.55 0.14 25)" : "var(--ink)", opacity: 0.75 }} />
                      </div>
                    </td>
                  );
                })}
                <td className="num">{SHORT_PESO(r.value)}</td>
                <td style={{ textAlign: "right", paddingRight: 10 }}>
                  {r.low && <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); alert("Drafting reorder…"); }}>Reorder</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Movements
function MovementsTab() {
  const [type, setType] = React.useState("ALL");
  const [wh, setWh] = React.useState("");
  const [search, setSearch] = React.useState("");

  const movements = _MOVEMENTS_SEED;
  const types = ["ALL", "RECEIPT", "PICK", "TRANSFER", "ADJUSTMENT", "RETURN"];
  const filtered = movements.filter((m) => {
    if (type !== "ALL" && m.type !== type) return false;
    if (wh && m.warehouseId !== wh) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return m.sku.toLowerCase().includes(s) || (m.ref || "").toLowerCase().includes(s) || (m.id || "").toLowerCase().includes(s);
  });

  const inflow = movements.filter((m) => m.qty > 0).reduce((s, m) => s + m.qty * m.cost, 0);
  const outflow = movements.filter((m) => m.qty < 0).reduce((s, m) => s + Math.abs(m.qty) * m.cost, 0);

  return (
    <div>
      <div className="stat-grid">
        <Stat label="Inflow value (24h)" value={SHORT_PESO(inflow)} trend="Receipts + transfers in + returns" up />
        <Stat label="Outflow value (24h)" value={SHORT_PESO(outflow)} trend="Picks + transfers out" />
        <Stat label="Total movements" value={movements.length.toString()} trend={`${types.slice(1).map((t) => `${movements.filter((m) => m.type === t).length} ${t.toLowerCase()}`).join(" · ")}`} />
        <Stat label="Adjustments" value={movements.filter((m) => m.type === "ADJUSTMENT").length.toString()} trend="Cycle count variance" />
      </div>

      <div className="filters">
        <div className="search" style={{ width: 280 }}>
          <Icon.Search />
          <input placeholder="SKU or reference…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {types.map((t) => (
          <button key={t} className="chip" data-on={type === t ? "1" : "0"} onClick={() => setType(t)}>{t === "ALL" ? "All types" : t.charAt(0) + t.slice(1).toLowerCase()}</button>
        ))}
        <span style={{ width: 1, height: 18, background: "var(--line-2)", margin: "0 4px" }} />
        <button className="chip" data-on={wh ? "0" : "1"} onClick={() => setWh("")}>All warehouses</button>
        {WAREHOUSES.map((w) => (
          <button key={w.id} className="chip" data-on={wh === w.id ? "1" : "0"} onClick={() => setWh(wh === w.id ? "" : w.id)}>{w.code}</button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead><tr>
            <th>When</th><th>Type</th><th>SKU</th><th>WH</th>
            <th className="num">Qty</th><th className="num">Cost impact</th>
            <th>Reference</th><th>By</th>
          </tr></thead>
          <tbody>
            {filtered.map((m) => {
              const p = productBySku(m.sku);
              return (
                <tr key={m.id}>
                  <td>
                    <div style={{ fontSize: 13 }}>{fmtRel(m.at)}</div>
                    <div className="dim" style={{ fontSize: 11 }}>{fmtDate(m.at)}</div>
                  </td>
                  <td><MovementChip type={m.type} /></td>
                  <td>
                    <div className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{m.sku}</div>
                    <div className="dim" style={{ fontSize: 11.5, marginTop: 1 }}>{p?.name}</div>
                  </td>
                  <td><span className="badge">{warehouseById(m.warehouseId).code}</span></td>
                  <td className="num mono" style={{ color: m.qty > 0 ? "oklch(0.45 0.12 145)" : "var(--st-cancel-fg)", fontWeight: 500 }}>
                    {m.qty > 0 ? "+" : ""}{m.qty.toLocaleString()}
                  </td>
                  <td className="num dim">{SHORT_PESO(Math.abs(m.qty) * m.cost)}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{m.ref}{m.note ? <span className="dim" style={{ fontStyle: "italic", marginLeft: 6 }}>· {m.note}</span> : null}</td>
                  <td className="dim">{m.by}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MovementChip({ type }) {
  const cfg = {
    RECEIPT:    { icon: <Icon.ArrowDown />, label: "Receipt",    bg: "oklch(0.95 0.04 145)", fg: "oklch(0.32 0.10 145)" },
    PICK:       { icon: <Icon.ArrowUp />,   label: "Pick",       bg: "oklch(0.95 0.03 25)",  fg: "oklch(0.40 0.12 25)"  },
    TRANSFER:   { icon: <Icon.Truck />,     label: "Transfer",   bg: "oklch(0.95 0.03 240)", fg: "oklch(0.35 0.10 240)" },
    ADJUSTMENT: { icon: <Icon.Edit />,      label: "Adjustment", bg: "oklch(0.95 0.03 80)",  fg: "oklch(0.35 0.10 80)"  },
    RETURN:     { icon: <Icon.Order />,     label: "Return",     bg: "oklch(0.94 0.04 290)", fg: "oklch(0.36 0.12 290)" },
  }[type];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 4, fontSize: 11.5, background: cfg.bg, color: cfg.fg, fontWeight: 500 }}>
      <span style={{ width: 10, height: 10, display: "inline-flex" }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

// ── Inbound POs
function InboundTab() {
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [items, setItems] = React.useState(_INBOUND_SEED);
  const [active, setActive] = React.useState(null);
  const toast = useToast();

  const filtered = items.filter((p) => statusFilter === "ALL" || p.status === statusFilter);
  const counts = {
    ALL: items.length,
    EXPECTED: items.filter((p) => p.status === "EXPECTED").length,
    RECEIVING: items.filter((p) => p.status === "RECEIVING").length,
    DELAYED: items.filter((p) => p.status === "DELAYED").length,
    RECEIVED: items.filter((p) => p.status === "RECEIVED").length,
  };

  const startReceive = (po) => setActive(po);
  const completeReceive = (po, receivedQtys) => {
    setItems((prev) => prev.map((p) => p.id === po.id ? { ...p, status: "RECEIVED", received: receivedQtys } : p));
    toast(`${po.id} fully received · stock updated`);
    setActive(null);
  };

  return (
    <div>
      <div className="stat-grid">
        <Stat label="Expected today" value={items.filter((p) => p.status === "EXPECTED" && new Date(p.expectedAt) < new Date(_now.getTime() + 24*3600*1000)).length.toString()} trend={`${counts.EXPECTED} total expected`} />
        <Stat label="Currently receiving" value={counts.RECEIVING.toString()} trend="Bays in use" />
        <Stat label="Delayed" value={counts.DELAYED.toString()} trend={counts.DELAYED ? "Supplier follow-up" : "No issues"} dn={counts.DELAYED > 0} />
        <Stat label="Inbound value" value={SHORT_PESO(items.filter((p) => p.status !== "RECEIVED").reduce((s, p) => s + p.total, 0))} trend="Pending receipt" />
      </div>

      <div className="filters">
        {[["ALL", "All"], ["EXPECTED", "Expected"], ["RECEIVING", "Receiving"], ["DELAYED", "Delayed"], ["RECEIVED", "Received"]].map(([k, l]) => (
          <button key={k} className="chip" data-on={statusFilter === k ? "1" : "0"} onClick={() => setStatusFilter(k)}>{l} <span className="chip-count">{counts[k]}</span></button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead><tr>
            <th>PO</th><th>Supplier</th><th>Destination</th><th>Expected</th>
            <th className="num">Lines</th><th className="num">Total</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {filtered.map((p) => {
              const sup = SUPPLIERS.find((s) => s.id === p.supplierId);
              const w = warehouseById(p.warehouseId);
              const totalQty = p.lines.reduce((s, l) => s + l.qty, 0);
              const isLate = new Date(p.expectedAt) < new Date() && !["RECEIVED"].includes(p.status);
              return (
                <tr key={p.id}>
                  <td className="id">{p.id}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{sup?.name}</div>
                    <div className="dim" style={{ fontSize: 11.5, marginTop: 1 }}>{sup?.terms} · {sup?.lead}d lead</div>
                  </td>
                  <td><span className="badge">{w.code}</span> <span className="dim" style={{ fontSize: 11.5 }}>{w.name.replace(/^.*— /, "")}</span></td>
                  <td style={isLate ? { color: "var(--st-cancel-fg)", fontWeight: 500 } : {}}>{fmtDate(p.expectedAt)}{isLate ? " · late" : ""}</td>
                  <td className="num dim">{p.lines.length} · {totalQty.toLocaleString()} units</td>
                  <td className="num">{SHORT_PESO(p.total)}</td>
                  <td><InboundStatusPill status={p.status} /></td>
                  <td style={{ textAlign: "right", paddingRight: 10 }}>
                    {p.status !== "RECEIVED" && (
                      <button className="btn btn-sm btn-primary" onClick={() => startReceive(p)}>
                        <Icon.Box /> {p.status === "RECEIVING" ? "Continue" : "Receive"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {active && <ReceiveModal po={active} onClose={() => setActive(null)} onComplete={(qtys) => completeReceive(active, qtys)} />}
    </div>
  );
}

function InboundStatusPill({ status }) {
  const map = {
    EXPECTED:  { label: "Expected",   bg: "oklch(0.95 0.02 250)", fg: "oklch(0.35 0.06 250)" },
    RECEIVING: { label: "Receiving",  bg: "oklch(0.94 0.04 80)",  fg: "oklch(0.32 0.10 80)"  },
    DELAYED:   { label: "Delayed",    bg: "oklch(0.94 0.05 25)",  fg: "oklch(0.40 0.12 25)"  },
    RECEIVED:  { label: "Received",   bg: "oklch(0.94 0.04 145)", fg: "oklch(0.32 0.10 145)" },
  }[status];
  return <span style={{ padding: "3px 9px", borderRadius: 4, fontSize: 11.5, background: map.bg, color: map.fg, fontWeight: 500 }}>{map.label}</span>;
}

function ReceiveModal({ po, onClose, onComplete }) {
  const sup = SUPPLIERS.find((s) => s.id === po.supplierId);
  const [received, setReceived] = React.useState(po.lines.map((l) => ({ sku: l.sku, qty: l.qty, accepted: l.qty, damaged: 0 })));
  const totalAccepted = received.reduce((s, r) => s + r.accepted, 0);
  const totalDamaged = received.reduce((s, r) => s + r.damaged, 0);
  const totalExpected = po.lines.reduce((s, l) => s + l.qty, 0);

  return (
    <>
      <div className="scrim" onClick={onClose}></div>
      <div className="modal" style={{ width: 720 }}>
        <div className="card-head">
          <div>
            <div className="card-h">Receive · {po.id}</div>
            <div className="dim" style={{ fontSize: 12, marginTop: 2 }}>{sup?.name} → {warehouseById(po.warehouseId).name}</div>
          </div>
          <button className="btn-ghost btn btn-sm" style={{ marginLeft: "auto" }} onClick={onClose}><Icon.X /></button>
        </div>
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div className="callout" style={{ marginBottom: 12 }}>
            <Icon.Box />
            <div>
              <div style={{ fontWeight: 500, fontSize: 13 }}>Verify each line against the supplier waybill</div>
              <div className="dim" style={{ fontSize: 12 }}>Damaged units go to QA hold — not into available stock.</div>
            </div>
          </div>
          <div className="table-wrap" style={{ marginBottom: 0 }}>
            <table className="tbl">
              <thead><tr>
                <th>SKU</th><th>Item</th>
                <th className="num">Expected</th>
                <th className="num">Accepted</th>
                <th className="num">Damaged</th>
                <th className="num">Variance</th>
              </tr></thead>
              <tbody>
                {received.map((r, i) => {
                  const p = productBySku(r.sku);
                  const variance = (r.accepted + r.damaged) - r.qty;
                  return (
                    <tr key={r.sku}>
                      <td className="id">{r.sku}</td>
                      <td>{p?.name}</td>
                      <td className="num dim">{r.qty.toLocaleString()}</td>
                      <td className="num">
                        <input className="input mono" type="number" value={r.accepted} style={{ width: 90, textAlign: "right" }}
                               onChange={(e) => setReceived((rs) => rs.map((x, j) => j === i ? { ...x, accepted: Number(e.target.value) } : x))} />
                      </td>
                      <td className="num">
                        <input className="input mono" type="number" value={r.damaged} style={{ width: 80, textAlign: "right" }}
                               onChange={(e) => setReceived((rs) => rs.map((x, j) => j === i ? { ...x, damaged: Number(e.target.value) } : x))} />
                      </td>
                      <td className="num mono" style={{ color: variance === 0 ? "var(--muted)" : variance < 0 ? "var(--st-cancel-fg)" : "oklch(0.40 0.12 145)" }}>
                        {variance === 0 ? "—" : (variance > 0 ? "+" : "") + variance}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ padding: "12px 18px", borderTop: "1px solid var(--line)", display: "flex", gap: 12, alignItems: "center" }}>
          <div className="dim" style={{ fontSize: 12 }}>
            <strong style={{ color: "var(--fg)" }}>{totalAccepted.toLocaleString()}</strong> accepted ·{" "}
            <strong style={{ color: "var(--fg)" }}>{totalDamaged.toLocaleString()}</strong> damaged of {totalExpected.toLocaleString()} expected
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button className="btn btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-sm">Save partial</button>
            <button className="btn btn-primary btn-sm" onClick={() => onComplete(totalAccepted)}><Icon.Check /> Complete & post to stock</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Transfers
function TransfersTab() {
  const [items, setItems] = React.useState(_TRANSFERS_SEED);
  const counts = {
    DRAFT: items.filter((t) => t.status === "DRAFT").length,
    IN_TRANSIT: items.filter((t) => t.status === "IN_TRANSIT").length,
    RECEIVED: items.filter((t) => t.status === "RECEIVED").length,
  };

  return (
    <div>
      <div className="stat-grid">
        <Stat label="Drafts" value={counts.DRAFT.toString()} trend="Awaiting dispatch" />
        <Stat label="In transit" value={counts.IN_TRANSIT.toString()} trend="Inter-warehouse moves" />
        <Stat label="Received (recent)" value={counts.RECEIVED.toString()} trend="Posted to receiving WH" up />
        <Stat label="Avg transit" value="22h" trend="MNL ↔ regional DCs" />
      </div>

      <div className="stack gap-3">
        {items.map((t) => {
          const from = warehouseById(t.from);
          const to = warehouseById(t.to);
          const isLate = new Date(t.eta) < new Date() && t.status !== "RECEIVED";
          return (
            <div key={t.id} className="card transfer-card">
              <div className="card-head">
                <div className="row gap-3" style={{ alignItems: "center" }}>
                  <span className="mono" style={{ fontWeight: 500, fontSize: 13 }}>{t.id}</span>
                  <TransferStatusPill status={t.status} late={isLate} />
                  <span className="dim" style={{ fontSize: 12 }}>· {t.lines.length} lines · {t.lines.reduce((s, l) => s + l.qty, 0).toLocaleString()} units</span>
                </div>
                <div className="dim" style={{ fontSize: 12 }}>Created {fmtRel(t.createdAt)}</div>
              </div>
              <div className="card-body">
                <div className="transfer-route">
                  <div className="transfer-stop">
                    <div className="dim" style={{ fontSize: 11.5 }}>From</div>
                    <div style={{ fontWeight: 500 }}>{from.code}</div>
                    <div className="dim" style={{ fontSize: 11.5 }}>{from.name.replace(/^.*— /, "")}</div>
                  </div>
                  <div className="transfer-arrow">
                    <div className="transfer-line">
                      <div className="transfer-line-fill" style={{
                        width: t.status === "RECEIVED" ? "100%" : t.status === "IN_TRANSIT" ? "55%" : "5%",
                        background: isLate ? "oklch(0.55 0.14 25)" : "var(--ink)",
                      }} />
                    </div>
                    <div className="dim mono" style={{ fontSize: 11, marginTop: 4, textAlign: "center" }}>
                      ETA {fmtDate(t.eta)}
                    </div>
                  </div>
                  <div className="transfer-stop right">
                    <div className="dim" style={{ fontSize: 11.5 }}>To</div>
                    <div style={{ fontWeight: 500 }}>{to.code}</div>
                    <div className="dim" style={{ fontSize: 11.5 }}>{to.name.replace(/^.*— /, "")}</div>
                  </div>
                </div>

                <div className="transfer-lines">
                  {t.lines.map((l) => {
                    const p = productBySku(l.sku);
                    return (
                      <div key={l.sku} className="transfer-line-item">
                        <span className="mono dim" style={{ fontSize: 11 }}>{l.sku}</span>
                        <span style={{ fontSize: 12 }}>{p?.name}</span>
                        <span className="num mono" style={{ fontSize: 12, fontWeight: 500, marginLeft: "auto" }}>{l.qty} {p?.unit}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="row gap-2" style={{ marginTop: 12 }}>
                  {t.status === "DRAFT" && <>
                    <button className="btn btn-sm">Edit</button>
                    <button className="btn btn-sm btn-primary"><Icon.Truck /> Dispatch</button>
                  </>}
                  {t.status === "IN_TRANSIT" && <button className="btn btn-sm btn-primary"><Icon.Check /> Confirm receipt at {to.code}</button>}
                  {t.status === "RECEIVED" && <span className="dim" style={{ fontSize: 12 }}>Stock posted at {to.code} · {fmtRel(t.eta)}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TransferStatusPill({ status, late }) {
  const map = {
    DRAFT:      { label: "Draft",      bg: "oklch(0.94 0.01 250)", fg: "oklch(0.40 0.02 250)" },
    IN_TRANSIT: { label: late ? "In transit · late" : "In transit", bg: "oklch(0.94 0.04 80)",  fg: "oklch(0.32 0.10 80)"  },
    RECEIVED:   { label: "Received",   bg: "oklch(0.94 0.04 145)", fg: "oklch(0.32 0.10 145)" },
  }[status];
  return <span style={{ padding: "3px 9px", borderRadius: 4, fontSize: 11.5, background: map.bg, color: map.fg, fontWeight: 500 }}>{map.label}</span>;
}

// ── Reorder
function ReorderTab({ inventory }) {
  const lowItems = inventory.filter((r) => r.onHand <= r.reorderPt).sort((a, b) => (a.onHand / a.reorderPt) - (b.onHand / b.reorderPt));
  const totalReorderValue = lowItems.reduce((s, r) => s + (r.max - r.onHand) * r.price, 0);

  return (
    <div>
      <div className="stat-grid">
        <Stat label="Items below reorder point" value={lowItems.length.toString()} trend="Across all warehouses" dn={lowItems.length > 0} />
        <Stat label="Out of stock" value={inventory.filter((r) => r.onHand === 0).length.toString()} trend="Cannot fulfill" dn={inventory.filter((r) => r.onHand === 0).length > 0} />
        <Stat label="Suggested reorder value" value={SHORT_PESO(totalReorderValue)} trend="To restore max levels" />
        <Stat label="Avg days of cover" value={Math.round(lowItems.reduce((s, r) => s + (r.onHand / Math.max(1, r.avgDaily)), 0) / Math.max(1, lowItems.length)) + "d"} trend="At current run rate" />
      </div>

      <div className="callout" style={{ marginBottom: 12 }}>
        <Icon.Bell />
        <div>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{lowItems.length} reorder suggestions ready</div>
          <div className="dim" style={{ fontSize: 12 }}>Review and approve to draft purchase orders for the recommended supplier.</div>
        </div>
        <button className="btn btn-primary btn-sm" style={{ marginLeft: "auto" }}><Icon.Check /> Approve all & draft POs</button>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead><tr>
            <th>SKU</th><th>Item</th><th>WH</th>
            <th className="num">On hand</th>
            <th className="num">Reorder pt</th>
            <th>Days of cover</th>
            <th className="num">Suggest qty</th>
            <th>Suggested supplier</th>
            <th></th>
          </tr></thead>
          <tbody>
            {lowItems.map((r) => {
              const sup = SUPPLIERS[Math.floor((r.sku.charCodeAt(4) || 0) % SUPPLIERS.length)];
              const days = Math.round(r.onHand / Math.max(1, r.avgDaily));
              const suggestQty = r.max - r.onHand;
              const dayPct = Math.max(0, Math.min(1, days / 30));
              return (
                <tr key={`${r.sku}-${r.warehouseId}`}>
                  <td className="id">{r.sku}</td>
                  <td>{r.name}</td>
                  <td><span className="badge">{r.warehouseCode}</span></td>
                  <td className="num" style={{ color: "var(--st-cancel-fg)", fontWeight: 500 }}>{r.onHand.toLocaleString()}</td>
                  <td className="num dim">{r.reorderPt.toLocaleString()}</td>
                  <td>
                    <div className="row gap-2" style={{ alignItems: "center" }}>
                      <div style={{ width: 72, height: 4, background: "var(--bg-2)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${dayPct * 100}%`, background: days < 7 ? "oklch(0.55 0.14 25)" : days < 14 ? "oklch(0.55 0.14 80)" : "var(--ink)" }} />
                      </div>
                      <span className="mono" style={{ fontSize: 12, fontWeight: days < 7 ? 500 : 400, color: days < 7 ? "var(--st-cancel-fg)" : "var(--fg)" }}>{days}d</span>
                    </div>
                  </td>
                  <td className="num mono" style={{ fontWeight: 500 }}>{suggestQty.toLocaleString()} {r.unit}</td>
                  <td className="dim">{sup.name}</td>
                  <td style={{ textAlign: "right", paddingRight: 10 }}>
                    <button className="btn btn-sm">Draft PO</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Cycle counts
function CycleCountTab({ inventory }) {
  const cycles = [
    { id: "CC-2026-W19", warehouseId: "WH-MNL", scheduledFor: hoursAgo(-26), zone: "Zone A · Consumables", skus: 48, counted: 48, variance: -23, status: "POSTED" },
    { id: "CC-2026-W19-B", warehouseId: "WH-MNL", scheduledFor: hoursAgo(-2), zone: "Zone B · Equipment", skus: 14, counted: 8, variance: 0, status: "IN_PROGRESS" },
    { id: "CC-2026-W19-C", warehouseId: "WH-CEB", scheduledFor: hoursAgo(-50), zone: "Zone A · Consumables", skus: 38, counted: 0, variance: 0, status: "SCHEDULED" },
    { id: "CC-2026-W19-D", warehouseId: "WH-DVO", scheduledFor: hoursAgo(48),  zone: "Zone A · All",         skus: 22, counted: 22, variance: -8, status: "POSTED" },
  ];

  return (
    <div>
      <div className="stat-grid">
        <Stat label="Cycle count cadence" value="Weekly" trend="ABC class A every week" />
        <Stat label="Coverage YTD" value="78%" trend="of all SKUs counted" up />
        <Stat label="Net variance value" value={"−" + SHORT_PESO(58000)} trend="6-month rolling" dn />
        <Stat label="Open counts" value={cycles.filter((c) => c.status !== "POSTED").length.toString()} trend="In progress or scheduled" />
      </div>

      <div className="callout" style={{ marginBottom: 12 }}>
        <Icon.Doc />
        <div>
          <div style={{ fontWeight: 500, fontSize: 13 }}>Next cycle: Zone B equipment at WH-MNL</div>
          <div className="dim" style={{ fontSize: 12 }}>14 SKUs · scheduled in 2 hours · counter assigned: M. Reyes</div>
        </div>
        <button className="btn btn-primary btn-sm" style={{ marginLeft: "auto" }}><Icon.Print /> Print count sheet</button>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead><tr>
            <th>Count ID</th><th>Warehouse</th><th>Zone</th><th>Scheduled</th>
            <th className="num">SKUs</th><th>Progress</th>
            <th className="num">Variance</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {cycles.map((c) => {
              const w = warehouseById(c.warehouseId);
              const pct = c.skus > 0 ? c.counted / c.skus : 0;
              return (
                <tr key={c.id}>
                  <td className="id">{c.id}</td>
                  <td><span className="badge">{w.code}</span> <span className="dim" style={{ fontSize: 11.5 }}>{w.name.replace(/^.*— /, "")}</span></td>
                  <td>{c.zone}</td>
                  <td className="dim">{fmtDate(c.scheduledFor)}</td>
                  <td className="num dim">{c.skus}</td>
                  <td>
                    <div className="row gap-2" style={{ alignItems: "center" }}>
                      <div style={{ width: 100, height: 4, background: "var(--bg-2)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct * 100}%`, background: pct === 1 ? "oklch(0.45 0.12 145)" : "var(--ink)" }} />
                      </div>
                      <span className="mono dim" style={{ fontSize: 11.5 }}>{c.counted}/{c.skus}</span>
                    </div>
                  </td>
                  <td className="num mono" style={{ color: c.variance === 0 ? "var(--muted)" : c.variance < 0 ? "var(--st-cancel-fg)" : "oklch(0.40 0.12 145)" }}>
                    {c.variance === 0 ? "—" : (c.variance > 0 ? "+" : "") + c.variance}
                  </td>
                  <td><CycleStatusPill status={c.status} /></td>
                  <td style={{ textAlign: "right", paddingRight: 10 }}>
                    {c.status === "IN_PROGRESS" && <button className="btn btn-sm btn-primary">Continue</button>}
                    {c.status === "SCHEDULED" && <button className="btn btn-sm">Start</button>}
                    {c.status === "POSTED" && <button className="btn-ghost btn btn-sm">View</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CycleStatusPill({ status }) {
  const map = {
    SCHEDULED:   { label: "Scheduled",   bg: "oklch(0.94 0.01 250)", fg: "oklch(0.40 0.02 250)" },
    IN_PROGRESS: { label: "In progress", bg: "oklch(0.94 0.04 80)",  fg: "oklch(0.32 0.10 80)"  },
    POSTED:      { label: "Posted",      bg: "oklch(0.94 0.04 145)", fg: "oklch(0.32 0.10 145)" },
  }[status];
  return <span style={{ padding: "3px 9px", borderRadius: 4, fontSize: 11.5, background: map.bg, color: map.fg, fontWeight: 500 }}>{map.label}</span>;
}

Object.assign(window, { ShipmentsView, InventoryView });
