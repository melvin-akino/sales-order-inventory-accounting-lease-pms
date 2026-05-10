"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function requireAccess() {
  const session = await getServerSession(authOptions);
  if (!session || !["AGENT", "FINANCE", "ADMIN"].includes(session.user.role)) {
    throw new Error("Forbidden");
  }
  return session;
}

const CatalogSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(["CONSUMABLE", "ACCESSORY", "EQUIPMENT", "INSTRUMENT"]),
  unit: z.string().min(1),
  unitPrice: z.number().positive(),
  brand: z.string().optional(),
  supplierId: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

export async function createCatalogItem(input: z.infer<typeof CatalogSchema>) {
  await requireAccess();
  const data = CatalogSchema.parse(input);

  const existing = await prisma.catalogItem.findUnique({ where: { sku: data.sku } });
  if (existing) throw new Error(`SKU "${data.sku}" already exists`);

  await prisma.catalogItem.create({
    data: {
      sku: data.sku,
      name: data.name,
      category: data.category,
      unit: data.unit,
      unitPrice: data.unitPrice,
      brand: data.brand || null,
      supplierId: data.supplierId || null,
      active: data.active,
    },
  });

  revalidatePath("/catalog");
}

export async function updateCatalogItem(id: string, input: z.infer<typeof CatalogSchema>) {
  await requireAccess();
  const data = CatalogSchema.parse(input);

  const existing = await prisma.catalogItem.findFirst({
    where: { sku: data.sku, NOT: { id } },
  });
  if (existing) throw new Error(`SKU "${data.sku}" is already used by another item`);

  await prisma.catalogItem.update({
    where: { id },
    data: {
      sku: data.sku,
      name: data.name,
      category: data.category,
      unit: data.unit,
      unitPrice: data.unitPrice,
      brand: data.brand || null,
      supplierId: data.supplierId || null,
      active: data.active,
    },
  });

  revalidatePath("/catalog");
}
