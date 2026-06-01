import { verifyAdminToken } from "@/lib/adminAuth";
import { redirect } from "next/navigation";
import AdminSidebar from "./AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await verifyAdminToken();
  if (!isAdmin) redirect("/admin/login");

  return (
    <div className="min-h-screen flex" style={{ background: "#f5f5f5" }}>
      <AdminSidebar />
      {/* ── Main ── */}
      <main className="flex-1 md:ml-[240px] min-h-screen">
        <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mt-14 md:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
