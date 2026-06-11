import { z } from "zod";

export const criarProjetoSchema = z.object({
  nome: z
    .string()
    .min(3, "Nome do projeto deve ter no mínimo 3 caracteres")
    .max(200, "Nome do projeto deve ter no máximo 200 caracteres"),
  clienteId: z.string().min(1, "Selecione um cliente"),
  dataInicio: z.string().min(1, "Data de início é obrigatória"),
});

export const transicaoAnaliseSchema = z.object({
  projetoId: z.string().min(1, "Projeto é obrigatório"),
  dataEnvioAnalise: z.string().min(1, "Data de envio para análise é obrigatória"),
});

export const transicaoPendenciaSchema = z.object({
  projetoId: z.string().min(1, "Projeto é obrigatório"),
  dataResposta: z.string().min(1, "Data da resposta é obrigatória"),
  dataOcorrencia: z.string().min(1, "Data da ocorrência é obrigatória"),
  observacao: z
    .string()
    .min(5, "Observação deve ter no mínimo 5 caracteres")
    .max(2000, "Observação deve ter no máximo 2000 caracteres"),
});

export const transicaoLiberadoSchema = z.object({
  projetoId: z.string().min(1, "Projeto é obrigatório"),
  valorProjeto: z
    .number({ message: "Valor do projeto é obrigatório" })
    .positive("Valor deve ser positivo"),
  comissao: z
    .number({ message: "Comissão é obrigatória" })
    .min(0, "Comissão não pode ser negativa"),
});

export const transicaoPagoSchema = z.object({
  projetoId: z.string().min(1, "Projeto é obrigatório"),
  dataPagamento: z.string().min(1, "Data de pagamento é obrigatória"),
  confirmacao: z.literal(true, {
    message: "Confirme o recebimento da comissão",
  }),
});

export const retornoAnaliseSchema = z.object({
  projetoId: z.string().min(1, "Projeto é obrigatório"),
});

export const criarClienteSchema = z.object({
  nome: z
    .string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  cpfCnpj: z
    .string()
    .min(11, "CPF/CNPJ inválido")
    .max(18, "CPF/CNPJ inválido"),
  telefone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  dataNascimento: z.string().optional(),
  observacoes: z.string().max(2000).optional(),
});

export const atualizarClienteSchema = criarClienteSchema.partial().extend({
  id: z.string().min(1),
});

export const criarUsuarioSchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z
    .string()
    .min(6, "Senha deve ter no mínimo 6 caracteres")
    .max(100, "Senha deve ter no máximo 100 caracteres"),
  role: z.enum(["ADMIN", "COLABORADOR", "VISUALIZADOR"], {
    message: "Perfil inválido",
  }),
});

export const resetarSenhaSchema = z.object({
  userId: z.string().min(1),
  newPassword: z
    .string()
    .min(6, "Nova senha deve ter no mínimo 6 caracteres"),
});

export type CriarProjetoInput = z.infer<typeof criarProjetoSchema>;
export type TransicaoAnaliseInput = z.infer<typeof transicaoAnaliseSchema>;
export type TransicaoPendenciaInput = z.infer<typeof transicaoPendenciaSchema>;
export type TransicaoLiberadoInput = z.infer<typeof transicaoLiberadoSchema>;
export type TransicaoPagoInput = z.infer<typeof transicaoPagoSchema>;
export type CriarClienteInput = z.infer<typeof criarClienteSchema>;
export type AtualizarClienteInput = z.infer<typeof atualizarClienteSchema>;
export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;
export type ResetarSenhaInput = z.infer<typeof resetarSenhaSchema>;
