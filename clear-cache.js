// Script para limpar cache do Vite e forçar rebuild

const fs = require('fs');
const path = require('path');

console.log('🧹 Limpando cache do Vite...\n');

// Diretórios a limpar
const dirsToClean = [
  'node_modules/.vite',
  'dist',
  '.parcel-cache' // caso use Parcel
];

dirsToClean.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`🗑️  Removendo ${dir}...`);
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`✅ ${dir} removido`);
  } else {
    console.log(`⏭️  ${dir} não existe, pulando...`);
  }
});

console.log('\n✅ Cache limpo! Execute "npm run dev" para reiniciar o servidor.');
console.log('\n💡 Dica: No browser, use Ctrl+Shift+R (ou Cmd+Shift+R no Mac) para forçar reload sem cache.');