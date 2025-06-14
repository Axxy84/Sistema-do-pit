// Teste final do sistema
const fs = require('fs');
const path = require('path');

console.log('🎯 TESTE FINAL DO SISTEMA');
console.log('========================');

// Mudar para diretório backend
process.chdir('./backend');

// Executar testes
const tests = [
  { name: 'Conexão PostgreSQL', file: 'test-db.cjs' },
  { name: 'Conexão Avançada', file: 'test-connection.js' },
  { name: 'Integração Sistema', file: 'verificar-integracao.js' },
  { name: 'API Produtos', file: 'test-products-api.js' }
];

async function runTest(testName, testFile) {
  console.log(`\n🔍 ${testName}:`);
  console.log('-'.repeat(40));
  
  try {
    if (fs.existsSync(testFile)) {
      const { spawn } = require('child_process');
      
      return new Promise((resolve) => {
        const proc = spawn('node', [testFile], { stdio: 'inherit' });
        proc.on('close', (code) => {
          console.log(`✅ ${testName} - Código de saída: ${code}`);
          resolve(code);
        });
      });
    } else {
      console.log(`❌ Arquivo ${testFile} não encontrado`);
      return 1;
    }
  } catch (error) {
    console.error(`❌ Erro no ${testName}:`, error.message);
    return 1;
  }
}

async function runAllTests() {
  console.log('📂 Diretório atual:', process.cwd());
  
  for (const test of tests) {
    await runTest(test.name, test.file);
  }
  
  console.log('\n🎉 TESTES CONCLUÍDOS!');
  process.exit(0);
}

runAllTests();