"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createWorkOrder, updateWoStatus, assignTechnician, addWoNote } from "./actions";
import { useToast } from "@/components/ui/Toast";
import { fmtDate, fmtDateTime } from "@/lib/utils";
import type { WoStatus, WoPriority } from "@prisma/client";

interface WoNote { id: string; text: string; by: string; at: string; }
interface WorkOrder {
  id: string;
  title: string;
  type: string;
  status: WoStatus;
  priority: WoPriority;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  asset: { id: string; name: string; serialNumber: string };
  technician: { id: string; name: string } | null;
  notes: WoNote[];
}
interface Asset { id: string; name: string; serialNumber: string; }
interface Technician { id: string; name: string; specialization: string | null; }

interface Props {
  workOrders: WorkOrder[];
  assets: Asset[];
  technicians: Technician[];
  role: string;
}

const COLS: WoStatus[] = ["PENDING", "IN_PROGRESS", "NEEDS_PARTS", "COMPLETED"];
const COL_LABEL: Record<WoStatus, string> = {
  PENDING:     "Pending",
  IN_PROGRESS: "In Progress",
  NEEDS_PARTS: "Needs Parts",
  COMPLETED:   "Completed",
};
const COL_DOT: Record<WoStatus, string> = {
  PENDING:     "oklch(0.55 0.02 250)",
  IN_PROGRESS: "oklch(0.55 0.15 195)",
  NEEDS_PARTS: "oklch(0.55 0.15 65)",
  COMPLETED:   "oklch(0.50 0.12 155)",
};
const PRIORITY_COLOR: Record<WoPriority, string> = {
  LOW:    "oklch(0.55 0.02 250)",
  MEDIUM: "oklch(0.55 0.12 240)",
  HIGH:   "oklch(0.55 0.14 65)",
  URGENT: "oklch(0.50 0.18 25)",
};

const NEXT_STATUS: Record<WoStatus, WoStatus | null> = {
  PENDING:     "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
  NEEDS_PARTS: "IN_PROGRESS",
  COMPLETED:   null,
};
const NEXT_LABEL: Record<WoStatus, string> = {
  PENDING:     "Start",
  IN_PROGRESS: "Complete",
  NEEDS_PARTS: "Resume",
  COMPLETED:   "",
};

