import { format as fnsFormat } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Remove todos os caracteres não numéricos de uma string.
 */
function somenteNumeros(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Formata um CPF no padrão XXX.XXX.XXX-XX.
 */
export function formatCPF(value: string): string {
  const digits = somenteNumeros(value).slice(0, 11);
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/**
 * Formata um CNPJ no padrão XX.XXX.XXX/XXXX-XX.
 */
export function formatCNPJ(value: string): string {
  const digits = somenteNumeros(value).slice(0, 14);
  return digits.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    "$1.$2.$3/$4-$5"
  );
}

/**
 * Detecta automaticamente se o valor é CPF ou CNPJ e aplica a formatação correspondente.
 */
export function formatCPFCNPJ(value: string): string {
  const digits = somenteNumeros(value);
  if (digits.length <= 11) {
    return formatCPF(digits);
  }
  return formatCNPJ(digits);
}

/**
 * Formata um telefone no padrão (XX) XXXXX-XXXX (celular) ou (XX) XXXX-XXXX (fixo).
 */
export function formatTelefone(value: string): string {
  const digits = somenteNumeros(value).slice(0, 11);
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return value;
}

/**
 * Formata um valor numérico como moeda brasileira (R$ X.XXX,XX).
 */
export function formatMoeda(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Converte uma data para o formato DD/MM/YYYY.
 */
export function formatData(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return fnsFormat(d, "dd/MM/yyyy", { locale: ptBR });
}

/**
 * Converte uma data para o formato DD/MM/YYYY HH:mm.
 */
export function formatDataHora(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return fnsFormat(d, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

/**
 * Máscara de entrada para CPF/CNPJ — aplica a formatação progressivamente
 * conforme o usuário digita.
 */
export function maskCPFCNPJ(value: string): string {
  const digits = somenteNumeros(value).slice(0, 14);
  const len = digits.length;

  if (len <= 3) return digits;
  if (len <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (len <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  if (len <= 11)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  if (len <= 12)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  if (len <= 13)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

/**
 * Máscara de entrada para telefone — aplica a formatação progressivamente
 * conforme o usuário digita.
 */
export function maskTelefone(value: string): string {
  const digits = somenteNumeros(value).slice(0, 11);
  const len = digits.length;

  if (len <= 2) return digits;
  if (len <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;

  if (len <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
