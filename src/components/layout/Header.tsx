"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Bell, 
  ChevronDown, 
  Cake, 
  AlertTriangle, 
  Clock, 
  MessageSquare, 
  X, 
  CheckCircle2, 
  ChevronRight 
} from "lucide-react";
import { buscarDadosNotificacoes, type NotificacaoDados } from "@/features/historico/notifications";
import Link from "next/link";

interface HeaderProps {
  userName: string;
  userRole: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    ADMIN: "Administrador",
    COLABORADOR: "Colaborador",
    VISUALIZADOR: "Visualizador",
  };
  return labels[role] ?? role;
}

function getRoleBadgeClasses(role: string): string {
  const classes: Record<string, string> = {
    ADMIN: "bg-brand-100 text-brand-700",
    COLABORADOR: "bg-blue-100 text-blue-700",
    VISUALIZADOR: "bg-amber-100 text-amber-700",
  };
  return classes[role] ?? "bg-gray-100 text-gray-700";
}

export function Header({ userName, userRole }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificacaoDados | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    async function loadNotifications() {
      setLoading(true);
      try {
        const data = await buscarDadosNotificacoes();
        setNotifications(data);
        const hasAlerts = data.aniversariantes.length > 0 || data.pendencias.length > 0;
        setHasUnread(hasAlerts);
      } catch (err) {
        console.error("Erro ao carregar notificações:", err);
      } finally {
        setLoading(false);
      }
    }
    loadNotifications();
  }, []);

  const totalAlerts = 
    (notifications?.aniversariantes?.length ?? 0) + 
    (notifications?.pendencias?.length ?? 0);

  return (
    <header className="fixed top-0 right-0 left-[260px] z-20 flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          placeholder="Buscar projetos, clientes..."
          className="h-10 w-full rounded-lg border border-border bg-surface-secondary pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200 focus:border-brand-400 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (showNotifications) setHasUnread(false);
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-all duration-200 hover:bg-surface-tertiary hover:text-text-primary"
            aria-label="Notificações"
          >
            <Bell className="h-5 w-5" />
            {hasUnread && (
              <span className="absolute right-2.5 top-2.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              {/* Click-outside backdrop */}
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setShowNotifications(false)} 
              />
              
              {/* Dropdown Card */}
              <div className="absolute right-0 mt-2 z-40 w-96 rounded-2xl border border-border bg-surface shadow-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                  <h3 className="font-semibold text-text-primary flex items-center gap-2">
                    <Bell className="w-4 h-4 text-brand-600" />
                    Notificações
                    {totalAlerts > 0 && (
                      <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {totalAlerts}
                      </span>
                    )}
                  </h3>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="p-1 text-text-tertiary hover:bg-surface-secondary rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {loading ? (
                  <div className="py-8 text-center text-sm text-text-secondary">Carregando...</div>
                ) : (
                  <div className="max-h-[360px] overflow-y-auto space-y-4 pr-1">
                    {/* 1. Aniversariantes */}
                    {notifications?.aniversariantes && notifications.aniversariantes.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold tracking-wider text-text-tertiary uppercase flex items-center gap-1.5">
                          <Cake className="w-3.5 h-3.5 text-brand-500" />
                          Aniversariantes do Dia 🍰
                        </h4>
                        <div className="space-y-1.5">
                          {notifications.aniversariantes.map((cliente) => {
                            const whatsappMsg = encodeURIComponent(
                              `Olá ${cliente.nome}! Nós da equipe Gestão Agro desejamos a você um feliz aniversário, com muita saúde, paz e realizações! Parabéns!`
                            );
                            const waUrl = cliente.telefone
                              ? `https://wa.me/55${cliente.telefone.replace(/\D/g, "")}?text=${whatsappMsg}`
                              : null;

                            return (
                              <div key={cliente.id} className="flex items-center justify-between bg-brand-50/50 p-2.5 rounded-xl border border-brand-100">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-text-primary truncate">
                                    {cliente.nome}
                                  </p>
                                  <p className="text-xs text-text-secondary truncate">
                                    {cliente.telefone || "Sem telefone"}
                                  </p>
                                </div>
                                {waUrl && (
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-8 items-center gap-1.5 rounded-lg bg-green-500 px-3 text-xs font-medium text-white transition-all hover:bg-green-600 active:scale-95 shrink-0"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    Felicitar
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 2. Pendências */}
                    {notifications?.pendencias && notifications.pendencias.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold tracking-wider text-text-tertiary uppercase flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          Pendências Ativas ⚠️
                        </h4>
                        <div className="space-y-1.5">
                          {notifications.pendencias.map((projeto) => (
                            <Link
                              key={projeto.id}
                              href="/projetos"
                              className="block p-2.5 rounded-xl border border-border hover:bg-surface-secondary transition-colors"
                              onClick={() => setShowNotifications(false)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-sm font-semibold text-text-primary line-clamp-1">
                                  {projeto.nome}
                                </span>
                                <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0 mt-0.5" />
                              </div>
                              {projeto.observacao && (
                                <p className="text-xs text-text-secondary mt-1 line-clamp-2 italic">
                                  "{projeto.observacao}"
                                </p>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. Eventos Recentes */}
                    {notifications?.recentes && notifications.recentes.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold tracking-wider text-text-tertiary uppercase flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          Atualizações Recentes
                        </h4>
                        <div className="space-y-2 pl-1.5 border-l-2 border-border">
                          {notifications.recentes.map((evento) => (
                            <div key={evento.id} className="text-xs space-y-0.5">
                              <p className="text-text-primary font-medium">
                                {evento.descricao}
                              </p>
                              {evento.projetoName && (
                                <p className="text-[10px] text-brand-600 font-semibold">
                                  Projeto: {evento.projetoName}
                                </p>
                              )}
                              <p className="text-[9px] text-text-tertiary">
                                {new Date(evento.createdAt).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {(!notifications?.aniversariantes?.length && 
                      !notifications?.pendencias?.length && 
                      !notifications?.recentes?.length) && (
                      <div className="py-12 text-center">
                        <CheckCircle2 className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                        <p className="text-sm text-text-secondary">Nenhuma notificação importante.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-border" />

        {/* User Info */}
        <button
          type="button"
          className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-all duration-200 hover:bg-surface-tertiary"
        >
          {/* Avatar */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {getInitials(userName)}
          </div>

          {/* Name & Role */}
          <div className="hidden flex-col items-start md:flex">
            <span className="text-sm font-medium text-text-primary">
              {userName}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${getRoleBadgeClasses(userRole)}`}
            >
              {getRoleLabel(userRole)}
            </span>
          </div>

          <ChevronDown className="hidden h-4 w-4 text-text-tertiary md:block" />
        </button>
      </div>
    </header>
  );
}

