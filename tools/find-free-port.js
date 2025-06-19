const net = require('net');

/**
 * Encontra uma porta livre a partir de uma porta base
 * @param {number} startPort - Porta inicial para verificar
 * @param {number} maxPort - Porta máxima para verificar
 * @returns {Promise<number>} - Porta livre encontrada
 */
function findFreePort(startPort = 3001, maxPort = 3100) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    function tryPort(port) {
      if (port > maxPort) {
        reject(new Error(`Nenhuma porta livre encontrada entre ${startPort} e ${maxPort}`));
        return;
      }
      
      server.listen(port, () => {
        const freePort = server.address().port;
        server.close(() => {
          console.log(`✅ Porta livre encontrada: ${freePort}`);
          resolve(freePort);
        });
      });
      
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`❌ Porta ${port} está em uso, tentando ${port + 1}...`);
          server.removeAllListeners('error');
          tryPort(port + 1);
        } else {
          reject(err);
        }
      });
    }
    
    tryPort(startPort);
  });
}

/**
 * Verifica se uma porta específica está livre
 * @param {number} port - Porta a verificar
 * @returns {Promise<boolean>} - true se livre, false se ocupada
 */
function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.close(() => {
        resolve(true);
      });
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

// Função principal para diagnóstico
async function checkPorts() {
  console.log('🔍 VERIFICADOR DE PORTAS - SISTEMA PIZZARIA\n');
  
  const portsToCheck = [3001, 3002, 3003, 5173, 5174];
  
  console.log('📋 Status das portas:');
  for (const port of portsToCheck) {
    const isFree = await isPortFree(port);
    const status = isFree ? '✅ LIVRE' : '❌ OCUPADA';
    console.log(`  Porta ${port}: ${status}`);
  }
  
  console.log('\n🔍 Procurando porta livre para backend...');
  try {
    const freePort = await findFreePort(3001, 3010);
    console.log(`\n🎯 SOLUÇÃO: Use a porta ${freePort}`);
    console.log(`\n📝 Para usar esta porta, adicione ao seu .env:`);
    console.log(`PORT=${freePort}`);
    console.log(`\n🚀 Ou execute:`);
    console.log(`PORT=${freePort} npm run dev`);
  } catch (error) {
    console.error(`\n❌ Erro: ${error.message}`);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkPorts();
}

module.exports = { findFreePort, isPortFree };