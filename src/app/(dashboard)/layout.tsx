import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Toaster } from "sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userName = session.user.name ?? "Usuário";
  const userRole = (session.user as { role: string }).role ?? "COLABORADOR";

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Sidebar userRole={userRole} />
      <Header userName={userName} userRole={userRole} />

      <main className="ml-[260px] mt-16 min-h-[calc(100vh-64px)] p-6">
        <div className="animate-fade-in">{children}</div>
      </main>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: "'Inter', sans-serif",
          },
          className: "border border-border",
        }}
        richColors
        closeButton
      />
    </div>
  );
}
