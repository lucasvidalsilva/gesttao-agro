const fs = require('fs');
const files = [
  'src/app/api/auth/[...nextauth]/route.ts',
  'src/app/api/documentos/download/route.ts',
  'src/app/api/upload/route.ts',
  'src/app/(dashboard)/clientes/[id]/page.tsx',
  'src/app/(dashboard)/clientes/page.tsx',
  'src/app/(dashboard)/configuracoes/page.tsx',
  'src/app/(dashboard)/dashboard/page.tsx',
  'src/app/(dashboard)/perfil/page.tsx',
  'src/app/(dashboard)/projetos/page.tsx',
  'src/app/(dashboard)/usuarios/page.tsx'
];

files.forEach(f => {
  try {
    let content = fs.readFileSync(f, 'utf8');
    if (!content.includes('runtime = \'edge\'') && !content.includes('runtime = "edge"')) {
      fs.appendFileSync(f, '\nexport const runtime = \'edge\';\n');
      console.log('Adicionado em: ' + f);
    } else {
      console.log('Ja possui: ' + f);
    }
  } catch (e) {
    console.error('Erro em: ' + f, e.message);
  }
});
