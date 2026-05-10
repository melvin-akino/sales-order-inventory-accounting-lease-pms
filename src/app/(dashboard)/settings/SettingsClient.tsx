"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme, type Theme } from "@/components/ThemeProvider";
import { createUser, updateUser, resetPassword, createTechnician, updateTechnician } from "./actions";
import type { Role } from "@prisma/client";

// ── Types ─────────────────────────────────────────────────────────────────────
interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  customerId: string | null;
  technicianId: string | null;
  createdAt: string;
  customer: { name: string } | null;
  technician: { name: string } | null;
}

interface Customer { id: string; name: string }
interface Technician { id: string; name: string }

interface TechRow {
  id: string;
  name: string;
  specialization: string | null;
  active: boolean;
  createdAt: string;
}

interface Props {
  users: UserRow[];
  customers: Customer[];
  technicians: Technician[];
  allTechnicians: TechRow[];
  currentUserId: string;
}

const ALL_ROLES: Role[] = ["ADMIN", "AGENT", "FINANCE", "WAREHOUSE", "TECHNICIAN", "DRIVER", "CUSTOMER"];

const ROLE_COLOR: Record<Role, string> = {
  ADMIN:      "background:oklch(0.17 0.025 255);color:oklch(0.72 0.08 255)",
  AGENT:      "background:oklch(0.94 0.03 240);color:oklch(0.35 0.10 240)",
  FINANCE:    "background:oklch(0.94 0.04 145);color:oklch(0.32 0.10 145)",
  WAREHOUSE:  "background:oklch(0.94 0.04 75);color:oklch(0.32 0.10 65)",
  TECHNICIAN: "background:oklch(0.94 0.03 285);color:oklch(0.35 0.10 285)",
  DRIVER:     "background:oklch(0.94 0.03 30);color:oklch(0.38 0.10 30)",
  CUSTOMER:   "background:oklch(0.96 0.02 250);color:oklch(0.40 0.05 250)",
};

// ── Modal primitives ──────────────────────────────────────────────────────────
function Backdrop({ onClose }: { onClose: () => void }) {
  return <div className="scrim" onClick={onClose} />;
}

function ModalBox({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="modal" style={{ width: "min(480px,90vw)" }}>
        <div className="card-head" style={{ justifyContent: "space-between" }}>
          <span className="card-h">{title}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {children}
        </div>
      </div>
    </>
  );
}

