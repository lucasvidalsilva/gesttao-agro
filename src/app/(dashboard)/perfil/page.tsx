"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shield, ShieldAlert, ShieldCheck, Key, User, Mail, UserCheck, Loader2 } from "lucide-react";
import { obterStatusMfa, gerarSegredoMfa, ativarMfa, desativarMfa } from "@/features/usuarios/actions";

export default function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [status, setStatus] = useState<{ enabled: boolean; email: string }>({
    enabled: false,
    email: "",
  });

  // Estado para fluxo de ativação
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");

  // Estado para fluxo de desativação
  const [disableCode, setDisableCode] = useState("");

  useEffect(() => {
    carregarStatus();
  }, []);

  async function carregarStatus() {
    try {
      setLoading(true);
      const res = await obterStatusMfa();
      setStatus(res);
    } catch (e) {
      toast.error("Erro ao carregar informações de segurança.");
    } finally {
      setLoading(false);
    }
  }

  async function iniciarConfiguracaoMfa() {
    try {
      setActionLoading(true);
      const res = await gerarSegredoMfa();
      setSetupData(res);
      toast.success("Segredo MFA gerado! Escaneie o QR Code.");
    } catch (e: any) {
      toast.error(e.message || "Erro ao iniciar configuração do MFA.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirmarAtivacao(e: React.FormEvent) {
    e.preventDefault();
    if (!setupData || !verificationCode) return;

    try {
      setActionLoading(true);
      const res = await ativarMfa(setupData.secret, verificationCode);
      if (res.success) {
        toast.success("Autenticação Multifator (MFA) ativada com sucesso!");
        setSetupData(null);
        setVerificationCode("");
        await carregarStatus();
      } else {
        toast.error(res.error || "Código inválido. Tente novamente.");
      }
    } catch (e) {
      toast.error("Erro ao ativar MFA.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDesativarMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!disableCode) return;

    try {
      setActionLoading(true);
      const res = await desativarMfa(disableCode);
      if (res.success) {
        toast.success("Autenticação Multifator (MFA) desativada.");
        setDisableCode("");
        await carregarStatus();
      } else {
        toast.error(res.error || "Código inválido. Tente novamente.");
      }
    } catch (e) {
      toast.error("Erro ao desativar MFA.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Minha Conta</h1>
        <p className="text-sm text-text-tertiary">
          Gerencie suas informações pessoais e configurações de segurança.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Info Card */}
        <div className="md:col-span-1">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Administrador</h3>
                <p className="text-xs text-text-tertiary">{status.email}</p>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <UserCheck className="h-3.5 w-3.5" />
                Perfil Administrador
              </div>
            </div>
          </div>
        </div>

        {/* Security / MFA Settings */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <Shield className="h-6 w-6 text-brand-600" />
              <div>
                <h2 className="text-lg font-bold text-text-primary">Segurança da Conta</h2>
                <p className="text-xs text-text-tertiary">Proteja seu acesso administrativo.</p>
              </div>
            </div>

            {/* MFA Status Banner */}
            <div className={`flex items-start gap-4 rounded-xl border p-4 ${
              status.enabled 
                ? "bg-green-50 border-green-200 text-green-800" 
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}>
              {status.enabled ? (
                <ShieldCheck className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">
                  {status.enabled ? "Autenticação Multifator (MFA) Ativa" : "Autenticação de Dois Fatores Requerida"}
                </h4>
                <p className="text-xs opacity-90">
                  {status.enabled 
                    ? "Seu login está protegido por uma camada adicional de autenticação baseada em token."
                    : "Recomendamos ativar o MFA para impedir acessos não autorizados por invasores."}
                </p>
              </div>
            </div>

            {/* Configuração do MFA */}
            {!status.enabled ? (
              <div className="space-y-6">
                {!setupData ? (
                  <div className="space-y-4">
                    <p className="text-sm text-text-secondary leading-relaxed">
                      Ative a autenticação de dois fatores para proteger seu painel. Ao fazer login, você precisará fornecer um código temporário de 6 dígitos gerado pelo seu celular.
                    </p>
                    <button
                      onClick={iniciarConfiguracaoMfa}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                      Ativar MFA de Administrador
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleConfirmarAtivacao} className="space-y-6 border border-border p-5 rounded-xl bg-surface-secondary animate-fade-in">
                    <h3 className="font-bold text-text-primary text-sm">Configurando o MFA</h3>
                    
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      {/* QR Code */}
                      <div className="bg-white p-3 rounded-lg border border-border shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={setupData.qrCodeUrl} 
                          alt="QR Code Autenticador"
                          width={180}
                          height={180}
                          className="mx-auto"
                        />
                      </div>
                      
                      {/* Instructions */}
                      <div className="space-y-3 flex-1 text-sm text-text-secondary">
                        <p>1. Abra seu aplicativo de autenticação (ex: <strong>Google Authenticator</strong> ou <strong>Microsoft Authenticator</strong>).</p>
                        <p>2. Escaneie o QR Code ao lado ou insira a chave secreta manualmente:</p>
                        <div className="bg-slate-900 border border-slate-800 text-green-400 font-mono text-xs px-3 py-2 rounded-lg select-all break-all text-center">
                          {setupData.secret}
                        </div>
                      </div>
                    </div>

                    {/* Verification Code input */}
                    <div className="space-y-2 border-t border-border pt-4">
                      <label htmlFor="verifyCode" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Insira o código de 6 dígitos gerado pelo app
                      </label>
                      <div className="flex gap-3 items-center">
                        <input
                          id="verifyCode"
                          type="text"
                          maxLength={6}
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="000000"
                          required
                          disabled={actionLoading}
                          className="w-40 px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary text-center tracking-widest text-lg font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        />
                        <button
                          type="submit"
                          disabled={actionLoading || verificationCode.length !== 6}
                          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-700 transition-colors disabled:opacity-50"
                        >
                          {actionLoading ? "Confirmando..." : "Confirmar e Ativar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSetupData(null);
                            setVerificationCode("");
                          }}
                          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-tertiary transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              // Desativação do MFA
              <div className="space-y-4">
                <p className="text-sm text-text-secondary">
                  A autenticação de dois fatores está ativa. Se você precisar desativá-la, forneça um token válido de 6 dígitos gerado pelo seu aplicativo autenticador.
                </p>
                <form onSubmit={handleDesativarMfa} className="flex gap-3 items-end max-w-md">
                  <div className="space-y-1.5 flex-1">
                    <label htmlFor="disableCode" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Código MFA para Desativar
                    </label>
                    <input
                      id="disableCode"
                      type="text"
                      maxLength={6}
                      value={disableCode}
                      onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="000000"
                      required
                      disabled={actionLoading}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary text-center tracking-widest text-lg font-bold focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={actionLoading || disableCode.length !== 6}
                    className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-red-700 transition-colors disabled:opacity-50 h-[46px]"
                  >
                    {actionLoading ? "Processando..." : "Desativar MFA"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const runtime = 'edge';
