const fs = require('fs');
const path = require('path');

// Criar SVG básico para ícone (512x512)
const iconSVG = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#d32f2f"/>
  <circle cx="256" cy="200" r="80" fill="white"/>
  <rect x="176" y="300" width="160" height="100" rx="20" fill="white"/>
  <text x="256" y="450" text-anchor="middle" fill="white" font-family="Arial" font-size="32" font-weight="bold">ENTREGADOR</text>
</svg>`;

// Criar SVG para splash screen (1080x1920)
const splashSVG = `
<svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="1920" fill="#d32f2f"/>
  <circle cx="540" cy="800" r="120" fill="white"/>
  <rect x="420" y="960" width="240" height="150" rx="30" fill="white"/>
  <text x="540" y="1200" text-anchor="middle" fill="white" font-family="Arial" font-size="48" font-weight="bold">SISTEMA DO PIT</text>
  <text x="540" y="1280" text-anchor="middle" fill="white" font-family="Arial" font-size="32">App do Entregador</text>
</svg>`;

// Função para converter SVG para base64 PNG (simulado)
function createPNGFromSVG(svgContent, filename) {
  // Para um projeto real, usaríamos uma biblioteca como sharp ou canvas
  // Aqui vamos criar arquivos SVG temporários que o Expo pode usar
  const svgPath = path.join(__dirname, 'assets', filename.replace('.png', '.svg'));
  fs.writeFileSync(svgPath, svgContent);
  
  // Criar um arquivo PNG dummy (1x1 pixel transparente) para evitar erros
  const pngData = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64'
  );
  
  const pngPath = path.join(__dirname, 'assets', filename);
  fs.writeFileSync(pngPath, pngData);
  
  console.log(`✅ Criado: ${filename}`);
}

// Criar diretório assets se não existir
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Criar arquivos básicos
console.log('🎨 Criando assets básicos para o app...');

createPNGFromSVG(iconSVG, 'icon.png');
createPNGFromSVG(iconSVG, 'adaptive-icon.png');
createPNGFromSVG(splashSVG, 'splash.png');
createPNGFromSVG(iconSVG, 'favicon.png');

console.log('✅ Assets básicos criados com sucesso!');
console.log('📝 Arquivos criados:');
console.log('   - assets/icon.png (ícone do app)');
console.log('   - assets/adaptive-icon.png (ícone adaptativo Android)');
console.log('   - assets/splash.png (tela de carregamento)');
console.log('   - assets/favicon.png (ícone web)');
console.log('\n🚀 Agora o Expo deve rodar sem erros de assets!');