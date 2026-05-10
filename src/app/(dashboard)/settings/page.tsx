import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/orders");

  const [users, customers, technicians] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: "asc" },
      include: {
        customer: { select: { name: true } },
        technician: { select: { name: true } },
      },
    }),
    prisma.customer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.technician.findMany({ select: { id: true, name: true }, where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const serialized = users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    customerId: u.customerId,
    technicianId: u.technicianId,
    createdAt: u.createdAt.toISOString(),
    customer: u.customer,
    technician: u.technician,
  }));

  return (
    <SettingsClient
      users={serialized}
      customers={customers}
      technicians={technicians}
      currentUserId={session.user.id}
    />
  );
}
