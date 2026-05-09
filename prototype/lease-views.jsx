// lease-views.jsx — equipment lease + PMS views.

const WO_STYLE = `
  .wpill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 2px 8px; border-radius: 999px;
    font-size: 11.5px; font-weight: 500;
    line-height: 1.5; white-space: nowrap;
  }
  .wpill::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: currentColor; opacity: 0.85; }
  .wpill[data-w="PENDING"]     { background: var(--st-pending-bg); color: var(--st-pending-fg); }
  .wpill[data-w="IN_PROGRESS"] { background: var(--st-prep-bg);    color: var(--st-prep-fg); }
  .wpill[data-w="NEEDS_PARTS"] { background: var(--st-cancel-bg);  color: var(--st-cancel-fg); }
  .wpill[data-w="COMPLETED"]   { background: var(--st-deliv-bg);   color: var(--st-deliv-fg); }
  .wpill.urgent::after { content: "URGENT"; margin-left: 6px; font-size: 9.5px; font-weight: 600; padding: 1px 5px; border-radius: 3px; background: oklch(0.55 0.16 25); color: white; letter-spacing: 0.04em; }

  /* Kiosk board */
  .kiosk { background: oklch(0.10 0.015 250); color: oklch(0.96 0.01 240); min-height: calc(100vh - 56px); margin: -24px -28px -80px; padding: 28px 32px 60px; }
  .kiosk-head { display: flex; align-items: center; gap: 24px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid oklch(0.20 0.015 250); }
  .kiosk-h1 { font-size: 28px; font-weight: 600; letter-spacing: -0.02em; margin: 0; }
  .kiosk-sub { font-size: 13px; color: oklch(0.70 0.012 250); margin-top: 2px; font-feature-settings: "tnum"; }
  .kiosk-clock { margin-left: auto; font-family: var(--font-mono); font-size: 32px; font-weight: 600; letter-spacing: -0.02em; font-feature-settings: "tnum"; }
  .kiosk-live { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; color: oklch(0.85 0.05 155); font-weight: 500; }
  .kiosk-live::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: oklch(0.65 0.18 155); animation: kpulse 1.6s ease-in-out infinite; }
  @keyframes kpulse { 0%, 100% { opacity: 1; box-shadow: 0 0 0 0 oklch(0.65 0.18 155 / 0.5); } 50% { opacity: 0.6; box-shadow: 0 0 0 6px oklch(0.65 0.18 155 / 0); } }

  .kiosk-cols { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .kiosk-col { background: oklch(0.14 0.015 250); border-radius: 12px; padding: 16px; min-height: 240px; }
  .kiosk-col-h { display: flex; align-items: center; gap: 8px; padding-bottom: 14px; border-bottom: 1px solid oklch(0.22 0.015 250); margin-bottom: 12px; }
  .kiosk-col-h b { font-size: 14px; font-weight: 600; }
  .kiosk-col-h .kc-count { margin-left: auto; font-family: var(--font-mono); font-size: 14px; font-weight: 600; padding: 2px 10px; border-radius: 999px; background: oklch(0.20 0.015 250); }
  .kiosk-col[data-status="NEEDS_PARTS"] { background: oklch(0.18 0.04 25); }
  .kiosk-col[data-status="NEEDS_PARTS"] .kc-count { background: oklch(0.30 0.10 25); color: oklch(0.95 0.05 25); }
  .kiosk-col[data-status="IN_PROGRESS"] .kc-count { background: oklch(0.30 0.08 65); color: oklch(0.95 0.05 65); }
  .kiosk-col[data-status="COMPLETED"] .kc-count { background: oklch(0.30 0.08 155); color: oklch(0.95 0.05 155); }

  .kiosk-card { background: oklch(0.18 0.015 250); border-radius: 10px; padding: 14px; margin-bottom: 10px; border: 1px solid oklch(0.22 0.015 250); }
  .kiosk-card.urgent { border-color: oklch(0.50 0.16 25); }
  .kiosk-card-h { display: flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 13px; font-weight: 600; margin-bottom: 6px; color: oklch(0.95 0.01 240); }
  .kiosk-card-h .badge-u { margin-left: auto; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; background: oklch(0.55 0.16 25); color: white; letter-spacing: 0.05em; }
  .kiosk-card-t { font-size: 16px; font-weight: 500; line-height: 1.3; margin-bottom: 6px; }
  .kiosk-card-m { font-size: 12.5px; color: oklch(0.70 0.012 250); font-feature-settings: "tnum"; }
  .kiosk-card-tech { display: flex; align-items: center; gap: 6px; margin-top: 10px; padding-top: 10px; border-top: 1px solid oklch(0.22 0.015 250); font-size: 12px; color: oklch(0.85 0.012 240); }
  .kiosk-card-tech i { width: 22px; height: 22px; border-radius: 50%; background: oklch(0.50 0.08 195); color: white; display: grid; place-items: center; font-style: normal; font-family: var(--font-mono); font-size: 9.5px; font-weight: 600; }
  .kiosk-empty { text-align: center; color: oklch(0.50 0.012 250); font-size: 13px; padding: 20px 8px; }
`;

