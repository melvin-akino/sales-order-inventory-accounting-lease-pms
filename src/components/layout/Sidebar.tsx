"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useMobileNav } from "@/components/layout/NavContext";
import type { NavItem } from "@/types";
import type { Role } from "@prisma/client";

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard",      href: "/dashboard", icon: "home",          roles: ["AGENT", "FINANCE", "WAREHOUSE", "TECHNICIAN", "DRIVER", "ADMIN"] },
  { id: "orders",    label: "Sales Orders",   href: "/orders",    icon: "shopping-cart", roles: ["AGENT", "FINANCE", "WAREHOUSE", "ADMIN", "CUSTOMER"] },
  { id: "approvals", label: "Approvals",      href: "/approvals", icon: "check-square",  roles: ["FINANCE", "ADMIN"] },
  { id: "warehouse", label: "Warehouse",      href: "/warehouse", icon: "package",       roles: ["WAREHOUSE", "ADMIN"] },
  { id: "shipments", label: "Shipments",      href: "/shipments", icon: "truck",         roles: ["WAREHOUSE", "FINANCE", "ADMIN", "DRIVER"] },
  { id: "inventory", label: "Inventory",      href: "/inventory", icon: "layers",        roles: ["WAREHOUSE", "ADMIN"] },
  { id: "portal",    label: "My Portal",      href: "/portal",    icon: "user-circle",   roles: ["CUSTOMER"] },
  { id: "leases",    label: "Leases",         href: "/leases",    icon: "file-text",     roles: ["FINANCE", "ADMIN"] },
  { id: "pms",       label: "PMS / Work Ord", href: "/pms",       icon: "tool",          roles: ["TECHNICIAN", "WAREHOUSE", "ADMIN"] },
  { id: "equipment", label: "Equipment",      href: "/equipment", icon: "cpu",           roles: ["WAREHOUSE", "ADMIN"] },
  { id: "catalog",   label: "Catalog",        href: "/catalog",   icon: "grid",          roles: ["AGENT", "FINANCE", "ADMIN"] },
  { id: "customers", label: "Customers",      href: "/customers", icon: "users",         roles: ["AGENT", "FINANCE", "ADMIN"] },
  { id: "suppliers", label: "Suppliers",      href: "/suppliers", icon: "briefcase",     roles: ["WAREHOUSE", "FINANCE", "ADMIN"] },
  { id: "ledger",    label: "Accounting",     href: "/ledger",    icon: "book-open",     roles: ["FINANCE", "ADMIN"] },
  { id: "settings",  label: "Settings",       href: "/settings",  icon: "settings",      roles: ["ADMIN"] },
];

const ICON_PATHS: Record<string, string> = {
  "home":          "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  "shopping-cart": "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
  "check-square":  "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  "package":       "M16.5 9.4 7.55 4.24M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96 12 12.01l8.73-5.05M12 22.08V12",
  "truck":         "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  "layers":        "M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  "file-text":     "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  "tool":          "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  "grid":          "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  "users":         "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  "briefcase":     "M20 7H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2",
  "user-circle":   "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  "book-open":     "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z",
  "settings":      "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  "cpu":           "M18 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3",
  "log-out":       "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
};

function Icon({ name, className }: { name: string; className?: string }) {
  const d = ICON_PATHS[name];
  if (!d) return null;
  return (
    <svg
      width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      {d.split("M").filter(Boolean).map((seg, i) => (
        <path key={i} d={"M" + seg} />
      ))}
    </svg>
  );
}

function canSee(item: NavItem, role: Role) {
  return !item.roles || item.roles.includes(role);
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { open, close } = useMobileNav();
  const role = session?.user?.role as Role | undefined;

  if (!role) return null;

  const visible = NAV_ITEMS.filter((item) => canSee(item, role));

  return (
    <>
      {/* Mobile scrim */}
      {open && (
        <div className="mobile-scrim" onClick={close} aria-hidden />
      )}
      <aside className="sidebar" data-mobile-open={open ? "true" : "false"}>
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </div>
        <span className="sidebar-org">
          {process.env.NEXT_PUBLIC_ORG ?? "MediSupply"}
        </span>
        <button
          onClick={close}
          className="sidebar-signout ml-auto"
          style={{ display: "none" }}
          aria-label="Close menu"
          data-mobile-close
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className="sidebar-nav">
        {visible.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn("sidebar-item", active && "active")}
            >
              <Icon name={item.icon} />
              <span className="sidebar-label">{item.label}</span>
              {item.count != null && item.count > 0 && (
                <span className="sidebar-badge">{item.count}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {(session?.user?.name ?? "?")[0].toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{session?.user?.name}</span>
            <span className="sidebar-user-role">{role}</span>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="sidebar-signout"
          title="Sign out"
        >
          <Icon name="log-out" />
        </button>
      </div>
    </aside>
    </>
  );
}
