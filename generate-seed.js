const { hash } = require("bcryptjs");
const fs = require("fs");

async function run() {
  const adminPasswordHash = await hash("admin123", 10);
  const sql = `INSERT INTO "users" ("id", "name", "email", "passwordHash", "role", "active", "updatedAt") VALUES ('admin001', 'Administrador do Sistema', 'admin@gestaoagro.com.br', '${adminPasswordHash}', 'ADMIN', 1, CURRENT_TIMESTAMP);`;
  fs.writeFileSync("0002_seed.sql", sql);
}
run();
