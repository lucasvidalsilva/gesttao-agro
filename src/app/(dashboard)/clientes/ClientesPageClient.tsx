"use client";

import { useState } from "react";
import { Search, Plus, Users, Phone, Mail } from "lucide-react";
import Link from "next/link";
import ClienteFormModal from "@/components/forms/ClienteFormModal";
import { formatCPFCNPJ, formatTelefone } from "@/utils/format";
import type { KanbanStatus } from "@prisma/client";

interface ClienteProjeto {
  id: string;
  nome: string;
  status: KanbanStatus;
}

interface ClienteListItem {
  id: string;
  nome: string;
  cpfCnpj: string;
  telefone: string | null;
  email: string | null;
  _count: {
    projetos: number;
    documentos: number;
  };
  projetos: ClienteProjeto[];
}

interface ClientesPageClientProps {
  clientes: ClienteListItem[];
}

export default function ClientesPageClient({ clientes }: ClientesPageClientProps) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const filteredClientes = clientes.filter((cliente) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      cliente.nome.toLowerCase().includes(term) ||
      cliente.cpfCnpj.includes(term.replace(/\D/g, "")) ||
      (cliente.email && cliente.email.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
            <Users className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Clientes</h1>
            <p className="text-sm text-text-secondary">
              {clientes.length} {clientes.length === 1 ? "cliente cadastrado" : "clientes cadastrados"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-700 hover:shadow-md active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          placeholder="Buscar por nome, CPF/CNPJ ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary transition-colors duration-200 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {/* Table */}
      {filteredClientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-tertiary">
            <Users className="h-7 w-7 text-text-tertiary" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-text-primary">
            {search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            {search
              ? "Tente buscar com outro termo."
              : "Clique em \"Novo Cliente\" para adicionar o primeiro."}
          </p>
          {!search && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              Novo Cliente
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Nome
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    CPF/CNPJ
                  </th>
                  <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary md:table-cell">
                    Telefone
                  </th>
                  <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary lg:table-cell">
                    E-mail
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Projetos
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredClientes.map((cliente) => (
                  <tr
                    key={cliente.id}
                    className="group transition-colors duration-150 hover:bg-brand-50/40"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/clientes/${cliente.id}`}
                        className="font-medium text-text-primary transition-colors duration-200 hover:text-brand-600"
                      >
                        {cliente.nome}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-sm text-text-secondary font-mono">
                      {formatCPFCNPJ(cliente.cpfCnpj)}
                    </td>
                    <td className="hidden px-5 py-4 md:table-cell">
                      {cliente.telefone ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
                          <Phone className="h-3.5 w-3.5 text-text-tertiary" />
                          {formatTelefone(cliente.telefone)}
                        </span>
                      ) : (
                        <span className="text-sm text-text-tertiary">—</span>
                      )}
                    </td>
                    <td className="hidden px-5 py-4 lg:table-cell">
                      {cliente.email ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
                          <Mail className="h-3.5 w-3.5 text-text-tertiary" />
                          {cliente.email}
                        </span>
                      ) : (
                        <span className="text-sm text-text-tertiary">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-brand-100 px-2 text-xs font-semibold text-brand-700">
                        {cliente._count.projetos}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/clientes/${cliente.id}`}
                        className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-all duration-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                      >
                        Ver detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <ClienteFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
      />
    </div>
  );
}
