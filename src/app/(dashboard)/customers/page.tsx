import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CustomersClient } from "./CustomersClient";

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["AGENT", "FINANCE", "ADMIN"].includes(session.user.role)) redirect("/orders");

  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });

  const serialized = customers.map(c => ({
    id: c.id,
    code: c.code,
    name: c.name,
    type: c.type,
    tin: c.tin,
    region: c.region,
    city: c.city,
    terms: c.terms,
    creditLimit: c.creditLimit.toString(),
    contactEmail: c.contactEmail,
    contactPhone: c.contactPhone,
    createdAt: c.createdAt.toISOString(),
  }));

  return <CustomersClient customers={serialized} />;
}
