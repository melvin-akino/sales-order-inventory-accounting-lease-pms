"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLease, updateLease } from "./actions";
import { useToast } from "@/components/ui/Toast";
import { peso, fmtDate } from "@/lib/utils";

interface Lease {
  id: string;
  startDate: string;
  endDate: string;
  monthlyRate: string;
  notes: string | null;
  active: boolean;
  customer: { id: string; name: string };
  assetNames: string[];
}
interface Customer { id: string; name: string; }
interface Asset { id: string; name: string; serialNumber: string; }

interface Props {
  leases: Lease[];
  customers: Customer[];
  assets: Asset[];
  role: string;
}

export function LeasesClient({ leases, customers, assets, role }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const canEdit = ["FINANCE", "ADMIN"].includes(role);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [cCustomer, setCCustomer] = useState(customers[0]?.id ?? "");
  const [cStart, setCStart] = useState("");
  const [cEnd, setCEnd] = useState("");
  const [cRate, setCRate] = useState("");
  const [cNotes, setCNotes] = useState("");
  const [cAssets, setCAssets] = useState<string[]>([]);

  // Edit modal
  const [editLease, setEditLease] = useState<Lease | null>(null);
  const [eEnd, setEEnd] = useState("");
  const [eRate, setERate] = useState("");
  const [eNotes, setENotes] = useState("");
  const [eActive, setEActive] = useState(true);

  function toggleAsset(id: string) {
    setCAssets((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function act(fn: () => Promise<void>, msg: string, done?: () => void) {
    startTransition(async () => {
      try {
        await fn();
        toast(msg, "success");
        done?.();
        router.refresh();
      } catch (e) {
        toast((e as Error).message, "error");
      }
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!cCustomer || !cStart || !cEnd || !cRate) { toast("Fill in all required fields", "error"); return; }
    act(
      () => createLease({ customerId: cCustomer, startDate: cStart, endDate: cEnd, monthlyRate: parseFloat(cRate), notes: cNotes, assetIds: cAssets }),
      "Lease created",
      () => { setShowCreate(false); setCStart(""); setCEnd(""); setCRate(""); setCNotes(""); setCAssets([]); },
    );
  }

  function openEdit(lease: Lease) {
    setEditLease(lease);
    setEEnd(lease.endDate.slice(0, 10));
    setERate(lease.monthlyRate);
    setENotes(lease.notes ?? "");
    setEActive(lease.active);
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editLease) return;
    act(
      () => updateLease(editLease.id, { endDate: eEnd, monthlyRate: parseFloat(eRate), notes: eNotes, active: eActive }),
      "Lease updated",
      () => setEditLease(null),
    );
  }

  return (
    <>
      {canEdit && (
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[18px] font-semibold">Equipment Leases</h1>
          <button className="btn btn-accent" onClick={() => setShowCreate(true)}>
            + New Lease
          </button>
        </div>
      )}

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th className="id">Lease ID</th>
              <th>Customer</th>
              <th>Assets</th>
              <th>Start</th>
              <th>End</th>
              <th className="num">Monthly Rate</th>
              <th>Status</th>
              {canEdit && <th style={{ width: 80 }}></th>}
            </tr>
          </thead>
          <tbody>
            {leases.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 8 : 7}>
                  <div className="empty-state">
                    <div className="empty-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" />
                      </svg>
                    </div>
                    No leases found
                  </div>
                </td>
              </tr>
            )}
            {leases.map((l) => {
              const now = new Date();
              const active = l.active && new Date(l.startDate) <= now && new Date(l.endDate) >= now;
              return (
                <tr key={l.id} style={{ cursor: "default" }}>
                  <td className="id">{l.id.slice(-8)}</td>
                  <td>{l.customer.name}</td>
                  <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {l.assetNames.join(", ") || "—"}
                  </td>
                  <td className="dim">{fmtDate(new Date(l.startDate))}</td>
                  <td className="dim">{fmtDate(new Date(l.endDate))}</td>
                  <td className="num">{peso(l.monthlyRate)}/mo</td>
                  <td>
                    {!l.active ? (
                      <span className="pill pill-CANCELLED">Inactive</span>
                    ) : active ? (
                      <span className="pill pill-APPROVED">Active</span>
                    ) : (
                      <span className="pill pill-PENDING">Expired</span>
                    )}
                  </td>
                  {canEdit && (
                    <td>
                      <button className="btn btn-sm btn-ghost" onClick={() => openEdit(l)}>Edit</button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {showCreate && (
        <>
          <div className="scrim" onClick={() => setShowCreate(false)} />
          <div className="modal" style={{ width: "min(580px, 94vw)", maxHeight: "90dvh", overflowY: "auto" }}>
            <div className="card-head">
              <span className="card-h">New Equipment Lease</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="card-body flex flex-col gap-3">
              <div>
                <label className="field-label">Customer *</label>
                <select className="field-input" value={cCustomer} onChange={e => setCCustomer(e.target.value)} required>
                  <option value="">Select customer…</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-2col">
                <div>
                  <label className="field-label">Start Date *</label>
                  <input type="date" className="field-input" value={cStart} onChange={e => setCStart(e.target.value)} required />
                </div>
                <div>
                  <label className="field-label">End Date *</label>
                  <input type="date" className="field-input" value={cEnd} onChange={e => setCEnd(e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="field-label">Monthly Rate (₱) *</label>
                <input type="number" min={0} step={0.01} className="field-input" value={cRate} onChange={e => setCRate(e.target.value)} placeholder="0.00" required />
              </div>
              <div>
                <label className="field-label">Notes</label>
                <textarea className="field-input" rows={2} value={cNotes} onChange={e => setCNotes(e.target.value)} placeholder="Lease terms or conditions…" />
              </div>
              {assets.length > 0 && (
                <div>
                  <label className="field-label">Assets Included</label>
                  <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto p-2 rounded-[7px] border" style={{ borderColor: "oklch(var(--line))" }}>
                    {assets.map(a => (
                      <label key={a.id} className="flex items-center gap-2 text-[12.5px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cAssets.includes(a.id)}
                          onChange={() => toggleAsset(a.id)}
                          className="w-3.5 h-3.5"
                        />
                        {a.name} <span className="text-[11px]" style={{ color: "oklch(var(--ink-3))" }}>({a.serialNumber})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" className="btn" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-accent" disabled={isPending}>
                  {isPending ? "Creating…" : "Create Lease"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Edit modal */}
      {editLease && (
        <>
          <div className="scrim" onClick={() => setEditLease(null)} />
          <div className="modal" style={{ width: "min(480px, 94vw)" }}>
            <div className="card-head">
              <span className="card-h">Edit Lease — {editLease.customer.name}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditLease(null)}>✕</button>
            </div>
            <form onSubmit={handleEdit} className="card-body flex flex-col gap-3">
              <div>
                <label className="field-label">End Date</label>
                <input type="date" className="field-input" value={eEnd} onChange={e => setEEnd(e.target.value)} />
              </div>
              <div>
                <label className="field-label">Monthly Rate (₱)</label>
                <input type="number" min={0} step={0.01} className="field-input" value={eRate} onChange={e => setERate(e.target.value)} />
              </div>
              <div>
                <label className="field-label">Notes</label>
                <textarea className="field-input" rows={2} value={eNotes} onChange={e => setENotes(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="lactive" checked={eActive} onChange={e => setEActive(e.target.checked)} className="w-3.5 h-3.5" />
                <label htmlFor="lactive" className="text-[12.5px]" style={{ color: "oklch(var(--ink-2))" }}>Lease active</label>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" className="btn" onClick={() => setEditLease(null)}>Cancel</button>
                <button type="submit" className="btn btn-accent" disabled={isPending}>
                  {isPending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}
