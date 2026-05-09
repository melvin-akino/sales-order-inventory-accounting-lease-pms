// admin-views.jsx — Catalog / Customers / Suppliers admin UIs
//                + redesigned CustomerOrdersView with proper list + filters

const SUPPLIERS = [
  { id: "SUP-101", name: "MedSource Asia, Inc.",        contact: "Hannah Pe",      city: "Pasig",        terms: "Net 45", lead: 7,  rating: 4.8, items: 38, openPOs: 3, ytdSpend: 4820000, status: "Active" },
  { id: "SUP-102", name: "Pacific Health Distributors", contact: "Mark Villaruel", city: "Makati",       terms: "Net 30", lead: 5,  rating: 4.6, items: 24, openPOs: 1, ytdSpend: 2640000, status: "Active" },
  { id: "SUP-103", name: "BlueShield Surgical Supplies",contact: "Carla Ng",       city: "Mandaluyong",  terms: "Net 30", lead: 10, rating: 4.4, items: 19, openPOs: 2, ytdSpend: 1980000, status: "Active" },
  { id: "SUP-104", name: "Manila Pharma Logistics",     contact: "Lito Cabral",    city: "Quezon City",  terms: "Net 60", lead: 4,  rating: 4.2, items: 31, openPOs: 0, ytdSpend: 3120000, status: "Active" },
  { id: "SUP-105", name: "Visayas BioMed Trading",      contact: "Mae Tabios",     city: "Cebu City",    terms: "Net 30", lead: 9,  rating: 4.0, items: 12, openPOs: 1, ytdSpend: 880000,  status: "Active" },
  { id: "SUP-106", name: "Mindanao Health Imports",     contact: "Roel Sumalpong", city: "Davao City",   terms: "Net 30", lead: 12, rating: 3.9, items: 9,  openPOs: 0, ytdSpend: 540000,  status: "Probation" },
  { id: "SUP-107", name: "GenLife Medical Trading",     contact: "Sara Bautista",  city: "Pasay",        terms: "Net 45", lead: 6,  rating: 4.7, items: 22, openPOs: 2, ytdSpend: 2210000, status: "Active" },
  { id: "SUP-108", name: "Apex Devices Philippines",    contact: "Igor Mendoza",   city: "Taguig",       terms: "Net 30", lead: 14, rating: 4.5, items: 16, openPOs: 1, ytdSpend: 1740000, status: "Active" },
];

