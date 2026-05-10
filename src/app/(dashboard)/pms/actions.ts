"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { WoStatus, WoPriority } from "@prisma/client";

function requirePms(role: string) {
  if (!["TECHNICIAN", "WAREHOUSE", "ADMIN"].includes(role)) throw new Error("Forbidden");
}

export async function createWorkOrder(data: {
  assetId: string;
  type: string;
  title: string;
  priority: WoPriority;
  technicianId?: string;
  dueDate?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthenticated");
  requirePms(session.user.role);

  await prisma.workOrder.create({
    data: {
      assetId: data.assetId,
      type: data.type,
      title: data.title,
      priority: data.priority,
      technicianId: data.technicianId || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  });

  revalidatePath("/pms");
}

export async function updateWoStatus(id: string, status: WoStatus, note?: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthenticated");
  requirePms(session.user.role);

  await prisma.$transaction(async (tx) => {
    await tx.workOrder.update({
      where: { id },
      data: {
        status,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
    });
    if (note?.trim()) {
      await tx.woNote.create({
        data: {
          workOrderId: id,
          text: note.trim(),
          by: session.user.name,
          userId: session.user.id,
        },
      });
    }
  });

  revalidatePath("/pms");
}

export async function assignTechnician(id: string, technicianId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthenticated");
  if (!["WAREHOUSE", "ADMIN"].includes(session.user.role)) throw new Error("Forbidden");

  await prisma.workOrder.update({
    where: { id },
    data: { technicianId: technicianId || null },
  });

  revalidatePath("/pms");
}

export async function addWoNote(workOrderId: string, text: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthenticated");
  requirePms(session.user.role);

  if (!text.trim()) throw new Error("Note cannot be empty");

  await prisma.woNote.create({
    data: {
      workOrderId,
      text: text.trim(),
      by: session.user.name,
      userId: session.user.id,
    },
  });

  revalidatePath("/pms");
}