// ── Create user modal ─────────────────────────────────────────────────────────
function CreateModal({ customers, technicians, onClose }: {
  customers: Customer[];
  technicians: Technician[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState("");
  const [role, setRole] = useState<Role>("AGENT");

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const customerRef = useRef<HTMLSelectElement>(null);
  const technicianRef = useRef<HTMLSelectElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    startTransition(async () => {
      try {
        await createUser({
          name: nameRef.current!.value.trim(),
          email: emailRef.current!.value.trim(),
          password: passwordRef.current!.value,
          role,
          customerId: role === "CUSTOMER" ? (customerRef.current?.value || undefined) : undefined,
          technicianId: role === "TECHNICIAN" ? (technicianRef.current?.value || undefined) : undefined,
        });
        router.refresh();
        onClose();
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <ModalBox title="Add User" onClose={onClose}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label className="field-label">Full Name</label>
          <input ref={nameRef} className="field-input" placeholder="Maria Santos" required />
        </div>
        <div>
          <label className="field-label">Email</label>
          <input ref={emailRef} type="email" className="field-input" placeholder="maria@medisupply.ph" required />
        </div>
        <div>
          <label className="field-label">Temporary Password</label>
          <input ref={passwordRef} type="password" className="field-input" placeholder="Min 8 characters" required minLength={8} />
        </div>
        <div>
          <label className="field-label">Role</label>
          <select className="field-input" value={role} onChange={e => setRole(e.target.value as Role)}>
            {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        {role === "CUSTOMER" && (
          <div>
            <label className="field-label">Link to Customer</label>
            <select ref={customerRef} className="field-input">
              <option value="">— No customer —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
        {role === "TECHNICIAN" && (
          <div>
            <label className="field-label">Link to Technician</label>
            <select ref={technicianRef} className="field-input">
              <option value="">— No technician profile —</option>
              {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}
        {err && <p style={{ color: "oklch(var(--err))", fontSize: 12.5 }}>{err}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Creating…" : "Create User"}
          </button>
        </div>
      </form>
    </ModalBox>
  );
}

// ── Edit user modal ───────────────────────────────────────────────────────────
function EditModal({ user, customers, technicians, currentUserId, onClose }: {
  user: UserRow;
  customers: Customer[];
  technicians: Technician[];
  currentUserId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState("");
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<Role>(user.role);
  const [active, setActive] = useState(user.active);
  const [customerId, setCustomerId] = useState(user.customerId ?? "");
  const [technicianId, setTechnicianId] = useState(user.technicianId ?? "");
  const [showPwReset, setShowPwReset] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [pwPending, startPwTransition] = useTransition();
  const [pwErr, setPwErr] = useState("");
  const [pwOk, setPwOk] = useState(false);

  function save(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    startTransition(async () => {
      try {
        await updateUser({
          id: user.id,
          name,
          role,
          customerId: role === "CUSTOMER" ? (customerId || null) : null,
          technicianId: role === "TECHNICIAN" ? (technicianId || null) : null,
          active,
        });
        router.refresh();
        onClose();
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  function doResetPw(e: React.FormEvent) {
    e.preventDefault();
    setPwErr(""); setPwOk(false);
    startPwTransition(async () => {
      try {
        await resetPassword(user.id, newPw);
        setPwOk(true);
        setNewPw("");
      } catch (e: unknown) {
        setPwErr(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  const isSelf = user.id === currentUserId;

  return (
    <ModalBox title={`Edit — ${user.name}`} onClose={onClose}>
      <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label className="field-label">Full Name</label>
          <input className="field-input" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div>
          <label className="field-label">Email</label>
          <input className="field-input" value={user.email} disabled style={{ opacity: 0.5 }} />
        </div>
        <div>
          <label className="field-label">Role</label>
          <select className="field-input" value={role} onChange={e => setRole(e.target.value as Role)}>
            {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        {role === "CUSTOMER" && (
          <div>
            <label className="field-label">Linked Customer</label>
            <select className="field-input" value={customerId} onChange={e => setCustomerId(e.target.value)}>
              <option value="">— None —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
        {role === "TECHNICIAN" && (
          <div>
            <label className="field-label">Linked Technician</label>
            <select className="field-input" value={technicianId} onChange={e => setTechnicianId(e.target.value)}>
              <option value="">— None —</option>
              {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="checkbox"
            id="user-active"
            checked={active}
            onChange={e => setActive(e.target.checked)}
            disabled={isSelf}
            style={{ width: 15, height: 15, accentColor: "oklch(var(--accent))" }}
          />
          <label htmlFor="user-active" style={{ fontSize: 13, cursor: isSelf ? "not-allowed" : "pointer" }}>
            Account active {isSelf ? "(cannot deactivate yourself)" : ""}
          </label>
        </div>

        {/* Password reset section */}
        <div style={{ borderTop: "1px solid oklch(var(--line))", paddingTop: 14 }}>
          <button type="button" className="btn btn-sm" onClick={() => setShowPwReset(v => !v)}>
            {showPwReset ? "Hide" : "Reset Password"}
          </button>
          {showPwReset && (
            <form onSubmit={doResetPw} style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <input
                type="password"
                className="field-input"
                placeholder="New password (min 8 chars)"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                minLength={8}
                style={{ flex: 1 }}
                required
              />
              <button type="submit" className="btn btn-accent btn-sm" disabled={pwPending}>
                {pwPending ? "Saving…" : "Save"}
              </button>
            </form>
          )}
          {pwErr && <p style={{ color: "oklch(var(--err))", fontSize: 12, marginTop: 6 }}>{pwErr}</p>}
          {pwOk && <p style={{ color: "oklch(0.50 0.10 155)", fontSize: 12, marginTop: 6 }}>Password updated.</p>}
        </div>

        {err && <p style={{ color: "oklch(var(--err))", fontSize: 12.5 }}>{err}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </ModalBox>
  );
}

// ── Appearance tab ────────────────────────────────────────────────────────────
const THEMES: { id: Theme; label: string; desc: string; preview: React.ReactNode }[] = [
  {
    id: "default",
    label: "Default",
    desc: "Light background, white cards, teal accent",
    preview: (
      <div style={{ display: "flex", height: 72, borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb" }}>
        <div style={{ width: 36, background: "#f4f5f7" }} />
        <div style={{ flex: 1, background: "#f9fafb", padding: "6px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ height: 8, width: "60%", background: "#e2e4e9", borderRadius: 3 }} />
          <div style={{ height: 28, background: "#fff", borderRadius: 5, border: "1px solid #e5e7eb" }} />
          <div style={{ height: 8, width: "40%", background: "#e2e4e9", borderRadius: 3 }} />
        </div>
      </div>
    ),
  },
  {
    id: "dark-sidebar",
    label: "Dark Sidebar",
    desc: "Dark navigation rail, light content area",
    preview: (
      <div style={{ display: "flex", height: 72, borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb" }}>
        <div style={{ width: 36, background: "#0d1117" }} />
        <div style={{ flex: 1, background: "#f9fafb", padding: "6px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ height: 8, width: "60%", background: "#e2e4e9", borderRadius: 3 }} />
          <div style={{ height: 28, background: "#fff", borderRadius: 5, border: "1px solid #e5e7eb" }} />
          <div style={{ height: 8, width: "40%", background: "#e2e4e9", borderRadius: 3 }} />
        </div>
      </div>
    ),
  },
  {
    id: "dark",
    label: "Dark",
    desc: "Full dark mode, easy on the eyes",
    preview: (
      <div style={{ display: "flex", height: 72, borderRadius: 6, overflow: "hidden", border: "1px solid #2d3748" }}>
        <div style={{ width: 36, background: "#0d1117" }} />
        <div style={{ flex: 1, background: "#161b22", padding: "6px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ height: 8, width: "60%", background: "#21262d", borderRadius: 3 }} />
          <div style={{ height: 28, background: "#1c2128", borderRadius: 5, border: "1px solid #30363d" }} />
          <div style={{ height: 8, width: "40%", background: "#21262d", borderRadius: 3 }} />
        </div>
      </div>
    ),
  },
];

function AppearanceTab() {
  const { theme, setTheme } = useTheme();

  return (
    <div style={{ maxWidth: 640 }}>
      <p style={{ fontSize: 13, color: "oklch(var(--ink-2))", marginBottom: 20 }}>
        Choose a theme for your interface. Your preference is saved per device.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {THEMES.map(t => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            style={{
              border: `2px solid ${theme === t.id ? "oklch(var(--accent))" : "oklch(var(--line))"}`,
              borderRadius: 10,
              padding: 12,
              background: theme === t.id ? "oklch(var(--accent-soft))" : "var(--panel)",
              cursor: "pointer",
              textAlign: "left",
              transition: "border-color 0.15s, background 0.15s",
            }}
          >
            <div style={{ marginBottom: 10 }}>{t.preview}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "oklch(var(--ink))", marginBottom: 3 }}>{t.label}</div>
            <div style={{ fontSize: 11.5, color: "oklch(var(--ink-3))" }}>{t.desc}</div>
            {theme === t.id && (
              <div style={{ marginTop: 8, fontSize: 11, color: "oklch(var(--accent-ink))", fontWeight: 600 }}>
                ✓ Active
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Users tab ─────────────────────────────────────────────────────────────────
function UsersTab({ users, customers, technicians, currentUserId }: {
  users: UserRow[];
  customers: Customer[];
  technicians: Technician[];
  currentUserId: string;
}) {
  const [modal, setModal] = useState<null | "create" | UserRow>(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"ALL" | Role>("ALL");

  const filtered = users.filter(u => {
    const matchRole = filterRole === "ALL" || u.role === filterRole;
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  return (
    <>
      <div className="filters">
        <div className="search-box" style={{ width: 220 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          className="field-input"
          style={{ width: 140, height: 32 }}
          value={filterRole}
          onChange={e => setFilterRole(e.target.value as "ALL" | Role)}
        >
          <option value="ALL">All roles</option>
          {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <div style={{ marginLeft: "auto" }}>
          <button className="btn btn-primary" onClick={() => setModal("create")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Add User
          </button>
        </div>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Linked To</th>
              <th>Status</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "24px 0", color: "oklch(var(--ink-3))" }}>No users found</td></tr>
            )}
            {filtered.map(u => (
              <tr key={u.id} style={{ cursor: "default", opacity: u.active ? 1 : 0.55 }}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center",
                      fontSize: 11, fontWeight: 600,
                      background: "oklch(var(--accent-soft))", color: "oklch(var(--accent-ink))",
                      flexShrink: 0,
                    }}>
                      {u.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                      <div style={{ fontSize: 11.5, color: "oklch(var(--ink-3))" }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="badge" style={{ cssText: ROLE_COLOR[u.role] } as React.CSSProperties}>
                    {u.role}
                  </span>
                </td>
                <td className="dim" style={{ fontSize: 12.5 }}>
                  {u.customer?.name ?? u.technician?.name ?? "—"}
                </td>
                <td>
                  <span className={`pill ${u.active ? "pill-DELIVERED" : "pill-CANCELLED"}`}>
                    {u.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="dim" style={{ fontSize: 12 }}>
                  {new Date(u.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                </td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setModal(u)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === "create" && (
        <CreateModal
          customers={customers}
          technicians={technicians}
          onClose={() => setModal(null)}
        />
      )}
      {modal && modal !== "create" && (
        <EditModal
          user={modal as UserRow}
          customers={customers}
          technicians={technicians}
          currentUserId={currentUserId}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

// ── Technician modals ─────────────────────────────────────────────────────────
function TechCreateModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [spec, setSpec] = useState("");
  const [err, setErr] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    start(async () => {
      try { await createTechnician({ name, specialization: spec || undefined }); router.refresh(); onClose(); }
      catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
    });
  }

  return (
    <ModalBox title="Add Technician" onClose={onClose}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div><label className="field-label">Full Name *</label><input className="field-input" value={name} onChange={e => setName(e.target.value)} placeholder="Juan dela Cruz" required /></div>
        <div><label className="field-label">Specialization</label><input className="field-input" value={spec} onChange={e => setSpec(e.target.value)} placeholder="Biomedical Engineering, Ventilators…" /></div>
        {err && <p style={{ color: "oklch(var(--err))", fontSize: 12.5 }}>{err}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={pending || !name}>{pending ? "Saving…" : "Add Technician"}</button>
        </div>
      </form>
    </ModalBox>
  );
}

function TechEditModal({ tech, onClose }: { tech: TechRow; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState(tech.name);
  const [spec, setSpec] = useState(tech.specialization ?? "");
  const [active, setActive] = useState(tech.active);
  const [err, setErr] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    start(async () => {
      try { await updateTechnician({ id: tech.id, name, specialization: spec || undefined, active }); router.refresh(); onClose(); }
      catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
    });
  }

  return (
    <ModalBox title={`Edit — ${tech.name}`} onClose={onClose}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div><label className="field-label">Full Name *</label><input className="field-input" value={name} onChange={e => setName(e.target.value)} required /></div>
        <div><label className="field-label">Specialization</label><input className="field-input" value={spec} onChange={e => setSpec(e.target.value)} /></div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input type="checkbox" id="tech-active" checked={active} onChange={e => setActive(e.target.checked)} style={{ width: 15, height: 15, accentColor: "oklch(var(--accent))" }} />
          <label htmlFor="tech-active" style={{ fontSize: 13, cursor: "pointer" }}>Active</label>
        </div>
        {err && <p style={{ color: "oklch(var(--err))", fontSize: 12.5 }}>{err}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Save Changes"}</button>
        </div>
      </form>
    </ModalBox>
  );
}

function TechniciansTab({ technicians }: { technicians: TechRow[] }) {
  const [modal, setModal] = useState<null | "create" | TechRow>(null);

  return (
    <>
      <div className="filters">
        <span style={{ fontSize: 13, color: "oklch(var(--ink-2))" }}>{technicians.length} technician{technicians.length !== 1 ? "s" : ""}</span>
        <div style={{ marginLeft: "auto" }}>
          <button className="btn btn-primary" onClick={() => setModal("create")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Add Technician
          </button>
        </div>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Name</th><th>Specialization</th><th>Status</th><th>Added</th><th></th></tr></thead>
          <tbody>
            {technicians.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: "24px 0", color: "oklch(var(--ink-3))" }}>No technicians yet</td></tr>
            )}
            {technicians.map(t => (
              <tr key={t.id} style={{ cursor: "default", opacity: t.active ? 1 : 0.55 }}>
                <td style={{ fontWeight: 500 }}>{t.name}</td>
                <td className="dim" style={{ fontSize: 12.5 }}>{t.specialization ?? "—"}</td>
                <td><span className={`pill ${t.active ? "pill-DELIVERED" : "pill-CANCELLED"}`}>{t.active ? "Active" : "Inactive"}</span></td>
                <td className="dim" style={{ fontSize: 12 }}>{new Date(t.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}</td>
                <td style={{ textAlign: "right" }}><button className="btn btn-ghost btn-sm" onClick={() => setModal(t)}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal === "create" && <TechCreateModal onClose={() => setModal(null)} />}
      {modal && modal !== "create" && <TechEditModal tech={modal as TechRow} onClose={() => setModal(null)} />}
    </>
  );
}

// ── Main SettingsClient ───────────────────────────────────────────────────────
export function SettingsClient({ users, customers, technicians, allTechnicians, currentUserId }: Props) {
  const [tab, setTab] = useState<"users" | "technicians" | "appearance">("users");

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <h1 style={{ fontSize: 17, fontWeight: 600, flex: 1 }}>Settings</h1>
        <span style={{ fontSize: 12, color: "oklch(var(--ink-3))" }}>{users.length} users</span>
      </div>

      <div className="tabs">
        <button className="tab" aria-selected={tab === "users"} onClick={() => setTab("users")}>
          Users
          <span className="tab-count">{users.length}</span>
        </button>
        <button className="tab" aria-selected={tab === "technicians"} onClick={() => setTab("technicians")}>
          Technicians
          <span className="tab-count">{allTechnicians.length}</span>
        </button>
        <button className="tab" aria-selected={tab === "appearance"} onClick={() => setTab("appearance")}>
          Appearance
        </button>
      </div>

      {tab === "users" && (
        <UsersTab
          users={users}
          customers={customers}
          technicians={technicians}
          currentUserId={currentUserId}
        />
      )}
      {tab === "technicians" && <TechniciansTab technicians={allTechnicians} />}
      {tab === "appearance" && <AppearanceTab />}
    </div>
  );
}
