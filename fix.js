const fs = require('fs');
const files = [
  'c:/.producao/gestaoagro/src/app/(auth)/login/page.tsx',
  'c:/.producao/gestaoagro/src/app/(dashboard)/clientes/[id]/page.tsx',
  'c:/.producao/gestaoagro/src/app/(dashboard)/clientes/page.tsx',
  'c:/.producao/gestaoagro/src/app/(dashboard)/configuracoes/page.tsx',
  'c:/.producao/gestaoagro/src/app/(dashboard)/dashboard/page.tsx',
  'c:/.producao/gestaoagro/src/app/(dashboard)/perfil/page.tsx',
  'c:/.producao/gestaoagro/src/app/(dashboard)/projetos/page.tsx',
  'c:/.producao/gestaoagro/src/app/(dashboard)/usuarios/page.tsx',
  'c:/.producao/gestaoagro/src/app/api/auth/[...nextauth]/route.ts',
  'c:/.producao/gestaoagro/src/app/page.tsx',
  'c:/.producao/gestaoagro/src/app/privacidade/page.tsx'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/export\s+const\s+runtime\s*=\s*['"]edge['"];?/g, '');
  fs.writeFileSync(f, content);
  console.log('Fixed', f);
});
