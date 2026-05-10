"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { WoStatus, WoPriority } from "@prisma/client";

interface WorkOrder {
  id: string;
  title: string;
  type: string;
  status: WoStatus;
  priority: WoPriority;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  assetName: string;
  assetSerial: string;
  technicianName: string | null;
  technicianInitials: string | null;
  noteCount: number;
}

interface Props {
  workOrders: WorkOrder[];
  activeCount: number;
  needsPartsCount: number;
}

const COLS: { status: WoStatus; label: string }[] = [
  { status: "PENDING",     label: "Pending" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "NEEDS_PARTS", label: "Needs Parts" },
  { status: "COMPLETED",   label: "Completed Today" },
];

const COL_ACCENT: Record<string, string> = {
  PENDING:     "oklch(0.55 0.02 250)",
  IN_PROGRESS: "oklch(0.70 0.16 195)",
  NEEDS_PARTS: "oklch(0.65 0.18 25)",
  COMPLETED:   "oklch(0.65 0.18 155)",
};

const COL_BG: Record<string, string> = {
  PENDING:     "oklch(0.14 0.015 250)",
  IN_PROGRESS: "oklch(0.14 0.015 250)",
  NEEDS_PARTS: "oklch(0.17 0.06 25)",
  COMPLETED:   "oklch(0.14 0.015 250)",
};

const COL_CNT_BG: Record<string, string> = {
  PENDING:     "oklch(0.20 0.015 250)",
  IN_PROGRESS: "oklch(0.28 0.10 65)",
  NEEDS_PARTS: "oklch(0.30 0.12 25)",
  COMPLETED:   "oklch(0.28 0.10 155)",
};

const COL_CNT_FG: Record<string, string> = {
  PENDING:     "oklch(0.88 0.008 250)",
  IN_PROGRESS: "oklch(0.95 0.05 65)",
  NEEDS_PARTS: "oklch(0.95 0.05 25)",
  COMPLETED:   "oklch(0.95 0.05 155)",
};

const PRIORITY_COLOR: Record<WoPriority, string> = {
  LOW:    "oklch(0.55 0.02 250)",
  MEDIUM: "oklch(0.55 0.12 240)",
  HIGH:   "oklch(0.70 0.14 65)",
  URGENT: "oklch(0.65 0.18 25)",
};

