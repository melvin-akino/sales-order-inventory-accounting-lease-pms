import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/orders");

  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="text-[18px] font-semibold mb-4">Settings — Users</h1>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ cursor: "default" }}>
                <td>{u.name}</td>
                <td className="dim">{u.email}</td>
                <td>
                  <span className="badge">{u.role}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