export function PmsClient({ workOrders, assets, technicians, role }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [detail, setDetail] = useState<WorkOrder | null>(null);
  const [newNote, setNewNote] = useState("");
  const [statusNote, setStatusNote] = useState("");

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createAsset, setCreateAsset] = useState(assets[0]?.id ?? "");
  const [createTitle, setCreateTitle] = useState("");
  const [createType, setCreateType] = useState("PREVENTIVE");
  const [createPriority, setCreatePriority] = useState<WoPriority>("MEDIUM");
  const [createTech, setCreateTech] = useState("");
  const [createDue, setCreateDue] = useState("");

  const canCreate = ["WAREHOUSE", "ADMIN"].includes(role);
  const canAssign = ["WAREHOUSE", "ADMIN"].includes(role);

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
    if (!createAsset || !createTitle.trim()) { toast("Fill in required fields", "error"); return; }
    act(
      () => createWorkOrder({ assetId: createAsset, type: createType, title: createTitle, priority: createPriority, technicianId: createTech || undefined, dueDate: createDue || undefined }),
      "Work order created",
      () => { setShowCreate(false); setCreateTitle(""); setCreateDue(""); setCreateTech(""); },
    );
  }

  function handleStatusChange(wo: WorkOrder, nextStatus: WoStatus) {
    act(
      () => updateWoStatus(wo.id, nextStatus, statusNote || undefined),
      `Status → ${COL_LABEL[nextStatus]}`,
      () => { setStatusNote(""); if (detail?.id === wo.id) setDetail((d) => d ? { ...d, status: nextStatus } : d); },
    );
  }

  function handleMarkParts(wo: WorkOrder) {
    act(
      () => updateWoStatus(wo.id, "NEEDS_PARTS", undefined),
      "Flagged as Needs Parts",
      () => { if (detail?.id === wo.id) setDetail((d) => d ? { ...d, status: "NEEDS_PARTS" } : d); },
    );
  }

  function handleAssign(wo: WorkOrder, techId: string) {
    act(() => assignTechnician(wo.id, techId), "Technician assigned");
  }

  function handleAddNote() {
    if (!detail || !newNote.trim()) return;
    act(
      () => addWoNote(detail.id, newNote),
      "Note added",
      () => setNewNote(""),
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-semibold">Work Orders</h1>
        {canCreate && (
          <button className="btn btn-accent" onClick={() => setShowCreate(true)}>
            + New Work Order
          </button>
        )}
      </div>

      <div className="kanban">
        {COLS.map((col) => {
          const items = workOrders.filter((wo) => wo.status === col);
          return (
            <div key={col} className="kcol">
              <div className="kcol-h">
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: COL_DOT[col], flexShrink: 0 }} />
                {COL_LABEL[col]}
                <span className="ml-auto badge">{items.length}</span>
              </div>

              {items.length === 0 && (
                <div className="text-[11.5px] text-center py-6" style={{ color: "oklch(var(--ink-4))" }}>Empty</div>
              )}

              {items.map((wo) => {
                const next = NEXT_STATUS[wo.status];
                const overdue = wo.dueDate && new Date(wo.dueDate) < new Date() && wo.status !== "COMPLETED";
                return (
                  <div
                    key={wo.id}
                    className="kcard flex flex-col gap-1.5"
                    style={overdue ? { borderColor: "oklch(0.80 0.08 25)" } : undefined}
                  >
                    <div className="flex items-start gap-1">
                      <span
                        className="text-[10px] font-semibold px-1.5 py-px rounded"
                        style={{ background: PRIORITY_COLOR[wo.priority] + "22", color: PRIORITY_COLOR[wo.priority] }}
                      >
                        {wo.priority}
                      </span>
                      {overdue && (
                        <span className="badge badge-warn text-[10px]">OVERDUE</span>
                      )}
                    </div>
                    <div
                      className="text-[12.5px] font-medium cursor-pointer hover:underline"
                      style={{ color: "oklch(var(--ink))" }}
                      onClick={() => setDetail(wo)}
                    >
                      {wo.title}
                    </div>
                    <div className="text-[11.5px]" style={{ color: "oklch(var(--ink-2))" }}>{wo.asset.name}</div>
                    <div className="text-[11px]" style={{ color: "oklch(var(--ink-3))" }}>
                      {wo.technician?.name ?? "Unassigned"}
                      {wo.dueDate ? ` · Due ${fmtDate(new Date(wo.dueDate))}` : ""}
                    </div>
                    {next && (
                      <div className="flex gap-1 mt-1">
                        <button
                          className="btn btn-sm flex-1"
                          style={{ justifyContent: "center" }}
                          onClick={() => handleStatusChange(wo, next)}
                          disabled={isPending}
                        >
                          {NEXT_LABEL[wo.status]}
                        </button>
                        {wo.status === "IN_PROGRESS" && (
                          <button
                            className="btn btn-sm"
                            title="Needs Parts"
                            onClick={() => handleMarkParts(wo)}
                            disabled={isPending}
                          >
                            🔧
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Detail drawer */}
      {detail && (
        <>
          <div className="scrim" onClick={() => setDetail(null)} />
          <div className="drawer" style={{ width: "min(520px, 92vw)" }}>
            <div className="card-head" style={{ borderBottom: "1px solid oklch(var(--line))" }}>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate">{detail.title}</div>
                <div className="text-[11px] mt-0.5" style={{ color: "oklch(var(--ink-3))" }}>
                  {detail.asset.name} · {detail.asset.serialNumber}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setDetail(null)}>✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {/* Meta */}
              <div className="dl">
                <dt>Status</dt>
                <dd>
                  <span className="pill" style={{ background: COL_DOT[detail.status] + "22", color: COL_DOT[detail.status] }}>
                    {COL_LABEL[detail.status]}
                  </span>
                </dd>
                <dt>Priority</dt>
                <dd>
                  <span style={{ color: PRIORITY_COLOR[detail.priority], fontWeight: 500 }}>{detail.priority}</span>
                </dd>
                <dt>Type</dt><dd>{detail.type}</dd>
                <dt>Created</dt><dd>{fmtDate(new Date(detail.createdAt))}</dd>
                {detail.dueDate && <><dt>Due</dt><dd>{fmtDate(new Date(detail.dueDate))}</dd></>}
                {detail.completedAt && <><dt>Completed</dt><dd>{fmtDate(new Date(detail.completedAt))}</dd></>}
              </div>

              {/* Assign technician */}
              {canAssign && (
                <div>
                  <label className="field-label">Assigned Technician</label>
                  <select
                    className="field-input"
                    defaultValue={detail.technician?.id ?? ""}
                    onChange={(e) => handleAssign(detail, e.target.value)}
                    disabled={isPending}
                  >
                    <option value="">Unassigned</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}{t.specialization ? ` — ${t.specialization}` : ""}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status change */}
              {NEXT_STATUS[detail.status] && (
                <div className="card">
                  <div className="card-body flex flex-col gap-3">
                    <div className="text-[12.5px] font-medium">Update Status</div>
                    <textarea
                      className="field-input"
                      rows={2}
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Optional note about this status change…"
                    />
                    <div className="flex gap-2">
                      {NEXT_STATUS[detail.status] && (
                        <button
                          className="btn btn-sm btn-accent"
                          onClick={() => handleStatusChange(detail, NEXT_STATUS[detail.status]!)}
                          disabled={isPending}
                        >
                          → {COL_LABEL[NEXT_STATUS[detail.status]!]}
                        </button>
                      )}
                      {detail.status === "IN_PROGRESS" && (
                        <button className="btn btn-sm" onClick={() => handleMarkParts(detail)} disabled={isPending}>
                          🔧 Needs Parts
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <div className="text-[12.5px] font-medium mb-2">Notes ({detail.notes.length})</div>
                <div className="flex flex-col gap-2 mb-3">
                  {detail.notes.length === 0 && (
                    <p className="text-[12px]" style={{ color: "oklch(var(--ink-3))" }}>No notes yet.</p>
                  )}
                  {detail.notes.map((n) => (
                    <div key={n.id} className="card" style={{ padding: "10px 14px" }}>
                      <div className="text-[12.5px]" style={{ color: "oklch(var(--ink))" }}>{n.text}</div>
                      <div className="text-[11px] mt-1" style={{ color: "oklch(var(--ink-3))" }}>
                        {n.by} · {fmtDateTime(new Date(n.at))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    className="field-input flex-1"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note…"
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddNote(); } }}
                  />
                  <button className="btn btn-sm" onClick={handleAddNote} disabled={isPending || !newNote.trim()}>
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Create modal */}
      {showCreate && (
        <>
          <div className="scrim" onClick={() => setShowCreate(false)} />
          <div className="modal">
            <div className="card-head">
              <span className="card-h">New Work Order</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="card-body flex flex-col gap-3">
              {assets.length === 0 ? (
                <p className="text-[13px]" style={{ color: "oklch(var(--ink-2))" }}>No assets found. Add assets first.</p>
              ) : (
                <>
                  <div>
                    <label className="field-label">Asset *</label>
                    <select className="field-input" value={createAsset} onChange={e => setCreateAsset(e.target.value)} required>
                      {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.serialNumber})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Title *</label>
                    <input className="field-input" value={createTitle} onChange={e => setCreateTitle(e.target.value)} placeholder="Work order title" required />
                  </div>
                  <div className="form-2col">
                    <div>
                      <label className="field-label">Type</label>
                      <select className="field-input" value={createType} onChange={e => setCreateType(e.target.value)}>
                        <option value="PREVENTIVE">Preventive</option>
                        <option value="CORRECTIVE">Corrective</option>
                        <option value="INSTALLATION">Installation</option>
                        <option value="INSPECTION">Inspection</option>
                      </select>
                    </div>
                    <div>
                      <label className="field-label">Priority</label>
                      <select className="field-input" value={createPriority} onChange={e => setCreatePriority(e.target.value as WoPriority)}>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-2col">
                    <div>
                      <label className="field-label">Assign Technician</label>
                      <select className="field-input" value={createTech} onChange={e => setCreateTech(e.target.value)}>
                        <option value="">Unassigned</option>
                        {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="field-label">Due Date</label>
                      <input type="date" className="field-input" value={createDue} onChange={e => setCreateDue(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button type="button" className="btn" onClick={() => setShowCreate(false)}>Cancel</button>
                    <button type="submit" className="btn btn-accent" disabled={isPending}>
                      {isPending ? "Creating…" : "Create"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </>
      )}
    </>
  );
}
