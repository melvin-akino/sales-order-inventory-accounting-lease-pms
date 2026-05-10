import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeasesClient } from "./LeasesClient";

export default async function LeasesPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["FINANCE", "ADMIN"].includes(session.user.role)) redirect("/orders");

  const role = session.user.role;

  const [leases, customers, assets] = await Promise.all([
    prisma.lease.findMany({
      include: { customer: true, assets: { include: { asset: true } } },
      orderBy: { startDate: "desc" },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.asset.findMany({ orderBy: { name: "asc" } }),
  ]);

  const serialized = leases.map((l) => ({
    id: l.id,
    startDate: l.startDate.toISOString(),
    endDate: l.endDate.toISOString(),
    monthlyRate: l.monthlyRate.toString(),
    notes: l.notes,
    active: l.active,
    customer: { id: l.customer.id, name: l.customer.name },
    assetNames: l.assets.map((la) => la.asset.name),
  }));

  return (
    <div>
      {!["FINANCE", "ADMIN"].includes(role) && (
        <h1 className="text-[18px] font-semibold mb-4">Equipment Leases</h1>
      )}
      <LeasesClient
        leases={serialized}
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
        assets={assets.map((a) => ({ id: a.id, name: a.name, serialNumber: a.serialNumber }))}
        role={role}
      />
    </div>
  );
}
