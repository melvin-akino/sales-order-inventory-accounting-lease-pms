"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { HELP_ARTICLES, QUICK_STARTS } from "@/lib/help-articles";
import type { HelpRole } from "@/lib/help-articles";

const ROLE_LABELS: Record<HelpRole, string> = {
  ADMIN: "Admin",
  AGENT: "Sales Agent",
  FINANCE: "Finance",
  WAREHOUSE: "Warehouse",
  TECHNICIAN: "Technician",
  DRIVER: "Driver",
  CUSTOMER: "Customer",
};


export default function HelpPage() {
  const { data: session } = useSession();
  const role = session?.user?.role as HelpRole | undefined;

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<HelpRole | "ALL">("ALL");

  const myQuickStart = role ? QUICK_STARTS.find((q) => q.role === role) : null;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return HELP_ARTICLES.filter((a) => {
      const matchRole = roleFilter === "ALL" || a.roles.includes(roleFilter);
      const matchSearch = !q || a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q) || a.overview.toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [search, roleFilter]);

  return (
    <div className="max-w-[960px]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[22px] font-semibold mb-1">Help Center</h1>
        <p style={{ color: "oklch(var(--ink-3))", fontSize: 14 }}>
          Step-by-step guides and workflows for every role in the system.
        </p>
      </div>

      {/* Quick Start for current user role */}
      {myQuickStart && (
        <div className="card mb-6" style={{ background: "oklch(var(--accent) / 0.06)", border: "1px solid oklch(var(--accent) / 0.2)" }}>
          <div className="card-body">
            <div className="flex items-start gap-4">
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "oklch(var(--accent) / 0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "oklch(var(--accent))", flexShrink: 0,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-semibold mb-0.5" style={{ fontSize: 14 }}>
                  Quick Start — {ROLE_LABELS[myQuickStart.role]}
                </div>
                <p style={{ fontSize: 13, color: "oklch(var(--ink-3))", marginBottom: 12 }}>
                  {myQuickStart.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {myQuickStart.steps.map((step, i) => (
                    <Link key={i} href={`/help/${step.slug}`}
                      className="btn btn-sm"
                      style={{ background: "oklch(var(--accent) / 0.12)", border: "none", color: "oklch(var(--accent))", fontWeight: 500 }}>
                      {i + 1}. {step.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search + filter bar */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex-1" style={{ minWidth: 220 }}>
          <div style={{ position: "relative" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "oklch(var(--ink-3))" }}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="input"
              placeholder="Search articles…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 32, width: "100%" }}
            />
          </div>
        </div>
        <select
          className="input"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as HelpRole | "ALL")}
          style={{ width: "auto", minWidth: 150 }}
        >
          <option value="ALL">All Roles</option>
          {(Object.keys(ROLE_LABELS) as HelpRole[]).map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </div>

      {/* Article grid */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ textAlign: "center", padding: "40px 24px" }}>
            <p style={{ color: "oklch(var(--ink-3))", fontSize: 14 }}>No articles match your search.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {filtered.map((article) => (
            <Link key={article.slug} href={`/help/${article.slug}`}
              className="card"
              style={{ textDecoration: "none", display: "block", transition: "box-shadow 0.15s" }}
            >
              <div className="card-body" style={{ padding: "16px 18px" }}>
                <div className="flex items-start gap-3">
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: "oklch(var(--bg-2))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, flexShrink: 0,
                  }}>
                    {article.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold" style={{ fontSize: 13.5, marginBottom: 2 }}>{article.title}</div>
                    <div style={{ fontSize: 12, color: "oklch(var(--ink-3))", lineHeight: 1.4, marginBottom: 8 }}>
                      {article.subtitle}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {article.roles.map((r) => (
                        <span key={r} style={{
                          fontSize: 10.5, padding: "1px 6px", borderRadius: 4,
                          background: "oklch(var(--bg-2))",
                          color: "oklch(var(--ink-3))",
                          border: "1px solid oklch(var(--line))",
                        }}>{ROLE_LABELS[r]}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
