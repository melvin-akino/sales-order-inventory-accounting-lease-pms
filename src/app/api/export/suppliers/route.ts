import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildCSV, csvResponse } from "@/lib/csv";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !["WAREHOUSE", "FINANCE", "ADMIN"].includes(session.user.role))
    return new Response("Unauthorized", { status: 401 });

  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });

  const rows = suppliers.map(s => ({
    "Code": s.code ?? "",
    "Name": s.name,
    "Status": s.status,
    "City": s.city ?? "",
    "Terms": s.terms,
    "Lead Time (days)": s.leadTimeDays,
    "Rating": Number(s.rating).toFixed(1),
    "Email": s.contactEmail ?? "",
    "Phone": s.contactPhone ?? "",
    "Created": s.createdAt.toLocaleDateString("en-PH"),
  }));

  const today = new Date().toISOString().slice(0, 10);
  return csvResponse(buildCSV(rows), `suppliers-${today}.csv`);
}
