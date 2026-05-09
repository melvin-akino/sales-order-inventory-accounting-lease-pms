// views.jsx — page-level views: Queue, Detail, NewOrder, Approvals, Warehouse, Dashboard.

// ─── Dashboard ──────────────────────────────────────────────────────────────
function DashboardView({ orders, onOpen, role }) {
  const counts = STATES.reduce((m, s) => (m[s] = orders.filter((o) => o.state === s).length, m), {});
  const totalOpen = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.state)).length;
  const gmv = orders.reduce((s, o) => s + o.total, 0);
  const todayDelivered = orders.filter((o) => o.state === "DELIVERED").length;
  const awaitingApproval = orders.filter((o) => o.state === "PENDING").length;

  const recent = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-h1">Good morning, {role === "AGENT" ? "Maria" : role === "FINANCE" ? "Felicidad" : role === "WAREHOUSE" ? "Eduardo" : "team"}.</h1>
          <div className="page-sub">Friday, May 9, 2026 · {totalOpen} open orders, {awaitingApproval} awaiting approval</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-sm"><Icon.Print /> Daily report</button>
          <button className="btn btn-primary btn-sm"><Icon.Plus /> New order</button>
        </div>
      </div>

      <div className="stat-grid">
        <Stat label="Open orders" value={totalOpen} trend="+3 vs. yesterday" up />
        <Stat label="Awaiting approval" value={awaitingApproval} trend={awaitingApproval > 1 ? "Action needed" : "On pace"} dn={awaitingApproval > 1} />
        <Stat label="GMV (week-to-date)" value={SHORT_PESO(gmv)} trend="+8.2% vs. last wk" up />
        <Stat label="Delivered today" value={todayDelivered} trend="On schedule" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 18 }}>
        <div className="card">
          <div className="card-head">
            <div className="card-h">Recent orders</div>
            <div style={{ marginLeft: "auto" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => onOpen("queue")}>View all <Icon.Chevron /></button>
            </div>
          </div>
          <table className="tbl">
            <thead><tr>
              <th>Order</th><th>Customer</th><th>Status</th>
              <th className="num">Total</th><th>Created</th>
            </tr></thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id} onClick={() => onOpen("order", o.id)}>
                  <td className="id">{o.id}</td>
                  <td>{customerById(o.customerId).name}</td>
                  <td><StatePill state={o.state} /></td>
                  <td className="num">{PESO(o.total)}</td>
                  <td className="dim">{fmtRel(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-h">Pipeline</div>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {STATES.map((s) => (
              <PipelineRow key={s} state={s} count={counts[s] || 0} max={Math.max(...Object.values(counts), 1)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, trend, up, dn }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className={`stat-trend ${up ? "up" : ""} ${dn ? "dn" : ""}`}>{trend}</div>
    </div>
  );
}

