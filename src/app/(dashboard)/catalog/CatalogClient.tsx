"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { peso } from "@/lib/utils";
import { createCatalogItem, updateCatalogItem } from "./actions";

const CATEGORIES = ["CONSUMABLE", "ACCESSORY", "EQUIPMENT", "INSTRUMENT"] as const;
type Category = typeof CATEGORIES[number];

export interface CatalogRow {
  id: string;
  sku: string;
  name: string;
  category: Category;
  unit: string;
  unitPrice: string;
  brand: string | null;
  active: boolean;
  supplierId: string | null;
}

interface Supplier { id: string; name: string }

interface FormState {
  sku: string;
  name: string;
  category: Category;
  unit: string;
  unitPrice: string;
  brand: string;
  supplierId: string;
  active: boolean;
}

function emptyForm(): FormState {
  return { sku: "", name: "", category: "CONSUMABLE", unit: "pc", unitPrice: "", brand: "", supplierId: "", active: true };
}

function rowToForm(r: CatalogRow): FormState {
  return {
    sku: r.sku,
    name: r.name,
    category: r.category,
    unit: r.unit,
    unitPrice: r.unitPrice,
    brand: r.brand ?? "",
    supplierId: r.supplierId ?? "",
    active: r.active,
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

function CatalogForm({
  form,
  setForm,
  suppliers,
  err,
  pending,
  onCancel,
  onSubmit,
  submitLabel,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  suppliers: Supplier[];
  err: string;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
}) {
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="SKU *">
          <input className="field-input" value={form.sku} onChange={set("sku")} placeholder="MED-001" required />
        </Field>
        <Field label="Category *">
          <select className="field-input" value={form.category} onChange={set("category")}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Product Name *">
        <input className="field-input" value={form.name} onChange={set("name")} placeholder="Disposable Syringe 5mL" required />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Unit Price (₱) *">
          <input className="field-input" type="number" min="0.01" step="0.01" value={form.unitPrice} onChange={set("unitPrice")} placeholder="0.00" required />
        </Field>
        <Field label="Unit">
          <input className="field-input" value={form.unit} onChange={set("unit")} placeholder="pc" />
        </Field>
        <Field label="Brand">
          <input className="field-input" value={form.brand} onChange={set("brand")} placeholder="Optional" />
        </Field>
      </div>
      <Field label="Supplier">
        <select className="field-input" value={form.supplierId} onChange={set("supplierId")}>
          <option value="">— None —</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          id="cat-active"
          checked={form.active}
          onChange={e => setForm({ ...form, active: e.target.checked })}
          style={{ width: 15, height: 15, accentColor: "oklch(var(--accent))" }}
        />
        <label htmlFor="cat-active" style={{ fontSize: 13 }}>Active (visible in order forms)</label>
      </div>
      {err && <p style={{ fontSize: 12.5, color: "oklch(var(--err))" }}>{err}</p>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function CatalogClient({ items, suppliers }: { items: CatalogRow[]; suppliers: Supplier[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<CatalogRow | null>(null);
  const [createForm, setCreateForm] = useState<FormState>(emptyForm());
  const [editForm, setEditForm] = useState<FormState>(emptyForm());
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("ALL");
  const [filterActive, setFilterActive] = useState("ALL");

  const filtered = items.filter(i => {
    if (filterCat !== "ALL" && i.category !== filterCat) return false;
    if (filterActive === "ACTIVE" && !i.active) return false;
    if (filterActive === "INACTIVE" && i.active) return false;
    const q = search.toLowerCase();
    return !q || i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || (i.brand ?? "").toLowerCase().includes(q);
  });

  function openCreate() { setCreateForm(emptyForm()); setErr(""); setCreateOpen(true); }
  function openEdit(row: CatalogRow) { setEditItem(row); setEditForm(rowToForm(row)); setErr(""); }

  function submitCreate(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    startTransition(async () => {
      try {
        await createCatalogItem({
          sku: createForm.sku,
          name: createForm.name,
          category: createForm.category,
          unit: createForm.unit,
          unitPrice: parseFloat(createForm.unitPrice),
          brand: createForm.brand || undefined,
          supplierId: createForm.supplierId || null,
          active: createForm.active,
        });
        router.refresh(); setCreateOpen(false);
      } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
    });
  }

  function submitEdit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    startTransition(async () => {
      try {
        await updateCatalogItem(editItem!.id, {
          sku: editForm.sku,
          name: editForm.name,
          category: editForm.category,
          unit: editForm.unit,
          unitPrice: parseFloat(editForm.unitPrice),
          brand: editForm.brand || undefined,
          supplierId: editForm.supplierId || null,
          active: editForm.active,
        });
        router.refresh(); setEditItem(null);
      } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
    });
  }

  const PILL_CAT: Record<Category, string> = {
    CONSUMABLE: "pill-APPROVED",
    ACCESSORY: "pill-PREPARING",
    EQUIPMENT: "pill-SHIPPED",
    INSTRUMENT: "pill-PENDING",
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <h1 style={{ fontSize: 17, fontWeight: 600, flex: 1 }}>Catalog</h1>
        <span style={{ fontSize: 12, color: "oklch(var(--ink-3))" }}>{items.length} items</span>
        <button className="btn btn-primary" onClick={openCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          New Item
        </button>
      </div>

      <div className="filters">
        <div className="search-box" style={{ width: 240 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input placeholder="Search SKU, name, brand…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="field-input" style={{ width: 150, height: 32 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="ALL">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="field-input" style={{ width: 120, height: 32 }} value={filterActive} onChange={e => setFilterActive(e.target.value)}>
          <option value="ALL">All status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th className="id">SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>Brand</th>
              <th className="num">Unit Price</th>
              <th>Unit</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="empty-state" style={{ padding: "32px 0" }}>No items found</td></tr>
            )}
            {filtered.map(item => (
              <tr key={item.id} style={{ opacity: item.active ? 1 : 0.55 }}>
                <td className="id">{item.sku}</td>
                <td style={{ fontWeight: 500 }}>{item.name}</td>
                <td><span className={`pill ${PILL_CAT[item.category]}`}>{item.category}</span></td>
                <td className="dim">{item.brand ?? "—"}</td>
                <td className="num">{peso(item.unitPrice)}</td>
                <td className="dim">{item.unit}</td>
                <td>
                  <span className={`pill ${item.active ? "pill-DELIVERED" : "pill-CANCELLED"}`}>
                    {item.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Catalog Item">
        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <CatalogForm form={createForm} setForm={setCreateForm} suppliers={suppliers} err={err} pending={pending} onCancel={() => setCreateOpen(false)} onSubmit={submitCreate} submitLabel="Create Item" />
        </div>
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title={editItem ? `Edit — ${editItem.name}` : "Edit"}>
        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <CatalogForm form={editForm} setForm={setEditForm} suppliers={suppliers} err={err} pending={pending} onCancel={() => setEditItem(null)} onSubmit={submitEdit} submitLabel="Save Changes" />
        </div>
      </Modal>
    </div>
  );
}
