import { PrismaClient } from "@prisma/client";
import { Role, KanbanStatus, TipoEvento } from "../src/types";
import { hash } from "bcrypt-ts";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando semeadura do banco de dados...");

  // 1. Limpar banco de dados existente
  // Excluir na ordem correta para respeitar as chaves estrangeiras
  await prisma.historicoEvento.deleteMany();
  await prisma.transicaoKanban.deleteMany();
  await prisma.documentoUpload.deleteMany();
  await prisma.documentoChecklist.deleteMany();
  await prisma.projeto.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("Banco de dados limpo.");

  // 2. Criar Usuários
  const adminPasswordHash = await hash("admin123", 10);
  const colabPasswordHash = await hash("colab123", 10);
  const viewPasswordHash = await hash("view123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Administrador do Sistema",
      email: "admin@gestaoagro.com.br",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      active: true,
    },
  });
  console.log("Banco de dados limpo e usuário admin criado com sucesso.");
}

main()
  .catch((e) => {
    console.error("Erro durante a semeadura:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
