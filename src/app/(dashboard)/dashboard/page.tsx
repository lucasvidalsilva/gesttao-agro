import { buscarDashboardData } from "@/features/historico/actions";
import { requireAdmin } from "@/lib/auth-utils";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Dashboard | Gestão Agro",
  description: "Visão geral operacional do sistema",
};

export default async function DashboardPage() {
  await requireAdmin();
  const data = await buscarDashboardData();
  return <DashboardClient data={data} />;
}
