"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
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
      customerId:  data.role === "CUSTOMER"   ? (data.customerId  ?? null) : null,
      technicianId: data.role === "TECHNICIAN" ? (data.technicianId ?? null) : null,
    },
  });

  const session2 = await getServerSession(authOptions);
  writeAudit({ action: "user.create", entityType: "user", entityId: data.email, actorId: session2?.user.id, actorName: session2?.user.name ?? undefined, meta: { role: data.role } }).catch(() => {});

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
      customerId:  data.role === "CUSTOMER"   ? (data.customerId  ?? null) : null,
      technicianId: data.role === "TECHNICIAN" ? (data.technicianId ?? null) : null,
      active: data.active,
    },
  });

  writeAudit({ action: "user.update", entityType: "user", entityId: data.id, actorId: session.user.id, actorName: session.user.name ?? undefined, meta: { role: data.role, active: data.active } }).catch(() => {});

  revalidatePath("/settings");
}

// ── Technician CRUD ───────────────────────────────────────────────────────────
export async function createTechnician(input: { name: string; specialization?: string }) {
  await requireAdmin();
  const data = z.object({
    name: z.string().min(1),
    specialization: z.string().optional(),
  }).parse(input);

  await prisma.technician.create({
    data: { name: data.name, specialization: data.specialization ?? null },
  });

  const sess = await getServerSession(authOptions);
  writeAudit({ action: "technician.create", entityType: "technician", actorId: sess?.user.id, actorName: sess?.user.name ?? undefined, meta: { name: data.name } }).catch(() => {});

  revalidatePath("/settings");
}

export async function updateTechnician(input: { id: string; name: string; specialization?: string; active: boolean }) {
  await requireAdmin();
  const data = z.object({
    id: z.string(),
    name: z.string().min(1),
    specialization: z.string().optional(),
    active: z.boolean(),
  }).parse(input);

  await prisma.technician.update({
    where: { id: data.id },
    data: { name: data.name, specialization: data.specialization ?? null, active: data.active },
  });

  const sess2 = await getServerSession(authOptions);
  writeAudit({ action: "technician.update", entityType: "technician", entityId: data.id, actorId: sess2?.user.id, actorName: sess2?.user.name ?? undefined, meta: { active: data.active } }).catch(() => {});

  revalidatePath("/settings");
}

// ── Branding ──────────────────────────────────────────────────────────────────
const BrandSchema = z.object({
  name:    z.string().min(1),
  tagline: z.string().min(1),
  address: z.string().min(1),
  phone:   z.string().min(1),
  email:   z.string().email(),
  tin:     z.string().min(1),
  website: z.string().min(1),
  color:   z.string().regex(/^#[0-9a-fA-F]{6}$/),
  rdo:     z.string(),
  zip:     z.string(),
  logoUrl: z.string(),
});

export async function saveBranding(input: z.infer<typeof BrandSchema>) {
  await requireAdmin();
  const data = BrandSchema.parse(input);
  const sess3 = await getServerSession(authOptions);
  await prisma.orgSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });
  writeAudit({ action: "branding.save", entityType: "branding", actorId: sess3?.user.id, actorName: sess3?.user.name ?? undefined, meta: { name: data.name, color: data.color } }).catch(() => {});
  revalidatePath("/", "layout");
}

export async function getBranding() {
  await requireAdmin();
  return prisma.orgSettings.findUnique({ where: { id: "singleton" } });
}

// ── Logo upload ───────────────────────────────────────────────────────────────
export async function uploadLogo(formData: FormData): Promise<{ logoUrl: string }> {
  await requireAdmin();

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No file provided");
  if (file.size > 2 * 1024 * 1024) throw new Error("Logo must be under 2 MB");

  const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
  if (!allowed.includes(file.type)) throw new Error("Only PNG, JPG, WebP or SVG allowed");

  const { writeFile, mkdir } = await import("fs/promises");
  const { join } = await import("path");
  const { randomUUID } = await import("crypto");

  const ext = file.name.split(".").pop() ?? "png";
  const filename = `logo-${randomUUID()}.${ext}`;
  // Write to the persistent Docker volume mounted at /app/uploads
  // Served back to the browser via /api/uploads/[...path]
  const dir = join(process.cwd(), "uploads", "branding");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), Buffer.from(await file.arrayBuffer()));

  const logoUrl = `/api/uploads/branding/${filename}`;

  // Persist to DB — upsert so it works even if no other branding was saved yet
  await prisma.orgSettings.upsert({
    where: { id: "singleton" },
    update: { logoUrl },
    create: {
      id: "singleton",
      logoUrl,
      name: "", tagline: "", address: "", phone: "", email: "", tin: "", website: "", color: "#003087", rdo: "", zip: "",
    },
  });

  revalidatePath("/", "layout");
  return { logoUrl };
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
