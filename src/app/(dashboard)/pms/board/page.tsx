import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BoardClient } from "./BoardClient";
import type { WoStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function PmsBoardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Active WOs + completed today
  const workOrders = await prisma.workOrder.findMany({
    where: {
      OR: [
        { status: { not: "COMPLETED" } },
        { status: "COMPLETED", completedAt: { gte: today, lt: tomorrow } },
      ],
    },
    include: {
      asset: true,
      technician: true,
      _count: { select: { notes: true } },
    },
    orderBy: [
      { priority: "desc" },
      { dueDate: "asc" },
      { createdAt: "asc" },
    ],
  });

  const activeCount = workOrders.filter((w) => w.status !== "COMPLETED").length;
  const needsPartsCount = workOrders.filter((w) => w.status === "NEEDS_PARTS").length;

  const serialized = workOrders.map((wo) => {
    const nameParts = (wo.technician?.name ?? "").split(" ").filter(Boolean);
    const initials = nameParts.length >= 2
      ? nameParts[0][0] + nameParts[nameParts.length - 1][0]
      : nameParts[0]?.slice(0, 2) ?? "";

    return {
      id: wo.id,
      title: wo.title,
      type: wo.type,
      status: wo.status as WoStatus,
      priority: wo.priority,
      dueDate: wo.dueDate?.toISOString() ?? null,
      completedAt: wo.completedAt?.toISOString() ?? null,
      createdAt: wo.createdAt.toISOString(),
      assetName: wo.asset.name,
      assetSerial: wo.asset.serialNumber,
      technicianName: wo.technician?.name ?? null,
      technicianInitials: initials.toUpperCase() || null,
      noteCount: wo._count.notes,
    };
  });

  return (
    <BoardClient
      workOrders={serialized}
      activeCount={activeCount}
      needsPartsCount={needsPartsCount}
    />
  );
}
