import { PrismaClient, Role, KanbanStatus, TipoEvento } from "@prisma/client";
import { hash } from "bcryptjs";

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

  const colaborador = await prisma.user.create({
    data: {
      name: "João Colaborador",
      email: "colaborador@gestaoagro.com.br",
      passwordHash: colabPasswordHash,
      role: Role.COLABORADOR,
      active: true,
    },
  });

  const visualizador = await prisma.user.create({
    data: {
      name: "Pedro Visualizador",
      email: "visualizador@gestaoagro.com.br",
      passwordHash: viewPasswordHash,
      role: Role.VISUALIZADOR,
      active: true,
    },
  });

  console.log("Usuários criados:", { admin: admin.email, colaborador: colaborador.email, visualizador: visualizador.email });

  // 3. Criar Clientes
  const cliente1 = await prisma.cliente.create({
    data: {
      nome: "Carlos Eduardo Ferreira",
      cpfCnpj: "482.910.384-90",
      telefone: "(62) 99881-2233",
      email: "carlos.eduardo@fazendareal.com",
      dataNascimento: new Date("1975-06-15"),
      observacoes: "Produtor de soja e milho no sul do estado. Possui perfil conservador e bom histórico de crédito.",
    },
  });

  const cliente2 = await prisma.cliente.create({
    data: {
      nome: "Fazenda Progresso Agrícola LTDA",
      cpfCnpj: "12.345.678/0001-90",
      telefone: "(34) 3210-9000",
      email: "contato@progressoagricola.com.br",
      observacoes: "Grande grupo produtor de grãos e pecuária de corte. Focado em expansão de área de irrigação.",
    },
  });

  const cliente3 = await prisma.cliente.create({
    data: {
      nome: "Maria Helena Souza",
      cpfCnpj: "892.123.456-78",
      telefone: "(67) 98112-4455",
      email: "maria.souza@agrohelen.com",
      dataNascimento: new Date("1982-11-22"),
      observacoes: "Pequena produtora de hortifrúti e piscicultura. Buscando Pronaf para melhorias estruturais.",
    },
  });

  console.log("Clientes criados:", [cliente1.nome, cliente2.nome, cliente3.nome]);

  // 4. Criar Projetos
  // Projeto 1: Custeio Soja 2026 (status: INICIAL, for Carlos)
  const projeto1 = await prisma.projeto.create({
    data: {
      nome: "Custeio Soja Safra 2026",
      status: KanbanStatus.INICIAL,
      dataInicio: new Date(),
      clienteId: cliente1.id,
      responsavelId: colaborador.id,
      criadorId: admin.id,
      posicao: 0,
    },
  });

  // Criar checklist padrão para o Projeto 1
  const checklistPadrao = [
    { nome: "DARF", descricao: "Documento de Arrecadação de Receitas Federais", obrigatorio: true },
    { nome: "Documento Pessoal (RG/CPF)", descricao: "Cópia do RG ou CPF do proprietário", obrigatorio: true },
    { nome: "Comprovante de Endereço", descricao: "Comprovante de endereço atualizado (últimos 3 meses)", obrigatorio: true },
    { nome: "Contrato Social / Matrícula do Imóvel", descricao: "Contrato social da empresa ou matrícula atualizada do imóvel rural", obrigatorio: true },
    { nome: "Declaração do ITR", descricao: "Última declaração do Imposto sobre a Propriedade Territorial Rural", obrigatorio: true },
    { nome: "Certidão Negativa de Débitos", descricao: "Certidão negativa de débitos federais, estaduais ou municipais", obrigatorio: false },
    { nome: "Outros Documentos", descricao: "Documentos adicionais relevantes ao projeto", obrigatorio: false },
  ];

  for (let i = 0; i < checklistPadrao.length; i++) {
    await prisma.documentoChecklist.create({
      data: {
        nome: checklistPadrao[i].nome,
        descricao: checklistPadrao[i].descricao,
        obrigatorio: checklistPadrao[i].obrigatorio,
        ordem: i,
        enviado: false,
        projetoId: projeto1.id,
      },
    });
  }

  // Registrar histórico do Projeto 1
  await prisma.historicoEvento.create({
    data: {
      tipo: TipoEvento.CRIACAO,
      descricao: `Projeto criado por ${admin.name} e atribuído a ${colaborador.name}.`,
      projetoId: projeto1.id,
      userId: admin.id,
    },
  });

  // Projeto 2: Financiamento Trator (status: EM_ANALISE, for Maria)
  const projeto2 = await prisma.projeto.create({
    data: {
      nome: "Financiamento Trator John Deere",
      status: KanbanStatus.EM_ANALISE,
      dataInicio: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 dias atrás
      dataEnvioAnalise: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      clienteId: cliente3.id,
      responsavelId: colaborador.id,
      criadorId: colaborador.id,
      posicao: 0,
    },
  });

  // Criar checklist com alguns itens já enviados
  const checklistItemsProj2 = [];
  for (let i = 0; i < checklistPadrao.length; i++) {
    // Definir os primeiros 4 como enviados para simular preenchimento
    const enviado = i < 4;
    const checklistItem = await prisma.documentoChecklist.create({
      data: {
        nome: checklistPadrao[i].nome,
        descricao: checklistPadrao[i].descricao,
        obrigatorio: checklistPadrao[i].obrigatorio,
        ordem: i,
        enviado: enviado,
        projetoId: projeto2.id,
      },
    });
    checklistItemsProj2.push(checklistItem);

    if (enviado) {
      // Criar documento fake correspondente
      const doc = await prisma.documentoUpload.create({
        data: {
          nomeOriginal: `${checklistPadrao[i].nome.toLowerCase().replace(/\//g, "-")}.pdf`,
          nomeStorage: `documentos/${projeto2.id}/${Date.now()}_${i}.pdf`,
          url: `https://mockstorage.supabase.co/documentos/${projeto2.id}/${Date.now()}_${i}.pdf`,
          tamanho: 1024 * 1024 * (i + 1), // 1MB a 4MB
          tipo: "application/pdf",
          uploadPorId: colaborador.id,
          projetoId: projeto2.id,
          checklistItemId: checklistItem.id,
        },
      });
    }
  }

  // Histórico do Projeto 2
  await prisma.historicoEvento.create({
    data: {
      tipo: TipoEvento.CRIACAO,
      descricao: `Projeto criado por ${colaborador.name}.`,
      projetoId: projeto2.id,
      userId: colaborador.id,
    },
  });
  await prisma.historicoEvento.create({
    data: {
      tipo: TipoEvento.MOVIMENTACAO,
      descricao: `Projeto movido para Em Análise por ${colaborador.name}.`,
      projetoId: projeto2.id,
      userId: colaborador.id,
    },
  });

  // Projeto 3: Custeio Milho (status: COM_PENDENCIA, for Fazenda Progresso)
  const projeto3 = await prisma.projeto.create({
    data: {
      nome: "Custeio Milho Safrinha 2026",
      status: KanbanStatus.COM_PENDENCIA,
      dataInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
      dataEnvioAnalise: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      dataOcorrencia: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      dataResposta: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      observacao: "Banco solicitou nova certidão de débitos estaduais pois a enviada estava vencida.",
      clienteId: cliente2.id,
      responsavelId: colaborador.id,
      criadorId: colaborador.id,
      posicao: 0,
    },
  });

  // Criar checklist para o Projeto 3
  for (let i = 0; i < checklistPadrao.length; i++) {
    const enviado = i !== 5; // A certidão negativa (índice 5) está pendente
    const checklistItem = await prisma.documentoChecklist.create({
      data: {
        nome: checklistPadrao[i].nome,
        descricao: checklistPadrao[i].descricao,
        obrigatorio: checklistPadrao[i].obrigatorio,
        ordem: i,
        enviado: enviado,
        projetoId: projeto3.id,
      },
    });

    if (enviado) {
      await prisma.documentoUpload.create({
        data: {
          nomeOriginal: `${checklistPadrao[i].nome.toLowerCase().replace(/\//g, "-")}.pdf`,
          nomeStorage: `documentos/${projeto3.id}/${Date.now()}_${i}.pdf`,
          url: `https://mockstorage.supabase.co/documentos/${projeto3.id}/${Date.now()}_${i}.pdf`,
          tamanho: 1024 * 512 * (i + 1),
          tipo: "application/pdf",
          uploadPorId: colaborador.id,
          projetoId: projeto3.id,
          checklistItemId: checklistItem.id,
        },
      });
    }
  }

  // Histórico do Projeto 3
  await prisma.historicoEvento.create({
    data: {
      tipo: TipoEvento.CRIACAO,
      descricao: `Projeto criado por ${colaborador.name}.`,
      projetoId: projeto3.id,
      userId: colaborador.id,
    },
  });
  await prisma.historicoEvento.create({
    data: {
      tipo: TipoEvento.MOVIMENTACAO,
      descricao: `Projeto movido para Em Análise por ${colaborador.name}.`,
      projetoId: projeto3.id,
      userId: colaborador.id,
    },
  });
  await prisma.historicoEvento.create({
    data: {
      tipo: TipoEvento.MOVIMENTACAO,
      descricao: `Pendência registrada por ${colaborador.name}: Banco solicitou nova certidão de débitos estaduais pois a enviada estava vencida.`,
      projetoId: projeto3.id,
      userId: colaborador.id,
    },
  });

  // Projeto 4: Investimento Irrigação (status: LIBERADO, for Carlos)
  const projeto4 = await prisma.projeto.create({
    data: {
      nome: "Projeto Pivô Central Irrigação",
      status: KanbanStatus.LIBERADO,
      dataInicio: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      dataEnvioAnalise: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      valorProjeto: 850000.00,
      comissao: 17000.00, // 2% de comissão
      clienteId: cliente1.id,
      responsavelId: admin.id,
      criadorId: admin.id,
      posicao: 0,
    },
  });

  // Criar checklist (todos enviados para liberação)
  for (let i = 0; i < checklistPadrao.length; i++) {
    const checklistItem = await prisma.documentoChecklist.create({
      data: {
        nome: checklistPadrao[i].nome,
        descricao: checklistPadrao[i].descricao,
        obrigatorio: checklistPadrao[i].obrigatorio,
        ordem: i,
        enviado: true,
        projetoId: projeto4.id,
      },
    });

    await prisma.documentoUpload.create({
      data: {
        nomeOriginal: `${checklistPadrao[i].nome.toLowerCase().replace(/\//g, "-")}.pdf`,
        nomeStorage: `documentos/${projeto4.id}/${Date.now()}_${i}.pdf`,
        url: `https://mockstorage.supabase.co/documentos/${projeto4.id}/${Date.now()}_${i}.pdf`,
        tamanho: 1024 * 300 * (i + 1),
        tipo: "application/pdf",
        uploadPorId: admin.id,
        projetoId: projeto4.id,
        checklistItemId: checklistItem.id,
      },
    });
  }

  // Histórico do Projeto 4
  await prisma.historicoEvento.create({
    data: {
      tipo: TipoEvento.CRIACAO,
      descricao: `Projeto criado por ${admin.name}.`,
      projetoId: projeto4.id,
      userId: admin.id,
    },
  });
  await prisma.historicoEvento.create({
    data: {
      tipo: TipoEvento.MOVIMENTACAO,
      descricao: `Projeto movido para Em Análise por ${admin.name}.`,
      projetoId: projeto4.id,
      userId: admin.id,
    },
  });
  await prisma.historicoEvento.create({
    data: {
      tipo: TipoEvento.MOVIMENTACAO,
      descricao: `Crédito Liberado! Valor do Projeto: R$ 850.000,00 | Comissão: R$ 17.000,00. Registrado por ${admin.name}.`,
      projetoId: projeto4.id,
      userId: admin.id,
    },
  });

  // Projeto 5: Custeio Trigo (status: PAGO, for Maria)
  const projeto5 = await prisma.projeto.create({
    data: {
      nome: "Custeio Trigo Safra 2025",
      status: KanbanStatus.PAGO,
      dataInicio: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      dataEnvioAnalise: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000),
      valorProjeto: 320000.00,
      comissao: 6400.00,
      dataPagamento: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 dias atrás
      clienteId: cliente3.id,
      responsavelId: colaborador.id,
      criadorId: colaborador.id,
      posicao: 0,
    },
  });

  // Criar checklist (todos enviados)
  for (let i = 0; i < checklistPadrao.length; i++) {
    const checklistItem = await prisma.documentoChecklist.create({
      data: {
        nome: checklistPadrao[i].nome,
        descricao: checklistPadrao[i].descricao,
        obrigatorio: checklistPadrao[i].obrigatorio,
        ordem: i,
        enviado: true,
        projetoId: projeto5.id,
      },
    });

    await prisma.documentoUpload.create({
      data: {
        nomeOriginal: `${checklistPadrao[i].nome.toLowerCase().replace(/\//g, "-")}.pdf`,
        nomeStorage: `documentos/${projeto5.id}/${Date.now()}_${i}.pdf`,
        url: `https://mockstorage.supabase.co/documentos/${projeto5.id}/${Date.now()}_${i}.pdf`,
        tamanho: 1024 * 250 * (i + 1),
        tipo: "application/pdf",
        uploadPorId: colaborador.id,
        projetoId: projeto5.id,
        checklistItemId: checklistItem.id,
      },
    });
  }

  // Histórico do Projeto 5
  await prisma.historicoEvento.create({
    data: {
      tipo: TipoEvento.CRIACAO,
      descricao: `Projeto criado por ${colaborador.name}.`,
      projetoId: projeto5.id,
      userId: colaborador.id,
    },
  });
  await prisma.historicoEvento.create({
    data: {
      tipo: TipoEvento.MOVIMENTACAO,
      descricao: `Projeto movido para Em Análise por ${colaborador.name}.`,
      projetoId: projeto5.id,
      userId: colaborador.id,
    },
  });
  await prisma.historicoEvento.create({
    data: {
      tipo: TipoEvento.MOVIMENTACAO,
      descricao: `Crédito Liberado! Valor do Projeto: R$ 320.000,00 | Comissão: R$ 6.400,00. Registrado por ${colaborador.name}.`,
      projetoId: projeto5.id,
      userId: colaborador.id,
    },
  });
  await prisma.historicoEvento.create({
    data: {
      tipo: TipoEvento.MOVIMENTACAO,
      descricao: `Comissão recebida! Pagamento confirmado por ${colaborador.name}.`,
      projetoId: projeto5.id,
      userId: colaborador.id,
    },
  });

  console.log("Projetos e históricos criados com sucesso.");
  console.log("Semeadura concluída!");
}

main()
  .catch((e) => {
    console.error("Erro durante a semeadura:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
