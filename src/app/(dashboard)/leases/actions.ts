"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function requireFinance(role: string) {
  if (!["FINANCE", "ADMIN"].includes(role)) throw new Error("Forbidden");
}

export async function createLease(data: {
  customerId: string;
  startDate: string;
  endDate: string;
  monthlyRate: number;
  notes?: string;
  assetIds: string[];
}) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthenticated");
  requireFinance(session.user.role);

  await prisma.lease.create({
    data: {
      customerId: data.customerId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      monthlyRate: data.monthlyRate,
      notes: data.notes || null,
      assets: {
        create: data.assetIds.map((assetId) => ({ assetId })),
      },
    },
  });

  revalidatePath("/leases");
}

export async function updateLease(
  id: string,
  data: { endDate?: string; monthlyRate?: number; notes?: string; active?: boolean },
) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthenticated");
  requireFinance(session.user.role);

  await prisma.lease.update({
    where: { id },
    data: {
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      monthlyRate: data.monthlyRate,
      notes: data.notes,
      active: data.active,
    },
  });

  revalidatePath("/leases");
}
