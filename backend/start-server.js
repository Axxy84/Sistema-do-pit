const net = require('net');
const { spawn } = require('child_process');
require('dotenv').config();

/**
 * Encontra uma porta livre automaticamente
 */
function findFreePort(startPort = 3001, maxPort = 3010) {
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
          resolve(freePort);
        });
      });
      
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
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
 * Mata processos na porta especificada
 */
function killPortProcesses(port) {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    
    exec(`lsof -ti:${port}`, (error, stdout) => {
      if (error || !stdout.trim()) {
        resolve(); // Nenhum processo na porta
        return;
      }
      
      const pids = stdout.trim().split('\n');
      let killed = 0;
      
      pids.forEach(pid => {
        exec(`kill -9 ${pid}`, () => {
          killed++;
          if (killed === pids.length) {
            console.log(`🔪 Processos encerrados na porta ${port}`);
            setTimeout(resolve, 1000); // Aguardar liberação
          }
        });
      });
    });
  });
}

async function startServer() {
  console.log('🚀 INICIADOR INTELIGENTE DO SERVIDOR PIZZARIA\n');
  
  const preferredPort = parseInt(process.env.PORT) || 3001;
  
  try {
    // Verificar se porta preferida está livre
    const server = net.createServer();
    
    server.listen(preferredPort, () => {
      server.close(() => {
        console.log(`✅ Porta ${preferredPort} está livre`);
        startNodeServer(preferredPort);
      });
    });
    
    server.on('error', async (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️  Porta ${preferredPort} está ocupada`);
        
        // Opção 1: Tentar matar processos na porta
        console.log('🔄 Tentando liberar porta...');
        await killPortProcesses(preferredPort);
        
        // Verificar se foi liberada
        try {
          const testServer = net.createServer();
          testServer.listen(preferredPort, () => {
            testServer.close(() => {
              console.log(`✅ Porta ${preferredPort} liberada com sucesso`);
              startNodeServer(preferredPort);
            });
          });
          
          testServer.on('error', async () => {
            // Opção 2: Buscar porta alternativa
            console.log('🔍 Buscando porta alternativa...');
            const freePort = await findFreePort(preferredPort + 1, preferredPort + 10);
            console.log(`✅ Porta alternativa encontrada: ${freePort}`);
            startNodeServer(freePort);
          });
          
        } catch (error) {
          console.error('❌ Erro ao verificar porta:', error.message);
        }
      } else {
        console.error('❌ Erro ao verificar porta:', err.message);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

function startNodeServer(port) {
  console.log(`🎯 Iniciando servidor na porta ${port}...\n`);
  
  // Definir variável de ambiente para o servidor
  const env = { ...process.env, PORT: port.toString() };
  
  // Iniciar servidor Node.js
  const serverProcess = spawn('node', ['server.js'], {
    env: env,
    stdio: 'inherit',
    cwd: __dirname
  });
  
  serverProcess.on('error', (error) => {
    console.error('❌ Erro ao iniciar servidor:', error.message);
  });
  
  serverProcess.on('exit', (code) => {
    console.log(`\n🔚 Servidor encerrado com código: ${code}`);
  });
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando servidor...');
    serverProcess.kill('SIGTERM');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 SIGTERM recebido, encerrando...');
    serverProcess.kill('SIGTERM');
    process.exit(0);
  });
}

// Executar
startServer();