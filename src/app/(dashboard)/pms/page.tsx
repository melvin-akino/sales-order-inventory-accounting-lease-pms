import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatePill } from "@/components/ui/StatePill";
import { fmtDate } from "@/lib/utils";
import type { WoStatus } from "@prisma/client";

const COLS: WoStatus[] = ["PENDING", "IN_PROGRESS", "NEEDS_PARTS", "COMPLETED"];

export default async function PmsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["TECHNICIAN", "WAREHOUSE", "ADMIN"].includes(session.user.role)) redirect("/orders");

  const where =
    session.user.role === "TECHNICIAN" && session.user.technicianId
      ? { technicianId: session.user.technicianId }
      : {};

  const workOrders = await prisma.workOrder.findMany({
    where,
    include: { asset: true, technician: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-[18px] font-semibold mb-4">Work Orders</h1>
      <div className="kanban">
        {COLS.map((col) => {
          const items = workOrders.filter((wo) => wo.status === col);
          return (
            <div key={col} className="kcol">
              <div className="kcol-h">
                <StatePill state={col} />
                <span className="ml-auto badge">{items.length}</span>
              </div>
              {items.map((wo) => (
                <div key={wo.id} className="kcard">
                  <div className="text-[12px] font-semibold" style={{ color: "oklch(var(--ink))" }}>{wo.id}</div>
                  <div className="text-[11.5px]" style={{ color: "oklch(var(--ink-2))" }}>{wo.asset.name}</div>
                  <div className="text-[11px] mt-1.5" style={{ color: "oklch(var(--ink-3))" }}>
                    {wo.technician?.name ?? "Unassigned"} · {fmtDate(wo.dueDate ?? wo.createdAt)}
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-[11.5px] text-center py-4" style={{ color: "oklch(var(--ink-4))" }}>Empty</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
