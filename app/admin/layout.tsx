import AdminGate from "@/components/admin/AdminGate";
import AdminSidebar from "@/components/layout/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGate>
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "#08080F",
        }}
      >
        <AdminSidebar />
        <main
          style={{
            flex: 1,
            marginLeft: "200px",
            minHeight: "100vh",
            overflowY: "auto",
            padding: "32px",
          }}
        >
          {children}
        </main>
      </div>
    </AdminGate>
  );
}