function _mountWoStyle() {
  if (typeof document === "undefined") return null;
  if (!document.getElementById("__wo_style")) {
    const s = document.createElement("style");
    s.id = "__wo_style";
    s.textContent = WO_STYLE;
    document.head.appendChild(s);
  }
  return null;
}

function WoPill({ status, urgent }) {
  return <span className={"wpill" + (urgent ? " urgent" : "")} data-w={status}>{WO_LABEL[status]}</span>;
}

// ─── Leases list ────────────────────────────────────────────────────────────
function LeasesView({ leases, workOrders, onOpen }) {
  _mountWoStyle();
  const today = "2026-05-09";
  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-h1">Equipment leases</h1>
          <div className="page-sub">{leases.length} active contracts · {workOrders.filter((w) => w.status !== "COMPLETED").length} open work orders across the fleet</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-sm"><Icon.Down /> Export contracts</button>
          <button className="btn btn-primary btn-sm"><Icon.Plus /> New lease</button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Contract</th>
              <th>Customer</th>
              <th className="num">Assets</th>
              <th>Term</th>
              <th>PM cycle</th>
              <th className="num">Monthly</th>
              <th>Next PM</th>
              <th className="num">Open WOs</th>
            </tr>
          </thead>
          <tbody>
            {leases.map((l) => {
              const c = customerById(l.customerId);
              const wos = workOrders.filter((w) => w.leaseId === l.id);
              const nextWo = wos.filter((w) => w.status !== "COMPLETED")
                .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor))[0];
              const open = wos.filter((w) => w.status !== "COMPLETED").length;
              const start = new Date(l.startDate);
              const end = new Date(start);
              end.setMonth(end.getMonth() + l.termMonths);
              return (
                <tr key={l.id} onClick={() => onOpen("lease", l.id)}>
                  <td className="id">
                    <div style={{ fontWeight: 500, color: "var(--ink)" }}>{l.id}</div>
                    <div className="dim" style={{ fontSize: 11 }}>{l.contractRef}</div>
                  </td>
                  <td>{c.name}</td>
                  <td className="num">{l.assetIds.length}</td>
                  <td className="dim">
                    {l.termMonths}mo
                    <span className="dim-2" style={{ fontSize: 11 }}> · ends {end.toLocaleDateString("en-PH", { month: "short", year: "numeric" })}</span>
                  </td>
                  <td>Every {l.maintenanceMonths} mo</td>
                  <td className="num">{PESO(l.monthlyFee)}</td>
                  <td>
                    {nextWo ? (
                      <span style={nextWo.scheduledFor <= today ? { color: "oklch(0.50 0.14 25)", fontWeight: 500 } : {}}>
                        {fmtDate(nextWo.scheduledFor)}
                      </span>
                    ) : <span className="dim-2">—</span>}
                  </td>
                  <td className="num">
                    {open > 0 ? <span className="badge warn">{open}</span> : <span className="dim-2">0</span>}
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

// ─── Lease detail ───────────────────────────────────────────────────────────
function LeaseDetailView({ lease, workOrders, onClose, onOpenWo }) {
  _mountWoStyle();
  const c = customerById(lease.customerId);
  const wos = workOrders.filter((w) => w.leaseId === lease.id);
  const past = wos.filter((w) => w.status === "COMPLETED").sort((a, b) => new Date(b.scheduledFor) - new Date(a.scheduledFor));
  const upcoming = wos.filter((w) => w.status !== "COMPLETED").sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
  const start = new Date(lease.startDate);
  const end = new Date(start); end.setMonth(end.getMonth() + lease.termMonths);
  const monthsElapsed = Math.max(0, Math.floor((new Date("2026-05-09") - start) / (1000 * 60 * 60 * 24 * 30)));
  const totalCycles = Math.floor(lease.termMonths / lease.maintenanceMonths) * lease.assetIds.length;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="row gap-2 dim" style={{ fontSize: 12, marginBottom: 4 }}>
            <button className="btn-ghost btn btn-sm" onClick={onClose} style={{ padding: "0 6px", height: 22 }}>← Equipment leases</button>
          </div>
          <div className="row gap-3">
            <h1 className="page-h1 mono">{lease.id}</h1>
            <span className="badge ok">Active</span>
            <span className="badge">{lease.contractRef}</span>
          </div>
          <div className="page-sub">
            {c.name} · {lease.assetIds.length} asset{lease.assetIds.length === 1 ? "" : "s"} · {lease.termMonths}-month term · PM every {lease.maintenanceMonths} mo
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-sm"><Icon.Print /> Print contract</button>
          <button className="btn btn-sm"><Icon.Down /> Service history</button>
        </div>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Stat label="Monthly fee" value={SHORT_PESO(lease.monthlyFee)} trend={`Recognized ${monthsElapsed} of ${lease.termMonths} mo`} />
        <Stat label="Total contract value" value={SHORT_PESO(lease.monthlyFee * lease.termMonths)} trend={`${Math.round(monthsElapsed / lease.termMonths * 100)}% of term elapsed`} />
        <Stat label="PM work orders" value={`${past.length} / ${totalCycles}`} trend="completed / scheduled" />
        <Stat label="Open work orders" value={upcoming.length} trend={upcoming.length === 0 ? "All caught up" : "Scheduled"} dn={upcoming.some((w) => w.status === "NEEDS_PARTS")} />
      </div>

      <div className="detail-grid">
        <div className="stack gap-4">
          {/* PMS schedule */}
          <div className="card">
            <div className="card-head">
              <div className="card-h">PMS schedule</div>
              <span className="dim" style={{ marginLeft: 8, fontSize: 12 }}>
                Auto-generated from {lease.maintenanceMonths}-month cycle · {totalCycles} work orders over contract term
              </span>
            </div>

            {upcoming.length > 0 && (
              <>
                <div style={{ padding: "10px 18px 4px", fontSize: 11, fontWeight: 500, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Upcoming · {upcoming.length}
                </div>
                <table className="tbl">
                  <thead><tr><th>WO</th><th>Asset</th><th>Scheduled</th><th>Status</th><th>Technician</th></tr></thead>
                  <tbody>
                    {upcoming.map((w) => (
                      <tr key={w.id} onClick={() => onOpenWo(w.id)}>
                        <td className="id">{w.id}</td>
                        <td>
                          <div>{assetById(w.assetId).model}</div>
                          <div className="dim mono" style={{ fontSize: 11 }}>SN {assetById(w.assetId).serial}</div>
                        </td>
                        <td>{fmtDate(w.scheduledFor)}</td>
                        <td><WoPill status={w.status} urgent={w.priority === "URGENT"} /></td>
                        <td className="dim">{w.technicianId ? technicianById(w.technicianId).name : <span className="dim-2">Unclaimed</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {past.length > 0 && (
              <>
                <div style={{ padding: "16px 18px 4px", fontSize: 11, fontWeight: 500, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Service history · {past.length}
                </div>
                <table className="tbl">
                  <thead><tr><th>WO</th><th>Asset</th><th>Completed</th><th>Technician</th><th>Notes</th></tr></thead>
                  <tbody>
                    {past.slice(0, 6).map((w) => (
                      <tr key={w.id} onClick={() => onOpenWo(w.id)}>
                        <td className="id">{w.id}</td>
                        <td className="dim">{assetById(w.assetId).serial}</td>
                        <td>{fmtDate(w.scheduledFor)}</td>
                        <td className="dim">{w.technicianId ? technicianById(w.technicianId).name : "—"}</td>
                        <td className="dim" style={{ fontSize: 12, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {(w.techNotes[w.techNotes.length - 1] || {}).text || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>

        <div className="stack gap-4">
          <div className="card">
            <div className="card-head"><div className="card-h">Customer</div></div>
            <div className="card-body">
              <div style={{ fontWeight: 500, marginBottom: 2 }}>{c.name}</div>
              <div className="dim" style={{ fontSize: 12.5, marginBottom: 12 }}>{c.contact}</div>
              <dl className="dl">
                <dt>Region</dt><dd>{c.region} — {c.city}</dd>
                <dt>Terms</dt><dd>{c.terms}</dd>
              </dl>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><div className="card-h">Contract</div></div>
            <div className="card-body">
              <dl className="dl">
                <dt>Start</dt><dd>{fmtDate(lease.startDate)}</dd>
                <dt>End</dt><dd>{end.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</dd>
                <dt>Term</dt><dd>{lease.termMonths} months</dd>
                <dt>PM cycle</dt><dd>Every {lease.maintenanceMonths} months</dd>
                <dt>Monthly fee</dt><dd>{PESO(lease.monthlyFee)}</dd>
              </dl>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><div className="card-h">Assets covered</div></div>
            <div style={{ padding: "10px 0" }}>
              {lease.assetIds.map((id) => {
                const a = assetById(id);
                return (
                  <div key={id} style={{ padding: "8px 18px", borderBottom: "1px solid var(--line)" }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{a.model}</div>
                    <div className="dim mono" style={{ fontSize: 11 }}>{a.id} · SN {a.serial}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── PMS Kiosk Board (auto-refresh) ─────────────────────────────────────────
function PmsBoardView({ workOrders, refreshKey }) {
  _mountWoStyle();
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Only show today + currently active across statuses
  const active = workOrders.filter((w) =>
    w.status !== "COMPLETED" || w.scheduledFor === "2026-05-09"
  ).sort((a, b) => (b.priority === "URGENT") - (a.priority === "URGENT") || new Date(a.scheduledFor) - new Date(b.scheduledFor));

  const cols = [
    { status: "PENDING",     label: "Pending" },
    { status: "IN_PROGRESS", label: "In progress" },
    { status: "NEEDS_PARTS", label: "Needs parts" },
    { status: "COMPLETED",   label: "Completed today" },
  ];
  const byStatus = (s) => active.filter((w) => w.status === s);

  return (
    <div className="kiosk">
      <div className="kiosk-head">
        <div>
          <h1 className="kiosk-h1">PMS Operations Board</h1>
          <div className="kiosk-sub">
            <span className="kiosk-live">Live · auto-refresh every 30s</span>
            <span style={{ marginLeft: 14 }}>{active.length} work orders today · {byStatus("NEEDS_PARTS").length} needing parts</span>
          </div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div className="kiosk-clock">{now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: false })}</div>
          <div className="kiosk-sub">{now.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</div>
        </div>
      </div>

      <div className="kiosk-cols">
        {cols.map((col) => {
          const wos = byStatus(col.status);
          return (
            <div key={col.status} className="kiosk-col" data-status={col.status}>
              <div className="kiosk-col-h">
                <b>{col.label}</b>
                <span className="kc-count">{wos.length}</span>
              </div>
              {wos.length === 0 && <div className="kiosk-empty">—</div>}
              {wos.map((w) => {
                const a = assetById(w.assetId);
                const c = customerById(w.customerId);
                const tech = w.technicianId ? technicianById(w.technicianId) : null;
                return (
                  <div key={w.id} className={"kiosk-card" + (w.priority === "URGENT" ? " urgent" : "")}>
                    <div className="kiosk-card-h">
                      <span>{w.id}</span>
                      {w.priority === "URGENT" && <span className="badge-u">URGENT</span>}
                    </div>
                    <div className="kiosk-card-t">{a.model.split(" ").slice(0, 3).join(" ")}</div>
                    <div className="kiosk-card-m">
                      {c.name.split("—")[0].trim()} · SN {a.serial}
                    </div>
                    <div className="kiosk-card-m" style={{ marginTop: 4 }}>
                      Scheduled {fmtDate(w.scheduledFor)}
                      {w.completedAt && " · done " + new Date(w.completedAt).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: false })}
                    </div>
                    <div className="kiosk-card-tech">
                      {tech ? (
                        <>
                          <i>{tech.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</i>
                          {tech.name}
                        </>
                      ) : (
                        <span style={{ color: "oklch(0.55 0.012 250)" }}>Unclaimed</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Technician View ────────────────────────────────────────────────────────
function TechnicianView({ workOrders, technicianId, onUpdate, onClaim }) {
  _mountWoStyle();
  const me = technicianById(technicianId);
  const [openWoId, setOpenWoId] = React.useState(null);

  const myWos = workOrders.filter((w) => w.technicianId === technicianId && w.status !== "COMPLETED")
    .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
  const unclaimed = workOrders.filter((w) => !w.technicianId && w.status === "PENDING")
    .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
  const doneToday = workOrders.filter((w) => w.technicianId === technicianId && w.status === "COMPLETED" && (w.completedAt || "").startsWith("2026-05-09"));

  const openWo = openWoId ? workOrders.find((w) => w.id === openWoId) : null;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-h1">Field tasks</h1>
          <div className="page-sub">{me.name} · {myWos.length} active · {doneToday.length} completed today · {unclaimed.length} unclaimed nearby</div>
        </div>
      </div>

      <div className="stack gap-4">
        {/* My active */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
            My active tasks
          </div>
          {myWos.length === 0 ? (
            <div className="card"><div className="empty"><div className="empty-ic"><Icon.Check /></div>No active tasks. Check unclaimed below.</div></div>
          ) : (
            <div className="stack gap-3">
              {myWos.map((w) => <TechWoCard key={w.id} wo={w} onOpen={() => setOpenWoId(w.id)} />)}
            </div>
          )}
        </div>

        {/* Unclaimed */}
        {unclaimed.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
              Unclaimed · pick one up
            </div>
            <div className="stack gap-3">
              {unclaimed.slice(0, 5).map((w) => (
                <TechWoCard key={w.id} wo={w} onOpen={() => setOpenWoId(w.id)}
                  action={
                    <button className="btn btn-sm btn-accent" onClick={(e) => { e.stopPropagation(); onClaim(w.id); }}>
                      <Icon.Plus /> Claim task
                    </button>
                  } />
              ))}
            </div>
          </div>
        )}

        {/* Done today */}
        {doneToday.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
              Completed today
            </div>
            <div className="stack gap-3">
              {doneToday.map((w) => <TechWoCard key={w.id} wo={w} onOpen={() => setOpenWoId(w.id)} />)}
            </div>
          </div>
        )}
      </div>

      {openWo && (
        <WoModal wo={openWo}
          onClose={() => setOpenWoId(null)}
          onSubmit={(updates) => { onUpdate(openWo.id, updates); setOpenWoId(null); }} />
      )}
    </div>
  );
}

function TechWoCard({ wo, onOpen, action }) {
  const a = assetById(wo.assetId);
  const c = customerById(wo.customerId);
  const last = wo.techNotes[wo.techNotes.length - 1];
  return (
    <div className="card" style={{ cursor: "pointer" }} onClick={onOpen}>
      <div style={{ padding: 14 }}>
        <div className="row gap-3" style={{ marginBottom: 8 }}>
          <span className="mono" style={{ fontWeight: 500 }}>{wo.id}</span>
          <WoPill status={wo.status} urgent={wo.priority === "URGENT"} />
          <span className="dim" style={{ marginLeft: "auto", fontSize: 12 }}>scheduled {fmtDate(wo.scheduledFor)}</span>
        </div>
        <div className="row gap-3" style={{ alignItems: "flex-start" }}>
          <div className="grow">
            <div style={{ fontSize: 14, fontWeight: 500 }}>{a.model}</div>
            <div className="dim" style={{ fontSize: 12.5, marginTop: 2 }}>{c.name} · SN {a.serial}</div>
            <div style={{ fontSize: 12.5, marginTop: 8, color: "var(--ink-2)" }}>{wo.taskDetails}</div>
            {last && (
              <div className="dim" style={{ fontSize: 11.5, marginTop: 8, padding: "8px 10px", background: "var(--bg-2)", borderRadius: 6, fontStyle: "italic" }}>
                "{last.text}" — {last.by}
              </div>
            )}
          </div>
          {action || <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); onOpen(); }}>Update <Icon.Chevron /></button>}
        </div>
      </div>
    </div>
  );
}

// Status update modal — technician's primary action surface
function WoModal({ wo, onClose, onSubmit }) {
  const a = assetById(wo.assetId);
  const c = customerById(wo.customerId);
  const [status, setStatus] = React.useState(wo.status);
  const [note, setNote] = React.useState("");
  const next = WO_NEXT[wo.status] || [];
  const allStatuses = [wo.status, ...next];

  const submit = () => {
    onSubmit({ status, note: note.trim() });
  };

  return (
    <>
      <div className="scrim" onClick={onClose}></div>
      <div className="modal" style={{ width: 540 }}>
        <div style={{ padding: 18, borderBottom: "1px solid var(--line)" }}>
          <div className="row gap-3" style={{ marginBottom: 4 }}>
            <span className="mono" style={{ fontWeight: 500 }}>{wo.id}</span>
            <WoPill status={wo.status} urgent={wo.priority === "URGENT"} />
            <button className="icon-btn" style={{ marginLeft: "auto" }} onClick={onClose}><Icon.X /></button>
          </div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>{a.model}</div>
          <div className="dim" style={{ fontSize: 12.5 }}>{c.name} · SN {a.serial} · scheduled {fmtDate(wo.scheduledFor)}</div>
        </div>
        <div style={{ padding: 18 }}>
          <div style={{ marginBottom: 12 }}>
            <label className="field-label">Task details</label>
            <div style={{ fontSize: 12.5, color: "var(--ink-2)", padding: "10px 12px", background: "var(--bg-2)", borderRadius: 7, lineHeight: 1.5 }}>
              {wo.taskDetails}
            </div>
          </div>

          {wo.techNotes.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Activity</label>
              <div style={{ maxHeight: 120, overflow: "auto", fontSize: 12.5 }}>
                {wo.techNotes.map((n, i) => (
                  <div key={i} style={{ padding: "8px 10px", borderBottom: "1px dashed var(--line)" }}>
                    <div className="dim" style={{ fontSize: 11, marginBottom: 2 }}>{n.by} · {fmtDateTime(n.at)}</div>
                    <div>{n.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label className="field-label">Update status</label>
            <div className="row gap-2" style={{ flexWrap: "wrap" }}>
              {allStatuses.map((s) => (
                <button key={s} type="button"
                  className="chip"
                  data-on={status === s ? "1" : "0"}
                  onClick={() => setStatus(s)}>
                  {WO_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="field-label">Add note</label>
            <textarea className="input" rows="3" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder={status === "NEEDS_PARTS" ? "Which part is needed? PN, source, ETA…" :
                           status === "COMPLETED" ? "What did you do? Anything to flag?" :
                           "Field observation, current step, blocker…"}/>
          </div>
        </div>
        <div style={{ padding: 14, borderTop: "1px solid var(--line)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-sm btn-accent" onClick={submit}
            disabled={status === wo.status && !note.trim()}>
            <Icon.Check /> Save update
          </button>
        </div>
      </div>
    </>
  );
}

Object.assign(window, {
  WoPill, LeasesView, LeaseDetailView, PmsBoardView, TechnicianView, TechWoCard, WoModal,
});
