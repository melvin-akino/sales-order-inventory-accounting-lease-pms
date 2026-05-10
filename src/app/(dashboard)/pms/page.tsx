import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PmsClient } from "./PmsClient";

export default async function PmsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["TECHNICIAN", "WAREHOUSE", "ADMIN"].includes(session.user.role)) redirect("/orders");

  const role = session.user.role;

  const woWhere =
    role === "TECHNICIAN" && session.user.technicianId
      ? { technicianId: session.user.technicianId }
      : {};

  const [workOrders, assets, technicians] = await Promise.all([
    prisma.workOrder.findMany({
      where: woWhere,
      include: {
        asset: true,
        technician: true,
        notes: { orderBy: { at: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.asset.findMany({ orderBy: { name: "asc" } }),
    prisma.technician.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const serializedWOs = workOrders.map((wo) => ({
    id: wo.id,
    title: wo.title,
    type: wo.type,
    status: wo.status,
    priority: wo.priority,
    dueDate: wo.dueDate?.toISOString() ?? null,
    completedAt: wo.completedAt?.toISOString() ?? null,
    createdAt: wo.createdAt.toISOString(),
    asset: { id: wo.asset.id, name: wo.asset.name, serialNumber: wo.asset.serialNumber },
    technician: wo.technician ? { id: wo.technician.id, name: wo.technician.name } : null,
    notes: wo.notes.map((n) => ({
      id: n.id,
      text: n.text,
      by: n.by,
      at: n.at.toISOString(),
    })),
  }));

  return (
    <PmsClient
      workOrders={serializedWOs}
      assets={assets.map((a) => ({ id: a.id, name: a.name, serialNumber: a.serialNumber }))}
      technicians={technicians.map((t) => ({ id: t.id, name: t.name, specialization: t.specialization }))}
      role={role}
      myTechnicianId={session.user.technicianId ?? null}
    />
  );
}
