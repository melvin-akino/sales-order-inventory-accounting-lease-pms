"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";
import type { Role } from "@prisma/client";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Forbidden");
  return session;
}

// ── Create user ───────────────────────────────────────────────────────────────
const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["CUSTOMER", "AGENT", "FINANCE", "WAREHOUSE", "TECHNICIAN", "DRIVER", "ADMIN"]),
  customerId: z.string().optional(),
  technicianId: z.string().optional(),
});

export async function createUser(input: z.infer<typeof CreateUserSchema>) {
  await requireAdmin();
  const data = CreateUserSchema.parse(input);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("A user with this email already exists");

  const passwordHash = await hash(data.password, 12);

  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role as Role,
      customerId: data.role === "CUSTOMER" ? (data.customerId ?? null) : null,
      technicianId: data.role === "TECHNICIAN" ? (data.technicianId ?? null) : null,
    },
  });

  revalidatePath("/settings");
}

// ── Update user ───────────────────────────────────────────────────────────────
const UpdateUserSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  role: z.enum(["CUSTOMER", "AGENT", "FINANCE", "WAREHOUSE", "TECHNICIAN", "DRIVER", "ADMIN"]),
  customerId: z.string().optional().nullable(),
  technicianId: z.string().optional().nullable(),
  active: z.boolean(),
});

export async function updateUser(input: z.infer<typeof UpdateUserSchema>) {
  const session = await requireAdmin();
  const data = UpdateUserSchema.parse(input);

  if (data.id === session.user.id && !data.active) {
    throw new Error("You cannot deactivate your own account");
  }

  await prisma.user.update({
    where: { id: data.id },
    data: {
      name: data.name,
      role: data.role as Role,
      customerId: data.role === "CUSTOMER" ? (data.customerId ?? null) : null,
      technicianId: data.role === "TECHNICIAN" ? (data.technicianId ?? null) : null,
      active: data.active,
    },
  });

  revalidatePath("/settings");
}

// ── Reset password ────────────────────────────────────────────────────────────
export async function resetPassword(userId: string, newPassword: string) {
  await requireAdmin();

  if (newPassword.length < 8) throw new Error("Password must be at least 8 characters");

  const passwordHash = await hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  revalidatePath("/settings");
}
