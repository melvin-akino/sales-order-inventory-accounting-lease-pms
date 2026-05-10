import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildCSV, csvResponse } from "@/lib/csv";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !["TECHNICIAN", "WAREHOUSE", "ADMIN"].includes(session.user.role))
    return new Response("Unauthorized", { status: 401 });

  const wos = await prisma.workOrder.findMany({
    include: { asset: true, technician: true },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const rows = wos.map(w => ({
    "WO ID": w.id,
    "Title": w.title,
    "Type": w.type,
    "Status": w.status,
    "Priority": w.priority,
    "Asset": w.asset.name,
    "Serial #": w.asset.serialNumber,
    "Technician": w.technician?.name ?? "",
    "Due Date": w.dueDate ? w.dueDate.toLocaleDateString("en-PH") : "",
    "Completed At": w.completedAt ? w.completedAt.toLocaleDateString("en-PH") : "",
    "Created": w.createdAt.toLocaleDateString("en-PH"),
  }));

  const today = new Date().toISOString().slice(0, 10);
  return csvResponse(buildCSV(rows), `work-orders-${today}.csv`);
}
