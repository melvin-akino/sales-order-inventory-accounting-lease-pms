"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useMobileNav } from "@/components/layout/NavContext";

const BREADCRUMB_MAP: Record<string, string> = {
  orders:    "Sales Orders",
  approvals: "Approvals",
  warehouse: "Warehouse",
  shipments: "Shipments",
  inventory: "Inventory",
  leases:    "Leases",
  pms:       "PMS / Work Orders",
  catalog:   "Catalog",
  customers: "Customers",
  suppliers: "Suppliers",
  ledger:    "Ledger",
  settings:  "Settings",
  portal:    "My Portal",
  dashboard: "Dashboard",
  new:       "New",
};

function breadcrumbs(pathname: string): string[] {
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((p) => BREADCRUMB_MAP[p] ?? p);
}

const ROLE_COLOR: Record<string, string> = {
  ADMIN:      "bg-[oklch(var(--accent)/0.15)] text-[oklch(var(--accent))]",
  FINANCE:    "bg-[oklch(0.97_0.03_145/0.15)] text-[oklch(0.55_0.15_145)]",
  WAREHOUSE:  "bg-[oklch(0.97_0.03_230/0.15)] text-[oklch(0.55_0.15_230)]",
  AGENT:      "bg-[oklch(0.97_0.03_280/0.15)] text-[oklch(0.55_0.15_280)]",
  TECHNICIAN: "bg-[oklch(0.97_0.03_60/0.15)]  text-[oklch(0.55_0.15_60)]",
  CUSTOMER:   "bg-[oklch(0.97_0.03_20/0.15)]  text-[oklch(0.55_0.15_20)]",
  DRIVER:     "bg-[oklch(0.97_0.03_300/0.15)] text-[oklch(0.55_0.15_300)]",
};

export function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { toggle } = useMobileNav();
  const crumbs = breadcrumbs(pathname);
  const role = session?.user?.role ?? "";

  return (
    <header className="topbar">
      <button
        onClick={toggle}
        className="hamburger"
        aria-label="Toggle menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
        <span className="topbar-crumb-home">Home</span>
        {crumbs.map((crumb, i) => (
          <span key={i} className="topbar-crumb-item">
            <span className="topbar-crumb-sep">/</span>
            <span className={i === crumbs.length - 1 ? "topbar-crumb-active" : "topbar-crumb"}>
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      <div className="topbar-right">
        {role && (
          <span className={`topbar-role-chip ${ROLE_COLOR[role] ?? ""}`}>
            {role}
          </span>
        )}
      </div>
    </header>
  );
}
