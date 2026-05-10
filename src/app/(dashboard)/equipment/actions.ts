"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AssetCategory } from "@prisma/client";

function requireWarehouse(role: string) {
  if (!["WAREHOUSE", "ADMIN"].includes(role)) throw new Error("Forbidden");
}

export async function createAsset(data: {
  name: string;
  serialNumber: string;
  category: AssetCategory;
  warehouseId?: string;
  purchasedAt?: string;
  maintenanceIntervalDays: number;
}) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthenticated");
  requireWarehouse(session.user.role);

  const existing = await prisma.asset.findUnique({ where: { serialNumber: data.serialNumber } });
  if (existing) throw new Error(`Serial number "${data.serialNumber}" already exists`);

  await prisma.asset.create({
    data: {
      name: data.name.trim(),
      serialNumber: data.serialNumber.trim(),
      category: data.category,
      warehouseId: data.warehouseId || null,
      purchasedAt: data.purchasedAt ? new Date(data.purchasedAt) : null,
      maintenanceIntervalDays: data.maintenanceIntervalDays,
    },
  });

  revalidatePath("/equipment");
  revalidatePath("/pms");
  revalidatePath("/leases");
}

export async function updateAsset(
  id: string,
  data: {
    name: string;
    category: AssetCategory;
    warehouseId?: string;
    purchasedAt?: string;
    maintenanceIntervalDays: number;
  },
) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthenticated");
  requireWarehouse(session.user.role);

  await prisma.asset.update({
    where: { id },
    data: {
      name: data.name.trim(),
      category: data.category,
      warehouseId: data.warehouseId || null,
      purchasedAt: data.purchasedAt ? new Date(data.purchasedAt) : null,
      maintenanceIntervalDays: data.maintenanceIntervalDays,
    },
  });

  revalidatePath("/equipment");
  revalidatePath("/pms");
}
