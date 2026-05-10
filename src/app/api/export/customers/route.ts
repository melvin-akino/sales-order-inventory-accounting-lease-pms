import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildCSV, csvResponse } from "@/lib/csv";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !["AGENT", "FINANCE", "ADMIN"].includes(session.user.role))
    return new Response("Unauthorized", { status: 401 });

  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });

  const rows = customers.map(c => ({
    "Code": c.code ?? "",
    "Name": c.name,
    "Type": c.type,
    "TIN": c.tin ?? "",
    "Region": c.region ?? "",
    "City": c.city ?? "",
    "Terms": c.terms,
    "Credit Limit": Number(c.creditLimit).toFixed(2),
    "Email": c.contactEmail ?? "",
    "Phone": c.contactPhone ?? "",
    "Created": c.createdAt.toLocaleDateString("en-PH"),
  }));

  const today = new Date().toISOString().slice(0, 10);
  return csvResponse(buildCSV(rows), `customers-${today}.csv`);
}
