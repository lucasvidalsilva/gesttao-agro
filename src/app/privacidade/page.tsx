import Link from "next/link";
import { Shield, ArrowLeft, Lock, Database, UserCheck, Scale } from "lucide-react";

export const metadata = {
  title: "Política de Privacidade & Termos | Gestão Agro",
  description: "Declaração de conformidade com a LGPD e termos de uso do sistema.",
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Navigation / Back Button */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o sistema
          </Link>
        </div>

        {/* Card Container */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-xl space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Termos & Privacidade</h1>
              <p className="text-sm text-slate-500 mt-1">Conformidade com a LGPD (Lei Geral de Proteção de Dados)</p>
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
              <Database className="w-5 h-5 text-brand-600 shrink-0" />
              <h2>1. Coleta e Finalidade dos Dados</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              O **Gestão Agro** coleta e processa documentos e informações de produtores rurais única e exclusivamente para a finalidade de **análise e concessão de crédito rural**. Os documentos carregados (como comprovantes de residência, matrículas de imóveis e certidões negativas de débitos) são associados aos projetos do Kanban de forma a agilizar a aprovação junto a órgãos reguladores e bancos de fomento.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
              <Lock className="w-5 h-5 text-brand-600 shrink-0" />
              <h2>2. Segurança de Armazenamento</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              Todos os arquivos e documentos são armazenados em ambiente privado criptografado na borda (**Cloudflare R2**). O acesso a esses arquivos é restrito apenas a consultores e administradores autorizados com base em regras de controle de acesso (RBAC e RLS) ativas na aplicação. Nenhum arquivo é exposto publicamente na internet.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
              <UserCheck className="w-5 h-5 text-brand-600 shrink-0" />
              <h2>3. Direitos do Titular (LGPD)</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              Nos termos da LGPD, o cliente titular dos dados possui o direito de:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600">
              <li>Confirmar a existência do tratamento de seus dados.</li>
              <li>Acessar seus dados e requerer a correção de informações desatualizadas ou incorretas.</li>
              <li>Solicitar a exclusão ou eliminação definitiva de dados pessoais desnecessários ou tratados em desconformidade com a lei.</li>
              <li>Saber com quais entidades públicas ou privadas compartilhamos dados (somente com os bancos/cooperativas responsáveis pelo financiamento agrícola do projeto).</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
              <Scale className="w-5 h-5 text-brand-600 shrink-0" />
              <h2>4. Retenção e Descarte</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              Os dados e documentos dos projetos de crédito rural serão mantidos pelo período legal exigido pelas instituições financeiras envolvidas. Uma vez encerrado esse prazo ou mediante solicitação do titular (observadas as restrições contratuais de empréstimos vigentes), os documentos serão permanentemente eliminados de nossos repositórios em nuvem de forma segura.
            </p>
          </div>

          {/* Footer Info */}
          <div className="border-t border-slate-100 pt-6 text-xs text-slate-400 flex flex-col sm:flex-row justify-between gap-4">
            <p>Última atualização: Junho de 2026</p>
            <p>Gestão Agro — Soluções Tecnológicas para o Crédito Rural</p>
          </div>
        </div>
      </div>
    </div>
  );
}
