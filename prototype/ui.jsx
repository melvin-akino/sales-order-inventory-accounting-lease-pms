// ui.jsx — shared UI components: icons, pills, toasts, etc.

const Icon = {
  Search: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5"/><path d="m11 11 3 3"/></svg>),
  Plus: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3v10M3 8h10" strokeLinecap="round"/></svg>),
  Minus: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8h10" strokeLinecap="round"/></svg>),
  Check: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 8 3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  X: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round"/></svg>),
  Chevron: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m6 4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  ChevronDown: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  Filter: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2.5 4h11M4.5 8h7M6.5 12h3" strokeLinecap="round"/></svg>),
  Order: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="2.5" width="10" height="11" rx="1.5"/><path d="M5.5 6h5M5.5 8.5h5M5.5 11h3" strokeLinecap="round"/></svg>),
  Inbox: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2.5 9.5v3a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3M2.5 9.5l1.6-5a1 1 0 0 1 .96-.7h5.88a1 1 0 0 1 .96.7l1.6 5M2.5 9.5h3l1 2h3l1-2h3" strokeLinejoin="round"/></svg>),
  Box: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m8 2.5 5.5 2.5v6L8 13.5 2.5 11V5L8 2.5Z" strokeLinejoin="round"/><path d="m2.5 5 5.5 2.5L13.5 5M8 7.5v6" /></svg>),
  Truck: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1.5 4h7v7h-7zM8.5 6.5h3l2 2.5v2H8.5z" strokeLinejoin="round"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="11" cy="12" r="1.2"/></svg>),
  Users: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="6" r="2.5"/><path d="M2 13c0-2.2 1.8-4 4-4s4 1.8 4 4M11 7.5a2 2 0 1 0 0-3M14 13c0-1.7-1-3.2-2.5-3.7"/></svg>),
  Pkg: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 5l6-2.5L14 5v6l-6 2.5L2 11V5z" strokeLinejoin="round"/><path d="M2 5l6 2.5m0 0L14 5M8 7.5v6"/></svg>),
  Chart: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 13.5h12M4 11V8M7 11V5M10 11V7M13 11V4" strokeLinecap="round"/></svg>),
  Doc: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3.5 2h6L13 5.5V14H3.5z" strokeLinejoin="round"/><path d="M9 2v4h4M5.5 8.5h5M5.5 11h3"/></svg>),
  Cart: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1.5 2.5h2l1.4 8a1 1 0 0 0 1 .8h6.4" strokeLinecap="round"/><path d="m4 4.5 10 .5-1.2 5H5.2" strokeLinejoin="round"/><circle cx="6" cy="13.5" r="1"/><circle cx="12" cy="13.5" r="1"/></svg>),
  Pin: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1.5c-2.5 0-4.5 2-4.5 4.5 0 3 4.5 8 4.5 8s4.5-5 4.5-8c0-2.5-2-4.5-4.5-4.5z" strokeLinejoin="round"/><circle cx="8" cy="6" r="1.5"/></svg>),
  Clock: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 4.5V8l2.5 1.5" strokeLinecap="round"/></svg>),
  Print: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6V2.5h8V6M4 12H2.5V7h11v5H12M4 9.5h8V14H4z" strokeLinejoin="round"/></svg>),
  Down: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v9m-3-3 3 3 3-3M3 13.5h10" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  Dot: () => (<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="2"/></svg>),
  Bell: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 11V7a4 4 0 0 1 8 0v4l1 2H3l1-2zM6.5 13.5a1.5 1.5 0 0 0 3 0" strokeLinejoin="round"/></svg>),
  Cmd: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5.5 5.5h5v5h-5z"/><path d="M5.5 5.5V4a1.5 1.5 0 1 0-1.5 1.5h1.5zM10.5 5.5V4a1.5 1.5 0 1 1 1.5 1.5h-1.5zM5.5 10.5V12a1.5 1.5 0 1 1-1.5-1.5h1.5zM10.5 10.5V12a1.5 1.5 0 1 0 1.5-1.5h-1.5z" strokeLinejoin="round"/></svg>),
  ArrowUp: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 13V3m-3 3 3-3 3 3" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  ArrowDown: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3v10m-3-3 3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  Edit: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 2.5l2.5 2.5-7 7H4v-2.5l7-7z" strokeLinejoin="round"/></svg>),
  More: () => (<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="3.5" cy="8" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="12.5" cy="8" r="1.2"/></svg>),
  Tag: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2.5 8.5V3.5h5L13 9l-4.5 4.5z" strokeLinejoin="round"/><circle cx="5.5" cy="6.5" r="0.8" fill="currentColor"/></svg>),
  ExternalLink: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 3h4v4M13 3l-6 6M11.5 9.5v3.5h-9V4.5h3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  Wrench: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 2a3 3 0 0 0-2.6 4.5L2.5 12.5l1 1L9.5 7.6A3 3 0 1 0 11 2z" strokeLinejoin="round"/></svg>),
  Monitor: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="8" rx="1"/><path d="M5.5 13.5h5M8 11v2.5" strokeLinecap="round"/></svg>),
  Wallet: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2.5 5.5v7a1 1 0 0 0 1 1h10V5.5h-10a1 1 0 0 1 0-2h9" strokeLinejoin="round"/><circle cx="11" cy="9.5" r="0.8" fill="currentColor"/></svg>),
};

function StatePill({ state }) {
  return <span className="pill" data-state={state}>{STATE_LABEL[state] || state}</span>;
}

function StepBar({ current }) {
  const idx = STATES.indexOf(current);
  return (
    <div className="stepbar">
      {STATES.map((s, i) => (
        <div key={s} className="stp"
             data-on={i < idx ? "1" : "0"}
             data-cur={i === idx ? "1" : "0"}>
          {STATE_LABEL[s]}
        </div>
      ))}
    </div>
  );
}

function Avatar({ name, size = 26 }) {
  const initials = name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div className="sb-avatar" style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}>
      {initials}
    </div>
  );
}

// Toast manager
const ToastCtx = React.createContext(null);
function ToastProvider({ children }) {
  const [items, setItems] = React.useState([]);
  const push = React.useCallback((msg, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => [...prev, { id, msg, ...opts }]);
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), opts.duration || 2800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-stack">
        {items.map((t) => (
          <div key={t.id} className="toast">
            <Icon.Check />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
const useToast = () => React.useContext(ToastCtx);

// Format helpers
function fmtRel(iso) {
  const t = new Date(iso).getTime();
  const now = new Date("2026-05-09T09:00:00+08:00").getTime();
  const dif = (now - t) / 1000;
  if (Math.abs(dif) < 60) return "just now";
  if (Math.abs(dif) < 3600) return Math.round(dif / 60) + "m ago";
  if (Math.abs(dif) < 86400) return Math.round(dif / 3600) + "h ago";
  const d = Math.round(dif / 86400);
  if (d > 0) return d + "d ago";
  return "in " + (-d) + "d";
}
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}
function fmtDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" }) + " · " +
         d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: false });
}

// Dropdown / select
function Select({ value, onChange, options, placeholder, className = "" }) {
  return (
    <select className={`input ${className}`} value={value || ""} onChange={(e) => onChange(e.target.value)}>
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map((o) => {
        const v = typeof o === "object" ? o.value : o;
        const l = typeof o === "object" ? o.label : o;
        return <option key={v} value={v}>{l}</option>;
      })}
    </select>
  );
}

Object.assign(window, {
  Icon, StatePill, StepBar, Avatar, ToastProvider, useToast,
  fmtRel, fmtDate, fmtDateTime, Select,
});
