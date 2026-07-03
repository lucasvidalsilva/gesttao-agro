"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Leaf, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Estados do MFA
  const [mfaCode, setMfaCode] = useState("");
  const [showMfa, setShowMfa] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        mfaCode: showMfa ? mfaCode : undefined,
        redirect: false,
      });

      if (result?.error) {
        // NextAuth v5 repassa o código do erro customizado
        if (result.error === "mfa_required" || result.error.includes("mfa_required")) {
          setShowMfa(true);
          setError("");
        } else if (result.error === "invalid_mfa" || result.error.includes("invalid_mfa")) {
          setError("Código MFA inválido. Verifique o aplicativo autenticador.");
        } else {
          setError("E-mail ou senha inválidos.");
        }
      } else {
        router.push("/projetos");
        router.refresh();
      }
    } catch {
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-900 overflow-hidden font-sans">
      {/* Left Column: Rich Agricultural Branding Image (lg only) */}
      <div className="hidden lg:flex lg:w-3/5 relative justify-center items-center overflow-hidden">
        {/* Background Image with Zoom & Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] hover:scale-105"
          style={{ backgroundImage: "url('/login_bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-green-950/90 via-emerald-950/80 to-slate-950/70" />
        
        {/* Overlay branding content */}
        <div className="relative z-10 max-w-xl px-12 space-y-8 text-white select-none animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-brand-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            Sistema Seguro & Monitorado
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-green-300 bg-clip-text text-transparent">
              Gestão Agro
            </h1>
            <p className="text-lg text-slate-200 leading-relaxed font-light">
              Cultivando inteligência, organizando fluxos e simplificando o crédito rural em um único lugar.
            </p>
          </div>

          {/* Quick value features */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/20 text-green-300 border border-green-500/30">
                <CheckCircle className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-200">Kanban Inteligente</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/20 text-green-300 border border-green-500/30">
                <CheckCircle className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-200">Controle Documental</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/20 text-green-300 border border-green-500/30">
                <CheckCircle className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-200">Linha do Tempo</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/20 text-green-300 border border-green-500/30">
                <CheckCircle className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-200">Segurança de Dados</span>
            </div>
          </div>
        </div>

        {/* Decorative dynamic circles */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Right Column: Clean, Elegant Login Form Card */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center items-center p-8 bg-slate-950 relative">
        {/* Mobile decorative blobs */}
        <div className="lg:hidden absolute top-10 right-10 w-48 h-48 bg-green-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="lg:hidden absolute bottom-10 left-10 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-md space-y-8 z-10">
          {/* Header Mobile Brand */}
          <div className="text-center lg:text-left space-y-3">
            <div className="inline-flex lg:hidden items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-xl shadow-green-950/20 mb-2">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold text-white tracking-tight">
              {showMfa ? "Verificação de Segurança" : "Acesse sua conta"}
            </h2>
            <p className="text-sm text-slate-400">
              {showMfa 
                ? "Insira o código gerado no seu aplicativo de autenticação." 
                : "Entre com suas credenciais de consultoria para acessar o painel."}
            </p>
          </div>

          {/* Form wrapper with elegant card */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {!showMfa ? (
                <>
                  {/* Email */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      E-mail institucional
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="exemplo@gestaoagro.com"
                        required
                        disabled={loading}
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder:text-slate-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 hover:border-slate-700"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        disabled={loading}
                        className="w-full pl-11 pr-11 py-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder:text-slate-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 hover:border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        tabIndex={-1}
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4.5 h-4.5" />
                        ) : (
                          <Eye className="w-4.5 h-4.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* MFA Code */}
                  <div className="space-y-2">
                    <label htmlFor="mfaCode" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Código de Autenticação (MFA)
                    </label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                      <input
                        id="mfaCode"
                        type="text"
                        maxLength={6}
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="000000"
                        required
                        disabled={loading}
                        autoFocus
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder:text-slate-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 hover:border-slate-700 text-center tracking-widest text-lg font-bold"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Error Box */}
              {error && (
                <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-2xl bg-red-950/30 border border-red-900/50 text-red-400 text-sm animate-slide-up">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold shadow-lg shadow-green-950/30 hover:shadow-xl hover:shadow-green-950/40 hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {showMfa ? "Verificando token..." : "Entrando no painel..."}
                  </>
                ) : (
                  showMfa ? "Confirmar e Entrar" : "Acessar Painel"
                )}
              </button>

              {showMfa && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setShowMfa(false);
                    setMfaCode("");
                  }}
                  className="w-full text-center text-xs text-slate-400 hover:text-slate-200 transition-colors mt-2 block"
                >
                  Voltar para o início
                </button>
              )}
            </form>
          </div>

          {/* Footer brand info & LGPD notice */}
          <div className="flex flex-col items-center justify-between gap-4 pt-4 border-t border-slate-900 text-xs text-slate-500 lg:flex-row">
            <div className="space-y-1">
              <p>© {new Date().getFullYear()} Gestão Agro. Todos os direitos reservados.</p>
              <p className="text-[10px] text-slate-600 max-w-[280px] leading-tight">
                Ao continuar, você consente com o uso de cookies de sessão e processamento de dados conforme nossa Política de Privacidade.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800 text-slate-400">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Conexão Criptografada SSL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