// ─── Catalog admin ──────────────────────────────────────────────────────────
function CatalogAdminView({ onOpen }) {
  const [search, setSearch] = React.useState("");
  const [cat, setCat] = React.useState("All");
  const [showLow, setShowLow] = React.useState(false);
  const [items, setItems] = React.useState(() => CATALOG.map((p) => ({ ...p, active: true, supplierId: ["SUP-101","SUP-102","SUP-103","SUP-104"][Math.floor(Math.random()*4)] })));
  const [edit, setEdit] = React.useState(null);
  const toast = useToast();

  const cats = ["All", ...new Set(items.map((p) => p.cat))];
  const filtered = items.filter((p) => {
    if (cat !== "All" && p.cat !== cat) return false;
    if (showLow && p.stock >= 200) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return p.sku.toLowerCase().includes(s) || p.name.toLowerCase().includes(s);
  });

  const totalValue = items.reduce((s, p) => s + p.stock * p.price, 0);
  const lowStock = items.filter((p) => p.stock < 200).length;
  const outOfStock = items.filter((p) => p.stock === 0).length;

  const saveItem = (item) => {
    setItems((prev) => prev.map((p) => p.sku === item.sku ? item : p));
    toast(`${item.sku} updated`);
    setEdit(null);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-h1">Catalog</h1>
          <div className="page-sub">{items.length} SKUs · {SHORT_PESO(totalValue)} on-hand value</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-sm"><Icon.Down /> Export CSV</button>
          <button className="btn btn-sm"><Icon.Tag /> Print labels</button>
          <button className="btn btn-primary btn-sm" onClick={() => setEdit({ sku: "", name: "", unit: "pc", price: 0, stock: 0, cat: "Consumable", active: true, supplierId: "SUP-101" })}>
            <Icon.Plus /> New SKU
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <Stat label="Total SKUs" value={items.length.toString()} trend={`${items.filter((p) => p.active).length} active`} />
        <Stat label="On-hand value" value={SHORT_PESO(totalValue)} trend="Moving avg cost" />
        <Stat label="Low stock" value={lowStock.toString()} trend={lowStock > 0 ? "Reorder needed" : "On pace"} dn={lowStock > 0} />
        <Stat label="Out of stock" value={outOfStock.toString()} trend={outOfStock > 0 ? "Action needed" : "Healthy"} dn={outOfStock > 0} />
      </div>

      <div className="filters">
        <div className="search" style={{ width: 320 }}>
          <Icon.Search />
          <input placeholder="Search SKU or name…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {cats.map((c) => (
          <button key={c} className="chip" data-on={cat === c ? "1" : "0"} onClick={() => setCat(c)}>{c}</button>
        ))}
        <button className="chip" data-on={showLow ? "1" : "0"} onClick={() => setShowLow(!showLow)}>Low stock only</button>
        <span className="dim" style={{ marginLeft: "auto", fontSize: 12 }}>{filtered.length} of {items.length}</span>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead><tr>
            <th>SKU</th><th>Item</th><th>Category</th><th>Supplier</th><th>UoM</th>
            <th className="num">Price</th><th className="num">Stock</th><th className="num">Value</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {filtered.map((p) => {
              const sup = SUPPLIERS.find((s) => s.id === p.supplierId);
              const low = p.stock < 200;
              return (
                <tr key={p.sku} onClick={() => setEdit(p)}>
                  <td className="id">{p.sku}</td>
                  <td>{p.name}</td>
                  <td><span className="badge">{p.cat}</span></td>
                  <td className="dim">{sup ? sup.name : "—"}</td>
                  <td className="dim">{p.unit}</td>
                  <td className="num">{PESO(p.price)}</td>
                  <td className="num" style={low ? { color: "var(--st-cancel-fg)", fontWeight: 500 } : {}}>
                    {p.stock.toLocaleString()}
                  </td>
                  <td className="num dim">{SHORT_PESO(p.stock * p.price)}</td>
                  <td>{p.active
                    ? <span className="pill" data-state="DELIVERED">Active</span>
                    : <span className="pill" data-state="PENDING">Inactive</span>}</td>
                  <td style={{ textAlign: "right", paddingRight: 12 }}>
                    <button className="btn-ghost btn btn-sm" onClick={(e) => { e.stopPropagation(); setEdit(p); }}><Icon.Edit /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {edit && <SkuEditor item={edit} onClose={() => setEdit(null)} onSave={saveItem} />}
    </div>
  );
}

function SkuEditor({ item, onClose, onSave }) {
  const [form, setForm] = React.useState(item);
  const set = (k, v) => setForm({ ...form, [k]: v });
  const isNew = !item.sku || item.sku === "";
  return (
    <>
      <div className="scrim" onClick={onClose}></div>
      <div className="modal" style={{ width: 540 }}>
        <div className="card-head">
          <div className="card-h">{isNew ? "New SKU" : `Edit · ${item.sku}`}</div>
          <button className="btn-ghost btn btn-sm" style={{ marginLeft: "auto" }} onClick={onClose}><Icon.X /></button>
        </div>
        <div className="card-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="field-label">Item name</label>
            <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className="field-label">SKU</label>
            <input className="input mono" value={form.sku} onChange={(e) => set("sku", e.target.value)} disabled={!isNew} />
          </div>
          <div>
            <label className="field-label">Category</label>
            <Select value={form.cat} onChange={(v) => set("cat", v)}
                    options={["Consumable", "Accessory", "Equipment"]} />
          </div>
          <div>
            <label className="field-label">UoM</label>
            <Select value={form.unit} onChange={(v) => set("unit", v)}
                    options={["pc", "box", "btl", "kit", "case"]} />
          </div>
          <div>
            <label className="field-label">Supplier</label>
            <Select value={form.supplierId} onChange={(v) => set("supplierId", v)}
                    options={SUPPLIERS.map((s) => ({ value: s.id, label: s.name }))} />
          </div>
          <div>
            <label className="field-label">Unit price (₱)</label>
            <input className="input mono" type="number" step="0.01" value={form.price} onChange={(e) => set("price", Number(e.target.value))} />
          </div>
          <div>
            <label className="field-label">Stock on hand</label>
            <input className="input mono" type="number" value={form.stock} onChange={(e) => set("stock", Number(e.target.value))} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="row gap-2" style={{ fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
              <span>Available for sale</span>
            </label>
          </div>
        </div>
        <div style={{ padding: "12px 18px", borderTop: "1px solid var(--line)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => onSave(form)}><Icon.Check /> Save SKU</button>
        </div>
      </div>
    </>
  );
}

// ─── Customers admin ────────────────────────────────────────────────────────
function CustomersAdminView({ orders }) {
  const [search, setSearch] = React.useState("");
  const [region, setRegion] = React.useState("All");
  const [edit, setEdit] = React.useState(null);
  const [items, setItems] = React.useState(CUSTOMERS);
  const toast = useToast();

  const regions = ["All", ...new Set(items.map((c) => c.region))];

  const enriched = items.map((c) => {
    const cOrders = orders.filter((o) => o.customerId === c.id);
    const open = cOrders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.state));
    const ytd = cOrders.reduce((s, o) => s + o.total, 0);
    return { ...c, openOrders: open.length, totalOrders: cOrders.length, ytd };
  });

  const filtered = enriched.filter((c) => {
    if (region !== "All" && c.region !== region) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return c.name.toLowerCase().includes(s) || c.id.toLowerCase().includes(s) || c.city.toLowerCase().includes(s);
  });

  const totalCredit = items.reduce((s, c) => s + c.credit, 0);
  const totalGmv = enriched.reduce((s, c) => s + c.ytd, 0);

  const saveCustomer = (cust) => {
    if (!cust.id) {
      cust.id = "C-" + (1600 + items.length).toString();
      setItems((prev) => [...prev, cust]);
      toast(`${cust.name} added`);
    } else {
      setItems((prev) => prev.map((c) => c.id === cust.id ? cust : c));
      toast(`${cust.name} updated`);
    }
    setEdit(null);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-h1">Customers</h1>
          <div className="page-sub">{items.length} accounts · {SHORT_PESO(totalCredit)} total credit extended</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-sm"><Icon.Down /> Export</button>
          <button className="btn btn-primary btn-sm" onClick={() => setEdit({ id: "", name: "", contact: "", region: "NCR", city: "", terms: "Net 30", credit: 1000000 })}>
            <Icon.Plus /> New customer
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <Stat label="Active accounts" value={items.length.toString()} trend="All in good standing" />
        <Stat label="Credit extended" value={SHORT_PESO(totalCredit)} trend="Across all hospitals" />
        <Stat label="GMV (lifetime sample)" value={SHORT_PESO(totalGmv)} trend="From open + closed orders" up />
        <Stat label="Open orders" value={enriched.reduce((s, c) => s + c.openOrders, 0).toString()} trend="In active fulfillment" />
      </div>

      <div className="filters">
        <div className="search" style={{ width: 320 }}>
          <Icon.Search />
          <input placeholder="Search by name, ID, or city…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {regions.map((r) => (
          <button key={r} className="chip" data-on={region === r ? "1" : "0"} onClick={() => setRegion(r)}>{r}</button>
        ))}
        <span className="dim" style={{ marginLeft: "auto", fontSize: 12 }}>{filtered.length} of {items.length}</span>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead><tr>
            <th>ID</th><th>Customer</th><th>Region</th><th>Terms</th>
            <th className="num">Credit limit</th><th className="num">YTD GMV</th>
            <th className="num">Open</th><th className="num">Total orders</th><th></th>
          </tr></thead>
          <tbody>
            {filtered.map((c) => {
              const util = c.credit ? Math.min(1, (c.openOrders * 200000) / c.credit) : 0;
              return (
                <tr key={c.id} onClick={() => setEdit(c)}>
                  <td className="id">{c.id}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{c.name}</div>
                    <div className="dim" style={{ fontSize: 11.5, marginTop: 1 }}>{c.contact} · {c.city}</div>
                  </td>
                  <td><span className="badge">{c.region}</span></td>
                  <td className="dim">{c.terms}</td>
                  <td className="num">
                    {PESO(c.credit)}
                    <div style={{ height: 3, marginTop: 4, background: "var(--bg-2)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${util * 100}%`, background: util > 0.7 ? "oklch(0.55 0.14 25)" : "var(--ink)", opacity: 0.7 }} />
                    </div>
                  </td>
                  <td className="num">{SHORT_PESO(c.ytd)}</td>
                  <td className="num">{c.openOrders}</td>
                  <td className="num dim">{c.totalOrders}</td>
                  <td style={{ textAlign: "right", paddingRight: 12 }}>
                    <button className="btn-ghost btn btn-sm" onClick={(e) => { e.stopPropagation(); setEdit(c); }}><Icon.Edit /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {edit && <CustomerEditor item={edit} onClose={() => setEdit(null)} onSave={saveCustomer} />}
    </div>
  );
}

function CustomerEditor({ item, onClose, onSave }) {
  const [form, setForm] = React.useState(item);
  const set = (k, v) => setForm({ ...form, [k]: v });
  const isNew = !item.id;
  return (
    <>
      <div className="scrim" onClick={onClose}></div>
      <div className="modal" style={{ width: 580 }}>
        <div className="card-head">
          <div className="card-h">{isNew ? "New customer" : `Edit · ${item.name}`}</div>
          <button className="btn-ghost btn btn-sm" style={{ marginLeft: "auto" }} onClick={onClose}><Icon.X /></button>
        </div>
        <div className="card-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="field-label">Account name</label>
            <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. St. Luke's Medical Center — QC" />
          </div>
          <div>
            <label className="field-label">Customer ID</label>
            <input className="input mono" value={form.id} placeholder="auto" disabled />
          </div>
          <div>
            <label className="field-label">Primary contact</label>
            <input className="input" value={form.contact} onChange={(e) => set("contact", e.target.value)} />
          </div>
          <div>
            <label className="field-label">Region</label>
            <Select value={form.region} onChange={(v) => set("region", v)}
                    options={["NCR", "CAR", "I", "II", "III", "IV-A", "IV-B", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "BARMM"]} />
          </div>
          <div>
            <label className="field-label">City</label>
            <input className="input" value={form.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div>
            <label className="field-label">Payment terms</label>
            <Select value={form.terms} onChange={(v) => set("terms", v)}
                    options={["Net 15", "Net 30", "Net 45", "Net 60", "COD"]} />
          </div>
          <div>
            <label className="field-label">Credit limit (₱)</label>
            <input className="input mono" type="number" value={form.credit} onChange={(e) => set("credit", Number(e.target.value))} />
          </div>
        </div>
        <div style={{ padding: "12px 18px", borderTop: "1px solid var(--line)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => onSave(form)}><Icon.Check /> Save</button>
        </div>
      </div>
    </>
  );
}

// ─── Suppliers admin ────────────────────────────────────────────────────────
function SuppliersAdminView() {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [edit, setEdit] = React.useState(null);
  const [items, setItems] = React.useState(SUPPLIERS);
  const toast = useToast();

  const filtered = items.filter((s) => {
    if (statusFilter !== "All" && s.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.city.toLowerCase().includes(q);
  });

  const totalSpend = items.reduce((s, x) => s + x.ytdSpend, 0);
  const totalOpenPOs = items.reduce((s, x) => s + x.openPOs, 0);
  const avgLead = Math.round(items.reduce((s, x) => s + x.lead, 0) / items.length);

  const saveSupplier = (sup) => {
    if (!sup.id) {
      sup.id = "SUP-" + (200 + items.length).toString();
      setItems((prev) => [...prev, sup]);
      toast(`${sup.name} added`);
    } else {
      setItems((prev) => prev.map((s) => s.id === sup.id ? sup : s));
      toast(`${sup.name} updated`);
    }
    setEdit(null);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-h1">Suppliers</h1>
          <div className="page-sub">{items.length} vendors · {totalOpenPOs} open POs · {SHORT_PESO(totalSpend)} YTD spend</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-sm"><Icon.Down /> Export</button>
          <button className="btn btn-primary btn-sm" onClick={() => setEdit({ id: "", name: "", contact: "", city: "", terms: "Net 30", lead: 7, rating: 4.5, items: 0, openPOs: 0, ytdSpend: 0, status: "Active" })}>
            <Icon.Plus /> New supplier
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <Stat label="Active suppliers" value={items.filter((s) => s.status === "Active").length.toString()} trend={`${items.filter((s) => s.status !== "Active").length} on probation`} />
        <Stat label="Open POs" value={totalOpenPOs.toString()} trend="Across all vendors" />
        <Stat label="YTD spend" value={SHORT_PESO(totalSpend)} trend="+12.4% vs LY" up />
        <Stat label="Avg lead time" value={avgLead + " days"} trend="From PO to receipt" />
      </div>

      <div className="filters">
        <div className="search" style={{ width: 320 }}>
          <Icon.Search />
          <input placeholder="Search supplier or city…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {["All", "Active", "Probation"].map((s) => (
          <button key={s} className="chip" data-on={statusFilter === s ? "1" : "0"} onClick={() => setStatusFilter(s)}>{s}</button>
        ))}
        <span className="dim" style={{ marginLeft: "auto", fontSize: 12 }}>{filtered.length} of {items.length}</span>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead><tr>
            <th>ID</th><th>Supplier</th><th>City</th><th>Terms</th>
            <th className="num">Lead</th><th className="num">SKUs</th>
            <th className="num">Open POs</th><th className="num">YTD spend</th>
            <th>Rating</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} onClick={() => setEdit(s)}>
                <td className="id">{s.id}</td>
                <td>
                  <div style={{ fontWeight: 500 }}>{s.name}</div>
                  <div className="dim" style={{ fontSize: 11.5, marginTop: 1 }}>{s.contact}</div>
                </td>
                <td className="dim">{s.city}</td>
                <td className="dim">{s.terms}</td>
                <td className="num">{s.lead}d</td>
                <td className="num dim">{s.items}</td>
                <td className="num">{s.openPOs}</td>
                <td className="num">{SHORT_PESO(s.ytdSpend)}</td>
                <td><RatingDots value={s.rating} /></td>
                <td>{s.status === "Active"
                  ? <span className="pill" data-state="DELIVERED">Active</span>
                  : <span className="pill" data-state="PREPARING">Probation</span>}</td>
                <td style={{ textAlign: "right", paddingRight: 12 }}>
                  <button className="btn-ghost btn btn-sm" onClick={(e) => { e.stopPropagation(); setEdit(s); }}><Icon.Edit /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit && <SupplierEditor item={edit} onClose={() => setEdit(null)} onSave={saveSupplier} />}
    </div>
  );
}

function RatingDots({ value }) {
  return (
    <div className="row gap-2" style={{ fontSize: 12 }}>
      <div style={{ display: "flex", gap: 2 }}>
        {[0,1,2,3,4].map((i) => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: "50%",
            background: i < Math.round(value) ? "var(--accent)" : "var(--line-2)",
          }} />
        ))}
      </div>
      <span className="mono dim" style={{ fontSize: 11 }}>{value.toFixed(1)}</span>
    </div>
  );
}

function SupplierEditor({ item, onClose, onSave }) {
  const [form, setForm] = React.useState(item);
  const set = (k, v) => setForm({ ...form, [k]: v });
  const isNew = !item.id;
  return (
    <>
      <div className="scrim" onClick={onClose}></div>
      <div className="modal" style={{ width: 580 }}>
        <div className="card-head">
          <div className="card-h">{isNew ? "New supplier" : `Edit · ${item.name}`}</div>
          <button className="btn-ghost btn btn-sm" style={{ marginLeft: "auto" }} onClick={onClose}><Icon.X /></button>
        </div>
        <div className="card-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="field-label">Supplier name</label>
            <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className="field-label">Supplier ID</label>
            <input className="input mono" value={form.id || "auto"} disabled />
          </div>
          <div>
            <label className="field-label">Contact person</label>
            <input className="input" value={form.contact} onChange={(e) => set("contact", e.target.value)} />
          </div>
          <div>
            <label className="field-label">City</label>
            <input className="input" value={form.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div>
            <label className="field-label">Payment terms</label>
            <Select value={form.terms} onChange={(v) => set("terms", v)}
                    options={["Net 15", "Net 30", "Net 45", "Net 60", "COD"]} />
          </div>
          <div>
            <label className="field-label">Lead time (days)</label>
            <input className="input mono" type="number" value={form.lead} onChange={(e) => set("lead", Number(e.target.value))} />
          </div>
          <div>
            <label className="field-label">Status</label>
            <Select value={form.status} onChange={(v) => set("status", v)}
                    options={["Active", "Probation", "Suspended"]} />
          </div>
        </div>
        <div style={{ padding: "12px 18px", borderTop: "1px solid var(--line)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => onSave(form)}><Icon.Check /> Save</button>
        </div>
      </div>
    </>
  );
}

// ─── Customer Orders v2 — proper list with tabs + filters ───────────────────
function CustomerOrdersListView({ orders, self, onOpen, presetTab }) {
  const [tab, setTab] = React.useState(presetTab || "ALL");
  const [search, setSearch] = React.useState("");

  const counts = {
    ALL: orders.length,
    OPEN: orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.state)).length,
    PENDING: orders.filter((o) => o.state === "PENDING").length,
    APPROVED: orders.filter((o) => o.state === "APPROVED").length,
    PREPARING: orders.filter((o) => o.state === "PREPARING").length,
    SHIPPED: orders.filter((o) => o.state === "SHIPPED").length,
    DELIVERED: orders.filter((o) => o.state === "DELIVERED").length,
  };

  const tabFilter = (o) => tab === "ALL" ? true
    : tab === "OPEN" ? !["DELIVERED", "CANCELLED"].includes(o.state)
    : o.state === tab;

  const filtered = orders.filter(tabFilter).filter((o) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return o.id.toLowerCase().includes(s) || (o.poRef || "").toLowerCase().includes(s);
  });

  const openCount = counts.OPEN;
  const totalSpend = orders.reduce((s, o) => s + o.total, 0);
  const lastDeliveredAt = orders.filter((o) => o.state === "DELIVERED").map((o) => new Date(o.timeline[o.timeline.length - 1].at).getTime()).sort((a, b) => b - a)[0];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-h1">Your orders</h1>
          <div className="page-sub">{self.name} · {self.terms} · Credit limit {PESO(self.credit)}</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-sm"><Icon.Down /> Statement of account</button>
          <button className="btn btn-primary btn-sm" onClick={() => onOpen("shop")}><Icon.Plus /> Place new order</button>
        </div>
      </div>

      <div className="stat-grid">
        <Stat label="Orders this year" value={orders.length.toString()} trend={`${openCount} in progress`} />
        <Stat label="In progress" value={openCount.toString()} trend={openCount > 0 ? "Track below" : "All clear"} />
        <Stat label="Lifetime spend" value={SHORT_PESO(totalSpend)} trend="From this account" />
        <Stat label="Last delivery" value={lastDeliveredAt ? fmtRel(new Date(lastDeliveredAt).toISOString()) : "—"} trend={lastDeliveredAt ? "Confirmed received" : ""} />
      </div>

      <div className="tabs">
        {[
          ["ALL", "All"],
          ["OPEN", "In progress"],
          ["PENDING", "Pending"],
          ["APPROVED", "Approved"],
          ["PREPARING", "Preparing"],
          ["SHIPPED", "Shipped"],
          ["DELIVERED", "Delivered"],
        ].map(([k, l]) => (
          <button key={k} className="tab" data-active={tab === k ? "1" : "0"} onClick={() => setTab(k)}>
            {l} <span className="tab-count">{counts[k] || 0}</span>
          </button>
        ))}
      </div>

      <div className="filters">
        <div className="search" style={{ width: 320 }}>
          <Icon.Search />
          <input placeholder="Search by SO or PO number…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <span className="dim" style={{ marginLeft: "auto", fontSize: 12 }}>{filtered.length} of {orders.length}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty">
            <div className="empty-ic"><Icon.Order /></div>
            {orders.length === 0 ? "No orders yet — start with the catalog." : "No orders match these filters."}
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr>
              <th>Order</th><th>PO ref</th><th>Status</th><th>Need by</th>
              <th className="num">Lines</th><th className="num">Total</th><th>Placed</th>
            </tr></thead>
            <tbody>
              {filtered.map((o) => {
                const overdue = new Date(o.needBy) < new Date("2026-05-09T09:00:00+08:00") && !["DELIVERED", "CANCELLED"].includes(o.state);
                return (
                  <tr key={o.id} onClick={() => onOpen("order", o.id)}>
                    <td className="id">{o.id}</td>
                    <td className="dim mono" style={{ fontSize: 12 }}>{o.poRef || "—"}</td>
                    <td><StatePill state={o.state} /></td>
                    <td style={overdue ? { color: "var(--st-cancel-fg)", fontWeight: 500 } : {}}>
                      {fmtDate(o.needBy)}{overdue ? " · past" : ""}
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
      )}
    </div>
  );
}

Object.assign(window, {
  SUPPLIERS, CatalogAdminView, CustomersAdminView, SuppliersAdminView, CustomerOrdersListView,
});
