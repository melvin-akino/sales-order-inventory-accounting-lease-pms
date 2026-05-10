"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAsset, updateAsset } from "./actions";
import { HelpButton } from "@/components/HelpButton";
import { useToast } from "@/components/ui/Toast";
import { fmtDate } from "@/lib/utils";
import type { AssetCategory } from "@prisma/client";

interface Asset {
  id: string;
  name: string;
  serialNumber: string;
  category: AssetCategory;
  warehouseId: string | null;
  warehouseName: string | null;
  purchasedAt: string | null;
  maintenanceIntervalDays: number;
  createdAt: string;
  openWoCount: number;
}
interface Warehouse { id: string; name: string; }

interface Props {
  assets: Asset[];
  warehouses: Warehouse[];
}

const CATEGORIES: AssetCategory[] = [
  "PATIENT_MONITOR",
  "VENTILATOR",
  "INFUSION_PUMP",
  "OXYGEN_CONCENTRATOR",
  "DEFIBRILLATOR",
  "MONITOR",
  "OTHER",
];

const CAT_LABEL: Record<AssetCategory, string> = {
  PATIENT_MONITOR:     "Patient Monitor",
  VENTILATOR:          "Ventilator",
  INFUSION_PUMP:       "Infusion Pump",
  OXYGEN_CONCENTRATOR: "Oxygen Concentrator",
  DEFIBRILLATOR:       "Defibrillator",
  MONITOR:             "Monitor",
  OTHER:               "Other",
};

const CAT_DOT: Record<AssetCategory, string> = {
  PATIENT_MONITOR:     "oklch(0.55 0.12 240)",
  VENTILATOR:          "oklch(0.55 0.15 285)",
  INFUSION_PUMP:       "oklch(0.55 0.12 195)",
  OXYGEN_CONCENTRATOR: "oklch(0.55 0.10 155)",
  DEFIBRILLATOR:       "oklch(0.50 0.18 25)",
  MONITOR:             "oklch(0.55 0.10 80)",
  OTHER:               "oklch(0.55 0.02 250)",
};

const blank = {
  name: "", serialNumber: "", category: "OTHER" as AssetCategory,
  warehouseId: "", purchasedAt: "", maintenanceIntervalDays: 90,
};