function PipelineRow({ state, count, max }) {
  const pct = max ? Math.round((count / max) * 100) : 0;
  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
        <StatePill state={state} />
        <span className="mono dim">{count}</span>
      </div>
      <div style={{ height: 4, background: "var(--bg-2)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: pct + "%", background: "var(--ink)", opacity: 0.7, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

// ─── Order Queue ────────────────────────────────────────────────────────────
function QueueView({ orders, onOpen, role }) {
  const [tab, setTab] = React.useState("ALL");
  const [search, setSearch] = React.useState("");
  const [whFilter, setWhFilter] = React.useState("");

  const tabFilter = (o) => tab === "ALL" ? !["CANCELLED"].includes(o.state)
    : tab === "OPEN" ? !["DELIVERED", "CANCELLED"].includes(o.state)
    : o.state === tab;
  const filtered = orders.filter(tabFilter)
    .filter((o) => !whFilter || o.warehouseId === whFilter)
    .filter((o) => {
      if (!search) return true;
      const s = search.toLowerCase();
      const cust = customerById(o.customerId).name.toLowerCase();
      return o.id.toLowerCase().includes(s) || cust.includes(s) || (o.poRef || "").toLowerCase().includes(s);
    });

  const counts = {
    ALL: orders.filter((o) => o.state !== "CANCELLED").length,
    OPEN: orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.state)).length,
    PENDING: orders.filter((o) => o.state === "PENDING").length,
    APPROVED: orders.filter((o) => o.state === "APPROVED").length,
    PREPARING: orders.filter((o) => o.state === "PREPARING").length,
    SHIPPED: orders.filter((o) => o.state === "SHIPPED").length,
    DELIVERED: orders.filter((o) => o.state === "DELIVERED").length,
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-h1">Sales orders</h1>
          <div className="page-sub">{filtered.length} of {orders.length} orders</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-sm"><Icon.Down /> Export CSV</button>
          <button className="btn btn-primary btn-sm" onClick={() => onOpen("new")}><Icon.Plus /> New order</button>
        </div>
      </div>

      <div className="tabs">
        {[
          ["OPEN", "Open"],
          ["PENDING", "Pending"],
          ["APPROVED", "Approved"],
          ["PREPARING", "Preparing"],
          ["SHIPPED", "Shipped"],
          ["DELIVERED", "Delivered"],
          ["ALL", "All"],
        ].map(([k, l]) => (
          <button key={k} className="tab" data-active={tab === k ? "1" : "0"} onClick={() => setTab(k)}>
            {l} <span className="tab-count">{counts[k] || 0}</span>
          </button>
        ))}
      </div>

      <div className="filters">
        <div className="search" style={{ width: 320 }}>
          <Icon.Search />
          <input placeholder="Search by SO, PO, or customer…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className={`chip ${whFilter ? "" : ""}`} data-on={whFilter ? "1" : "0"}
                onClick={() => setWhFilter("")}>
          {whFilter ? `Warehouse: ${warehouseById(whFilter).code}` : "All warehouses"}
        </button>
        {WAREHOUSES.map((w) => (
          <button key={w.id} className="chip" data-on={whFilter === w.id ? "1" : "0"}
                  onClick={() => setWhFilter(whFilter === w.id ? "" : w.id)}>
            {w.code}
          </button>
        ))}
        <div style={{ marginLeft: "auto" }}>
          <button className="chip"><Icon.Filter /> More filters</button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Agent</th>
              <th>Warehouse</th>
              <th>Status</th>
              <th>Need by</th>
              <th className="num">Lines</th>
              <th className="num">Total</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan="9"><div className="empty"><div className="empty-ic"><Icon.Inbox /></div>No orders match these filters</div></td></tr>
            )}
            {filtered.map((o) => {
              const c = customerById(o.customerId);
              const a = agentById(o.agentId);
              const w = warehouseById(o.warehouseId);
              const overdue = new Date(o.needBy) < new Date("2026-05-09T09:00:00+08:00") && !["DELIVERED", "CANCELLED"].includes(o.state);
              return (
                <tr key={o.id} onClick={() => onOpen("order", o.id)}>
                  <td className="id">{o.id}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{c.name}</div>
                    <div className="dim" style={{ fontSize: 11.5, marginTop: 1 }}>{c.contact}</div>
                  </td>
                  <td>{a.name}</td>
                  <td>{w.code}</td>
                  <td><StatePill state={o.state} /></td>
                  <td>
                    <span className={overdue ? "" : "dim"} style={overdue ? { color: "oklch(0.50 0.14 25)", fontWeight: 500 } : {}}>
                      {fmtDate(o.needBy)}
                      {overdue && <span style={{ marginLeft: 6, fontSize: 10.5 }}>· past</span>}
                    </span>
                  </td>
                  <td className="num dim">{o.lines.length}</td>
                  <td className="num">{PESO(o.total)}</td>
                  <td className="dim">{fmtRel(o.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Order Detail ───────────────────────────────────────────────────────────
function OrderDetailView({ order, onClose, onTransition, onCancel, role, showPH }) {
  const c = customerById(order.customerId);
  const a = agentById(order.agentId);
  const w = warehouseById(order.warehouseId);
  const t = NEXT_STATE[order.state];
  const canAct = role !== "CUSTOMER" && t && t.next && t.role && (t.role.includes(role) || role === "ADMIN");
  const isCustomer = role === "CUSTOMER";

  return (
    <>
      <div className="page-head">
        <div>
          <div className="row gap-2 dim" style={{ fontSize: 12, marginBottom: 4 }}>
            <button className="btn-ghost btn btn-sm" onClick={onClose} style={{ padding: "0 6px", height: 22 }}>← Sales orders</button>
          </div>
          <div className="row gap-3">
            <h1 className="page-h1 mono" style={{ letterSpacing: "-0.01em" }}>{order.id}</h1>
            <StatePill state={order.state} />
            {order.poRef && <span className="badge">{order.poRef}</span>}
          </div>
          <div className="page-sub">
            {c.name} · {a.name} · {w.name} · placed {fmtRel(order.createdAt)}
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-sm"><Icon.Print /> Print</button>
          <button className="btn btn-sm"><Icon.Down /> Download PDF</button>
          {!isCustomer && !["DELIVERED", "CANCELLED"].includes(order.state) && (
            <button className="btn btn-sm btn-danger" onClick={onCancel}>Cancel order</button>
          )}
          {isCustomer && order.state === "PENDING" && (
            <button className="btn btn-sm btn-danger" onClick={onCancel}>Cancel order</button>
          )}
          {canAct && (
            <button className="btn btn-sm btn-accent" onClick={() => onTransition(t.next)}>
              <Icon.Check /> {t.label}
            </button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <StepBar current={order.state} />
      </div>

      <div className="detail-grid">
        <div className="stack gap-4">
          {/* Lines table */}
          <div className="card">
            <div className="card-head">
              <div className="card-h">Line items</div>
              <span className="dim mono" style={{ marginLeft: 8, fontSize: 12 }}>{order.lines.length} lines · {order.lines.reduce((s, l) => s + l.qty, 0).toLocaleString()} units</span>
              {order.state === "PREPARING" && order.pickProgress != null && (
                <div className="row gap-2" style={{ marginLeft: "auto", fontSize: 12 }}>
                  <span className="dim">Pick progress</span>
                  <div style={{ width: 120, height: 4, background: "var(--bg-2)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${order.pickProgress * 100}%`, height: "100%", background: "var(--accent)" }} />
                  </div>
                  <span className="mono">{Math.round(order.pickProgress * 100)}%</span>
                </div>
              )}
            </div>
            <table className="tbl">
              <thead><tr>
                <th>SKU</th><th>Item</th>
                <th className="num">Qty</th><th>UoM</th>
                <th className="num">Unit price</th><th className="num">Subtotal</th>
              </tr></thead>
              <tbody>
                {order.lines.map((l, i) => (
                  <tr key={i} style={{ cursor: "default" }}>
                    <td className="id">{l.sku}</td>
                    <td>{l.name}</td>
                    <td className="num">{l.qty.toLocaleString()}</td>
                    <td className="dim">{l.unit}</td>
                    <td className="num">{PESO(l.price)}</td>
                    <td className="num">{PESO(l.qty * l.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Timeline */}
          <div className="card">
            <div className="card-head"><div className="card-h">Activity</div></div>
            <div className="card-body">
              <Timeline events={order.timeline} currentState={order.state} />
            </div>
          </div>

          {/* Ledger preview — internal only */}
          {!isCustomer && (
            <div className="card">
              <div className="card-head">
                <div className="card-h">Accounting · Journal preview</div>
                <span className="dim" style={{ marginLeft: 8, fontSize: 12 }}>Posted on delivery</span>
              </div>
              <div className="card-body">
                <LedgerPreview order={order} showPH={showPH} />
              </div>
            </div>
          )}
        </div>

        <div className="stack gap-4">
          {/* Customer / Deliver to */}
          <div className="card">
            <div className="card-head"><div className="card-h">{isCustomer ? "Deliver to" : "Customer"}</div></div>
            <div className="card-body">
              <div style={{ fontWeight: 500, marginBottom: 2 }}>{c.name}</div>
              <div className="dim" style={{ fontSize: 12.5, marginBottom: 12 }}>{c.contact}</div>
              <dl className="dl">
                {!isCustomer && <><dt>Customer ID</dt><dd className="mono">{c.id}</dd></>}
                <dt>Region</dt><dd>{c.region} — {c.city}</dd>
                <dt>Terms</dt><dd>{c.terms}</dd>
                {!isCustomer && <><dt>Credit limit</dt><dd>{PESO(c.credit)}</dd></>}
              </dl>
            </div>
          </div>

          {/* Totals */}
          <div className="card">
            <div className="card-head"><div className="card-h">Totals</div></div>
            <div className="card-body">
              <dl className="dl">
                <dt>Subtotal</dt><dd>{PESO(order.subtotal)}</dd>
                {showPH && <><dt>VAT (12%)</dt><dd>{PESO(order.vat)}</dd></>}
                {showPH && order.cwt2307 && <><dt>CWT 2307 (2%)</dt><dd>−{PESO(order.cwt)}</dd></>}
                {!showPH && <><dt>Tax</dt><dd>{PESO(order.vat - order.cwt)}</dd></>}
              </dl>
              <div className="divider"></div>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span style={{ fontWeight: 500 }}>Net amount</span>
                <span className="mono" style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                  {PESO(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Logistics */}
          <div className="card">
            <div className="card-head"><div className="card-h">Logistics</div></div>
            <div className="card-body">
              <dl className="dl">
                <dt>Warehouse</dt><dd>{w.name}</dd>
                <dt>Need by</dt><dd>{fmtDate(order.needBy)}</dd>
                {order.waybill && <><dt>Waybill</dt><dd className="mono">{order.waybill}</dd></>}
                {order.poRef && <><dt>Customer PO</dt><dd className="mono">{order.poRef}</dd></>}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Timeline({ events, currentState }) {
  // Events the order has been through, plus future steps
  const passed = events.map((e) => e.state);
  const stateIndex = (s) => STATES.indexOf(s === "CREATED" ? "PENDING" : s);
  const future = STATES.filter((s) => stateIndex(s) > STATES.indexOf(currentState) || (s === currentState && !passed.includes(currentState)));

  const allItems = [
    ...events.map((e, i) => ({ ...e, kind: "done", key: "e" + i })),
    ...future.map((s, i) => ({ state: s, kind: "future", key: "f" + i })),
  ];
  return (
    <div className="timeline">
      {allItems.map((it) => {
        const isCurrent = (it.state === currentState && it.kind === "done")
          || (it.kind === "done" && allItems.indexOf(it) === events.length - 1);
        return (
          <div key={it.key} className="tl-item" data-state={it.kind === "future" ? "future" : (isCurrent ? "active" : "done")}>
            <div className="tl-dot">
              {it.kind === "done" ? <Icon.Check /> : <Icon.Dot />}
            </div>
            <div className="tl-body">
              <div className="tl-title">{tlLabel(it.state)}</div>
              <div className="tl-meta">
                {it.kind === "done" ? (
                  <>{fmtDateTime(it.at)}{it.by ? ` · ${it.by}` : ""}{it.note ? ` — ${it.note}` : ""}</>
                ) : (
                  <span className="dim-2">Pending</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
function tlLabel(s) {
  return ({
    CREATED: "Order created",
    PENDING: "Awaiting approval",
    APPROVED: "Approved by Finance",
    PREPARING: "Warehouse preparing",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  })[s] || s;
}

function LedgerPreview({ order, showPH }) {
  const sub = order.subtotal, vat = order.vat, cwt = order.cwt, total = order.total;
  // COGS estimate at 65% of subtotal
  const cogs = Math.round(sub * 0.65 * 100) / 100;

  const lines = [
    { dr: "Accounts Receivable — " + customerById(order.customerId).name.split("—")[0].trim(), drAmt: total },
    showPH && { cr: "Output VAT Payable", crAmt: vat },
    showPH && order.cwt2307 ? { dr: "Withholding Tax Receivable (CWT 2307)", drAmt: cwt } : null,
    { cr: "Sales Revenue", crAmt: sub },
    { dr: "Cost of Goods Sold", drAmt: cogs },
    { cr: "Inventory — " + warehouseById(order.warehouseId).code, crAmt: cogs },
  ].filter(Boolean);

  const totalDr = lines.reduce((s, l) => s + (l.drAmt || 0), 0);
  const totalCr = lines.reduce((s, l) => s + (l.crAmt || 0), 0);

  return (
    <div className="ledger">
      <div className="ledger-row" style={{ fontWeight: 500, color: "var(--ink-3)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid var(--line)", paddingBottom: 8 }}>
        <span>Account</span><span style={{ textAlign: "right" }}>Debit</span><span style={{ textAlign: "right" }}>Credit</span>
      </div>
      {lines.map((l, i) => (
        <div key={i} className={l.cr ? "ledger-row cr" : "ledger-row"}>
          <span>{l.dr || l.cr}</span>
          <span style={{ textAlign: "right" }}>{l.drAmt ? PESO(l.drAmt) : ""}</span>
          <span style={{ textAlign: "right" }}>{l.crAmt ? PESO(l.crAmt) : ""}</span>
        </div>
      ))}
      <div className="ledger-row" data-total="1">
        <span>Totals</span>
        <span style={{ textAlign: "right" }}>{PESO(totalDr)}</span>
        <span style={{ textAlign: "right" }}>{PESO(totalCr)}</span>
      </div>
    </div>
  );
}

// ─── Approvals (Finance role) ───────────────────────────────────────────────
function ApprovalsView({ orders, onOpen, onTransition, role }) {
  const pending = orders.filter((o) => o.state === "PENDING");
  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-h1">Approvals inbox</h1>
          <div className="page-sub">{pending.length} order{pending.length === 1 ? "" : "s"} awaiting review</div>
        </div>
      </div>

      {pending.length === 0 && (
        <div className="card">
          <div className="empty">
            <div className="empty-ic"><Icon.Check /></div>
            All clear — nothing pending review.
          </div>
        </div>
      )}

      <div className="stack gap-3">
        {pending.map((o) => {
          const c = customerById(o.customerId);
          const a = agentById(o.agentId);
          const w = warehouseById(o.warehouseId);
          const overLimit = o.total > c.credit * 0.5; // pretend rule
          return (
            <div key={o.id} className="card">
              <div style={{ padding: 18 }}>
                <div className="row gap-3" style={{ marginBottom: 12 }}>
                  <span className="mono" style={{ fontWeight: 500 }}>{o.id}</span>
                  <StatePill state={o.state} />
                  {overLimit && <span className="badge warn">› 50% credit util.</span>}
                  <span className="dim" style={{ marginLeft: "auto", fontSize: 12 }}>placed {fmtRel(o.createdAt)} by {a.name}</span>
                </div>
                <div className="row gap-6" style={{ alignItems: "flex-start" }}>
                  <div className="grow">
                    <div style={{ fontSize: 15, fontWeight: 500 }}>{c.name}</div>
                    <div className="dim" style={{ fontSize: 12.5 }}>{c.contact} · {c.terms} · Credit {PESO(c.credit)}</div>
                    <div style={{ marginTop: 10, fontSize: 12.5 }}>
                      <span className="dim">{o.lines.length} lines</span>
                      <span className="dim"> · </span>
                      <span>{o.lines.slice(0, 3).map((l) => l.name.split(",")[0]).join(", ")}{o.lines.length > 3 ? ` +${o.lines.length - 3} more` : ""}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="dim" style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Net amount</div>
                    <div className="mono" style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>{PESO(o.total)}</div>
                    <div className="dim" style={{ fontSize: 11.5, marginTop: 2 }}>fulfill from {w.code}</div>
                  </div>
                  <div className="stack gap-2" style={{ minWidth: 180 }}>
                    {(role === "FINANCE" || role === "ADMIN") && (
                      <>
                        <button className="btn btn-accent btn-sm" onClick={() => onTransition(o.id, "APPROVED")}>
                          <Icon.Check /> Approve order
                        </button>
                        <button className="btn btn-sm" onClick={() => onOpen("order", o.id)}>Review details</button>
                      </>
                    )}
                    {role !== "FINANCE" && role !== "ADMIN" && (
                      <button className="btn btn-sm" onClick={() => onOpen("order", o.id)}>View</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Warehouse Pick & Pack (kanban) ─────────────────────────────────────────
function WarehouseView({ orders, onOpen, onTransition, role }) {
  const cols = [
    { state: "APPROVED",  label: "Ready to pick", icon: <Icon.Inbox /> },
    { state: "PREPARING", label: "Picking",        icon: <Icon.Box /> },
    { state: "SHIPPED",   label: "Shipped today",  icon: <Icon.Truck /> },
    { state: "DELIVERED", label: "Delivered",       icon: <Icon.Check /> },
  ];
  const byState = (s) => orders.filter((o) => o.state === s);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-h1">Warehouse · Pick &amp; pack</h1>
          <div className="page-sub">Manila — Pasig DC · {byState("APPROVED").length + byState("PREPARING").length} active workload</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-sm"><Icon.Print /> Print pick lists</button>
          <button className="btn btn-sm"><Icon.Tag /> Print waybills</button>
        </div>
      </div>

      <div className="kanban">
        {cols.map((col) => (
          <div key={col.state} className="kcol">
            <div className="kcol-h">
              {col.icon}
              <span>{col.label}</span>
              <span className="tab-count">{byState(col.state).length}</span>
            </div>
            {byState(col.state).map((o) => {
              const c = customerById(o.customerId);
              const totalUnits = o.lines.reduce((s, l) => s + l.qty, 0);
              const next = NEXT_STATE[o.state];
              return (
                <div key={o.id} className="kcard" onClick={() => onOpen("order", o.id)}>
                  <div className="kcard-h">
                    <span>{o.id}</span>
                    <span style={{ marginLeft: "auto" }}>{warehouseById(o.warehouseId).code}</span>
                  </div>
                  <div className="kcard-t">{c.name}</div>
                  <div className="kcard-m">
                    {o.lines.length} lines · {totalUnits.toLocaleString()} units · {PESO(o.total)}
                  </div>
                  {o.state === "PREPARING" && o.pickProgress != null && (
                    <div style={{ height: 3, background: "var(--bg-2)", borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${o.pickProgress * 100}%`, background: "var(--accent)" }} />
                    </div>
                  )}
                  {next && next.next && next.role && (next.role.includes(role) || role === "ADMIN") && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--line)" }}>
                      <button className="btn btn-sm" style={{ width: "100%", justifyContent: "center" }}
                              onClick={(e) => { e.stopPropagation(); onTransition(o.id, next.next); }}>
                        {next.label} →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {byState(col.state).length === 0 && (
              <div style={{ padding: "20px 6px", textAlign: "center", fontSize: 12, color: "var(--ink-4)" }}>
                Empty
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── New Order builder ──────────────────────────────────────────────────────
function NewOrderView({ onClose, onSubmit, showPH }) {
  const [customerId, setCustomerId] = React.useState("");
  const [warehouseId, setWarehouseId] = React.useState("WH-MNL");
  const [needBy, setNeedBy] = React.useState("2026-05-15");
  const [poRef, setPoRef] = React.useState("");
  const [cwt2307, setCwt2307] = React.useState(true);
  const [lines, setLines] = React.useState([]);
  const [search, setSearch] = React.useState("");

  const filtered = CATALOG.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.sku.toLowerCase().includes(s) || p.name.toLowerCase().includes(s);
  });

  const addProduct = (p) => {
    setLines((prev) => {
      const ex = prev.find((l) => l.sku === p.sku);
      if (ex) return prev.map((l) => l.sku === p.sku ? { ...l, qty: l.qty + 1 } : l);
      return [...prev, { sku: p.sku, name: p.name, unit: p.unit, price: p.price, qty: 1 }];
    });
  };
  const setQty = (sku, qty) => setLines((prev) => prev.map((l) => l.sku === sku ? { ...l, qty: Math.max(0, qty) } : l).filter((l) => l.qty > 0));
  const removeLine = (sku) => setLines((prev) => prev.filter((l) => l.sku !== sku));

  const sub = orderSub(lines);
  const vat = vatOf(sub);
  const cwt = cwtOf(sub, 0.02, cwt2307 && showPH);
  const total = sub + vat - cwt;
  const customer = customerById(customerId);

  const canSubmit = customerId && lines.length > 0 && warehouseId && needBy;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="row gap-2 dim" style={{ fontSize: 12, marginBottom: 4 }}>
            <button className="btn-ghost btn btn-sm" onClick={onClose} style={{ padding: "0 6px", height: 22 }}>← Sales orders</button>
          </div>
          <h1 className="page-h1">New sales order</h1>
          <div className="page-sub">Build cart, validate credit, submit for approval</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-sm">Save draft</button>
          <button className="btn btn-accent btn-sm" disabled={!canSubmit}
                  onClick={() => onSubmit({ customerId, warehouseId, needBy, poRef, cwt2307, lines })}>
            <Icon.Check /> Submit for approval
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <div className="stack gap-4">
          {/* Customer + meta */}
          <div className="card">
            <div className="card-head"><div className="card-h">Customer &amp; delivery</div></div>
            <div className="card-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label className="field-label">Customer</label>
                <Select placeholder="Select hospital…" value={customerId} onChange={setCustomerId}
                        options={CUSTOMERS.map((c) => ({ value: c.id, label: c.name }))} />
              </div>
              <div>
                <label className="field-label">Fulfilling warehouse</label>
                <Select value={warehouseId} onChange={setWarehouseId}
                        options={WAREHOUSES.map((w) => ({ value: w.id, label: w.name }))} />
              </div>
              <div>
                <label className="field-label">Need by</label>
                <input className="input" type="date" value={needBy} onChange={(e) => setNeedBy(e.target.value)} />
              </div>
              <div>
                <label className="field-label">Customer PO #</label>
                <input className="input" placeholder="PO-…" value={poRef} onChange={(e) => setPoRef(e.target.value)} />
              </div>
              {showPH && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="row gap-2" style={{ fontSize: 12.5, color: "var(--ink-2)", cursor: "pointer" }}>
                    <input type="checkbox" checked={cwt2307} onChange={(e) => setCwt2307(e.target.checked)} />
                    <span>Customer issues BIR Form 2307 — apply 2% creditable withholding tax</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Catalog picker */}
          <div className="card">
            <div className="card-head">
              <div className="card-h">Add items</div>
              <div className="search" style={{ marginLeft: "auto", width: 280, height: 30 }}>
                <Icon.Search />
                <input placeholder="Search catalog…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div style={{ maxHeight: 280, overflow: "auto" }}>
              <table className="tbl">
                <thead><tr><th>SKU</th><th>Item</th><th className="num">Stock</th><th className="num">Price</th><th></th></tr></thead>
                <tbody>
                  {filtered.slice(0, 30).map((p) => {
                    const inCart = lines.find((l) => l.sku === p.sku);
                    return (
                      <tr key={p.sku} style={{ cursor: "default" }}>
                        <td className="id">{p.sku}</td>
                        <td>{p.name}</td>
                        <td className="num dim">{p.stock.toLocaleString()} {p.unit}</td>
                        <td className="num">{PESO(p.price)}</td>
                        <td style={{ textAlign: "right", paddingRight: 10 }}>
                          <button className="btn btn-sm" onClick={() => addProduct(p)}>
                            {inCart ? <><Icon.Plus /> {inCart.qty}</> : <><Icon.Plus /> Add</>}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cart */}
          <div className="card">
            <div className="card-head">
              <div className="card-h">Cart</div>
              <span className="dim mono" style={{ marginLeft: 8, fontSize: 12 }}>{lines.length} lines</span>
            </div>
            {lines.length === 0 ? (
              <div className="empty">
                <div className="empty-ic"><Icon.Cart /></div>
                Add items above to start an order
              </div>
            ) : (
              <table className="tbl">
                <thead><tr><th>SKU</th><th>Item</th><th>Qty</th><th className="num">Price</th><th className="num">Subtotal</th><th></th></tr></thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.sku} style={{ cursor: "default" }}>
                      <td className="id">{l.sku}</td>
                      <td>{l.name}</td>
                      <td>
                        <div className="qty">
                          <button onClick={() => setQty(l.sku, l.qty - 1)}><Icon.Minus /></button>
                          <input type="number" value={l.qty} onChange={(e) => setQty(l.sku, Number(e.target.value))} />
                          <button onClick={() => setQty(l.sku, l.qty + 1)}><Icon.Plus /></button>
                        </div>
                      </td>
                      <td className="num">{PESO(l.price)}</td>
                      <td className="num">{PESO(l.qty * l.price)}</td>
                      <td style={{ textAlign: "right", paddingRight: 10 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => removeLine(l.sku)}><Icon.X /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="stack gap-4">
          {customer && (
            <div className="card">
              <div className="card-head"><div className="card-h">Credit check</div></div>
              <div className="card-body">
                <dl className="dl">
                  <dt>Credit limit</dt><dd>{PESO(customer.credit)}</dd>
                  <dt>This order</dt><dd>{PESO(total)}</dd>
                  <dt>Utilization</dt><dd>{Math.round((total / customer.credit) * 100)}%</dd>
                </dl>
                <div className="divider"></div>
                <div className="row gap-2" style={{ fontSize: 12 }}>
                  {total > customer.credit * 0.5
                    ? <span className="badge warn">Will route to Finance review</span>
                    : <span className="badge ok">Within auto-approval threshold</span>}
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-head"><div className="card-h">Totals</div></div>
            <div className="card-body">
              <dl className="dl">
                <dt>Subtotal</dt><dd>{PESO(sub)}</dd>
                {showPH && <><dt>VAT (12%)</dt><dd>{PESO(vat)}</dd></>}
                {showPH && cwt2307 && <><dt>CWT 2307 (2%)</dt><dd>−{PESO(cwt)}</dd></>}
                {!showPH && <><dt>Tax</dt><dd>{PESO(vat - cwt)}</dd></>}
              </dl>
              <div className="divider"></div>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span style={{ fontWeight: 500 }}>Net amount</span>
                <span className="mono" style={{ fontSize: 18, fontWeight: 600 }}>{PESO(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Customer-facing Shop ───────────────────────────────────────────────────
// The same catalog + cart UX as NewOrderView, but framed as a self-service
// experience for hospital procurement teams. Defaults the customer/warehouse
// from the logged-in account, hides agent/finance internals, and uses warmer
// copy (Place order vs. Submit for approval).
function CustomerShopView({ self, onSubmit, onClose, showPH }) {
  const [needBy, setNeedBy] = React.useState("2026-05-15");
  const [poRef, setPoRef] = React.useState("");
  const [cwt2307, setCwt2307] = React.useState(true);
  const [lines, setLines] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [cat, setCat] = React.useState("All");

  const cats = ["All", ...new Set(CATALOG.map((p) => p.cat))];

  const filtered = CATALOG.filter((p) => {
    if (cat !== "All" && p.cat !== cat) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return p.sku.toLowerCase().includes(s) || p.name.toLowerCase().includes(s);
  });

  const addProduct = (p, qty = 1) => {
    setLines((prev) => {
      const ex = prev.find((l) => l.sku === p.sku);
      if (ex) return prev.map((l) => l.sku === p.sku ? { ...l, qty: l.qty + qty } : l);
      return [...prev, { sku: p.sku, name: p.name, unit: p.unit, price: p.price, qty }];
    });
  };
  const setQty = (sku, qty) => setLines((prev) => prev.map((l) => l.sku === sku ? { ...l, qty: Math.max(0, qty) } : l).filter((l) => l.qty > 0));
  const removeLine = (sku) => setLines((prev) => prev.filter((l) => l.sku !== sku));

  const sub = orderSub(lines);
  const vat = vatOf(sub);
  const cwt = cwtOf(sub, 0.02, cwt2307 && showPH);
  const total = sub + vat - cwt;
  const totalUnits = lines.reduce((s, l) => s + l.qty, 0);

  const canSubmit = lines.length > 0 && needBy;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-h1">Place an order</h1>
          <div className="page-sub">
            Ordering for <b style={{ color: "var(--ink)" }}>{self.name}</b> · {self.terms} · Credit limit {PESO(self.credit)}
          </div>
        </div>
        <div className="page-actions">
          <span className="badge">Auto-routed to Finance review</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 18, alignItems: "start" }}>
        <div className="stack gap-4">
          {/* Category chips */}
          <div className="filters" style={{ marginBottom: 0 }}>
            <div className="search" style={{ width: 320 }}>
              <Icon.Search />
              <input placeholder="Search syringes, gloves, IV sets…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {cats.map((c) => (
              <button key={c} className="chip" data-on={cat === c ? "1" : "0"} onClick={() => setCat(c)}>{c}</button>
            ))}
            <span className="dim" style={{ marginLeft: "auto", fontSize: 12 }}>{filtered.length} items</span>
          </div>

          {/* Product grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {filtered.map((p) => {
              const inCart = lines.find((l) => l.sku === p.sku);
              const lowStock = p.stock < 100;
              return (
                <div key={p.sku} className="card" style={{ display: "flex", flexDirection: "column" }}>
                  <div className="ph" style={{ aspectRatio: "16/9", borderRadius: "10px 10px 0 0", border: 0, borderBottom: "1px solid var(--line)" }}>
                    {p.cat === "Accessory" ? "equipment shot" : "product shot"}
                  </div>
                  <div style={{ padding: 12, display: "flex", flexDirection: "column", flex: 1 }}>
                    <div className="row gap-2" style={{ marginBottom: 4 }}>
                      <span className="mono dim" style={{ fontSize: 11 }}>{p.sku}</span>
                      {lowStock && <span className="badge warn" style={{ marginLeft: "auto" }}>Low stock</span>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3, marginBottom: 6, minHeight: 34 }}>
                      {p.name}
                    </div>
                    <div className="dim" style={{ fontSize: 11.5 }}>
                      {p.stock.toLocaleString()} {p.unit} available
                    </div>
                    <div className="row" style={{ marginTop: "auto", paddingTop: 10, justifyContent: "space-between", alignItems: "center" }}>
                      <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>
                        {PESO(p.price)} <span className="dim" style={{ fontSize: 11, fontWeight: 400 }}>/ {p.unit}</span>
                      </div>
                      {inCart ? (
                        <div className="qty">
                          <button onClick={() => setQty(p.sku, inCart.qty - 1)}><Icon.Minus /></button>
                          <input type="number" value={inCart.qty} onChange={(e) => setQty(p.sku, Number(e.target.value))} />
                          <button onClick={() => setQty(p.sku, inCart.qty + 1)}><Icon.Plus /></button>
                        </div>
                      ) : (
                        <button className="btn btn-sm btn-primary" onClick={() => addProduct(p)}>
                          <Icon.Plus /> Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cart sidebar */}
        <div className="stack gap-4" style={{ position: "sticky", top: 76 }}>
          <div className="card">
            <div className="card-head">
              <Icon.Cart />
              <div className="card-h">Your cart</div>
              <span className="dim mono" style={{ marginLeft: "auto", fontSize: 12 }}>{lines.length} item{lines.length === 1 ? "" : "s"}</span>
            </div>
            {lines.length === 0 ? (
              <div className="empty" style={{ padding: "28px 16px" }}>
                <div className="empty-ic"><Icon.Cart /></div>
                Your cart is empty.<br />
                <span style={{ fontSize: 12 }}>Browse the catalog to add items.</span>
              </div>
            ) : (
              <div style={{ maxHeight: 280, overflow: "auto" }}>
                {lines.map((l) => (
                  <div key={l.sku} style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)", display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {l.name}
                      </div>
                      <div className="dim mono" style={{ fontSize: 11 }}>{l.sku} · {PESO(l.price)} ea</div>
                      <div className="row gap-2" style={{ marginTop: 4 }}>
                        <div className="qty" style={{ height: 26 }}>
                          <button onClick={() => setQty(l.sku, l.qty - 1)} style={{ width: 22, height: 26 }}><Icon.Minus /></button>
                          <input type="number" value={l.qty} onChange={(e) => setQty(l.sku, Number(e.target.value))} style={{ width: 36 }} />
                          <button onClick={() => setQty(l.sku, l.qty + 1)} style={{ width: 22, height: 26 }}><Icon.Plus /></button>
                        </div>
                        <button className="btn-ghost btn btn-sm" onClick={() => removeLine(l.sku)} style={{ color: "var(--ink-3)" }}>
                          <Icon.X />
                        </button>
                      </div>
                    </div>
                    <div className="mono" style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap" }}>
                      {PESO(l.qty * l.price)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-head"><div className="card-h">Order details</div></div>
            <div className="card-body" style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="field-label">Need by</label>
                <input className="input" type="date" value={needBy} onChange={(e) => setNeedBy(e.target.value)} />
              </div>
              <div>
                <label className="field-label">Your PO reference</label>
                <input className="input" placeholder="PO-…" value={poRef} onChange={(e) => setPoRef(e.target.value)} />
              </div>
              {showPH && (
                <label className="row gap-2" style={{ fontSize: 12, color: "var(--ink-2)", cursor: "pointer" }}>
                  <input type="checkbox" checked={cwt2307} onChange={(e) => setCwt2307(e.target.checked)} />
                  <span>We will issue BIR Form 2307 (2% CWT)</span>
                </label>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div className="card-h">Totals</div></div>
            <div className="card-body">
              <dl className="dl">
                <dt>Items</dt><dd>{totalUnits.toLocaleString()} units</dd>
                <dt>Subtotal</dt><dd>{PESO(sub)}</dd>
                {showPH && <><dt>VAT (12%)</dt><dd>{PESO(vat)}</dd></>}
                {showPH && cwt2307 && <><dt>Less CWT (2%)</dt><dd>−{PESO(cwt)}</dd></>}
              </dl>
              <div className="divider"></div>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span style={{ fontWeight: 500 }}>Net payable</span>
                <span className="mono" style={{ fontSize: 18, fontWeight: 600 }}>{PESO(total)}</span>
              </div>
              <div className="dim" style={{ fontSize: 11.5, marginTop: 8, textAlign: "right" }}>
                Payment terms: {self.terms}
              </div>
            </div>
            <div style={{ padding: "0 18px 18px" }}>
              <button className="btn btn-accent" style={{ width: "100%", justifyContent: "center", height: 38 }}
                      disabled={!canSubmit}
                      onClick={() => onSubmit({ customerId: self.id, warehouseId: "WH-MNL", needBy, poRef, cwt2307, lines })}>
                <Icon.Check /> Place order
              </button>
              <div className="dim" style={{ fontSize: 11.5, marginTop: 8, textAlign: "center" }}>
                Your order will be reviewed within 4 business hours.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Customer Order Tracking (their own orders only) ────────────────────────
function CustomerOrdersView({ orders, self, onOpen }) {
  const open = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.state));
  const past = orders.filter((o) => ["DELIVERED", "CANCELLED"].includes(o.state));
  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-h1">Your orders</h1>
          <div className="page-sub">{self.name} · {orders.length} total · {open.length} in progress</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={() => onOpen("shop")}><Icon.Plus /> Place new order</button>
        </div>
      </div>

      {orders.length === 0 && (
        <div className="card">
          <div className="empty">
            <div className="empty-ic"><Icon.Order /></div>
            No orders yet. Browse the catalog to place your first order.
          </div>
        </div>
      )}

      {open.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
            In progress
          </div>
          <div className="stack gap-3" style={{ marginBottom: 24 }}>
            {open.map((o) => <CustomerOrderCard key={o.id} order={o} onOpen={onOpen} />)}
          </div>
        </>
      )}

      {past.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
            Past orders
          </div>
          <div className="stack gap-3">
            {past.map((o) => <CustomerOrderCard key={o.id} order={o} onOpen={onOpen} />)}
          </div>
        </>
      )}
    </div>
  );
}

function CustomerOrderCard({ order, onOpen }) {
  const totalUnits = order.lines.reduce((s, l) => s + l.qty, 0);
  const lastEvent = order.timeline[order.timeline.length - 1];
  return (
    <div className="card" style={{ cursor: "pointer" }} onClick={() => onOpen("order", order.id)}>
      <div style={{ padding: 16 }}>
        <div className="row gap-3" style={{ marginBottom: 10 }}>
          <span className="mono" style={{ fontWeight: 500 }}>{order.id}</span>
          <StatePill state={order.state} />
          {order.poRef && <span className="badge">{order.poRef}</span>}
          <span className="dim" style={{ marginLeft: "auto", fontSize: 12 }}>placed {fmtRel(order.createdAt)}</span>
        </div>
        <div style={{ marginBottom: 12 }}>
          <StepBar current={order.state} />
        </div>
        <div className="row gap-6">
          <div className="grow">
            <div style={{ fontSize: 12.5 }}>
              <span className="dim">{order.lines.length} lines · {totalUnits.toLocaleString()} units · </span>
              <span>{order.lines.slice(0, 3).map((l) => l.name.split(",")[0]).join(", ")}{order.lines.length > 3 ? ` +${order.lines.length - 3} more` : ""}</span>
            </div>
            <div className="dim" style={{ fontSize: 11.5, marginTop: 4 }}>
              <Icon.Clock style={{ width: 11, height: 11, verticalAlign: "-1px", marginRight: 4 }} />
              Latest: {(lastEvent && lastEvent.note) || tlLabel(order.state)} · need by {fmtDate(order.needBy)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="dim" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total</div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>{PESO(order.total)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  DashboardView, QueueView, OrderDetailView, ApprovalsView, WarehouseView, NewOrderView,
  CustomerShopView, CustomerOrdersView, CustomerOrderCard, Timeline, LedgerPreview, StepBar,
});
