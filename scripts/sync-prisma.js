const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');

function syncPrisma() {
  console.log('🔄 Sincronizando ambiente e banco de dados...');

  if (!fs.existsSync(envPath)) {
    console.warn('⚠️ Arquivo .env não encontrado. Pulando sincronização.');
    return;
  }

  let envContent = fs.readFileSync(envPath, 'utf8');

  // Extrai variáveis
  const getEnvVar = (name) => {
    const match = envContent.match(new RegExp(`^${name}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1] : null;
  };

  const mode = getEnvVar('DEPLOYMENT_MODE') || 'on-premise';
  const urlLocal = getEnvVar('DATABASE_URL_LOCAL');
  const urlProd = getEnvVar('DATABASE_URL_PROD');

  let provider = 'sqlite';
  let activeUrl = urlLocal;

  if (mode === 'production') {
    provider = 'postgresql';
    activeUrl = urlProd;
    console.log('🚀 Modo Produção detectado: Configurando para PostgreSQL (Supabase)');
  } else {
    console.log('🏠 Modo On-Premise detectado: Configurando para SQLite Local');
  }

  // Atualiza DATABASE_URL no .env
  if (activeUrl) {
    if (/^DATABASE_URL=/m.test(envContent)) {
      envContent = envContent.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL="${activeUrl}"`);
    } else {
      envContent += `\nDATABASE_URL="${activeUrl}"\n`;
    }
    fs.writeFileSync(envPath, envContent);
  }

  // Atualiza schema.prisma
  if (fs.existsSync(schemaPath)) {
    let schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    // Substitui o provider dentro do bloco datasource db
    schemaContent = schemaContent.replace(/(datasource\s+db\s*{[^}]*provider\s*=\s*)"[^"]*"/, `$1"${provider}"`);
    
    // Remove previewFeatures = ["driverAdapters"] que era usado na Cloudflare
    if (schemaContent.includes('previewFeatures = ["driverAdapters"]')) {
      schemaContent = schemaContent.replace(/\s*previewFeatures\s*=\s*\["driverAdapters"\]/, '');
    }

    fs.writeFileSync(schemaPath, schemaContent);
    console.log(`✅ schema.prisma atualizado (provider: ${provider})`);
  }
}

syncPrisma();
