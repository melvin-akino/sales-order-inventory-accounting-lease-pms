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
}

const CustomerSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1),
  type: z.string().default("HOSPITAL"),
  tin: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  terms: z.string().default("Net 30"),
  creditLimit: z.number().min(0).default(0),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
});

export async function createCustomer(input: z.infer<typeof CustomerSchema>) {
  await requireAccess();
  const data = CustomerSchema.parse(input);

  if (data.code) {
    const existing = await prisma.customer.findUnique({ where: { code: data.code } });
    if (existing) throw new Error(`Customer code "${data.code}" already exists`);
  }

  await prisma.customer.create({
    data: {
      code: data.code || null,
      name: data.name,
      type: data.type,
      tin: data.tin || null,
      region: data.region || null,
      city: data.city || null,
      terms: data.terms,
      creditLimit: data.creditLimit,
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
    },
  });

  revalidatePath("/customers");
}

export async function updateCustomer(id: string, input: z.infer<typeof CustomerSchema>) {
  await requireAccess();
  const data = CustomerSchema.parse(input);

  if (data.code) {
    const existing = await prisma.customer.findFirst({
      where: { code: data.code, NOT: { id } },
    });
    if (existing) throw new Error(`Customer code "${data.code}" is already used`);
  }

  await prisma.customer.update({
    where: { id },
    data: {
      code: data.code || null,
      name: data.name,
      type: data.type,
      tin: data.tin || null,
      region: data.region || null,
      city: data.city || null,
      terms: data.terms,
      creditLimit: data.creditLimit,
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
    },
  });

  revalidatePath("/customers");
}
