"use client";

import {
  BarChart3,
  TrendingUp,
  Users,
  FolderKanban,
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";
import { KANBAN_COLUMNS } from "@/lib/kanban-rules";
import { formatMoeda } from "@/utils/format";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardData {
  totalProjetos: number;
  totalClientes: number;
  projetosPorStatus: Record<string, number>;
  projetosRecentes: Array<{
    id: string;
    nome: string;
    status: string;
    updatedAt: Date;
    valorProjeto: number | null;
    cliente: { nome: string };
    responsavel: { name: string };
  }>;
  colaboradores: Array<{
    id: string;
    name: string;
    _count: { projetosResponsavel: number };
  }>;
}

const statusIcons: Record<string, React.ReactNode> = {
  INICIAL: <Clock className="w-5 h-5" />,
  EM_ANALISE: <BarChart3 className="w-5 h-5" />,
  COM_PENDENCIA: <AlertCircle className="w-5 h-5" />,
  LIBERADO: <CheckCircle2 className="w-5 h-5" />,
  PAGO: <DollarSign className="w-5 h-5" />,
};

export default function DashboardClient({ data }: { data: DashboardData }) {
  const kpiCards = [
    {
      title: "Total de Projetos",
      value: data.totalProjetos,
      icon: <FolderKanban className="w-6 h-6" />,
      color: "from-green-500 to-emerald-600",
      bgLight: "bg-green-50",
      textColor: "text-green-700",
    },
    {
      title: "Total de Clientes",
      value: data.totalClientes,
      icon: <Users className="w-6 h-6" />,
      color: "from-blue-500 to-indigo-600",
      bgLight: "bg-blue-50",
      textColor: "text-blue-700",
    },
    {
      title: "Em Andamento",
      value:
        (data.projetosPorStatus["EM_ANALISE"] || 0) +
        (data.projetosPorStatus["COM_PENDENCIA"] || 0),
      icon: <TrendingUp className="w-6 h-6" />,
      color: "from-amber-500 to-orange-600",
      bgLight: "bg-amber-50",
      textColor: "text-amber-700",
    },
    {
      title: "Concluídos (Pagos)",
      value: data.projetosPorStatus["PAGO"] || 0,
      icon: <CheckCircle2 className="w-6 h-6" />,
      color: "from-emerald-500 to-teal-600",
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-700",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard Operacional
        </h1>
        <p className="text-gray-500 mt-1">
          Visão geral do andamento dos projetos
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi) => (
          <div
            key={kpi.title}
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-3 rounded-xl ${kpi.bgLight} ${kpi.textColor}`}
              >
                {kpi.icon}
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{kpi.value}</div>
            <div className="text-sm text-gray-500 mt-1">{kpi.title}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Projetos por Status
          </h2>
          <div className="space-y-4">
            {KANBAN_COLUMNS.map((col) => {
              const count = data.projetosPorStatus[col.id] || 0;
              const percentage =
                data.totalProjetos > 0
                  ? (count / data.totalProjetos) * 100
                  : 0;
              return (
                <div key={col.id} className="flex items-center gap-4">
                  <div className="w-32 flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${col.bgColor}`}
                    />
                    <span className="text-sm text-gray-600 truncate">
                      {col.label}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${col.bgColor}`}
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-sm font-semibold text-gray-900">
                      {count}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">
                      ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Colaboradores */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Colaboradores
          </h2>
          <div className="space-y-3">
            {data.colaboradores.map((colab) => (
              <div
                key={colab.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-sm font-medium">
                    {colab.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {colab.name}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {colab._count.projetosResponsavel}{" "}
                  {colab._count.projetosResponsavel === 1
                    ? "projeto"
                    : "projetos"}
                </span>
              </div>
            ))}
            {data.colaboradores.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                Nenhum colaborador ativo
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Projetos Recentes */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Atividade Recente
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                  Projeto
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                  Cliente
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                  Responsável
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                  Valor
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                  Atualizado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.projetosRecentes.map((projeto) => {
                const column = KANBAN_COLUMNS.find(
                  (c) => c.id === projeto.status
                );
                return (
                  <tr
                    key={projeto.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <span className="text-sm font-medium text-gray-900">
                        {projeto.nome}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm text-gray-600">
                        {projeto.cliente.nome}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm text-gray-600">
                        {projeto.responsavel.name}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${column?.bgColor || "bg-gray-100"} ${column?.textColor || "text-gray-600"}`}
                      >
                        {statusIcons[projeto.status]}
                        {column?.label || projeto.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm text-gray-600">
                        {projeto.valorProjeto
                          ? formatMoeda(projeto.valorProjeto)
                          : "—"}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-sm text-gray-400">
                        {format(
                          new Date(projeto.updatedAt),
                          "dd/MM/yyyy",
                          { locale: ptBR }
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {data.projetosRecentes.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              Nenhum projeto registrado
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
