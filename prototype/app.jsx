// app.jsx — main app shell + state + tweaks panel.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "role": "AGENT",
  "density": "regular",
  "showPH": true,
  "demoState": "PENDING"
}/*EDITMODE-END*/;

const ROLE_META = {
  CUSTOMER:   { initials: "JD", name: "Janine Domingo",   sub: "Procurement — St. Luke's QC", customerId: "C-1042" },
  AGENT:      { initials: "MS", name: "Maria Santillan",  sub: "Field Agent" },
  FINANCE:    { initials: "FV", name: "Felicidad Villanueva", sub: "Finance Lead" },
  WAREHOUSE:  { initials: "EC", name: "Eduardo Castillo", sub: "Warehouse — MNL" },
  TECHNICIAN: { initials: "RM", name: "Renato Magbanua",  sub: "Field Technician — NCR", technicianId: "T-01" },
  ADMIN:      { initials: "AD", name: "Alyssa De Leon",   sub: "Operations Admin" },
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [orders, setOrders] = React.useState(ORDERS);
  const [workOrders, setWorkOrders] = React.useState(WORK_ORDERS);
  const [view, setView] = React.useState({ name: "queue" });
  const toast = useToast();

  const role = t.role;
  const showPH = t.showPH;

  // role-aware default landing — when role changes, snap to a sensible page
  const lastRole = React.useRef(role);
  React.useEffect(() => {
    if (lastRole.current === role) return;
    lastRole.current = role;
    if (role === "CUSTOMER") setView({ name: "my-orders" });
    else if (role === "FINANCE") setView({ name: "approvals" });
    else if (role === "WAREHOUSE") setView({ name: "warehouse" });
    else if (role === "AGENT") setView({ name: "queue" });
    else if (role === "TECHNICIAN") setView({ name: "my-tasks" });
    else setView({ name: "dashboard" });
  }, [role]);

  // demo state jumper — move the latest pending order through the FSM live
  React.useEffect(() => {
    if (!t.demoState) return;
    setOrders((prev) => {
      const idx = prev.findIndex((o) => o.id === "SO-2026-0418");
      if (idx === -1) return prev;
      const cur = prev[idx];
      if (cur.state === t.demoState) return prev;
      const next = { ...cur, state: t.demoState };
      // walk timeline forward synthetically
      const order = ["PENDING", "APPROVED", "PREPARING", "SHIPPED", "DELIVERED"];
      const targetIdx = order.indexOf(t.demoState);
      const events = [{ state: "CREATED", at: cur.timeline[0].at, by: "Maria Santillan (A-07)", note: "Order placed via field tablet" }];
      const baseTime = new Date(cur.timeline[0].at).getTime();
      for (let i = 1; i <= targetIdx; i++) {
        const s = order[i];
        const at = new Date(baseTime + i * 30 * 60 * 1000).toISOString();
        events.push({
          state: s,
          at,
          by: s === "APPROVED" ? "F. Villanueva (Finance)" :
              s === "PREPARING" ? "WH-MNL Picker 02" :
              s === "SHIPPED" ? "WH-MNL Dispatch · WB DEMO-XXX" :
              s === "DELIVERED" ? "Customer receiving bay" : undefined,
          note: s === "APPROVED" ? "Within credit limit. Approved." : undefined,
        });
      }
      next.timeline = events;
      if (t.demoState === "PREPARING") next.pickProgress = 0.4;
      const out = [...prev];
      out[idx] = next;
      return out;
    });
  }, [t.demoState]);

  // transition logic
  const transitionOrder = (orderId, nextState, note) => {
    setOrders((prev) => prev.map((o) => {
      if (o.id !== orderId) return o;
      const event = {
        state: nextState,
        at: new Date().toISOString(),
        by: ROLE_META[role].name + " (" + role + ")",
        note,
      };
      const updated = { ...o, state: nextState, timeline: [...o.timeline, event] };
      if (nextState === "PREPARING") updated.pickProgress = 0.05;
      if (nextState === "SHIPPED") updated.waybill = "DEMO-WB-" + Math.floor(Math.random() * 90000 + 10000);
      return updated;
    }));
    if (orderId === "SO-2026-0418") setTweak("demoState", nextState);
    toast(`${orderId} → ${STATE_LABEL[nextState]}`);
  };

  const cancelOrder = (orderId) => {
    setOrders((prev) => prev.map((o) =>
      o.id === orderId ? {
        ...o, state: "CANCELLED",
        timeline: [...o.timeline, { state: "CANCELLED", at: new Date().toISOString(), by: ROLE_META[role].name }]
      } : o
    ));
    toast(`${orderId} cancelled`);
    setView({ name: "queue" });
  };

  const submitNewOrder = (draft) => {
    const id = "SO-2026-04" + (19 + (orders.length - ORDERS.length)).toString().padStart(2, "0");
    const subtotal = orderSub(draft.lines);
    const vat = vatOf(subtotal);
    const cwt = cwtOf(subtotal, 0.02, draft.cwt2307);
    const newOrder = {
      id,
      ...draft,
      agentId: role === "AGENT" ? "A-07" : "A-07",
      state: "PENDING",
      createdAt: new Date().toISOString(),
      subtotal, vat, cwt, total: subtotal + vat - cwt,
      timeline: [{ state: "CREATED", at: new Date().toISOString(), by: ROLE_META[role].name + " (" + role + ")", note: "New order submitted" }],
    };
    setOrders((prev) => [newOrder, ...prev]);
    toast(`${id} submitted for approval`);
    setView({ name: "order", id });
  };

  // Work order handlers (PMS module)
  const updateWorkOrder = (woId, { status, note }) => {
    setWorkOrders((prev) => prev.map((w) => {
      if (w.id !== woId) return w;
      const out = { ...w };
      const at = new Date().toISOString();
      if (status && status !== w.status) out.status = status;
      if (note) out.techNotes = [...w.techNotes, { by: ROLE_META[role].name, at, text: note }];
      if (status === "COMPLETED") out.completedAt = at;
      return out;
    }));
    toast(`${woId} updated · ${WO_LABEL[status] || "note added"}`);
  };
  const claimWorkOrder = (woId) => {
    const techId = ROLE_META[role].technicianId || "T-01";
    setWorkOrders((prev) => prev.map((w) => w.id === woId ? {
      ...w, technicianId: techId,
      techNotes: [...w.techNotes, { by: ROLE_META[role].name, at: new Date().toISOString(), text: "Task claimed." }]
    } : w));
    toast(`${woId} claimed`);
  };

  // Customer-facing data scoping
  const customerSelf = role === "CUSTOMER" ? customerById(ROLE_META.CUSTOMER.customerId) : null;
  const myOrders = customerSelf ? orders.filter((o) => o.customerId === customerSelf.id) : orders;

  // Sidebar nav definition
  const navItems = role === "CUSTOMER" ? [
    { id: "shop", label: "Shop catalog", icon: <Icon.Pkg /> },
    { id: "my-orders", label: "Your orders", icon: <Icon.Order />, count: myOrders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.state)).length },
    { id: "my-history", label: "Order history", icon: <Icon.Clock /> },
  ] : role === "TECHNICIAN" ? [
    { id: "my-tasks", label: "My field tasks", icon: <Icon.Wrench />, count: workOrders.filter((w) => w.technicianId === ROLE_META.TECHNICIAN.technicianId && w.status !== "COMPLETED").length },
    { id: "pms-board", label: "PMS board", icon: <Icon.Monitor /> },
  ] : [
    { id: "dashboard", label: "Dashboard", icon: <Icon.Chart />, roles: ["ADMIN", "FINANCE"] },
    { id: "queue", label: "Sales orders", icon: <Icon.Order />, count: orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.state)).length },
    { id: "approvals", label: "Approvals", icon: <Icon.Inbox />, count: orders.filter((o) => o.state === "PENDING").length, roles: ["FINANCE", "ADMIN", "AGENT"] },
    { id: "warehouse", label: "Pick & pack", icon: <Icon.Box />, count: orders.filter((o) => ["APPROVED", "PREPARING"].includes(o.state)).length, roles: ["WAREHOUSE", "ADMIN"] },
    { id: "shipments", label: "Shipments", icon: <Icon.Truck />, count: orders.filter((o) => o.state === "SHIPPED").length, roles: ["WAREHOUSE", "ADMIN", "FINANCE"] },
    { id: "inventory", label: "Inventory", icon: <Icon.Box />, roles: ["WAREHOUSE", "ADMIN", "FINANCE"] },
    { id: "customers", label: "Customers", icon: <Icon.Users /> },
    { id: "catalog", label: "Catalog", icon: <Icon.Pkg /> },
    { id: "suppliers", label: "Suppliers", icon: <Icon.Truck />, roles: ["ADMIN", "FINANCE", "WAREHOUSE"] },
    { id: "leases", label: "Equipment leases", icon: <Icon.Wrench />, count: workOrders.filter((w) => w.status !== "COMPLETED" && w.scheduledFor <= "2026-05-09").length, roles: ["ADMIN", "AGENT", "FINANCE"] },
    { id: "pms-board", label: "PMS kiosk board", icon: <Icon.Monitor />, roles: ["ADMIN", "WAREHOUSE"] },
    { id: "ledger", label: "Ledger", icon: <Icon.Wallet />, roles: ["FINANCE", "ADMIN"] },
  ].filter((it) => !it.roles || it.roles.includes(role));

  const renderView = () => {
    if (role === "CUSTOMER") {
      if (view.name === "shop") return <CustomerShopView self={customerSelf} showPH={showPH}
        onClose={() => setView({ name: "my-orders" })}
        onSubmit={submitNewOrder} />;
      if (view.name === "my-orders" || view.name === "queue") return <CustomerOrdersListView orders={myOrders} self={customerSelf}
        onOpen={(name, id) => setView(id ? { name, id } : { name })} />;
      if (view.name === "my-history") return <CustomerOrdersListView orders={myOrders} self={customerSelf} presetTab="DELIVERED"
        onOpen={(name, id) => setView(id ? { name, id } : { name })} />;
      if (view.name === "order") {
        const o = myOrders.find((x) => x.id === view.id);
        if (!o) return <div className="empty">Order not found.</div>;
        return <OrderDetailView order={o} role={role} showPH={showPH}
          onClose={() => setView({ name: "my-orders" })}
          onTransition={() => {}} onCancel={() => cancelOrder(o.id)} />;
      }
      return <CustomerOrdersListView orders={myOrders} self={customerSelf}
        onOpen={(name, id) => setView(id ? { name, id } : { name })} />;
    }
    if (view.name === "dashboard") return <DashboardView orders={orders} role={role}
      onOpen={(name, id) => setView(id ? { name, id } : { name })} />;
    if (view.name === "queue") return <QueueView orders={orders} role={role}
      onOpen={(name, id) => setView(id ? { name, id } : { name })} />;
    if (view.name === "approvals") return <ApprovalsView orders={orders} role={role}
      onOpen={(name, id) => setView({ name, id })}
      onTransition={(id, st) => transitionOrder(id, st, "Approved via approvals inbox")} />;
    if (view.name === "warehouse") return <WarehouseView orders={orders} role={role}
      onOpen={(name, id) => setView({ name, id })}
      onTransition={(id, st) => transitionOrder(id, st)} />;
    if (view.name === "shipments") return <ShipmentsView orders={orders} role={role}
      onOpen={(name, id) => setView({ name, id })}
      onTransition={(id, st, note) => transitionOrder(id, st, note)} />;
    if (view.name === "inventory") return <InventoryView orders={orders} />;
    if (view.name === "catalog") return <CatalogAdminView onOpen={(name, id) => setView({ name, id })} />;
    if (view.name === "customers") return <CustomersAdminView orders={orders} />;
    if (view.name === "suppliers") return <SuppliersAdminView />;
    if (view.name === "leases") return <LeasesView leases={LEASES} workOrders={workOrders}
      onOpen={(name, id) => setView({ name, id })} />;
    if (view.name === "lease") {
      const l = LEASES.find((x) => x.id === view.id);
      if (!l) return <div className="empty">Lease not found.</div>;
      return <LeaseDetailView lease={l} workOrders={workOrders}
        onClose={() => setView({ name: "leases" })}
        onOpenWo={() => setView({ name: "my-tasks" })} />;
    }
    if (view.name === "pms-board") return <PmsBoardView workOrders={workOrders} />;
    if (view.name === "my-tasks") return <TechnicianView workOrders={workOrders}
      technicianId={ROLE_META.TECHNICIAN.technicianId}
      onUpdate={updateWorkOrder} onClaim={claimWorkOrder} />;
    if (view.name === "new") return <NewOrderView showPH={showPH}
      onClose={() => setView({ name: "queue" })}
      onSubmit={submitNewOrder} />;
    if (view.name === "order") {
      const o = orders.find((x) => x.id === view.id);
      if (!o) return <div className="empty">Order not found.</div>;
      return <OrderDetailView order={o} role={role} showPH={showPH}
        onClose={() => setView({ name: "queue" })}
        onTransition={(st) => transitionOrder(o.id, st)}
        onCancel={() => cancelOrder(o.id)} />;
    }
    // Fallback / "soon" pages
    return <SoonView name={view.name} />;
  };

  // Breadcrumbs
  const crumbs = (() => {
    const map = { dashboard: "Dashboard", queue: "Sales orders", approvals: "Approvals", warehouse: "Pick & pack", new: "New order", order: "Sales orders", shipments: "Shipments", inventory: "Inventory", customers: "Customers", catalog: "Catalog", suppliers: "Suppliers", ledger: "Ledger", leases: "Equipment leases", lease: "Equipment leases", "pms-board": "PMS kiosk board", "my-tasks": "My field tasks", "my-orders": "Your orders", "my-history": "Order history", shop: "Shop catalog" };
    const parts = [{ l: "Operations" }];
    parts.push({ l: map[view.name] || view.name });
    if (view.name === "order" && view.id) parts.push({ l: view.id, mono: true });
    if (view.name === "new") parts.push({ l: "New" });
    return parts;
  })();

  const meta = ROLE_META[role];

  return (
    <div className="app" data-density={t.density}>
      <aside className="sb">
        <div className="sb-brand">
          <div className="sb-mark">VS</div>
          <div>
            <div className="sb-title">Vital Sign</div>
            <div className="sb-org">Hospital Supplies · PH</div>
          </div>
        </div>

        <div className="sb-section">Operate</div>
        {navItems.map((it) => (
          <button key={it.id} className="sb-link"
                  data-active={view.name === it.id ? "1" : "0"}
                  onClick={() => setView({ name: it.id })}>
            {it.icon}
            <span>{it.label}</span>
            {it.count != null && it.count > 0 && <span className="sb-count">{it.count}</span>}
          </button>
        ))}

        <div className="sb-section">Quick</div>
        <button className="sb-link" onClick={() => setView({ name: "new" })}>
          <Icon.Plus /><span>New order</span>
          <span className="sb-count" style={{ background: "var(--ink)", color: "var(--bg)" }}>⌘N</span>
        </button>

        <div className="sb-foot">
          <Avatar name={meta.name} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{meta.name}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{meta.sub}</div>
          </div>
          <button className="icon-btn" style={{ width: 24, height: 24 }}><Icon.Bell /></button>
        </div>
      </aside>

      <main>
        <div className="topbar">
          <div className="crumbs">
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Icon.Chevron />}
                <span className={i === crumbs.length - 1 ? "" : ""} style={{
                  color: i === crumbs.length - 1 ? "var(--ink)" : undefined,
                  fontWeight: i === crumbs.length - 1 ? 500 : 400,
                  fontFamily: c.mono ? "var(--font-mono)" : undefined,
                }}>{c.l}</span>
              </React.Fragment>
            ))}
          </div>
          <div className="search">
            <Icon.Search />
            <input placeholder="Search orders, customers, SKUs…" />
            <kbd>⌘K</kbd>
          </div>
          <button className="icon-btn"><Icon.Bell /></button>
          <div className="role-chip">
            <i>{meta.initials}</i>
            <span>{role}</span>
            <span>·</span>
            <span>{meta.sub}</span>
          </div>
        </div>

        <div className="page">
          {renderView()}
        </div>
      </main>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Role">
          <TweakSelect label="Active role" value={t.role}
            options={[
              { value: "CUSTOMER", label: "Customer — hospital procurement" },
              { value: "AGENT", label: "Agent — places orders" },
              { value: "FINANCE", label: "Finance — approves orders" },
              { value: "WAREHOUSE", label: "Warehouse — pick & pack" },
              { value: "TECHNICIAN", label: "Technician — PMS field tasks" },
              { value: "ADMIN", label: "Admin — full access" },
            ]}
            onChange={(v) => setTweak("role", v)} />
        </TweakSection>
        <TweakSection label="Layout">
          <TweakRadio label="Density" value={t.density}
            options={["compact", "regular", "comfy"]}
            onChange={(v) => setTweak("density", v)} />
        </TweakSection>
        <TweakSection label="Locale">
          <TweakToggle label="PH localization (VAT + 2307)" value={t.showPH}
            onChange={(v) => setTweak("showPH", v)} />
        </TweakSection>
        <TweakSection label="Jump to">
          <TweakButton label="PMS kiosk board" onClick={() => setView({ name: "pms-board" })} />
          <TweakButton label="Technician field view" onClick={() => { setTweak("role", "TECHNICIAN"); setView({ name: "my-tasks" }); }} />
        </TweakSection>
        <TweakSection label="Demo · SO-2026-0418">
          <TweakSelect label="Order state" value={t.demoState}
            options={[
              { value: "PENDING", label: "Pending review" },
              { value: "APPROVED", label: "Approved" },
              { value: "PREPARING", label: "Preparing" },
              { value: "SHIPPED", label: "Shipped" },
              { value: "DELIVERED", label: "Delivered" },
            ]}
            onChange={(v) => setTweak("demoState", v)} />
          <TweakButton label="Open this order" onClick={() => setView({ name: "order", id: "SO-2026-0418" })} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

function SoonView({ name }) {
  const titles = { shipments: "Shipments", customers: "Customers", catalog: "Catalog", ledger: "General ledger" };
  const subs = {
    shipments: "Track in-transit orders, waybills, and proof-of-delivery.",
    customers: "Hospitals, clinics, and direct accounts. Credit limits and payment terms.",
    catalog: "Consumables, equipment, and accessory SKUs. Moving-average cost.",
    ledger: "Auto-posted journal entries from Sales, Procurement, and Lease modules.",
  };
  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-h1">{titles[name] || name}</h1>
          <div className="page-sub">{subs[name]}</div>
        </div>
      </div>
      <div className="card">
        <div className="empty">
          <div className="empty-ic"><Icon.Pin /></div>
          This view is part of the broader platform — Sales Order Processing is the focus of this prototype.<br />
          Switch back to <b>Sales orders</b> to walk an order through its lifecycle.
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ToastProvider>
    <App />
  </ToastProvider>
);