export function EquipmentClient({ assets, warehouses }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<AssetCategory | "">("");

  const [showCreate, setShowCreate] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  const [form, setForm] = useState(blank);

  function set(k: keyof typeof blank, v: string | number) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function openCreate() {
    setForm({ ...blank, warehouseId: warehouses[0]?.id ?? "" });
    setShowCreate(true);
  }

  function openEdit(a: Asset) {
    setForm({
      name: a.name,
      serialNumber: a.serialNumber,
      category: a.category,
      warehouseId: a.warehouseId ?? "",
      purchasedAt: a.purchasedAt ? a.purchasedAt.slice(0, 10) : "",
      maintenanceIntervalDays: a.maintenanceIntervalDays,
    });
    setEditAsset(a);
  }

  function act(fn: () => Promise<void>, msg: string, done: () => void) {
    startTransition(async () => {
      try {
        await fn();
        toast(msg, "success");
        done();
        router.refresh();
      } catch (e) {
        toast((e as Error).message, "error");
      }
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    act(
      () => createAsset({
        name: form.name,
        serialNumber: form.serialNumber,
        category: form.category,
        warehouseId: form.warehouseId || undefined,
        purchasedAt: form.purchasedAt || undefined,
        maintenanceIntervalDays: Number(form.maintenanceIntervalDays),
      }),
      "Asset created",
      () => setShowCreate(false),
    );
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editAsset) return;
    act(
      () => updateAsset(editAsset.id, {
        name: form.name,
        category: form.category,
        warehouseId: form.warehouseId || undefined,
        purchasedAt: form.purchasedAt || undefined,
        maintenanceIntervalDays: Number(form.maintenanceIntervalDays),
      }),
      "Asset updated",
      () => setEditAsset(null),
    );
  }

  const filtered = assets.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.name.toLowerCase().includes(q) || a.serialNumber.toLowerCase().includes(q) || (a.warehouseName ?? "").toLowerCase().includes(q);
    const matchCat = !catFilter || a.category === catFilter;
    return matchSearch && matchCat;
  });

  const FormBody = ({ onSubmit, isCreate }: { onSubmit: (e: React.FormEvent) => void; isCreate: boolean }) => (
    <form onSubmit={onSubmit} className="card-body flex flex-col gap-3">
      <div>
        <label className="field-label">Asset Name *</label>
        <input className="field-input" value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Mindray Patient Monitor" required />
      </div>
      <div className="form-2col">
        <div>
          <label className="field-label">Serial Number *</label>
          <input
            className="field-input"
            value={form.serialNumber}
            onChange={e => set("serialNumber", e.target.value)}
            placeholder="SN-XXXXXXXX"
            required
            readOnly={!isCreate}
            style={!isCreate ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
          />
        </div>
        <div>
          <label className="field-label">Category</label>
          <select className="field-input" value={form.category} onChange={e => set("category", e.target.value as AssetCategory)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
          </select>
        </div>
      </div>
      <div className="form-2col">
        <div>
          <label className="field-label">Location / Warehouse</label>
          <select className="field-input" value={form.warehouseId} onChange={e => set("warehouseId", e.target.value)}>
            <option value="">No warehouse</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Purchase Date</label>
          <input type="date" className="field-input" value={form.purchasedAt} onChange={e => set("purchasedAt", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="field-label">Maintenance Interval (days)</label>
        <input
          type="number"
          min={1}
          className="field-input"
          value={form.maintenanceIntervalDays}
          onChange={e => set("maintenanceIntervalDays", Number(e.target.value))}
          placeholder="90"
        />
        <p className="text-[11px] mt-1" style={{ color: "oklch(var(--ink-3))" }}>
          Every {form.maintenanceIntervalDays} days — roughly every {Math.round(Number(form.maintenanceIntervalDays) / 30)} month(s)
        </p>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn" onClick={() => isCreate ? setShowCreate(false) : setEditAsset(null)}>Cancel</button>
        <button type="submit" className="btn btn-accent" disabled={isPending}>
          {isPending ? (isCreate ? "Creating…" : "Saving…") : (isCreate ? "Create Asset" : "Save Changes")}
        </button>
      </div>
    </form>
  );

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-[18px] font-semibold">Equipment</h1>
          <HelpButton slug="equipment" label="Help: Equipment" />
        </div>
        <button className="btn btn-accent" onClick={openCreate}>+ New Asset</button>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="search-box" style={{ width: 220 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or serial…" />
        </div>
        <button className={`chip ${catFilter === "" ? '[aria-pressed="true"]' : ""}`} aria-pressed={catFilter === ""} onClick={() => setCatFilter("")}>All</button>
        {CATEGORIES.map(c => (
          <button key={c} className="chip" aria-pressed={catFilter === c} onClick={() => setCatFilter(catFilter === c ? "" : c)}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: CAT_DOT[c] }} />
            {CAT_LABEL[c]}
          </button>
        ))}
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Name</th>
              <th className="id">Serial #</th>
              <th>Category</th>
              <th>Location</th>
              <th>Purchased</th>
              <th>PM Interval</th>
              <th className="num">Open WOs</th>
              <th style={{ width: 70 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 9h6M9 12h6M9 15h4" />
                      </svg>
                    </div>
                    No assets found
                  </div>
                </td>
              </tr>
            )}
            {filtered.map((a) => (
              <tr key={a.id} style={{ cursor: "default" }}>
                <td>
                  <div className="text-[13px] font-medium" style={{ color: "oklch(var(--ink))" }}>{a.name}</div>
                </td>
                <td className="id">{a.serialNumber}</td>
                <td>
                  <span className="flex items-center gap-1.5 text-[12px]">
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: CAT_DOT[a.category], flexShrink: 0 }} />
                    {CAT_LABEL[a.category]}
                  </span>
                </td>
                <td className="dim">{a.warehouseName ?? "—"}</td>
                <td className="dim">{a.purchasedAt ? fmtDate(new Date(a.purchasedAt)) : "—"}</td>
                <td className="dim">Every {a.maintenanceIntervalDays}d</td>
                <td className="num">
                  {a.openWoCount > 0
                    ? <span className="badge badge-warn">{a.openWoCount}</span>
                    : <span className="dim">0</span>}
                </td>
                <td>
                  <button className="btn btn-sm btn-ghost" onClick={() => openEdit(a)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {showCreate && (
        <>
          <div className="scrim" onClick={() => setShowCreate(false)} />
          <div className="modal" style={{ width: "min(560px, 94vw)" }}>
            <div className="card-head">
              <span className="card-h">New Asset</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <FormBody onSubmit={handleCreate} isCreate />
          </div>
        </>
      )}

      {/* Edit modal */}
      {editAsset && (
        <>
          <div className="scrim" onClick={() => setEditAsset(null)} />
          <div className="modal" style={{ width: "min(560px, 94vw)" }}>
            <div className="card-head">
              <span className="card-h">Edit Asset</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditAsset(null)}>✕</button>
            </div>
            <FormBody onSubmit={handleEdit} isCreate={false} />
          </div>
        </>
      )}
    </>
  );
}
