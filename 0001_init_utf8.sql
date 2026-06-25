-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "passwordHash" TEXT NOT NULL,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'COLABORADOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "twoFactorSecret" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "dataNascimento" DATETIME,
    "dataEntrada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "projetos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INICIAL',
    "dataInicio" DATETIME NOT NULL,
    "dataEnvioAnalise" DATETIME,
    "dataResposta" DATETIME,
    "dataOcorrencia" DATETIME,
    "observacao" TEXT,
    "valorProjeto" REAL,
    "comissao" REAL,
    "dataPagamento" DATETIME,
    "posicao" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "clienteId" TEXT NOT NULL,
    "responsavelId" TEXT NOT NULL,
    "criadorId" TEXT NOT NULL,
    CONSTRAINT "projetos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "projetos_criadorId_fkey" FOREIGN KEY ("criadorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "projetos_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "documento_checklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "enviado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "projetoId" TEXT NOT NULL,
    CONSTRAINT "documento_checklist_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "projetos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "documento_uploads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomeOriginal" TEXT NOT NULL,
    "nomeStorage" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadPorId" TEXT NOT NULL,
    "projetoId" TEXT,
    "clienteId" TEXT,
    "checklistItemId" TEXT,
    "tipoDocumentoId" TEXT,
    CONSTRAINT "documento_uploads_tipoDocumentoId_fkey" FOREIGN KEY ("tipoDocumentoId") REFERENCES "tipos_documentos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documento_uploads_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "documento_checklist" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documento_uploads_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "documento_uploads_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "projetos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "documento_uploads_uploadPorId_fkey" FOREIGN KEY ("uploadPorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tipos_documentos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "transicoes_kanban" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "statusAnterior" TEXT NOT NULL,
    "statusNovo" TEXT NOT NULL,
    "dados" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projetoId" TEXT NOT NULL,
    CONSTRAINT "transicoes_kanban_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "projetos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "historico_eventos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "dados" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projetoId" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "historico_eventos_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "projetos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "historico_eventos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cpfCnpj_key" ON "clientes"("cpfCnpj");

-- CreateIndex
CREATE UNIQUE INDEX "documento_uploads_checklistItemId_key" ON "documento_uploads"("checklistItemId");

