import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewOrderForm } from "./NewOrderForm";

export default async function NewOrderPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["AGENT", "ADMIN"].includes(session.user.role)) redirect("/orders");

  const [customers, catalog, warehouses] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.catalogItem.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.warehouse.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-[760px]">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/orders" className="btn btn-ghost btn-sm">← Orders</Link>
        <h1 className="text-[17px] font-semibold">New Sales Order</h1>
      </div>

      <NewOrderForm customers={customers} catalog={catalog} warehouses={warehouses} />
    </div>
  );
}