function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function fmtLongDate(d: Date) {
  return d.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

export function BoardClient({ workOrders, activeCount, needsPartsCount }: Props) {
  const router = useRouter();
  const [now, setNow] = useState(new Date());
  const [countdown, setCountdown] = useState(30);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-refresh every 30s
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          router.refresh();
          return 30;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [router]);

  const byStatus = (s: WoStatus) => workOrders.filter((w) => w.status === s);

  return (
    <div style={{
      background: "oklch(0.10 0.015 250)",
      color: "oklch(0.96 0.01 240)",
      minHeight: "calc(100vh - 52px)",
      margin: "-24px -28px -80px",
      padding: "28px 28px 40px",
      fontFamily: "inherit",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 24, marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid oklch(0.20 0.015 250)" }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", margin: 0, color: "oklch(0.97 0.01 240)" }}>
            PMS Operations Board
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 6, fontSize: 13, color: "oklch(0.70 0.012 250)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "oklch(0.85 0.05 155)", fontWeight: 500 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "oklch(0.65 0.18 155)", animation: "kpulse 1.6s ease-in-out infinite", display: "inline-block" }} />
              Live
            </span>
            <span>{activeCount} active work orders</span>
            {needsPartsCount > 0 && (
              <span style={{ color: "oklch(0.80 0.12 25)", fontWeight: 500 }}>⚠ {needsPartsCount} needing parts</span>
            )}
            <span style={{ marginLeft: "auto", fontSize: 12, color: "oklch(0.45 0.010 250)" }}>
              Refreshing in {countdown}s
            </span>
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontFamily: "var(--font-geist-mono, ui-monospace)", fontSize: 36, fontWeight: 600, letterSpacing: "-0.02em", fontFeatureSettings: '"tnum"', lineHeight: 1 }}>
            {fmtTime(now)}
          </div>
          <div style={{ fontSize: 13, color: "oklch(0.60 0.010 250)", marginTop: 4 }}>
            {fmtLongDate(now)}
          </div>
        </div>
      </div>

      {/* Columns */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {COLS.map(({ status, label }) => {
          const wos = byStatus(status);
          return (
            <div key={status} style={{ background: COL_BG[status], borderRadius: 12, padding: 16, minHeight: 240 }}>
              {/* Column header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 14, borderBottom: "1px solid oklch(0.22 0.015 250)", marginBottom: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: COL_ACCENT[status], flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: "oklch(0.92 0.008 240)" }}>{label}</span>
                <span style={{ marginLeft: "auto", fontFamily: "var(--font-geist-mono, ui-monospace)", fontSize: 14, fontWeight: 600, padding: "2px 12px", borderRadius: 999, background: COL_CNT_BG[status], color: COL_CNT_FG[status] }}>
                  {wos.length}
                </span>
              </div>

              {/* Cards */}
              {wos.length === 0 && (
                <div style={{ textAlign: "center", color: "oklch(0.40 0.010 250)", fontSize: 13, padding: "24px 8px" }}>—</div>
              )}
              {wos.map((wo) => {
                const urgent = wo.priority === "URGENT";
                const overdue = wo.dueDate && new Date(wo.dueDate) < new Date() && wo.status !== "COMPLETED";
                return (
                  <div key={wo.id} style={{
                    background: "oklch(0.18 0.015 250)",
                    borderRadius: 10,
                    padding: "14px 14px 12px",
                    marginBottom: 10,
                    border: `1px solid ${urgent ? "oklch(0.50 0.16 25)" : overdue ? "oklch(0.40 0.10 25)" : "oklch(0.22 0.015 250)"}`,
                  }}>
                    {/* WO ID row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-geist-mono, ui-monospace)", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "oklch(0.95 0.01 240)" }}>
                      <span>{wo.id.slice(-8)}</span>
                      {urgent && (
                        <span style={{ marginLeft: "auto", padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: "oklch(0.55 0.16 25)", color: "white", letterSpacing: "0.05em" }}>
                          URGENT
                        </span>
                      )}
                      {!urgent && overdue && (
                        <span style={{ marginLeft: "auto", padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: "oklch(0.40 0.12 25)", color: "oklch(0.90 0.05 25)", letterSpacing: "0.04em" }}>
                          OVERDUE
                        </span>
                      )}
                      {!urgent && !overdue && (
                        <span style={{ marginLeft: "auto", padding: "1px 6px", borderRadius: 4, fontSize: 9.5, fontWeight: 600, background: PRIORITY_COLOR[wo.priority] + "33", color: PRIORITY_COLOR[wo.priority], letterSpacing: "0.04em" }}>
                          {wo.priority}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.3, marginBottom: 5, color: "oklch(0.94 0.008 240)" }}>
                      {wo.title}
                    </div>

                    {/* Asset */}
                    <div style={{ fontSize: 12.5, color: "oklch(0.70 0.012 250)", fontFeatureSettings: '"tnum"' }}>
                      {wo.assetName}
                    </div>
                    <div style={{ fontSize: 11.5, color: "oklch(0.50 0.010 250)", marginTop: 2, fontFamily: "var(--font-geist-mono, ui-monospace)" }}>
                      SN {wo.assetSerial}
                      {wo.dueDate && (
                        <span style={{ marginLeft: 8 }}>· Due {fmtShortDate(wo.dueDate)}</span>
                      )}
                      {wo.completedAt && (
                        <span style={{ marginLeft: 8, color: "oklch(0.65 0.14 155)" }}>· Done {fmtTime(new Date(wo.completedAt))}</span>
                      )}
                    </div>

                    {/* Technician */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, paddingTop: 10, borderTop: "1px solid oklch(0.22 0.015 250)", fontSize: 12, color: "oklch(0.78 0.010 240)" }}>
                      {wo.technicianName ? (
                        <>
                          <div style={{ width: 22, height: 22, borderRadius: "50%", background: "oklch(0.45 0.09 195)", color: "white", display: "grid", placeItems: "center", fontFamily: "var(--font-geist-mono, ui-monospace)", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                            {wo.technicianInitials}
                          </div>
                          {wo.technicianName}
                        </>
                      ) : (
                        <span style={{ color: "oklch(0.42 0.010 250)", fontStyle: "italic" }}>Unclaimed</span>
                      )}
                      {wo.noteCount > 0 && (
                        <span style={{ marginLeft: "auto", fontSize: 11, color: "oklch(0.45 0.010 250)" }}>
                          {wo.noteCount} note{wo.noteCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes kpulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 oklch(0.65 0.18 155 / 0.5); }
          50% { opacity: 0.6; box-shadow: 0 0 0 6px oklch(0.65 0.18 155 / 0); }
        }
      `}</style>
    </div>
  );
}
