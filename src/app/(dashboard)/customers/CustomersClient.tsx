"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { HelpButton } from "@/components/HelpButton";
import { peso } from "@/lib/utils";
import { createCustomer, updateCustomer } from "./actions";

const CUSTOMER_TYPES = ["HOSPITAL", "CLINIC", "GOVERNMENT", "PHARMACY", "DISTRIBUTOR", "OTHER"] as const;

export interface CustomerRow {
  id: string;
  code: string | null;
  name: string;
  type: string;
  tin: string | null;
  region: string | null;
  city: string | null;
  terms: string;
  creditLimit: string;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: string;
}

interface FormState {
  code: string;
  name: string;
  type: string;
  tin: string;
  region: string;
  city: string;
  terms: string;
  creditLimit: string;
  contactEmail: string;
  contactPhone: string;
}

function emptyForm(): FormState {
  return { code: "", name: "", type: "HOSPITAL", tin: "", region: "", city: "", terms: "Net 30", creditLimit: "0", contactEmail: "", contactPhone: "" };
}

function rowToForm(r: CustomerRow): FormState {
  return {
    code: r.code ?? "",
    name: r.name,
    type: r.type,
    tin: r.tin ?? "",
    region: r.region ?? "",
    city: r.city ?? "",
    terms: r.terms,
    creditLimit: r.creditLimit,
    contactEmail: r.contactEmail ?? "",
    contactPhone: r.contactPhone ?? "",
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="field-label">{label}</label>{children}</div>;
}

function CustomerForm({ form, setForm, err, pending, onCancel, onSubmit, submitLabel }: {
  form: FormState; setForm: (f: FormState) => void;
  err: string; pending: boolean;
  onCancel: () => void; onSubmit: (e: React.FormEvent) => void; submitLabel: string;
}) {
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Customer Name *">
          <input className="field-input" value={form.name} onChange={set("name")} placeholder="Metro General Hospital" required />
        </Field>
        <Field label="Type">
          <select className="field-input" value={form.type} onChange={set("type")}>
            {CUSTOMER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Code">
          <input className="field-input" value={form.code} onChange={set("code")} placeholder="CUST-001 (optional)" />
        </Field>
        <Field label="TIN">
          <input className="field-input" value={form.tin} onChange={set("tin")} placeholder="000-000-000-000" />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="City">
          <input className="field-input" value={form.city} onChange={set("city")} placeholder="Quezon City" />
        </Field>
        <Field label="Region">
          <input className="field-input" value={form.region} onChange={set("region")} placeholder="NCR" />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Payment Terms">
          <input className="field-input" value={form.terms} onChange={set("terms")} placeholder="Net 30" />
        </Field>
        <Field label="Credit Limit (₱)">
          <input className="field-input" type="number" min="0" step="0.01" value={form.creditLimit} onChange={set("creditLimit")} />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Contact Email">
          <input className="field-input" type="email" value={form.contactEmail} onChange={set("contactEmail")} placeholder="billing@hospital.ph" />
        </Field>
        <Field label="Contact Phone">
          <input className="field-input" value={form.contactPhone} onChange={set("contactPhone")} placeholder="+63 2 8xxx xxxx" />
        </Field>
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

export function CustomersClient({ customers }: { customers: CustomerRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<CustomerRow | null>(null);
  const [createForm, setCreateForm] = useState<FormState>(emptyForm());
  const [editForm, setEditForm] = useState<FormState>(emptyForm());
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  const filtered = customers.filter(c => {
    if (filterType !== "ALL" && c.type !== filterType) return false;
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || (c.code ?? "").toLowerCase().includes(q) || (c.city ?? "").toLowerCase().includes(q);
  });

  function openCreate() { setCreateForm(emptyForm()); setErr(""); setCreateOpen(true); }
  function openEdit(row: CustomerRow) { setEditRow(row); setEditForm(rowToForm(row)); setErr(""); }

  function submitCreate(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    startTransition(async () => {
      try {
        await createCustomer({
          code: createForm.code || undefined,
          name: createForm.name,
          type: createForm.type,
          tin: createForm.tin || undefined,
          region: createForm.region || undefined,
          city: createForm.city || undefined,
          terms: createForm.terms,
          creditLimit: parseFloat(createForm.creditLimit) || 0,
          contactEmail: createForm.contactEmail || undefined,
          contactPhone: createForm.contactPhone || undefined,
        });
        router.refresh(); setCreateOpen(false);
      } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
    });
  }

  function submitEdit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    startTransition(async () => {
      try {
        await updateCustomer(editRow!.id, {
          code: editForm.code || undefined,
          name: editForm.name,
          type: editForm.type,
          tin: editForm.tin || undefined,
          region: editForm.region || undefined,
          city: editForm.city || undefined,
          terms: editForm.terms,
          creditLimit: parseFloat(editForm.creditLimit) || 0,
          contactEmail: editForm.contactEmail || undefined,
          contactPhone: editForm.contactPhone || undefined,
        });
        router.refresh(); setEditRow(null);
      } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
    });
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2" style={{ flex: 1 }}>
          <h1 style={{ fontSize: 17, fontWeight: 600 }}>Customers</h1>
          <HelpButton slug="customers-suppliers" label="Help: Customers" />
        </div>
        <span style={{ fontSize: 12, color: "oklch(var(--ink-3))" }}>{customers.length} customers</span>
        <a href="/api/export/customers" className="btn btn-sm">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export CSV
        </a>
        <button className="btn btn-primary" onClick={openCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          New Customer
        </button>
      </div>

      <div className="filters">
        <div className="search-box" style={{ width: 240 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input placeholder="Search name, code, city…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="field-input" style={{ width: 150, height: 32 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="ALL">All types</option>
          {CUSTOMER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th className="id">Code</th>
              <th>City</th>
              <th>Terms</th>
              <th className="num">Credit Limit</th>
              <th>Contact</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="empty-state" style={{ padding: "32px 0" }}>No customers found</td></tr>
            )}
            {filtered.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 500 }}>{c.name}</td>
                <td><span className="badge">{c.type}</span></td>
                <td className="id">{c.code ?? "—"}</td>
                <td className="dim">{c.city ?? "—"}</td>
                <td className="dim">{c.terms}</td>
                <td className="num">{peso(c.creditLimit)}</td>
                <td className="dim" style={{ fontSize: 12 }}>{c.contactEmail ?? c.contactPhone ?? "—"}</td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                    <Link href={`/print/statement/${c.id}`} target="_blank" className="btn btn-ghost btn-sm" title="Statement of Account">
                      Statement
                    </Link>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Customer">
        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <CustomerForm form={createForm} setForm={setCreateForm} err={err} pending={pending} onCancel={() => setCreateOpen(false)} onSubmit={submitCreate} submitLabel="Create Customer" />
        </div>
      </Modal>

      <Modal open={!!editRow} onClose={() => setEditRow(null)} title={editRow ? `Edit — ${editRow.name}` : "Edit"}>
        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <CustomerForm form={editForm} setForm={setEditForm} err={err} pending={pending} onCancel={() => setEditRow(null)} onSubmit={submitEdit} submitLabel="Save Changes" />
        </div>
      </Modal>
    </div>
  );
}
